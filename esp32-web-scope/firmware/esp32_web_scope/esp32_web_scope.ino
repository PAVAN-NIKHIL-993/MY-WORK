// ---------------------------------------------------------------------------
// esp32_web_scope.ino - ESP32 web oscilloscope for digital signals, 1 Hz - 1 MHz
//
// Measures frequency, period, duty cycle and pulse widths of a logic-level
// signal and serves a web dashboard at http://<ip>/.
//
// Targets Arduino-ESP32 core 2.0.x (C++11, ESP-IDF 4.4). The legacy PCNT/RMT/
// MCPWM drivers used here were removed in core 3.x; see docs/BUILD.md.
//
// ---------------------------------------------------------------------------
// HONEST SCOPE OF THIS DEVICE
// ---------------------------------------------------------------------------
// This is a FREQUENCY COUNTER WITH A WEB UI, not an oscilloscope in the sense of
// capturing an arbitrary waveform. It cannot:
//   * capture an analog waveform above ~10 kHz (the ESP32 ADC has a ~6-8 kHz
//     analog bandwidth, and adc1_get_raw() polls at only ~100 kS/s),
//   * show the true shape of a fast edge (rise/fall time is not measured),
//   * display anything but a reconstructed ideal pulse train for digital inputs.
//
// What it genuinely measures, from real hardware edges:
//   * frequency      (PCNT gate count, or capture-timestamp differencing)
//   * period         (capture timestamps)
//   * duty cycle     (RMT pulse widths)
//   * high/low time  (RMT pulse widths)
//
// The dashboard draws a pulse train reconstructed from those MEASURED numbers,
// and labels it as such. The original sketch this replaces drew a synthetic
// waveform resembling a measurement without saying so.
// ---------------------------------------------------------------------------

#include <Arduino.h>
#include <ArduinoJson.h>
#include <WebServer.h>
#include <WebSocketsServer.h>
#include <WiFi.h>
#include <driver/pcnt.h>
#include <driver/rmt.h>
#include <soc/mcpwm_reg.h>
#include <soc/mcpwm_struct.h>

#include "scope_core.h"

// ===========================================================================
// Configuration
// ===========================================================================
static const char* kWifiSsid = "YOUR_WIFI_SSID";
static const char* kWifiPass = "YOUR_WIFI_PASSWORD";

// Leave empty to use DHCP; fill in for a fixed address.
static const IPAddress kStaticIp(192, 168, 2, 23);
static const IPAddress kGateway(192, 168, 2, 1);
static const IPAddress kSubnet(255, 255, 255, 0);
static constexpr bool kUseStaticIp = false;

// The signal input. One pin, as specified.
//
// GPIO 34 is input-only, has no internal pull-up, and is ADC1 channel 6. It can
// still be read by the PCNT, RMT and MCPWM peripherals because the GPIO matrix
// routes any input pad to any peripheral input -- the "input only" restriction
// stops you *driving* the pin, not observing it. So a single probe feeds all
// three measurement methods, and no external fan-out is needed.
//
// The external pull-down (R2, 10k) matters here: GPIO 34 has no internal one, so
// without it a floating probe would read noise.
static constexpr gpio_num_t kPinSignal = GPIO_NUM_34;

// PCNT gate time. A fixed 100 ms gate cannot resolve 1 Hz (it would count 0.1
// edges), so the gate adapts: lengthen it for slow signals to keep at least
// ~1000 counts, and cap it at 1 s so the display still refreshes about once a
// second at the slow end.
static constexpr uint32_t kGateMinMs = 100;
static constexpr uint32_t kGateMaxMs = 1000;
static constexpr uint32_t kSendIntervalMs = 50; // dashboard refresh (20 FPS)
static constexpr size_t kMaxClients = 4;

// RMT timing. 80 MHz / 1 = 12.5 ns per tick, which resolves a 1 MHz square
// wave's 500 ns half-period exactly (40 ticks). The original sketch used
// DIV 80 = 1 us per tick, at which a 500 ns pulse quantises to zero.
static constexpr uint8_t kRmtClkDiv = 1;
// Tick length at divider 1, in TENTHS of a nanosecond: 125 = 12.5 ns.
// Integer nanoseconds cannot represent 12.5, and truncating to 12 ns would be a
// 4.2 % frequency error at 1 MHz -- exactly the error this design exists to avoid.
static constexpr uint32_t kRmtTenthsNsPerTick = 125;
static constexpr uint16_t kRmtGlitchNs = 100;  // reject pulses below this

