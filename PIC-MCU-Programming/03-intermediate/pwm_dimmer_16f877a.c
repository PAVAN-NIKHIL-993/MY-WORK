/* ---------------------------------------------------------------------------
 * pwm_dimmer_16f877a.c — CCP1 PWM "breathing" LED (auto fade up/down)
 *
 * Device   : PIC16F877A
 * Clock    : 20 MHz crystal, FOSC = HS  => _XTAL_FREQ = 20000000
 * Wiring   : RC2/CCP1 -> 330 ohm -> LED -> GND  (PWM must use RC2/CCP1!)
 *            + minimum circuit (power, MCLR pull-up, ICSP)
 * Expected : LED smoothly fades up and down (~1 s cycle, 1.25 kHz PWM).
 * Build    : MPLAB X + XC8, device PIC16F877A, F11 build, F6 run/flash
 *
 * PWM math: period = (PR2+1)*4*Tosc*TMR2prescale
 *         = 250 * 4 * 50 ns * 16 = 800 us -> 1.25 kHz.
 * Duty is 10-bit, 0..(PR2+1)*4 = 0..1000. CCPR1L holds the top 8 bits,
 * CCP1CON<5:4> (CCP1Y:CCP1X) hold the bottom 2 bits.
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
#define PWM_MAX 1000                 // (PR2+1)*4, 10-bit full scale

/* Set 10-bit PWM duty (0..1000). */
void pwm_set(uint16_t duty)
{
    if (duty > PWM_MAX) duty = PWM_MAX;
    CCPR1L = (uint8_t)(duty >> 2);        // top 8 bits
    CCP1CONbits.CCP1Y = (duty >> 1) & 1;  // duty bit 1
    CCP1CONbits.CCP1X = duty & 1;         // duty bit 0
}

void main(void)
{
    TRISCbits.TRISC2 = 0;            // RC2/CCP1 = output
    PR2 = 249;                       // PWM period (see math above)
    CCP1CON = 0x0C;                  // CCP1 in PWM mode
    pwm_set(0);                      // start at 0% duty
    T2CON = 0x07;                    // Timer2 ON, prescale 1:16, postscale 1:1
    while (!PIR1bits.TMR2IF) { }     // wait one Timer2 cycle (clean start)
    PIR1bits.TMR2IF = 0;

    while (1)
    {
        uint16_t d;
        for (d = 0; d <= PWM_MAX; d += 10)      // fade UP
        {
            pwm_set(d);
            __delay_ms(5);
        }
        for (d = PWM_MAX; d > 0; d -= 10)       // fade DOWN
        {
            pwm_set(d);
            __delay_ms(5);
        }
    }
}
