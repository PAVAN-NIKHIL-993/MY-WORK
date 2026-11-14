# Setup Documentation

## Project Setup for PIC16F15214 NTC Thermometer

### Prerequisites

#### Hardware Requirements

| Component | Minimum Quantity | Description |
|-----------|-----------------|-------------|
| PIC16F15214 | 1 | 14-pin DIP microcontroller (target device) |
| Arduino UNO or compatible | 1 | Used as ICSP programmer (flashes ardpicprog sketch) |
| 0.78" I2C SSD1306 OLED | 1 | 128×64 pixels, SPI/I2C interface (usually 0x3C address) |
| NTC thermistor 100kΩ | 1 | Beta 3950 (temperature sensing element) |
| 100kΩ 0.1% resistor | 1 | Precision series resistor for voltage divider |
| 0.1µF capacitor | 1 | ADC input filtering (RA0 to VSS) |
| Breadboard | 1 | For prototyping circuit |
| Jumper wires | Assorted | For connections between components |
| Arduino board (for ICSP) | 1 | With ICSP header (UNO, Nano, Mega) |
| 10kΩ resistor | 1 | MCLR pull-up resistor |
| External power supply | 1 | 5V DC (or use Arduino USB power) |

#### Software Requirements

| Software | Version | Purpose |
|----------|---------|---------|
| MPLAB X IDE | v5.45 or later (free from Microchip) | IDE for writing and compiling XC8 code |
| XC8 Compiler | v2.35 or later (free from Microchip) | C compiler for PIC16F15214 |
| Arduino IDE | v2.3 or later | To flash programmer sketch to Arduino |
| ardpicprog | Latest from GitHub | Command-line PIC programmer tool |
| Git | v2.0 or later | Version control (already present) |
| Screen terminal | Any (PuTTY, TeraTerm, GtkTerm, etc.) | For UART serial output (optional) |

### Installation Steps

#### Step 1: Install MPLAB X IDE

1. Download from: https://www.microchip.com/mplab/mplab-x-ide
2. Download "MPLAB X IDE v6.05" or latest
3. Run installer (Windows/Mac/Linux)
4. Accept default options; install setup wizards if prompted
5. Launch MPLAB X IDE

#### Step 2: Install XC8 Compiler

1. Download from: https://www.microchip.com/xc8-compiler
2. Download "XC8 v2.35" (Free mode sufficient for this project)
3. Run installer
4. Accept default options
5. Compiler will be integrated with MPLAB X automatically

#### Step 3: Install Arduino IDE

1. Download from: https://www.arduino.cc/en/software
2. Download version for your OS (Windows/Mac/Linux)
3. Run installer
4. Accept default options
5. Verify: Tools → Board → Arduino UNO should list available boards

#### Step 4: Download and Setup ardpicprog

1. Clone from GitHub:
   ```bash
   git clone https://github.com/rweather/ardpicprog.git
   ```
   Or download ZIP from: https://github.com/rweather/ardpicprog

