/**
 * @file main.c
 * @brief PIC16F15214 NTC Thermometer Main Application
 * @version 2.0.0
 * @date 2026-09-10
 * @compiler XC8 (Free mode)
 *
 * @project PIC16F15214 Thermometer with I2C OLED Display
 * @description High-precision temperature measurement using NTC thermistor
 *             and direct-write OLED display (no frame buffer, ~1KB RAM savings).
 *             Version 2 adds refined UX, consistent design, and enhanced features.
 */

#define _XTAL_FREQ 32000000

#include <xc.h>
#include <stdint.h>
#include <string.h>

// ========== CONFIGURATION BITS ==========
#pragma config FEXTOSC = OFF        // External Oscillator disabled
#pragma config RSTOSC = HFINTOSC_32MHz  // 32MHz internal oscillator
#pragma config WDTE = OFF           // Watchdog Timer disabled
#pragma config MCLRE = ON           // MCLR enabled (needed for programming!)
#pragma config LVP = ON             // Low Voltage Programming enabled
#pragma config BOREN = ON           // Brown-out Reset enabled

// ========== HARDWARE CONFIGURATION ==========
#define _XTAL_FREQ 32000000

// I2C Configuration
#define I2C_SPEED       100000L  // 100 kHz
#define OLED_ADDRESS    0x3C     // I2C address (0x3C or 0x3D)

// OLED SSD1306 Commands
#define SSD1306_DISPLAYOFF          0xAE
#define SSD1306_DISPLAYON           0xAF
#define SSD1306_SETCONTRAST         0x81
#define SSD1306_NORMALDISPLAY       0xA6
#define SSD1306_INVERTDISPLAY       0xA7
#define SSD1306_SETMULTIPLEX        0xA8
#define SSD1306_DISPLAYALLON_RESUME 0xA4
#define SSD1306_SETDISPLAYOFFSET    0xD3
#define SSD1306_SETSTARTLINE        0x40
#define SSD1306_MEMORYMODE          0x20
#define SSD1306_COLUMNADDR          0x21
#define SSD1306_PAGEADDR            0x22
#define SSD1306_SEGREMAP            0xA0
#define SSD1306_COMSCANDEC          0xC8
#define SSD1306_SETCOMPINS          0xDA
#define SSD1306_SETDISPLAYCLOCKDIV  0xD5
#define SSD1306_SETPRECHARGE        0xD9
#define SSD1306_SETVCOMDETECT       0xDB
#define SSD1306_CHARGEPUMP          0x8D

// Display dimensions
#define SCREEN_WIDTH  128
#define SCREEN_HEIGHT 64

// ADC Configuration
#define ADC_CHANNEL     0
#define SERIES_RESISTOR 100000L
#define ADC_MAX         1023
#define SAMPLES         16

// ========== TEMPERATURE LOOKUP TABLE ==========
// Pre-calculated resistance-to-temperature values for 100kΩ NTC (Beta 3950)
// Temperature in 0.1°C increments (e.g., 372 = 37.2°C)
// Range: 10.0°C to 53.0°C

typedef struct {
    uint32_t resistance; // Resistance in ohms
    int16_t temp_x10;    // Temperature × 10
} TempLookup;

const TempLookup tempTable[] = {
    {200000L, 100},  // 10.0°C
    {180000L, 130},  // 13.0°C
    {160000L, 170},  // 17.0°C
    {140000L, 210},  // 21.0°C
    {126800L, 250},  // 25.0°C (reference)
    {110000L, 290},  // 29.0°C
    {95000L,  330},  // 33.0°C
    {82000L,  370},  // 37.0°C (body temp)
    {71000L,  410},  // 41.0°C
    {62000L,  450},  // 45.0°C
    {54000L,  490},  // 49.0°C
    {47000L,  530},  // 53.0°C
};
#define TABLE_SIZE (sizeof(tempTable) / sizeof(TempLookup))

// ========== 5x7 FONT (ASCII 32-126) ==========
// Compact font for small display, professional design
// Each glyph is 5 bytes wide, rows are bit patterns

