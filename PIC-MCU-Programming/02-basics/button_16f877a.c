/* ---------------------------------------------------------------------------
 * button_16f877a.c — push-button toggles LED (with software debounce)
 *
 * Device   : PIC16F877A
 * Clock    : 20 MHz crystal, FOSC = HS  => _XTAL_FREQ = 20000000
 * Wiring   : LED:    RB0 -> 330 ohm -> LED -> GND
 *            Button: RB1 -> button -> GND, PLUS 10k pull-up RB1 -> +5 V
 *                    (idle HIGH, pressed LOW; see 01-docs/02-... section 4)
 *            + minimum circuit (power, MCLR pull-up, ICSP)
 * Expected : each button PRESS toggles the LED (no flicker/double-toggle)
 * Build    : MPLAB X + XC8, device PIC16F877A, F11 build, F6 run/flash
 * ------------------------------------------------------------------------- */

#pragma config FOSC = HS
#pragma config WDTE = OFF
#pragma config PWRTE = ON
#pragma config BOREN = ON
#pragma config LVP = OFF
#pragma config CPD = OFF
#pragma config WRT = OFF
#pragma config CP = OFF

#include <xc.h>
#include <stdint.h>

#define _XTAL_FREQ 20000000

#define BUTTON_PRESSED 0     // active-low: pin reads 0 while pressed

/* Returns 1 once per real press (debounced), 0 otherwise.
 * How: on seeing LOW, wait 20 ms (bounce settles), re-check, then wait
 * for release so one press = exactly one toggle. */
uint8_t button_pressed(void)
{
    if (PORTBbits.RB1 == BUTTON_PRESSED)
    {
        __delay_ms(20);                          // debounce: let bounce settle
        if (PORTBbits.RB1 == BUTTON_PRESSED)
        {
            while (PORTBbits.RB1 == BUTTON_PRESSED) { }  // wait for release
            __delay_ms(20);                      // debounce the release edge
            return 1;
        }
    }
    return 0;
}

void main(void)
{
    TRISBbits.TRISB0 = 0;    // RB0 = output (LED)
    TRISBbits.TRISB1 = 1;    // RB1 = input  (button)
    PORTBbits.RB0 = 0;       // LED starts OFF

    while (1)
    {
        if (button_pressed())
        {
            PORTBbits.RB0 ^= 1;  // toggle LED
        }
    }
}