2. Extract to a folder, e.g., `C:\ardpicprog\` (Windows) or `~/ardpicprog/` (Linux/Mac)

3. Compile the host software:
   - Open terminal/minigw in `ardpicprog/host/`
   - Run: `make`
   - This creates: `ardpicprog.exe` (Windows) or `ardpicprog` (Linux/Mac)
   
   Or install system-wide:
   ```bash
   sudo make install
   ```
   This makes `ardpicprog` command available globally.

#### Step 5: Flash Arduino with Programmer Sketch

1. Open Arduino IDE
2. File → Open → `ardpicprog/Programmer/Programmer.ino`
3. Select your Arduino board: Tools → Board → Arduino UNO
4. Select COM port: Tools → Port → COM3 (or your Arduino's port)
5. Click Upload (or Ctrl+U)
6. Wait for "Done uploading" message
7. Arduino is now a PIC programmer!

#### Step 6: Wire the PIC16F15214

Follow the ICSP connection diagram (see wiring section below). Critical connections:
- D13 (VPP) → Pin 4 (MCLR/VPP) on PIC + 10kΩ to VDD
- D11 (CLK) → Pin 11 (ICSPCLK/PGC)
- D12 (DATA) → Pin 12 (ICSPDAT/PGD)
- 5V → Pin 1 (VDD)
- GND → Pin 14 (VSS)
- 10kΩ from VDD to Pin 4 (MCLR pull-up)

#### Step 7: Compile the Firmware

1. Open MPLAB X IDE
2. File → New Project → Standalone Project
3. Device: PIC16F15214
4. Tool: XC8 (v2.35+)
5. Select main.c from the project
6. Production → Build (or F11)
7. HEX file generated at: `dist/default/production/PIC16F15214_Thermometer.production.hex`

#### Step 8: Program the PIC

Using ardpicprog command line:

```bash
# Basic programming command
ardpicprog --device pic16f15214 --program --input dist/default/production/PIC16F15214_Thermometer.production.hex

# Full sequence: erase, program, verify
ardpicprog --device pic16f15214 \
           --port COM3 \           # Arduino COM port
           --erase \
           --program \
           --verify \
           --input dist/default/production/PIC16F15214_Thermometer.production.hex
```

#### Step 9: Test the System

1. Power the PIC16F15214 circuit
2. OLED should display "PIC THERMOMETER" splash screen, then normal operation
3. Temperature should appear on OLED display
4. (Optional) Connect TTL adapter to RC4/RC5 and monitor via serial terminal

### Development Environment Configuration

#### MPLAB X IDE Settings

1. **Window → Preferences**:
   - Code → Tabs: "Show tab close buttons"
   - Font: Monospace, size 12
   - Editor → On Save: "Format on save" (optional)

2. **Theme**: Set preferred color scheme (Default/Darcula/Obsidian)

3. **Code Templates**: Customize code snippets for common patterns

#### XC8 Compiler Settings

The project uses these XC8 configuration settings (set via #pragma config in main.c):

```c
#pragma config FEXTOSC = OFF        // External Oscillator disabled
#pragma config RSTOSC = HFINTOSC_32MHz  // 32MHz internal oscillator
#pragma config WDTE = OFF           // Watchdog Timer disabled
#pragma config MCLRE = ON           // MCLR enabled (needed for programming!)
#pragma config LVP = ON             // Low Voltage Programming enabled
#pragma config BOREN = ON           // Brown-out Reset enabled
```

**Build Settings** (automatic with MPLAB X):

1. Production → Build Options:
   - Output: production.hex
   - Optimize: Default (balance of size/speed)
   - Report: Default
   - Store code data in EEPROM: Unchecked (not used)

2. Production → Build (F11):
   - Compiles main.c and generates .hex file
   - Output location: `dist/default/production/`

#### Arduino IDE Configuration

1. **Board selection**: Tools → Board → Arduino UNO
2. **Port selection**: Tools → Port → COM3 (Windows) or /dev/tty.usbmodulo (Mac/Linux)
3. ** programmer**: Tools → Programmer → Arduino as ISP
4. **Auto-reset**: Ensure DTR/RTS lines control Arduino reset (auto)

#### PIC16F15214 Configuration Fuses

The following configuration bits are critical and set in source code via `#pragma config`:

| Config Bit | Value | Description | Required? |
|------------|-------|-------------|-----------|
| FEXTOSC | OFF | External oscillator disabled | ✅ Yes |
| RSTOSC | HFINTOSC_32MHz | 32MHz internal oscillator | ✅ Yes |
| WDTE | OFF | Watchdog Timer disabled | ✅ Yes |
| MCLRE | ON | MCLR pin enabled (ICSP programming) | ✅ **Critical** |
| LVP | ON | Low-voltage programming enabled | ✅ **Critical** (for ardpicprog) |
| BOREN | ON | Brown-out reset enabled | ✅ Yes |

