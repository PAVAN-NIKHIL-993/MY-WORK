/* ---------------------------------------------------------------------------
 * timer0_blink_16f877a.c — Timer0 interrupt blinks LED (CPU stays free)
 *
 * Device   : PIC16F877A
 * Clock    : 20 MHz crystal, FOSC = HS  => _XTAL_FREQ = 20000000
 * Wiring   : LED1: RB0 -> 330 ohm -> LED -> GND  (Timer0 ISR, 1 Hz)
 *            LED2: RB1 -> 330 ohm -> LED -> GND  (main loop, ~5 Hz)
 *            + minimum circuit (power, MCLR pull-up, ICSP)
 * Expected : RB0 blinks at 1 Hz via interrupt while RB1 blinks independently
 *            in main() — proving the timer runs in the background.
 * Build    : MPLAB X + XC8, device PIC16F877A, F11 build, F6 run/flash
 *
 * Math: Fosc/4 = 5 MHz -> Timer0 tick with 1:256 prescaler = 51.2 us.
 * Overflow every 256 ticks = 13.1072 ms; 38 overflows ~= 500 ms.
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
#define OVERFLOWS_PER_TOGGLE 38   // 38 x 13.1072 ms ~= 500 ms

volatile uint8_t t0_count = 0;

/* Interrupt Service Routine: keep it SHORT — count and toggle only. */
void __interrupt() isr(void)
{
    if (INTCONbits.TMR0IF)            // Timer0 overflowed?
    {
        INTCONbits.TMR0IF = 0;        // MUST clear in software!
        if (++t0_count >= OVERFLOWS_PER_TOGGLE)
        {
            t0_count = 0;
            PORTBbits.RB0 ^= 1;       // toggle 1 Hz LED
        }
    }
}

void main(void)
{
    TRISBbits.TRISB0 = 0;             // RB0 = output (ISR LED)
    TRISBbits.TRISB1 = 0;             // RB1 = output (main-loop LED)
    PORTBbits.RB0 = 0;
    PORTBbits.RB1 = 0;

    // Timer0: internal clock (Fosc/4), prescaler 1:256 assigned to Timer0
    OPTION_REG = 0x87;                // RBPU=1, T0CS=0, PSA=0, PS=111
    TMR0 = 0;
    INTCONbits.TMR0IF = 0;
    INTCONbits.TMR0IE = 1;            // enable Timer0 interrupt
    INTCONbits.GIE = 1;               // global interrupt enable

    while (1)
    {
        // Main loop is FREE — it never waits for the 1 Hz LED:
        PORTBbits.RB1 ^= 1;
        __delay_ms(100);
    }
}
