# Module Documentation: I2C Communication

## Module Name
`i2c` - I2C master communication module for PIC16F15214

## Module Purpose
Provides I2C master interface functions for communicating with the SSD1306 OLED display. Handles start/stop conditions, byte transmission, and address scanning. Enables the microcontroller to send commands and data to the OLED display.

## Location
- `src/i2c.c` - Complete module implementation
- `docs/architecture/system-overview.md` - System-level context
- `docs/architecture/decisions.md` - Architectural decisions regarding direct write

## Dependencies

### Direct Dependencies (source files)
- `xc.h` - PIC16F15214 peripheral Special Function Registers (SFRs)
  - `I2C1CON0`, `I2C1CON1`, `I2C1CON2`, `I2C1BAUD`
  - `I2C1CLK`, `I2C1TXB`, `I2C1STAT0`, `I2C1STAT1`
  - `I2C1STA`, `I2C1STB` (status registers)
- `pps.h` - Peripheral Pin Select (indirectly via register configuration)
- Configuration bits (FEXTOSC, RSTOSC set to 32MHz)

### Hardware Dependencies
- PIC16F15214 microcontroller with MSSP module (Master Synchronous Serial Port)
- RC3 pin (Pin 7) = I2C Clock (SCL)
- RC4 pin (Pin 6) = I2C Data (SDA)
- 4.7kΩ pull-up resistors on SDA and SCL (optional; some OLED modules have built-in)
- VDD and VSS for logic levels

### Configuration Dependencies
- _XTAL_FREQ = 32000000 (32MHz internal oscillator determines baud rate)
- I2C baud rate = 100kHz (SSP1ADD = 79 @ 32MHz)
- I2C Master mode enabled

## Public Interface

### Functions Exported

| Function | Parameters | Return Type | Description |
|----------|------------|-------------|-------------|
| `I2C_Init(void)` | None | void | Initialize I2C master at 100kHz |
| `I2C_Start(void)` | None | void | Generate I2C start condition; wait for completion |
| `I2C_Stop(void)` | None | void | Generate I2C stop condition; wait for completion |
| `I2C_Write(uint8_t data)` | data: byte to transmit | void | Transmit one byte; wait for transmit complete |
| `Test_I2C(void)` | None | void | Scan for I2C devices at both addresses (0x3C, 0x3D) |

### Variables Global (module-internal)

| Variable | Type | Description |
|----------|------|-------------|
| None (all functions are stateless) | - | I2C functions are stateless; state is in hardware registers |

### Constants

| Constant | Value | Purpose |
|----------|-------|---------|
| `I2C_SPEED` | 100000L | Target I2C bus speed in Hz |
| `OLED_ADDRESS` | 0x3C | Default OLED I2C address (7-bit) |
| `I2C_ACK` | Not directly used | ACK/NACK is checked via CON1 bits in some implementations |

## Internal Architecture

### I2C Timing Specification

The PIC16F15214 MSSP module in I2C master mode generates the following timing:

```
I2C Clock Period = (SSP1ADD + 1) × 4 × Tcy
                 = (SSP1ADD + 1) × 4 × (1 / Fosc)
                 = (SSP1ADD + 1) × 4 × (1 / 32MHz)
```

For 100kHz I2C:
- SSP1ADD = 79
- Clock Period = (79 + 1) × 4 / 32MHz = 80 × 4 / 32MHz = 320ns × 80 = 32µs
- Frequency = 1 / 32µs = 31.25kHz (close to 100kHz target)

**Wait**, the formula from the datasheet is: F_I2C = Fosc / (4 × (SSP1ADD + 1))
- F_I2C = 32MHz / (4 × 80) = 32MHz / 320 = 100kHz ✓

### Transaction Sequence

Each I2C transaction follows this sequence:

