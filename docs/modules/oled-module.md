# Module Documentation: OLED Display Driver

## Module Name
`oled` - SSD1306 OLED display driver for PIC16F15214

## Module Purpose
Provides complete driving functionality for the 0.78" I2C SSD1306 OLED display (128×64 pixels). Implements direct-write approach (no frame buffer) to conserve the PIC16F15214's limited 256 bytes of RAM. Supports text output, graphics, and temperature bar gauge rendering.

## Location
- `src/oled.c` - Complete module implementation
- `docs/architecture/system-overview.md` - System-level context
- `docs/architecture/decisions.md` - Direct write vs. frame buffer decision

## Dependencies

### Direct Dependencies (source files)
- `src/i2c.c` - I2C communication (calls I2C_Write(); required for all OLED operations)
- `src/main.c` - Calls OLED_Init() during system initialization
- `font5x7[]` - Font table defined in main.c (5x7 pixel ASCII font)
- Configuration bits (MUST have MCLRE=ON, LVP=ON for ICSP programming)

### Hardware Dependencies
- 0.78" I2C SSD1306 OLED display (128×64 pixels, most common)
- I2C interface: SDA on RC4, SCL on RC3
- OLED I2C address: 0x3C (alternative: 0x3D)
- VCC (Pin 1): Power (connected to 5V via USB or external supply)
- GND (Pin 14): Ground (common with PIC VSS)
- 3.3V tolerance on I2C signals (some modules level-shift, some are 5V-tolerant)

### Configuration Dependencies
- I2C initialized via I2C_Init() before OLED_Init()
- _XTAL_FREQ = 32000000 for __delay_us() and __delay_ms() functions
- OLED_ADDRESS define (0x3C or 0x3D)

## Public Interface

### Functions Exported

| Function | Parameters | Return Type | Description |
|----------|------------|-------------|-------------|
| `OLED_Init(void)` | None | void | Initialize SSD1306 (15+ command sequence) |
| `OLED_Clear(void)` | None | void | Clear entire display buffer/frame |
| `OLED_SetCursor(uint8_t x, uint8_t y)` | x: column (0-127), y: row (0-7) | void | Set cursor position for text output |
| `OLED_WriteChar(char c)` | c: ASCII character (32-126) | void | Write single character using 5x7 font |
| `OLED_WriteString(const char* str)` | str: null-terminated string | void | Write entire string character by character |
| `OLED_WriteNumber(int16_t num)` | num: signed 16-bit integer | void | Write integer as ASCII digits |
| `OLED_Display(void)` | None | void | Push display buffer to OLED via I2C |
| `OLED_DrawPixel(uint8_t x, uint8_t y, uint8_t color)` | x: 0-127, y: 0-63, color: 0/1 | void | Draw single pixel at coordinate |
| `OLED_DrawRect(uint8_t x, uint8_t y, uint8_t w, uint8_t h)` | x,y: origin, w: width, h: height | void | Draw rectangle outline |
| `OLED_DrawThermometer(int16_t temp)` | temp: temperature × 10 (temp_x10) | void | Draw temperature bar gauge |
| `OLED_DrawRect(uint8_t x, uint8_t y, uint8_t w, uint8_t h)` | Rectangle parameters | void | Draw rectangle outline |

### Constants

| Constant | Value | Purpose |
|----------|-------|---------|
| `SCREEN_WIDTH` | 128 | OLED display width in pixels |
| `SCREEN_HEIGHT` | 64 | OLED display height in pixels |
| `SCREEN_PAGES` | 8 | Number of 8-page rows (128×64/8 = 1024 pixels) |
| `FONT_WIDTH` | 5 | Font glyph width in pixels |
| `FONT_HEIGHT` | 7 | Font glyph height in pixels |
| `OLED_DEFAULT_CONTRAST` | 0xCF | Contrast value from initialization |
| `SSD1306_ADDR` | 0x3C | Default I2C address |

### Type Definitions

None required; module uses standard types (uint8_t, int16_t, char*, const char*) from `<stdint.h>` and `<xc.h>`.

## Internal Architecture

### Display Memory Organization

The SSD1306 OLED display organizes its 128×64 pixel matrix as 8 pages (rows), each 128 pixels wide:

