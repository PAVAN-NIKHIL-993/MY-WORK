# Component: blink_16f877a.c

- **File:** [`02-basics/blink_16f877a.c`](../../02-basics/blink_16f877a.c) (39 lines) · **Module:** [firmware-basics](../modules/firmware-basics.md)
- **Purpose:** minimal GPIO output: RB0 blinks a LED at 1 Hz. The "hello world" of the workspace.
- **Interface:** pin RB0 → 330 Ω → LED → GND. No inputs, no API.
- **Config:** 8-line `#pragma` (`FOSC = HS`), `_XTAL_FREQ 20000000`, 20 MHz crystal + 2×22 pF.
- **Functions:** `main(void)` — `TRISB0=0`, then `RB0=1/__delay_ms(500)/RB0=0/__delay_ms(500)` forever. No helpers.
- **Internals:** `__delay_ms` cycle-counts from `_XTAL_FREQ`; PORTB is all-digital on 877A (no ANSEL trap here).
- **State:** none. **Errors:** none possible in software; wrong `_XTAL_FREQ`/crystal ⇒ wrong rate (not a hang).
- **Perf:** 100% CPU in delays (fine — stage 1). **Security:** n/a.
- **Failure modes:** LED dark (polarity/resistor/TRIS/MCLR/power); rate ×2/÷2 (`_XTAL_FREQ`).
- **Debug:** Simulator watch `PORTB`; then cadence check on hardware.
- **Extension:** SOS pattern, move to RB7 (README exercises). **Risks:** LOW; frozen (D5).
