# Component: temp_logger_16f877a.c (capstone firmware)

- **File:** [`06-projects/temp_logger_16f877a.c`](../../06-projects/temp_logger_16f877a.c) (145 lines) · **Module:** [capstone-system](../modules/capstone-system.md)
- **Purpose:** LM35 → 2 Hz `t_ms,temp_c` UART stream with a 1 ms ISR clock and zero blocking delays in `main()` — the workspace's "product".
- **Interface:** LM35 Vout→RA0/AN0 (+Vs→5 V, GND→GND); RC6/TX @9600; RB0 heartbeat/sample toggle.
- **Config:** 8-line `#pragma`; ADC `0xCE/0x41` (as [adc](adc-read-16f877a.md)); Timer0 `OPTION_REG=0x84` (1:32) + `TMR0=100` preload → 156×6.4 µs = 998.4 µs ≈ 1 ms; UART `SPBRG=129`; `SAMPLE_PERIOD_MS=500`.
- **Functions:** `isr` — clear `TMR0IF`, reload 100, `ms_ticks++`. `millis()→u16` — GIE-guarded atomic copy (torn-read-proof). `uart_*` + `uart_putdec16(u16)` (no-`printf` decimal). `adc_*` (as stage 3). `tick_init()`. `main` — inits, CSV header, windowed `millis()-last>=500` sampler: `tenths=ADC*5000/1024` (32-bit intermediate — 16-bit overflows), print `ms,whole.frac`, heartbeat.
- **State:** `volatile ms_ticks` (wraps ~65 s; difference-math safe), `last` (drift-free `+=500`).
- **Errors:** UART fire-and-forget (bench assumption); ADC/OERR handling as stage 3.
- **Perf:** ISR < 3 µs/ms; TX ≈ 2% CPU. **Failure modes:** wrong temps (LM35 pinout — verify!); empty CSV (logged wrong stream); torn reads (prevented — see Q12 quiz).
- **Debug:** terminal raw lines → `head` CSV → analyzer; touch-LM35 rise test.
- **Extension:** alarm/EEPROM-max/sleep/sensor-swap (README stretch goals). **Risks:** MEDIUM (line format is a contract — see [api](../api/uart-protocol.md)); frozen (D5).
