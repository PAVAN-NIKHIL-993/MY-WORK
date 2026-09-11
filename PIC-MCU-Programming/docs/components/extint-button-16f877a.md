# Component: extint_button_16f877a.c

- **File:** [`03-intermediate/extint_button_16f877a.c`](../../03-intermediate/extint_button_16f877a.c) (65 lines) · **Module:** [firmware-intermediate](../modules/firmware-intermediate.md)
- **Purpose:** the professional ISR pattern: minimal ISR sets a `volatile` flag; `main()` debounces + toggles.
- **Interface:** button RB0/INT (falling edge, external 10k pull-up); LED RB1.
- **Config:** `INTEDG=0` (falling), `INTE+GIE`; `INTF` cleared in ISR (mandatory).
- **Functions:** `isr` — clear `INTF`, `int_flag=1`, nothing else. `main` — on flag: 20 ms → still LOW? → wait release → 20 ms → `RB1^=1`; clear flag AFTER release (swallows bounce retriggers).
- **State:** `volatile uint8_t int_flag`. **Errors:** bounce edges during handling re-set the flag — discarded by post-release clear (correct, documented).
- **Perf:** ISR < 1 µs. **Failure modes:** never fires (edge/enable wrong); fires once (flag not cleared); multi-toggle (flag cleared before release).
- **Debug:** watch `int_flag` + `INTF`; flip `INTEDG` to see release-edge behavior.
- **Extension:** ISR press-counter + UART report (README exercise 5). **Risks:** MEDIUM (edge/flag discipline); frozen (D5).
