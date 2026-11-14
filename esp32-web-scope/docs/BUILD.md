# Build and verification

## What has been verified, and what has not

Being precise about this matters more than usual here, because the parts that were tested and the
parts that were not are different enough that a reader could easily assume the wrong one.

| Item | Command | Result |
|---|---|---|
| Portable measurement core | `make test` | **89 checks, 0 failures** |
| Embedded dashboard literal | `make embedded` | **12 checks, 0 failures** |
| Dashboard page logic | `node test/test_dashboard.mjs` | **30 checks, 0 failures** |
| Simulator round trip | `node tools/simulate.mjs` | Frames and commands **verified manually** |
| Firmware compile | `arduino-cli compile …` | **NOT RUN — no toolchain in the build environment** |
| Firmware on hardware | — | **NOT RUN — no hardware** |
| Schematic ERC | — | **NOT RUN — hand-written netlist** |

The `.ino` has **never been compiled by anyone**. Treat the first build as likely to need fixes and
read the "known build risks" section below before you start.

---

## Host build (verified)

Requirements: a C++17 compiler. Nothing else.

```bash
make test
```

```
scope_core unit tests
=====================

period <-> frequency conversions
...
=====================
89 checks, 0 failure(s)
```

The tests are dependency-free: a header-only `CHECK`/`CHECK_NEAR`/`CHECK_STR` harness in
`test/test_core.cpp`. No GoogleTest, no Catch2, nothing to install. That was deliberate — a test
suite that needs a package manager is a test suite that stops being run.

The compiler flags are strict on purpose:

```
-std=c++17 -O2 -Wall -Wextra
```

`scope_core.cpp` compiles without warnings under `-Wall -Wextra`. If you add code, keep it that
way; a warning-free core is what makes the ESP32-side integration trustworthy.

### What the core tests cover

| Area | Checks | Notes |
|---|---|---|
| Period ↔ frequency conversion | 6 | Includes the 1e12 scale constant; a 1000× error here is easy to make |
| Edge estimation, rising only | 4 | 1 MHz square, exact |
| Edge estimation, both edges | 5 | The 25 % duty case that caught the median bug |
| Timestamp wrap | 3 | A single 32-bit wrap is compensated |
| Glitch rejection | 4 | Sub-20 ns pulses discarded |
| Degenerate input | 5 | Zero counts, one edge, null pointers |
| Missed-edge robustness | 2 | Median filter prevents halving |
| Gate frequency | 3 | Includes uint64 counts beyond 2³² |
| RMT pulse analysis | 9 | Includes the divider-80 failure and the 12.5 ns truncation cases |
| RMT divider selection | 9 | Including "1 Hz cannot work" asserted as a failure |
| Formatting | 6 | Strings match the browser's formatters |
| ADC feasibility | 4 | Encodes the arithmetic from `DESIGN.md` §1 |
| **Total** | **89** |  |

Five genuine bugs in the drafts were found by these tests, not by review:

1. `1e15` used instead of `1e12` in both converters — every frequency was 1000× wrong.
2. `median(intervals) × 2` as the period for alternating edges — 25 % duty read as 25 % of the
   wrong period.
3. `uint8_t duty_permille` — 500 ‰ wrapped to 244 ‰, reporting a 50 % square as 24.4 %.
4. A 12.5 ns RMT tick truncated to 12 ns — a 4.17 % frequency error at 1 MHz.
5. A test assertion with its sign inverted, which failed and was fixed rather than deleted.

They are listed here because "the tests pass" means little without knowing they can fail.

---

## Dashboard test (verified)

```bash
node test/test_dashboard.mjs
```

Loads the real page in jsdom (borrowed from the sibling `a11y-workbench` project rather than added
as a dependency), stubs the canvas 2D context, injects a fake WebSocket, and asserts on the DOM and
on the recorded draw calls.

```
30 checks, 0 failure(s)
```

It verifies that a 1 MHz / 50 % frame produces the right readouts, that an invalid frame shows the
empty state, that moving a slider emits the matching command, and -- in the largest section -- that
the trace geometry is a square wave rather than a set of ramps.

That last group exists because the first renderer drew the waveform as **diagonal ramps**: it
toggled the level and then advanced by the new level's duration, so every transition landed at a
different x from the flat top before it. It also snapped the origin to a whole cycle, which made the
X position control appear dead (a 10 % pan at 5 µs/div is exactly 5 periods of a 1 MHz signal, so
the trace was pixel-identical). Both are now pinned by assertions: transitions must be vertical
pairs at identical x, and no segment may change both x and y.

**It does not verify appearance.** There is no screenshot test and no browser in the build
environment, so layout, colour and spacing have not been seen rendered. The logic is checked; the
look is not.

---

## Simulator (verified manually)

```bash
node tools/simulate.mjs --port 8080
```

Serves the page and a WebSocket on one port with a synthetic device. Every control on the page
works against it. This is how the UI was developed without hardware.

The simulator's `measurement()` invents numbers. **It is not evidence that the firmware measures
anything correctly.** Its only purpose is to exercise the UI.

