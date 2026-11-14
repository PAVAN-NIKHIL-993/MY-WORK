# Module: firmware-intermediate (`03-intermediate/`)

- **Purpose:** the five professional patterns — Timer ISR, external interrupt + flag, UART, ADC, PWM — all on PIC16F877A @20 MHz.
- **Location:** [`03-intermediate/`](../../03-intermediate/README.md) — 5 `.c` + stage README (interrupt 4-rules, math sheet, 18345 porting table, exercises).
- **Responsibilities:** background timing (Timer0 1 Hz + free `main`), event input (RB0/INT falling edge), serial I/O (9600 echo + banner), sensing (AN0 pot → LED bar), actuation (CCP1 1.25 kHz breathing LED).
- **Public interface:** pins — RB0/RB1 (timer LEDs), RB0-btn/RB1-LED (INT), RC6/RC7 (UART), RA0 + RD0–3 (ADC bar), RC2 (PWM). UART banks on 9600 8-N-1.
- **Dependencies:** XC8 `<xc.h>`; UART examples pair with USB-UART + terminal/logger. **Consumers:** capstone (reuses UART+ADC+Timer patterns); Python pipeline consumes UART bytes.
- **Internal architecture:** 5 independent programs; shared *knowledge* (baud math, ISR rules) lives in the README, not code (D1).
- **Data/state:** `volatile` ISR counters/flags; ADC 10-bit temporaries; PWM duty loop var. No EEPROM use yet.
- **Error handling:** OERR/FERR self-heal in `uart_getc`; INT flag cleared-after-release swallows bounce retriggers; ISRs delay-free (verified).
- **Performance:** ISRs < 5 µs @13 ms–1 ms periods; UART IRQ-free polling OK at 9600 human rates.
- **Security:** n/a beyond bench assumptions. **Configuration:** same 8-line `#pragma` ×5; `SPBRG=129`, `ADCON1=0xCE`, `PR2=249` etc. ([CONFIGURATION](../CONFIGURATION.md)).
- **Runtime:** init → `while(1)`; two files enable GIE. **Interactions:** none cross-file; UART files are the PC-side's data source.
- **Failure modes:** ISR-once-then-dead (forgot flag clear); UART garbage (baud/GND); ADC stuck (PCFG/channel); PWM DC-only (wrong pin — must be RC2).
- **Debugging:** Simulator logic analyzer for UART/PWM; `PORTx` watches; loopback terminal test for echo.
- **Extension points:** UART commands, ADC→UART print, ADC→PWM dimmer, press-counter-over-UART (README exercises).
- **Modification risks:** MEDIUM — timing constants (`38` overflows, `129`, `249`) are computed; change clock ⇒ recompute all (use `baud_calc.py`).
- **Implementation:** [timer0](../components/timer0-blink-16f877a.md) · [extint](../components/extint-button-16f877a.md) · [uart](../components/uart-echo-16f877a.md) · [adc](../components/adc-read-16f877a.md) · [pwm](../components/pwm-dimmer-16f877a.md).