WebServer server(80);
WebSocketsServer webSocket(81);

// ===========================================================================
// Measurement state
// ===========================================================================
enum class Method : uint8_t { kPcnt = 0, kRmt = 1, kCapture = 2 };

struct ScopeState {
  bool running = true;
  bool single_shot = false;
  bool single_done = false;
  Method method = Method::kPcnt;

  // Display-only controls. These do not change what is measured; they change how
  // the reconstructed trace is drawn, and are applied in the browser.
  int16_t x_offset_pct = 0;     // -100..100
  int16_t y_offset_pct = 50;    // 0..100
  uint16_t x_zoom_x10 = 10;     // 1.0x .. 20.0x
  uint16_t y_zoom_x10 = 10;     // 1.0x .. 10.0x
  uint8_t v_per_div_idx = 2;    // index into kVPerDiv
  uint8_t timebase_idx = 5;     // index into kTimebases
  uint16_t trigger_mv = 1650;   // trigger level in millivolts
  int8_t trigger_edge = 1;      // +1 rising, -1 falling
  uint8_t trigger_mode = 0;     // 0 auto, 1 normal, 2 single
  bool bw_limit = false;
  uint8_t bw_size = 4;          // moving-average window for the drawn trace
  bool cursors = false;
  uint8_t cursor1_pct = 25;
  uint8_t cursor2_pct = 75;
  bool fft = false;
};

static ScopeState g_state;

// Latest genuine measurement.
static scope::Measurement g_meas;

// Cached human-readable strings, rebuilt only when the measurement changes.
static char g_freq_text[24] = "---";
static char g_period_text[24] = "---";
static char g_high_text[24] = "---";
static char g_low_text[24] = "---";

// ===========================================================================
// PCNT: gate-based frequency
// ===========================================================================
static volatile uint32_t g_pcnt_overflows = 0;

// Non-blocking gate state. The gate is armed by measureWithPcnt(), then sampled
// by servicePcnt() once the elapsed time passes. `armed` means "waiting for the
// gate to finish"; `start_us` and `end_us` bracket it in esp_timer microseconds.
static bool g_pcnt_armed = false;
static int64_t g_pcnt_gate_start_us = 0;
static int64_t g_pcnt_gate_end_us = 0;

static constexpr int16_t kPcntHighLimit = 30000;

// NOTE: task context, not ISR context.
//
// The PCNT driver services its own interrupt and posts a callback that runs as a
// "timer task" callback, not in the ISR. The previous version marked this
// IRAM_ATTR and called the driver's ringbuffer-free path, which is not
// interrupt-safe; it only appeared to work because the callback is normally
// dispatched from a task. It is left in flash and made explicitly task-context.
//
// Clearing the PCNT interrupt status is the driver's job: it already does so
// before invoking this callback. Writing PCNT.int_clr here raced with that and
// could drop counts.
static void IRAM_ATTR onPcntOverflow(void* /*arg*/) {
  // esp_timer/task context; a single 32-bit increment is atomic on Xtensa.
  ++g_pcnt_overflows;
}