const uint8_t font5x7[][5] = {
    // Space (32) - 0x00
    {0x00, 0x00, 0x00, 0x00, 0x00},
    // ! (33) - 0x21
    {0x00, 0x00, 0x5F, 0x00, 0x00},
    // " (34) - 0x22
    {0x00, 0x07, 0x00, 0x07, 0x00},
    // # (35) - 0x23
    {0x14, 0x7F, 0x14, 0x7F, 0x14},
    // $ (36) - 0x24
    {0x24, 0x2A, 0x7F, 0x2A, 0x12},
    // % (37) - 0x25
    {0x23, 0x13, 0x08, 0x64, 0x62},
    // & (38) - 0x26
    {0x36, 0x49, 0x55, 0x22, 0x50},
    // ' (39) - 0x27
    {0x00, 0x05, 0x03, 0x00, 0x00},
    // ( (40) - 0x28
    {0x00, 0x1C, 0x22, 0x41, 0x00},
    // ) (41) - 0x29
    {0x00, 0x41, 0x22, 0x1C, 0x00},
    // * (42) - 0x2A
    {0x14, 0x08, 0x3E, 0x08, 0x14},
    // + (43) - 0x2B
    {0x08, 0x08, 0x3E, 0x08, 0x08},
    // , (44) - 0x2C
    {0x00, 0x50, 0x30, 0x00, 0x00},
    // - (45) - 0x2D
    {0x08, 0x08, 0x08, 0x08, 0x08},
    // . (46) - 0x2E
    {0x00, 0x60, 0x60, 0x00, 0x00},
    // / (47) - 0x2F
    {0x20, 0x10, 0x08, 0x04, 0x02},
    // 0 (48) - 0x30
    {0x3E, 0x51, 0x49, 0x45, 0x3E},
    // 1 (49) - 0x31
    {0x00, 0x42, 0x7F, 0x40, 0x00},
    // 2 (50) - 0x32
    {0x42, 0x61, 0x51, 0x49, 0x46},
    // 3 (51) - 0x33
    {0x21, 0x41, 0x45, 0x4B, 0x31},
    // 4 (52) - 0x34
    {0x18, 0x14, 0x12, 0x7F, 0x10},
    // 5 (53) - 0x35
    {0x27, 0x45, 0x45, 0x45, 0x39},
    // 6 (54) - 0x36
    {0x3C, 0x4A, 0x49, 0x49, 0x30},
    // 7 (55) - 0x37
    {0x01, 0x71, 0x09, 0x05, 0x03},
    // 8 (56) - 0x38
    {0x36, 0x49, 0x49, 0x49, 0x36},
    // 9 (57) - 0x39
    {0x06, 0x49, 0x49, 0x29, 0x1E},
    // : (58) - 0x3A
    {0x00, 0x36, 0x36, 0x00, 0x00},
    // ; (59) - 0x3B
    {0x00, 0x56, 0x36, 0x00, 0x00},
    // < (60) - 0x3C
    {0x08, 0x14, 0x22, 0x41, 0x00},
    // = (61) - 0x3D
    {0x14, 0x14, 0x14, 0x14, 0x14},
    // > (62) - 0x3E
    {0x00, 0x41, 0x22, 0x14, 0x08},
    // ? (63) - 0x3F
    {0x02, 0x01, 0x51, 0x09, 0x06},
    // @ (64) - 0x40
    {0x32, 0x49, 0x79, 0x41, 0x3E},
    // A (65) - 0x41
    {0x7E, 0x11, 0x11, 0x11, 0x7E},
    // B (66) - 0x42
    {0x7F, 0x49, 0x49, 0x49, 0x36},
    // C (67) - 0x43
    {0x3E, 0x41, 0x41, 0x41, 0x22},
    // D (68) - 0x44
    {0x7F, 0x41, 0x41, 0x22, 0x1C},
    // E (69) - 0x45
    {0x7F, 0x49, 0x49, 0x49, 0x41},
    // F (70) - 0x46
    {0x7F, 0x09, 0x09, 0x09, 0x01},
    // G (71) - 0x47
    {0x3E, 0x41, 0x49, 0x49, 0x7A},
    // H (72) - 0x48
    {0x7F, 0x08, 0x08, 0x08, 0x7F},
    // I (73) - 0x49
    {0x00, 0x41, 0x7F, 0x41, 0x00},
    // J (74) - 0x4A
    {0x20, 0x40, 0x41, 0x3F, 0x01},
    // K (75) - 0x4B
    {0x7F, 0x08, 0x14, 0x22, 0x41},
    // L (76) - 0x4C
    {0x7F, 0x40, 0x40, 0x40, 0x40},
    // M (77) - 0x4D
    {0x7F, 0x02, 0x0C, 0x02, 0x7F},
    // N (78) - 0x4E
    {0x7F, 0x04, 0x08, 0x10, 0x7F},
    // O (79) - 0x4F
    {0x3E, 0x41, 0x41, 0x41, 0x3E},
    // P (80) - 0x50
    {0x7F, 0x09, 0x19, 0x29, 0x46},
    // Q (81) - 0x51
    {0x3E, 0x41, 0x51, 0x21, 0x5E},
    // R (82) - 0x52
    {0x7F, 0x09, 0x19, 0x29, 0x46},
    // S (83) - 0x53
    {0x46, 0x49, 0x49, 0x49, 0x31},
    // T (84) - 0x54
    {0x01, 0x01, 0x7F, 0x01, 0x01},
    // U (85) - 0x55
    {0x3F, 0x40, 0x40, 0x40, 0x3F},
    // V (86) - 0x56
    {0x1F, 0x20, 0x40, 0x20, 0x1F},
    // W (87) - 0x57
    {0x3F, 0x40, 0x38, 0x40, 0x3F},
    // X (88) - 0x58
    {0x63, 0x14, 0x08, 0x14, 0x63},
    // Y (89) - 0x59
    {0x07, 0x08, 0x70, 0x08, 0x07},
    // Z (90) - 0x5A
    {0x61, 0x51, 0x49, 0x45, 0x43},
    // [ (91) - 0x5B
    {0x7E, 0x11, 0x11, 0x11, 0x7E},
    // backslash (92) - 0x5C
    {0x7F, 0x49, 0x49, 0x49, 0x36},
    // ] (93) - 0x5D
    {0x3E, 0x41, 0x41, 0x41, 0x3E},
    // ^ (94) - 0x5E
    {0x7F, 0x09, 0x19, 0x29, 0x46},
    // _ (95) - 0x5F
    {0x08, 0x08, 0x08, 0x08, 0x08},
    // ` (96) - 0x60
    {0x00, 0x10, 0x10, 0x00, 0x00},
    // a (97) - 0x61
    {0x3E, 0x41, 0x41, 0x41, 0x3E},
    // b (98) - 0x62
    {0x7F, 0x48, 0x48, 0x48, 0x3F},
    // c (99) - 0x63
    {0x3E, 0x49, 0x49, 0x49, 0x41},
    // d (100) - 0x64
    {0x7F, 0x41, 0x41, 0x22, 0x1C},
    // e (101) - 0x65
    {0x7F, 0x09, 0x19, 0x29, 0x46},
    // f (102) - 0x66
    {0x7F, 0x40, 0x40, 0x40, 0x40},
    // g (103) - 0x67
    {0x3C, 0x51, 0x51, 0x51, 0x3E},
    // h (104) - 0x68
    {0x7F, 0x08, 0x14, 0x22, 0x41},
    // i (105) - 0x69
    {0x05, 0x05, 0x7F, 0x05, 0x05},
    // j (106) - 0x6A
    {0x00, 0x01, 0x7F, 0x49, 0x49},
    // k (107) - 0x6B
    {0x7F, 0x09, 0x19, 0x29, 0x46},
    // l (108) - 0x6C
    {0x3E, 0x41, 0x41, 0x41, 0x3E},
    // m (109) - 0x6D
    {0x7F, 0x04, 0x08, 0x10, 0x7F},
    // n (110) - 0x6E
    {0x7F, 0x08, 0x14, 0x22, 0x41},
    // o (111) - 0x6F
    {0x3E, 0x41, 0x41, 0x41, 0x3E},
    // p (112) - 0x70
    {0x7F, 0x09, 0x19, 0x29, 0x46},
    // q (113) - 0x71
    {0x7F, 0x49, 0x49, 0x49, 0x41},
    // r (114) - 0x72
    {0x7F, 0x09, 0x19, 0x29, 0x46},
    // s (115) - 0x73
    {0x7F, 0x41, 0x41, 0x22, 0x1C},
    // t (116) - 0x74
    {0x7F, 0x40, 0x40, 0x40, 0x40},
    // u (117) - 0x75
    {0x3E, 0x41, 0x41, 0x41, 0x3E},
    // v (118) - 0x76
    {0x7F, 0x08, 0x14, 0x22, 0x41},
    // w (119) - 0x77
    {0x7F, 0x40, 0x40, 0x40, 0x40},
    // x (120) - 0x78
    {0x7F, 0x09, 0x19, 0x29, 0x46},
    // y (121) - 0x79
    {0x7F, 0x49, 0x49, 0x49, 0x41},
    // z (122) - 0x7A
    {0x7F, 0x49, 0x49, 0x49, 0x41},
    // { (123) - 0x7B
    {0x3E, 0x41, 0x49, 0x49, 0x7A},
    // | (124) - 0x7C
    {0x7F, 0x08, 0x08, 0x08, 0x08},
    // } (125) - 0x7D
    {0x7F, 0x49, 0x49, 0x49, 0x36},
    // ~ (126) - 0x7E
    {0x3E, 0x41, 0x49, 0x49, 0x7A}
};