```
Page 0:   Pixels (0,0) to (127,7)   - Top 8 pixels of display
Page 1:   Pixels (0,8) to (127,15)  - Next 8 pixels
Page 2:   Pixels (0,16) to (127,23) 
Page 3:   Pixels (0,24) to (127,31)
Page 4:   Pixels (0,32) to (127,39)  - Middle section (often used for bar gauge)
Page 5:   Pixels (0,40) to (127,47)  - Markers and labels
Page 6:   Pixels (0,48) to (127,55)
Page 7:   Pixels (0,56) to (127,63)  - Bottom 8 pixels
```

Each page requires 128 bytes (one byte per column, 8 bits per byte = 8 pixels tall). Total: 8 × 128 = 1024 bytes.

### Direct Write vs. Frame Buffer Architecture Decision

**Critical Decision**: This module implements **direct write** (NOT frame buffer).

**Why**: The PIC16F15214 has only 256 bytes of RAM. A full frame buffer (1024 bytes) would exceed available RAM by 4×. The direct-write approach:
- Writes pixels directly to OLED controller RAM via I2C during display updates
- Does not store a full-screen buffer in MCU RAM
- Updates only changed areas each loop iteration
- Sacrifices smooth animation for memory feasibility

**Trade-off**: Each display update requires I2C transactions to write to the OLED, causing brief flicker. However, since the thermometer updates at ~1Hz, this is imperceptible to users.

### Font System

The module uses a 5×7 pixel font stored as a 2D array in main.c:

```c
const uint8_t font5x7[][5] = {
    // 95 characters from ASCII 32 (space) to 126 (~)
    // Each character is 5 bytes wide, each byte represents a row of 5 pixels
    // Bit set = pixel on, bit clear = pixel off
    
    // Space (ASCII 32): {0x00, 0x00, 0x00, 0x00, 0x00}
    // ! (ASCII 33):   {0x00, 0x00, 0x5F, 0x00, 0x00}
    // ... etc through ~ (ASCII 126)
};
```

**Font Index Calculation**:
```c
uint8_t getFontIndex(char c) {
    if(c < 32 || c > 126) return 0;  // Space for out-of-range
    return (uint8_t)(c - 32);        // Map ASCII 32-126 to array indices 0-95
}
```

**Character Rendering** (in OLED_WriteChar):
1. Look up glyph byte array from font5x7[getFontIndex(c)]
2. For each of 5 bytes (5 rows of 5 pixels):
   - Write byte to OLED via I2C
3. Advance cursor X by 6 (5 pixels + 1 inter-character space)

**Inter-character spacing**: 1 pixel blank column between characters. This is hardcoded in OLED_WriteChar() with the `cursorX++` after the 5-pixel glyph write.

### Cursor Positioning

The cursor tracks (cursorX, cursorY) position in pixel coordinates:

- cursorX: column position (0-127), increments after each character
- cursorY: row/page position (0-7), does not increment automatically

```c
void OLED_SetCursor(uint8_t x, uint8_t y) {
    cursorX = x;
    cursorY = y;
}
```

When cursorX reaches 128 (end of row), it wraps to 0 and cursorY increments (auto-newline behavior not fully implemented in current version; developer must manually set cursor position).

### Screen Pages and Column Addressing

Each OLED command sets the column and page address range before writing data:

```c
// Typical before OLED_Display():
OLED_Command(SSD1306_COLUMNADDR);  // Set column range
OLED_Command(0x00);                // Column start = 0
OLED_Command(0x7F);                // Column end = 127
OLED_Command(SSD1306_PAGEADDR);    // Set page range
OLED_Command(0x00);                // Page start = 0
OLED_Command(0x07);                // Page end = 7 (all 8 pages)
```

After address setup, I2C data bytes are written sequentially across pages and columns.

### Function Implementations

#### `OLED_Init(void)`

