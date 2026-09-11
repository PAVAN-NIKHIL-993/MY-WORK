# Component: watchdog_sleep_16f877a.c

- **File:** [`04-advanced/watchdog_sleep_16f877a.c`](../../04-advanced/watchdog_sleep_16f877a.c) (69 lines) · **Module:** [firmware-advanced](../modules/firmware-advanced.md)
- **Purpose:** the low-power pattern: `SLEEP()` + WDT wake every ~2.3 s; TO/PD bits distinguish power-on (solid 1 s LED) from WDT wake (triple-blink). **The only `WDTE = ON` file.**
- **Interface:** LED RB0 (patterns encode reset cause).
- **Config:** `WDTE = ON`; `OPTION_REG=0x8F` (PSA=1 → prescaler to WDT, 1:128 → 18 ms×128 ≈ 2.3 s, RC ±20%).
- **Functions:** `triple_blink()`; `main` — `TO==0&&PD==0`? wake-blink : power-on-solid; loop: 200 ms → `SLEEP()` → blink. WDT wakes *after* `SLEEP` (no reset while asleep).
- **State:** `STATUS<TO,PD>` (HW-maintained reset cause). **Errors:** hang-while-awake ⇒ WDT reset (intended); every blocking delay must stay < ~2.3 s (max here: 1000 ms ✓).
- **Perf/power:** RUN mA → SLEEP µA (exercise: measure it). **Failure modes:** constant resets (a delay > period); never wakes (`WDTE` actually OFF — recheck config).
- **Debug:** TO/PD in Simulator after reset/wake; meter supply current RUN vs SLEEP.
- **Extension:** sense-then-sleep sensor node; 1:32 period prediction exercise.
- **Risks:** MEDIUM-HIGH — never copy `WDTE = ON` into delay-heavy code without a `CLRWDT`/sleep design. Frozen (D5).
