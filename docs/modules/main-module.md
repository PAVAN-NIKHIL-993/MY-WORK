# Module Documentation: Main Application

## Module Name
`main` - Primary application module for PIC16F15214 NTC Thermometer

## Module Purpose
Entry point and main program loop for the thermometer firmware. Orchestrates ADC temperature readings, temperature calculation, and OLED display updates. Coordinates all peripheral initialization and manages the main application flow.

## Location
- `src/main.c` - Complete module implementation
- `docs/architecture/system-overview.md` - High-level architecture
- `docs/architecture/decisions.md` - Key architectural decisions

## Dependencies

### Direct Dependencies (source files)
- `src/i2c.c` - I2C communication to OLED display
- `src/oled.c` - OLED display driver functions
- `src/adc.c` - ADC temperature sensing and resistance calculation
- `src/thermometer.c` - Temperature lookup and interpolation
- `src/uart.c` - Optional UART output (conditional)
- `xc.h` - PIC16F15214 peripheral definitions
- `stdint.h` - Fixed-width integer types
- `string.h` - String operations (memcpy, etc.)

### Indirect Dependencies (hardware)
- PIC16F15214 microcontroller
- 0.78" I2C SSD1306 OLED display
- 100kΩ NTC thermistor (Beta 3950)
- 100kΩ 0.1% precision resistor
- 0.1µF capacitor (ADC filtering)

### Configuration Dependencies
- Configuration bits (FEXTOSC, RSTOSC, WDTE, MCLRE, LVP, BOREN)
- _XTAL_FREQ = 32000000 (32MHz internal oscillator)
- I2C baud rate = 100kHz (derived from 32MHz clock)
- ADC clock = FOSC/64

## Public Interface

### Functions Exported (visible outside module)

| Function | Purpose | Parameters | Return Type |
|----------|---------|------------|-------------|
| `main(void)` | Application entry point, infinite loop | None | void |
| `SYSTEM_Initialize(void)` | Hardware peripheral initialization | None | void |
| `I2C_Init(void)` | I2C master interface initialization | None | void |
| `OLED_Init(void)` | OLED display initialization | None | void |
| `UART_Init(void)` | UART serial initialization | None | void |

### Variables Global (accessible across module)
| Variable | Type | Description |
|----------|------|-------------|
| `adcValue` | uint16_t | Raw ADC reading (0-1023) |
| `resistance` | uint32_t | Calculated NTC resistance in ohms |
| `temperature_x10` | int16_t | Temperature × 10 (e.g., 372 = 37.2°C) |
| `displayBuffer[1024]` | uint8_t[1024] | OLED frame buffer (128×64/8 pages) |
| `cursorX`, `cursorY` | uint8_t | Current cursor position for text output |
| `displayUpdateCounter` | uint8_t | Counter for periodic display updates |

### Constants
| Constant | Value | Purpose |
|----------|-------|---------|
| `SCREEN_WIDTH` | 128 | OLED display width in pixels |
| `SCREEN_HEIGHT` | 64 | OLED display height in pixels |
| `TABLE_SIZE` | 13 | Number of entries in temperature lookup table |
| `SAMPLES` | 16 | Number of ADC samples for averaging |
| `SERIES_RESISTOR` | 100000L | Series resistor value in ohms (100kΩ) |

## Internal Architecture

### Main Loop State Machine

The main loop operates as a cooperative state machine with two states:

```
+---------------------+
|      MAIN LOOP      |
+----------+----------+
           |
           v
+---------------------+       +---------------------+
|  UPDATE STATE       |       |  DISPLAY STATE      |
|  (every 2 seconds)  |------>|  (every loop iteration)|
+---------------------+       +---------------------+
         │                             │
         │ 1. Read ADC               │ 1. Clear display
         │ 2. Calculate resistance   │ 2. Draw title
         │ 3. Lookup temperature   │ 3. Draw temperature
         │    (interpolate)          │ 4. Draw bar gauge
         └─────────────────────────┘ 5. Draw status text
                                                6. Display update
                                                7. Delay 500ms
```

### Initialization Sequence

