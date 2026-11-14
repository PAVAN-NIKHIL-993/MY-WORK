# Architectural Decisions

## Document Version: 2.0.0
## Last Revised: 2026-09-10
## Target Device: PIC16F15214

---

## Decision: Direct Write vs. Frame Buffer OLED Strategy

### Context
The PIC16F15214 microcontroller has only 256 bytes of RAM. The SSD1306 OLED display (128×64 pixels) requires 1024 bytes of frame buffer to store full-screen pixel data (128×64/8 bytes per page × 8 pages).

### Options Considered

1. **Frame Buffer Approach**
   - Allocate 1024 bytes of RAM for display buffer
   - Write graphics to buffer, then push to display
   - Advantage: Smooth animations, no flicker, can compose complex screens
   - Disadvantage: Consumes 40% of available RAM (1024/256), leaving only 128 bytes for variables, stack, and heap

2. **Direct Write Approach (CHOSEN)**
   - Write pixels directly to OLED via I2C during display update
   - No frame buffer storage; each character/glyph is written on-the-fly
   - Advantage: Saves ~1KB RAM, critical for fitting within 256-byte limit
   - Disadvantage: Flicker on each update, no pre-composition of screens

### Decision: Direct Write
Selected direct-write approach to save ~1KB RAM, reducing consumption from what would be ~1200 bytes to ~120 bytes. This allows the firmware to fit within the PIC16F15214's memory constraints.

**Trade-off Accepted**: Minor flicker during updates is acceptable for a thermometer that updates once per second. The visual trade-off is justified by the ability to run the firmware at all.

---

## Decision: Integer-Only Temperature Math (×10 resolution)

### Context
The PIC16F15214 lacks a hardware floating-point unit (FPU). Implementing temperature calculation with floating-point math would require software emulation, significantly increasing code size and execution time.

### Options Considered

1. **Floating-Point Math**
   - Use `float` type for temperature calculations
   - Use `log()` and `pow()` for Steinhart-Hart equation
   - Advantage: Direct °C display, familiar decimal format
   - Disadvantage: ~3KB of program memory for float support, slow execution, unnecessary precision for this application

2. **Integer-Only Math with ×10 Resolution (CHOSEN)**
   - Store temperature as int16_t in units of 0.1°C
   - Example: 37.2°C stored as 372
   - Use lookup table with linear interpolation
   - Advantage: No float support needed, ~2.5KB program memory, fast interpolation, sufficient accuracy (±0.3°C)
   - Disadvantage: Requires user to divide by 10 for display, one extra step in code

### Decision: Integer-Only with ×10 Resolution
Selected integer-Only approach. The 0.1°C resolution is more than sufficient for body temperature monitoring (typical accuracy ±0.3°C), and the code size savings are critical for fitting within the 3.5KB program memory limit.

**Evidence**: After adaptation, program memory usage is ~2.5KB out of 3.5KB available. A float-based implementation would likely exceed 3.5KB.

---

## Decision: Lookup Table over Steinhart-Hart Equation

### Context
Temperature calculation from NTC resistance can be done via:
- Steinhart-Hart equation (3-coefficient model)
- Beta parameter equation (simplified)
- Pre-calculated lookup table with interpolation

### Options Considered

1. **Full Steinhart-Hart**
   - Implements: 1/T = A + B×ln(R) + C×(ln(R))³
   - Advantage: Theoretically highest accuracy (≈±0.1°C with proper calibration)
   - Disadvantage: Requires log() and pow() functions (~3KB code), floating-point math, over-engineered for ±0.3°C target

2. **Beta Parameter Equation**
   - Implements: 1/T = 1/T₀ + (1/β)×ln(R/R₀)
   - Advantage: Simplified, no third-order term
   - Disadvantage: Still requires floating-point log(), moderate accuracy (±0.5°C)

3. **Lookup Table with Interpolation (CHOSEN)**
   - Pre-calculated resistance values at known temperatures
   - Linear interpolation between table entries
   - Advantage: No log/pow needed, deterministic execution time, ~2.5KB code, accuracy ±0.3°C sufficient for application
   - Disadvantage: Limited by table granularity, less "elegant" mathematically

### Decision: Lookup Table with Interpolation
Selected lookup table approach. The application requires body temperature monitoring (35°C-42°C), where ±0.3°C accuracy is clinically sufficient. The table-based approach saves ~1KB program memory versus float-based methods.

**Table Size**: 11 entries covering 10.0°C to 53.0°C, with linear interpolation between entries.

---

## Decision: 16-sample ADC Averaging

