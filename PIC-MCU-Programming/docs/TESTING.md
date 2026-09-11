# TESTING

> Strategy + commands here. Test inventory: [test-strategy](testing/test-strategy.md) ·
> [test-cases](testing/test-cases.md). Honest rule: only runnable-here results are claimed.

## 1. How to run

```bash
cd PIC-MCU-Programming
python -m unittest discover -s tests     # 26 tests (stdlib only)
python scripts/check_docs.py             # docs integrity gate
```

Last verified: **26 tests, OK (5 skipped: pyserial absent)** — suite exit 0.

## 2. Test matrix

| Area | Type | Covered | Important cases |
|---|---|---|---|
| `baud_calc` math | unit | ✅ | SPBRG=129 @20M/9600 (= firmware const), BRGH0, 8M/115200 WARN, clamp 255 |
| `baud_calc` CLI | black-box | ✅ | `--baud 0`→exit 2 (was crash), negatives→2, `--all` sweeps |
| `config_helper` | unit + CLI | ✅ | 3 chips, 877A≡firmware block, bad osc→2/stderr, `--list` |
| `analyze_log` parsing | unit | ✅ | wrapped + plain CSV, garbage skipped, chart smoke |
| `analyze_log` CLI | black-box | ✅ | stats exact, missing file→2 (was traceback), empty→1 |
| `serial_logger` guard | black-box | ✅ | no-pyserial→exit 1 + hint |
| `serial_logger` live | black-box | ⏭️ skip here | `--list`, missing `--port`→2, bad port→3 (need pyserial) |
| Docs links/sources | script | ✅ | `check_docs.py`: 0 broken links; unreferenced-source WARNs |
| Firmware compile | — | ❌ gap | No XC8 here (see §4) |
| Firmware on hardware | manual | ❌ gap | Claimed by no one; procedures in stage READMEs |

## 3. Exit codes (contract, tested)

| Code | Meaning | Produced by |
|---|---|---|
| 0 | Success (incl. Ctrl+C stop, `--list`) | all tools |
| 1 | Environment / no-data (pyserial missing; zero samples) | logger, analyzer |
| 2 | Usage / bad input (argparse, bad values, unreadable file) | all tools |
| 3 | Serial device failure (open failed, mid-run disconnect) | logger |

## 4. Known gaps (do not over-claim)

1. **No firmware compilation** in this environment — C is audit-verified only
   ([ANALYSIS](ANALYSIS.md) §7/F1). A machine with XC8 should build all 13 files.
2. **No hardware-in-the-loop** — UART/ADC/I2C behaviors are review-verified.
3. **No linter/typecheck gate** — `py_compile` + tests only; mypy/pylint optional.