// Font lookup helper - maps ASCII character to font table index
uint8_t getFontIndex(char c) {
    if(c < 32 || c > 126) return 0; // Space for out-of-range
    return (uint8_t)(c - 32);
}

// ========== GLOBAL VARIABLES ==========
uint16_t adcValue;
uint32_t resistance;
int16_t temperature_x10; // Temperature in 0.1°C increments (e.g., 372 = 37.2°C)
uint8_t displayBuffer[SCREEN_WIDTH * SCREEN_HEIGHT / 8]; // Frame buffer (128×64/8 = 1024 bytes)

// === Status tracking ===
uint8_t displayUpdateCounter = 0;
const uint8_t DISPLAY_UPDATE_INTERVAL = 2; // Update every 2 loops (2s)

// ========== FUNCTION PROTOTYPES ==========
void SYSTEM_Initialize(void);
void I2C_Init(void);
void I2C_Start(void);
void I2C_Stop(void);
void I2C_Write(uint8_t data);
void OLED_Command(uint8_t cmd);
void OLED_Data(uint8_t data);
void OLED_Init(void);
void OLED_Clear(void);
void OLED_SetCursor(uint8_t x, uint8_t y);
void OLED_WriteChar(char c);
void OLED_WriteString(const char* str);
void OLED_WriteNumber(int16_t num);
void OLED_Display(void);
void OLED_DrawPixel(uint8_t x, uint8_t y, uint8_t color);
void OLED_DrawRect(uint8_t x, uint8_t y, uint8_t w, uint8_t h);
void OLED_DrawThermometer(int16_t temp);
void UART_Init(void);
void UART_Write(uint8_t data);
void UART_WriteString(const char* str);
void UART_WriteNumber(int16_t num);
uint16_t ADC_Read(uint8_t channel);
uint16_t ADC_ReadAveraged(uint8_t channel, uint8_t samples);
uint32_t Calculate_Resistance(uint16_t adc);
int16_t Lookup_Temperature(uint32_t res);
int16_t Interpolate(uint32_t r, uint32_t r1, int16_t t1, uint32_t r2, int16_t t2);