static void setupPcnt() {
  pcnt_config_t cfg = {};
  cfg.pulse_gpio_num = kPinSignal;
  cfg.ctrl_gpio_num = PCNT_PIN_NOT_USED;
  cfg.channel = PCNT_CHANNEL_0;
  cfg.unit = PCNT_UNIT_0;
  cfg.pos_mode = PCNT_COUNT_INC;
  cfg.neg_mode = PCNT_COUNT_DIS;
  cfg.lctrl_mode = PCNT_MODE_KEEP;
  cfg.hctrl_mode = PCNT_MODE_KEEP;
  cfg.counter_h_lim = kPcntHighLimit;
  cfg.counter_l_lim = 0;
  pcnt_unit_config(&cfg);

  // 80 MHz / 1023 is the coarsest filter step that still rejects sub-microsecond
  // noise while passing a 1 MHz square wave's 500 ns half-period... which it
  // cannot: at 1 MHz the high and low times are both 500 ns, so ANY hardware
  // filter on PCNT would remove real signal. The filter is therefore disabled and
  // glitch rejection is left to the RMT path, which has 12.5 ns resolution.
  pcnt_filter_disable(PCNT_UNIT_0);

  // Install the ISR service and register the overflow handler. Without this the
  // callback below is dead code and any count above kPcntHighLimit is silently
  // lost -- which looks like a plausible reading, not like a fault.
  // Returns ESP_ERR_INVALID_STATE if the service is already installed, which
  // happens on a soft restart without a power cycle. That is not an error here,
  // but every other failure is, so only it is tolerated.
  const esp_err_t isr_rc = pcnt_isr_service_install(0);
  if (isr_rc != ESP_OK && isr_rc != ESP_ERR_INVALID_STATE) {
    Serial.printf("PCNT ISR service failed: %d\n", static_cast<int>(isr_rc));
  }
  pcnt_isr_handler_add(PCNT_UNIT_0, onPcntOverflow, nullptr);

  // Watch only the high-limit event: that is the wrap we need to count.
  pcnt_event_enable(PCNT_UNIT_0, PCNT_EVT_H_LIM);

  pcnt_counter_pause(PCNT_UNIT_0);
  pcnt_counter_clear(PCNT_UNIT_0);
  pcnt_counter_resume(PCNT_UNIT_0);
}

// Choose the next gate length from the last measured frequency. At 1 MHz a
// 100 ms gate already yields 100 000 counts (10 ppm quantisation), so the gate
// stays short; at 1 Hz it stretches to the 1 s cap, which yields 1 count -- the
// honest floor of this method, and the reason low frequencies are better read
// with the capture method.
static uint32_t nextGateMs() {
  if (g_meas.freq_mhz <= 0) return kGateMinMs;
  const double hz = static_cast<double>(g_meas.freq_mhz) / 1000.0;
  const double want_ms = 1000.0 / hz * 1000.0;  // 1000 counts' worth of time
  if (want_ms <= kGateMinMs) return kGateMinMs;
  if (want_ms >= kGateMaxMs) return kGateMaxMs;
  return static_cast<uint32_t>(want_ms);
}

// Arm a timed gate. The gate is timed with esp_timer (microsecond accuracy,
// crystal-derived) rather than millis(), which the original sketch used and which
// quantises the gate to 1 ms and drifts with loop jitter. Arming is cheap; the
// result appears from servicePcnt() once the gate elapses.
static scope::Measurement startPcntGate() {
  pcnt_counter_pause(PCNT_UNIT_0);
  pcnt_counter_clear(PCNT_UNIT_0);
  g_pcnt_overflows = 0;

  // The gate must not block the main loop: at 1 Hz it is a full second, during
  // which the HTTP server and WebSocket would be unresponsive. Instead the loop
  // drives a small state machine (see servicePcnt()) and the gate simply elapses
  // across loop iterations, with `esp_timer` measuring the real interval so the
  // result stays accurate despite the loop being busy with network work.
  const uint32_t gate_ms = nextGateMs();
  g_pcnt_gate_end_us = esp_timer_get_time() + static_cast<int64_t>(gate_ms) * 1000;
  g_pcnt_gate_start_us = esp_timer_get_time();
  g_pcnt_armed = true;
  pcnt_counter_resume(PCNT_UNIT_0);

  // No measurement is ready on the iteration that arms the gate; servicePcnt()
  // produces it later.
  return scope::Measurement{};
}