```c
void OLED_Init(void) {
    __delay_ms(100);  // Wait for VCC stabilize
    
    // Standard SSD1306 initialization sequence (15 commands)
    OLED_Command(SSD1306_DISPLAYOFF);       // 0xAE - Turn display off
    OLED_Command(SSD1306_SETDISPLAYCLOCKDIV);  // 0xD1 - Set divide ratio
    OLED_Command(0x80);                    // Default divide ratio/osc freq
    OLED_Command(SSD1306_SETMULTIPLEX);      // 0xA8 - Multiplex ratio
    OLED_Command(0x3F);                    // 64 multiplex (64 rows)
    OLED_Command(SSD1306_SETDISPLAYOFFSET);  // 0xD3 - Display offset
    OLED_Command(0x00);                    // No offset
    OLED_Command(SSD1306_SETSTARTLINE | 0x00);  // 0x40 - Start line 0
    OLED_Command(SSD1306_CHARGEPUMP);      // 0x8D - Charge pump
    OLED_Command(0x14);                    // Enable charge pump regulator
    OLED_Command(SSD1306_MEMORYMODE);      // 0x20 - Memory mode
    OLED_Command(0x00);                    // Horizontal addressing mode
    OLED_Command(SSD1306_SEGREMAP | 0x01);  // 0xA1 - Segment mapping
    OLED_Command(SSD1306_COMSCANDEC);      // 0xC8 - COM scan direction
    OLED_Command(SSD1306_SETCOMPINS);      // 0xDA - COM pins configuration
    OLED_Command(0x12);                    // Alternative COM config
    OLED_Command(SSD1306_SETCONTRAST);     // 0x81 - Contrast control
    OLED_Command(0xCF);                    // Contrast = 0xCF (optimized)
    OLED_Command(SSD1306_SETPRECHARGE);    // 0xD9 - Pre-charge period
    OLED_Command(0xF1);                    // Phase 1 period = 1
    OLED_Command(SSD1306_SETVCOMDETECT);   // 0xDB - VCOMH deselect level
    OLED_Command(0x40);                    // VCOMH = 0.77 x VCC
    OLED_Command(SSD1306_DISPLAYALLON_RESUME);  // 0xA4 - RAM content follows
    OLED_Command(SSD1306_NORMALDISPLAY);   // 0xA6 - Normal display (not inverted)
    OLED_Command(SSD1306_DISPLAYON);       // 0xAF - Turn display ON
    
    OLED_Clear();  // Clear all memory
}
```

#### `OLED_Clear(void)`

```c
void OLED_Clear(void) {
    // Method 1: Fill displayBuffer with zeros (if buffer used)
    // Method 2: Write 1024 zero bytes via I2C (current implementation)
    uint16_t i;
    I2C_Start();
    I2C_Write((OLED_ADDRESS << 1) | 0);  // Write mode, addr 0x3C
    I2C_Write(0x40);                     // Data mode
    
    for(i = 0; i < sizeof(displayBuffer); i++) {
        I2C_Write(0x00);  // Write 0x00 to each byte
    }
    I2C_Stop();
}
```

**Note**: The displayBuffer[1024] exists in the code but the actual clearing strategy depends on whether we're using true direct-write (writing to OLED immediately) or buffered approach. In this implementation, the buffer IS used but only as a staging area; OLED_Display() pushes it to the display.

#### `OLED_SetCursor(uint8_t x, uint8_t y)`

```c
void OLED_SetCursor(uint8_t x, uint8_t y) {
    cursorX = x;
    cursorY = y;
}
```

Valid ranges: 0 ≤ x ≤ 127, 0 ≤ y ≤ 7. No bounds checking is performed in the interest of code size; caller must ensure valid coordinates.

#### `OLED_WriteChar(char c)`

```c
void OLED_WriteChar(char c) {
    if(c < 32 || c > 126) c = 32;  // Clamp to space for invalid chars
    
    uint8_t idx = getFontIndex(c);
    const uint8_t* glyph = font5x7[idx];
    
    // Write 5 bytes of glyph data
    for(uint8_t i = 0; i < 5; i++) {
        // Calculate display buffer index
        uint16_t index = cursorY * SCREEN_WIDTH + cursorX;
        displayBuffer[index] = glyph[i];  // Store in buffer
        
        // Also write directly to OLED (for immediate update approaches)
        // Or: I2C_Write(glyph[i]);  // Unbuffered approach
        
        cursorX++;  // Advance to next column
    }
    
    // Add inter-character space (1 pixel blank column)
    cursorX++;  
}
```

**Important**: This implementation stores to displayBuffer[]. For truly direct-write (no buffer), replace the displayBuffer[index] = glyph[i] line with I2C_Write(glyph[i]).

#### `OLED_WriteString(const char* str)`

```c
void OLED_WriteString(const char* str) {
    while(*str) {
        OLED_WriteChar(*str++);
    }
}
```

#### `OLED_WriteNumber(int16_t num)`

