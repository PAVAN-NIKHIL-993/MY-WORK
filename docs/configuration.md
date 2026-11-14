# Configuration Documentation

## Project Configuration for PIC16F15214 NTC Thermometer

This document describes all meaningful configuration values for the PIC16F15214 thermometer firmware. Configuration is split into three categories: compile-time #define statements, configuration fuse bits, and hardware jumpers/settings.

---

## 1. Compile-Time Configuration

All compile-time values are defined via `#define` statements in `src/main.c`. These can be modified by the user without changing core logic.

### System Clock and Frequency

| Variable | Type | Default | Description | Change Required When |
|----------|------|---------|-------------|---------------------|
| `_XTAL_FREQ` | `uint32_t` | `32000000` | System oscillator frequency in Hz; used by `__delay_ms()` and `__delay_us()` functions | Never change unless oscillator changes (different PIC or external crystal) |

**Impact**: Delay functions are calibrated for 32MHz. Changing to 4MHz would make `__delay_ms()` 8× longer than expected.

### I2C Configuration

| Variable | Type | Default | Description | Change Required When |
|----------|------|---------|-------------|---------------------|
| `I2C_SPEED` | `uint32_t` | `100000L` | Target I2C bus speed in Hz (100kHz = standard mode) | If OLED communication is unstable; some displays work at 400kHz (fast mode) |
| `OLED_ADDRESS` | `uint8_t` | `0x3C` | 7-bit I2C address of the SSD1306 OLED module | If OLED does not respond; some modules have 0x3D address (jumper-selectable) |

**I2C Baud Rate Calculation**:
```
; For 100kHz at 32MHz:
; SSP1ADD = (Fosc / (4 × I2C_SPEED)) - 1
;        = (32000000 / (4 × 100000)) - 1
;        = 80 - 1 = 79
; Verified: F_I2C = Fosc / (4 × (SSP1ADD + 1)) = 32MHz / (4 × 80) = 100kHz ✓

; If changing I2C_SPEED to 400kHz:
; SSP1ADD = (32000000 / (4 × 400000)) - 1 = 20 - 1 = 19
```

**OLED Address Change Example**:
```c
// In main.c, near other #define statements:
#define OLED_ADDRESS 0x3D  // Change from default 0x3C
```

### ADC Configuration

| Variable | Type | Default | Description | Change Required When |
|----------|------|---------|-------------|---------------------|
| `ADC_CHANNEL` | `uint8_t` | `0` | ADC input channel (0 = RA0/AN0) | If using different analog input pin (RA1-RA7 available on PIC16F15214) |
| `SERIES_RESISTOR` | `uint32_t` | `100000L` | Series resistor value in ohms (100kΩ) | **Must match actual circuit**; if using different precision resistor |
| `ADC_MAX` | `uint16_t` | `1023` | Maximum 10-bit ADC value (2^10 - 1) | Never change (hardware fixed for 10-bit ADC) |
| `SAMPLES` | `uint8_t` | `16` | Number of ADC samples for averaging (power of 2: 2, 4, 8, 16) | If more noise reduction needed; larger values increase latency |

**Averaging Divisors** (internal, not user-facing):
- SAMPLES=16 → divide by 16 (shift right 4: `sum >> 4`)
- SAMPLES=8 → divide by 8 (shift right 3: `sum >> 3`)
- SAMPLES=4 → divide by 4 (shift right 2: `sum >> 2`)
- SAMPLES=2 → divide by 2 (shift right 1: `sum >> 1`)

**SAMPLES Change Example** (for more noise reduction):
```c
// In main.c, change SAMPLES define (note: function ADC_ReadAveraged supports this):
#define SAMPLES 32  // Instead of 16; function handles power-of-2 division
```

### Temperature Lookup Table

| Variable | Type | Default | Description | Change Required When |
|----------|------|---------|-------------|---------------------|
| `tempTable[]` | `TempLookup[13]` | Pre-calculated | Resistance-temperature lookup table (13 entries, 10°C-53°C) | **If using different NTC thermistor** (different β value, different nominal resistance) |
| `TABLE_SIZE` | `uint8_t` | `13` | Number of entries in tempTable | Must match sizeof(tempTable)/sizeof(TempLookup) when modifying table |

**To calibrate for a different NTC thermistor**:

1. Measure NTC resistance at 3 known temperatures (using reference thermometer)
2. Calculate entries using: `R = R_fixed × (ADC / (1023 - ADC))` at each temperature
3. Replace entries in `tempTable[]` array
4. Update `TABLE_SIZE` if changing number of entries

