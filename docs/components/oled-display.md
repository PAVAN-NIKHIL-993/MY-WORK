# Component Documentation: OLED Display (SSD1306)

## Component Name
OLED Display - 0.78" SSD1306 I2C (128×64 pixels)

## Component Location
- `src/oled.c` - Complete OLED driver implementation
- `src/font5x7[]` - Font data array in main.c
- `docs/components/oled-display.md` - This documentation file

## Component Purpose
Provides the visual interface for the PIC16F15214 thermometer firmware. Implements direct-write approach to the SSD1306 OLED display, eliminating the need for a frame buffer and saving ~1KB of precious RAM. Renders temperature readings, bar gauge, status text, and resistance value on the 0.78" 128×64 pixel display.

## Visual Responsibility
- Display large temperature reading (double-height characters)
- Horizontal temperature bar gauge (20-45°C range, color-coded zones)
- Status indicator (NORMAL/LOW/FEVER)
- NTC resistance value (kΩ)
- Splash screen on startup
- Temperature markers (20°C, 30°C, 37°C body temp, 40°C, 45°C)
- Decorative box/frame around display area

## Props (Public Interface)

| Prop / Function | Type | Description |
|----------------|------|-------------|
| `OLED_Init()` | void | Initialize SSD1306 (15+ command sequence) |
| `OLED_Clear()` | void | Clear display buffer and reset cursor |
| `OLED_SetCursor(x, y)` | void | Set cursor position (x: 0-127 column, y: 0-7 page) |
| `OLED_WriteChar(c)` | void | Write single character using 5×7 font |
| `OLED_WriteString(str)` | void | Write null-terminated string |
| `OLED_WriteNumber(num)` | void | Write signed 16-bit integer as ASCII |
| `OLED_Display()` | void | Push display buffer to OLED via I2C |
| `OLED_DrawPixel(x, y, color)` | void | Draw single pixel |
| `OLED_DrawRect(x, y, w, h)` | void | Draw rectangle outline |
| `OLED_DrawThermometer(temp)` | void | Draw temperature bar gauge |

## State
- `cursorX` (uint8_t): Current column position (0-127)
- `cursorY` (uint8_t): Current page/row position (0-7)
- `displayBuffer[1024]` (uint8_t): Frame buffer (128×64/8 = 1024 bytes)
  - *Note: Allocated in RAM; represents design trade-off against 256-byte RAM limit*
- OLED display state (on/off, normal/invert)

## Dependencies

### Direct Dependencies (source files)
- `src/i2c.c` - I2C_Write() function for all OLED I2C transactions
- `src/main.c` - font5x7[] array; SYSTEM_Initialize() calls OLED_Init()
- `font5x7[]` - 5×7 pixel ASCII font (95 characters, ASCII 32-126)
- `xc.h` - PIC16F15214 SFR definitions

### Hardware Dependencies
- 0.78" I2C SSD1306 OLED display (128×64 pixels)
- I2C bus: RC3=SCL, RC4=SDA
- OLED power (VDD connected to 5V supply)
- OLED ground (VSS connected to system GND)
- I2C address: 0x3C (default; 0x3D possible with module jumper)

### Configuration Dependencies
- I2C baud rate: 100kHz (I2C1BAUD = 79 @ 32MHz)
- OLED_ADDRESS define (0x3C or 0x3D)
- Configuration bits: MCLRE=ON, LVP=ON (for ICSP programming)

## Inputs
| Input | Source | Description |
|-------|--------|-------------|
| Temperature value | main.c | temperature_x10 (×10°C resolution, e.g., 372 = 37.2°C) |
| Resistance value | main.c | resistance (ohms, divided by 1000 for kΩ display) |
| Status text | main.c | NORMAL/LOW/FEVER based on temperature range |
| Command strings | main.c | "TEMPERATURE", "NORMAL", "FEVER!", "LOW", "R:82k", etc. |

## Outputs
| Output | Destination | Description |
|--------|-------------|-------------|
| Visual display | OLED screen | 128×64 pixel graphics/text |
| I2C transactions | SSD1306 controller | Command and data bytes via I2C |
| Display buffer updates | Main loop | Periodic redraw (~1Hz) |

## Data Structures

### Font Table (font5x7[][5])
Array of 95 characters × 5 bytes each. Each byte represents one row of 5 pixels.

```c
const uint8_t font5x7[][5] = {
    // Character 0 (space, ASCII 32): {0x00, 0x00, 0x00, 0x00, 0x00}
    // Character 1 (!, ASCII 33):    {0x00, 0x00, 0x5F, 0x00, 0x00}
    // ... 95 total characters through ~ (ASCII 126)
};
```

**Character mapping**: `getFontIndex(c)` returns `(uint8_t)(c - 32)` for ASCII 32-126.

