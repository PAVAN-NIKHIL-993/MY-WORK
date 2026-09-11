# ENVIRONMENT

## 1. PC environment (tools, tests, docs)

| Item | Required | Verified with |
|---|---|---|
| OS | Windows 10+/macOS/Linux (any pyserial supports) | Linux (sandbox) |
| Python | 3.10+ (uses `list[…]`/`tuple[…]` builtin generics) | 3.11.2 |
| Pip packages | `pyserial>=3.5` (logger only) | absent here → live tests skip |
| Serial drivers | CH340/CP2102/FTDI as per your USB-UART (Windows) | n/a here |
| Linux perms | User in `dialout` for `/dev/ttyUSB0` | n/a here |
| Terminal | Any (9600 8-N-1) for manual UART checks | n/a here |

## 2. Firmware environment (build + run)

| Item | Required | Notes |
|---|---|---|
| MPLAB X IDE | v6.x | Free; project manager + debugger + Simulator |
| XC8 compiler | v2.x, Free mode OK | No paid PRO features used |
| Programmer | PICkit 3/4/5 (or Simulator, no hardware) | ICSP: MCLR/VDD/VSS/PGD/PGC |
| Chips | PIC16F877A and/or PIC16F18345 | Examples state exact device + clock |
| Parts | 20 MHz crystal + 2×22 pF (877A), LEDs + 330 Ω, buttons + 10k, 10k pot, LM35, 4.7k (I2C), USB-UART | See [`02-wiring`](../01-docs/02-wiring-and-power-basics.md) |
| Supply | 5 V (4.0–5.5 V), common GNDs, 100 nF per VDD | BOR on in all examples |

## 3. What is NOT needed

No Docker, no Node, no database, no cloud accounts, no browsers (docs are
plain Markdown), no env vars, no licenses beyond Microchip's free tools.
