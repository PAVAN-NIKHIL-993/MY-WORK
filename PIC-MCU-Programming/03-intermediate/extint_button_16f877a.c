/* ---------------------------------------------------------------------------
 * extint_button_16f877a.c — RB0/INT external interrupt + flag pattern
 *
 * Device   : PIC16F877A
 * Clock    : 20 MHz crystal, FOSC = HS  => _XTAL_FREQ = 20000000
 * Wiring   : Button: RB0 -> button -> GND, PLUS 10k pull-up RB0 -> +5 V
 *                    (idle HIGH, press = FALLING edge -> interrupt)
 *            LED:    RB1 -> 330 ohm -> LED -> GND
 *            + minimum circuit (power, MCLR pull-up, ICSP)
 * Expected : each button PRESS toggles the LED. ISR only sets a flag;
 *            main() does debounce + toggle (the professional pattern).
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

volatile uint8_t int_flag = 0;   // volatile: shared between ISR and main!

void __interrupt() isr(void)
{
    if (INTCONbits.INTF)             // RB0/INT edge detected?
    {
        INTCONbits.INTF = 0;         // MUST clear in software!
        int_flag = 1;                // ISR does NOTHING else (no delays!)
    }
}

void main(void)
{
    TRISBbits.TRISB0 = 1;            // RB0 = input (button / INT pin)
    TRISBbits.TRISB1 = 0;            // RB1 = output (LED)
    PORTBbits.RB1 = 0;

    OPTION_REGbits.INTEDG = 0;       // interrupt on FALLING edge (press)
    INTCONbits.INTF = 0;
    INTCONbits.INTE = 1;             // enable RB0/INT interrupt
    INTCONbits.GIE = 1;              // global interrupt enable

    while (1)
    {
        if (int_flag)
        {
            __delay_ms(20);                      // debounce
            if (PORTBbits.RB0 == 0)              // still pressed = real press
            {
                while (PORTBbits.RB0 == 0) { }   // wait for release
                __delay_ms(20);
                PORTBbits.RB1 ^= 1;              // toggle LED
            }
            int_flag = 0;  // clear AFTER release: swallows bounce re-triggers
        }
    }
}
