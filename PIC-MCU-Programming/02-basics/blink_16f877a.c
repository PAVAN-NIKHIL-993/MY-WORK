/* ---------------------------------------------------------------------------
 * blink_16f877a.c — LED blink (classic PIC, external crystal)
 *
 * Device   : PIC16F877A
 * Clock    : 20 MHz crystal on OSC1/OSC2 (+ 2x 22 pF to GND), FOSC = HS
 *            => _XTAL_FREQ must be 20000000 (delays depend on this!)
 * Wiring   : LED: RB0 -> 330 ohm -> LED -> GND   (see 01-docs/02-...)
 *            + minimum circuit: 5 V + decoupling, MCLR 10k to VDD, ICSP
 * Expected : LED on RB0 blinks at 1 Hz (500 ms ON / 500 ms OFF)
 * Build    : MPLAB X + XC8, device PIC16F877A, F11 build, F6 run/flash
 * ------------------------------------------------------------------------- */

// --- Configuration bits (PIC16F877A) ---
#pragma config FOSC = HS     // HS crystal/resonator (>= 4 MHz)
#pragma config WDTE = OFF    // watchdog OFF for now (Step 5 covers it)
#pragma config PWRTE = ON    // power-up timer ON (safer startup)
#pragma config BOREN = ON    // brown-out reset ON
#pragma config LVP = OFF     // low-voltage programming OFF (PICkit uses HVP)
#pragma config CPD = OFF     // data EEPROM protection OFF
#pragma config WRT = OFF     // flash write protection OFF
#pragma config CP = OFF      // code protection OFF

#include <xc.h>

#define _XTAL_FREQ 20000000  // MUST match the real crystal frequency!

void main(void)
{
    TRISBbits.TRISB0 = 0;    // RB0 = output (1=input, 0=output)
    PORTBbits.RB0 = 0;       // start with LED off

    while (1)
    {
        PORTBbits.RB0 = 1;   // LED ON
        __delay_ms(500);
        PORTBbits.RB0 = 0;   // LED OFF
        __delay_ms(500);
    }
}
