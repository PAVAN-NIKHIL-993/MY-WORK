# Step 7 — Capstone: `temp-logger` (PIC + UART + Python, end to end)

You built every piece in Steps 2–6. Now combine them into one real instrument:
a **temperature logger** — PIC senses, streams, PC captures, Python analyzes.

```
LM35 --(analog)--> [PIC16F877A: ADC + Timer0 + UART] --(9600 8-N-1)-->
USB-UART --> [PC: serial_logger.py -> temp.csv -> analyze_log.py]
```

## 1. Files

| File | What it is |
|---|---|
| `temp_logger_16f877a.c` | Firmware: ADC + 1 ms Timer0 clock + UART CSV stream (`t_ms,temp_c` @ 2 Hz) |
| `analyze_log.py` | PC side: min/max/avg + ASCII chart from the capture (stdlib only) |
| `quiz.md` | Final quiz covering Steps 2–7 (with answers) |

PC capture uses `../05-python-tools/serial_logger.py` from Step 6.

## 2. Wiring (all known from earlier steps)

- LM35: `+Vs → +5V`, `Vout → RA0/AN0`, `GND → GND` (flat face toward you:
  left pin = +Vs, middle = Vout, right = GND — verify on your part!).
- RC6/TX → USB-UART RX, GND common. RB0 LED + 330 Ω (heartbeat).
- Minimum circuit: decoupling caps, MCLR 10k pull-up, ICSP header.

## 3. Run it (4 commands)

```bash
# 1) Flash temp_logger_16f877a.c (MPLAB X: F11 build, F6 run)
# 2) Find port + capture 60 s (from 05-python-tools/)
python serial_logger.py --list
python serial_logger.py --port <YOUR_PORT> --baud 9600 --out temp.csv --seconds 60

# 3) Analyze (from 06-projects/)
python analyze_log.py temp.csv
```

Expected `temp.csv` (first lines):

```
pc_time_iso,elapsed_s,raw_line
2026-...,...,t_ms,temp_c
2026-...,...,500,27.3
2026-...,...,1000,27.3
```

Expected analysis: ~120 samples, sane room temp (≈ 20–35 °C), flat chart.
**Touch the LM35** mid-capture — the chart should visibly rise. 

`analyze_log.py` exits: `0` ok · `1` no valid samples · `2` unreadable file
(errors to stderr). Covered by `tests/test_analyze_log.py` (run
`python -m unittest discover -s tests` from the topic root).

## 4. How the firmware works (read the `.c` top comment first)

- **Timer0 ISR** = 1 ms clock (`ms_ticks`, reload TMR0=100 @ 1:32 prescale).
- **main() is non-blocking**: `if (millis() - last >= 500)` → sample + send.
  No `__delay` in the loop — the professional pattern from Step 4, leveled up.
- **16-bit `volatile` read is guarded** (`millis()` disables GIE briefly) —
  an 8-bit CPU reads it in 2 instructions, an interrupt between them corrupts it.
- **No `printf`**: `uart_putdec16()` prints integers with ~30 bytes of code.
- **Integer sensor math**: `tenths = ADC*5000/1024` (32-bit intermediate —
  `1023*5000` doesn't fit in 16 bits!).

## 5. Stretch goals (pick any)

1. ⭐ Add a `STATUS` LED blink code when temp > 40 °C (threshold alarm).
2. ⭐⭐ Store the daily max in data EEPROM (Step 5) and print it at boot.
3. ⭐⭐⭐ Sleep between samples (Step 5 WDT, ~2 s cadence) and measure current.
4. ⭐⭐⭐ Swap LM35 for your own sensor (LDR, pot, current sensor) — only the
   `adc → units` line changes. That's the power of the pattern.

## 6. 🏁 Workspace completion checklist

- [ ] Step 2: I can pick a PIC, set up MPLAB X + XC8, and wire the minimum circuit.
- [ ] Step 3: Blink + button + debounce work on real hardware.
- [ ] Step 4: I use Timer interrupts, UART, ADC, PWM (and can do the baud math).
- [ ] Step 5: I've scanned I2C, written EEPROM, used WDT/sleep, and understand configs.
- [ ] Step 6: I log UART to CSV and generate config blocks with the Python tools.
- [ ] Step 7: `temp-logger` runs end to end; I touched the LM35 and saw the chart move.
- [ ] I scored ≥ 10/12 on `quiz.md`.

**Done?** You've gone from zero to a complete PIC sensing system. 🎉
Next horizons: PIC18F interrupts/priorities, I2C sensor drivers (BME280),
low-power design, PCB layout for your logger.