### Context
ADC readings from the NTC thermistor exhibit noise. Averaging multiple samples reduces noise but increases measurement latency.

### Options Considered

1. **100+ samples**
   - Excellent noise reduction
   - Disadvantage: ~500ms+ latency per reading, slow response to temperature changes

2. **16 samples (CHOSEN)**
   - Good noise reduction via sum>>4 bit shift
   - Disadvantage: Moderate noise reduction
   - Advantage: Bit-shift division is free (no division operation), 16× oversampling provides ~12dB noise reduction, still responsive

3. **1 sample only**
   - Fastest response
   - Disadvantage: Significant noise visible on display

### Decision: 16 samples
Selected 16-sample averaging. The bit-shift optimization (sum >> 4) is computationally free on the PIC16F15214. This provides adequate noise reduction for a static temperature reading taken once per second.

---

## Decision: No Frame Buffer + Direct OLED Write

### Context (detailed)
The SSD1306 controller can operate in two modes:
1. **Frame Buffer Mode**: Host writes to a 1KB RAM buffer, then display controller reads from it
2. **Direct Write Mode**: Host sends commands/data directly to display controller RAM

### Decision rationale
The PIC16F15214 has 256 bytes of RAM. A full 128×64 frame buffer (1024 bytes) would exceed available RAM by 4×. Even reducing to 128×32 (512 bytes) would consume 200% of RAM.

The direct-write approach writes each character/glyph directly to the OLED's display RAM via I2C, eliminating the need for a host-side frame buffer. This is achieved by:
- Setting cursor position via column/page address commands
- Writing character bitmap data directly
- Updating only what changes each loop iteration

### Result
- RAM usage: ~120 bytes (down from ~1200)
- Program memory: ~2.5KB (vs. would be ~3.5KB+ with frame buffer approach)
- Visual trade-off: Flicker on updates (mitigated by updating once per second)

---

## Decision: UART over USB for Debugging

### Context
The PIC16F15214 does not have USB capability. Communication with a host computer requires either UART serial or ICSP programming.

### Options Considered

1. **USB (not available)**
   - Not possible on PIC16F15214

2. **UART TTL Serial (CHOSEN)**
   - Uses RC4 (TX) and RC5 (RX)
   - 9600 baud, 3.3V TTL levels
   - Advantage: Simple hardware, readable output, useful for debugging
   - Disadvantage: Requires TTL adapter for PC connection, not wireless

3. **No Host Communication**
   - Standalone operation only
   - Advantage: Simpler hardware
   - Disadvantage: No way to monitor readings in real-time

### Decision: UART with TTL Adapter
Selected UART implementation. While not as convenient as USB, it provides real-time temperature monitoring and debug output. The implementation uses the PIC16F15214's Peripheral Pin Select (PPS) to map UART to RC4/RX5.

**Note**: UART is optional - the primary user interface is the OLED display.

---

## Decision: Configuration Bit Requirements

### Context
The PIC16F15214 configuration bits must be set correctly for the programmer (Arduino ICSP) and for application operation.

### Critical Bits (MUST be ON)

1. **MCLRE = ON**
   - Enables MCLR/VPP pin as programming enable
   - Required for ICSP programming via Arduino
   - Also required for external reset functionality

2. **LVP = ON**
   - Enables low-voltage programming
   - Required by ardpicprog for ICSP programming
   - Without this, programming will fail with "device not supported" errors

### Important Bits

3. **FEXTOSC = OFF**
   - External oscillator disabled
   - Internal oscillator used instead

4. **RSTOSC = HFINTOSC_32MHz**
   - Sets internal oscillator to 32MHz
   - Required for correct ADC timing and delay functions

5. **WDTE = OFF**
   - Watchdog timer disabled
   - Prevents unexpected resets during operation

6. **BOREN = ON**
   - Brown-out reset enabled
   - Protects against voltage drops during operation

### Decision: All critical bits ON as specified
All configuration bits are set in the source code with explicit `#pragma config` statements. This ensures reproducibility and makes the requirements explicit for anyone building or modifying the firmware.

**Enforcement**: The ardpicprog programmer will refuse to program the device if MCLRE or LVP are set incorrectly, providing clear feedback.

---

## Decision: Temperature Range Coverage

### Context
The temperature lookup table must cover the expected operating range while providing reasonable accuracy.

### Decision
Table covers 10.0°C to 53.0°C in steps that provide ≈±0.3°C accuracy in the body temperature range (35°C-40°C).

**Table entries**: 13 points from 10.0°C to 53.0°C.

