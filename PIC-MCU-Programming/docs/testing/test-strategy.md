# Test Strategy

> Parent: [TESTING](../TESTING.md). Framework: stdlib `unittest`, zero new deps
> ([D4](../architecture/decisions.md)). Run: `python -m unittest discover -s tests`.

## 1. Levels (what runs where)

| Level | Method | Runs here? | Covers |
|---|---|---|---|
| Pure-function unit | `importlib` file-load, direct asserts | ✅ | baud math, block text, CSV parsing, chart smoke |
| CLI black-box | `subprocess` (`run_cli`, no shell) | ✅ | exit codes, stdout/stderr split, validation, `--list` guard |
| Hardware-conditional | same, `skipUnless(pyserial)` | ⏭️ skips | port open failures, arg validation behind the import guard |
| Docs integrity | `scripts/check_docs.py` | ✅ | 0 broken links, 0 unreferenced sources |
| Firmware build | XC8 (absent) | ❌ gap | must run on a Microchip-tooled machine |
| Hardware-in-loop | bench procedures | ❌ gap | stage READMEs describe manual checks (LED/UART/ADC…) |

## 2. Policies

- **Skip, don't fake:** unavailable deps/hardware skip with a reason; a test
  that can't run must never print a false green (or red).
- **Exit codes are contract:** every user/device failure path has an asserted
  exit code + stderr marker (`ERROR`, `--list` hint).
- **Cross-checks over duplicates:** tests assert tool≡firmware consistency
  (SPBRG 129, 877A block text) rather than re-stating constants.
- **Fixtures are canonical:** `tests/data/sample_temp.csv` doubles as the
  format example; changing it requires updating tests + [schema](../database/schema.md).
- **No flakiness sources:** no sleeps, no network, no real ports in the suite
  (fake port names only, expecting clean failures).

## 3. Coverage honesty

Claimed: 26 automated checks over 4 tools + docs gate. NOT claimed: firmware
compilation, on-chip behavior, timing measurements. See the matrix in
[TESTING](../TESTING.md) and open gaps in [coverage](../DOCUMENTATION_COVERAGE.md).
