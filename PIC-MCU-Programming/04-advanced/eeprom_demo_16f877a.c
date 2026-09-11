/* ---------------------------------------------------------------------------
 * eeprom_demo_16f877a.c — press counter saved in internal data EEPROM
 *
 * Device   : PIC16F877A (256 bytes of data EEPROM, ~1M write cycles)
 * Clock    : 20 MHz crystal, FOSC = HS  => _XTAL_FREQ = 20000000
 * Wiring   : Button: RB1 -> button -> GND + 10k pull-up RB1 -> +5 V
 *            LEDs: RD0..RD3 each -> 330 ohm -> LED -> GND (binary count!)
 *            + minimum circuit (power, MCLR pull-up, ICSP)
 * Expected : each press increments the binary display; RESET the board or
 *            unplug it — the count SURVIVES (it lives in EEPROM, addr 0).
 * Build    : MPLAB X + XC8, device PIC16F877A, F11 build, F6 run/flash
 * ------------------------------------------------------------------------- */

#pragma config FOSC = HS
#pragma config WDTE = OFF
#pragma config PWRTE = ON
#pragma config BOREN = ON
#pragma config LVP = OFF
#pragma config CPD = OFF             // must be OFF to use data EEPROM freely
#pragma config WRT = OFF
#pragma config CP = OFF

#include <xc.h>
#include <stdint.h>

#define _XTAL_FREQ 20000000
#define EEPROM_ADDR_COUNT 0x00

uint8_t eeprom_read(uint8_t addr)
{
    EEADR = addr;                    // 16F877A: 256 B, so EEADR alone is enough
    EECON1bits.EEPGD = 0;            // 0 = data EEPROM (1 = flash program mem)
    EECON1bits.RD = 1;               // start read (1 cycle)
    return EEDATA;
}

void eeprom_write(uint8_t addr, uint8_t data)
{
    while (EECON1bits.WR) { }        // wait for any previous write (~4 ms)
    EEADR = addr;
    EEDATA = data;
    EECON1bits.EEPGD = 0;
    EECON1bits.WREN = 1;             // enable writes
    INTCONbits.GIE = 0;              // magic sequence must not be interrupted
    EECON2 = 0x55;                   // magic sequence byte 1 (NOT a real reg!)
    EECON2 = 0xAA;                   // magic sequence byte 2
    EECON1bits.WR = 1;               // start write
    INTCONbits.GIE = 1;
    EECON1bits.WREN = 0;             // disable writes again (safety)
    while (EECON1bits.WR) { }        // wait until done
}

uint8_t button_pressed(void)         // debounced, 1 per press (from Step 3)
{
    if (PORTBbits.RB1 == 0)
    {
        __delay_ms(20);
        if (PORTBbits.RB1 == 0)
        {
            while (PORTBbits.RB1 == 0) { }
            __delay_ms(20);
            return 1;
        }
    }
    return 0;
}

void main(void)
{
    uint8_t count;
    TRISBbits.TRISB1 = 1;            // button input
    TRISD = 0xF0;                    // RD0..RD3 outputs (low nibble = display)

    count = eeprom_read(EEPROM_ADDR_COUNT);  // restore after any reset!
    PORTD = (PORTD & 0xF0) | (count & 0x0F);

    while (1)
    {
        if (button_pressed())
        {
            count++;                             // wraps 255 -> 0 naturally
            eeprom_write(EEPROM_ADDR_COUNT, count);
            PORTD = (PORTD & 0xF0) | (count & 0x0F);
        }
    }
}