---

## ESP32 build (NOT verified)

### Toolchain

```bash
# Install the ESP32 core
arduino-cli core install esp32:esp32@2.0.17

# Libraries
arduino-cli lib install "ArduinoJson@6.21.3"
arduino-cli lib install "WebSockets@2.4.1"

# Compile
arduino-cli compile --fqbn esp32:esp32:esp32 firmware/esp32_web_scope

# Flash
arduino-cli upload --fqbn esp32:esp32:esp32 -p /dev/ttyUSB0 firmware/esp32_web_scope
```

### The core version is pinned for a reason

The firmware uses the **legacy** ESP-IDF drivers:

- `driver/pcnt.h` with `pcnt_unit_config()`
- `driver/rmt.h` with `rmt_config()`, `rmt_driver_install()`, `rmt_rx_start()`
- `driver/mcpwm.h` with `mcpwm_capture_enable_channel()` and direct `MCPWM[]` register access

These are present in **arduino-esp32 2.0.x (ESP-IDF 4.4)** and **removed or changed in 3.x
(ESP-IDF 5.x)**. Specifically, `mcpwm_capture_enable_channel()` changed signature: it takes a
config struct in 4.x and different arguments in 5.x, and the legacy `driver/mcpwm.h` header is gone
in favour of `driver/mcpwm_cap.h`.

If you build against core 3.x you will get errors in `esp32_web_scope.ino`. That is expected. Either
pin the core to 2.0.17 as shown above, or port the capture path — the rest of the firmware is
written to be portable and the measurement maths lives in `scope_core.cpp`, which has no Arduino
dependency at all.

### Known build risks

The code was written by careful reading of the ESP-IDF 4.4 API, but never compiled. The parts most
likely to need adjustment, in order of likelihood:

1. **`mcpwm_capture_enable_channel()` signature.** In 4.4 it returns `esp_err_t` and takes
   `(unit, cap_signal, &config)`. Some 4.x point releases differ. If it fails to compile, this call
   is the first place to look.
2. **`MCPWM[MCPWM_UNIT_0]->int_clr.val`.** Direct register access through the `MCPWM` macro. The
   struct exists in 4.4 (`soc/mcpwm_struct.h`) but the interrupt bit numbering (`BIT(27)` for CAP0)
   is taken from the register map and was not verified against a header.
3. **`rmt_set_clk_div()`** requires the channel to be stopped. The firmware calls it before
   `rmt_rx_start()`, which should be fine, but the RMT driver may need an explicit
   `rmt_rx_stop()` first on some versions.
4. **`xRingbufferReceive()` timeout** with `pdMS_TO_TICKS(50)` — the ring buffer must have been
   created with a length, which `rmt_driver_install(…, 2048, 0)` does. If no items arrive in 50 ms
   the function returns `nullptr`, which the code handles.

If the capture path is the problem, the firmware can be built without it:

```bash
arduino-cli compile --fqbn esp32:esp32:esp32 \
  --build-property "compiler.cpp.extra_flags=-DSCOPE_NO_CAPTURE" \
  firmware/esp32_web_scope
```

With `SCOPE_NO_CAPTURE` defined, the capture method reports `---` and the PCNT and RMT methods work
normally. That gives a buildable, usable instrument while the capture path is fixed.

### Memory

The frame is built in a `DynamicJsonDocument(12288)` on every update. That is on the heap, 12 KB,
allocated and freed at 20 Hz. With Wi-Fi and the WebSocket server running there is comfortably
enough on a stock ESP32 (≈300 KB free heap), but it is a churn-heavy pattern. If you see
fragmentation over days of uptime, hoist the document to a static.

The dashboard itself is `PROGMEM` and served with `send_P()`, so it occupies flash, not RAM.

---

## Flashing and first run

1. Set Wi-Fi credentials in `esp32_web_scope.ino`.
2. Flash.
3. Open the serial monitor at 115200. You should see:

   ```
   ESP32 web scope starting
   Connecting to "your-ssid"....
   Connected. Dashboard: http://192.168.2.23
   Ready.
   ```

4. Open that address. The header dot turns green when the WebSocket connects.
5. Feed a known signal — a 1 kHz square from a signal generator or another microcontroller — and
   check the frequency readout.

If the IP is not `192.168.2.23`, either DHCP assigned something else (set `kUseStaticIp = true`) or
the connection failed and the AP fallback started (`http://192.168.4.1`).

---

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| Page loads, dot stays red | WebSocket on port 81 blocked by a firewall or AP client isolation |
| Frequency reads 0 | No signal, or signal below the R2 pull-down threshold, or wrong pin |
| Frequency reads exactly double | Both-edge counting enabled when it should be single |
| Duty reads 0 % or 100 % | RMT divider wrong for the frequency; check `rmtDividerForPeriod` |
| Readings jump around | Input floating; check R2 and the ground connection |
| Works at 1 kHz, fails at 1 MHz | Long unshielded lead ringing; shorten it or add series termination |
| Compile error on `mcpwm_capture_enable_channel` | Core version mismatch; see above |
