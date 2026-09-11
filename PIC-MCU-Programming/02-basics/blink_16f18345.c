/* ---------------------------------------------------------------------------
 * blink_16f18345.c — LED blink (modern PIC, internal oscillator, no crystal)
 *
 * Device   : PIC16F18345 (20-pin)
 * Clock    : internal HFINTOSC set to 8 MHz in code (see OSCFRQ below)
 *            => _XTAL_FREQ must be 8000000
 * Wiring   : LED: RC5 -> 330 ohm -> LED -> GND   (see 01-docs/02-...)
 *            + minimum circuit: 5 V + decoupling, MCLR 10k to VDD, ICSP
 * Expected : LED on RC5 blinks at 1 Hz (500 ms ON / 500 ms OFF)
 * Build    : MPLAB X + XC8, device PIC16F18345, F11 build, F6 run/flash
 *
 * NOTE on config lines: only the must-set words are listed; the rest keep
 * their default (benign) states. If XC8 ever rejects a line, regenerate the
 * exact block via MPLAB X: Window -> Target Memory Views -> Configuration
 * Bits -> "Generate Source Code", and paste it here.
 * ------------------------------------------------------------------------- */

// --- Configuration bits (PIC16F18345, minimal safe set) ---
#pragma config FEXTOSC = OFF     // external oscillator OFF (we use internal)
#pragma config RSTOSC = HFINTOSC // reset default = HFINTOSC (starts at 1 MHz)
#pragma config MCLRE = ON        // MCLR pin enabled (use 10k pull-up to VDD)
#pragma config WDTE = OFF        // watchdog OFF for now (Step 5 covers it)
#pragma config LVP = OFF         // low-voltage programming OFF

#include <xc.h>

#define _XTAL_FREQ 8000000   // MUST match the OSCFRQ setting below!

void main(void)
{
    // --- Clock: HFINTOSC to 8 MHz (HFFRQ 100 = 8 MHz, see datasheet OSCFRQ) ---
    OSCFRQbits.HFFRQ = 0b100;
    while (!OSCSTATbits.HFIOFR) { }  // wait until HFINTOSC is stable

    // --- GPIO: all-digital, RC5 = output ---
    ANSELA = 0x00;                 // PORTA all digital (disable analog)
    ANSELC = 0x00;                 // PORTC all digital
    TRISCbits.TRISC5 = 0;          // RC5 = output
    LATCbits.LATC5 = 0;            // LED starts OFF (write outputs via LATx!)

    while (1)
    {
        LATCbits.LATC5 = 1;        // LED ON
        __delay_ms(500);
        LATCbits.LATC5 = 0;        // LED OFF
        __delay_ms(500);
    }
}
