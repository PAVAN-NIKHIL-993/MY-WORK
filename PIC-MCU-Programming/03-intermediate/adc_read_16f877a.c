/* ---------------------------------------------------------------------------
 * adc_read_16f877a.c — potentiometer -> 10-bit ADC -> 4-LED bar graph
 *
 * Device   : PIC16F877A
 * Clock    : 20 MHz crystal, FOSC = HS  => _XTAL_FREQ = 20000000
 * Wiring   : Pot: +5V -> 10k pot -> GND, wiper -> RA0/AN0
 *            LEDs: RD0..RD3 each -> 330 ohm -> LED -> GND (bar graph)
 *            + minimum circuit (power, MCLR pull-up, ICSP)
 * Expected : turning the pot lights 0..4 LEDs (result 0..1023 mapped up).
 * Build    : MPLAB X + XC8, device PIC16F877A, F11 build, F6 run/flash
 *
 * ADC setup: AN0 analog only (PCFG=1110, Vref+ = VDD), right-justified,
 * Fosc/64 clock -> Tad = 3.2 us (>= 1.6 us minimum). 12 Tad per conversion.
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

void adc_init(void)
{
    TRISAbits.TRISA0 = 1;            // RA0/AN0 = input
    ADCON1 = 0xCE;                   // right-justify, Fosc/64, AN0 analog only
    ADCON0 = 0x41;                   // Fosc/64, channel AN0, ADC ON
}

uint16_t adc_read(void)
{
    __delay_us(20);                  // acquisition time (charge hold cap)
    ADCON0bits.GO_DONE = 1;          // start conversion
    while (ADCON0bits.GO_DONE) { }   // wait (~38 us at Fosc/64)
    return ((uint16_t)ADRESH << 8) | ADRESL;  // 10-bit result, 0..1023
}

void main(void)
{
    TRISD = 0x00;                    // PORTD = outputs (LED bar)
    PORTD = 0x00;
    adc_init();

    while (1)
    {
        uint16_t v = adc_read();
        // Map 0..1023 to a 4-LED bar:
        if (v > 800)      PORTD = 0x0F;   // ####
        else if (v > 600) PORTD = 0x07;   // ###
        else if (v > 400) PORTD = 0x03;   // ##
        else if (v > 200) PORTD = 0x01;   // #
        else              PORTD = 0x00;   // (none)
        __delay_ms(50);                   // ~20 samples/sec
    }
}
