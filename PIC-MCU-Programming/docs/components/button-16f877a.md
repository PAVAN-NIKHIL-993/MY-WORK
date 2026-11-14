# Component: button_16f877a.c

- **File:** [`02-basics/button_16f877a.c`](../../02-basics/button_16f877a.c) (61 lines) · **Module:** [firmware-basics](../modules/firmware-basics.md)
- **Purpose:** digital input + software debounce: each press toggles the RB0 LED exactly once.
- **Interface:** button RB1→GND with external 10k pull-up (active-low); LED RB0.
- **Config:** same 8-line block + 20 MHz as [blink](blink-16f877a.md).
- **Functions:** `button_pressed(void)→uint8_t` — LOW? → 20 ms → re-check → wait release → 20 ms → return 1 (else 0). `main` — TRIS setup, `if pressed: RB0 ^= 1`.
- **Internals:** blocking debounce (acceptable pre-interrupts); flag-free since polling sees every edge slowly enough post-release-wait.
- **State:** LED bit only. **Errors:** bounce absorbed by design; a press during the release-wait is (correctly) ignored.
- **Failure modes:** random toggles (missing pull-up — floating pin); multi-toggle (debounce removed/shortened).
- **Debug:** meter RB1 idle (≈5 V); shorten delays to feel bounce (then restore).
- **Extension:** hold-to-light, press-counter (exercises) → INT version in [extint](extint-button-16f877a.md). **Risks:** LOW; frozen (D5).
