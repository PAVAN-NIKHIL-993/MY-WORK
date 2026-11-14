# System Overview

## PIC16F15214 NTC Thermometer

### High-Level Architecture

The system consists of three main subsystems:

1. **ADC Temperature Sensing**: Reads the NTC thermistor voltage divider via the PIC16F15214's analog-to-digital converter
2. **Temperature Calculation**: Converts ADC readings to temperature using a lookup table with linear interpolation
3. **OLED Display**: Shows temperature, bar gauge, and status text on the 0.78" I2C display

### Subsystem Diagram

```
+---------------------+      +---------------------+      +---------------------+
|   ADC Module        |      |   Temperature     |      |    SSD1306 OLED     |
|   (RA0 Input)       |----->|   Calculation     |----->|    Controller       |
| - 10-bit Resolution |      | - Lookup Table    |      | - 128x64 Pixels     |
| - Averaging x16     |      | - Linear Interp.  |      | - Direct Write      |
+----------+----------+      +--------+----------+      +--------+----------+
           |                          |                         |
           |                          |                         |
           v                          v                         v
+---------------------+      +---------------------+      +---------------------+
|  Configuration      |      |  Global Variables   |      |  Display Functions  |
|  Bits & Defines     |      |  (adcValue,        |      |  (OLED_Command,     |
|                     |      |   resistance,     |      |   OLED_Data, etc.)  |
|                     |      |   temperature_x10)|      |                     |
+---------------------+      +---------------------+      +---------------------+
```

### Communication Flows

#### Initialization Sequence

1. **System Initialize**:
   - Configure RA0 as analog input (TRISA0 = 1, ANSELA0 = 1)
   - Configure I2C pins (RC3=SCL, RC4=SDA)
   - Configure ADC (ADCON1, ADCON0, ADREF)
   - Wait 10ms for ADC stabilization

2. **I2C Initialize**:
   - Set I2C clock rate to 100kHz (I2C1BAUD = 79)
   - Enable I2C master mode

3. **OLED Initialize**:
   - Send sequence of SSD1306 initialization commands
   - Enable charge pump, set contrast, turn on display
   - Clear display buffer

4. **UART Initialize** (optional):
   - Configure PPS for RC4/TX and RC5/RX
   - Set baud rate to 9600 (SPBRG = 832)
   - Enable UART module

#### Main Program Loop

1. Read ADC with averaging (16 samples)
2. Calculate NTC resistance from ADC value
3. Look up temperature from resistance table
4. Interpolate if value falls between table entries
5. Clear OLED display
6. Write temperature (large, double-height)
7. Draw temperature bar gauge
8. Show status text (NORMAL/LOW/FEVER)
9. Display resistance value
10. Wait 1 second, repeat

### Data Flow

```
NTC Thermistor
    │
    ├─ Voltage Divider (100kΩ + NTC)
    │    │
    │    └─ ADC Input (RA0)
    │         │
    │    └─ ADC Conversion (10-bit, 0-1023)
    │         │
    │    └─ Calculate R_ntc = R_fixed × (ADC / (1023 - ADC))
    │         │
    │    └─ Lookup Temperature from tempTable[]
    │         │
    │    └─ Linear Interpolation (if between table entries)
    │         │
    │    └─ temperature_x10 (in 0.1°C increments)
    │         │
    │    └─ OLED Display Functions
    │         │
    │    └─ UART Output (optional)
    │         │
    └─ Temperature bar gauge, status text, resistance
```

### Control Flow

```
Main Loop (every 1000ms):
├── ADC_ReadAveraged(ADC_CHANNEL, SAMPLES)
│   └── 16 ADC readings averaged via sum>>4
├── Calculate_Resistance(adcValue)
│   └── R = 100kΩ × (ADC / (1023 - ADC))
├── Lookup_Temperature(resistance)
│   └── Binary search through tempTable[]
│   └── Return temperature_x10 (×10 for 0.1°C resolution)
├── OLED_Clear()
│   └── Clear displayBuffer[1024] (128×64/8 pages)
├── OLED_WriteString("TEMP:", 1)
├── OLED_WriteNumber(temp_int, 2)   ──┐
├── OLED_WriteChar('.', 2)            │── Display Path
├── OLED_WriteNumber(temp_dec, 2)   │
├── OLED_WriteChar('C', 2)           │
├── OLED_DrawThermometer(temperature_x10)  │
│   └── Draw bar gauge (0-100 pixel length)
│   └── Color zones: blue (<36.1°C), green (36.1-38°C), red (>38°C)
├── Status Text
│   └── NORMAL if 36.1°C ≤ T ≤ 38.0°C
│   └── FEVER! if T > 38.0°C
│   └── LOW if T < 36.1°C
├── OLED_WriteNumber(resistance/1000, 1)
│   └── kΩ value
└── __delay_ms(1000)
```

