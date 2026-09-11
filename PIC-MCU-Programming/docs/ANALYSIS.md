# STEP 3 — Implementation Analysis (from reading the actual code)

> Method: all 4 Python programs read in full; all 13 `.c` files audited by
> header/config/pattern inspection (`#pragma` counts, `_XTAL_FREQ`, `volatile`,
> ISR-delay scan); all READMEs + ROADMAP reviewed. No assumptions.
> Date: 2026-09-11. Scope: `PIC-MCU-Programming/` only (32 files).

## 1. What the project is

A **staged embedded-learning workspace**: PIC microcontroller firmware examples
in C (MPLAB XC8) progressing basics → intermediate → advanced → capstone,
plus PC-side Python tools (baud math, UART logging, config generation, data
analysis). There is **no web UI, no database, no network API, no auth** —
the "API" is the **UART serial protocol** (9600 8-N-1, CSV-ish text lines)
and "storage" is **on-chip data EEPROM + local CSV files**.

## 2. Architecture (as built)

```
 01-docs/            learning guides (family, toolchain, wiring) — docs only
 02-basics/          4 standalone .c (blink/button x 2 chips) + notes
 03-intermediate/    5 standalone .c (Timer0, EXT-INT, UART, ADC, PWM) + notes
 04-advanced/        3 standalone .c (I2C scan, EEPROM, WDT/sleep)
                     + SPI note (code listing) + config guide + notes
 05-python-tools/    3 CLI tools (baud_calc, serial_logger, config_helper)
 06-projects/        capstone: temp_logger .c + analyze_log.py + quiz + notes
```

Key architectural facts (verified):
- Every `.c` is **standalone single-file** (own `#pragma config`, own helpers)
  by design: paste into a fresh MPLAB X project and build. Total 967 C lines.
- Config blocks: 8 `#pragma` lines on all 11 × PIC16F877A files, 5 on the
  2 × PIC16F18345 files. `_XTAL_FREQ` is 20000000 (877A) / 8000000 (18345)
  everywhere — consistent.
- All 3 ISRs are delay-free; all 3 ISR-shared variables are `volatile`
  (`t0_count`, `int_flag`, `ms_ticks`); `temp_logger` reads 16-bit `ms_ticks`
  under a GIE guard. Interrupt discipline is correct.
- Python is 316 lines total, argparse CLIs, stdlib-only except `pyserial`
  (one dependency, `requirements.txt`, `pyserial>=3.5`).

## 3. Module inventory

| Module | Location | Lines | Purpose | Deps |
|---|---|---|---|---|
| Guides | `01-docs/` (3 md) | ~295 | Family/toolchain/wiring knowledge | none |
| Basics fw | `02-basics/` (4 c) | 212 | GPIO, delays, debounce, 2 chips | XC8 headers |
| Intermediate fw | `03-intermediate/` (5 c) | 345 | Timer0/INT/UART/ADC/PWM | XC8 headers |
| Advanced fw | `04-advanced/` (3 c + 2 md) | 265 c | I2C/EEPROM/WDT/SPI/configs | XC8 headers |
| Capstone fw | `06-projects/temp_logger_16f877a.c` | 145 | ADC+Timer0+UART CSV stream | XC8 headers |
| baud_calc | `05-python-tools/baud_calc.py` | 58 | SPBRG + error % | stdlib |
| serial_logger | `05-python-tools/serial_logger.py` | 87 | UART → console + CSV | pyserial |
| config_helper | `05-python-tools/config_helper.py` | 92 | `#pragma` block printer | stdlib |
| analyze_log | `06-projects/analyze_log.py` | 79 | CSV stats + ASCII chart | stdlib |

## 4. Data flow (the one real pipeline)

```
LM35 --analog--> RA0/AN0 --ADC--> temp_logger --UART 9600 8-N-1-->
USB-UART --> serial_logger.py --CSV--> temp.csv --parse--> analyze_log.py
```