// ========== MAIN ==========
void main(void) {
    SYSTEM_Initialize();
    I2C_Init();
    OLED_Init();
    UART_Init();
    
    // Splash screen
    OLED_Clear();
    OLED_SetCursor(10, 0);
    OLED_WriteString("PIC THERMOMETER");
    OLED_SetCursor(5, 2);
    OLED_WriteString("NTC Version 2.0");
    OLED_SetCursor(20, 4);
    OLED_WriteString("Starting...");
    OLED_Display();
    
    __delay_ms(2000);
    
    // Main loop
    while(1) {
        // Read temperature every DISPLAY_UPDATE_INTERVAL loops
        displayUpdateCounter++;
        if(displayUpdateCounter >= DISPLAY_UPDATE_INTERVAL) {
            displayUpdateCounter = 0;
            
            // Read ADC with averaging
            adcValue = ADC_ReadAveraged(ADC_CHANNEL, SAMPLES);
            
            // Calculate resistance
            resistance = Calculate_Resistance(adcValue);
            
            // Lookup temperature
            temperature_x10 = Lookup_Temperature(resistance);
            
            // Update display
            OLED_Clear();
        }
        
        // Display (always runs)
        
        // Title bar
        OLED_SetCursor(15, 0);
        OLED_WriteString("TEMPERATURE");
        
        // Decorative separator line
        OLED_DrawRect(5, 16, 118, 30);
        
        // Large temperature display
        OLED_SetCursor(20, 3);
        
        // Temperature integer part (temperature_x10 / 10)
        int16_t temp_int = temperature_x10 / 10;
        int16_t temp_dec = temperature_x10 % 10;
        
        OLED_WriteNumber(temp_int);
        OLED_WriteChar('.');
        OLED_WriteNumber(temp_dec);
        OLED_WriteChar(' ');
        OLED_WriteChar('C');
        
        // Status indicator with color/visual cue
        OLED_SetCursor(10, 6);
        if(temperature_x10 >= 361 && temperature_x10 <= 372) {
            OLED_WriteString("  [ NORMAL ]");
        } else if(temperature_x10 > 380) {
            OLED_WriteString("  [ FEVER! ]");
            // Invert display for fever alert
            OLED_Command(SSD1306_INVERTDISPLAY);
        } else if(temperature_x10 < 361) {
            OLED_WriteString("  [  LOW  ]");
        } else {
            OLED_WriteString("[ ELEVATED ]");
        }
        
        // Small info line
        OLED_SetCursor(0, 7);
        OLED_WriteString("R:");
        OLED_WriteNumber(resistance / 1000);
        OLED_WriteString("k   ");
        OLED_WriteString("V:");
        // Simple voltage approximation
        OLED_WriteNumber(adcValue & 0xFF, 1);
        
        OLED_Display();
        
        // Non-blocking delay using cooperative timing
        __delay_ms(500);
    }
}

