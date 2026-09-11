# DEPENDENCIES

> Exactly **one** third-party runtime dependency in the whole topic. Everything
> else is Python stdlib or the external Microchip toolchain.

## 1. Direct dependencies

| Name | Version | Purpose | Used by | Config | Notes |
|---|---|---|---|---|---|
| `pyserial` | `>=3.5` ([requirements](../05-python-tools/requirements.txt)) | Serial port I/O + port listing | `serial_logger.py` only | none (API defaults) | Missing → friendly exit(1), never traceback; live tests skip |

## 2. Standard library modules (no install, no versions to pin)

`argparse` (all CLIs) · `csv` (logger/analyzer) · `sys` (exits/stderr) ·
`time` + `datetime` (logger timestamps) · `pathlib` (tests/checker) ·
`subprocess` (tests, no shell) · `importlib.util` (tests) · `tempfile`
(tests) · `re` (checker) · `unittest` (tests).

## 3. External toolchain (firmware — not in this repo, not installed here)

MPLAB X IDE v6.x + XC8 v2.x (Free) + PICkit. XC8 provides `<xc.h>`,
`__delay_ms/us`, `SLEEP()/CLRWDT()`, and per-device SFR bit names used by all
13 `.c` files. No third-party C libraries, no RTOS, no HAL.

## 4. Compatibility & limitations

- Python `<3.10` breaks on builtin-generic hints (`list[…]`) in `analyze_log.py`.
- `pyserial` 3.x API used (`Serial`, `list_ports.comports`, `SerialException`)
  is stable across 3.5+.
- XC8 Free vs PRO: examples use no PRO-only optimization; `-O1` fine.
- Transitive deps: none to document (pyserial has none required).
