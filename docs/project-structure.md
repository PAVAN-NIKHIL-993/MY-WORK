# Project Structure Documentation

## Repository Overview: PIC16F15214 NTC Thermometer

### Root Directory

```
/home/user/MY-WORK/
├── .git/                    # Git directory (DO NOT modify)
├── README.md               # Project entry point (see detailed docs)
├── .gitignore              # Git ignore rules
├── docs/                   # Documentation directory (see ARCHITECTURE.md)
│   ├── architecture/       # Architecture diagrams and decisions
│   ├── modules/           # Module documentation
│   ├── components/        # Component documentation
│   ├── api/               # API documentation
│   ├── database/          # Database/schema documentation
│   ├── testing/           # Testing documentation
│   └── guides/            # Developer guides
├── src/                    # Source code directory
│   ├── main.c             # Main application entry point
│   ├── i2c.c              # I2C communication functions
│   ├── oled.c             # OLED display functions
│   ├── adc.c              # ADC reading functions
│   ├── thermometer.c      # Temperature lookup and interpolation
│   └── uart.c             # UART output functions
├── .gitignore              # Git ignore rules
└── README.md               # Project entry point
```

### Documentation Directory

```
docs/
├── architecture/
│   ├── system-overview.md      # High-level system description
│   ├── application-flow.md     # Main program flow diagram
│   ├── data-flow.md            # Data movement through system
│   ├── state-management.md     # State flow (minimal - stateless)
│   └── decisions.md            # Architectural decisions
│
├── modules/
│   ├── main-module.md          # Main application module
│   ├── i2c-module.md           # I2C communication module
│   ├── oled-module.md          # OLED display module
│   ├── adc-module.md           # ADC module
│   ├── thermometer-module.md   # Temperature calculation module
│   └── uart-module.md           # UART output module
│
├── components/
│   ├── oled-display.md         # SSD1306 OLED component
│   ├── adc-temperature-sensor.md # NTC thermistor ADC component
│   ├── thermometer-lookup.md   # Temperature lookup table component
│   └── status-indicator.md     # NORMAL/LOW/FEER status component
│
├── api/
│   ├── overview.md             # API/UART interface overview
│   └── uart-communication.md   # UART output specification
│
├── database/
│   └── none.md                 # No persistent storage (program memory constrained)
│
├── testing/
│   ├── test-strategy.md        # Testing approach
│   ├── test-cases.md           # Specific test cases
│   └── test-matrix.md          # Test coverage matrix
│
└── guides/
    ├── developer-guide.md      # Development environment setup
    ├── debugging-guide.md      # Debugging procedures
    └── extension-guide.md      # How to extend the project
```

### Source Code Directory

```
src/
├── main.c                     # Application entry point, main loop
├── i2c.c                      # I2C master functions
│   ├── I2C_Init()
│   ├── I2C_Start()
│   ├── I2C_Stop()
│   ├── I2C_Write(uint8_t data)
│   └── Test_I2C()
├── oled.c                     # OLED SSD1306 display functions
│   ├── OLED_Command(uint8_t cmd)
│   ├── OLED_Init()
│   ├── OLED_Clear()
│   ├── OLED_SetCursor(uint8_t x, uint8_t y)
│   ├── OLED_WriteChar(char c)
│   ├── OLED_WriteString(const char* str)
│   ├── OLED_WriteNumber(int16_t num)
│   ├── OLED_Display()
│   ├── OLED_DrawRect(uint8_t x, uint8_t y, uint8_t w, uint8_t h)
│   ├── OLED_DrawPixel(uint8_t x, uint8_t y, uint8_t color)
│   └── OLED_DrawThermometer(int16_t temp)
├── adc.c                      # ADC functions
│   ├── ADC_Read(uint8_t channel)
│   ├── ADC_ReadAveraged(uint8_t channel, uint8_t samples)
│   └── Calculate_Resistance(uint16_t adc)
├── thermometer.c              # Temperature calculation
│   ├── TempLookup table[] (pre-calculated)
│   ├── Lookup_Temperature(uint32_t res)
│   └── Interpolate(uint32_t r, uint32_t r1, int16_t t1, uint32_t r2, int16_t t2)
└── uart.c                     # UART output (optional)
     ├── UART_Init()
     ├── UART_Write(uint8_t data)
     ├── UART_WriteString(const char* str)
     └── UART_WriteNumber(int16_t num)
```

### Configuration Files

```
# Configuration bits (in main.c or separate config header)
#pragma config FEXTOSC = OFF
#pragma config RSTOSC = HFINTOSC_32MHz
#pragma config WDTE = OFF
#pragma config MCLRE = ON
#pragma config LVP = ON
#pragma config BOREN = ON

# Define constants (in main.c or header)
#define _XTAL_FREQ 32000000
#define I2C_SPEED 100000L
#define OLED_ADDRESS 0x3C
#define ADC_CHANNEL 0
#define SERIES_RESISTOR 100000L
#define ADC_MAX 1023
#define SAMPLES 16

# Temperature lookup table entries (11 entries)
const TempLookup tempTable[] = { ... };
#define TABLE_SIZE 11

# Font table (5x7 ASCII)
const uint8_t font5x7[][5] = { ... };
```

### Build Artifacts

```
dist/default/production/
├── PIC16F15214_Thermometer.production.hex   # Program memory image
├── PIC16F15214_Thermometer.production.map   # Memory map
├── PIC16F15214_Thermometer.production.debug  # Debug artifact
└── cof/                                     # COFF format object file
```

### Git Workflow

```
Branches:
├── main                    # Primary branch (protected)
└── product-refinement/thermometer-firmware-v2  # Current working branch

Commit Convention:
├── feat: add new feature
├── fix: resolve bug or issue
├── refactor: improve code architecture
├── docs: update documentation
├── perf: optimize performance
└── test: add or fix tests

Current Branch: product-refinement/thermometer-firmware-v2
```

### Important Files Summary

| File | Purpose | Critical? |
|------|---------|-----------|
| src/main.c | Main application, infinite loop | ✅ YES |
| src/i2c.c | I2C communication to OLED | ✅ YES |
| src/oled.c | OLED display driver | ✅ YES |
| src/adc.c | ADC readings and resistance calculation | ✅ YES |
| src/thermometer.c | Temperature lookup and interpolation | ✅ YES |
| src/uart.c | Optional UART output | ⚠️ Optional |
| config bits | PIC16F15214 configuration | ✅ YES |
| tempTable[] | Temperature lookup table | ✅ YES |
| font5x7[] | LCD font definitions | ✅ YES |
| README.md | Project documentation entry | ✅ YES |
| docs/architecture/*.md | Architecture documentation | ✅ YES |