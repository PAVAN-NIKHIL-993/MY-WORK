# Component: timer0_blink_16f877a.c

- **File:** [`03-intermediate/timer0_blink_16f877a.c`](../../03-intermediate/timer0_blink_16f877a.c) (68 lines) · **Module:** [firmware-intermediate](../modules/firmware-intermediate.md)
- **Purpose:** first ISR: Timer0 toggles RB0 at 1 Hz while `main()` independently blinks RB1 — proves background timing.
- **Interface:** LEDs RB0 (ISR, 1 Hz) + RB1 (main, ~5 Hz).
- **Config:** `OPTION_REG=0x87` (T0 internal clock, prescaler 1:256 → Timer0); `TMR0IE+GIE`.
- **Math:** 5 MHz/256 = 51.2 µs tick; overflow/13.1072 ms; `OVERFLOWS_PER_TOGGLE=38` ≈ 500 ms.
- **Functions:** `isr(void)` — if `TMR0IF`: clear (mandatory), `++t0_count`, toggle at 38. `main` — init, enable, `RB1^=1` + 100 ms loop.
- **State:** `volatile uint8_t t0_count`. **Errors:** none possible; forgetting `TMR0IF=0` would lock the ISR (covered in README pitfall table).
- **Perf:** ISR < 5 µs per 13 ms (>2500× headroom).
- **Failure modes:** RB0 dead (enable chain), wrong rate (prescaler/`38` vs real Fosc).
- **Debug:** breakpoint in ISR + watch `t0_count`; Simulator stopwatch for period.
- **Extension:** 1:64 recompute exercise; reuse pattern in capstone 1 ms clock. **Risks:** MEDIUM (timing constants); frozen (D5).