**Example table modification for Beta 3435 NTC** (hypothetical):
```c
const TempLookup tempTable[] = {
    {220000L, 100},  // 10.0°C (adjusted for different β)
    {190000L, 150},
    {165000L, 200},
    // ... 10 more entries
};
#define TABLE_SIZE 13  // Still 13 entries
```

### Font Configuration

| Variable | Type | Default | Description | Change Required When |
|----------|------|---------|-------------|---------------------|
| `font5x7[][5]` | `const uint8_t[95][5]` | Pre-defined | 5×7 pixel ASCII font (95 characters, ASCII 32-126) | **Rarely needed**; only if adding characters or changing glyph design |

**Font modification is advanced**: The font table is 95 characters × 5 bytes = 475 bytes of program memory. To add or modify characters:
1. Design 5×7 pixel glyph for each character
2. Convert to 5-byte hex array (each byte = one row of 5 pixels, bit=1 means pixel on)
3. Replace corresponding entries in `font5x7[][5]`
4. Update `getFontIndex()` if changing character range

**Example**: Adding degree symbol (°) at the end:
```c
// Add after existing font entries (character 126 = ~, index 94 in 32-126 range):
{0x00, 0x05, 0x07, 0x05, 0x00},  // Degree symbol (5×7 approximately)

// In getFontIndex(), extend range or map differently:
uint8_t getFontIndex(char c) {
    if(c < 32 || c > 126) return 0;  // Could extend range if needed
    return (uint8_t)(c - 32);
}
```

### UART Configuration

