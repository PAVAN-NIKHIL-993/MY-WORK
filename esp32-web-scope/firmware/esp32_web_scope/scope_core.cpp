// ---------------------------------------------------------------------------
// scope_core.cpp - portable measurement algorithms. See scope_core.h.
// ---------------------------------------------------------------------------

#include "scope_core.h"

#include <cmath>
#include <cstdio>

namespace scope {

namespace {

// Median of up to kMaxEdges samples, without heap allocation or sorting the
// caller's array (insertion sort into a local copy; the burst is small).
uint64_t medianPeriod(uint64_t* values, size_t count) {
  for (size_t i = 1; i < count; ++i) {
    const uint64_t key = values[i];
    size_t j = i;
    while (j > 0 && values[j - 1] > key) {
      values[j] = values[j - 1];
      --j;
    }
    values[j] = key;
  }
  if (count == 0) return 0;
  return values[count / 2];
}

}  // namespace

// Scaling derivation (this is the one place it is easy to be wrong by 1000x):
//
//   f[Hz] = 1e9 / period_ns
//   f[mHz] = f[Hz] * 1000 = 1e12 / period_ns
//
// So the numerator is 1e12, NOT 1e15. (1e15 / 1000 ns = 1e12 mHz = 1 GHz, which
// is what the first version of this function returned; the unit tests caught it.)
//
// 1e12 fits comfortably in int64 (max ~9.2e18), so no intermediate overflow.
namespace {
constexpr int64_t kNsPerSecondScaledToMilliHz = 1000000000000LL;  // 1e12
}  // namespace

MilliHz periodNsToMilliHz(uint64_t period_ns) {
  if (period_ns == 0) return 0;
  return static_cast<MilliHz>(kNsPerSecondScaledToMilliHz /
                              static_cast<int64_t>(period_ns));
}

uint8_t rmtDividerForPeriod(uint32_t period_ns, uint32_t base_tenths_ns) {
  if (period_ns == 0 || base_tenths_ns == 0) return 1;
  // Target at most kRmtMaxTicks ticks per period, so a full period and its two
  // halves all fit with headroom under the 32767 hardware maximum.
  constexpr uint32_t kRmtMaxTicks = 20000;
  // Work in tenths of a nanosecond: period_ns * 10 / base_tenths_ns.
  // 64-bit throughout, because period_ns can be 1e9 (so *10 is 1e10).
  const uint64_t need =
      (static_cast<uint64_t>(period_ns) * 10u) / base_tenths_ns;
  uint64_t div = (need + kRmtMaxTicks - 1) / kRmtMaxTicks;  // ceiling
  if (div < 1) div = 1;
  if (div > 255) div = 255;
  return static_cast<uint8_t>(div);
}

uint64_t milliHzToPeriodNs(MilliHz f) {
  if (f <= 0) return 0;
  return static_cast<uint64_t>(kNsPerSecondScaledToMilliHz / f);
}

Measurement estimateFromEdges(const EdgeBurst& burst, bool rising_only) {
  Measurement m;

  if (burst.capture_overflow) return m;  // unreliable; caller must retry
  if (burst.count < 2) return m;

  // Shortest acceptable period: 20 ns. A 1 MHz square has a 500 ns half-period,
  // so anything under 20 ns is a glitch or a double-trigger, not a real edge.
  constexpr uint32_t kMinPeriodNs = 20;
  // Longest acceptable period: 1 s (1 Hz). Below that we call it "no signal".
  constexpr uint32_t kMaxPeriodNs = 1000000000u;

  uint64_t periods[kMaxEdges];
  size_t n_periods = 0;

  for (size_t i = 1; i < burst.count; ++i) {
    // Unsigned subtraction handles the 32-bit timestamp wrap correctly.
    const uint32_t delta = burst.ns[i] - burst.ns[i - 1];
    if (delta < kMinPeriodNs) continue;      // glitch
    if (delta > kMaxPeriodNs) {
      m.overflow = true;
      continue;
    }
    periods[n_periods++] = delta;
  }

  if (n_periods == 0) return m;

  uint64_t period_ns;
  if (rising_only) {
    // Each interval is already one full cycle.
    period_ns = medianPeriod(periods, n_periods);
  } else {
    // Alternating edges: two consecutive intervals make one cycle, and the two
    // intervals are NOT the same length unless the duty is exactly 50 %. Taking
    // the median of all intervals and doubling it would give
    // 2*median(250, 750) = 1500 ns for a 1 us / 25 % square - wrong.
    // Sum consecutive pairs instead, which is the actual period.
    uint64_t sums[kMaxEdges];
    size_t n_sums = 0;
    for (size_t i = 0; i + 1 < n_periods; i += 2) {
      sums[n_sums++] = periods[i] + periods[i + 1];
    }
    // Fall back to a doubled interval if only one interval was usable.
    period_ns = (n_sums > 0) ? medianPeriod(sums, n_sums) : periods[0] * 2;
  }

  if (period_ns == 0) return m;

  m.period_ns = static_cast<uint32_t>(period_ns);
  m.freq_mhz = periodNsToMilliHz(period_ns);
  m.edges = static_cast<uint32_t>(burst.count);

  // High/low split: for alternating edges the two shortest medians give the
  // duty. This is only meaningful when the caller supplied both levels, so it is
  // derived from the individual intervals rather than assumed to be 50 %.
  if (!rising_only && n_periods >= 2) {
    uint64_t highs[kMaxEdges];
    size_t nh = 0;
    // Even indices are high intervals (rising edge -> falling edge).
    for (size_t i = 1; i < burst.count; i += 2) {
      const uint32_t d = burst.ns[i] - burst.ns[i - 1];
      if (d >= kMinPeriodNs && d <= kMaxPeriodNs) highs[nh++] = d;
    }
    if (nh > 0) {
      const uint64_t high = medianPeriod(highs, nh);
      m.high_ns = static_cast<uint32_t>(high);
      m.low_ns = static_cast<uint32_t>(period_ns - high);
      m.duty_permille = static_cast<uint16_t>((high * 1000) / period_ns);
    }
  }

  m.valid = m.freq_mhz > 0;
  return m;
}

MilliHz frequencyFromCount(uint64_t pulses, uint64_t gate_ns) {
  if (gate_ns == 0) return 0;
  // pulses / (gate_ns * 1e-9) Hz -> in mHz: pulses * 1e12 / gate_ns
  const uint64_t numerator = pulses * 1000000000000ULL;
  return static_cast<MilliHz>(numerator / gate_ns);
}

Measurement analysePulses(const PulseRun* runs, size_t count, uint32_t tenths_ns_per_tick,
                          uint32_t min_pulse_ns) {
  Measurement m;
  if (runs == nullptr || count < 2 || tenths_ns_per_tick == 0) return m;

  uint64_t high_total_ns = 0;
  uint64_t low_total_ns = 0;
  uint32_t high_runs = 0;
  uint32_t low_runs = 0;

  for (size_t i = 0; i < count; ++i) {
    if (runs[i].ticks == 0) continue;
    // ticks * tenths_ns_per_tick gives tenths of a nanosecond; /10 gives ns.
    // Divide at the end so 12.5 ns ticks keep their half-nanosecond.
    const uint64_t ns =
        (static_cast<uint64_t>(runs[i].ticks) * tenths_ns_per_tick) / 10u;
    if (ns < min_pulse_ns) continue;  // glitch filtered

    if (runs[i].level) {
      high_total_ns += ns;
      ++high_runs;
    } else {
      low_total_ns += ns;
      ++low_runs;
    }
    ++m.edges;
  }

  if (high_runs == 0 || low_runs == 0) return m;

  // Average high and low runs *separately*. Dividing by the run counts (not by
  // `edges`, which counts individual runs and would be 2x too large here)
  // keeps the duty ratio exact. The first version of this function divided the
  // high total by the run count but compared it against `edges`, reporting a
  // 50 % square as 24.4 %; the unit test pinned the regression.
  const uint64_t avg_high = high_total_ns / high_runs;
  const uint64_t avg_low = low_total_ns / low_runs;
  const uint64_t period = avg_high + avg_low;
  if (period == 0) return m;

  m.high_ns = static_cast<uint32_t>(avg_high);
  m.low_ns = static_cast<uint32_t>(avg_low);
  m.period_ns = static_cast<uint32_t>(period);
  m.freq_mhz = periodNsToMilliHz(period);
  m.duty_permille = static_cast<uint16_t>((avg_high * 1000) / period);
  m.valid = true;
  return m;
}

void formatFrequency(MilliHz f, char* out, size_t buf_size) {
  if (out == nullptr || buf_size == 0) return;
  if (f <= 0) {
    std::snprintf(out, buf_size, "---");
    return;
  }
  const double hz = static_cast<double>(f) / 1000.0;
  if (hz >= 1e6) {
    std::snprintf(out, buf_size, "%.3f MHz", hz / 1e6);
  } else if (hz >= 1e3) {
    std::snprintf(out, buf_size, "%.3f kHz", hz / 1e3);
  } else {
    std::snprintf(out, buf_size, "%.3f Hz", hz);
  }
}

void formatDuration(uint64_t ns, char* out, size_t buf_size) {
  if (out == nullptr || buf_size == 0) return;
  if (ns == 0) {
    std::snprintf(out, buf_size, "---");
    return;
  }
  if (ns >= 1000000ULL) {
    std::snprintf(out, buf_size, "%.3f ms", static_cast<double>(ns) / 1e6);
  } else if (ns >= 1000ULL) {
    std::snprintf(out, buf_size, "%.3f us", static_cast<double>(ns) / 1e3);
  } else {
    std::snprintf(out, buf_size, "%u ns", static_cast<unsigned>(ns));
  }
}

void formatVoltage(uint32_t millivolts, char* out, size_t buf_size) {
  if (out == nullptr || buf_size == 0) return;
  if (millivolts >= 1000) {
    std::snprintf(out, buf_size, "%.3f V", millivolts / 1000.0);
  } else {
    std::snprintf(out, buf_size, "%.1f mV", static_cast<double>(millivolts));
  }
}

}  // namespace scope
