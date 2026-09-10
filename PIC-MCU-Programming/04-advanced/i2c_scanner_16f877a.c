/* ---------------------------------------------------------------------------
 * i2c_scanner_16f877a.c — MSSP I2C master scans the bus, reports via UART
 *
 * Device   : PIC16F877A
 * Clock    : 20 MHz crystal, FOSC = HS  => _XTAL_FREQ = 20000000
 * Wiring   : RC3/SCL -> SCL of I2C device(s) (+ 4.7k pull-up to +5 V!)
 *            RC4/SDA -> SDA of I2C device(s) (+ 4.7k pull-up to +5 V!)
 *            RC6/TX -> RX of USB-UART (9600 8-N-1), common GND
 *            LED: RB0 -> 330 ohm -> LED -> GND (blinks once per scan)
 *            + minimum circuit (power, MCLR pull-up, ICSP)
 * Expected : terminal shows "scan..." then "Found 0x.." for every device
 *            that ACKs (try any I2C sensor/RTC/EEPROM/LCD backpack).
 * Build    : MPLAB X + XC8, device PIC16F877A, F11 build, F6 run/flash
 *
 * I2C clock: SSPADD = Fosc/(4*Fscl) - 1 = 20000000/400000 - 1 = 49 (100 kHz)
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

/* ---------------- UART (9600, TX only + reuse from Step 4) ---------------- */
void uart_init(void)
{
    TRISCbits.TRISC6 = 0;
    SPBRG = 129;
    TXSTAbits.SYNC = 0;
    TXSTAbits.BRGH = 1;
    TXSTAbits.TXEN = 1;
    RCSTAbits.SPEN = 1;
}
void uart_putc(uint8_t c) { while (!TXSTAbits.TRMT) { } TXREG = c; }
void uart_puts(const char *s) { while (*s) uart_putc((uint8_t)*s++); }
void uart_puthex(uint8_t v)
{
    uint8_t hi = (v >> 4) & 0x0F, lo = v & 0x0F;
    uart_putc(hi < 10 ? (uint8_t)('0' + hi) : (uint8_t)('A' + hi - 10));
    uart_putc(lo < 10 ? (uint8_t)('0' + lo) : (uint8_t)('A' + lo - 10));
}

/* ---------------- I2C master (MSSP) ---------------- */
void i2c_init(void)
{
    TRISCbits.TRISC3 = 1;            // SCL = input (MSSP drives it)
    TRISCbits.TRISC4 = 1;            // SDA = input (MSSP drives it)
    SSPCON = 0x28;                   // SSPEN=1, I2C Master mode
    SSPCON2 = 0x00;
    SSPADD = 49;                     // 100 kHz @ 20 MHz
    SSPSTAT = 0x80;                  // slew rate disabled (standard 100 kHz)
}
void i2c_start(void)
{
    SSPCON2bits.SEN = 1;             // START condition...
    while (SSPCON2bits.SEN) { }      // ...hardware clears SEN when done
}
void i2c_stop(void)
{
    SSPCON2bits.PEN = 1;             // STOP condition
    while (SSPCON2bits.PEN) { }
}
/* Send one byte; returns 0 if slave ACKed, 1 if NACK (nobody home). */
uint8_t i2c_write(uint8_t d)
{
    PIR1bits.SSPIF = 0;
    SSPBUF = d;                      // start 9 clocks (8 bits + ACK slot)
    while (!PIR1bits.SSPIF) { }      // wait for transfer complete
    return SSPCON2bits.ACKSTAT;      // 0 = ACK, 1 = NACK
}

void main(void)
{
    TRISBbits.TRISB0 = 0;
    PORTBbits.RB0 = 0;
    uart_init();
    i2c_init();
    uart_puts("\r\nPIC16F877A I2C scanner (100 kHz)\r\n");

    while (1)
    {
        uint8_t addr, found = 0;
        uart_puts("scan... ");
        for (addr = 0x08; addr <= 0x77; addr++)
        {
            i2c_start();
            if (i2c_write((uint8_t)(addr << 1)) == 0)  // address + WRITE bit
            {
                uart_puts("Found 0x");
                uart_puthex(addr);
                uart_putc(' ');
                found++;
            }
            i2c_stop();
            __delay_us(50);
        }
        if (found == 0) uart_puts("(none)");
        uart_puts("\r\n");
        PORTBbits.RB0 ^= 1;          // heartbeat per scan
        __delay_ms(2000);
    }
}
