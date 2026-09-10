# PIC MCU Programming

A simple, modern, hands-on workspace to learn **PIC microcontroller programming** from zero to a working mini-project — with example firmware in C (MPLAB XC8), short notes, and Python helpers for automation + data.

> Target devices (examples): **PIC16F877A** (classic, widely used for learning) and **PIC16F18345 / PIC18F45K22** (modern mid-range). Every example states which device + clock it assumes.

## Folder map

| Folder | What lives here | Step |
|---|---|---|
| `01-docs/` | Short notes: PIC family, toolchain setup, wiring basics | 2 |
| `02-basics/` | GPIO, LED blink, button input, delays — first C programs | 3 |
| `03-intermediate/` | Timers, interrupts, UART, ADC, PWM | 4 |
| `04-advanced/` | I2C, SPI, EEPROM, watchdog & low-power | 5 |
| `05-python-tools/` | Baud-rate calculator, serial data logger, config helper | 6 |
| `06-projects/` | Capstone mini-project + checklist/quiz | 7 |

See [ROADMAP.md](ROADMAP.md) for the full step-by-step plan and progress tracker.

## How to use (simple path)

1. Read the notes in `01-docs/` in number order.
2. Try each example in `02-basics/` → `03-intermediate/` on real hardware or a simulator (MPLAB X + Proteus / MPLAB Simulator).
3. Use the Python tools in `05-python-tools/` to talk to your PIC over UART and log data.
4. Finish with the capstone in `06-projects/`.

## What you need

- **Software (free):** MPLAB X IDE + XC8 compiler. Optional: Proteus / MPLAB Simulator, Python 3.10+.
- **Hardware (recommended):** PIC16F877A or PIC18F45K22 board / breadboard, PICkit programmer, LEDs, push buttons, USB-UART module, LM35/potentiometer for ADC demo.
- **Knowledge:** Basic C. Each file explains the PIC-specific parts.

## Rules for this workspace

- All PIC work stays **inside this folder only** — nothing is added to the repo root.
- Work is done **one step at a time**: each step adds files to one folder, then stops for review.
- Every code example compiles against **XC8** and carries a header comment: device, clock, wiring, expected behaviour.
