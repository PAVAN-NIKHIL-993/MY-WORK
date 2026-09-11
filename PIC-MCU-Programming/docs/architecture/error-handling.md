# Error Handling

> Parent: [ARCHITECTURE](../ARCHITECTURE.md). Policy: handle locally where
> possible, otherwise fail loudly to stderr with an exit code. Nothing is
> silently swallowed — each `continue`/discard below is documented and reasoned.

## 1. Firmware (bare metal — self-heal, no exceptions)

| Site | Failure | Handling | Rationale |
|---|---|---|---|
| `uart_getc` | OERR (overrun) | CREN off/on (receiver reset) | Only recovery path; byte loss acceptable for echo/streaming |
| `uart_getc` | FERR (framing) | Discard byte, return 0 | One corrupt byte < stall; persistent FERR = baud fault (user-visible as garbage) |
| `i2c_write` | NACK (`ACKSTAT=1`) | Skip address, keep scanning | NACK is the *signal* (nobody home), not an error |
| `eeprom_write` | Prior write busy | Spin on `WR` bit first | 4 ms max; ordering guaranteed |
| WDT demo | Any hang | Hardware reset (~2.3 s) | The demo's entire point |
| `SLEEP` wake | Spurious wake | TO/PD check distinguishes cause | Documented in component doc |

## 2. Tools (exit-code contract — see [TESTING](../TESTING.md))

| Site | Failure | Handling |
|---|---|---|
| argparse | bad flag/values | `ERROR:` usage to stderr, exit 2 |
| `serial.Serial()` open | missing/busy/denied port | `ERROR: cannot open… Hint: --list`, exit 3 |
| `readline()` mid-run | unplug/driver drop | `ERROR: lost device…`, partial CSV kept, exit 3 |
| CSV open/write | bad path/permissions | `ERROR: cannot write…`, exit 2 |
| CSV mid-run write | disk full / perms | `ERROR: write to…failed`, exit 1, partial CSV kept |
| `parse_rows` | garbage lines | skip (header/banner/corruption indistinguishable — and all safe to skip) |
| `analyze_log` file | missing/unreadable | `ERROR: …`, exit 2 |
| `analyze_log` data | zero valid samples | message to stderr, exit 1 |
| `config_helper` | bad `--osc` | `ERROR:` + options to stderr, exit 2 |

## 3. Deliberately NOT handled (documented limits)

- UART has no checksum/retry (bench cable assumption; corruption → skipped line).
- Logger overwrites `--out` without asking (documented; use distinct names).
- Firmware assumes valid power/clock (BOR + PWRTE mitigate, can't fix bad wiring).