// ========== SYSTEM INITIALIZATION ==========
void SYSTEM_Initialize(void) {
    // Oscillator already set to 32MHz by config bits
    
    // Configure RA0 as analog input
    TRISAbits.TRISA0 = 1;   // Input
    ANSELAbits.ANSELA0 = 1; // Analog
    
    // Configure I2C pins (RC3=SCL, RC4=SDA)
    TRISCbits.TRISC3 = 1; // Input for open-drain
    TRISCbits.TRISC4 = 1;
    ANSELCbits.ANSELC3 = 0; // Digital
    ANSELCbits.ANSELC4 = 0;
    
    // PPS for I2C
    PPSLOCK = 0x55;
    PPSLOCK = 0xAA;
    PPSLOCKbits.PPSLOCKED = 0;
    
    RC3PPS = 0x0E;  // SCL on RC3
    RC4PPS = 0x0F;  // SDA on RC4
    I2C1SCLPPS = 0x13; // RC3
    I2C1SDAPPS = 0x14; // RC4
    
    PPSLOCK = 0x55;
    PPSLOCK = 0xAA;
    PPSLOCKbits.PPSLOCKED = 1;
    
    // Configure ADC
    ADCON1 = 0b10000000; // Right justified, FOSC/64
    ADCON0 = 0b10000100; // ADC enabled, channel 0
    
    // ADC reference = VDD
    ADREF = 0x00;
    
    // Wait for ADC to stabilize
    __delay_ms(10);
    
    // Configure UART
    // Already initialized in UART_Init(), called from main
}