Line protocol (verified in both producer and consumer): `t_ms,temp_c\r\n`
with one header line `t_ms,temp_c`; logger wraps as
`pc_time_iso,elapsed_s,raw_line`. `analyze_log.parse_rows` tolerates both
wrapped and plain `ms,temp` CSVs and skips headers/garbage. ✔ consistent.

## 5. Configuration & state

- Firmware config = compile-time `#pragma config` + `_XTAL_FREQ` (+ `OSCFRQ`
  on 18345). No runtime config, no env vars, no files. Correct for bare metal.
- Python config = CLI args only (`--port/--baud/--out/--seconds`, `--fosc`,
  `--chip/--osc`). No env vars, no config files. State = local CSV output.
- No secrets, credentials, tokens, or keys anywhere in the topic folder
  (nothing to leak; verified by content review).

## 6. Error-handling audit — REAL issues found (fix in STEPS 5–8)

| # | Location | Problem | Severity |
|---|---|---|---|
| E1 | `serial_logger.py` | `serial.Serial()` outside try/except → missing/denied port prints a raw traceback instead of a friendly error | Medium — first-run UX |
| E2 | `serial_logger.py` | `--baud 0/-1`, `--seconds -5` unvalidated (garbage in) | Low |
| E3 | `baud_calc.py` | `--baud 0` → `ZeroDivisionError` traceback; negative `--fosc`/`--baud` produce nonsense silently | Medium — crash on bad input |
| E4 | `analyze_log.py` | Missing/unreadable CSV → raw `FileNotFoundError` traceback | Low–Medium |
| E5 | `analyze_log.py` | No type hints (others have them) — consistency nit | Low |
| E6 | `config_helper.py` | 18F45K22 block is a clearly-marked *starter*, never hardware-verified (honest as-is; must stay labeled) | Doc risk, not bug |

Firmware-side: error handling is appropriate for bare metal (OERR/FERR reset
in `uart_getc`, ACKSTAT checks in I2C, WR-wait in EEPROM). No changes needed.

## 7. Failure points & risks

- **F1. Firmware cannot be compiled here** (no XC8/MPLAB in sandbox). All C
  verification is pattern audit + review, never a build. This is the biggest
  residual risk and must be stated honestly in TESTING/COVERAGE docs.
- **F2. UART helpers duplicated** in `uart_echo`, `i2c_scanner`, `temp_logger`
  (and SPI note). INTENTIONAL (standalone paste-and-build files) — do NOT
  "deduplicate" into a shared header; that would break the design. Document it.
- **F3. 18F45K22 coverage is config-only** (no firmware examples). Honest gap;
  do not document 18F firmware behavior as verified.
- **F4. No automated tests exist** (only manual runs). Python is fully testable
  here with stdlib `unittest` — the highest-value addition of this refinement.

## 8. Technical debt (genuine, small)

1. Zero tests → add `tests/` (stdlib unittest, no new deps).
2. CLI input validation gaps (E1–E4) → friendly errors + exit codes.
3. No engineering docs (`docs/` missing) → STEP 9 deliverable.
4. No lint/typecheck baseline → run `py_compile` + `pyflakes`-if-available;
   document that mypy/pylint are optional, not enforced.
5. `ROADMAP.md` describes the *build* history; keep as-is (historical record),
   new work tracked in `docs/CHANGELOG.md`.

## 9. What must NOT change

- Firmware behavior, pin choices, and standalone single-file structure.
- Learning guides, quiz, and their checked register values.
- `baud_calc` math and `config_helper` 16F877A/16F18345 blocks (verified).
- Anything outside `PIC-MCU-Programming/` (root README, `.git`).

## 10. STEP 3 checkpoint

Architecture, modules, data flow, config, deps, integration points, error
handling, failure points, and debt are understood from the real code and
recorded above. No implementation started. Ready for STEP 4 (design).