**Note**: Without MCLRE=ON and LVP=ON, the ardpicprog tool will fail to program the device with errors like "cannot enter programming mode" or "device ID mismatch."

### Local Development Requirements

#### Operating System

| OS | Requirements |
|----|-------------|
| Windows 10/11 | .NET Framework 4.5+ (for MPLAB X), Arduino IDE, Git |
| macOS 12+ | Xcode command line tools (for make), Arduino IDE, Git |
| Linux (Ubuntu 22.04+) | `sudo apt-get install build-essential git make`, Arduino IDE |

#### Disk Space

| Component | Required Space |
|-----------|---------------|
| MPLAB X IDE | ~2-3 GB |
| XC8 Compiler | ~500 MB |
| Arduino IDE | ~200 MB |
| ardpicprog source | ~10 MB |
| Project files | ~1 MB |
| **Total** | **~6 GB** (most is IDE and compiler) |

#### RAM and CPU Requirements (Development Host)

| Resource | Minimum | Recommended |
|----------|---------|-------------|
| RAM | 4 GB | 8 GB+ |
| CPU | 2 GHz dual-core | 3+ GHz, 4+ cores |
| Disk | 5 GB free | 10 GB free (with caches) |

### Configuration

#### Environment Variables (optional)

No environment variables are required for this firmware. All configuration is done through:

1. **Source code #define statements** (in main.c):
   - `_XTAL_FREQ 32000000`
   - `I2C_SPEED 100000L`
   - `OLED_ADDRESS 0x3C`
   - `ADC_CHANNEL 0`
   - `SERIES_RESISTOR 100000L`
   - `ADC_MAX 1023`
   - `SAMPLES 16`