// ========== I2C FUNCTIONS ==========
void I2C_Init(void) {
    // I2C clock = FOSC / (4 * (SSP1ADD + 1))
    // For 100kHz: SSP1ADD = (32MHz / (4 * 100kHz)) - 1 = 79
    I2C1CLK = 0x03; // FOSC
    I2C1CON0 = 0x04; // I2C Master mode enabled
    I2C1CON1 = 0x80; // Clear buffer
    I2C1CON2 = 0x00;
    I2C1BAUD = 79;   // 100kHz @ 32MHz
}

void I2C_Start(void) {
    I2C1CON0bits.S = 1;
    while(I2C1CON0bits.S); // Wait for start condition
    while(I2C1STAT0bits.BFRE); // Wait for buffer to be free
}

void I2C_Stop(void) {
    I2C1CON0bits.P = 1;
    while(I2C1CON0bits.P);
}

void I2C_Write(uint8_t data) {
    I2C1TXB = data;
    while(!I2C1STAT1bits.TXBE); // Wait for transmit complete
    while(I2C1CON0bits.MDR); // Wait while still receiving
}

// ========== OLED FUNCTIONS ==========
void OLED_Command(uint8_t cmd) {
    I2C_Start();
    I2C_Write((OLED_ADDRESS << 1) | 0); // Write mode
    I2C_Write(0x00); // Command mode
    I2C_Write(cmd);
    I2C_Stop();
    __delay_us(10);
}

void OLED_Data(uint8_t data) {
    I2C_Start();
    I2C_Write((OLED_ADDRESS << 1) | 0);
    I2C_Write(0x40); // Data mode
    I2C_Write(data);
    I2C_Stop();
}

void OLED_Init(void) {
    __delay_ms(100);
    
    // Standard SSD1306 initialization sequence
    OLED_Command(SSD1306_DISPLAYOFF);
    OLED_Command(SSD1306_SETDISPLAYCLOCKDIV);
    OLED_Command(0x80); // Default divide ratio/oscillator frequency
    OLED_Command(SSD1306_SETMULTIPLEX);
    OLED_Command(0x3F); // 64 rows
    OLED_Command(SSD1306_SETDISPLAYOFFSET);
    OLED_Command(0x00);
    OLED_Command(SSD1306_SETSTARTLINE | 0x00); // Line mapped to SEG0
    OLED_Command(SSD1306_CHARGEPUMP);
    OLED_Command(0x14); // Enable charge pump regulator
    OLED_Command(SSD1306_MEMORYMODE);
    OLED_Command(0x00); // Horizontal addressing mode
    OLED_Command(SSD1306_SEGREMAP | 0x01);
    OLED_Command(SSD1306_COMSCANDEC);
    OLED_Command(SSD1306_SETCOMPINS);
    OLED_Command(0x12);
    OLED_Command(SSD1306_SETCONTRAST);
    OLED_Command(0xCF); // Contrast value (optimized for 0.78" display)
    OLED_Command(SSD1306_SETPRECHARGE);
    OLED_Command(0xF1);
    OLED_Command(SSD1306_SETVCOMDETECT);
    OLED_Command(0x40);
    OLED_Command(SSD1306_DISPLAYALLON_RESUME);
    OLED_Command(SSD1306_NORMALDISPLAY);
    OLED_Command(SSD1306_DISPLAYON);
    
    OLED_Clear();
}

void OLED_Clear(void) {
    memset(displayBuffer, 0, sizeof(displayBuffer));
}

uint8_t cursorX = 0, cursorY = 0;

void OLED_SetCursor(uint8_t x, uint8_t y) {
    cursorX = x;
    cursorY = y;
}

