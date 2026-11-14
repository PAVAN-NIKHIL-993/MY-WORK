# Measurements — every number, and where it came from

This document exists because a spec full of confident numbers is worse than no spec. Each figure
below is either an arithmetic derivation (shown) or a datasheet value (cited). **Nothing here was
measured on hardware**, because no ESP32 was available in the build environment.

---

## 1. Clock chain

| Quantity | Value | Source |
|---|---|---|
| Crystal | 40 MHz | ESP32 datasheet |
| Crystal tolerance | ±10 ppm typical | Module-level; varies by part |
| APB clock | 80 MHz | Fixed for these peripherals |
| CPU clock | 240 MHz max | Not used for timing here |

Everything timing-critical derives from the 80 MHz APB clock. The Wi-Fi radio uses the same crystal,
which is why Wi-Fi calibration events can cause brief jitter and why the PCNT gate is the most
stable measurement path: it averages over a long window.

---

## 2. PCNT frequency measurement

```
f = N / T_gate
```

where `N` is edges counted and `T_gate` is measured with `esp_timer_get_time()`.

### Error budget

| Term | Magnitude | Depends on |
|---|---|---|
| Gate (crystal) | ±10 ppm | Fixed by the crystal |
| Quantisation | ±1 count | `N` |
| Gate jitter | ~0 | `esp_timer` is hardware; no loop jitter |

Total relative error ≈ `10 ppm + 1/N`.

| Frequency | Gate | Counts `N` | Quantisation error | Total |
|---|---|---|---|---|
| 1 MHz | 100 ms | 100 000 | 10 ppm | ≈ 20 ppm |
| 100 kHz | 100 ms | 10 000 | 100 ppm | ≈ 110 ppm |
| 10 kHz | 100 ms | 1 000 | 1 000 ppm (0.1 %) | ≈ 0.1 % |
| 1 kHz | 1 s | 1 000 | 1 000 ppm (0.1 %) | ≈ 0.1 % |
| 100 Hz | 1 s | 100 | 1 % | ≈ 1 % |
| 10 Hz | 1 s | 10 | 10 % | ≈ 10 % |
| 1 Hz | 1 s | 1 | 100 % | ≈ 100 % |

The last row is the honest floor. A 100 ms gate at 1 Hz would count **0.1 edges** — i.e. usually
zero — which is why the gate adapts up to 1 s. Even so, one count is one count: **PCNT cannot
usefully measure below about 10 Hz.** Use the capture method there, where the period is derived
from timestamps rather than from a count.

### Why not time a single period?

Because a single period's quantisation error is the full resolution divided by the period. At
1 MHz, timing one period with a 12.5 ns tick gives `12.5 / 500 = 2.5 %` error, versus 20 ppm for
counting 100 000 of them. Counting wins by a factor of ~1000 at high frequency, and loses at low
frequency — hence two methods.

---

## 3. RMT pulse measurement

```
tick = 80 MHz / clk_div
```

| Divider | Tick | Max pulse (15-bit) | Freq range for duty |
|---|---|---|---|
| 1 | 12.5 ns | 409.6 µs | ≥ 1.22 kHz |
| 8 | 100 ns | 3.28 ms | ≥ 153 Hz |
| 80 | 1 µs | 32.8 ms | ≥ 15.3 Hz |
| 255 | 3.19 µs | 104 ms | ≥ 4.8 Hz |

`max pulse = 32767 × tick`, and the minimum frequency for a symmetric signal is
`1 / (2 × max pulse)`.

The firmware targets at most 20 000 ticks per period, leaving headroom:

```cpp
div = ceil((period_ns * 10) / base_tenths_ns / 20000)

Tick lengths are carried in tenths of a nanosecond so 12.5 ns is exact; see DESIGN.md.
```

### Resolution at 1 MHz (divider 1)

```
500 ns / 12.5 ns = 40 ticks exactly
```

Zero quantisation error. This is the single most important number in the project: it is the reason
this design reaches 1 MHz where the ADC could not, and the reason the original sketch's
`RMT_CLK_DIV 80` was fatal.

### Resolution at 1 MHz (the original's divider 80)

```
500 ns / 1000 ns = 0.5 ticks
```

Rounds to 0 (filtered as a glitch) or 1 (1 µs). Duty then reads **0 % or 100 %**, never 50 %. The
test suite asserts this failure explicitly rather than only asserting the fix, so a future
regression that reintroduces the divider is caught by a test that names it.

