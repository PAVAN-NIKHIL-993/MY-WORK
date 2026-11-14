# SPI Loopback Note (MSSP in SPI Master mode, PIC16F877A @ 20 MHz)

> Goal: prove SPI works with **one wire** — jumper MOSI to MISO and check every
> transmitted byte comes back identical. No sensor needed.

## 1. Wiring (loopback)

| PIC pin | Role | Connect to |
|---|---|---|
| RC5/SDO | MOSI (master out) | jumper → RC4 |
| RC4/SDI | MISO (master in) | jumper → RC5 |
| RC3/SCK | Clock | scope/logic-analyzer if you have one (optional) |
| RB0 | Test LED | 330 Ω → LED → GND (ON = byte matched) |
| RC6/TX | UART TX | USB-UART RX, 9600 8-N-1 (prints sent vs received) |

+ the usual minimum circuit (power, decoupling, MCLR pull-up, ICSP).

## 2. SPI in 30 seconds

- Master generates clock (SCK); on each pulse one bit leaves SDO and one bit
  enters SDI — transfer is simultaneous in both directions.
- Both ends must agree on **mode**: clock idle level (`CKP`) + sample edge
  (`CKE`). Here both ends are the same chip, so any mode works; we use the
  common `CKP=0, CKE=1` (idle LOW, data changes on falling edge).
- Speed here: Fosc/16 = 1.25 MHz (`SSPM=0001`).

## 3. Complete program (`spi_loopback_16f877a.c` — paste into a new project)

```c
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

void uart_init(void)
{
    TRISCbits.TRISC6 = 0; SPBRG = 129;
    TXSTAbits.SYNC = 0; TXSTAbits.BRGH = 1; TXSTAbits.TXEN = 1;
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

void spi_init(void)
{
    TRISCbits.TRISC3 = 0;            // SCK = output (we are master)
    TRISCbits.TRISC5 = 0;            // SDO = output
    TRISCbits.TRISC4 = 1;            // SDI = input
    SSPSTATbits.CKE = 1;             // CKE=1, CKP=0 (mode 0-ish, Microchip style)
    SSPCON = 0x21;                   // SSPEN=1, SPI Master Fosc/16
}

uint8_t spi_transfer(uint8_t out)
{
    PIR1bits.SSPIF = 0;
    SSPBUF = out;                    // starts 8 clocks...
    while (!PIR1bits.SSPIF) { }      // ...wait for done
    return SSPBUF;                   // byte shifted in during those clocks
}

void main(void)
{
    uint8_t tx = 0, rx;
    TRISBbits.TRISB0 = 0;
    uart_init();
    spi_init();
    uart_puts("\r\nSPI loopback: TX vs RX (must match)\r\n");
    while (1)
    {
        rx = spi_transfer(tx);
        uart_puts("TX=0x"); uart_puthex(tx);
        uart_puts(" RX=0x"); uart_puthex(rx);
        uart_puts(rx == tx ? " OK\r\n" : " MISMATCH!\r\n");
        PORTBbits.RB0 = (rx == tx);  // LED on while loopback healthy
        tx++;
        __delay_ms(500);
    }
}
```

## 4. Going further (real SPI slaves)

- Add a slave-select line: any GPIO (e.g. RA1) → slave CS, drive LOW before
  the transfer, HIGH after.
- Match the slave's mode/speed from **its** datasheet (most sensors: mode 0/3,
  ≤ 1–10 MHz), then talk to it with `spi_transfer()` byte by byte.
- Common gotcha: forgetting `TRISC5 = 0` (SDO as input = silence).

Next: `config_word_guide.md` — finally understand every `#pragma config` line.