// Called every loop iteration. When the gate has elapsed, latch the count and
// turn it into a frequency. Returns true (and sets `out`) when a new measurement
// is available, false otherwise, so the caller can keep serving HTTP meanwhile.
static bool servicePcnt(scope::Measurement* out) {
  if (!g_pcnt_armed) return false;
  const int64_t now = esp_timer_get_time();
  if (now < g_pcnt_gate_end_us) return false;

  pcnt_counter_pause(PCNT_UNIT_0);
  const int64_t gate_ns = (now - g_pcnt_gate_start_us) * 1000;

  int16_t latched = 0;
  pcnt_get_counter_value(PCNT_UNIT_0, &latched);

  // Reconstruct the total. `latched` is signed and can be negative after a wrap,
  // where it then means the counter has not yet climbed back from the low limit;
  // treating a negative value as zero loses at most one limit's worth of counts,
  // whereas casting it to uint32_t would add ~4 billion.
  const uint32_t residue = (latched < 0) ? 0u : static_cast<uint32_t>(latched);
  const uint32_t overflows = g_pcnt_overflows;  // 32-bit read is atomic here
  const uint64_t pulses =
      static_cast<uint64_t>(overflows) * kPcntHighLimit + residue;

  g_pcnt_armed = false;

  scope::Measurement m;
  m.freq_mhz = scope::frequencyFromCount(pulses, static_cast<uint64_t>(gate_ns));
  m.edges = static_cast<uint32_t>(pulses);
  if (m.freq_mhz > 0) {
    m.period_ns = static_cast<uint32_t>(scope::milliHzToPeriodNs(m.freq_mhz));
    m.valid = true;
  }
  *out = m;
  return true;
}

// ===========================================================================
// RMT: pulse widths and duty cycle
// ===========================================================================
// The RMT duration field is 15 bits, so one pulse can span at most 32767 ticks.
// At 12.5 ns/tick that is only 410 us -- fine for 1 MHz, useless for 100 Hz.
// The divider is therefore chosen from the last known period so that one full
// period fits comfortably inside the field, trading resolution for range.
static uint8_t g_rmt_div = kRmtClkDiv;

static uint8_t dividerForPeriod(uint32_t period_ns) {
  // Delegated to the unit-tested core rather than reimplemented here; the two
  // copies had already drifted once.
  return scope::rmtDividerForPeriod(period_ns, kRmtTenthsNsPerTick);
}

static void setupRmt() {
  rmt_config_t cfg = {};
  cfg.rmt_mode = RMT_MODE_RX;
  cfg.channel = RMT_CHANNEL_0;
  cfg.gpio_num = kPinSignal;
  cfg.mem_block_num = 4;  // 256 items
  cfg.clk_div = kRmtClkDiv;
  cfg.rx_config.filter_en = true;
  // Filter threshold is in ticks: 8 ticks * 12.5 ns = 100 ns.
  // 100 ns / 12.5 ns = 8 ticks.
  cfg.rx_config.filter_ticks_thresh =
      static_cast<uint8_t>((kRmtGlitchNs * 10u) / kRmtTenthsNsPerTick);
  // idle_threshold is also 15-bit. 16000 ticks = 200 us at div 1, which ends a
  // burst without waiting so long that the UI stutters.
  cfg.rx_config.idle_threshold = 16000;
  rmt_config(&cfg);
  rmt_driver_install(RMT_CHANNEL_0, 2048, 0);
}

static scope::Measurement measureWithRmt() {
  RingbufHandle_t rb = nullptr;
  if (rmt_get_ringbuf_handle(RMT_CHANNEL_0, &rb) != ESP_OK || rb == nullptr) {
    return scope::Measurement{};
  }

  // Re-tune the divider for the period we last saw, so slow signals do not
  // overflow the 15-bit duration field.
  const uint8_t want_div = dividerForPeriod(g_meas.period_ns);
  if (want_div != g_rmt_div) {
    rmt_set_clk_div(RMT_CHANNEL_0, want_div);
    g_rmt_div = want_div;
  }

  // Discard anything already queued: it belongs to a previous acquisition and
  // mixing the two would report a mixture of old and new edge timings.
  size_t stale_size = 0;
  for (int i = 0; i < 8; ++i) {
    void* stale = xRingbufferReceive(rb, &stale_size, 0);
    if (stale == nullptr) break;
    vRingbufferReturnItem(rb, stale);
  }

  rmt_rx_start(RMT_CHANNEL_0, true);

  // A short timeout, not 50 ms. This runs inside loop(), so a long block would
  // stall the HTTP server and the WebSocket for the same period; at 20 Hz that
  // is more than the whole frame budget. 5 ms is long enough for a burst at any
  // frequency the RMT path can measure and short enough to keep the UI live.
  size_t rx_size = 0;
  rmt_item32_t* items = static_cast<rmt_item32_t*>(
      xRingbufferReceive(rb, &rx_size, pdMS_TO_TICKS(5)));
  rmt_rx_stop(RMT_CHANNEL_0);

  if (items == nullptr || rx_size == 0) {
    if (items) vRingbufferReturnItem(rb, items);
    return scope::Measurement{};
  }

  // Flatten into PulseRun entries. Each rmt_item32_t holds two durations.
  static scope::PulseRun runs[128];
  size_t n = 0;
  const size_t item_count = rx_size / sizeof(rmt_item32_t);
  for (size_t i = 0; i < item_count && n + 2 <= 128; ++i) {
    runs[n].ticks = items[i].duration0;
    runs[n].level = items[i].level0 != 0;
    ++n;
    runs[n].ticks = items[i].duration1;
    runs[n].level = items[i].level1 != 0;
    ++n;
  }

  vRingbufferReturnItem(rb, items);

  // Actual tick length follows the divider that is in force.
  const uint32_t tenths_ns_per_tick = kRmtTenthsNsPerTick * g_rmt_div;
  return scope::analysePulses(runs, n, tenths_ns_per_tick, kRmtGlitchNs);
}