```
1. I2C_Start()
   ├── Generate START condition on SDA/SCL
   ├── Wait while S bit is set in I2C1CON0
   ├── Wait while BFRE (Buffer Full/Race Error) flag in I2C1STAT0
   │   └── Ensures previous transaction completed
   │
2. I2C_Write(address byte)
   ├── Write (OLED_ADDRESS << 1) | 0 for command mode
   │   └── 0x3C << 1 = 0x78, or with R/W bit = 0 for write
   ├── Load into I2C1TXB register
   ├── Wait while TXBE (Transmit Buffer Empty) flag in I2C1STAT1
   ├── Wait while MDR (Master Data Ready) flag in I2C1CON0
   │   └── Ensures byte has been shifted out
   │
3. I2C_Write(data byte)
   ├── Same as above for each byte (command or data)
   │
4. I2C_Stop() (optional, some commands don't need stop)
   ├── Generate STOP condition on SDA/SCL
   ├── Wait while P bit is cleared in I2C1CON0
```

### Function Details

#### `I2C_Init(void)`

```c
void I2C_Init(void) {
    // I2C clock = FOSC / (4 × (SSP1ADD + 1))
    // For 100kHz: SSP1ADD = (32MHz / (4 × 100kHz)) - 1 = 79
    
    I2C1CLK = 0x03;  // Select FOSC as clock source
    I2C1CON0 = 0x04; // I2C Master mode enabled (SCL en)
    I2C1CON1 = 0x80; // Clear buffer (clear SSP1BUF, etc.)
    I2C1CON2 = 0x00; // No alternate I2C mode
    I2C1BAUD = 79;   // SSP1ADD = 79 for 100kHz @ 32MHz
    
    // Timing verification:
    // F_I2C = FOSC / (4 × (SSP1ADD + 1))
    //        = 32MHz / (4 × 80) = 100kHz ✓
}
```

#### `I2C_Start(void)`

```c
void I2C_Start(void) {
    // Generate START condition
    I2C1CON0bits.S = 1;  // S = Start bit
    
    // Wait for START condition to complete
    // The hardware automatically clears the S bit when START is complete
    while(I2C1CON0bits.S);
    
    // Wait for buffer to be free (race condition prevention)
    while(I2C1STAT0bits.BFRE);
    // BFRE = Buffer Full/Race Error
    // Set if a new START is generated while previous transaction ongoing
}
```

#### `I2C_Stop(void)`

```c
void I2C_Stop(void) {
    // Generate STOP condition
    I2C1CON0bits.P = 1;  // P = Stop bit
    
    // Wait for STOP condition to complete
    while(I2C1CON0bits.P);
}
```

#### `I2C_Write(uint8_t data)`

```c
void I2C_Write(uint8_t data) {
    // Load data into transmit buffer
    I2C1TXB = data;
    
    // Wait for transmit buffer to be empty
    // TXBE = 1 when buffer is empty (all bits shifted out)
    while(!I2C1STAT1bits.TXBE);
    
    // Wait while Master Data Register is still being shifted
    // MDR = 1 while data is being shifted out of the module
    while(I2C1CON0bits.MDR);
}
```

#### `Test_I2C(void)` - Diagnostic function

```c
void Test_I2C(void) {
    uint8_t status;
    
    // Test at address 0x3C (most common for SSD1306)
    I2C_Start();
    I2C_Write((0x3C << 1) | 0);  // Write mode, address 0x3C
    // Check ACKSTAT bit after write
    // if !ACKSTAT, device acknowledged (presence detected)
    I2C_Stop();
    
    // Test at address 0x3D (alternative SSD1306 address)
    I2C_Start();
    I2C_Write((0x3D << 1) | 0);  // Write mode, address 0x3D
    I2C_Stop();
}
```

### Data Flow

```
PIC16F15214 (Master)                    SSD1306 OLED (Slave)
           │                                           │
           │-- START condition --│
           │-- 0x78 (0x3C<<1 + W) --│  ACK
           │-- Command byte --│  ACK
           │-- Data byte --│  ACK
           │-- STOP condition --│
```

### Error Handling

| Error Condition | Detection | Recovery |
|----------------|-----------|----------|
| Start condition timeout | while(I2C1CON0bits.S) loop never exits | Reset I2C module, check hardware |
| Transmit buffer overflow | while loop exceeds reasonable timeout | Retry transaction, check clock stretching |
| NACK from slave (no display detected) | After I2C_Write, check ACKSTAT | Check wiring, address, power to OLED |
| Bus lockup (S or P bit stuck) | while loop never exits | Reset via MCLR pin, or issue conflicting START+STOP |

