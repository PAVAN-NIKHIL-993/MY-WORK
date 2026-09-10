/* ---------------------------------------------------------------------------
 * temp_logger_16f877a.c — CAPSTONE: LM35 temperature -> UART CSV stream
 *
 * Device   : PIC16F877A
 * Clock    : 20 MHz crystal, FOSC = HS  => _XTAL_FREQ = 20000000
 * Wiring   : LM35: +Vs -> +5V, Vout -> RA0/AN0, GND -> GND
 *            RC6/TX -> RX of USB-UART (9600 8-N-1), common GND
 *            LED: RB0 -> 330 ohm -> LED -> GND (toggles per sample)
 *            + minimum circuit (power, MCLR pull-up, ICSP)
 * Expected : terminal/CSV shows "t_ms,temp_c" lines every 500 ms, e.g.:
 *              500,27.3
 *              1000,27.4
 *            Capture with ../05-python-tools/serial_logger.py, analyze with
 *            analyze_log.py. LED toggles per sample (1 Hz).
 * Build    : MPLAB X + XC8, device PIC16F877A, F11 build, F6 run/flash
 *
 * Design (best practice, no blocking delays in main!):
 * - Timer0 ISR keeps a millisecond clock (preload 100, prescale 1:32 ->
 *   156 x 6.4 us = 998.4 us ~= 1 ms per overflow).
 * - main() samples ADC + sends UART every 500 ms using that clock.
 * - LM35: 10 mV/C, Vref = 5 V -> temp_tenths_C = ADC * 5000 / 1024.
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
#define SAMPLE_PERIOD_MS 500

volatile uint16_t ms_ticks = 0;   // millisecond clock (ISR-updated)

/* ---------------- ISR: 1 ms tick ---------------- */
void __interrupt() isr(void)
{
    if (INTCONbits.TMR0IF)
    {
        INTCONbits.TMR0IF = 0;
        TMR0 = 100;               // reload for ~1 ms (see header math)
        ms_ticks++;
    }
}

/* Atomic 16-bit read of the ISR-updated clock (8-bit CPU = 2 reads!). */
uint16_t millis(void)
{
    uint16_t v;
    INTCONbits.GIE = 0;           // brief critical section
    v = ms_ticks;
    INTCONbits.GIE = 1;
    return v;
}

/* ---------------- UART (9600) ---------------- */
void uart_init(void)
{
    TRISCbits.TRISC7 = 1;
    TRISCbits.TRISC6 = 0;
    SPBRG = 129;
    TXSTAbits.SYNC = 0;
    TXSTAbits.BRGH = 1;
    TXSTAbits.TXEN = 1;
    RCSTAbits.SPEN = 1;
}
void uart_putc(uint8_t c) { while (!TXSTAbits.TRMT) { } TXREG = c; }
void uart_puts(const char *s) { while (*s) uart_putc((uint8_t)*s++); }
void uart_putdec16(uint16_t v)   // decimal, no leading zeros, no printf!
{
    uint8_t started = 0;
    uint16_t div = 10000;
    while (div > 0)
    {
        uint8_t d = (uint8_t)(v / div);
        if (d != 0 || started || div == 1)
        {
            uart_putc((uint8_t)('0' + d));
            started = 1;
        }
        v -= (uint16_t)d * div;
        div /= 10;
    }
}

/* ---------------- ADC (AN0) ---------------- */
void adc_init(void)
{
    TRISAbits.TRISA0 = 1;
    ADCON1 = 0xCE;                // right-justify, Fosc/64, AN0 analog only
    ADCON0 = 0x41;                // Fosc/64, channel AN0, ADC ON
}
uint16_t adc_read(void)
{
    __delay_us(20);
    ADCON0bits.GO_DONE = 1;
    while (ADCON0bits.GO_DONE) { }
    return ((uint16_t)ADRESH << 8) | ADRESL;
}

/* ---------------- Timer0 (~1 ms overflow) ---------------- */
void tick_init(void)
{
    OPTION_REG = 0x84;            // RBPU=1, T0CS=0, PSA=0, PS=100 (1:32)
    TMR0 = 100;                   // preload: overflow after 156 ticks ~= 1 ms
    INTCONbits.TMR0IF = 0;
    INTCONbits.TMR0IE = 1;
    INTCONbits.GIE = 1;
}

void main(void)
{
    uint16_t last = 0;
    TRISBbits.TRISB0 = 0;
    PORTBbits.RB0 = 0;
    uart_init();
    adc_init();
    tick_init();
    uart_puts("t_ms,temp_c\r\n");        // CSV header for the logger

    while (1)
    {
        if ((uint16_t)(millis() - last) >= SAMPLE_PERIOD_MS)  // non-blocking!
        {
            uint16_t adc, tenths;
            last += SAMPLE_PERIOD_MS;
            adc = adc_read();
            tenths = (uint16_t)(((uint32_t)adc * 5000UL) / 1024UL);  // 0.1 C
            uart_putdec16(last);         // timestamp column
            uart_putc(',');
            uart_putdec16((uint16_t)(tenths / 10));  // whole degrees
            uart_putc('.');
            uart_putc((uint8_t)('0' + (tenths % 10)));  // 1 decimal place
            uart_puts("\r\n");
            PORTBbits.RB0 ^= 1;          // heartbeat
        }
        // CPU is free here: could sleep, watch buttons, etc.
    }
}