| Variable | Type | Default | Description | Change Required When |
|----------|------|---------|-------------|---------------------|
| (No direct #defines; baud set in UART_Init()) | - | 9600 baud | Serial communication speed | If connecting to different baud-rate-capable device |

**Baud rate is set in UART_Init() function** (not via #define), using:
- `U1BRGH = 1`
- `U1BRG = 832` (for 32MHz / 9600 baud)

To change baud rate, modify `UART_Init()` function in `src/uart.c`:
```c
// For 115200 baud @ 32MHz:
// U1BRGH = 0 (or minimal)
// U1BRG = (32000000 / (4 × 115200)) - 1 ≈ 69
```

---

## 2. Configuration Fuse Bits

The PIC16F15214 configuration bits (fuses) are set via `#pragma config` statements in `src/main.c`. These are **critical** - incorrect settings will prevent the device from operating or being programmed.

All fuse bits must be set as specified. Do not modify unless you understand the implications.

### Critical Fuse Bits (Must Not Change)

| Fuse Bit | Setting | Description | Why Critical |
|----------|---------|-------------|--------------|
| `FEXTOSC` | `OFF` | External oscillator disabled | Internal oscillator used; must be OFF for HFINTOSC selection |
| `RSTOSC` | `HFINTOSC_32MHz` | Reset oscillator source; 32MHz internal | System clock frequency; changing breaks all delay/bud timings |
| `WDTE` | `OFF` | Watchdog Timer disabled | Prevents unexpected resets during normal operation |
| `MCLRE` | `ON` | MCLR pin enabled (RESET/VPP) | **CRITICAL**: Required for ICSP programming via ardpicprog; without this, can't program the device |
| `LVP` | `ON` | Low-voltage programming enabled | **CRITICAL**: Required by ardpicprog for ICSP; without this, programming fails |
| `BOREN` | `ON` | Brown-out reset enabled | Protects against voltage drops; prevents corruption during power transitions |

**Do not modify these fuses**:
```c
// ❌ WRONG - will prevent programming and operation:
#pragma config FEXTOSC = ON    // Don't change from OFF
#pragma config RSTOSC = HFINTOSC_1MHz  // Don't change from 32MHz
#pragma config WDTE = ON       // Don't change from OFF (causes resets)
#pragma config MCLRE = OFF     // Don't change from ON (breaks ICSP!)
#pragma config LVP = OFF       // Don't change from ON (breaks ardpicprog)
#pragma config BOREN = OFF     // Don't change from ON (loses BOR protection)
```

### Optional Fuse Bits (Usually Left as Default)

The PIC16F15214 has additional fuse bits that can be configured but are set to safe defaults:

| Fuse Bit | Default | Description | Recommended Action |
|----------|---------|-------------|-------------------|
| PWRTS | 0 | Power-up timer period | Leave default (0 = ~64ms) |
| MCLRE | see above | MCLR pin function | Already covered as critical |
| STVREN | ON | Stack overflow reset | Leave ON (protects against stack overflow) |
| XINST | OFF | Instruction set extension | Leave OFF (compatibility mode) |
| CP | OFF | Code protect | Leave OFF (prevents debug mode; good for production) |
| CPD | OFF | Data EEPROM code protect | Leave OFF |
| WT | OFF | Watchdog Timer postscale | Leave OFF (WDTE=OFF already handles this) |

### Fuse Bit Configuration Code

All fuse bits are set in `src/main.c` at the top of the file:

```c
// Configuration Bits - PIC16F15214
#pragma config FEXTOSC = OFF        // External Oscillator disabled
#pragma config RSTOSC = HFINTOSC_32MHz  // 32MHz internal oscillator
#pragma config WDTE = OFF           // Watchdog Timer disabled
#pragma config MCLRE = ON           // MCLR enabled (needed for programming!)
#pragma config LVP = ON             // Low Voltage Programming enabled
#pragma config BOREN = ON           // Brown-out Reset enabled
```

**Verification**: After programming the PIC with ardpicprog, verify the fuses are correct by:
1. Checking the MPLAB X IDE "Configuration Bits" window
2. Reading the device ID and fuse status in ardpicprog output
3. Ensuring the device operates correctly (correct ADC readings, OLED display)

### Hardware Jumper Configuration

| Jumper/Setting | Default | Description | Change When |
|----------------|---------|-------------|-------------|
| OLED I2C address | 0x3C (most modules) | 7-bit I2C address | If OLED module has 0x3D jumper |
| Pull-up resistors on SDA/SCL | Optional (some OLED modules have built-in) | 4.7kΩ to VDD on I2C lines | If OLED communication is unstable and module lacks internal pull-ups |
| NTC thermistor | Connected as per circuit | 100kΩ Beta 3950 between RA0 and GND (via 100kΩ series resistor) | If using different thermistor (requires table calibration) |
| External power | From Arduino 5V | 5V supply to PIC VDD (Pin 1) | If powering PIC from separate source; ensure common ground with Arduino |

---

## 3. Runtime Configuration (Dynamic)

Some configuration values are set at runtime based on hardware state. These are not user-editable #defines but are derived from the hardware configuration.

### Automatic Configuration at Startup

The `SYSTEM_Initialize()` function in `src/main.c` performs the following runtime configuration:

```c
void SYSTEM_Initialize(void) {
    // 1. Oscillator (set by config bits, not runtime #defines)
    //    - HFINTOSC_32MHz from configuration bits
    
    // 2. ADC Configuration (runtime registers, not #defines)
    ADCON1 = 0b10000000;  // Right-justified, FOSC/64
    ADCON0 = 0b10000100;  // ADC enabled, channel 0
    ADREF = 0x00;         // VDD as reference
    
    // 3. I2C Configuration (runtime registers)
    //    - I2C1BAUD = 79 set for 100kHz @ 32MHz
    //    - Configured in I2C_Init() function
    
    // 4. PPS Configuration (runtime pin mapping)
    //    - RC3PPS = 0x0E (SCL)
    //    - RC4PPS = 0x0F (SDA/TX)
    //    - I2C1SCLPPS = 0x13, I2C1SDAPPS = 0x14
    
    // 5. UART Configuration (runtime registers)
    //    - Configured in UART_Init() function
}
```

### Derived Values

These values are calculated from the #define constants but are not #defines themselves:

| Derived Value | Calculation | Result |
|--------------|-----------|--------|
| I2C SSP1ADD | `(32000000 / (4 × I2C_SPEED)) - 1` | 79 (for 100kHz) |
| UART SPBRG | `(32000000 / (4 × 9600)) - 1` ≈ 832 | 832 (for 9600 baud) |
| ADC conversion time | `13 × (1/Fosc × 64)` | ~26µs @ 32MHz |
| Display update interval | `DISPLAY_UPDATE_INTERVAL × 500ms` | 1000ms (2 × 500ms loops) |

### Configuration Validation

To validate configuration is correct:

1. **Build the project**: No compilation errors
2. **Program the device**: ardpicprog --device pic16f15214 --erase --program --verify
3. **Test basic function**: Power circuit; OLED should display something
4. **Verify ADC readings**: Use Test_Hardware() function or UART output
5. **Check I2C communication**: Use Test_I2C() function (scans addresses 0x3C and 0x3D)

**If any test fails**:
1. Check all #define constants match hardware
2. Verify configuration fuse bits are correct
3. Verify wiring matches schematic
4. Consult troubleshooting documentation (docs/troubleshooting.md)

---

## 4. Environment Configuration

### Development Machine Setup

#### Windows

1. Install Git for Windows (https://git-for-windows.github.io/)
2. Install MPLAB X IDE (includes XC8 compiler)
3. Install Arduino IDE (https://www.arduino.cc/en/software)
4. Optionally: Install MSYS2 for make command (`pacman -S mingw-w64-x86_64-make`)
5. Add to PATH if needed: `C:\Program Files\Microchip\xc8\v2.35\bin`

#### macOS

1. Install Homebrew (if not installed): `/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/2.5/install.sh)"`
2. Install dependencies: `brew install git`
3. Install MPLAB X IDE from Microchip website
4. Install Arduino IDE
5. Optionally: `brew install make` (if not included)

#### Linux (Ubuntu/Debian)

```bash
# Install required packages
sudo apt-get update
sudo apt-get install build-essential git make

# Install MPLAB X and XC8 (download from Microchip website manually)
# Or via snap (may be outdated):
sudo snap install mpLAB-x  # (if available)

# Install Arduino IDE
sudo snap install --classic arduino  # or download .tar.gz
```

### Code Editor Configuration

#### VS Code (alternative to MPLAB X)

If using VS Code instead of MPLAB X:

1. Install C/C++ extension (ms-vscode.cpptools)
2. Add `c_cpp_properties.json` with:
   ```json
   {
     "configurations": [
       {
         "name": "PIC16F15214",
         "includePath": [
           "${workspaceFolder}/src",
           "${workspaceFolder}/.",
           "C:/Program Files/Microchip/xc8/v2.35/pic/include"
         ],
         "compilerPath": "C:/Program Files/Microchip/xc8/v2.35/bin/xc8-cc.exe"
       }
     ]
   }
3. Add `tasks.json` for build:
   ```json
   {
     "taskName": "build",
     "type": "shell",
     "command": "xc8",
     "args": ["main.c", "--build"]
   }
   ```

### Version Control Hooks (Git)

Recommended git hooks for this project:

**pre-commit hook**: Run linting before committing
```bash
#!/bin/bash
# .git/hooks/pre-commit
# Lint source files
xc8 --lint src/main.c src/i2c.c src/oled.c 2>&1 || exit 1
# Check no secrets in staged files
git diff --cached | grep -qi "password\|secret\|key\|token" && exit 1
exit 0
```

**Make executable**: `chmod +x .git/hooks/pre-commit`

### Continuous Integration (Optional)

For GitHub Actions integration (not currently set up, but documented):

```yaml
# .github/workflows/build.yml (example)
name: Build and Test

on:
  push:
    branches: [ product-refinement/thermometer-firmware-v2 ]
  pull_request:
    branches: [ main ]

jobs:
  build:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Install XC8
        run: |
          # Download and install XC8 (simplified)
          choco install xc8  # or manual install
      
      - name: Build firmware
        run: |
          xc8 --build src/main.c
          
      - name: Verify HEX file exists
        run: |
          ls dist/default/production/*.hex
```

---

## Configuration Summary Table

| Category | Key Values | Defaults | Mutable? |
|----------|-----------|----------|----------|
| System | _XTAL_FREQ | 32000000 | No (hardware) |
| I2C | I2C_SPEED | 100kHz | Yes |
| I2C | OLED_ADDRESS | 0x3C | Yes (if needed) |
| ADC | ADC_CHANNEL | RA0 (channel 0) | Yes |
| ADC | SERIES_RESISTOR | 100kΩ | Yes (must match circuit) |
| ADC | SAMPLES | 16 | Yes |
| Table | tempTable[] | 13 entries (10°C-53°C) | Yes (for different NTC) |
| Font | font5x7[] | 95 chars, 5×7 pixels | Rarely |
| UART | 9600 baud | Set in UART_Init() | Function-level |
| Fuses | MCLRE=ON, LVP=ON | Critical; set in #pragma config | **Must not change** |
| Power | 5V VDD | From Arduino or external | Hardware |

---

## Configuration Change Checklist

When modifying configuration, verify:

- [ ] All `#define` statements updated in `src/main.c`
- [ ] Fuse bits correct in `src/main.c` `#pragma config` section
- [ ] Hardware matches new configuration (resistors, capacitors, pins)
- [ ] Temperature lookup table calibrated for new NTC if changed
- [ ] I2C address matches OLED module (0x3C or 0x3D)
- [ ] Series resistor value matches actual circuit component
- [ ] Project rebuilded (Clean and Build in MPLAB X)
- [ ] Device re-programmed with ardpicprog
- [ ] All tests pass (basic function, ADC readings, OLED display)
- [ ] Documentation updated (this file + README if needed)

**Note**: Changing `SERIES_RESISTOR` requires recalculating all resistance values; changing the temperature table requires recalibrating for the specific NTC thermistor; changing `OLED_ADDRESS` requires the module to use that address.