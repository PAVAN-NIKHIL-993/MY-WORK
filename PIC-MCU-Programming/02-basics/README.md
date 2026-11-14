# Step 3 — Basics: GPIO, Blink, Button (notes + how to run)

## 1. The 4 example programs

| File | Chip | Clock | LED pin | Button pin | What it teaches |
|---|---|---|---|---|---|
| `blink_16f877a.c` | PIC16F877A | 20 MHz crystal | RB0 | — | Minimal GPIO output, `__delay_ms` |
| `blink_16f18345.c` | PIC16F18345 | 8 MHz internal | RC5 | — | Modern chip: OSCFRQ, ANSEL, LATx |
| `button_16f877a.c` | PIC16F877A | 20 MHz crystal | RB0 | RB1 (external 10k pull-up) | Digital input + debounce |
| `button_16f18345.c` | PIC16F18345 | 8 MHz internal | RC5 | RA2 (internal pull-up, no resistor) | WPU pull-ups + debounce |

**Run one:** MPLAB X → New Project (device = the file's chip, tool = PICkit/Simulator,
compiler = XC8) → new C main file → paste file → **F11 build → F6 run**.
Wire per the header comment + `01-docs/02-wiring-and-power-basics.md`.

## 2. Core concepts (used in every future step)

### TRIS / PORT / LAT — the 3 registers of GPIO
- `TRISx`: direction — **1 = input, 0 = output** ("1 looks like I").
- `PORTx`: **read** here (inputs, e.g. `PORTBbits.RB1`).
- `LATx`: **write outputs** here on modern chips (`LATCbits.LATC5 ^= 1`).
  Writing `PORTx` on old chips works but can glitch (read-modify-write) —
  habit: *read PORT, write LAT*.
- `ANSELx` / `ADCON1`: shared pins wake up **analog** — clear to digital first.
  Symptom of forgetting: pin stuck reading 0 / LED dead. (#1 beginner bug.)

### `_XTAL_FREQ` — the lie that breaks everything
`__delay_ms()` and (later) UART baud are *computed* from `_XTAL_FREQ`.
It must equal the **real** oscillator frequency:
- 16F877A + 20 MHz crystal → `#define _XTAL_FREQ 20000000`
- 16F18345 internal @ 8 MHz → `#define _XTAL_FREQ 8000000` (+ matching `OSCFRQ`)
- Wrong value → wrong blink speed, garbage UART. Always check first.

## 3. Delay methods compared

| Method | How | Accuracy | Verdict |
|---|---|---|---|
| `__delay_ms()` / `__delay_us()` (XC8 built-in) | Compiler counts cycles from `_XTAL_FREQ` | Good (exact if `_XTAL_FREQ` right) | ✅ Use for simple waits like here |
| `for` loops (`for(i=0;i<50000;i++);`) | Burns CPU spinning | Bad — changes with optimization level! | ❌ Never use |
| Timer + interrupt (Step 4) | Hardware counts in background | Excellent, CPU stays free | ✅✅ The professional way — coming next |

Rule: `__delay_ms` is fine for blink/debounce; anything timing-critical or
multitasking → Timers (Step 4: `03-intermediate/`).

## 4. Why debounce? (buttons lie for ~20 ms)

A mechanical press makes/breaks contact many times in ~5–20 ms ("bounce").
Without debounce, one press toggles the LED 3–10 times (looks random).
Fix used here: on first LOW → wait 20 ms → re-check → wait for release.
Later (Step 4) you'll do this with a Timer interrupt instead of blocking waits.

## 5. Exercises (do these before Step 4)

1. ⭐ Change blink speed to 100 ms. Then make an SOS pattern (`...---...`).
2. ⭐ Move the 16F877A LED from RB0 to RB7 — which lines change?
3. ⭐⭐ Hold-to-light: LED ON only *while* the button is held (hint: skip toggle logic).
4. ⭐⭐ Count presses: blink the LED N times after each press (N = press count).
5. ⭐⭐⭐ Break it on purpose: set `_XTAL_FREQ` to half the real value — what happens to blink speed? Why? (Then fix it.)

## 6. Troubleshooting

| Symptom | Check |
|---|---|
| LED never lights | LED polarity + 330 Ω? TRIS=0? pin digital (ANSEL/ADCON1)? MCLR pull-up? |
| Blink 2×/4× too fast/slow | `_XTAL_FREQ` ≠ real Fosc (and OSCFRQ on 16F18345) |
| Button toggles randomly | Missing pull-up (external 10k / WPU enabled?) + floating pin picks up noise |
| One press = many toggles | Debounce missing/too short — keep 20 ms |
| Programs fine, chip does nothing | `#pragma config FOSC`/osc mismatch; measure 5 V at the VDD pins |

Next: **Step 4** — `03-intermediate/`: Timers, interrupts, UART, ADC, PWM.
