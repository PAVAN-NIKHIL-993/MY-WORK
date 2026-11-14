# Step 4 — Intermediate: Timers, Interrupts, UART, ADC, PWM

All 5 modules target **PIC16F877A @ 20 MHz** (fixed peripheral pins — no PPS).
Build each exactly like Step 3: new MPLAB X project → paste file → **F11 → F6**.

## 1. The 5 modules

| File | Peripheral | Key pins | Demo |
|---|---|---|---|
| `timer0_blink_16f877a.c` | Timer0 + ISR | RB0 (ISR LED), RB1 (main LED) | 1 Hz interrupt blink while main blinks freely |
| `extint_button_16f877a.c` | RB0/INT + ISR flag | RB0 button (falling edge), RB1 LED | Press → toggle; ISR sets flag, main debounces |
| `uart_echo_16f877a.c` | EUSART 9600 8-N-1 | RC6/TX, RC7/RX, RB0 activity | Terminal echo + banner (test with USB-UART) |
| `adc_read_16f877a.c` | ADC 10-bit | RA0 pot, RD0–RD3 LED bar | Pot position → 0–4 LEDs |
| `pwm_dimmer_16f877a.c` | CCP1 PWM + Timer2 | RC2 LED (must be CCP1!) | "Breathing" fade, 1.25 kHz PWM |

## 2. Must-know concepts

### Interrupts: the 4 rules
1. **Short ISR**: set a `volatile` flag, clear the flag-bit, exit. No `__delay` inside!
2. **Clear the source flag in software**: `TMR0IF`, `INTF` (exception: `RCIF` clears itself when you read `RCREG`).
3. **Enable chain**: source enable (`TMR0IE`/`INTE`/`RCIE`) + `PEIE` (for peripheral sources like UART/ADC) + `GIE`.
4. **Shared variables are `volatile`** — otherwise the compiler "optimizes" main into never seeing the ISR's update.

### The math cheat-sheet (20 MHz)
| Peripheral | Formula | This step's values |
|---|---|---|
| Timer0 overflow | `256 × prescaler / (Fosc/4)` | 1:256 → 13.1072 ms; ×38 ≈ 500 ms |
| UART baud (BRGH=1) | `SPBRG = Fosc/(16×baud) − 1` | 9600 → SPBRG=129 (+0.16%) |
| ADC clock | `Tad ≥ 1.6 µs` | Fosc/64 → 3.2 µs; 12 Tad ≈ 38 µs/conv |
| PWM period | `(PR2+1)×4×Tosc×T2prescale` | PR2=249, 1:16 → 800 µs (1.25 kHz); duty 0–1000 |

### UART wiring (memorize)
TX→RX crossover + common GND + same baud both ends (scope/terminal: **9600 8-N-1**).
Step 6's Python logger talks to this exact setup.

## 3. Porting to PIC16F18345 (cheat table)

| Module | What changes on 16F18345 |
|---|---|
| Timer0 | New control regs `T0CON0/T0CON1` (not OPTION_REG); 8/16-bit selectable |
| EXT INT | Same idea (`INTF/INTE`), edge via `INTCONbits.INTEDG` |
| UART | **PPS required**: map TX→RC4 (`RC4PPS`), RX→RC5 (`RXPPS`); regs `TX1STA/RC1STA/SP1BRG` |
| ADC | Same idea + `ANSELA` for RA0; result regs `ADRESH/ADRESL`, start bit `ADGO` |
| PWM | CCP1 similar + **PPS**: map output (`RC2PPS` or any pin) |

## 4. Exercises

1. ⭐ Timer: change prescaler to 1:64 — recompute overflows needed for 500 ms.
2. ⭐ UART: add commands — receiving `'1'` turns RB0 on, `'0'` turns it off (no echo of the reply, send `"OK\r\n"`).
3. ⭐⭐ ADC+UART: print the ADC value as decimal over UART every 500 ms (hint: `uart_putc(v/1000 + '0')` per digit — no `printf` on small PICs!).
4. ⭐⭐ PWM: drive the duty from the pot (ADC → `pwm_set`) instead of auto-fade = manual dimmer.
5. ⭐⭐⭐ INT: count presses in the ISR (just `count++`), print count over UART in main every second — combines 3 modules.

## 5. Troubleshooting

| Symptom | Check |
|---|---|
| ISR never fires | Flag cleared? Enable chain (xxxIE + GIE/PEIE)? Wrong edge (INTEDG)? |
| ISR fires once then dies | You forgot to clear `TMR0IF`/`INTF` in the ISR |
| UART garbage | Baud mismatch (`_XTAL_FREQ`? SPBRG=129? terminal at 9600?), GND common? TX/RX swapped? |
| UART silent | `SPEN=1`? TRISC7=in/TRISC6=out? USB-UART driver installed? Right COM port? |
| ADC stuck at 0/1023 | Wrong channel/PCFG? RA0 really wired to wiper? Vref = VDD? |
| PWM pin dead/DC only | Must be **RC2/CCP1**; `PR2`/`T2CON`/`CCP1CON` order as in example; TRISC2=0? |

Next: **Step 5** — `04-advanced/`: I2C + EEPROM, SPI note, watchdog + sleep, config-word guide.