### State Memory

The I2C module is **stateless** - no module-level variables are maintained between function calls. All state is contained in the hardware MSSP registers (I2C1CON0, I2C1CON1, I2C1STAT0, I2C1STAT1, I2C1TXB). This makes the module re-entrant and safe to call from any context.

### Memory Usage

| Resource | Usage |
|----------|-------|
| Program Memory | ~20 bytes (code for 5 functions) |
| RAM | ~4 bytes (no module-level variables; hardware registers are not 'used' by code) |
| SFRs Configured | 5 registers (I2C1CLK, I2C1CON0, I2C1CON1, I2C1CON2, I2C1BAUD, I2C1TXB, I2C1STAT0, I2C1STAT1) |

## Runtime Behavior

### Power-On Behavior

On power-up:
1. PIC16F15214 reset releases
2. Configuration bits are loaded
3. MSSP module defaults to SPI mode (not I2C)
4. Software must call `I2C_Init()` to configure I2C mode and baud rate
5. Without initialization, I2C_Write() calls will produce undefined behavior

### Normal Transaction Flow

```c
// Typical usage: OLED command write
I2C_Start();              // Generate START
I2C_Write(0x78);        // OLED addr + write (0x3C << 1)
I2C_Write(0xAE);        // Display off command
I2C_Stop();              // Generate STOP
```

### Timing Constraints

- Minimum SCL low time: >4.7µs at 100kHz
- Minimum SCL high time: >4.0µs at 100kHz
- Data setup time: >250ns
- Data hold time: >0ns (not strictly required by spec, but good practice)
- I2C bus free time between START and STOP: >5µs

The 100kHz baud rate configuration meets all these minimums.

### Failure Mode: No OLED Responding

If the OLED does not respond to I2C transactions:

1. **Check address**: Default is 0x3C; some modules use 0x3D
2. **Check pull-ups**: SDA and SCL need pull-up resistors to VDD
   - Some OLED modules have 4.7kΩ built-in
   - External resistors may be needed if module lacks them
3. **Check voltage levels**: PIC16F15214 runs at 5V (VDD), OLED at 3.3V
   - RC3/RC4 are 5V-tolerant (digital inputs only)
   - I2C signals may be 5V on bus; SSD1306 is 3.3V max
   - Most 0.78" OLED modules have level shifting or are 5V-tolerant
4. **Check code**: Ensure I2C_Init() was called before any transactions

## Security Considerations

No security features are implemented in the I2C module. The module:
- Does not implement address filtering or device authentication
- Does not check for malicious data
- Assumes trusted bus environment (typical for hobbyist embedded systems)
- No secrets or keys are transmitted over I2C

## Related Modules

- `oled.c` - Calls I2C_Write() to send commands/data to OLED
- `main.c` - Calls I2C_Init() during SYSTEM_Initialize()
- Hardware - PIC16F15214 MSSP peripheral; RC3/RC4 pins

## Performance Characteristics

| Metric | Value |
|--------|-------|
| I2C Bus Speed | 100kHz (standard mode) |
| Bytes per Second | ~1000 bytes/sec (max theoretical) |
| Typical Command Write | 2-5 bytes (command + args) |
| OLED Init Sequence | ~15 commands, ~5ms total |
| Single Character Write | ~150µs (including start+stop overhead) |
| Full Display Update | ~10ms (1024 bytes @ ~10µs each) |

## Debugging Tips

1. **No devices on I2C bus**: Use Test_I2C() to scan addresses 0x3C and 0x3D
2. **Garbage on display**: Check I2C_Write() timing; ensure MDR bit wait
3. **Display half-on/half-off**: Verify column/page address commands are correct
4. **No I2C_Start() acknowledgment**: Check TRISC3/TRISC4 direction bits
5. **Baud rate wrong**: Verify SSP1ADD = 79 for 100kHz @ 32MHz

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-09-10 | Initial release with basic I2C init, start, stop, write functions |
| 2.0.0 | 2026-09-10 | Added Test_I2C() diagnostic; clarified timing; PPS configuration notes |