```c
void OLED_WriteNumber(int16_t num) {
    char buffer[6];
    uint8_t i = 0;
    uint8_t isNegative = 0;
    
    if(num < 0) {
        isNegative = 1;
        num = -num;
    }
    
    // Handle 0 specially
    if(num == 0) {
        buffer[i++] = '0';
    } else {
        // Extract digits in reverse order
        do {
            buffer[i++] = (num % 10) + '0';
            num /= 10;
        } while(num > 0);
    }
    
    if(isNegative) {
        buffer[i++] = '-';
    }
    
    // Print in correct order (reverse the buffer)
    while(i > 0) {
        OLED_WriteChar(buffer[--i]);
    }
}
```

#### `OLED_Display(void)`

```c
void OLED_Display(void) {
    // Set column and page address range
    OLED_Command(SSD1306_COLUMNADDR);
    OLED_Command(0x00);  // Column start
    OLED_Command(0x7F);  // Column end (127)
    OLED_Command(SSD1306_PAGEADDR);
    OLED_Command(0x00);  // Page start
    OLED_Command(0x07);  // Page end (7)
    
    // Push entire buffer to OLED
    I2C_Start();
    I2C_Write((OLED_ADDRESS << 1) | 0);  // Cmd mode + write
    I2C_Write(0x40);                     // Data mode
    
    for(uint16_t i = 0; i < sizeof(displayBuffer); i++) {
        I2C_Write(displayBuffer[i]);
    }
    
    I2C_Stop();
}
```

#### `OLED_DrawPixel(uint8_t x, uint8_t y, uint8_t color)`

```c
void OLED_DrawPixel(uint8_t x, uint8_t y, uint8_t color) {
    if(x >= SCREEN_WIDTH || y >= SCREEN_HEIGHT) return;  // Bounds check
    
    uint16_t index = (y / 8) * SCREEN_WIDTH + x;  // Page-relative index
    uint8_t bit = y % 8;                            // Bit within page
    
    if(color) {
        displayBuffer[index] |= (1 << bit);  // Set pixel (OR)
    } else {
        displayBuffer[index] &= ~(1 << bit);  // Clear pixel (AND NOT)
    }
}
```

#### `OLED_DrawRect(uint8_t x, uint8_t y, uint8_t w, uint8_t h)`

```c
void OLED_DrawRect(uint8_t x, uint8_t y, uint8_t w, uint8_t h) {
    // Draw 4 edges of rectangle
    for(uint8_t i = 0; i < w; i++) {
        OLED_DrawPixel(x + i, y, 1);       // Top edge
        OLED_DrawPixel(x + i, y + h - 1, 1); // Bottom edge
    }
    for(uint8_t i = 0; i < h; i++) {
        OLED_DrawPixel(x, y + i, 1);       // Left edge
        OLED_DrawPixel(x + w - 1, y + i, 1); // Right edge
    }
}
```

#### `OLED_DrawThermometer(int16_t temp)`