---

## 4. MCPWM capture

```
resolution = 1 / 80 MHz = 12.5 ns
wrap period = 2³² × 12.5 ns = 53.69 s
```

Timestamps rather than durations, so period is a difference of two 32-bit values. A single wrap is
detected and compensated; more than one is rejected.

At 1 MHz the period is 1000 ns = 80 ticks, so period error from quantisation is 1.25 % on a single
measurement — worse than PCNT, which is why PCNT is the default for frequency. Capture is better
for **jitter** and for **low frequencies**, where PCNT runs out of counts.

---

## 5. The ADC ceiling

Four independent limits, each sufficient on its own to rule out 1 MHz.

| Limit | Value | Derivation |
|---|---|---|
| Polling rate | ~90 kS/s | `adc1_get_raw()` ≈ 11 µs per call |
| Nyquist | ~45 kHz | Half the polling rate |
| Analog bandwidth | ~6–8 kHz | Sample-and-hold settling, datasheet-adjacent |
| Effective bits | ~9.5 | ±6 LSB noise on 12 bits |

Gap to the stated target:

```
2 MS/s needed  /  90 kS/s available  ≈ 22x
8 kHz bandwidth /  1 MHz target      = 125x
```

The 125× figure is the one worth remembering: even with an infinitely fast sampler, the analog
front end has already averaged the signal away.

**Therefore:** no waveform capture above ~10 kHz. The display is a reconstruction, labelled as
such.

---

## 6. Input network

| Element | Value | Effect |
|---|---|---|
| R1 series | 1 kΩ | Limits clamp current to ≈ (Vin − 3.6) / 1 kΩ |
| D1 clamp | BAT54S | Conducts at ≈0.3 V forward, below the chip's ESD diodes |
| R3/R4 divider | 2.2 k / 3.3 k | 5 V → 3.3 V (ratio 0.6) |
| R2 pull-down | 10 kΩ | Floating input reads 0 V |
| C1 | 100 nF | Input filtering |

### Divider ratio check

```
Vout = Vin × R4 / (R3 + R4) = 5.0 × 3.3 / 5.5 = 3.0 V
```

3.0 V into a 3.3 V pin, with margin. Good.

### Where the divider hurts

```
τ = R_source × C_pin ≈ 2.2 kΩ × 6 pF ≈ 13 ns
```

Against a 12.5 ns measurement resolution, that is a **~1 tick smearing of every edge**. For 1 MHz
work, feed 3.3 V logic directly and omit R3/R4. This is a genuine trade-off: the divider that makes
the input 5 V tolerant also degrades it for the fast case it is meant to measure.

### Clamp current at 12 V input

```
I = (12 − 3.6) / 1 kΩ = 8.4 mA
```

Within the BAT54S rating (~200 mA) and within what R1 can dissipate (70 mW in an 0603, rated
100 mW). **12 V is the practical maximum**, not a design target; do not exceed it.

---

## 7. Wi-Fi timing

| Quantity | Value | Consequence |
|---|---|---|
| Frame interval | 50 ms | 20 fps |
| Typical round trip on a LAN | 2–10 ms | Feels immediate |
| `WiFi.setSleep(false)` | required | Default modem sleep adds 100–300 ms latency |
| Max clients | 4 | Each gets its own copy of the frame |

The frame is built once and broadcast, not built per client, so four clients cost the same as one.

### Cost per second

```
20 frames/s × 12 288-byte JSON document ≈ 245 KB/s of heap churn
```

Allocated and freed on the heap every frame. On a stock ESP32 with ~300 KB free this is fine, but
it is the most likely source of long-term fragmentation. A static `DynamicJsonDocument` would avoid
it; the current code uses a local one for clarity.

---

## 8. What is deliberately not quantified

- **Jitter.** Not measured, not specified.
- **Temperature drift.** The crystal spec covers it; nothing else was characterised.
- **Long-term stability.** Untested beyond the timestamp-wrap logic.
- **Actual power consumption.** Not measured. The ESP32 board dominates (~120 mA with Wi-Fi
  active); the carrier adds microamps. A number here would be a guess.
- **Real-world accuracy against a calibrated reference.** Never done — this is the largest gap in
  the project and the first thing to do with hardware in hand.
