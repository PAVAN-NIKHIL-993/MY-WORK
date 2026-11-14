# PROJECT_STRUCTURE

> Directory-by-directory + significant-file-by-file. Per-program depth lives in
> [components/](components/temp-logger-16f877a.md) (firmware/tools) and
> [modules/](modules/python-tools.md) (subsystems); this file maps everything.

## 1. Directories

| Directory | Purpose / role | Belongs | Must NOT belong |
|---|---|---|---|
| `PIC-MCU-Programming/` (root) | Topic entry: README, roadmap, ignores | README, ROADMAP, `.gitignore` | Source code, captures (`*.csv` ignored) |
| `01-docs/` | PIC learning guides (human knowledge) | Concept/setup/wiring `.md` | Code, configs |
| `electronics-fundamentals/` | Supplemental electronics curriculum | Markdown lessons; no firmware | PIC-stage firmware or hardware-validation claims |
| `lc-inductance-meter/` | Separate Arduino LC-inductance prototype | README, `.ino`, SVG, plain-text guide | PIC-stage integration or unverified accuracy claims |
| `02-basics/` … `04-advanced/` | Firmware stages (increasing difficulty) | Standalone `.c` + stage README | Shared headers (by design: none) |
| `05-python-tools/` | PC CLI tools | 3 tools + `requirements.txt` + README | Firmware, tests |
| `06-projects/` | Capstone system | Firmware + analyzer + quiz + README | Stage examples |
| `tests/` | Automated verification | `unittest` suites + `data/sample_temp.csv` | Product code |
| `scripts/` | Repo maintenance | `check_docs.py` | Product code |
| `docs/` | This engineering system | Arch/structure/setup/… + subdirs | Code, captures |

## 2. File map (every significant file → its detailed doc)

