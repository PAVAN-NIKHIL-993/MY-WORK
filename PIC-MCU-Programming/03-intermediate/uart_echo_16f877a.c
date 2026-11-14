/* ---------------------------------------------------------------------------
 * uart_echo_16f877a.c — UART echo at 9600 baud (talk to your PIC from a PC)
 *
 * Device   : PIC16F877A
 * Clock    : 20 MHz crystal, FOSC = HS  => _XTAL_FREQ = 20000000
 * Wiring   : RC6/TX -> RX of USB-UART module
 *            RC7/RX -> TX of USB-UART module  (+ common GND! TX/RX crossover)
 *            LED: RB0 -> 330 ohm -> LED -> GND (toggles per received byte)
 *            + minimum circuit (power, MCLR pull-up, ICSP)
 * Expected : open a serial terminal (9600 8-N-1) -> see banner; every typed
 *            character is echoed back, RB0 toggles per byte.
 * Build    : MPLAB X + XC8, device PIC16F877A, F11 build, F6 run/flash
 *
 * Baud math: BRGH=1 -> SPBRG = Fosc/(16*baud) - 1 = 20000000/153600 - 1
 *          = 129.2 -> SPBRG = 129, error +0.16% (fine for UART).
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
#define SPBRG_9600_AT_20MHZ 129

void uart_init(void)
{
    TRISCbits.TRISC7 = 1;            // RX pin = input
    TRISCbits.TRISC6 = 0;            // TX pin = output
    SPBRG = SPBRG_9600_AT_20MHZ;     // 9600 baud @ 20 MHz, BRGH=1
    TXSTAbits.SYNC = 0;              // async mode
    TXSTAbits.BRGH = 1;              // high-speed baud rate
    TXSTAbits.TXEN = 1;              // enable transmitter
    RCSTAbits.SPEN = 1;              // enable serial port (TX/RX pins live)
    RCSTAbits.CREN = 1;              // enable receiver
}

void uart_putc(uint8_t c)
{
    while (!TXSTAbits.TRMT) { }      // wait until shifter empty
    TXREG = c;
}

void uart_puts(const char *s)
{
    while (*s) uart_putc((uint8_t)*s++);
}

uint8_t uart_getc(void)
{
    if (RCSTAbits.OERR)              // overrun? (bytes lost) -> reset receiver
    {
        RCSTAbits.CREN = 0;
        RCSTAbits.CREN = 1;
    }
    while (!PIR1bits.RCIF) { }       // wait for a byte
    if (RCSTAbits.FERR)              // framing error -> discard, return 0
    {
        (void)RCREG;
        return 0;
    }
    return RCREG;                    // reading RCREG clears RCIF (hardware)
}

void main(void)
{
    TRISBbits.TRISB0 = 0;
    PORTBbits.RB0 = 0;
    uart_init();
    uart_puts("\r\nPIC16F877A UART echo ready (9600 8-N-1)\r\nType: ");

    while (1)
    {
        uint8_t c = uart_getc();     // blocking wait for a character
        PORTBbits.RB0 ^= 1;          // blink activity LED
        uart_putc(c);                // echo it back
    }
}
