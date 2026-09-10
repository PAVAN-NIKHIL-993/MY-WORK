# Step 5 — Advanced: I2C, EEPROM, SPI, Watchdog + Sleep, Config Words

All demos target **PIC16F877A @ 20 MHz**. Build like before (new MPLAB X
project → paste → F11 → F6).

## 1. What's here

| File | Topic | Wiring extra | Demo |
|---|---|---|---|
| `i2c_scanner_16f877a.c` | I2C master (MSSP, 100 kHz) | RC3/SCL + RC4/SDA with **4.7k pull-ups**; USB-UART on RC6 | Scans 0x08–0x77, prints ACKing addresses |
| `eeprom_demo_16f877a.c` | Data EEPROM + write sequence | Button RB1, binary LEDs RD0–RD3 | Press counter that survives reset/power-off |
| `watchdog_sleep_16f877a.c` | WDT + SLEEP + TO/PD bits | LED RB0 only (**needs `WDTE = ON`**) | Solid 1 s at power-on, triple-blink every ~2.3 s wake |
| `spi_loopback_note.md` | SPI master (MSSP) | Jumper RC5↔RC4, LED RB0, USB-UART | TX byte must equal RX byte; LED = healthy |
| `config_word_guide.md` | Config words | — | FOSC/WDTE/LVP/CP explained + MPLAB X generator how-to |

## 2. Key concepts

- **I2C needs pull-ups.** SDA/SCL are open-drain — without 4.7k to 5 V the bus
  floats and nothing ACKs. `SSPADD = Fosc/(4×Fscl) − 1` (49 @ 100 kHz/20 MHz).
  `ACKSTAT = 0` means a slave answered.
- **EEPROM writes are special:** `0x55/0xAA` unlock sequence with GIE off,
  ~4 ms per byte, ~1 M cycle endurance — great for settings/counters, wrong
  for high-rate logging (that's what external flash / UART-to-PC is for).
- **Watchdog = dead-man's switch:** counts even in SLEEP; timeout while
  awake resets, while asleep wakes. Keep blocking delays shorter than the WDT
  period (here ~2.3 s) or sprinkle `CLRWDT()`.
- **Sleep for battery life:** `SLEEP()` stops the CPU (≈ µA with peripherals
  off); wake via WDT, INT pin, or UART (address mode). Wake → sense → sleep.
- **SPI modes must match:** agree on CKP/CKE + speed with the slave's
  datasheet; drive a GPIO slave-select LOW around each transaction.

## 3. Exercises

1. ⭐ Scanner: attach any I2C module (RTC DS1307 @ 0x68, LCD backpack @ 0x27…)
   and confirm its address appears.
2. ⭐⭐ EEPROM: store the last PWM brightness / LED state and restore it at boot.
3. ⭐⭐ Watchdog: change prescaler to 1:32 — predict then measure the new period.
4. ⭐⭐⭐ Sleep current: insert a multimeter in the 5 V line, compare RUN vs
   SLEEP current (expect mA → µA territory with LEDs off).
5. ⭐⭐⭐ SPI: replace the loopback jumper with a real slave (e.g. 25LC256
   EEPROM or MCP3008 ADC) using a GPIO chip-select.

## 4. Troubleshooting

| Symptom | Check |
|---|---|
| I2C finds nothing | 4.7k pull-ups fitted? Right RC3/RC4 pins? Slave powered + common GND? |
| Bus stuck (SDA held LOW) | A slave is mid-byte — power-cycle the *slave*, add `i2c_stop()` retries |
| EEPROM value never changes | `EEPGD=0`? Unlock sequence exact (`0x55`,`0xAA`)? `WREN` on during `WR`? |
| WDT demo resets constantly | A delay > ~2.3 s somewhere, or OPTION_REG prescaler assigned wrong (need PSA=1, PS=111) |
| Never wakes from SLEEP | `WDTE` really ON in config? (Re-check: this is the only example with ON) |
| SPI mismatch | Jumper seated? `TRISC5=0`? Both ends same mode (CKP/CKE)? |

Next: **Step 6** — `05-python-tools/`: baud calculator, serial logger, config helper.