### State Flow

The system is stateless between iterations - each loop cycle independently reads and displays the current temperature. No memory of previous readings is maintained (unless min/max tracking is added).

### Initialization Sequence

```text
1. SYSTEM_Initialize()
   │
   └── Configure hardware peripherals
   │    ├── TRISA0 = 1 (RA0 as input)
   │    ├── ANSELA0 = 1 (analog function)
   │    ├── TRISC3 = 1, TRISC4 = 1 (I2C pins)
   │    ├── PPS configuration (RC3=SCL, RC4=SDA)
   │    ├── ADCON1 = 0b10000000 (ADC right-justified)
   │    ├── ADCON0 = 0b10000100 (ADC enabled, channel 0)
   │    └── __delay_ms(10) (stabilization)
   │
   └── Configure PPS for UART (if enabled)
        ├── RC4PPS = 0x0F (U1TX)
        ├── TRISC4 = 0 (output)
        ├── U1RXPPS = 0x15 (RC5)
        └── TRISC5 = 1 (input)

2. I2C_Init()
   │
   └── Set I2C baud rate, enable controller
   └── I2C1CLK = 0x03, I2C1CON0 = 0x04
   └── I2C1CON1 = 0x80, I2C1BAUD = 79

3. OLED_Init()
   │
   │── Send 15+ SSD1306 command sequences
   │── Disable display initially, then enable
   │── Set clock divide, multiplex, offset
   │── Set start line, memory mode
   │── Set segment remap, COM scan dir
   │── Set COM pins, contrast, pre-charge
   │── Set VCOMP detect, display all on, normal
   │── Turn display on at end
   │── Clear display buffer

4. Optional: UART_WriteString startup message
```

### Important Architectural Assumptions

1. **32MHz internal oscillator**: System clock is HFINTOSC_32MHz
2. **10-bit ADC**: Resolution is 0-1023, not 12-bit
3. **NTC Beta 3950**: Lookup table calibrated for this specific thermistor
4. **Series resistor 100kΩ**: Must match NTC nominal resistance at 25°C
5. **No frame buffer**: Direct OLED write saves ~1KB RAM but causes flicker
6. **Sampling rate ~1Hz**: 1-second delay between readings for stability
7. **Temperature range 10°C-53°C**: Lookup table covers this range
8. **MCLR must be ON**: Required for ICSP programming
9. **LVP must be ON**: Required for low-voltage programming via ICSP

### Architectural Constraints

- **Program Memory**: 3.5KB total, firmware uses ~2.5KB - tight fit
- **RAM**: 256 bytes total, firmware uses ~150 bytes - fits but limited
- **No floating point**: All math uses integers and lookup tables
- **No dynamic memory allocation**: All tables and buffers are static
- **Single-threaded**: Cooperative multitasking via main loop only
- **No OS**: Bare-metal firmware on 8-bit microcontroller

### Technical Debt

1. **Limited temperature range**: Lookup table could be expanded
2. **No calibration support**: Fixed coefficients, no auto-calibration
3. **No EEPROM logging**: Program memory constrained, no data persistence
4. **Flicker on display**: Direct write causes screen flicker each update
5. **No low-power mode**: ADC and oscillator always running
6. **Fixed averaging**: 16 samples chosen arbitrarily, could be configurable

### Important Decisions

- **Direct Write over Frame Buffer**: Sacrifices flicker for 1KB RAM savings - critical for 256-byte RAM device
- **Integer-Only Temperature Math**: Uses temperature_x10 (tenths of degree) to avoid floating point
- **Lookup Table over Steinhart-Hart**: Faster execution, smaller code footprint, acceptable accuracy (±0.3°C)
- **16-sample Averaging**: Good noise rejection without excessive latency
- **Bar Gauge over Line Graph**: Simpler implementation, intuitive visual feedback