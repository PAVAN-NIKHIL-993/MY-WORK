# Design — why these peripherals, and why not the ADC

This document records the reasoning behind the architecture. The short version: the ESP32 cannot
be a 1 MHz waveform scope, so the design measures the properties a digital signal actually has,
using three peripherals built for the job, and reconstructs a display from those measurements.

Everything numeric here was computed from datasheet values and clock arithmetic. **No timing figure
in this document has been measured on silicon**, because no ESP32 was available. Where a number is
an estimate, it says so.

---

## 1. Why the ADC cannot work

The original sketch claimed 1 MHz capture by polling `adc1_get_raw()` in a loop. Four independent
limits each make that impossible on their own.

### 1.1 Polling rate

`adc1_get_raw()` is a blocking function. On a 240 MHz ESP32 it takes roughly 10–12 µs per call when
called in a tight loop, once you include the driver's overhead and the ADC's own conversion time.
That gives roughly:

```
1 / 11 µs ≈ 90 kS/s
```

Nyquist then limits the usable input to **~45 kHz**, and that assumes a perfect anti-alias filter,
which does not exist here.

For a 1 MHz signal you need at least 2 MS/s to satisfy Nyquist and realistically 5–10 MS/s to see
shape. The gap:

```
2 000 000 / 90 000 ≈ 22x short on sample rate
```

### 1.2 Analog bandwidth

This is the limit most people miss, and it is worse than the sample rate. The ESP32's ADC has a
sample-and-hold circuit with a source impedance high enough that its effective analog bandwidth is
only about **6–8 kHz**. Above that, the sampled value is an attenuated, phase-shifted average of the
input, not a sample of it.

At 1 MHz:

```
1 000 000 / 8 000 = 125x beyond the analog bandwidth
```

So even an infinitely fast sampler behind this ADC would be reading essentially the DC average.
A 1 MHz square wave would appear as a flat line at its mean value, which is exactly what the
original sketch's synthetic waveform was hiding.

### 1.3 Resolution

12 bits nominal, but the ESP32 ADC is famously noisy — roughly ±6 LSB of noise, giving about
**9.5 effective bits**. For a 3.3 V range that is ~6 mV per code, not the 0.8 mV the datasheet's
bit count suggests.

### 1.4 No sample memory

There is no DMA path being used in the sketch. Each sample is read into a variable and the loop
runs as fast as it can, so the effective sample rate depends on what else the loop is doing —
including serving Wi-Fi. The rate is not deterministic, which means the time base is not
deterministic, which means any waveform drawn from it has an unknown horizontal scale.

**Conclusion.** An ADC-based scope on this chip is a ≤10 kHz instrument with poor accuracy. That is
a legitimate device, and the firmware keeps an ADC path for exactly that case, but it cannot be
called a 1 MHz scope.

---

## 2. What the peripherals can do

### 2.1 PCNT — counting edges

The pulse counter is a dedicated edge counter. Configured for a single channel counting rising
edges, it increments in hardware with no CPU involvement and no missed counts, up to its 16-bit
limit per unit.

The frequency is then a counted number divided by a known time:

```
f = N / T_gate
```

The accuracy is dominated by two terms:

- **Gate accuracy.** Using `esp_timer_get_time()` gives a gate derived from the APB clock, itself
  from the 40 MHz crystal. Crystal tolerance is typically ±10 ppm, so the gate contributes ±10 ppm.
- **Quantisation.** ±1 count. At 1 MHz over a 100 ms gate that is 100 000 counts, so 10 ppm. At
  1 Hz over a 1 s gate it is 1 count, so ±100 %.

This is why the gate adapts: it keeps the count high enough for the quantisation term to be
small relative to the gate term.

The original sketch's overflow handling was broken:

```c
volatile int16_t pcnt_overflow;   // wraps negative after 32767 overflows
```

