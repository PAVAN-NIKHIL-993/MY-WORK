# API: CLI Contracts (all four tools)

> Calling convention: `python <tool>.py [args]`; stdout = data/report,
> stderr = diagnostics/`ERROR:`; exit codes 0/1/2/3 ([TESTING](../TESTING.md)).
> `--help` on each tool is authoritative; this file is the stable summary.

## `baud_calc.py` — SPBRG computer

- **Args:** `--fosc` (req, int > 0) · `--baud` (def 9600, int > 0) ·
  `--brgh` (0/1, def 1) · `--all` (sweep 8 common bauds).
- **Output:** `[OK ]/[WARN] Fosc=… baud=… BRGH=… -> SPBRG=… actual=… error=…%`
  (+ comparison block, or 8 lines with `--all`).
- **Errors:** non-positive inputs → exit 2. **Example:**
  `python baud_calc.py --fosc 20000000 --baud 9600` → `SPBRG=129 … +0.16%`.

## `serial_logger.py` — UART capture

- **Args:** `--port` (req unless `--list`; plain ports and pyserial URLs like `loop://`, `socket://…`) · `--baud` (def 9600, > 0) ·
  `--out` (def `pic_log.csv`) · `--seconds` (def 0 = forever, ≥ 0) · `--list`.
- **Output:** stdout live `[elapsed] line` + final `Saved N lines…`; file:
  header + `pc_time_iso,elapsed_s,raw_line` rows ([schema](../database/schema.md)).
- **Errors:** no pyserial → 1; usage → 2; open/disconnect → 3 (hint included); mid-run write failure → 1.
- **Example:** `--port /dev/ttyUSB0 --baud 9600 --out t.csv --seconds 60`.

## `config_helper.py` — pragma printer

- **Args:** `--chip` (req: 16F877A/16F18345/18F45K22) · `--osc` (chip list,
  defaulted) · `--list`.
- **Output:** comment header + `#pragma` lines to stdout (paste into `main.c`).
- **Errors:** bad `--osc` → stderr `ERROR:` + options, exit 2.

## `analyze_log.py` — capture analysis

- **Args:** `csvfile` positional (wrapped or plain layout).
- **Output:** `Samples/Duration/Min/Max/Average` + ASCII chart to stdout.
- **Errors:** unreadable file → 2; zero valid samples → 1 (both to stderr).
- **Example:** `python analyze_log.py t.csv` → `Samples : 120 …`.

## `check_docs.py` — repo maintenance (not product API, documented for ops)

- **Args:** `--strict` (warnings fail). **Output:** counts + `WARN:`/`FAIL:` lines.
- **Exit:** 0 pass · 1 fail.