```c
void main(void) {
    // 1. Initialize all hardware peripherals
    SYSTEM_Initialize();   // Pin config, ADC, oscillator
    I2C_Init();            // I2C master at 100kHz
    OLED_Init();           // SSD1306 init sequence (15+ commands)
    UART_Init();           // Optional: 9600 baud on RC4/RX5
    
    // 2. Show splash screen
    OLED_Clear();
    OLED_SetCursor(10, 0);
    OLED_WriteString("PIC THERMOMETER");
    OLED_SetCursor(5, 2);
    OLED_WriteString("NTC Version 2.0");
    OLED_SetCursor(20, 4);
    OLED_WriteString("Starting...");
    OLED_Display();
    __delay_ms(2000);
    
    // 3. Enter main loop
    while(1) {
        // Periodic temperature reading (every 2 loops ≈ 2 seconds)
        displayUpdateCounter++;
        if(displayUpdateCounter >= 2) {
            displayUpdateCounter = 0;
            
            // Read and process temperature
            adcValue = ADC_ReadAveraged(ADC_CHANNEL, SAMPLES);
            resistance = Calculate_Resistance(adcValue);
            temperature_x10 = Lookup_Temperature(resistance);
        }
        
        // Always update display
        update_display();
        __delay_ms(500); // 500ms coarser delay
    }
}
```

### Data Flow Within Module

```
ADC Reading
    │
    ├──→ ADC_ReadAveraged() → sum>>4 → adcValue
    │        │
    │        └── 16 samples, 100µs each = 1.6ms total
    │              │
    │              └── Noise reduction: ~12dB improvement
    │
    └──→ Calculate_Resistance(adcValue)
            │
            ├──→ R = 100kΩ × (ADC / (1023 - ADC))
            │        │
            │        └── 32-bit math: numerator = 100000L × adc
            │              denominator = 1023 - adc
            │              result = numerator / denominator
            │
            └──→ resistance (ohms)
                 │
                 ├──→ Lookup_Temperature(resistance)
                 │     │
                 │     ├── Binary search through tempTable[]
                 │     ├── Interpolate between entries
                 │     └── Return temperature_x10
                 │
                 └───→ Used by main loop for display
                      │
                      ├──→ OLED_WriteNumber(temp_int/10)
                      ├──→ OLED_WriteChar('.')
                      ├──→ OLED_WriteNumber(temp_dec)
                      ├──→ OLED_WriteChar('C')
                      ├──→ OLED_DrawThermometer(temperature_x10)
                      ├──→ Status text: NORMAL/LOW/FEVER
                      └──→ UART output (optional)
```

### Error Handling Within Module

| Error Condition | Handling | User Visible Effect |
|----------------|----------|---------------------|
| ADC read fails (GO bit stuck) | Returns last valid value; loop continues | Display shows last known temperature |
| Resistance = 0 (adc >= 1023) | Lookup returns 10.0°C (table minimum) | Display shows ~10°C, unlikely but safe default |
| Temperature out of range (<10°C or >53°C) | Clamped to table minimum/maximum | Display shows 10.0°C or 53.0°C with status appropriate to clamped value |
| I2C communication failure | Display not updated; loop continues | Blank/undefined OLED display; user may need to check wiring |
| UART overflow (not implemented) | Not applicable; simple polled driver | No debug output during communication errors |

### State Memory

The module maintains the following state across loop iterations:

| State Variable | Type | Persistence | Purpose |
|----------------|------|-------------|---------|
| `displayUpdateCounter` | uint8_t | Loop iteration | Triggers periodic ADC reading (every 2nd iteration) |
| `adcValue` | uint16_t | Until next read | Last ADC reading (0-1023) |
| `resistance` | uint32_t | Until next read | Calculated NTC resistance in ohms |
| `temperature_x10` | int16_t | Until next read | Temperature in 0.1°C increments |
| `cursorX`, `cursorY` | uint8_t | Until next display reset | OLED cursor position for text output |

### Memory Usage Within Module

| Resource | Usage | Percentage of Device | Notes |
|----------|-------|----------------------|-------|
| RAM | ~150 bytes | 59% of 256 bytes | Includes display buffer (1024 bytes) is NOT counted separately - it's in RAM but the direct-write approach means only cursor position and buffer are needed; total with buffer = ~1174 bytes which exceeds 256! |
|  | **Actually**: ~120 bytes + 1024 buffer = **~1144 bytes** | **449% of 256 bytes** | **CRITICAL**: The displayBuffer is 1024 bytes but the direct-write approach writes directly to OLED, not through buffer. The `displayBuffer` array exists in code but the OLED_DrawPixel etc. functions actually write directly via I2C. |

**Correction**: The display buffer is maintained for the OLED_Display() function which pushes the buffer to the OLED. However, the flicker-minimizing approach updates only changed areas. The actual RAM calculation:

- displayBuffer[1024] = 1024 bytes
- Other variables: ~120 bytes
- Total: ~1144 bytes

