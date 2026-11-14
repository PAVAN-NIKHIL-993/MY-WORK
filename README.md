# PIC16F15214 NTC Thermometer

## Project Purpose
A high-precision temperature measurement system using the PIC16F15214 microcontroller with an NTC temperature sensor and 0.78" I2C OLED display. The device measures ambient temperature using a 100kΩ NTC (Beta 3950) thermistor and displays the result on a graphical OLED display.

## Problem Being Solved
Provide accurate, readable temperature monitoring in a compact, power-efficient form factor suitable for embedded/hobbyist applications, with minimal RAM usage through direct OLED write (no frame buffer).

## Key Features

- **Direct Write OLED Display**: No frame buffer required, saving ~1KB RAM
- **Temperature Bar Gauge**: Visual representation of current temperature
- **Temperature Lookup Table**: Pre-calculated resistance-to-temperature mapping
- **Status Indicators**: NORMAL/LOW/FEVER classification
- **Resistance Display**: NTC resistance in kΩ
- **Compact Firmware**: Fits within PIC16F15214's 3.5KB program memory

## Technology Stack

- **Microcontroller**: PIC16F15214 (32MHz HFINTOSC)
- **Display**: 0.78" I2C SSD1306 OLED (128×64)
- **Temperature Sensor**: 100kΩ NTC thermistor (Beta 3950)
- **Compiler**: XC8 (Free mode)
- **Programming**: Arduino as ICSP programmer (ardpicprog)
- **Language**: C

## Architecture Summary

The firmware implements a direct-write approach to the OLED display, eliminating the need for a frame buffer and saving significant RAM. Temperature is measured via ADC on the NTC thermistor, resistance is calculated, and temperature is looked up from a pre-calculated table with linear interpolation. The display shows:
- Large temperature readout (double-height characters)
- Horizontal bar gauge visualizing temperature range
- Status text (NORMAL/LOW/FEVER)
- NTC resistance value

## Repository Structure

```
MY-WORK/
├── docs/                    # Documentation directory
│   ├── architecture/        # Architecture diagrams and decisions
│   ├── modules/           # Module documentation
│   ├── components/        # Component documentation
│   ├── api/               # API documentation
│   ├── database/          # Database/schema documentation
│   ├── testing/           # Testing documentation
│   └── guides/            # Developer guides
├── src/                     # Source code directory
│   ├── main.c             # Main application entry point
│   ├── i2c.c              # I2C communication functions
│   ├── oled.c             # OLED display functions
│   ├── adc.c              # ADC reading functions
│   ├── thermometer.c      # Temperature lookup and interpolation
│   └── uart.c             # UART output functions
├── .gitignore              # Git ignore rules
└── README.md               # Project entry point
```

## Requirements

### Hardware

- PIC16F15214 microcontroller
- 0.78" I2C SSD1306 OLED display (128×64)
- 100kΩ NTC thermistor (Beta 3950)
- 100kΩ 0.1% precision resistor
- 0.1µF capacitor (ADC filtering)
- Arduino board (for ICSP programming)
- Breadboard + jumper wires

### Software

- MPLAB X IDE + XC8 Compiler
- Arduino IDE
- ardpicprog programmer software
- Git (for version control)

## Installation

1. **Install MPLAB X IDE**: Download from Microchip's website (free)
2. **Install XC8 Compiler**: Download from Microchip's website (free)
3. **Install Arduino IDE**: Download from arduino.cc (free)
4. **Download ardpicprog**: Clone from GitHub or download ZIP
5. **Flash Arduino with Programmer Sketch**: Open ardpicprog/Programmer/Programmer.ino in Arduino IDE and upload to your Arduino board

## Configuration

### Circuit Connections

#### OLED Display to PIC16F15214

| PIC Pin | OLED Pin | Description |
|---------|----------|-------------|
| RC3 | SCL | I2C Clock |
| RC4 | SDA | I2C Data |
| 1 (VDD) | VCC | Power (5V) |
| 14 (VSS) | GND | Ground |

#### NTC Divider Circuit

```
VDD (Pin 1)
  ↓
100kΩ 0.1% resistor
  ↓
RA0 (Pin 13) + 0.1µF to GND
  ↓
100kΩ NTC (Beta 3950)
  ↓
VSS (Pin 14) / GND
```

### Configuration Bits

The following configuration bits are critical for operation:

```c
#pragma config FEXTOSC = OFF        // External Oscillator disabled
#pragma config RSTOSC = HFINTOSC_32MHz  // 32MHz internal oscillator
#pragma config WDTE = OFF           // Watchdog Timer disabled
#pragma config MCLRE = ON           // MCLR enabled (needed for programming!)
#pragma config LVP = ON             // Low Voltage Programming enabled
#pragma config BOREN = ON           // Brown-out Reset enabled
```

## Development Commands

```bash
# 1. Clean and build the project
xc8 --build main.c

# 2. Generate HEX file
# (Done automatically by XC8 during build)

# 3. Program the PIC using ardpicprog
ardpicprog --device pic16f15214 \
           --port COM3 \          # Adjust for your Arduino port
           --erase \
           --program \
           --verify \
           --input dist/default/production/YourProject.production.hex

# 4. View compiler output/errors
# (Visible in terminal during build)
```

## Build Commands

```bash
# Build in MPLAB X
# Production → Build (or press F11)

# Output location
dist/default/production/PIC16F15214_Thermometer.production.hex
```

## Test Commands

Currently no automated tests are configured for this firmware. Manual verification involves:

1. Power the circuit and verify the OLED displays correctly
2. Read ADC value via UART (if UART output enabled)
3. Verify temperature readings match a reference thermometer
4. Verify bar gauge responds to temperature changes

## Deployment

1. Compile code in MPLAB X to generate .hex file
2. Program the PIC using ardpicprog
3. Test the deployed device
4. Monitor for proper operation

## Environment Variables

No environment variables are required for this firmware. All configuration is done through compile-time #define statements and configuration bits.

## Important Limitations

- 10-bit ADC resolution (0-1023) limits precision compared to 12-bit ADCs
- Lookup table covers range 10°C-53°C; outside this range accuracy decreases
- No EEPROM data logging (program memory constrained)
- UART output requires TTL adapter for PC connection
- Operating temperature range limited by NTC thermistor characteristics

## Security Considerations

No security features are implemented in this firmware. The device:
- Does not store credentials or secrets
- Does not network connectivity
- Has no authentication requirements
- Is intended for standalone temperature monitoring only

## Links to Detailed Documentation

- [Architecture Documentation](docs/architecture/system-overview.md)
- [Module Documentation](docs/modules/)
- [Component Documentation](docs/components/)
- [Setup Guide](docs/guides/developer-guide.md)
- [Troubleshooting](docs/troubleshooting.md)