// ===========================================================================
// MCPWM capture: edge timestamps (fallback / high-resolution period)
// ===========================================================================
// The legacy MCPWM capture driver is register-level. This is kept deliberately
// small: it records edge timestamps into a ring buffer, and all the arithmetic
// happens in scope_core where it is unit-tested.
//
// If this does not build on your core version, build with -DSCOPE_NO_CAPTURE and
// the capture method simply reports "unavailable" instead of failing to compile.
// See docs/BUILD.md.
#ifndef SCOPE_NO_CAPTURE
static volatile uint32_t g_cap_ring[scope::kMaxEdges];
static volatile uint8_t g_cap_head = 0;
static volatile uint8_t g_cap_count = 0;
static volatile bool g_cap_overflow = false;

static void IRAM_ATTR onCapture() {
  const uint32_t status = MCPWM[MCPWM_UNIT_0]->int_st.val;
  MCPWM[MCPWM_UNIT_0]->int_clr.val = status;

  if ((status & BIT(27)) == 0) return;  // CAP0

  const uint32_t stamp = mcpwm_capture_signal_get_value(MCPWM_UNIT_0, MCPWM_SELECT_CAP0);

  if (g_cap_count >= scope::kMaxEdges) {
    g_cap_overflow = true;
    return;
  }
  g_cap_ring[g_cap_head] = stamp;
  g_cap_head = static_cast<uint8_t>((g_cap_head + 1) % scope::kMaxEdges);
  ++g_cap_count;
}

static bool setupCapture() {
  // GPIO 21 as CAP0 input.
  mcpwm_gpio_init(MCPWM_UNIT_0, MCPWM_CAP_0, kPinSignal);

  mcpwm_capture_config_t cfg = {};
  cfg.cap_edge = MCPWM_BOTH_EDGE;
  cfg.cap_prescale = 1;
  cfg.capture_cb = nullptr;
  cfg.user_data = nullptr;
  // Note: in ESP-IDF 4.x this returns esp_err_t; in 5.x the signature changed.
  if (mcpwm_capture_enable_channel(MCPWM_UNIT_0, MCPWM_SELECT_CAP0, &cfg) != ESP_OK) {
    return false;
  }
  mcpwm_isr_register(MCPWM_UNIT_0, onCapture, nullptr, ESP_INTR_FLAG_IRAM, nullptr);
  MCPWM[MCPWM_UNIT_0]->int_ena.val |= BIT(27);
  return true;
}

static bool g_capture_ready = false;

