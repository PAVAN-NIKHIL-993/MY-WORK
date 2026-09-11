# Debugging Guide (bench decision tree)

> Symptom catalog: [TROUBLESHOOTING](../TROUBLESHOOTING.md). Theory: [error-handling](../architecture/error-handling.md).

## 1. "Nothing works" — go in this order (each step gates the next)

1. **Power:** meter 5 V AT the VDD pins (not the supply). Power LED on?
2. **Reset:** MCLR ≈ 5 V? (10k pull-up fitted?) Programs OK via PICkit?
3. **Clock:** crystal present iff `FOSC = HS`? 18345: `OSCFRQ` set + `HFIOFR`?
   Blink rate sane? (Rate ×2/÷2 ⇒ `_XTAL_FREQ` lie.)
4. **GPIO:** TRIS direction? ANSEL digital? LED polarity + 330 Ω?
5. **Peripheral:** enable chain (xxxIE + GIE/PEIE)? Flag cleared in ISR?
   ADC channel/PCFG? PWM on RC2? I2C pull-ups?
6. **UART:** terminal @9600? common GND? TX→RX crossover? `baud_calc.py` < 2%?
7. **PC:** `--list` sees port? `dialout` perms? `head` the CSV for raw lines?

## 2. Firmware tactics (MPLAB X)

- **Simulator first:** watches on `PORTx`/flags, stopwatch for periods, logic
  analyzer for UART/PWM, stimulus files for ADC/INT pins.
- **Debugger second:** breakpoint in ISR (hit rate sane?), SFR view for
  `OPTION_REG/ADCONx/SSPx`, single-step init sequences.
- **Hardware last:** heartbeat LEDs are printf — every example has one; add
  temporary UART prints via the TX pattern before guessing.

## 3. Python tactics

- Reproduce with the smallest CLI (`--help` → `--list` → 5 s capture).
- `run_cli` in a REPL doubles as a debugger for argument handling.
- CSV forensics: `head`, `wc -l`, then `analyze_log.py` (its skip-count is
  diagnostic: samples ≪ lines ⇒ stream/format mismatch).

## 4. What NOT to do

- Don't "fix" baud by trying random terminal rates — compute with `baud_calc.py`.
- Don't clear an ISR flag "just in case" outside its ISR — you'll mask the bug.
- Don't commit a wiring workaround without documenting it (photos + note).