**This exceeds the 256-byte RAM limit!** The code as written has a critical memory issue.

**Resolution**: The original firmware documentation claimed "no frame buffer" saves RAM, but the `displayBuffer[1024]` declaration does allocate 1024 bytes. The direct-write functions (OLED_DrawPixel, OLED_WriteChar) must actually write to the OLED via I2C immediately, not store in a buffer. The OLED_Display() function does push the buffer, but if we remove the buffer entirely and write directly during each render pass, we save the 1024 bytes.

**Actual RAM usage without buffer**: ~120 bytes ✅
**RAM RAM usage with buffer**: ~1144 bytes ❌

The implementation must ensure the buffer is either:
1. Removed entirely and OLED writes are truly direct (recommended)
2. Reduced to 128×32 = 512 bytes for 128×32 display
3. Used only for partial updates

For this project, the displayBuffer allocation must be removed or the display must be 128×32. The current code declares `uint8_t displayBuffer[1024]` but the OLED functions write directly via I2C in many cases. Need to reconcile this.

**Decision**: Remove the displayBuffer entirely and implement truly direct OLED writes. Each OLED_WriteChar/DrawPixel will write via I2C immediately. The OLED_Display() function will be simplified or removed. This saves 1024 bytes of RAM.

## Runtime Behavior

### Power-On Sequence

```text
1. PIC16F15214 powers up
2. Configuration bits are loaded (FEXTOSC=OFF, RSTOSC=HFINTOSC_32MHz, etc.)
3. Main program counter starts at 0x0000
4. SYSTEM_Initialize() runs:
   - Configure RA0 as analog input
   - Configure I2C pins (RC3=SCL, RC4=SDA)
   - Configure ADC module
   - Configure PPS for I2C and UART
   - Wait 10ms for ADC stabilization
5. I2C_Init() runs:
   - Set I2C baud rate to 100kHz
   - Enable I2C master mode
6. OLED_Init() runs:
   - Send 15+ SSD1306 initialization commands
   - Enable charge pump, set contrast
   - Turn display on at end
7. UART_Init() runs (optional):
   - Configure 9600 baud
   - Map RC4/TX and RC5/RX via PPS
8. Splash screen displayed for 2 seconds
9. Main loop begins
```

### Normal Operation Loop

```text
Every 500ms (coarse delay):
│
├── If displayUpdateCounter >= 2 (every 2 × 500ms = 1 second):
│    ├── adcValue = ADC_ReadAveraged(ADC_CHANNEL, 16)
│    │   ├── 16 readings × 100µs = 1.6ms total
│    │   └── Averaged via sum >> 4 (divide by 16)
│    ├── resistance = Calculate_Resistance(adcValue)
│    │   ├── R = 100kΩ × (adcValue / (1023 - adcValue))
│    │   └── 32-bit multiplication then division
│    ├── temperature_x10 = Lookup_Temperature(resistance)
│    │   ├── Binary search 13-entry table
│    │   ├── Interpolate if between entries
│    │   └── Return int16_t × 10
│    └── displayUpdateCounter = 0
│
├── OLED_Clear() → fill displayBuffer with 0x00
│   ├── Clear all 1024 pixels (or write direct clear)
│   └── Reset cursorX=0, cursorY=0
│
├── OLED_SetCursor(15, 0) → write "TEMPERATURE"
│   ├── Set cursorX=15, cursorY=0
│   └── Write 5×7 font characters
│
├── OLED_WriteNumber(temp_int) → write "37"
│   ├── Convert int to ASCII chars
│   └── Write via font5x7 lookup
│
├── OLED_WriteChar('.') → write "."
│   ├── Write decimal point glyph
│   └── Advance cursor
│
├── OLED_WriteNumber(temp_dec) → write "2"
│   └── Same as above
│
├── OLED_WriteChar(' ') → write " "
│   └── Single space character
│
├── OLED_WriteChar('C') → write "C"
│   └── Same as above
│
├── Status text based on temperature_x10:
│   ├── if 361 ≤ T ≤ 372: "NORMAL"
│   ├── if T > 380: "FEVER!" (with display invert)
│   ├── if T < 361: "LOW"
│   └── else: "ELEVATED"
│
├── OLED_WriteNumber(resistance/1000) → write "82"
│   └── Display kΩ value (e.g., 82k)
│
├── OLED_Display() → push buffer to OLED
│   ├── Set column/page addresses
│   │   ├── Column: 0→127 (128 pixels)
│   │   └── Page: 0→7 (64 pixels / 8 pages)
│   └── Stream 1024 bytes via I2C
│   └── Display updates on OLED
│
└── __delay_ms(500) → wait 0.5 seconds
```

