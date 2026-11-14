# WebSocket protocol

The dashboard and the firmware talk over a WebSocket on **port 81**. The page itself is served over
HTTP on **port 80**.

```
HTTP   http://<device>/            the dashboard (single self-contained page, from PROGMEM)
HTTP   http://<device>/api/status  a small JSON health check
WS     ws://<device>:81/           data frames down, commands up
```

The split into two ports is a limitation of the current implementation, not a design goal: serving
both on one port would require the HTTP server and the WebSocket server to share a socket, which
the Arduino `WebServer` library does not support. If port 81 is inconvenient, run a reverse proxy
in front of it.

The dashboard detects this automatically: if the page is loaded from any port other than 80/443 it
assumes the WebSocket is on the **same** port as the page, which is what the simulator does. On the
device (port 80) it connects to 81.

---

## Frame rate

The device pushes a frame every **50 ms** (20 Hz) to every connected client, up to 4 clients. When
no client is connected the device still measures, but does not build frames, so the cost of an idle
dashboard is near zero.

Running state is per-device, not per-client: two browsers see the same controls and the last
command wins.

---

## Data frame (device → browser)

```json
{
  "cmd": "data",
  "method": 0,
  "valid": true,
  "meas": {
    "freq_mhz": 1000000000,
    "period_ns": 1000,
    "high_ns": 500,
    "low_ns": 500,
    "duty_permille": 500,
    "edges": 100000,
    "freq_text": "1.000 MHz",
    "period_text": "1.000 us",
    "high_text": "500 ns",
    "low_text": "500 ns"
  },
  "state": {
    "running": true,
    "method": 0,
    "x_offset_pct": 0,
    "y_offset_pct": 50,
    "x_zoom_x10": 10,
    "y_zoom_x10": 10,
    "v_per_div_idx": 2,
    "timebase_idx": 5,
    "trigger_mv": 1650,
    "trigger_edge": 1,
    "trigger_mode": 0,
    "bw_limit": false,
    "bw_size": 4,
    "cursors": false,
    "cursor1_pct": 25,
    "cursor2_pct": 75,
    "fft": false
  }
}
```

### Field reference

| Field | Type | Meaning |
|---|---|---|
| `method` | 0/1/2 | 0 = PCNT, 1 = RMT, 2 = MCPWM capture |
| `valid` | bool | `false` means no usable measurement; all `meas` values are zero |
| `freq_mhz` | int64 | Frequency in **millihertz**. 1 MHz is `1000000000` |
| `period_ns` | uint32 | Period in nanoseconds |
| `high_ns` | uint32 | High time in nanoseconds |
| `low_ns` | uint32 | Low time in nanoseconds |
| `duty_permille` | uint16 | Duty in **per mille**, 0–1000. 500 = 50 % |
| `edges` | uint32 | Edges counted in the last acquisition |
| `*_text` | string | Pre-formatted by the firmware, so the serial log and the page agree |

### Why millihertz and per mille

**Millihertz** avoids floating point on a chip where it is slow and imprecise, and keeps the
integer resolution needed at the low end: 1 Hz = 1000 mHz, 1 MHz = 10⁹ mHz, so an `int64` covers
1 mHz to 9.2×10¹⁸ mHz with no loss.

**Per mille** because percent is only 100 steps and cannot express 0.1 % duty. It is `uint16_t`
rather than `uint8_t` because 500 does not fit in a byte — an early version used `uint8_t` and
reported 50 % as 24.4 %. The unit test caught it; it is documented in `BUILD.md`.

### Why the firmware sends formatted strings

`freq_text` and friends are redundant with the numeric fields, deliberately. The firmware's serial
log and the browser's readout must not disagree, and having one authoritative formatting
implementation (the C++ one, in `scope_core.cpp`) prevents exactly the drift that would otherwise
happen with two formatters in two languages. The browser still formats the *cursor* readouts
locally, because those change at UI rate and a round trip would be wasteful; the test suite asserts
the two implementations produce identical strings for the common cases.

---

## Commands (browser → device)

Every command is a JSON object with a `cmd` string. Unknown commands are ignored silently — the
device does not answer with an error, so a newer dashboard talking to older firmware degrades
rather than breaking.

