/*
 * clinical thermometer firmware - STC15W408AS (8051, Keil C51)
 *
 * ---------------------------------------------------------------------------
 * STATUS: DESIGN SKETCH - NOT BUILDABLE AS-IS
 *
 * This file is the firmware skeleton recorded during the original design
 * session. It does not compile, for these reasons:
 *
 *   1. `temp_table[256]` is an empty placeholder - the ADC-to-temperature
 *      mapping was never generated.
 *   2. LCD_display, LCD_display_float, LCD_show_fever_icon, LCD_init,
 *      ADC_init, ADC_read, Timer0_init, EEPROM_read, EEPROM_read_int16,
 *      Buzzer_beep, delay_us, lookup_temp, temp_stable_for, idle_time and
 *      power_down are all declared by use but never defined.
 *   3. `3_seconds` is not valid C and `idle_time` is never incremented.
 *   4. -Wall would also flag the implicit float->int conversions.
 *
 * What it *does* document is the intended control flow and the calibration
 * contract (halt if uncalibrated, load an offset from EEPROM, oversample the
 * ADC 64x, look up temperature, beep on stability, auto power off). Treat it
 * as a specification, not as source.
 * ---------------------------------------------------------------------------
 */

// Compiled to .hex and burned before SMT placement.

#include <STC15.h>

// EEPROM addresses for calibration
#define CAL_FLAG_ADDR   0x0000
#define CAL_OFFSET_ADDR 0x0001  // int16_t

// Lookup table (Steinhart-Hart pre-calculated)
const int16_t temp_table[256] = { /* ADC→Temp mapping */ };

void main(void) {
    uint16_t adc_sum = 0;
    int16_t cal_offset;
    float temp;
    
    // Check if calibrated
    if (EEPROM_read(CAL_FLAG_ADDR) != 0xAA) {
        LCD_display("--CAL--");
        while(1);  // Halt if uncalibrated
    }
    
    // Load calibration offset
    cal_offset = EEPROM_read_int16(CAL_OFFSET_ADDR);
    
    // Initialize peripherals
    ADC_init();          // 10-bit, internal 2.5V ref
    Timer0_init();       // 200ms tick for sampling
    LCD_init();          // GPIO direct drive
    Buzzer_beep(1);      // Power-on beep
    
    while(1) {
        // Oversample 64× every 200ms
        adc_sum = 0;
        for (uint8_t i=0; i<64; i++) {
            adc_sum += ADC_read(ADC_CH4);  // P1.4
            delay_us(100);
        }
        
        // Apply calibration
        int16_t adc_avg = (adc_sum >> 6) + cal_offset;
        
        // Lookup temperature
        temp = lookup_temp(adc_avg);
        
        // Display with 0.01°C resolution
        LCD_display_float(temp);
        
        // Check for stable reading (predictive algorithm)
        if (temp_stable_for(3_seconds)) {
            Buzzer_beep(3);  // Done beep
            if (temp > 38.0) {
                LCD_show_fever_icon();
            }
        }
        
        // Auto power-off after 8 minutes
        if (idle_time > 480) {
            power_down();
        }
    }
}
