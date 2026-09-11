# PIC MCU Programming

## Purpose & problem

Learning PIC microcontrollers is fragmented: scattered tutorials, inconsistent
examples, and no path from "blink an LED" to a complete sensing system. This
topic packages a **staged, hardware-verified learning workspace** — 13
standalone XC8 firmware programs (PIC16F877A + PIC16F18345), 4 PC-side Python
tools, and a capstone temperature logger — with consistent wiring, configs,
and engineering-grade documentation.

## Product overview

| Stage | Folder | Contents |
|---|---|---|
| Guides | `01-docs/` | PIC family, toolchain setup, wiring/power |
| Basics | `02-basics/` | Blink + button × 2 chips |
| Intermediate | `03-intermediate/` | Timer0, EXT-INT, UART, ADC, PWM |
| Advanced | `04-advanced/` | I2C scanner, EEPROM, WDT/sleep, SPI, config guide |
| PC tools | `05-python-tools/` | `baud_calc`, `serial_logger`, `config_helper` |
| Capstone | `06-projects/` | `temp_logger` firmware + `analyze_log.py` + quiz |
| Engineering | `docs/` | Architecture, structure, setup, testing, ops… (this system) |
| Tests | `tests/` | 26 automated checks (stdlib `unittest`) |
| Scripts | `scripts/` | `check_docs.py` link/source verifier |

## Key capabilities

- Every `.c` is **standalone**: paste into a fresh MPLAB X project, build (F11), flash (F6).
- UART 9600 8-N-1 text protocol → `serial_logger.py` → timestamped CSV → `analyze_log.py` stats + chart.
- `baud_calc.py` validates SPBRG/error% before you flash; `config_helper.py` prints safe `#pragma` blocks.
- Exit-code + stderr conventions on all CLIs; friendly errors, never tracebacks.

## Technology stack

- **Firmware:** C (MPLAB XC8, Free mode OK) for PIC16F877A / PIC16F18345.
- **PC tools:** Python 3.10+ (stdlib only, except `pyserial>=3.5` for the logger).
- **Tools/hardware:** MPLAB X IDE, PICkit 3/4/5, USB-UART module, breadboard parts.
- **Docs/tests:** Markdown + Mermaid; `unittest`; no frameworks, no services.

## Architecture summary

Two halves joined by UART: bare-metal firmware (sense → stream `t_ms,temp_c`)
and PC tools (capture → CSV → analyze). No network, database, auth, or UI.
Details: [ARCHITECTURE](docs/ARCHITECTURE.md) · [data flow](docs/architecture/data-flow.md) ·
[serial protocol](docs/api/uart-protocol.md).

## Requirements

- Python 3.10+ on the PC (`python --version`); `pip install -r 05-python-tools/requirements.txt` for logging.
- For firmware: MPLAB X + XC8 + PICkit + a PIC16F877A or PIC16F18345 board (see [SETUP](docs/SETUP.md)).

## Setup / commands

```bash
# PC tools: nothing to build — run directly
python 05-python-tools/baud_calc.py --fosc 20000000 --baud 9600
python 05-python-tools/serial_logger.py --list

# Tests (26 checks, stdlib only)
python -m unittest discover -s tests

# Docs integrity
python scripts/check_docs.py

# Firmware: MPLAB X → New Project (device = file's chip) → paste .c → F11 → F6
```

## Configuration

No environment variables, no config files. Firmware config is compile-time
(`#pragma config`, `_XTAL_FREQ`); tools take CLI args only.
Full tables: [CONFIGURATION](docs/CONFIGURATION.md).

## Deployment overview

Firmware "deployment" = flashing via PICkit (ICSP) and verifying on hardware;
Python tools need no deployment. See [DEPLOYMENT](docs/DEPLOYMENT.md) and
[OPERATIONS](docs/OPERATIONS.md).

## Limitations (honest)

- Firmware is **audit-verified, not compiled here** (no XC8 in this environment) — build on a machine with MPLAB X + XC8.
- Serial-live tests skip without `pyserial`/hardware; PIC18F coverage is config-starter only.
- Examples target learning, not certified/safety-critical use.

## Security

No credentials, keys, auth, or network code anywhere (grep-verified). Dial-out
group needed for `/dev/ttyUSB0` on Linux. Details: [SECURITY](docs/SECURITY.md).

## Documentation index

Core: [ARCHITECTURE](docs/ARCHITECTURE.md) · [PROJECT_STRUCTURE](docs/PROJECT_STRUCTURE.md) ·
[SETUP](docs/SETUP.md) · [CONFIGURATION](docs/CONFIGURATION.md) · [ENVIRONMENT](docs/ENVIRONMENT.md) ·
[DEPENDENCIES](docs/DEPENDENCIES.md) · [DEVELOPMENT](docs/DEVELOPMENT.md) · [BUILD](docs/BUILD.md) ·
[TESTING](docs/TESTING.md) · [DEPLOYMENT](docs/DEPLOYMENT.md) · [OPERATIONS](docs/OPERATIONS.md) ·
[TROUBLESHOOTING](docs/TROUBLESHOOTING.md) · [SECURITY](docs/SECURITY.md) · [PERFORMANCE](docs/PERFORMANCE.md) ·
[ACCESSIBILITY](docs/ACCESSIBILITY.md) · [CHANGELOG](docs/CHANGELOG.md) · [COVERAGE](docs/DOCUMENTATION_COVERAGE.md)

Deep dives: [architecture/](docs/architecture/system-overview.md) · [modules/](docs/modules/python-tools.md) ·
[components/](docs/components/temp-logger-16f877a.md) · [api/](docs/api/overview.md) ·
[database/](docs/database/schema.md) · [testing/](docs/testing/test-strategy.md) · [guides/](docs/guides/developer-guide.md)

History: [ANALYSIS](docs/ANALYSIS.md) (refinement audit) · [DESIGN](docs/DESIGN.md) (refinement plan) ·
[ROADMAP](ROADMAP.md) (original build log, historical).
