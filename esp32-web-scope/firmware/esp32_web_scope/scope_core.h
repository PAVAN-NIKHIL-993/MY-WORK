// ---------------------------------------------------------------------------
// scope_core.h - portable measurement algorithms for the ESP32 web scope.
//
// Deliberately free of Arduino, ESP-IDF and WiFi headers so the same code can be
// compiled and unit-tested on a host (see test/test_core.cpp). Anything that
// touches hardware lives in esp32_web_scope.ino instead.
// ---------------------------------------------------------------------------
#pragma once

#include <cstddef>
#include <cstdint>

namespace scope {

// ---------------------------------------------------------------------------
// Fixed-point helpers
//
// The ESP32 has no hardware double-precision FPU; `double` is emulated and slow.
// All hot-path maths therefore uses int32/int64 or float, never double.
// ---------------------------------------------------------------------------

// A frequency measured as a 32.32 fixed-point value would overflow at 4 GHz, so
// frequency is carried as an integer number of millihertz (mHz) in an int64.
// 1 MHz = 1e9 mHz, which is safely inside int64.
using MilliHz = int64_t;

inline constexpr MilliHz kMilliHzPerHz = 1000;

// Convert a period in nanoseconds to a frequency in mHz.
// Returns 0 for a non-positive period.
MilliHz periodNsToMilliHz(uint64_t period_ns);

// Convert a frequency in mHz to a period in nanoseconds.
// Returns 0 for a non-positive frequency.
uint64_t milliHzToPeriodNs(MilliHz f);

// ---------------------------------------------------------------------------
// Measurement result
// ---------------------------------------------------------------------------

struct Measurement {
  bool valid = false;         // false when nothing measurable was detected
  MilliHz freq_mhz = 0;       // frequency in millihertz
  uint32_t period_ns = 0;     // period in nanoseconds
  uint32_t high_ns = 0;       // high time in nanoseconds
  uint32_t low_ns = 0;        // low time in nanoseconds
  // Per-mille needs 10 bits (0..1000), so uint8_t would wrap 500 -> 244.
  // The unit test caught exactly that; do not narrow this back to uint8_t.
  uint16_t duty_permille = 0;  // duty cycle, per mille (0..1000)
  uint32_t edges = 0;         // edges observed (diagnostic)
  bool overflow = false;      // period exceeded the counter range
};

// ---------------------------------------------------------------------------
// Edge-timestamp frequency estimation
//
// This is the algorithm behind the MCPWM capture path. It is *real*
// measurement: the caller supplies timestamps of actual edges, and the result is
// computed from them. No synthetic waveform is ever produced.
//
// Design notes:
//  * Only complete periods are measured (first edge to last edge), never a
//    partial one, so the count is an integer number of cycles.
//  * Timestamps are uint32 nanoseconds, so they wrap every ~4.29 s. Wrapping is
//    handled explicitly rather than ignored.
//  * A single outlier (a missed edge) would halve or double the estimate, so the
//    caller is expected to feed a burst and the median-ish estimate is used.
// ---------------------------------------------------------------------------

// Maximum number of edge timestamps one burst can carry.
inline constexpr size_t kMaxEdges = 64;

struct EdgeBurst {
  uint32_t ns[kMaxEdges] = {};  // absolute timestamps, wrapping uint32
  size_t count = 0;             // number of valid entries
  bool capture_overflow = false;  // hardware buffer overflowed -> unreliable
};

// Estimate the frequency of a periodic signal from edge timestamps.
//
// `rising_only` selects how periods are derived:
//   true  - timestamps are all rising edges; a period is one full cycle.
//   false - timestamps alternate rising/falling; a period is two intervals.
Measurement estimateFromEdges(const EdgeBurst& burst, bool rising_only);

// ---------------------------------------------------------------------------
// Gate-based frequency estimation (the PCNT path)
//
// A pulse counter is read across a known gate time. The result is as accurate as
// the gate's reference, which is the APB clock (crystal-derived), not millis().
// ---------------------------------------------------------------------------

// Compute frequency from a pulse count over a gate of `gate_ns` nanoseconds.
// Returns 0 if the gate is zero.
MilliHz frequencyFromCount(uint64_t pulses, uint64_t gate_ns);

// Choose an RMT clock divider so that one full period fits inside the 15-bit
// duration field (32767 ticks), leaving headroom.
//
// `base_tenths_ns` is the tick length at divider 1 expressed in TENTHS of a
// nanosecond, so 12.5 ns is passed as 125. Integers of nanoseconds cannot
// represent it: rounding to 12 ns is a 4.2 % error at 1 MHz, which would defeat
// the entire point of using divider 1. Tenths are exact for every divider that
// matters here (12.5, 25, 50, 100... ns).
//
// This is in the core because getting it wrong is invisible on the bench: with a
// fixed divider of 1, a 100 Hz signal (10 ms period) overflows the field and the
// instrument reports a plausible-looking but wrong number.
uint8_t rmtDividerForPeriod(uint32_t period_ns, uint32_t base_tenths_ns);

// ---------------------------------------------------------------------------
// RMT pulse-train analysis
//
// RMT yields a sequence of durations, each tagged with its level. At 80 MHz and
// clock divider 1 a tick is 12.5 ns, which resolves a 1 MHz square wave's 500 ns
// half-period exactly (40 ticks). At clock divider 80 a tick is 1 us and a 500 ns
// half-period quantises to zero - the bug in the original sketch.
// ---------------------------------------------------------------------------

struct PulseRun {
  uint32_t ticks = 0;
  bool level = false;
};

// Analyse a run of pulses. `ticks_to_ns` converts one RMT tick to nanoseconds.
// Returns a Measurement with freq/period/high/low/duty filled in.
//
// Pulses shorter than `min_pulse_ns` are treated as glitches and skipped, which
// is what a hardware filter does without the cost of extra registers.
// `tenths_ns_per_tick` is the tick length in tenths of a nanosecond (12.5 ns = 125).
Measurement analysePulses(const PulseRun* runs, size_t count, uint32_t tenths_ns_per_tick,
                          uint32_t min_pulse_ns);

// ---------------------------------------------------------------------------
// Formatting
//
// Kept in the core so the number formatting rules are unit-tested rather than
// reimplemented (and getting exponent boundaries wrong) in JavaScript.
// ---------------------------------------------------------------------------

// Write a frequency as a human string, e.g. "1.000 MHz", "12.34 kHz", "9.876 Hz".
// Always null-terminates. `buf_size` includes the terminator.
void formatFrequency(MilliHz f, char* out, size_t buf_size);

// Write a duration as a human string, e.g. "1.000 us", "500.0 ns", "12.00 ms".
void formatDuration(uint64_t ns, char* out, size_t buf_size);

// Write a voltage in millivolts, e.g. "1.650 V", "825.0 mV".
void formatVoltage(uint32_t millivolts, char* out, size_t buf_size);

}  // namespace scope
