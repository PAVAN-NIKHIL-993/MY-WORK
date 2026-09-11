# Data Models

> The four data shapes that cross a boundary, with types, lifecycles, and owners.

## 1. TempSample `(t_ms: int, temp_c: float)`

- **Born:** `temp_logger` (`tenths = ADC*5000/1024`, printed `ms,whole.frac`).
- **Travels:** UART line → CSV `raw_line` → `parse_rows()` tuple.
- **Dies:** end of `analyze_log` run (stats printed, nothing persisted).
- **Invariants:** `t_ms` monotonic within a run (mod 65536 wrap); `temp_c`
  plausible for LM35 (−55…150). Corrupt lines never become samples (skipped).

## 2. LoggerRow `(pc_time_iso: str, elapsed_s: float, raw_line: str)`

- **Born:** `serial_logger` per received line. **Lives:** in `--out` CSV
  (append-only during run; file overwritten per run — documented).
- **Consumers:** humans (`head`/spreadsheets), `analyze_log` (`row[-1]`).
- **Constraint:** column order fixed; `raw_line` LAST (parser relies on it — D7).

## 3. SpbrgResult `(spbrg: int 0–255, actual: float, err_pct: float)`

- **Born:** `spbrg_for()` pure math. **Lives:** one stdout report.
- **Contract:** `abs(err) < 2.0` ⇔ `[OK ]`; `spbrg == 129` for the canonical
  20 MHz/9600/BRGH1 case (asserted equal to the firmware constant in tests).

## 4. ConfigBlock `(chip, osc, lines[])`

- **Born:** `config_helper.BLOCKS` + `--osc` substitution. **Lives:** pasted
  into `main.c` tops (source of truth thereafter is the `.c` file, not the tool).
- **Constraint:** 877A/18345 blocks ≡ firmware files (test-locked); 18F45K22
  carries a permanent "Starter" label (D8).

## Lifecycle summary

Firmware samples are ephemeral (RAM) unless logged (CSV, user-managed) or
counted (EEPROM, device-lifetime). Nothing replicates, migrates, or backs up —
by design for a bench workspace.