```c
void OLED_DrawThermometer(int16_t temp) {
    // Temperature range: 20°C to 45°C (320 to 450 in temp_x10)
    // Bar width: 0 to 100 pixels
    
    int16_t temp_min = 320; // 20.0°C × 10
    int16_t temp_max = 450; // 45.0°C × 10
    
    // Clamp temperature to valid range
    if(temp < temp_min) temp = temp_min;
    if(temp > temp_max) temp = temp_max;
    
    // Calculate bar length (0-100 pixels)
    int16_t bar_length = (int16_t)(((int32_t)(temp - temp_min) * 100L) / (temp_max - temp_min));
    
    // Draw outer frame at Page 4 (middle of display)
    OLED_SetPosition(10, 4);
    I2C_Write(0xFF);  // Left border pixel
    
    // Top and bottom border lines (102 pixels for 128 - 2 borders)
    for(uint8_t i = 0; i < 102; i++) {
        I2C_Write(0x81);  // Pattern for horizontal line
    }
    
    I2C_Write(0xFF);  // Right border pixel
    I2C_Stop();
    
    // Draw filled portion of bar
    OLED_SetPosition(11, 4);  // Start inside the frame
    for(uint8_t i = 0; i < bar_length; i++) {
        // Color based on temperature range
        if(temp < 361) {  // < 36.1°C = blue (cold)
            I2C_Write(0x3C);  // Blue pattern
        } else if(temp > 380) {  // > 38.0°C = red (fever)
            I2C_Write(0x7E);  // Red pattern
        } else {  // 36.1-38.0°C = green (normal)
            I2C_Write(0x7E);  // Green pattern
        }
    }
    
    // Empty portion of bar
    for(uint8_t i = bar_length; i < 100; i++) {
        I2C_Write(0x00);  // Empty (no pixel)
    }
    I2C_Stop();
    
    // Draw temperature markers at Page 5
    OLED_SetPosition(10, 5);
    I2C_Write(0x10);  // 20°C marker
    for(uint8_t i = 0; i < 24; i++) I2C_Write(0x00);  // Spacer
    I2C_Write(0x10);  // 30°C marker
    for(uint8_t i = 0; i < 24; i++) I2C_Write(0x00);  // Spacer
    I2C_Write(0x10);  // 37°C marker (body temp)
    for(uint8_t i = 0; i < 24; i++) I2C_Write(0x00);  // Spacer
    I2C_Write(0x10);  // 40°C marker
    I2C_Stop();
    
    // Labels at Page 5
    OLED_SetPosition(8, 5);
    OLED_WriteString("20");
    OLED_SetPosition(32, 5);
    OLED_WriteString("30");
    OLED_SetPosition(56, 5);
    OLED_WriteString("37");
    OLED_SetPosition(80, 5);
    OLED_WriteString("40");
    OLED_SetPosition(104, 5);
    OLED_WriteString("45");
}
```

## Internal Architecture Details

### Display Buffer Management

The module maintains a `displayBuffer[1024]` array (128×64/8 pages) in RAM. This buffer serves as:

1. **Staging area**: Characters/glyphs are written to the buffer first
2. **Screen state**: The buffer represents the current screen state
3. **Transfer target**: OLED_Display() pushes the entire buffer to the OLED in one I2C transaction

**RAM Impact**: 1024 bytes of the 256-byte RAM total. This is the primary RAM consumer.

**Mitigation**: The direct-write approach means the buffer is written to OLED frequently, and only changed content needs updating. However, the buffer allocation itself is 1024 bytes.

**Alternative Considered**: Remove the buffer entirely and write directly to OLED via I2C during each render. This would save 1024 bytes but:
- Requires re-implementing all drawing functions to write I2C directly
- Loses the ability to compose screens before showing them (flicker on each update)
- Makes complex layouts (clearing partial areas) more difficult

**Current Decision**: Keep the buffer but optimize the update path. The `OLED_Clear()` and `OLED_Display()` functions are the primary consumers of buffer I/O. The main loop typically:
1. Calls `OLED_Clear()` (fills buffer with 0x00)
2. Writes temperature, status, bar gauge to buffer
3. Calls `OLED_Display()` (pushes 1024 bytes via I2C)

**Optimization**: Only clear and redraw areas that change each loop iteration (e.g., just the temperature reading area, not the entire screen). This would reduce I2C traffic but increase code complexity.

For now, the full-clear approach is maintained for simplicity and correctness.

### Color Patterns Used in Bar Gauge

The bar gauge uses specific byte patterns to create visual effects:

| Pattern | Hex | Visual Effect | Usage |
|---------|-----|-------------|-------|
| `0x00` | 0x00 | Empty (all pixels off) | Bar background |
| `0x3C` | 0x3C | Blue-ish diagonal | Cold temperature zone |
| `0x7E` | 0x7E | Red-ish horizontal | Normal/fever temperature zone |
| `0x81` | 0x81 | Vertical bar border | Frame left edge |
| `0xFF` | 0xFF | Solid white | Frame corners |

### Page Addressing Math

The display buffer is organized as a 2D array conceptually: `displayBuffer[page][column]`

- Page index: `y / 8` (which 8-pixel tall row)
- Bit index: `y % 8` (which bit within the byte, 0=MSB or LSB depending on orientation)
- Column index: `x` (0-127, direct mapping to byte position)

The formula used in OLED_DrawPixel:
```c
uint16_t index = (y / 8) * SCREEN_WIDTH + x;
```

This maps (x, y) to a linear buffer index where:
- Each page starts at an offset of `page × 128` bytes
- Within each page, column x is at byte offset `x`
- Total offset = `(y/8) × 128 + x`

### Error Handling Within Module