static scope::Measurement measureWithCapture() {
  scope::Measurement m;
  if (!g_capture_ready) return m;

  // Clear and arm.
  g_cap_head = 0;
  g_cap_count = 0;
  g_cap_overflow = false;

  // Wait for edges without blocking the network for long: service the servers
  // while polling. delay(5) here would stop the page updating at 20 Hz.
  const uint32_t start = millis();
  while (g_cap_count < scope::kMaxEdges && (millis() - start) < 20) {
    server.handleClient();
    webSocket.loop();
    delay(1);
  }

  scope::EdgeBurst burst;
  const uint8_t n = g_cap_count;
  burst.count = (n > scope::kMaxEdges) ? scope::kMaxEdges : n;
  for (uint8_t i = 0; i < burst.count; ++i) {
    burst.ns[i] = g_cap_ring[i];
  }
  burst.capture_overflow = g_cap_overflow;

  // Both edges are captured, so periods span two intervals.
  return scope::estimateFromEdges(burst, /*rising_only=*/false);
}
#endif  // SCOPE_NO_CAPTURE

// ===========================================================================
// Measurement dispatch
// ===========================================================================
// Store a finished measurement and refresh the cached display strings. The
// strings are produced by the same scope_core formatters the host tests exercise,
// so the serial log and the browser cannot disagree.
static void publishMeasurement(const scope::Measurement& m) {
  g_meas = m;
  if (m.valid) {
    scope::formatFrequency(m.freq_mhz, g_freq_text, sizeof(g_freq_text));
    scope::formatDuration(m.period_ns, g_period_text, sizeof(g_period_text));
    scope::formatDuration(m.high_ns, g_high_text, sizeof(g_high_text));
    scope::formatDuration(m.low_ns, g_low_text, sizeof(g_low_text));
  } else {
    strcpy(g_freq_text, "---");
    strcpy(g_period_text, "---");
    strcpy(g_high_text, "---");
    strcpy(g_low_text, "---");
  }
}

static void refreshMeasurement() {
  scope::Measurement m;

  switch (g_state.method) {
    case Method::kPcnt: {
      // The gate is asynchronous, so most iterations have nothing new. When a
      // gate does complete, enrich it with duty data from RMT, because PCNT alone
      // cannot measure duty: it only counts edges.
      scope::Measurement counted;
      if (servicePcnt(&counted) && counted.valid) {
        const scope::Measurement widths = measureWithRmt();
        if (widths.valid) {
          counted.high_ns = widths.high_ns;
          counted.low_ns = widths.low_ns;
          counted.duty_permille = widths.duty_permille;
        }
        publishMeasurement(counted);
        return;
      }
      // Re-arm immediately so the gate runs continuously rather than leaving a
      // dead gap between acquisitions.
      if (!g_pcnt_armed) startPcntGate();
      return;  // keep the previous reading on screen
    }

    case Method::kRmt:
      m = measureWithRmt();
      break;

    case Method::kCapture:
#ifndef SCOPE_NO_CAPTURE
      m = measureWithCapture();
#else
      m = scope::Measurement{};
#endif
      break;
  }

  publishMeasurement(m);
}

// ===========================================================================
// WebSocket command handling
// ===========================================================================
static int clampInt(int v, int lo, int hi) { return v < lo ? lo : (v > hi ? hi : v); }