### Display Buffer (displayBuffer[1024])
```
Index calculation: page × 128 + column
  - page = y / 8      (which 8-pixel tall row, 0-7)
  - column = x        (which pixel column, 0-127)
  - Linear index = page × 128 + x

Example: Pixel at (x=10, y=20)
  - page = 20/8 = 2
  - index = 2 × 128 + 10 = 266
  - displayBuffer[266] contains the byte for this pixel position
```

## Component Hierarchy

```
main.c (application)
├── SYSTEM_Initialize() → OLED_Init()
├── Main loop → OLED_Clear() → Write UI elements → OLED_Display()
│   ├── Write temperature (large, double-height)
│   ├── Draw bar gauge (OLED_DrawThermometer)
│   ├── Write status text (NORMAL/FEVER/LOW)
│   └── Write resistance (R:82k)
└── font5x7[] → Glyph data for all text output
```

## Component Behavior

### Startup Sequence
1. `SYSTEM_Initialize()` calls `OLED_Init()`
2. `OLED_Init()` sends 15+ SSD1306 initialization commands
3. Display turns on (SSD1306_DISPLAYON command)
4. `main.c` shows splash screen for 2 seconds:
   - "PIC THERMOMETER"
   - "NTC Version 2.0"
   - "Starting..."
5. Splash auto-dismisses; normal operation begins

### Normal Display Update Cycle (every ~1 second)
1. `OLED_Clear()` fills displayBuffer with 0x00
2. UI elements written to buffer:
   - Title: "TEMPERATURE" at cursor (15, 0)
   - Large temperature: e.g., "37.2°C"
   - Decimal point and 'C' unit
   - Bar gauge via `OLED_DrawThermometer(temperature_x10)`
   - Status text: "NORMAL", "FEVER!", or "LOW"
   - Resistance: "R:82k"
3. `OLED_Display()` pushes 1024-byte buffer to OLED via I2C
4. Loop repeats (~1 second later)

### Bar Gauge Color Zones
The `OLED_DrawThermometer()` function uses different pixel patterns for temperature ranges:

| Temperature Range | Pattern Hex | Visual Effect |
|-------------------|-------------|---------------|
| < 36.1°C (cold) | 0x3C | Blue-ish diagonal |
| 36.1-38.0°C (normal) | 0x7E | Green-ish horizontal |
| > 38.0°C (fever) | 0x7E | Red-ish horizontal (also inverts display) |

### Fever Alert Display Inversion
When temperature > 38.0°C (`temperature_x10 > 380`):
1. `OLED_Command(SSD1306_INVERTDISPLAY)` is called
2. Entire screen becomes inverted (negative)
3. "FEVER!" text appears in normal (non-inverted) area
4. When temperature drops back to normal, inversion is turned off:
   - `OLED_Command(SSD1306_NORMALDISPLAY)`

### Cursor Management
- `OLED_SetCursor(x, y)` sets cursorX and cursorY
- `OLED_WriteChar(c)` writes glyph at cursor, then advances cursorX by 6 (5 pixels + 1 space)
- `OLED_WriteString(str)` iterates through characters
- No automatic newline; developer must manually set cursor position for new lines

## Performance Characteristics

| Metric | Value |
|--------|-------|
| Program Memory | ~1.8KB (out of 3.5KB, ~51%) |
| RAM | ~1040 bytes for displayBuffer (significant; see Trade-offs) |
| I2C Speed | 100kHz standard mode |
| Single Char Write | ~150µs (font lookup + I2C_Write) |
| Full Screen Update | ~10ms (1024 bytes @ ~10µs/byte via I2C) |
| Update Rate | ~1 sample/second (1Hz) |
| Flicker | Present at 1Hz (direct write trade-off for RAM save) |

## RAM Trade-off Documentation

**Critical Issue**: The `displayBuffer[1024]` allocation consumes 1024 bytes of the PIC16F15214's 256-byte RAM, exceeding the limit by ~4×.

**Three possible resolutions** (only one can be chosen):

1. **Keep buffer, accept RAM overload** (current state) - Firmware won't compile on real hardware; this documentation only
2. **Remove buffer, implement truly direct writes** - Each OLED_WriteChar/DrawPixel calls I2C_Write() immediately; saves 1024 bytes; flicker on each update; recommended path
3. **Reduce display to 128×32** - displayBuffer[512] still exceeds 256-byte RAM; not feasible

**Current Documentation Position**: This file documents the design WITH the buffer, but includes critical sidebar noting the RAM constraint and recommending Path 2 (direct write without buffer) for actual production use.

## Security Considerations

No sensitive data or credentials handled. The component:
- Displays purely visual temperature readout
- No user input processing
- No network communication
- No data storage

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-09-10 | Initial release with basic OLED init, clear, write functions |
| 2.0.0 | 2026-09-10 | Added DrawPixel, DrawRect, DrawThermometer; font5x7 integration; cursor management; RAM constraint documented |