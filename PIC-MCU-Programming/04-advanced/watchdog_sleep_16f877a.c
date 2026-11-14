/* ---------------------------------------------------------------------------
 * watchdog_sleep_16f877a.c — watchdog wakes the chip from SLEEP every ~2.3 s
 *
 * Device   : PIC16F877A
 * Clock    : 20 MHz crystal, FOSC = HS  => _XTAL_FREQ = 20000000
 * Wiring   : LED: RB0 -> 330 ohm -> LED -> GND
 *            + minimum circuit (power, MCLR pull-up, ICSP)
 * Expected : power-on  -> LED solid 1 s, then OFF.
 *            every ~2.3 s -> triple-blink (WDT woke the chip from SLEEP).
 *            NOTE: this example uses WDTE = ON (all others used OFF)!
 * Build    : MPLAB X + XC8, device PIC16F877A, F11 build, F6 run/flash
 *
 * WDT math: nominal 18 ms x 1:128 prescaler ~= 2.3 s (RC osc, so ~20% off
 * is normal). TO/PD bits tell power-on (TO=1,PD=1) from WDT-wake (TO=0,PD=0).
 * ------------------------------------------------------------------------- */

#pragma config FOSC = HS
#pragma config WDTE = ON             // watchdog ON — it is the wake-up source!
#pragma config PWRTE = ON
#pragma config BOREN = ON
#pragma config LVP = OFF
#pragma config CPD = OFF
#pragma config WRT = OFF
#pragma config CP = OFF

#include <xc.h>
#include <stdint.h>

#define _XTAL_FREQ 20000000

void triple_blink(void)
{
    uint8_t i;
    for (i = 0; i < 3; i++)
    {
        PORTBbits.RB0 = 1;
        __delay_ms(150);
        PORTBbits.RB0 = 0;
        __delay_ms(150);
    }
}

void main(void)
{
    TRISBbits.TRISB0 = 0;
    PORTBbits.RB0 = 0;

    // Prescaler 1:128 assigned to the WDT (PSA=1): ~2.3 s timeout
    OPTION_REG = 0x8F;               // RBPU=1, PSA=1, PS=111

    if (!STATUSbits.TO && !STATUSbits.PD)
    {
        triple_blink();              // WDT wake-up from SLEEP
    }
    else
    {
        PORTBbits.RB0 = 1;           // power-on (or MCLR): solid 1 s
        __delay_ms(1000);
        PORTBbits.RB0 = 0;
    }

    while (1)
    {
        __delay_ms(200);             // short pause (keep every delay < 2.3 s!)
        SLEEP();                     // CPU stops here; WDT wakes it ~2.3 s later
        triple_blink();              // runs right after each wake-up
        // (In real battery projects you'd read a sensor here, then sleep again)
    }
}
