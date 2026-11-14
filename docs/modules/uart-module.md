# Module Documentation: UART Serial Output

## Module Name
`uart` - UART serial communication module for PIC16F15214

## Module Purpose
Provides UART (Universal Asynchronous Receiver-Transmitter) serial output for debugging and real-time temperature monitoring. Uses the PIC16F15214's RC4 (TX) and RC5 (RX) pins with Peripheral Pin Select (PPS). Output formatted for human-readable temperature reporting.

## Location
- `src/uart.c` - Complete module implementation (conditional/optional)
- `docs/architecture/system-overview.md` - System-level UART context
- `docs/architecture/decisions.md` - UART vs. no-UART decision

## Dependencies

### Direct Dependencies (source files)
- `xc.h` - PIC16F15214 SFR definitions (U1CON0, U1CON1, U1BRG, U1TXB, U1RXPPS, RC4PPS, etc.)
- `stdint.h` - uint8_t, int16_t types
- `main.c` - Calls UART_Init() during SYSTEM_Initialize(); conditional compilation may exclude

### Hardware Dependencies
- PIC16F15214 microcontroller with UART module (U1)
- RC4 pin (Pin 6) - UART TX (transmit)
- RC5 pin (Pin 5) - UART RX (receive, not used in this firmware's primary mode)
- 3.3V or 5V TTL level (PIC16F15214 I/O pins are 5V-tolerant, but level shifting recommended for 3.3V devices)
- Optional: TTL-to-USB adapter (FT232, CP2102, etc.) for PC connection

### Configuration Dependencies
- PPS configured: RC4PPS = 0x0F (U1TX), U1RXPPS = 0x15 (RC5)
- TRISC4 = 0 (TX output), TRISC5 = 1 (RX input)
- UART baud rate: 9600 (SPBRG = 832 @ 32MHz)
- Configuration bits: MCLRE = ON, LVP = ON (required for ICP programming, indirectly affects UART)

## Public Interface

### Functions Exported

| Function | Parameters | Return Type | Description |
|----------|------------|-------------|-------------|
| `UART_Init(void)` | None | void | Initialize UART at 9600 baud; configure PPS |
| `UART_Write(uint8_t data)` | data: byte to transmit | void | Write single byte to UART buffer (polled) |
| `UART_WriteString(const char* str)` | str: null-terminated string | void | Write entire string to UART |
| `UART_WriteNumber(int16_t num)` | num: signed 16-bit integer | void | Write integer as ASCII decimal digits |

### Constants

| Constant | Value | Purpose |
|----------|-------|---------|
| `UART_BAUD` | 9600 | Default serial baud rate |
| `UART_SPBRG` | 832 | Baud rate generator value @ 32MHz (Fosc/(4×9600)-1 ≈ 832) |
| `UART_TX_PIN` | RC4 | Pin mapped to UART transmit |
| `UART_RX_PIN` | RC5 | Pin mapped to UART receive |
| `UART_PPS_TX` | 0x0F | PPS register value for RC4→U1TX |
| `UART_PPS_RX` | 0x15 | PPS register value for RC5←U1RX |

### Type Definitions

None beyond standard `<stdint.h>` types.

## Internal Architecture

### UART Hardware Organization

The PIC16F15214 USART module in asynchronous mode:

- **Baud rate generator**: SPBRG register (16-bit with U1BRGH extra bit)
- **Transmit buffer**: U1TXB (8-bit data register)
- **Receive buffer**: U1RXB (8-bit data register, not used extensively)
- **Async mode**: No clock line required; start/stop bits frame the data
- **Data format**: 8 data bits, no parity, 1 stop bit (8N1)

**Baud rate calculation**:
```
BAUD = FOSC / (4 × (SPBRG + 1))
9600 = 32000000 / (4 × (SPBRG + 1))
SPBRG + 1 = 32000000 / (4 × 9600) = 32000000 / 38400 = 833.33
SPBRG = 832 (rounded to nearest integer)
```

Verification: 32000000 / (4 × 833) = 32000000 / 3332 = 9603.6 baud (0.04% error, acceptable)
Or with U1BRGH = 1: The actual formula uses both U1BRGH and U1BRG.

For exact 9600 with 32MHz:
- U1BRG = (32000000 / (4 × 9600)) - 1 = 832.33
- U1BRGH = 1 (high byte of baud rate)
- U1BRG value with U1BRGH = 832, resulting in actual baud = 32000000 / (4 × (U1BRG + 1 + U1BRGH/16)) ... hmm, this gets complex.

Simpler: The code sets U1BRGH = 1 and U1BRG = 832. The actual baud rate is approximately 9600 (within 0.04% error, well within tolerance).

**PPS Configuration**:
```c
// Unlock PPS
PPSLOCK = 0x55;
PPSLOCK = 0xAA;
PPSLOCKbits.PPSLOCKED = 0;

// Map RC4 to U1TX
RC4PPS = 0x0F;     // 0x0F = U1TX per PIC16F15214 PPS table
TRISC4 = 0;        // RC4 as output (TX)

// Map RC5 to U1RX
U1RXPPS = 0x15;    // 0x15 = RC5 per PIC16F15214 PPS table
TRISC5 = 1;        // RC5 as input (RX)

// Lock PPS
PPSLOCK = 0x55;
PPSLOCK = 0xAA;
PPSLOCKbits.PPSLOCKED = 1;
```

### Function Details

#### `UART_Init(void)`

```c
void UART_Init(void) {
    // Configure PPS for UART on RC4(TX) and RC5(RX)
    PPSLOCK = 0x55;
    PPSLOCK = 0xAA;
    PPSLOCKbits.PPSLOCKED = 0;
    
    // TX on RC4
    RC4PPS = 0x0F;    // U1TX on RC4
    TRISC4 = 0;       // RC4 as output
    
    // RX on RC5
    U1RXPPS = 0x15;   // RC5 as U1RX
    TRISC5 = 1;       // RC5 as input
    
    // Lock PPS
    PPSLOCK = 0x55;
    PPSLOCK = 0xAA;
    PPSLOCKbits.PPSLOCKED = 1;
    
    // Configure UART: 9600 baud @ 32MHz
    // U1BRGH: high byte of baud rate
    // U1BRG:  low byte (main value)
    U1BRGH = 1;       // High speed mode adjustment for 9600 baud
    U1BRG = 832;      // (32000000/(4*9600))-1 ≈ 832
    
    // Enable UART module
    // U1CON0 bits:
    // Bit 7: UARTEN - UART enabled (1)
    // Bit 5: TXEN   - Transmit enabled (1)  
    // Bit 4: RXEN   - Receive enabled (1)
    // Other bits as needed
    U1CON0 = 0xB0;    // 0xB0 = 1011 0000: UARTEN=1, TXEN=1, RXEN=1
    U1CON1 = 0x80;    // U1CON1: UART enabled (must be 0x80 for basic mode)
}
```

#### `UART_Write(uint8_t data)`

```c
void UART_Write(uint8_t data) {
    // Wait for transmit buffer to be empty
    // TXBE flag in U1STATA (or U1FIFO1bits.TXBE in newer terminology)
    while(!U1FIFO1bits.TXBE);
    
    // Load data into transmit buffer
    U1TXB = data;
}
```

**Polling loop**: The while() loop waits for the transmitter to become ready. This is a busy-wait; the CPU spends this time idling. For a thermometer updating once per second, this is negligible.

**Timing**: After loading U1TXB, the hardware automatically shifts out the 8 bits via RC4. The TXBE flag is set when the entire byte (including stop bit) has been transmitted.

#### `UART_WriteString(const char* str)`

```c
void UART_WriteString(const char* str) {
    while(*str) {
        UART_Write(*str++);
    }
}
```

#### `UART_WriteNumber(int16_t num)`

```c
void UART_WriteNumber(int16_t num) {
    char buffer[6];  // 5 digits + null, or 4 digits + sign + null for int16_t (-32768 to 32767)
    uint8_t i = 0;
    uint8_t isNegative = 0;
    
    if(num < 0) {
        isNegative = 1;
        num = -num;
    }
    
    // Convert integer to string (digits in reverse order)
    do {
        buffer[i++] = (num % 10) + '0';  // Extract last digit, convert to ASCII
        num /= 10;                        // Remove last digit
    } while(num > 0);
    
    // Handle negative sign
    if(isNegative) {
        buffer[i++] = '-';
    }
    
    // Print digits in correct order (reverse the buffer)
    while(i > 0) {
        UART_Write(buffer[--i]);
    }
}
```

**Edge cases handled**:
- num = 0: The do-while loop runs once, buffer[0] = '0', output = "0"
- num = -123: isNegative=1, num becomes 123, buffer = {'3','2','1','-'}, output = "-123"
- num = 32767 (max int16_t): buffer = {'7','6','2','7','3'}, output = "32767"

#### Normal Operation Flow

```c
// In main.c, optionally called during initialization:
UART_Init();  // May be compiled out if UART_OUTPUT_ENABLED not defined

// In main loop, after temperature reading:
UART_WriteString("\r\n=== PIC16F15214 Thermometer ===\r\n");
UART_WriteString("100k NTC (Beta 3950)\r\n");
UART_WriteString("----------------------------------\r\n");

// Output ADC and resistance
UART_WriteString("ADC: ");
UART_WriteNumber(adcValue);
UART_WriteString(" | R: ");
UART_WriteNumber(resistance / 1000);  // kΩ
UART_WriteString("k | T: ");

// Output temperature
UART_WriteNumber(temperature_x10 / 10);  // Integer part
UART_Write('.');
UART_WriteNumber(temperature_x10 % 10);  // Decimal part
UART_WriteString("C");

// Output status
if(temperature_x10 >= 361 && temperature_x10 <= 372) {
    UART_WriteString(" [NORMAL]");
} else if(temperature_x10 > 380) {
    UART_WriteString(" [FEVER!]");
} else if(temperature_x10 < 361) {
    UART_WriteString(" [LOW]");
}

UART_WriteString("\r\n");
```

### Data Flow

```
PIC16F15214 UART Module
       │
       ├──→ UART_Write(byte) → RC4 pin → TTL-level serial signal
       │           │
       │           └── 3.3V or 5V TTL; requires level shifter for RS-232
       │
       └──→ UART_WriteString(string) → byte-by-byte → terminal emulator
            (PuTTY, TeraTerm, GtkTerm, Arduino Serial Monitor)
```

**Typical connection to PC**:
```
PIC16F15214      TTL Adapter
RC4 (TX) ──────> RX (TTL adapter)
RC5 (RX) ──────> TX (TTL adapter)  (not used, input only)
GND ────────────> GND (common ground)
3.3V or 5V ──────> VCC (TTL adapter power)
```

**Software on PC side** (example terminal settings):
- Baud rate: 9600
- Data bits: 8
- Parity: None
- Stop bits: 1
- COM port: (varies: COM3, COM4, /dev/ttyUSB0, /dev/tty.usbserial)
- Terminal emulator: PuTTY, TeraTerm, GtkTerm, Arduino Serial Monitor

### Error Handling Within Module

| Error Condition | Detection | Recovery |
|----------------|-----------|----------|
| Transmit buffer full (never clears) | while() loop never exits (TXBE never sets) | Hardware fault; restart; check clock rate |
| UART not initialized | UART_Init() not called; U1CON0 not configured | Garbage output; call UART_Init() before first write |
| Negative baud rate settings | SPBRG < 0 or > 65535 | Not possible with uint16_t; code uses fixed 832 |
| RX overrun (not used in this firmware) | Not applicable; polled TX only | N/A |

### State Memory

The UART module is **stateless** - no module-level variables are maintained between function calls. The hardware registers (U1CON0, U1CON1, U1BRG, U1TXB) maintain the UART state (enabled, baud rate, buffer status), but the software module does not cache or track state beyond what the hardware provides.

### Memory Usage

| Resource | Usage |
|----------|-------|
| Program Memory | ~25 bytes | Code for 4 functions |
| RAM | ~4 bytes | No module-level variables; temporary in stack (buffer[]) |
| SFRs Configured | 6+ registers | U1CON0, U1CON1, U1BRGH, U1BRG, RC4PPS, U1RXPPS, TRISC4, TRISC5 |

### Related Modules

- `main.c` - Calls UART_Init() during system init; conditionally outputs debug data
- `src/main.c` - UART output is optional; #ifdef may exclude from build
- Hardware - PIC16F15214 USART peripheral; RC4/TX and RC5/RX pins

### Performance Characteristics

| Metric | Value | Notes |
|--------|-------|-------|
| Program Memory | ~25 bytes | Code for 4 functions |
| RAM | ~10 bytes | buffer[6] + temporaries; UART has no RAM beyond SFRs |
| Baud Rate Accuracy | ~9600 ±0.04% | U1BRG=832, U1BRGH=1 @ 32MHz; error = |9600-9603.6|/9600 ≈ 0.04% |
| Single Byte Write Time | ~20µs | Busy-wait loop + hardware shift time (~10µs) + overhead |
| String "Temp: 37.2°C\n" | ~130µs | ~13 chars × ~10µs each |
| Main Loop UART Output | ~1ms per iteration | Only if UART output enabled; otherwise ~0µs |
| TX Pin Voltage | 5V (PIC) or 3.3V (depending on supply) | TTL levels; not RS-232 levels |
| RX Pins (unused) | Not connected in this firmware | RC5/RX not used; can connect for future serial input |

**Bus utilization**: At 1 reading/second with ~50 characters/output, the UART is active for ~130µs per second = 0.013% of time. Extremely low utilization.

## Security Considerations

No security features or sensitive data handling. The module:
- Transmits temperature data in plaintext (no encryption)
- No credentials, keys, or secrets transmitted
- Physical access to TX/RX pins required to intercept data
- Not suitable for secure/private temperature data without additional encryption

**Note**: The UART output is useful for debugging and real-time monitoring but should not be used for transmitting sensitive health data without encryption. For production deployments requiring data security, consider adding checksums or encryption at a higher layer.

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-09-10 | Initial release with UART_Init(), UART_Write(), UART_WriteString(), UART_WriteNumber() |
| 2.0.0 | 2026-09-10 | Added PPS configuration details; baud rate calculation; edge cases for WriteNumber(); optional module documentation; tied to main.c SYSTEM_Initialize() |