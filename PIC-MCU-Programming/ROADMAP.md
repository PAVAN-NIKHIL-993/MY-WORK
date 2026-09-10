# Roadmap — PIC MCU Programming (done one step at a time)

> Status legend: ✅ done · 🔄 in progress · ⬜ not started

| # | Step | Folder | Contents | Status |
|---|------|--------|----------|--------|
| 1 | Workspace setup | `PIC-MCU-Programming/` | This roadmap, main README, folder skeleton | ✅ done |
| 2 | Docs & setup guides | `01-docs/` | `00-pic-family-overview.md`, `01-toolchain-setup.md`, `02-wiring-and-power-basics.md` | ✅ done |
| 3 | Basics firmware | `02-basics/` | LED blink, GPIO, button + debounce, delay methods (`blink.c`, `button.c`, notes) | ✅ done |
| 4 | Intermediate modules | `03-intermediate/` | Timer0/1, external interrupt, UART echo, ADC read, PWM LED dimmer | ✅ done |
| 5 | Advanced topics | `04-advanced/` | I2C scanner + EEPROM, SPI loopback note, watchdog + sleep, config-word guide | ⬜ next |
| 6 | Python automation & data | `05-python-tools/` | `baud_calc.py`, `serial_logger.py`, `config_helper.py` + `requirements.txt` | ⬜ |
| 7 | Capstone project | `06-projects/` | `temp-logger` mini-project (PIC ADC + UART + Python logger), checklist + quiz | ⬜ |

## How a step is executed

1. Files for that step are created **only** inside its folder.
2. Each step ends with: what was added → how to try it → what's next.
3. Nothing from a later step is started early.

## Progress log

- **2026-09-10 — Step 1 done:** created `PIC-MCU-Programming/` with 6 subfolders, `README.md`, `ROADMAP.md`.
- **2026-09-10 — Step 2 done:** added 3 guides in `01-docs/` (family overview, toolchain setup, wiring & power).
- **2026-09-10 — Step 3 done:** added 4 firmware examples + notes in `02-basics/` (blink/button x 16F877A/16F18345).
- **2026-09-10 — Step 4 done:** added 5 modules + notes in `03-intermediate/` (Timer0, EXT-INT, UART, ADC, PWM on 16F877A).