static void handleCommand(const char* cmd, JsonObjectConst doc) {
  if (strcmp(cmd, "run") == 0) {
    g_state.running = true;
    g_state.single_shot = false;
    return;
  }
  if (strcmp(cmd, "stop") == 0) {
    g_state.running = false;
    return;
  }
  if (strcmp(cmd, "single") == 0) {
    g_state.running = true;
    g_state.single_shot = true;
    g_state.single_done = false;
    return;
  }
  if (strcmp(cmd, "setMethod") == 0) {
    // Reject the capture method if the hardware path is not compiled in, rather
    // than silently showing a stale reading.
#ifndef SCOPE_NO_CAPTURE
    g_state.method = static_cast<Method>(clampInt(doc["value"] | 0, 0, 2));
#else
    g_state.method = static_cast<Method>(clampInt(doc["value"] | 0, 0, 1));
#endif
    return;
  }
  if (strcmp(cmd, "setXOffset") == 0) {
    g_state.x_offset_pct = static_cast<int16_t>(clampInt(doc["value"] | 0, -100, 100));
    return;
  }
  if (strcmp(cmd, "setYOffset") == 0) {
    g_state.y_offset_pct = static_cast<int16_t>(clampInt(doc["value"] | 50, 0, 100));
    return;
  }
  if (strcmp(cmd, "setXZoom") == 0) {
    g_state.x_zoom_x10 = static_cast<uint16_t>(clampInt(doc["value"] | 10, 10, 200));
    return;
  }
  if (strcmp(cmd, "setYZoom") == 0) {
    g_state.y_zoom_x10 = static_cast<uint16_t>(clampInt(doc["value"] | 10, 10, 100));
    return;
  }
  if (strcmp(cmd, "setVScale") == 0) {
    g_state.v_per_div_idx = static_cast<uint8_t>(clampInt(doc["value"] | 2, 0, 5));
    return;
  }
  if (strcmp(cmd, "setTB") == 0) {
    g_state.timebase_idx = static_cast<uint8_t>(clampInt(doc["value"] | 5, 0, 13));
    return;
  }
  if (strcmp(cmd, "setTrigger") == 0) {
    g_state.trigger_mv = static_cast<uint16_t>(clampInt(doc["level_mv"] | 1650, 0, 3300));
    g_state.trigger_edge = (doc["edge"] | 1) < 0 ? -1 : 1;
    g_state.trigger_mode = static_cast<uint8_t>(clampInt(doc["mode"] | 0, 0, 2));
    return;
  }
  if (strcmp(cmd, "setBWLimit") == 0) {
    g_state.bw_limit = doc["enabled"] | false;
    g_state.bw_size = static_cast<uint8_t>(clampInt(doc["size"] | 4, 1, 16));
    return;
  }
  if (strcmp(cmd, "setCursor") == 0) {
    g_state.cursors = doc["enabled"] | false;
    g_state.cursor1_pct = static_cast<uint8_t>(clampInt(doc["c1"] | 25, 0, 100));
    g_state.cursor2_pct = static_cast<uint8_t>(clampInt(doc["c2"] | 75, 0, 100));
    return;
  }
  if (strcmp(cmd, "setFFT") == 0) {
    g_state.fft = doc["enabled"] | false;
    return;
  }
}

static void onWebSocketEvent(uint8_t num, WStype_t type, uint8_t* payload, size_t length) {
  if (type != WStype_TEXT) return;

  StaticJsonDocument<384> doc;
  if (deserializeJson(doc, payload, length) != DeserializationError::Ok) return;

  const char* cmd = doc["cmd"] | "";
  if (cmd[0] == '\0') return;
  handleCommand(cmd, doc.as<JsonObjectConst>());
}

// ===========================================================================
// Data frame
// ===========================================================================
static void sendFrame() {
  // 1024 points at ~7 chars each is ~7 KB, so the document must be bigger than
  // the original sketch's 4 KB (which would have silently truncated).
  DynamicJsonDocument doc(12288);

  doc["cmd"] = "data";
  doc["method"] = static_cast<uint8_t>(g_state.method);
  doc["valid"] = g_meas.valid;

  JsonObject m = doc.createNestedObject("meas");
  m["freq_mhz"] = g_meas.freq_mhz;
  m["period_ns"] = g_meas.period_ns;
  m["high_ns"] = g_meas.high_ns;
  m["low_ns"] = g_meas.low_ns;
  m["duty_permille"] = g_meas.duty_permille;
  m["edges"] = g_meas.edges;
  m["freq_text"] = g_freq_text;
  m["period_text"] = g_period_text;
  m["high_text"] = g_high_text;
  m["low_text"] = g_low_text;

  JsonObject s = doc.createNestedObject("state");
  s["running"] = g_state.running;
  s["method"] = static_cast<uint8_t>(g_state.method);
  s["x_offset_pct"] = g_state.x_offset_pct;
  s["y_offset_pct"] = g_state.y_offset_pct;
  s["x_zoom_x10"] = g_state.x_zoom_x10;
  s["y_zoom_x10"] = g_state.y_zoom_x10;
  s["v_per_div_idx"] = g_state.v_per_div_idx;
  s["timebase_idx"] = g_state.timebase_idx;
  s["trigger_mv"] = g_state.trigger_mv;
  s["trigger_edge"] = g_state.trigger_edge;
  s["trigger_mode"] = g_state.trigger_mode;
  s["bw_limit"] = g_state.bw_limit;
  s["bw_size"] = g_state.bw_size;
  s["cursors"] = g_state.cursors;
  s["cursor1_pct"] = g_state.cursor1_pct;
  s["cursor2_pct"] = g_state.cursor2_pct;
  s["fft"] = g_state.fft;

  String out;
  out.reserve(512);
  serializeJson(doc, out);
  webSocket.broadcastTXT(out);

  // Single-shot: one frame, then stop and disarm.
  if (g_state.single_shot && !g_state.single_done) {
    g_state.single_done = true;
    g_state.running = false;
    g_state.single_shot = false;
  }
}