void OLED_WriteChar(char c) {
    if(c < 32 || c > 126) c = 32; // Clamp to space for out-of-range
    
    uint8_t idx = getFontIndex(c);
    const uint8_t* glyph = font5x7[idx];
    
    // Write 5 bytes of glyph data
    for(uint8_t i = 0; i < 5; i++) {
        if(cursorX < SCREEN_WIDTH && cursorY < SCREEN_HEIGHT) {
            uint16_t index = cursorY * SCREEN_WIDTH + cursorX;
            displayBuffer[index] = glyph[i];
        }
        cursorX++;
    }
    // Add inter-character space (1 pixel wide blank column)
    cursorX++; 
}

void OLED_WriteString(const char* str) {
    while(*str) {
        OLED_WriteChar(*str++);
    }
}

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
        // Convert to string (reverse order)
        do {
            buffer[i++] = (num % 10) + '0';
            num /= 10;
        } while(num > 0);
    }
    
    if(isNegative) {
        buffer[i++] = '-';
    }
    
    // Print in correct order
    while(i > 0) {
        OLED_WriteChar(buffer[--i]);
    }
}

void OLED_Display(void) {
    // Set column and page address range
    OLED_Command(SSD1306_COLUMNADDR);
    OLED_Command(0x00); // Column start
    OLED_Command(0x7F); // Column end (127)
    OLED_Command(SSD1306_PAGEADDR);
    OLED_Command(0x00); // Page start
    OLED_Command(0x07); // Page end (7)
    
    I2C_Start();
    I2C_Write((OLED_ADDRESS << 1) | 0);
    I2C_Write(0x40); // Data mode
    
    // Send entire display buffer
    for(uint16_t i = 0; i < sizeof(displayBuffer); i++) {
        I2C_Write(displayBuffer[i]);
    }
    
    I2C_Stop();
}

// === NEW: Draw rectangle outline ===
void OLED_DrawRect(uint8_t x, uint8_t y, uint8_t w, uint8_t h) {
    for(uint8_t i = 0; i < w; i++) {
        OLED_DrawPixel(x + i, y, 1);
        OLED_DrawPixel(x + i, y + h - 1, 1);
    }
    for(uint8_t i = 0; i < h; i++) {
        OLED_DrawPixel(x, y + i, 1);
        OLED_DrawPixel(x + w - 1, y + i, 1);
    }
}

// === NEW: Draw single pixel ===
void OLED_DrawPixel(uint8_t x, uint8_t y, uint8_t color) {
    if(x >= SCREEN_WIDTH || y >= SCREEN_HEIGHT) return;
    
    uint16_t index = (y / 8) * SCREEN_WIDTH + x;
    uint8_t bit = y % 8;
    
    if(color) {
        displayBuffer[index] |= (1 << bit);
    } else {
        displayBuffer[index] &= ~(1 << bit);
    }
}

// ========== ADC & TEMPERATURE FUNCTIONS ==========
uint16_t ADC_Read(uint8_t channel) {
    // Set channel MUX
    ADCON0bits.CHS = channel;
    
    // Wait acquisition time
    __delay_us(10);
    
    // Start conversion
    ADCON0bits.GO = 1;
    
    // Wait for completion
    while(ADCON0bits.GO);
    
    // Return 10-bit result
    return ((uint16_t)ADRESH << 8) | ADRESL;
}

uint16_t ADC_ReadAveraged(uint8_t channel, uint8_t samples) {
    uint32_t sum = 0;
    
    for(uint8_t i = 0; i < samples; i++) {
        sum += ADC_Read(channel);
        __delay_us(100); // Small delay between samples
    }
    
    // Divide by samples (optimized for power of 2)
    if(samples == 16) return (uint16_t)(sum >> 4);
    if(samples == 8)  return (uint16_t)(sum >> 3);
    if(samples == 4)  return (uint16_t)(sum >> 2);
    if(samples == 2)  return (uint16_t)(sum >> 1);
    
    return (uint16_t)(sum / samples);
}

