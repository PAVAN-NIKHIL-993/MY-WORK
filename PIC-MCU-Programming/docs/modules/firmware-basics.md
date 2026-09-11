# Module: firmware-basics (`02-basics/`)

- **Purpose:** first contact with GPIO, config bits, `_XTAL_FREQ`, delays, debounce — on classic (16F877A) and modern (16F18345) chips.
- **Location:** [`02-basics/`](../../02-basics/README.md) — 4 `.c` + stage README ( TRIS/PORT/LAT, delay-methods table, 5 exercises).
- **Responsibilities:** teach output (`blink_*`), input+debounce (`button_*`), clock setup per chip family.
- **Public interface:** each file = one `main()`; pins: 877A LED RB0 / button RB1; 18345 LED RC5 / button RA2.
- **Dependencies:** XC8 `<xc.h>` only. **Consumers:** learners; later stages assume these patterns.
- **Internal architecture:** 4 independent programs; no shared code (D1). 18345 files add OSCFRQ + ANSEL + LAT + WPU vs 877A.
- **Data/state:** none (combinational polling). **Inputs:** button level. **Outputs:** LED levels.
- **Error handling:** 20 ms debounce + release-wait (no interrupts yet — by design).
- **Performance:** `__delay_ms` blocking is fine here (taught as stage-1 pattern; timers supersede it).
- **Security:** n/a (no I/O beyond GPIO). **Configuration:** 8-line (877A) / 5-line (18345) `#pragma` + `_XTAL_FREQ`.
- **Runtime:** `while(1)` poll loops. **Interactions:** none between files.
- **Failure modes:** LED dead (polarity/TRIS/ANSEL — README table); blink rate off (`_XTAL_FREQ`); see [TROUBLESHOOTING](../TROUBLESHOOTING.md).
- **Debugging:** Simulator watches on `PORTB`; then real-hardware LED cadence check.
- **Extension points:** SOS pattern, press-counter (exercises); Timer migration path → [firmware-intermediate](firmware-intermediate.md).
- **Modification risks:** LOW, but frozen per D5 — any pin change must update header comment + README + exercises together.
- **Implementation:** [blink-877A](../components/blink-16f877a.md) · [blink-18345](../components/blink-16f18345.md) · [button-877A](../components/button-16f877a.md) · [button-18345](../components/button-16f18345.md).