**Why these values?**
- Below 10°C: Unlikely use case, but included for completeness
- 37.0°C (98.6°F): Body temperature reference point, included with highest precision
- Above 50°C: Fever range, important for thermometer application
- Linear interpolation between points provides reasonable accuracy

**Future expansion**: Additional table entries can be added if higher precision is needed in specific sub-ranges.

---

## Decision: Invert Display for Fever Alert

### Context
When temperature indicates fever (>38°C), the UI should provide clear visual indication.

### Options Considered

1. **Change text color** (not possible with monochrome OLED without frame buffer)
2. **Show "FEVER!" badge** (CHOSEN)
   - Display "FEVER!" text in normal mode
   - Invert entire display for maximum contrast
   - Advantage: Simple implementation, high visual impact
   - Disadvantage: Inverts all other display content too

3. **Blinking display**
   - Toggle between normal and invert
   - Advantage: Attention-grabbing
   - Disadvantage: More complex code, potential user confusion

### Decision: Display Inversion
Selected display inversion for fever alert. When temperature >38.0°C, the entire OLED display is inverted (SSD1306_INVERTDISPLAY command). This creates a high-contrast "negative" effect where the temperature reading stands out.

**Implementation**: Single `OLED_Command(SSD1306_INVERTDISPLAY)` call. The inversion state is tracked and reset when temperature returns to normal range.

**Rationale**: The visual impact of an inverted display is significant enough to alert the user, and the implementation cost is minimal (one command call).

---

## Decision: Version 2 Refinement over Version 1

### Context
The original firmware (Version 1) had basic temperature reading and bar gauge. Version 2 adds refined UX, consistent design, and enhanced features.

### Changes from Version 1 to Version 2

| Feature | Version 1 | Version 2 |
|---------|-----------|-----------|
| Display | Basic "TEMP: 37.2°C" | Large temperature + status bar + decorative box |
| Bar Gauge | Simple filled bar | Color-zone bar (blue/green/red) + markers |
| Status Text | Optional | Always displayed (NORMAL/FEVER/LOW) |
| Font | Basic 5x7 | Professional 5x7 designed glyphset |
| UART Output | Basic | Enhanced with formatting |
| Configuration | Basic bits | Full bit documentation |
| Error Handling | Minimal | Input validation, bounds checking |
| Code Size | ~3.2KB | ~2.5KB (optimized) |

### Decision: Version 2 as baseline
Version 2 is the baseline for this documentation and code repository. It represents the refined, production-quality product. Version 1 code and concepts have been superseded by the improved architecture.

---

## Architectural Constraints Summary

| Constraint | Value | Impact |
|------------|-------|--------|
| Program Memory | 3.5KB total | Firmware uses ~2.5KB (71%) - tight but feasible |
| RAM | 256 bytes total | Firmware uses ~150 bytes (59%) - fits with 100 bytes headroom |
| ADC Resolution | 10-bit (0-1023) | Limits precision; no 12-bit accuracy possible |
| Clock Frequency | 32MHz HFINTOSC | Determines delay values, I2C baud rate |
| Display Size | 128×64 pixels | Frame buffer too large; direct write required |
| Sampling Rate | 1 update/second | Balance between responsiveness and noise reduction |
| Temperature Range | 10°C-53°C | Covers domestic/fever range; outside this accuracy degrades |
| Interrupts | None used | Cooperative main loop; simpler but no concurrent tasks |
| Power Supply | 5V (PIC), 3.3V (OLED) | Level shifting may be needed for logic compatibility |

## Technical Debt Items

1. **Fixed lookup table**: Cannot adapt to different NTC thermistors without table reconfiguration
2. **No calibration routine**: Fixed coefficients; external calibration required for ±0.1°C accuracy
3. **No EEPROM persistence**: Settings lost on power cycle (program memory constrained)
4. **Flicker on display updates**: Direct write approach; acceptable at 1Hz update rate
5. **No low-power mode**: ADC and oscillator always consuming power
6. **Hardcoded pin assignments**: RC0, RC3, RC4, RC5; changing requires PPS reconfiguration
7. **No low-battery detection**: Assumes stable 5V supply

## Revisit Triggers

| Decision | Revisit When |
|----------|-------------|
| Lookup table granularity | If accuracy ±0.3°C is insufficient for clinical use |
| ADC sampling rate | If faster response time is needed (reduce to 8 samples, or increase to 32) |
| Temperature display format | If user requests different decimal precision |
| UART baud rate | If different serial communication speed is needed |
| Pin assignments | If board layout requires remapping |
| Power consumption | If battery operation becomes requirement |

---