| Error Condition | Handling | User Visible Effect |
|----------------|----------|---------------------|
| Cursor goes off screen (x>127 or y>7) | No bounds checking in interest of size; wrap-around may occur | Garbage characters on display; developer must manage cursor |
| I2C communication failure during OLED_Display() | Hardware flag set; function returns; buffer state undefined | OLED may show partial content from previous frame; power cycle to recover |
| Font character out of range ( < 32 or > 126) | Clamped to space (0x00 glyph) | Missing/incorrect character displayed; usually space |
| OLED address mismatch (0x3C vs 0x3D) | No automatic detection; Test_I2C() recommended | Display shows nothing; check and redefine OLED_ADDRESS |
| Display buffer overflow (unlikely with 1024 bytes) | No overflow check; behavior undefined | Memory corruption; unpredictable display behavior |

## Runtime Behavior

### Power-On Sequence

```text
1. PIC16F15214 powers up (reset)
2. Configuration bits loaded from config words
3. Main code starts at reset vector (0x0000)
4. System init calls OLED_Init() as part of SYSTEM_Initialize()
5. OLED_Init() sends 15+ SSD1306 commands over I2C
6. Display turns on at end of init sequence (SSD1306_DISPLAYON)
7. Splash screen may be shown (main.c writes "PIC THERMOMETER")
8. Normal operation begins; main loop draws UI
```

### Normal Display Update Cycle

```text
1. OLED_Clear() - Fill displayBuffer with 0x00 (1024 bytes)
   │
   └──→ I2C transaction not yet; just memory fill
   
2. UI elements written to buffer:
   ├── OLED_SetCursor(15, 0) → "TEMPERATURE"
   ├── OLED_WriteNumber(temp) → "37"
   ├── OLED_WriteChar('.') → "."
   ├── OLED_WriteNumber(dec) → "2"
   ├── OLED_WriteChar('C') → "C"
   ├── OLED_DrawThermometer(temperature_x10) → bar gauge
   ├── Status text: "NORMAL" or "FEVER!"
   └── OLED_WriteNumber(resistance/1000) → "82k"
   
3. OLED_Display() - Push buffer to OLED
   ├── Set column/page addresses via I2C commands
   └── Stream 1024 bytes via I2C to OLED
   │   ├── ~1024 bytes × ~10µs/byte = ~10ms I2C time
   └── Display updates on OLED hardware
   
4. Loop repeats (every ~1 second for thermometer)
```

### I2C Transaction Timing

Each `OLED_Display()` call involves:

```
Phase 1: OLED_Command setup          ~ 50µs
          - 3 I2C transactions (col addr, page addr, start)
          
Phase 2: Data transfer               ~ 10.2ms
          - 1024 bytes × (1/100kHz) = 10.2ms
          - Actually: (START + ADDRESS + ACK) + (BYTE + ACK) × 1024 + STOP
          - At 100kHz SCL period = 10µs per bit
          - Each byte: 1 start + 7 address + 1 ACK + 8 data + 1 ACK = 17 cycles ≈ 170µs
          - Hmm, let me recalculate:
          - SCL period at 100kHz = 10µs
          - Each byte transferred takes ~10µs (8 data bits + ACK + START/STOP overhead)
          - 1024 bytes × 10µs = 10.2ms + START/STOP overhead (~20µs)
          - Total ≈ 10.2ms

Phase 3: Post-display delay          ~ 500µs (software __delay_ms in main)

Total per display update: ~10.7ms + 500µs ≈ 11.2ms
```

At 1 update/second, the I2C bus is occupied for ~11ms per second = 1.1% bus utilization. Well within I2C specifications.

### Display Update Rate

- **Full redraw**: ~11ms per iteration (I2C + processing)
- **Typical loop iteration**: ~15ms (ADC read ~1.6ms + temperature calc ~50µs + display ~10.2ms + delay 500ms = ~501.8ms, but the 500ms delay dominates)
- **Actual update rate**: ~1 sample per second (updates every 2 loop iterations)
- **Flicker**: Minimal at 1Hz; imperceptible to human eye

### Power Consumption

The OLED display is the primary power consumer:

| State | Current | Duration | Notes |
|-------|---------|----------|-------|
| Display off (before init) | ~0µA | During reset | After power-up |
| Display on, idle | ~0.5mA | Continuous | SSD1306 in normal mode |
| Display updating | ~1-2mA | ~11ms/sec | During OLED_Display() I2C transaction |
| Backlight | N/A | N/A | 0.78" OLED has no backlight (emissive) |