2. **Configuration bits** (in main.c via #pragma config):
   - Set automatically via code; no separate configuration step

3. **Hardware jumpers**:
   - I2C OLED address: Default 0x3C; if module has 0x3D jumper, change `#define OLED_ADDRESS 0x3D`
   - NTC thermistor: Already included in circuit; no jumpers

#### Default Configuration Values

| Parameter | Default Value | Can be Changed? | Effect of Change |
|-----------|-------------|-----------------|----------------|
| I2C speed | 100kHz | Yes (redefine I2C_SPEED) | Faster/slower OLED updates |
| OLED address | 0x3C | Yes (redefine OLED_ADDRESS) | If using 0x3D variant ADC clock | 32MHz HFINTOSC (no change possible; silicon) |
| ADC channel | RA0 (channel 0) | Yes (redefine ADC_CHANNEL) | Use different analog input (not recommended) |
| Series resistor | 100kΩ | Yes (redefine SERIES_RESISTOR) | Must match actual circuit; affects resistance calculation |
| ADC resolution | 10-bit (0-1023) | No (hardware fixed) | Cannot change; different PIC would be needed |
| Temperature table | 13 entries (10°C-53°C) | Yes (modify tempTable[] in main.c) | For different NTC thermistor or expanded range |
| Averaging samples | 16 | Yes (redefine SAMPLES in ADC_ReadAveraged()) | More samples = less noise, more latency |

#### Hardware Configuration

**OLED Display I2C Address**:

Most 0.78" SSD1306 OLED modules use address 0x3C. Some variants use 0x3D. To check:

1. Connect circuit as specified
2. Run ardpicprog test:
   ```bash
   arpicprog --device pic16f15214 --ping
   ```
   Or use the Test_I2C() function in the code.

3. If 0x3C doesn't work, try 0x3D:
   ```c
   #define OLED_ADDRESS 0x3D  // In main.c, src/oled.c, src/i2c.c
   ```

**NTC Thermistor Verification**:

1. Measure resistance with multimeter at room temperature (≈25°C)
2. Should read ≈100kΩ (nominal value)
3. Heat with finger; resistance should decrease (NTC characteristic)
4. If resistance increases when heating, connections are reversed

**Power Supply**:

- PIC16F15214: 5V VDD (Pin 1), connect to Arduino 5V or external 5V supply
- OLED: 5V VDD (Pin 1 of PIC supplies OLED via I2C lines, or OLED has its own 5V regulator)
- NTC divider: Powered from same VDD as PIC
- 0.1µF capacitor between RA0 and VSS for noise filtering
- Ensure common ground (VSS Pin 14) between PIC and all other components

#### Production Requirements

For deploying the final product:

1. **Burn the HEX file**: Use ardpicprog as described in installation steps
2. **Set configuration bits**: Already in source code; ardpicprog will program them
3. **Final testing**: Power circuit, verify temperature readings against reference thermometer
4. **Quality assurance**: Test at room temp (25°C), body temp range (35-40°C), extreme ranges (10°C, 50°C)
5. **Documentation**: Ensure all docs are built and included with product

#### Browser/Runetime Requirements

This is firmware for embedded hardware; no browser/runtime requirements. For the associated PC software (terminal emulators):

| Software | Windows | macOS | Linux |
|----------|---------|-------|-------|
| PuTTY | ✅ | ✅ (via X11) | ✅ |
| TeraTerm | ✅ | ✅ | ✅ |
| GtkTerm | ✅ (via Wine) | ✅ | ✅ |
| Arduino Serial Monitor | ✅ | ✅ | ✅ |

### Troubleshooting Installation

| Problem | Likely Cause | Solution |
|---------|--------------|----------|
| "Cannot open port COM3" | Arduino not connected; wrong COM port | Check Arduino USB connection; verify correct COM port in Device Manager |
| "Device not supported" | MCLRE/LVP config bits wrong | Ensure `#pragma config MCLRE = ON` and `#pragma config LVP = ON` in main.c |
| OLED shows nothing | I2C address wrong; wiring wrong | Try OLED_ADDRESS 0x3D; verify all 5 ICSP wires connected correctly |
| Temperature reads 10.0°C always | NTC not connected; divider wrong | Check: RA0 to 100kΩ to VDD, NTC from 100kΩ to GND, 0.1µF capacitor present |
| ADC always reads 0 or 1023 | RA0 not configured as analog | Verify: TRISA0 = 1 AND ANSELA0 = 1 in SYSTEM_Initialize() |
| UART output garbled | Baud rate mismatch; PPS not configured | Verify UART_Init() called; check PPS: RC4PPS=0x0F, U1RXPPS=0x15 |
| Compilation error "out of memory" | Program memory exceeded | Reduce features: use 128×32 OLED, reduce font chars, reduce lookup table entries |
| Brown-out reset during operation | Supply voltage too low | Ensure stable 5V; add 0.1µF capacitor near VDD pin; check power supply |

#### git Configuration

```bash
# Set up git after cloning
git config --global user.name "Your Name"
git config --global user.email "you@example.com"

# Check current branch
git branch -v

# View recent commits
git log --oneline -5
```

### Next Steps After Setup

1. Verify the hardware circuit matches the wiring diagram
2. Compile the firmware in MPLAB X
3. Program the PIC using ardpicprog
4. Observe OLED display for temperature readings
5. (Optional) Connect TTL adapter and monitor serial output
6. Review documentation for developer guide
7. Make any needed adjustments (pin assignments, table values, etc.)

### Uninstallation

No uninstallation required for this project. To stop using:

1. Remove PIC16F15214 from breadboard (or leave in place - consumes minimal power)
2. Disconnect Arduino ICSP (or leave connected; no conflict)
3. Remove OLED display (or leave connected; no current draw when powered off)
4. Delete build artifacts: `rm -rf dist/`

### Related Documentation

- `docs/architecture/system-overview.md` - High-level system description
- `docs/architecture/decisions.md` - Key architectural decisions
- `docs/modules/main-module.md` - Main application module details
- `docs/project-structure.md` - Repository directory layout
- `README.md` - Project entry point and overview