### Run control

| Command | Payload | Effect |
|---|---|---|
| `run` | — | Resume continuous measurement |
| `stop` | — | Halt measurement; `valid` becomes `false` |
| `single` | — | Take one measurement, send one frame, then stop |

```json
{"cmd":"run"}
{"cmd":"stop"}
{"cmd":"single"}
```

### Method

```json
{"cmd":"setMethod","value":0}
```

`value` is clamped to 0–2, or 0–1 when built with `SCOPE_NO_CAPTURE`.

### Horizontal

| Command | Payload | Range | Meaning |
|---|---|---|---|
| `setXOffset` | `value` | −100…100 | Trace pan, percent of screen |
| `setXZoom` | `value` | 10…200 | Zoom ×10 (10 = 1.0×, 200 = 20.0×) |
| `setTB` | `value` | 0…13 | Index into the timebase table |

Timebase table (µs per division; 10 divisions fill the screen):

| Index | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| µs/div | 0.1 | 0.2 | 0.5 | 1 | 2 | 5 | 10 | 20 | 50 | 100 | 200 | 500 | 1000 | 2000 |
| Label | 100 ns | 200 ns | 500 ns | 1 µs | 2 µs | 5 µs | 10 µs | 20 µs | 50 µs | 100 µs | 200 µs | 500 µs | 1 ms | 2 ms |

### Vertical

| Command | Payload | Range | Meaning |
|---|---|---|---|
| `setYOffset` | `value` | 0…100 | Ground position, percent from top |
| `setYZoom` | `value` | 10…100 | Zoom ×10 |
| `setVScale` | `value` | 0…5 | Index into the V/div table |

V/div table: `[0.1, 0.2, 0.5, 1.0, 1.5, 3.3]`.

### Trigger

```json
{"cmd":"setTrigger","level_mv":1650,"edge":1,"mode":0}
```

| Field | Range | Meaning |
|---|---|---|
| `level_mv` | 0…3300 | Trigger level |
| `edge` | −1 / 1 | Falling / rising |
| `mode` | 0/1/2 | Auto / Normal / Single |

These control the drawn markers only. See the caveat in `README.md`: there is no trigger engine
because there is no sample buffer.

### Display

```json
{"cmd":"setBWLimit","enabled":true,"size":4}
{"cmd":"setCursor","enabled":true,"c1":25,"c2":75}
{"cmd":"setFFT","enabled":false}
```

`size` is the boxcar window in pixels, 1–16. `setFFT` is accepted and stored but **does nothing** —
no spectral display exists. The flag is reserved so a future version can implement it without a
protocol change.

---

## HTTP endpoints

### `GET /`

The dashboard. `text/html`, from `PROGMEM`, ~27 KB.

### `GET /api/status`

```json
{"ok":true,"method":0,"valid":true,"capture_available":true}
```

Useful for a scripted health check:

```bash
curl -s http://192.168.2.23/api/status | jq .
```

`capture_available` is `false` when the firmware was built with `SCOPE_NO_CAPTURE` or when
`mcpwm_capture_enable_channel()` failed at boot. In that case the Capture button on the page
selects nothing useful — the device clamps `setMethod` to 1 (RMT) in that build.

### Anything else

`404 not found`, `text/plain`.

---

## Reconnection

The page reconnects with exponential backoff: 500 ms, 1 s, 2 s, 4 s, then 5 s forever. On
reconnection it sends nothing; it waits for the first frame and syncs its controls from the
device's `state` object. That means a browser refresh never resets the instrument.

The device does not care whether a client is connected, other than skipping frame construction.

---

## Adding a command

1. Add a branch to `handleCommand()` in `esp32_web_scope.ino`.
2. Add the field to `ScopeState` and to the `state` object in `sendFrame()`.
3. Mirror it in `applyCommand()` in `tools/simulate.mjs`, or the simulator will silently ignore it.
4. Add the control to `test/dashboard_preview.html` and regenerate `web_ui.cpp`.
5. Add an assertion to `test/test_dashboard.mjs` that the control emits the command.

Step 3 is easy to forget and is the reason the simulator has its own copy of the switch: without
it the UI appears broken in the simulator for reasons that have nothing to do with the firmware.
