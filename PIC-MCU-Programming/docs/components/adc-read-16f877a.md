# Component: adc_read_16f877a.c

- **File:** [`03-intermediate/adc_read_16f877a.c`](../../03-intermediate/adc_read_16f877a.c) (62 lines) · **Module:** [firmware-intermediate](../modules/firmware-intermediate.md)
- **Purpose:** first sensing: 10k pot wiper on AN0 → 10-bit result → 4-LED bar (RD0–RD3) at ~20 samples/s.
- **Interface:** RA0/AN0 analog in (0–5 V); RD0–RD3 LED bar (thresholds 200/400/600/800).
- **Config:** `ADCON1=0xCE` (right-justify, Fosc/64, AN0-analog-only PCFG=1110, Vref=VDD); `ADCON0=0x41` (Fosc/64, CH0, ADON). Tad=3.2 µs (≥1.6 min), 12 Tad ≈ 38 µs/conv.
- **Functions:** `adc_init()`; `adc_read()→u16` — 20 µs Tacq, `GO=1`, spin on `GO_DONE`, `(ADRESH<<8)|ADRESL`. `main` — TRISD=0, map + 50 ms cadence.
- **State:** none. **Errors:** none in software; wiring faults read as stuck 0/1023 (diagnostic, not crash).
- **Perf:** 38 µs conversion vs 50 ms cadence — 1000× headroom.
- **Failure modes:** stuck 0/1023 (channel/PCFG/wiper wiring); jitter (noisy rail — add 100 nF at pin).
- **Debug:** meter the wiper; Simulator stimulus on AN0.
- **Extension:** ADC→UART decimal print; ADC→PWM manual dimmer. **Risks:** LOW-MEDIUM (PCFG/Tad); frozen (D5).
