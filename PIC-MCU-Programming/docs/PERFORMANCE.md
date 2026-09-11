# PERFORMANCE

> No invented benchmarks. Numbers below are computed from documented settings
> or observed in-sandbox (labeled as such).

## 1. Firmware timing budgets (computed, 20 MHz unless noted)

| Area | Budget | Headroom |
|---|---|---|
| Timer0 ISR | ~10 instructions (< 5 µs) every 13.1 ms | > 2500× |
| EXT-INT ISR | flag set only (< 1 µs), work in `main` | huge |
| Capstone 1 ms ISR | reload + 16-bit inc (< 3 µs) per 998 µs | > 300× |
| ADC conversion | 12 Tad @Fosc/64 = 38.4 µs per sample, 2 Hz rate | huge |
| UART TX @9600 | ~1 ms/byte; capstone line ≈ 10 ms every 500 ms (2% of CPU) | 50× |
| PWM ISR | none (hardware CCP + Timer2) | n/a |
| I2C scan @100 kHz | ~112 addresses × ~0.3 ms ≈ 35 ms per 2 s cycle | 57× |

RAM/Flash: largest file (`temp_logger`, 145 lines) uses a few dozen bytes of
RAM and < 1 KW flash — no memory pressure on any target chip. No `printf`,
no `malloc`, no recursion anywhere.

## 2. PC tools (observed in sandbox, Python 3.11/Linux)

- Full test suite: **28 tests in ~4 s (dominated by the 3 s live socket capture)** (sandbox observation; hardware-free).
- Logger throughput: trivially I/O-bound (serial ≤ 115200 baud ≈ 11 KB/s);
  per-line `flush()` costs nothing at these rates and guarantees Ctrl+C safety.
- `analyze_log` holds all samples in RAM: 100k samples ≈ a few MB — fine;
  beyond ~1 M lines, split captures (documented in [OPERATIONS](OPERATIONS.md)).

## 3. Deliberate non-optimizations

- `__delay_ms` polling in basics (clarity for stage 1; timers taught in stage 2).
- `for`-loop fades in PWM demo (fine at 1.25 kHz; ISR-driven duty left as exercise).
- Per-line CSV flush (safety > throughput at bytes/sec rates).
