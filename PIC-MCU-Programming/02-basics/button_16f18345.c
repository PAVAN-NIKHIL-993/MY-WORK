/* ---------------------------------------------------------------------------
 * button_16f18345.c — push-button toggles LED (internal pull-up + debounce)
 *
 * Device   : PIC16F18345 (20-pin)
 * Clock    : internal HFINTOSC at 8 MHz  => _XTAL_FREQ = 8000000
 * Wiring   : LED:    RC5 -> 330 ohm -> LED -> GND
 *            Button: RA2 -> button -> GND ONLY (no resistor! internal
 *                    weak pull-up holds RA2 HIGH when idle; see code)
 *            + minimum circuit (power, MCLR pull-up, ICSP)
 * Expected : each button PRESS toggles the LED (no flicker/double-toggle)
 * Build    : MPLAB X + XC8, device PIC16F18345, F11 build, F6 run/flash
 * ------------------------------------------------------------------------- */

#pragma config FEXTOSC = OFF
#pragma config RSTOSC = HFINTOSC
#pragma config MCLRE = ON
#pragma config WDTE = OFF
#pragma config LVP = OFF

#include <xc.h>
#include <stdint.h>

#define _XTAL_FREQ 8000000

#define BUTTON_PRESSED 0     // active-low: pin reads 0 while pressed

uint8_t button_pressed(void)
{
    if (PORTAbits.RA2 == BUTTON_PRESSED)
    {
        __delay_ms(20);
        if (PORTAbits.RA2 == BUTTON_PRESSED)
        {
            while (PORTAbits.RA2 == BUTTON_PRESSED) { }
            __delay_ms(20);
            return 1;
        }
    }
    return 0;
}

void main(void)
{
    // --- Clock: HFINTOSC to 8 MHz ---
    OSCFRQbits.HFFRQ = 0b100;        // HFFRQ 100 = 8 MHz
    while (!OSCSTATbits.HFIOFR) { }

    // --- GPIO: digital, RC5 out, RA2 in with internal pull-up ---
    ANSELA = 0x00;                   // all digital (RA2 is analog-capable!)
    ANSELC = 0x00;
    TRISCbits.TRISC5 = 0;            // RC5 = output (LED)
    LATCbits.LATC5 = 0;              // LED starts OFF
    TRISAbits.TRISA2 = 1;            // RA2 = input (button)
    WPUAbits.WPUA2 = 1;              // enable weak pull-up on RA2...
    OPTION_REGbits.nWPUEN = 0;       // ...and the global pull-up switch (0=on)

    while (1)
    {
        if (button_pressed())
        {
            LATCbits.LATC5 ^= 1;     // toggle LED
        }
    }
}