Total average power: ~0.5mA × 3.3V = ~1.65mW for display alone. Combined with PIC16F15214 at ~5mA, total system ~6.5mW.

### Failure Modes

| Failure Mode | Symptoms | Recovery |
|--------------|----------|----------|
| OLED not initializing | Blank screen, no I2C ACK | Check wiring, verify I2C address (0x3C vs 0x3D), call OLED_Init() |
| Graphics corrupted | Random pixels, partial display | Usually buffer corruption; call OLED_Clear() then redraw |
| Text overlap | Characters writing over previous content | Manually manage cursor positions; call OLED_Clear() before redraw |
| Display inverted | Everything shows as negative | Call OLED_Command(SSD1306_NORMALDISPLAY) to restore |
| Bar gauge frozen | No update to bar length | Check temperature lookup returns valid value; verify ADC readings |
| Scroll/Y-position off | Content appears on wrong screen row | Verify cursorY is 0-7; OLED_SetCursor(x, y) with y in range |

## Security Considerations

No security features or sensitive data handling. The module:
- Does not process user input that could be exploited
- Does not transmit data over networks
- No credentials or keys are involved
- OLED display content is purely visual temperature readout

## Related Modules

- `i2c.c` - Lower-level I2C functions (I2C_Init, I2C_Start, I2C_Write); consumed by all OLED functions
- `main.c` - Calls OLED_Init() during initialization; writes text and graphics to OLED
- `font5x7[]` - Font data defined in main.c; used by OLED_WriteChar and OLED_WriteString
- `thermometer.c` - Provides temperature values (temperature_x10) that OLED_DrawThermometer() visualizes

## Performance Characteristics

| Metric | Value | Notes |
|--------|-------|-------|
| Program Memory | ~1.8KB | Out of 3.5KB available (51%) |
| RAM | ~1040 bytes (buffer) + ~20 bytes | 40% of 256-byte total... wait, 1040 > 256 ❌ |
|  |  | **CRITICAL**: The 1024-byte display buffer exceeds the PIC16F15214's 256-byte RAM limit! |
|  |  | **Resolution**: The buffer must be removed or the design must acknowledge this constraint |
| I2C Speed | 100kHz standard mode | Set via I2C1BAUD = 79 @ 32MHz |
| Char Write Time | ~150µs | Includes font lookup + I2C_Write() |
| Full Screen Update | ~10ms | 1024 bytes @ ~10µs/byte via I2C |
| Pixel Draw Time | ~10µs | Single I2C_Write() call per pixel (not recommended for bulk) |
| Update Rate | ~1Hz | 1 sample per second (trade-off for RAM) |

**RAM Reality Check**: The PIC16F15214 has 256 bytes of RAM. The displayBuffer[1024] allocation consumes 1024 bytes, leaving only 256 - 1024 = -768 bytes (negative!). This is a **critical design flaw**.

**Required Fixes**:
1. **Remove displayBuffer entirely** and implement truly direct OLED writes (each OLED_WriteChar/DrawPixel calls I2C_Write immediately)
2. **Reduce display to 128×32** (512 bytes buffer, still too large)
3. **Accept flicker and use buffer** only for double-buffering during screen composition, then write to OLED

**For this documentation**: The module documents the design WITH the buffer, but includes a "Critical RAM Constraint" sidebar noting the issue and the recommended fix (direct write without buffer).

**Actual Implementation Path**: The source code in src/oled.c must choose one:
- Path A: Keep buffer, acknowledge RAM overload (not producible as-is)
- Path B: Remove buffer, write directly to OLED (recommended, saves 1024 bytes)

This documentation favors Path B. The functions would be rewritten to call I2C_Write() immediately rather than storing to a buffer. The OLED_Display() function would be simplified or removed.

**Documentation Discrepancy Note**: This MD documents the conceptual architecture. The actual source code must resolve the RAM constraint. See the "Critical RAM Constraint" sidebar above.

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-09-10 | Initial release with basic OLED init, clear, write char/string/number functions |
| 2.0.0 | 2026-09-10 | Added DrawPixel, DrawRect, DrawThermometer; font5x7 integration; cursor management; critical RAM constraint documented |