### Interrupt Handling

The firmware does not use any peripheral interrupts. All timing is handled by the cooperative main loop with `__delay_ms()` calls. This simplifies the code and avoids ISR-related bugs but means the firmware cannot respond to external events in real-time.

**Timing Accuracy**: The `__delay_ms()` function uses the 32MHz oscillator and XC8's built-in delay. Accuracy is approximate (±10%) but sufficient for the 1-second update rate.

### Failure Modes

| Failure Mode | Symptoms | Recovery |
|--------------|----------|----------|
| NTC thermistor open circuit | Resistance → ∞, ADC → 0, temperature → 10.0°C (min) | Display shows ~10°C, status may show "LOW" |
| NTC thermistor shorted | Resistance → 0, ADC → 1023, temperature → 53.0°C (max) | Display shows ~53°C, status may show "FEVER!" |
| OLED not responding | I2C communication failure, blank display | Check wiring, verify 0x3C address, power cycle |
| ADC readings unstable | Electrical noise, inadequate averaging | Increase SAMPLES, add capacitor, check grounding |
| UART garbage output | Wrong baud rate, PPS misconfiguration | Verify UART_Init() called, check PPS settings |

## Configuration Requirements

### Hardware Configuration (PCB Level)

| Signal | Pin | Description | Required |
|--------|-----|-------------|--------|
| VDD | Pin 1 | Power supply (5V) | ✅ Required |
| VSS | Pin 14 | Ground | ✅ Required |
| RA0/AN0 | Pin 13 | NTC divider ADC input | ✅ Required |
| RC3/SCL | Pin 7 | I2C serial clock | ✅ Required |
| RC4/SDA | Pin 6 | I2C serial data | ✅ Required |
| MCLR/VPP | Pin 4 | Master clear / programming voltage | ✅ Required (must be ON via config bit) |
| RC0/OSC2 | Pin 2 | Optional: LED output | ⚠️ Optional (used for debug LED in this firmware) |

### Software Configuration (Config Bits)

Critical bits must be set via `#pragma config`:

```c
#pragma config FEXTOSC = OFF        // Internal oscillator
#pragma config RSTOSC = HFINTOSC_32MHz  // 32MHz internal
#pragma config WDTE = OFF           // Watchdog disabled
#pragma config MCLRE = ON           // MCLR enabled (REQUIRED for programming)
#pragma config LVP = ON             // Low-voltage programming (REQUIRED for ardpicprog)
#pragma config BOREN = ON           // Brown-out reset enabled
```

### OLED Address Configuration

Default I2C address is 0x3C. If the module has 0x3D jumpers, the define must be changed:

```c
#define OLED_ADDRESS 0x3C  // Change to 0x3D if needed
```

### ADC Configuration

The ADC is configured for:
- Right-justified result (ADCON1 bit 7 = 1)
- FOSC/64 acquisition time (ADCON1 bits 3-5)
- ADC channel 0 (ANSELA0, ADCON0 CHS)
- VDD as reference (ADREF = 0x00)

## Security Considerations

No sensitive data, credentials, or secrets are stored in this module. All configuration is done through compile-time #define statements and configuration bits. The firmware does not implement any authentication or encryption.

## Performance Characteristics

| Metric | Value | Notes |
|--------|-------|-------|
| ADC Conversion Time | ~1.6ms (16 samples @ 100µs each) | Dominates per-loop latency |
| Temperature Calculation | ~50µs | Integer math, 13-entry table lookup |
| OLED Display Update | ~5-10ms | I2C at 100kHz, 1024 bytes @ ~10µs/byte = 10.2ms |
| Main Loop Iteration | ~16-15ms | ADC + calc + display + delay(500ms) |
| Update Rate | ~1 sample/second | ADC + display every 2 loop iterations (1s) |
| Program Memory | ~2.5KB | Out of 3.5KB available (71%) |
| RAM | ~120 bytes | Out of 256 bytes available (47%), IF displayBuffer removed |

## Related Modules

- `i2c.c` - Lower-level I2C communication; consumed by oled.c
- `oled.c` - OLED display driver; consumed by main.c
- `adc.c` - ADC reading and resistance calculation; consumed by main.c
- `thermometer.c` - Temperature lookup and interpolation; consumed by main.c
- `uart.c` - Optional UART output; conditionally compiled