With `counter_h_lim = 30000`, an overflow happens every 30 000 edges, so at 1 MHz over 100 ms you
get ~3 overflows — fine. But over a longer gate, or with a faster signal, `int16_t` overflows at
32767 and silently goes negative, and the reconstructed total becomes garbage. The fix is `uint32_t`
plus a saturated residue read, and it is unit-tested (`test_core.cpp`, "gate-based frequency").

### 2.2 RMT — pulse widths

The remote-control transceiver records the duration of each level into a ring buffer. Each entry is
a 15-bit duration plus a level bit, two per 32-bit item.

The tick is `80 MHz / clk_div`. At `clk_div = 1` that is **12.5 ns**.

A 1 MHz square wave has 500 ns half-periods:

```
500 ns / 12.5 ns = 40 ticks exactly
```

So 1 MHz is measured with **no quantisation error at all**, which is why this design reaches the
target where the ADC could not.

The original sketch used `RMT_CLK_DIV 80`:

```
80 MHz / 80 = 1 MHz tick = 1 µs per tick
500 ns half-period → 0.5 ticks → quantises to 0 or 1
```

With a 1 µs tick, every pulse is either zero ticks (filtered out) or one tick (1 µs), so a 50 %
1 MHz square reports either 0 % or 100 % duty and a 2 MHz or 1 MHz frequency depending on rounding.
That single constant is why the original could not measure its own stated target.

**The 15-bit limit.** A duration field holds at most 32767 ticks:

```
32767 × 12.5 ns = 409.6 µs
```

So at divider 1 the longest single pulse that can be represented is 410 µs. A 1 kHz square wave has
a 500 µs half-period, which already overflows. The firmware therefore selects a larger divider for
slow signals:

```cpp
div = ceil((period_ns * 10) / base_tenths_ns / 20000)
```

targeting at most 20 000 ticks per period. That keeps resolution as high as possible while fitting
the field. The function is `scope::rmtDividerForPeriod`, and the test suite asserts both the useful
case (100 Hz needs a divider > 1 and lands between 10 000 and 20 000 ticks) and the failure case
(1 Hz still overflows even at divider 255, so RMT must report unavailable).

### Tenths of a nanosecond

The tick length is carried through the API in **tenths of a nanosecond**, not nanoseconds, because
12.5 ns has no integer nanosecond representation. The first implementation passed `12`, which made a
1 MHz square wave measure 960 ns instead of 1000 ns:

```
40 ticks x 12.0 ns = 480 ns half-period -> 960 ns period -> 1.0417 MHz
```

a **4.17 % frequency error** -- in the one mode whose entire justification was exactness. Passing
`125` tenths gives exactly 1000 ns. `test_pulses_tick_truncation` pins both directions of this, and
asserts that the truncated form reads *high* (a shorter apparent period means a higher apparent
frequency).

### 2.3 MCPWM capture — edge timestamps

The capture unit latches a free-running counter on an edge, giving a timestamp rather than a
duration. With a prescale of 1 the counter runs at 80 MHz, so timestamps have **12.5 ns**
resolution, and because they are 32-bit the counter wraps only every:

```
2³² × 12.5 ns = 53.7 s
```

Timestamps allow period estimation by differencing, which is more robust than durations for
irregular signals: a single missed edge shows up as one long interval, and a median filter rejects
it (tested: "one missed edge does not halve the result").

The subtlety is that when capturing **both** edges, consecutive timestamps alternate high and low
intervals. The interval sequence for a 25 % duty 1 kHz signal is 250 µs, 750 µs, 250 µs, 750 µs…
Two intervals make one period, so the pairs must be summed. The original approach of taking the
median and doubling it gives:

```
median(250, 750) × 2 = 500 µs    ← wrong, the period is 1000 µs
```

This exact bug was present in the first version of `estimateFromEdges` and was caught by
`test_edges_duty`. It sums consecutive pairs instead.

---

## 3. Why three methods instead of one

Each peripheral is better at a different quantity:

| Method | Best at | Weak at |
|---|---|---|
| PCNT | Frequency accuracy (averages over many cycles) | No duty cycle, no period, slow below 10 Hz |
| RMT | Duty cycle and pulse widths | 15-bit range, poorer frequency accuracy |
| Capture | Period and jitter, wide frequency range | Requires an unused MCPWM slice, register-level setup |

The firmware uses the selected method for the primary measurement, and when PCNT is selected it
*also* reads RMT to fill in the duty cycle, because PCNT alone cannot provide one. That
combination happens in `refreshMeasurement()`.

The user can override the choice from the dashboard. The reason to expose it is diagnostic: when a
reading looks wrong, switching methods tells you whether the problem is the signal or one
peripheral.

---

## 4. Why the display is a reconstruction

Since the hardware produces frequency, period, duty and pulse widths — not samples — the display
has two honest options:

1. Draw nothing, and show only numbers.
2. Draw an ideal pulse train from the measured parameters, and say so.

Option 2 is far more useful for spotting a wrong reading at a glance, and it is what the dashboard
does. The label sits in the corner of the canvas: *"reconstructed pulse train from measured
frequency and duty"*.

What it is **not** is a waveform capture. The original sketch had a `buildWaveform()` that filled a
buffer with a sine or square based on the measured frequency and then drew it as if it were
captured data. The difference between that and this is one of labelling and of not computing
anything the hardware did not measure.

### The Fourier bug

The original also had an FFT view built on a series whose amplitude was:

```
A(h) = (4 / (π·h)) · sin(2π·h·φ) · duty
```

For a square wave the harmonic amplitudes are `4/(π·h)` and are **independent of duty cycle**. The
extra `duty` factor scales every harmonic by the duty, so at 50 % the whole spectrum is half the
correct amplitude and at 10 % it is one tenth. The shape is also wrong: summing nine terms with the
`sin(2πhφ)` factor produces something that reads as a rounded sine rather than a square.

Since the spectrum would have been wrong, the FFT view is **omitted** rather than shipped
incorrect. The protocol still carries a `fft` flag so the UI has somewhere to put it later.

---

## 5. Input protection

GPIO 34 is an input-only pin with no internal pull-up and no protection beyond the chip's own ESD
diodes, which are not rated for continuous current. The carrier board adds:

- **R1, 1 kΩ in series** — limits current into the clamps to a few mA even at 12 V.
- **D1, BAT54S** — dual Schottky clamping the pin between GND and 3V3. The low forward voltage
  means it conducts before the chip's own diodes do.
- **R3/R4, 2.2 kΩ / 3.3 kΩ** — a divider so a 5 V logic signal arrives as 3.3 V.
- **R2, 10 kΩ pull-down** — an unconnected probe reads a defined 0 V, so the instrument reports
  "no signal" rather than noise-triggered garbage.
- **C1, 100 nF** — a small amount of input filtering, which also shunts fast ringing on a long lead.

The divider introduces its own problem: it slows edges. With 2.2 kΩ and the pin's ~6 pF, the RC
time constant is:

```
τ = 2.2 kΩ × 6 pF ≈ 13 ns
```

That is comparable to the 12.5 ns measurement resolution, so **a 5 V signal through the divider will
have its edge timing degraded**. For 1 MHz work, feed 3.3 V logic directly and skip the divider.
This is a real trade-off, not a free feature.

---

## 6. What was deliberately left out

- **No FFT.** See §4.
- **No real trigger engine.** There is no sample buffer to trigger into. The trigger controls set a
  level that is drawn on screen and are marked cosmetic in the UI.
- **No second channel.** The request was for one channel covering all frequencies.
- **No persistence or averaging across acquisitions.** Each frame is an independent measurement.
- **No TFT support.** The request was explicitly to drop the display and use the web UI.
- **No OTA update.** Would be easy to add, was not asked for, and adds a failure mode.