| File | Purpose (one line) | Detailed doc |
|---|---|---|
| `README.md` | Topic entry point (this product's front door) | §3 below |
| `electronics-fundamentals/README.md` | Supplemental theory-track index | [electronics-fundamentals/](../electronics-fundamentals/README.md) |
| `lc-inductance-meter/README.md` | Arduino LC-meter prototype, build limits, calibration | [LC meter](../lc-inductance-meter/README.md) |
| `lc-inductance-meter/lc_inductance_meter.ino` | ATmega328P-specific Arduino sketch | [LC meter](../lc-inductance-meter/README.md) |
| `lc-inductance-meter/schematic.svg` | 16:9 connection diagram | [LC meter](../lc-inductance-meter/README.md) |
| `lc-inductance-meter/build-guide.txt` | Plain-text wiring and assembly guide | [LC meter](../lc-inductance-meter/README.md) |
| `ROADMAP.md` | Original 7-step build log (historical) | §3 below |
| `.gitignore` | Ignores `__pycache__`, `*.csv` (keeps `sample*.csv`), `*.log` | §3 below |
| `01-docs/00-pic-family-overview.md` | PIC families, blocks, pins, terms | [learning-guides](modules/learning-guides.md) |
| `01-docs/01-toolchain-setup.md` | MPLAB X + XC8 + PICkit + simulator setup | [learning-guides](modules/learning-guides.md) |
| `01-docs/02-wiring-and-power-basics.md` | Minimum circuit, LED/button/UART wiring | [learning-guides](modules/learning-guides.md) |
| `02-basics/blink_16f877a.c` | LED blink, 20 MHz crystal | [components/blink-16f877a](components/blink-16f877a.md) |
| `02-basics/blink_16f18345.c` | LED blink, 8 MHz internal osc | [components/blink-16f18345](components/blink-16f18345.md) |
| `02-basics/button_16f877a.c` | Button + debounce, external pull-up | [components/button-16f877a](components/button-16f877a.md) |
| `02-basics/button_16f18345.c` | Button + debounce, internal WPU | [components/button-16f18345](components/button-16f18345.md) |
| `03-intermediate/timer0_blink_16f877a.c` | Timer0 ISR 1 Hz blink | [components/timer0-blink](components/timer0-blink-16f877a.md) |
| `03-intermediate/extint_button_16f877a.c` | RB0/INT + ISR-flag pattern | [components/extint-button](components/extint-button-16f877a.md) |
| `03-intermediate/uart_echo_16f877a.c` | UART echo 9600 + banner | [components/uart-echo](components/uart-echo-16f877a.md) |
| `03-intermediate/adc_read_16f877a.c` | Pot → 4-LED bar | [components/adc-read](components/adc-read-16f877a.md) |
| `03-intermediate/pwm_dimmer_16f877a.c` | CCP1 PWM breathing LED | [components/pwm-dimmer](components/pwm-dimmer-16f877a.md) |
| `04-advanced/i2c_scanner_16f877a.c` | I2C bus scan → UART report | [components/i2c-scanner](components/i2c-scanner-16f877a.md) |
| `04-advanced/eeprom_demo_16f877a.c` | EEPROM press counter | [components/eeprom-demo](components/eeprom-demo-16f877a.md) |
| `04-advanced/watchdog_sleep_16f877a.c` | WDT + SLEEP + TO/PD | [components/watchdog-sleep](components/watchdog-sleep-16f877a.md) |
| `04-advanced/spi_loopback_note.md` | SPI loopback wiring + full listing | [firmware-advanced](modules/firmware-advanced.md) |
| `04-advanced/config_word_guide.md` | Every `#pragma` explained | [firmware-advanced](modules/firmware-advanced.md) |
| `05-python-tools/baud_calc.py` | SPBRG + error% calculator | [components/baud-calc](components/baud-calc.md) |
| `05-python-tools/serial_logger.py` | UART → console + CSV | [components/serial-logger](components/serial-logger.md) |
| `05-python-tools/config_helper.py` | `#pragma` block printer | [components/config-helper](components/config-helper.md) |
| `05-python-tools/requirements.txt` | `pyserial>=3.5` (only dep) | §3 below |
| `06-projects/temp_logger_16f877a.c` | Capstone: ADC+Timer0+UART CSV | [components/temp-logger](components/temp-logger-16f877a.md) |
| `06-projects/analyze_log.py` | CSV stats + ASCII chart | [components/analyze-log](components/analyze-log.md) |
| `06-projects/quiz.md` | 12-question final quiz + answers | [capstone-system](modules/capstone-system.md) |
| `tests/test_baud_calc.py` etc. (4) | 28 automated cases | [test-cases](testing/test-cases.md) |
| `tests/helpers.py` | `load_module` + `run_cli` | §3 below |
| `tests/data/sample_temp.csv` | Canonical wrapped-format sample | §3 below |
| `scripts/check_docs.py` | Link/source verifier | §3 below |
| Stage `README.md` ×5 | Per-stage notes/exercises/troubleshooting | Respective [modules/](modules/python-tools.md) |

## 3. Full file records (files with no component doc)

**File:** `README.md` · **Path:** `PIC-MCU-Programming/README.md`
**Purpose:** product front door. **Responsibilities:** pitch, stack, commands,
limits, doc index. **Exports:** none. **Dependencies:** none (links verified by
`check_docs.py`). **Consumers:** every newcomer. **Runtime:** n/a.
**Failure:** stale commands mislead → fixed by running commands in [TESTING](TESTING.md).
**Config:** none. **Modification risks:** keep command snippets runnable; keep
links relative. **Related:** all of `docs/`.

**Directory:** `electronics-fundamentals/` · **Path:** `PIC-MCU-Programming/electronics-fundamentals/`
**Purpose:** standalone Markdown lessons extracted and cleaned from the supplied
educational material (passives through digital logic, memory, 8051, and review).
**Index:** [electronics-fundamentals/README.md](../electronics-fundamentals/README.md).
**Scope:** theory only; no firmware, hardware validation, or device-specific
values are implied. Exact-part behavior belongs to the manufacturer's datasheet.

**Directory:** `lc-inductance-meter/` · **Path:** `PIC-MCU-Programming/lc-inductance-meter/`
**Purpose:** separate low-voltage Arduino/LM393 inductance-meter prototype.
**Contents:** README, ATmega328P sketch, 16:9 SVG diagram, and plain-text build
instructions. **Status:** educational, not bench-validated; the README records
input-limit, timing-resolution, and calibration caveats. Not part of the PIC
firmware stages and not a full LCR meter.

**File:** `ROADMAP.md` · **Path:** `PIC-MCU-Programming/ROADMAP.md`
**Purpose:** historical log of the original 7 build steps. **Responsibilities:**
record only — do NOT extend for new work (use [CHANGELOG](CHANGELOG.md)).
**Modification risks:** editing history confuses audits; append-only if ever.

**File:** `.gitignore` · **Path:** `PIC-MCU-Programming/.gitignore`
**Purpose:** keep caches + user captures out of git. **Rules:** `__pycache__/`,
`*.pyc/o`, `*.csv` except `sample*.csv` (test fixture must commit), `*.log`.
**Modification risks:** ignoring `sample*.csv` breaks `test_analyze_log`.

**File:** `requirements.txt` · **Path:** `05-python-tools/requirements.txt`
**Purpose:** sole PC dependency. **Content:** `pyserial>=3.5`.
**Consumers:** `serial_logger.py`, users. **Modification risks:** pinning an old
version may break `--list`; see [DEPENDENCIES](DEPENDENCIES.md).

**File:** `helpers.py` · **Path:** `tests/helpers.py`
**Purpose:** test-only imports. **Exports:** `TOPIC_ROOT/TOOLS_DIR/PROJECTS_DIR`,
`load_module(name, path)`, `run_cli(script, *args)`.
**Dependencies:** stdlib (`importlib/subprocess/sys/pathlib`).
**Consumers:** all 4 test modules. **Failure:** wrong `TOPIC_ROOT` breaks every
test (it derives from `__file__`, robust to renames except `tests/` itself).
**Modification risks:** `load_module("serial_logger")` would exit(1) without
pyserial — tests must keep using `run_cli` for it (documented in-file).

**File:** `sample_temp.csv` · **Path:** `tests/data/sample_temp.csv`
**Purpose:** canonical wrapped-logger-format fixture (header + banner + 4 valid
+ 1 garbage line). **Consumers:** `test_analyze_log`, humans learning the format.
**Modification risks:** changing rows breaks asserted values in tests + docs.

**File:** `check_docs.py` · **Path:** `scripts/check_docs.py`
**Purpose:** fail on broken relative links / missing referenced sources; warn on
unreferenced `.c/.py` (fail under `--strict`). **Exports:** CLI exit 0/1.
**Dependencies:** stdlib (`re/sys/pathlib`). **Consumers:** STEP 10/12, humans.
**Failure:** false pass if run from elsewhere — it anchors at its own parent
(`ROOT = parent.parent`), so location-independent. **Modification risks:**
`SOURCE_SUFFIXES`/skip rules live here; keep in sync with repo layout.