// ===========================================================================
// HTTP
// ===========================================================================
extern const char kIndexHtml[] PROGMEM;  // defined in web_ui.h

static void handleRoot() {
  server.send_P(200, "text/html; charset=utf-8", kIndexHtml);
}

static void handleStatus() {
  StaticJsonDocument<256> doc;
  doc["ok"] = true;
  doc["method"] = static_cast<uint8_t>(g_state.method);
  doc["valid"] = g_meas.valid;
  doc["capture_available"] =
#ifndef SCOPE_NO_CAPTURE
      g_capture_ready;
#else
      false;
#endif
  String out;
  serializeJson(doc, out);
  server.send(200, "application/json", out);
}

// ===========================================================================
// Setup / loop
// ===========================================================================
static void connectWifi() {
  if (kUseStaticIp) {
    WiFi.config(kStaticIp, kGateway, kSubnet);
  }
  WiFi.mode(WIFI_STA);
  WiFi.setSleep(false);  // WiFi sleep adds hundreds of ms of latency to the UI
  WiFi.begin(kWifiSsid, kWifiPass);

  Serial.printf("Connecting to \"%s\"", kWifiSsid);
  const uint32_t deadline = millis() + 20000;
  while (WiFi.status() != WL_CONNECTED && millis() < deadline) {
    delay(500);
    Serial.print('.');
  }
  Serial.println();

  if (WiFi.status() == WL_CONNECTED) {
    Serial.print("Connected. Dashboard: http://");
    Serial.println(WiFi.localIP());
  } else {
    // Fall back to an access point so the device is always reachable.
    WiFi.mode(WIFI_AP);
    WiFi.softAP("ESP32-Scope", "scope12345");
    Serial.print("AP fallback. Dashboard: http://");
    Serial.println(WiFi.softAPIP());
  }
}

void setup() {
  Serial.begin(115200);
  delay(100);
  Serial.println("\nESP32 web scope starting");

  setupPcnt();
  setupRmt();
#ifndef SCOPE_NO_CAPTURE
  g_capture_ready = setupCapture();
  if (!g_capture_ready) {
    Serial.println("MCPWM capture unavailable; the capture method will report ---");
  }
#endif

  connectWifi();

  server.on("/", handleRoot);
  server.on("/api/status", handleStatus);
  server.onNotFound([]() { server.send(404, "text/plain", "not found"); });
  server.begin();

  webSocket.begin();
  webSocket.onEvent(onWebSocketEvent);

  Serial.println("Ready.");
}

void loop() {
  server.handleClient();
  webSocket.loop();

  static uint32_t last_frame = 0;
  static uint32_t last_log = 0;

  if (!g_state.running) return;

  // The measurement path is serviced every iteration, because the PCNT gate spans
  // many loop passes and must be sampled promptly for its duration to be
  // accurate. Frames are only *sent* on the slower timer below.
  refreshMeasurement();

  const uint32_t now = millis();
  if (now - last_frame < kSendIntervalMs) return;
  last_frame = now;

  if (webSocket.connectedClients() > 0) {
    sendFrame();
  }

  if (now - last_log > 2000) {
    last_log = now;
    Serial.printf("[%s] %s | duty %.1f%% | edges %u | clients %u\n",
                  g_state.method == Method::kPcnt
                      ? "PCNT"
                      : (g_state.method == Method::kRmt ? "RMT" : "CAP"),
                  g_freq_text, g_meas.duty_permille / 10.0, g_meas.edges,
                  static_cast<unsigned>(webSocket.connectedClients()));
  }
}
