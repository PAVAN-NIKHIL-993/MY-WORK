# Config-Word Guide (every `#pragma config`, explained)

> Config words are flash cells read **before** `main()` runs: oscillator, watchdog,
> protection. Wrong oscillator setting = "dead" chip (it just never starts).

## 1. PIC16F877A — the full table (used in every `.c` here)

| `#pragma` | Options | We use | Why |
|---|---|---|---|
| `FOSC` | `LP`, `XT`, `HS`, `EXTRC`, `INTRC`… | `HS` | 20 MHz crystal needs HS (≥ 4 MHz) |
| `WDTE` | `ON` / `OFF` | `OFF` (ON only in watchdog demo) | WDT resets a "stuck" chip — great, but resets your delays too until you design for it (see `watchdog_sleep_…c`) |
| `PWRTE` | `ON` / `OFF` | `ON` | 72 ms power-up wait — cheap insurance on slow supplies |
| `BOREN` | `ON` / `OFF` | `ON` | Holds chip in reset if VDD sags — protects RAM/EEPROM |
| `LVP` | `ON` / `OFF` | `OFF` | OFF = program with PICkit normally; ON would need the PGM/RB3 pin managed |
| `CPD` | `ON` / `OFF` | `OFF` | Data-EEPROM protection — OFF while developing |
| `WRT` | `ON`/`OFF` (+ partial) | `OFF` | Flash self-write protection — OFF while developing |
| `CP` | `ON` / `OFF` | `OFF` | Code protection — OFF until you ship a product |
| (`DEBUG`) | `ON` / `OFF` | default (OFF) | ON steals RB6/RB7 for the debugger — leave OFF unless debugging with ICD |

Copy-paste block (16F877A, 20 MHz crystal) — already at the top of every example:

```c
#pragma config FOSC = HS
#pragma config WDTE = OFF
#pragma config PWRTE = ON
#pragma config BOREN = ON
#pragma config LVP = OFF
#pragma config CPD = OFF
#pragma config WRT = OFF
#pragma config CP = OFF
```

## 2. PIC16F18345 — the minimal safe set (used in `02-basics/`)

```c
#pragma config FEXTOSC = OFF      // no external oscillator circuit
#pragma config RSTOSC = HFINTOSC  // start on internal osc (then OSCFRQ in code)
#pragma config MCLRE = ON         // MCLR pin enabled (10k pull-up to VDD)
#pragma config WDTE = OFF         // watchdog off while learning
#pragma config LVP = OFF          // program with PICkit normally
```

Unlisted words keep defaults (benign: protections off, BOR on, CLKOUT off).
Full option lists live in the datasheet §5 + the MPLAB X window below.

## 3. The golden rules

1. **`FOSC` must match hardware.** Crystal on board but `FOSC=XT/INTRC` (or vice
   versa) → chip never runs. This is the #1 "programmed fine, does nothing".
2. **Leave protections OFF until shipping** (`CP/CPD/WRT = OFF` while learning).
3. **`LVP = OFF`** with a PICkit (HVP programming). `LVP = ON` + floating PGM
   pin = surprise resets.
4. **`WDTE = OFF` until you design for it** — then use the watchdog+sleep
   pattern from `watchdog_sleep_16f877a.c` (keep every blocking delay shorter
   than the WDT period, or `CLRWDT()` in long loops).
5. **Changing chips? Rewrite the block.** Config names differ per family —
   never copy a 16F877A block onto a 16F18345.

## 4. Let MPLAB X write it for you (recommended for new chips)

1. Open your project with the target device selected.
2. **Window → Target Memory Views → Configuration Bits** — set every option
   in the GUI (it shows meanings + legal values).
3. Click **Generate Source Code** → paste the output at the top of `main.c`.

This is the authoritative, typo-proof method — use it whenever you switch devices.

## ✅ Check yourself

- [ ] I can explain FOSC / WDTE / LVP / CP in one sentence each.
- [ ] I know why our 16F877A block uses `FOSC = HS`.
- [ ] I can regenerate a config block from the MPLAB X GUI.
