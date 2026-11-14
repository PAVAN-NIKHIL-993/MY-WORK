# ESP32 Web Scope

A single-channel instrument for measuring **digital** signals from **1 Hz to 1 MHz**, with the
whole user interface served as a web page by the ESP32 itself.

No TFT, no encoder, no buttons on the instrument. You open `http://192.168.2.23/` on a phone or
laptop and drive it from there.

![status](https://img.shields.io/badge/build-host%20tests%20passing-brightgreen)
![status](https://img.shields.io/badge/esp32%20firmware-not%20compiled%20in%20CI-orange)

---

## Read this before you buy anything

This is the most important section in the repository.

**This device is a frequency counter with a nice web UI. It is not an oscilloscope in the sense
of capturing a waveform.**

The ESP32 cannot digitise a 1 MHz signal. It cannot digitise a 100 kHz signal. It cannot even
digitise a 20 kHz signal faithfully. The numbers:

| Limit | Value | Consequence |
|---|---|---|
| `adc1_get_raw()` polling rate | ~80–100 kS/s | Nyquist limit of 40–50 kHz |
| ESP32 ADC analog bandwidth | ~6–8 kHz | Even a 10 kHz sine is heavily attenuated and phase-shifted |
| ADC resolution | 12 bit, ~±6 LSB noise | ~9.5 effective bits in practice |
| Time to convert one sample in a tight loop | ~10–12 µs | Sets the ~90 kS/s ceiling |

So an ADC-based scope on this chip tops out at a few kHz of *usable* bandwidth. The original
sketch this project replaces claimed 1 MHz by polling the ADC in a loop, which is short by a
factor of at least 125× and would have produced an aliased mess.

**What this device does instead** is measure the quantities a digital signal actually has, using
peripherals designed for exactly that, and reaches 1 MHz honestly:

- **Frequency** — the PCNT (pulse counter) counts edges, gated by a crystal-derived timer.
- **Duty cycle and pulse widths** — the RMT (remote control transceiver) timestamps every edge
  with 12.5 ns resolution.
- **Period and edge intervals** — MCPWM capture timestamps edges directly.

Those are real hardware measurements of a real signal. The dashboard then draws an *ideal pulse
train reconstructed from those measurements* to give you something to look at, and labels it as
reconstructed. It never claims to have sampled the waveform, because it has not.

If you need to see the actual shape of a 1 MHz waveform, you need an FPGA or a dedicated
ADC-front-end scope. An ESP32 will not do it, and neither will any firmware update.

---

## What it can measure

| Quantity | Range | Resolution | Method |
|---|---|---|---|
| Frequency | **1 Hz – 1 MHz** | 1 mHz reported; ±10 ppm gate | PCNT + `esp_timer`, adaptive gate |
| Period | **1 µs – 1 s** | 12.5 ns | MCPWM capture |
| Duty cycle | **1.2 kHz – 1 MHz** | 0.1 % | RMT pulse widths |
| High / low time | 100 ns – 410 µs | 12.5 ns (div 1) | RMT pulse widths |
| Edge count | 0 – 2³² | 1 | PCNT |

The duty-cycle range is narrower than the frequency range, and that is a hardware fact rather
than a design choice: the RMT duration field is **15 bits**, so at 12.5 ns/tick a single pulse can
span at most 32767 × 12.5 ns = **410 µs**. The firmware chooses a larger divider for slow signals
(the divider is exercised by unit tests), which extends RMT down to about **1.2 kHz** at reduced
resolution. Below that, duty cycle is reported as unavailable rather than guessed, and frequency
comes from PCNT or capture.

Accuracy caveats, stated plainly:

- The **PCNT gate** uses `esp_timer_get_time()`, which is derived from the 40 MHz crystal through
  the APB clock. Crystal tolerance on a typical ESP32 module is ±10 ppm, so frequency readings
  inherit ±10 ppm plus ±1 count of quantisation.
- The **RMT** path divides the 80 MHz APB clock by 1, giving 12.5 ns per tick. A 1 MHz square wave
  has 500 ns half-periods, which is exactly 40 ticks — so 1 MHz measures cleanly with no rounding.
  The divider adapts for slower signals (`scope::rmtDividerForPeriod`, unit-tested); at divider 255
  the tick is 3.06 µs and a 1 s period still overflows the 15-bit field, so RMT bottoms out around
  1.2 kHz. This limit is asserted in the tests rather than glossed over.
- The **PCNT gate is adaptive**: 100 ms for fast signals, stretching to 1 s as the frequency falls,
  so a slow signal still accumulates counts instead of reading zero. At 1 Hz a 1 s gate yields
  **1 count**, which is the honest floor of this method — the reading is then ±1 count, i.e. ±100 %.
  Below ~10 Hz, trust the capture method instead of PCNT.
- **Edge timestamps wrap** at 2³² MCPWM ticks. The core detects and compensates for a single wrap
  (tested), but if more than one wrap occurs inside one burst the result is discarded rather than
  guessed.

---

## What it cannot measure

Listing these is more useful than listing features.

- **Analog waveforms.** See above. The ADC path exists only for the ≤10 kHz case and is marked as
  such in the UI.
- **Rise and fall times.** Not measured at all.
- **Voltage beyond 3.3 V.** The input is a 3.3 V logic pin. A 5 V signal needs a divider, and a
  negative voltage will damage the pin. There is no protection on the input.
- **Anything with fast edges into a long cable.** Unterminated 1 MHz signals on a 1 m wire ring
  badly and will produce double-counting. Use a short lead or a proper probe.
- **Jitter and phase noise.** The instrument reports a number; it does not characterise stability.
- **Two channels.** One input, by design; the original request asked for a single channel covering
  all frequencies.

---

## Hardware

### Bill of materials

The instrument is an ESP32 dev board plus a handful of passive parts.

| Ref | Part | Value / package | Purpose | Qty | ~Cost |
|---|---|---|---|---|---|
| U1 | ESP32-WROOM-32 dev board | 38-pin, CP2102 | The instrument | 1 | $4.50 |
| R1 | Resistor | 1 kΩ, 0603 | Series input protection | 1 | $0.01 |
| R2 | Resistor | 10 kΩ, 0603 | Pull-down, keeps an open input low | 1 | $0.01 |
| R3 | Resistor | 2.2 kΩ, 0603 | Divider top (5 V tolerance) | 1 | $0.01 |
| R4 | Resistor | 3.3 kΩ, 0603 | Divider bottom | 1 | $0.01 |
| D1 | Schottky | BAT54S, SOT-23 | Clamp to 3.3 V and GND | 1 | $0.06 |
| C1 | Capacitor | 100 nF, 0603 | Decoupling at the input pin | 1 | $0.01 |
| C2 | Capacitor | 10 µF, 0805 | Bulk decoupling on the board | 1 | $0.02 |
| J1 | Screw terminal | 2-pin, 5 mm | Probe and ground | 1 | $0.15 |
| J2 | Pin header | 2×19, 2.54 mm | Board socket | 1 | $0.10 |
| — | PCB | 2-layer, 40×50 mm | Carrier | 1 | $1.80 |

Total for the carrier: **$2.18** on top of the ESP32 board, giving **$6.68** for a complete unit at
single-unit prices. Those figures are a sum of the table above, not a quote. Full numbers in
[`docs/bom.md`](docs/bom.md).

### Wiring

The signal enters on **GPIO 34**, as specified. That pin is input-only, has no internal pull-up,
and is ADC1 channel 6 (which is why the original sketch chose it and why the analog path keeps it).
"Input-only" only stops you *driving* the pin; the GPIO matrix still routes the pad to PCNT, RMT and
MCPWM, so one pin serves all three methods.

### Network address

The dashboard is fixed at **`http://192.168.2.23/`**. That is a static lease: set `kUseStaticIp =
true` in the firmware and give `kStaticIp` a free address on your subnet. Reserved addresses are
better than a static IP in the firmware, but the request was for a fixed address, so that is what
the default configuration provides.

```
   J1.1  o──────┬──────[ R1 1k ]──────┬───────────────o  GPIO 34
   (SIGNAL)     │                     │
                │                  [ D1 BAT54S ]   (dual Schottky clamp)
                │                   │        │
                │                  GND      3V3
                │
             [ R3 2.2k ]
                │
                ├──────────────────[ R4 3.3k ]────── GND
                │
             [ C1 100n ]
                │
               GND

   J1.2  o──────┴────────────────────────────────── o  GND

   GPIO 34 ──[ R2 10k ]── GND          (pull-down; GPIO 34 has no internal one)
```

`R1` limits current into the clamp diodes. `R3`/`R4` form a 5 V → 3.0 V divider
(`5.0 × 3.3/5.5 = 3.0 V`) so a 5 V logic signal is safe. `R2` makes an unconnected probe read a
steady 0 V instead of noise. `C1` shunts fast ringing on a long lead.

> **One input pin feeds all three peripherals.** The probe goes to GPIO 34 and nothing else. PCNT,
> RMT and MCPWM each take their input from that one pad through the GPIO matrix, so there is no
> fan-out wiring and no need to short pins together. No other ESP32 pin is connected on the carrier
> board — `make netlist` asserts that only J2 pins 1, 2 and 34 are used.

> **Trade-off:** for signals above ~500 kHz, omit `R3`/`R4` and feed 3.3 V logic directly. The
> divider's RC time constant (`2.2 kΩ × 6 pF ≈ 13 ns`) is the same order as the 12.5 ns measurement
> resolution, so it visibly smears fast edges. See `docs/DESIGN.md` §5.

Connectivity: [`hardware/esp32-web-scope.net`](hardware/esp32-web-scope.net) — a netlist, not a
drawn schematic. A netlist can be machine-checked (`make netlist`, 45 checks), and a half-drawn
schematic cannot. It has not been through ERC/DRC or fabricated; treat it as reviewed design intent.

---

## Building it

### 1. Flash the firmware

```
arduino-cli core install esp32:esp32
arduino-cli lib install "ArduinoJson" "WebSockets"
arduino-cli compile --fqbn esp32:esp32:esp32 firmware/esp32_web_scope
arduino-cli upload  --fqbn esp32:esp32:esp32 -p /dev/ttyUSB0 firmware/esp32_web_scope
```

Set your Wi-Fi credentials at the top of `firmware/esp32_web_scope/esp32_web_scope.ino`:

```cpp
static const char* kWifiSsid = "YOUR_WIFI_SSID";
static const char* kWifiPass = "YOUR_WIFI_PASSWORD";
```

If the network is not reachable within 20 s, the board starts its own access point
(`ESP32-Scope` / `scope12345`) so it is never bricked out of reach. **Change that password** if you
keep the AP fallback.

For the fixed address the original request asked for, set `kUseStaticIp = true`; the default is
`192.168.2.23`.

### 2. Verify the core logic without hardware

The measurement maths lives in `scope_core.cpp`, which has no Arduino dependencies, so it builds
and tests on a laptop:

```
make test
```

Expected output:

```
89 checks, 0 failure(s)
12 checks, 0 failure(s)
18 checks, 0 failure(s)
45 checks, 0 failure(s)
all verifiable checks passed
```

### 3. Test the dashboard without hardware

```
node tools/simulate.mjs --port 8080
```

Open `http://localhost:8080/`. This runs the real dashboard against a **synthetic** device that
answers every command. It proves the UI works; it says nothing about the firmware, because none of
the firmware is running.

Change the simulated signal:

```
curl "http://localhost:8080/api/signal?freq=250000&duty=50"
```

There is also a headless test of the page itself:

```
node test/test_dashboard.mjs
```

```
18 checks, 0 failure(s)
```

---

## Using it

The dashboard is one page: the trace on the left, all controls in a column on the right.

### Controls

| Control | Range | What it actually does |
|---|---|---|
| **X position** | −100 … +100 % | Pans the drawn trace horizontally |
| **X zoom** | 1.0× … 20.0× | Magnifies the time base |
| **Time/div** | 100 ns … 2 ms | Selects the sweep speed (10 divisions across the screen) |
| **Y position** | 0 … 100 % | Moves the ground reference up and down |
| **Y zoom** | 1.0× … 10.0× | Vertical magnification |
| **V/div** | 0.1 … 3.3 V | Vertical scale |
| **Trigger level** | 0 … 3300 mV | Drawn as a red dashed line; see the caveat below |
| **Trigger edge** | Rising / Falling | Selects which edge marker is shown |
| **Trigger mode** | Auto / Normal | Auto keeps drawing on loss of signal |
| **BW limit** | on/off, 1–16 px | Draws a boxcar-averaged copy of the trace |
| **Cursors** | on/off, 2 positions | Δt and 1/Δt readouts |
| **Run / Stop / Single** | — | Starts, halts, or captures one frame |
| **Method** | PCNT / RMT / Capture | Chooses the measurement peripheral |

### Honest notes on the controls

Some of these controls are display transforms, not instrument settings. Being clear about which is
which:

- **X position, X zoom, Y position, Y zoom, V/div, Time/div** change only how the reconstructed
  trace is drawn. They do not change what the hardware measures. That is normal for a scope, but
  here the trace is a reconstruction, so their effect is purely visual.
- **BW limit** averages the *drawn* line. It does not filter the input signal. It is there to show
  what a bandwidth limit looks like; the readouts above it are unaffected.
- **Trigger level and edge** are drawn and stored, but this instrument does not have a real trigger
  engine: there is no sample memory to trigger into. In Auto mode the display is continuous. The
  trigger controls exist because the original request asked for them and because they are
  meaningful once a waveform-capture path exists; today they are cosmetic. **This is stated in the
  UI's own footer and is the honest position.**
- **FFT** is present in the protocol as a flag but is **not implemented**. There is no spectral
  display. The original sketch included an FFT view driven by the duty-distorted Fourier series
  described below; rather than ship a wrong one, it is omitted.
- **Single** captures one frame and stops. Because there is no sample buffer, "one frame" means one
  instantaneous measurement, not a triggered acquisition.

---

## Defects in the original sketch

The starting point (`cro.txt`) was two overlapping 1 MHz scope sketches. This table records what
was wrong, because the rewrite is only justified by the failures.

| # | Defect | Effect |
|---|---|---|
| 1 | `methods[]` referenced at three places, defined nowhere | Hard compile error |
| 2 | `buildWaveform()` synthesises the trace from measured frequency and duty | Displayed waveform is invented, not captured |
| 3 | Fourier term multiplies every harmonic by duty | Half amplitude at 50 % duty, 5× low at 10 % |
| 4 | `RMT_CLK_DIV 80` → 1 µs tick | A 1 MHz half-period (500 ns) quantises to 0 or 1 tick; duty reads 0 % or 100 % |
| 5 | PCNT overflow counted in `volatile int16_t` | Wraps negative, total is garbage above 32767 edges |
| 6 | Gate timed with `millis()` | 1 ms quantisation and loop-jitter error on a nominally 100 ms gate |
| 7 | `BIT(27)` magic number, direct `MCPWM[]` register poking | Breaks silently across IDF versions |
| 8 | `adc1_get_raw()` polled for 1 MHz capture | ~90 kS/s against a 1 MHz signal; aliasing, not measurement |
| 9 | `StaticJsonDocument<4096>` for a 1024-point frame | Frame silently truncated |
| 10 | `PCNT.counter_l_lim` set to −1 with a signed read | Negative residue can be mistaken for a count |

Each of these is fixed or removed. The relevant fixes:

- `RMT_CLK_DIV` is now **1** (12.5 ns), so 1 MHz resolves to exactly 40 ticks.
- PCNT overflows use a `uint32_t` plus a saturated residue (tested).
- The gate uses `esp_timer_get_time()`, not `millis()`.
- No synthetic `buildWaveform`; the trace is explicitly a reconstruction, labelled as such.
- The FFT view is removed rather than shipped wrong.

---

## Repository layout

```
esp32-web-scope/
├── README.md                        this file
├── Makefile                         host build + tests for the portable core
├── firmware/esp32_web_scope/
│   ├── esp32_web_scope.ino          setup, peripherals, HTTP, WebSocket
│   ├── scope_core.h                 measurement types and pure functions
│   ├── scope_core.cpp               unit-testable maths, no Arduino headers
│   ├── web_ui.h / web_ui.cpp        the dashboard HTML in PROGMEM
├── hardware/esp32-web-scope.net     carrier netlist (checked against the BOM)
├── test/
│   ├── test_core.cpp                89 checks against scope_core
│   ├── test_embedded_ui.cpp         12 checks that the page survived embedding
│   ├── test_dashboard.mjs           18 checks against the page in jsdom
│   ├── shim/Arduino.h               host shim so web_ui.cpp can be compiled
│   └── dashboard_preview.html       the page, standalone, for the simulator
├── tools/
│   ├── simulate.mjs                 fake device + web server for UI work
│   └── check_netlist.py             netlist vs BOM consistency check
└── docs/
    ├── BUILD.md                     toolchain, versions, what is and isn't verified
    ├── DESIGN.md                    why these peripherals, with the arithmetic
    ├── PROTOCOL.md                  the WebSocket command and frame schema
    ├── MEASUREMENTS.md              the numbers, and how each was derived
    └── bom.md                       full bill of materials
```

---

## Verification status

What was actually run, and what was not:

| Thing | Status |
|---|---|
| `scope_core` unit tests | **89/89 pass** (g++ 12.2, `-Wall -Wextra`, zero warnings) |
| Embedded dashboard literal | **12/12 pass** (compiles `web_ui.cpp` on the host) |
| Dashboard logic tests | **18/18 pass** (jsdom, real page, stubbed canvas) |
| Netlist ↔ BOM consistency | **45/45 pass** (`make netlist`) |
| **Total verifiable** | **164 checks, 0 failures** (`make test`) |
| Dashboard rendering | Verified by assertion (two voltage levels, >20 draw ops), **not** by visual screenshot |
| Simulator round trip | **Verified**: frames arrive, commands mutate state |
| Firmware compiles | **NOT VERIFIED** — no ESP32 toolchain was available |
| Firmware runs on hardware | **NOT VERIFIED** — no hardware |
| Timing measured on silicon | **NOT VERIFIED** — all timing figures are datasheet/clock arithmetic |
| Netlist | Machine-checked against the BOM and against the arithmetic; **not** ERC/DRC checked |

The firmware has never been compiled. It is written against Arduino-ESP32 core 2.0.x and uses the
legacy PCNT/RMT/MCPWM drivers that were removed in core 3.x, so on a current core it will not
build. `docs/BUILD.md` explains pinning to 2.0.x. Do not read the passing host tests as evidence
that the `.ino` compiles; the two share only `scope_core.cpp`.

---

## Licence

MIT. Do what you like; no warranty, and please do not connect 12 V to GPIO 34.