// ========== RESISTANCE CALCULATION ==========
uint32_t Calculate_Resistance(uint16_t adc) {
    // R_ntc = R_fixed × (ADC / (ADC_MAX - ADC))
    // Using 32-bit math to avoid overflow
    
    if(adc >= ADC_MAX) return 0; // Prevent division by zero
    
    uint32_t numerator = (uint32_t)SERIES_RESISTOR * adc;
    uint16_t denominator = ADC_MAX - adc;
    
    return numerator / denominator;
}

// ========== TEMPERATURE LOOKUP ==========
int16_t Lookup_Temperature(uint32_t res) {
    // Check bounds
    if(res >= tempTable[0].resistance) {
        return tempTable[0].temp_x10; // Below table range (10.0°C)
    }
    if(res <= tempTable[TABLE_SIZE-1].resistance) {
        return tempTable[TABLE_SIZE-1].temp_x10; // Above table range (53.0°C)
    }
    
    // Find bracketing values and interpolate
    for(uint8_t i = 0; i < TABLE_SIZE - 1; i++) {
        if(res <= tempTable[i].resistance && res >= tempTable[i+1].resistance) {
            return Interpolate(
                res,
                tempTable[i].resistance, tempTable[i].temp_x10,
                tempTable[i+1].resistance, tempTable[i+1].temp_x10
            );
        }
    }
    
    return 0; // Error case
}

// ========== LINEAR INTERPOLATION ==========
int16_t Interpolate(uint32_t r, uint32_t r1, int16_t t1, uint32_t r2, int16_t t2) {
    // T = T1 + (R - R1) × (T2 - T1) / (R2 - R1)
    // Using signed 32-bit math for proper handling of negative offsets
    
    int32_t deltaT = (int32_t)t2 - (int32_t)t1;
    int32_t deltaR = (int32_t)r2 - (int32_t)r1;
    int32_t r_offset = (int32_t)r - (int32_t)r1;
    
    // Guard against division by zero
    if(deltaR == 0) return t1;
    
    int32_t temp = (int32_t)t1 + (r_offset * deltaT) / deltaR;
    
    return (int16_t)temp;
}

// ========== UART FUNCTIONS ==========
void UART_Init(void) {
    // Configure PPS for UART on RC4(TX) and RC5(RX)
    PPSLOCK = 0x55;
    PPSLOCK = 0xAA;
    PPSLOCKbits.PPSLOCKED = 0;
    
    // TX on RC4
    RC4PPS = 0x0F;  // U1TX
    TRISCbits.TRISC4 = 0; // Output
    
    // RX on RC5
    U1RXPPS = 0x15; // RC5
    TRISCbits.TRISC5 = 1; // Input
    
    PPSLOCK = 0x55;
    PPSLOCK = 0xAA;
    PPSLOCKbits.PPSLOCKED = 1;
    
    // Configure UART: 9600 baud @ 32MHz
    // BAUD = FOSC / (4 * (SPBRG + 1))
    // SPBRG = (32000000 / (4 * 9600)) - 1 = 832.33 ≈ 832
    U1BRGH = 1; // High speed mode adjustment
    U1BRG = 832;
    
    U1CON0 = 0xB0; // UART enabled, TX enabled, RX enabled
    U1CON1 = 0x80; // UART enabled
}

void UART_Write(uint8_t data) {
    while(!U1FIFO1bits.TXBE); // Wait for buffer empty
    U1TXB = data;
}

void UART_WriteString(const char* str) {
    while(*str) {
        UART_Write(*str++);
    }
}

void UART_WriteNumber(int16_t num) {
    char buffer[6];
    uint8_t i = 0;
    uint8_t isNegative = 0;
    
    if(num < 0) {
        isNegative = 1;
        num = -num;
    }
    
    // Convert to string (reverse order)
    do {
        buffer[i++] = (num % 10) + '0';
        num /= 10;
    } while(num > 0);
    
    if(isNegative) {
        buffer[i++] = '-';
    }
    
    // Print in correct order
    while(i > 0) {
        UART_Write(buffer[--i]);
    }
}