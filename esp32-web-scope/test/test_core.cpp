// ---------------------------------------------------------------------------
// Host-side unit tests for scope_core.
//
// Build and run:
//     g++ -std=c++17 -O2 -Wall -Wextra -o test_core test/test_core.cpp \
//         firmware/esp32_web_scope/scope_core.cpp && ./test_core
//
// Or simply:  make test
//
// No test framework: a tiny assert harness keeps the build dependency-free, which
// matters because this must compile on any machine with a C++ compiler.
// ---------------------------------------------------------------------------

#include "../firmware/esp32_web_scope/scope_core.h"

#include <cmath>
#include <cstdio>
#include <cstring>

using namespace scope;

static int g_failures = 0;
static int g_checks = 0;

#define CHECK(cond)                                                        \
  do {                                                                     \
    ++g_checks;                                                            \
    if (!(cond)) {                                                         \
      std::printf("  FAIL %s:%d  %s\n", __FILE__, __LINE__, #cond);        \
      ++g_failures;                                                        \
    }                                                                      \
  } while (0)

#define CHECK_NEAR(a, b, tol)                                              \
  do {                                                                     \
    ++g_checks;                                                            \
    const double _a = (a), _b = (b);                                       \
    if (std::fabs(_a - _b) > (tol)) {                                      \
      std::printf("  FAIL %s:%d  %s=%.6f != %s=%.6f (tol %g)\n", __FILE__, \
                  __LINE__, #a, _a, #b, _b, (double)(tol));                \
      ++g_failures;                                                        \
    }                                                                      \
  } while (0)

#define CHECK_STR(a, b)                                                    \
  do {                                                                     \
    ++g_checks;                                                            \
    if (std::strcmp((a), (b)) != 0) {                                       \
      std::printf("  FAIL %s:%d  \"%s\" != \"%s\"\n", __FILE__, __LINE__,   \
                  (a), (b));                                               \
      ++g_failures;                                                        \
    }                                                                      \
  } while (0)

static void section(const char* name) { std::printf("\n%s\n", name); }

// ---------------------------------------------------------------------------
static void test_conversions() {
  section("period <-> frequency conversions");

  // 1 MHz == 1000 ns period
  CHECK(periodNsToMilliHz(1000) == 1000000000LL);   // 1e9 mHz
  CHECK(milliHzToPeriodNs(1000000000LL) == 1000);

  // 1 kHz == 1 ms period
  CHECK(periodNsToMilliHz(1000000) == 1000000LL);   // 1e6 mHz
  CHECK(milliHzToPeriodNs(1000000LL) == 1000000);

  // 1 Hz == 1 s
  CHECK(periodNsToMilliHz(1000000000ULL) == 1000);
  CHECK(milliHzToPeriodNs(1000) == 1000000000ULL);

  // Degenerate inputs must not divide by zero.
  CHECK(periodNsToMilliHz(0) == 0);
  CHECK(milliHzToPeriodNs(0) == 0);
  CHECK(milliHzToPeriodNs(-5) == 0);

  // Round-trip across a decade spread.
  const uint64_t periods[] = {100, 500, 1000, 2000, 50000, 1000000, 1000000000ULL};
  for (uint64_t p : periods) {
    const MilliHz f = periodNsToMilliHz(p);
    CHECK(f > 0);
    // Allow 1 ns of integer rounding.
    const uint64_t back = milliHzToPeriodNs(f);
    CHECK(back + 2 >= p && back <= p + 2);
  }
}

// ---------------------------------------------------------------------------
static void test_edges_1mhz_rising() {
  section("edge estimation: 1 MHz square, rising edges only");

  // 1 MHz -> one rising edge every 1000 ns.
  EdgeBurst b;
  b.count = 8;
  for (size_t i = 0; i < b.count; ++i) {
    b.ns[i] = static_cast<uint32_t>(i * 1000);
  }

  const Measurement m = estimateFromEdges(b, /*rising_only=*/true);
  CHECK(m.valid);
  CHECK(m.period_ns == 1000);
  CHECK(m.freq_mhz == 1000000000LL);   // exactly 1 MHz
  CHECK(m.edges == 8);
}

static void test_edges_duty() {
  section("edge estimation: 25 % duty from alternating edges");

  // Period 1000 ns, high 250 ns, low 750 ns. Timestamps for
  // rise(0) fall(250) rise(1000) fall(1250) ...
  EdgeBurst b;
  b.count = 8;
  b.ns[0] = 0;
  b.ns[1] = 250;
  b.ns[2] = 1000;
  b.ns[3] = 1250;
  b.ns[4] = 2000;
  b.ns[5] = 2250;
  b.ns[6] = 3000;
  b.ns[7] = 3250;

  const Measurement m = estimateFromEdges(b, /*rising_only=*/false);
  CHECK(m.valid);
  // Individual intervals are 250 and 750; the median is 750, doubled = 1500,
  // which is wrong for this input because the intervals alternate levels.
  // The estimator must therefore derive periods from like-level pairs.
  CHECK(m.period_ns == 1000);
  CHECK(m.high_ns == 250);
  CHECK(m.low_ns == 750);
  CHECK(m.duty_permille == 250);
}

static void test_edges_wrap() {
  section("edge estimation: uint32 timestamp wrap is handled");

  // Timestamps straddle the 2^32 ns wrap point.
  // Period 1000 ns; edges at 0xFFFFFF00, 0xFFFFFE68? Use a clean set:
  const uint32_t start = 0xFFFFF000u;  // ~4294.9 ms
  EdgeBurst b;
  b.count = 6;
  for (size_t i = 0; i < b.count; ++i) {
    b.ns[i] = start + static_cast<uint32_t>(i * 1000);  // wraps naturally
  }

  const Measurement m = estimateFromEdges(b, true);
  CHECK(m.valid);
  CHECK(m.period_ns == 1000);
  CHECK(m.freq_mhz == 1000000000LL);
}

static void test_edges_glitches() {
  section("edge estimation: sub-20 ns glitches are rejected");

  // 1 MHz signal, but a 5 ns spike between two real edges.
  EdgeBurst b;
  b.count = 6;
  b.ns[0] = 0;
  b.ns[1] = 5;      // glitch: too close
  b.ns[2] = 1000;
  b.ns[3] = 2000;
  b.ns[4] = 3000;
  b.ns[5] = 4000;

  const Measurement m = estimateFromEdges(b, true);
  CHECK(m.valid);
  CHECK(m.period_ns == 1000);
}

static void test_edges_insufficient() {
  section("edge estimation: degenerate inputs");

  EdgeBurst empty;
  CHECK(!estimateFromEdges(empty, true).valid);

  EdgeBurst one;
  one.count = 1;
  one.ns[0] = 0;
  CHECK(!estimateFromEdges(one, true).valid);

  // A hardware overflow must invalidate the whole burst.
  EdgeBurst overflowed;
  overflowed.count = 8;
  for (size_t i = 0; i < 8; ++i) overflowed.ns[i] = static_cast<uint32_t>(i * 1000);
  overflowed.capture_overflow = true;
  CHECK(!estimateFromEdges(overflowed, true).valid);
}

static void test_edges_outlier() {
  section("edge estimation: one missed edge does not halve the result");

  // 1 MHz with one interval doubled (a missed capture).
  EdgeBurst b;
  b.count = 9;
  uint32_t t = 0;
  for (size_t i = 0; i < b.count; ++i) {
    // Interval 3 is 2000 ns (missed edge), the rest are 1000 ns.
    const uint32_t step = (i == 3) ? 2000 : 1000;
    t += step;
    b.ns[i] = t;
  }

  const Measurement m = estimateFromEdges(b, true);
  CHECK(m.valid);
  // The median rejects the single outlier.
  CHECK(m.period_ns == 1000);
}

// ---------------------------------------------------------------------------
static void test_count_gate() {
  section("gate-based frequency from pulse count");

  // 1 MHz over a 100 ms gate == 100,000 pulses.
  CHECK(frequencyFromCount(100000, 100000000ULL) == 1000000000LL);

  // 1 kHz over 1 s == 1000 pulses.
  CHECK(frequencyFromCount(1000, 1000000000ULL) == 1000000LL);

  // Zero gate must not divide by zero.
  CHECK(frequencyFromCount(123, 0) == 0);

  // Zero pulses is a valid "0 Hz" measurement, not an error.
  CHECK(frequencyFromCount(0, 100000000ULL) == 0);
}

// ---------------------------------------------------------------------------
static void test_pulses_1mhz() {
  section("RMT pulse analysis: 1 MHz square at 12.5 ns/tick");

  // At 80 MHz with divider 1, one tick = 12.5 ns. A 500 ns half-period is 40
  // ticks -- exactly representable, which is why the divider must be 1.
  const uint32_t ns_per_tick = 12;  // integer approximation for the API
  (void)ns_per_tick;

  PulseRun runs[8];
  for (int i = 0; i < 8; ++i) {
    runs[i].ticks = 40;             // 40 ticks * 12.5 ns = 500 ns
    runs[i].level = (i % 2) == 0;   // high, low, high, low ...
  }

  // The tick is 12.5 ns = 125 tenths, passed exactly. Getting this wrong (by
  // passing 12, i.e. 12.0 ns) gives 480 ns per half period -> 960 ns -> 1.042 MHz,
  // a 4.2 % frequency error. This test therefore pins the exact value.
  const Measurement m = analysePulses(runs, 8, 125, 20);
  CHECK(m.valid);
  CHECK(m.period_ns == 1000);
  CHECK(m.high_ns == 500);
  CHECK(m.low_ns == 500);
  CHECK(m.duty_permille == 500);
  CHECK(m.freq_mhz == 1000000000LL);   // exactly 1 MHz, no error
}

static void test_pulses_tick_truncation() {
  section("RMT pulse analysis: truncating 12.5 ns to 12 ns is a 4.2 % error");

  // This is a regression test for a real bug. The first implementation passed
  // the tick length as an integer nanosecond count, so 12.5 ns became 12 ns.
  // A 1 MHz square (40 ticks per half period) then measured 960 ns instead of
  // 1000 ns, reporting 1.042 MHz -- a 4.2 % error, invisible on a bench unless
  // you compare against a reference.
  PulseRun runs[8];
  for (int i = 0; i < 8; ++i) {
    runs[i].ticks = 40;
    runs[i].level = (i % 2) == 0;
  }

  const Measurement truncated = analysePulses(runs, 8, 120, 20);   // 12.0 ns/tick
  const Measurement exact = analysePulses(runs, 8, 125, 20);       // 12.5 ns/tick

  CHECK(truncated.period_ns == 960);
  CHECK(truncated.freq_mhz == 1041666666LL);   // 1.041666... MHz
  CHECK(exact.period_ns == 1000);
  CHECK(exact.freq_mhz == 1000000000LL);

  // The whole reason for tenths: the truncated form is wrong by more than 4 %.
  // Truncating the tick makes each interval look SHORTER, so the reported
  // frequency comes out HIGHER, not lower -- hence the absolute difference.
  const MilliHz diff = exact.freq_mhz - truncated.freq_mhz;
  CHECK(diff < 0);                          // truncated reads high
  const MilliHz magnitude = -diff;
  CHECK(magnitude > exact.freq_mhz / 25);   // > 4 % of 1 MHz
  CHECK(magnitude < exact.freq_mhz / 20);   // < 5 % of 1 MHz
}

static void test_pulses_divider_bug() {
  section("RMT pulse analysis: divider 80 destroys a 1 MHz measurement");

  // With clk_div = 80 a tick is 1000 ns. A 500 ns half-period is 0.5 ticks,
  // which the hardware records as 0 or 1. Simulate the zero case.
  PulseRun runs[4];
  for (int i = 0; i < 4; ++i) {
    runs[i].ticks = (i % 2 == 0) ? 1 : 0;  // quantised: 1 tick high, 0 low
    runs[i].level = (i % 2) == 0;
  }
  const Measurement m = analysePulses(runs, 4, 10000, 20);  // 1000 ns tick
  // All low runs are zero ticks and get skipped, so there is no low time at all.
  CHECK(!m.valid);
}

static void test_pulses_glitch_filter() {
  section("RMT pulse analysis: glitch shorter than the filter is dropped");

  PulseRun runs[4];
  runs[0].ticks = 40; runs[0].level = true;    // 500 ns high
  runs[1].ticks = 1;  runs[1].level = false;   // 12 ns glitch - filtered
  runs[2].ticks = 40; runs[2].level = false;   // 500 ns low
  runs[3].ticks = 40; runs[3].level = true;

  const Measurement m = analysePulses(runs, 4, 125, 100);
  CHECK(m.valid);
  CHECK(m.high_ns == 500);
  CHECK(m.low_ns == 500);
}

static void test_pulses_degenerate() {
  section("RMT pulse analysis: degenerate inputs");

  PulseRun runs[2] = {{40, true}, {40, false}};
  CHECK(!analysePulses(nullptr, 4, 125, 20).valid);
  CHECK(!analysePulses(runs, 1, 125, 20).valid);   // needs >= 2
  CHECK(!analysePulses(runs, 2, 0, 20).valid);    // zero tick length
}

// ---------------------------------------------------------------------------
static void test_formatting() {
  section("human-readable formatting");

  char buf[32];

  formatFrequency(1000000000LL, buf, sizeof(buf));   // 1 MHz
  CHECK_STR(buf, "1.000 MHz");

  formatFrequency(12340000LL, buf, sizeof(buf));     // 12.34 kHz
  CHECK_STR(buf, "12.340 kHz");

  formatFrequency(9876, buf, sizeof(buf));           // 9.876 Hz
  CHECK_STR(buf, "9.876 Hz");

  formatFrequency(0, buf, sizeof(buf));
  CHECK_STR(buf, "---");

  formatDuration(1000, buf, sizeof(buf));
  CHECK_STR(buf, "1.000 us");

  formatDuration(500, buf, sizeof(buf));
  CHECK_STR(buf, "500 ns");

  formatDuration(12000000, buf, sizeof(buf));
  CHECK_STR(buf, "12.000 ms");

  formatDuration(0, buf, sizeof(buf));
  CHECK_STR(buf, "---");

  formatVoltage(1650, buf, sizeof(buf));
  CHECK_STR(buf, "1.650 V");

  formatVoltage(825, buf, sizeof(buf));
  CHECK_STR(buf, "825.0 mV");

  // No buffer overrun with a tiny buffer.
  char tiny[6];
  formatFrequency(1000000000LL, tiny, sizeof(tiny));
  CHECK(std::strlen(tiny) < sizeof(tiny));
}

// ---------------------------------------------------------------------------
static void test_nyquist_documentation() {
  section("RMT divider adapts so a period fits the 15-bit duration field");

  // 1 MHz: 1000 ns / 12 ns = 83 ticks, comfortably inside the field, so the
  // divider stays at 1 and full 12.5 ns resolution is preserved.
  CHECK(scope::rmtDividerForPeriod(1000, 125) == 1);
  CHECK(scope::rmtDividerForPeriod(100, 125) == 1);

  // 100 Hz: 10 000 000 ns / 12 ns = 833 333 ticks, way past 32767. The divider
  // must scale up enough that 10 ms fits in 20 000 ticks.
  {
    const uint8_t d = scope::rmtDividerForPeriod(10000000, 125);
    CHECK(d > 1);
    const uint64_t ticks = (10000000ull * 10ull) / (125ull * d);
    CHECK(ticks <= 20000);
    CHECK(ticks > 10000);  // and not wastefully coarse
  }

  // 1 Hz: 1 s period. Even at divider 255 the tick is 3.06 us, so 1 s is 326 000
  // ticks and still overflows. The divider saturates and the caller must fall
  // back to the capture method; assert the saturation rather than pretend it works.
  {
    const uint8_t d = scope::rmtDividerForPeriod(1000000000u, 125);
    CHECK(d == 255);
    const uint64_t ticks = (1000000000ull * 10ull) / (125ull * d);
    CHECK(ticks > 32767);  // documents that RMT cannot do 1 Hz
  }

  // Degenerate inputs must not divide by zero.
  CHECK(scope::rmtDividerForPeriod(0, 125) == 1);
  CHECK(scope::rmtDividerForPeriod(1000, 0) == 1);

  section("ADC feasibility (documents why the ADC path cannot reach 1 MHz)");

  // The ESP32 ADC's sample-and-hold limits usable analog bandwidth to roughly
  // 6-8 kHz even when the digital sample rate is high. Assert the arithmetic
  // behind the claim so the docs and the code cannot drift apart.
  const double max_adc_bandwidth_hz = 8000.0;
  const double target_hz = 1e6;
  CHECK(target_hz / max_adc_bandwidth_hz > 100.0);  // >100x short

  // adc1_get_raw() loop throughput ~100 kS/s -> 50 kHz Nyquist.
  const double poll_sps = 100000.0;
  const double nyquist = poll_sps / 2.0;
  CHECK(nyquist < target_hz);
  CHECK_NEAR(nyquist, 50000.0, 1.0);
}

// ---------------------------------------------------------------------------
int main() {
  std::printf("scope_core unit tests\n=====================\n");

  test_conversions();
  test_edges_1mhz_rising();
  test_edges_duty();
  test_edges_wrap();
  test_edges_glitches();
  test_edges_insufficient();
  test_edges_outlier();
  test_count_gate();
  test_pulses_1mhz();
  test_pulses_tick_truncation();
  test_pulses_divider_bug();
  test_pulses_glitch_filter();
  test_pulses_degenerate();
  test_formatting();
  test_nyquist_documentation();

  std::printf("\n=====================\n%d checks, %d failure(s)\n", g_checks,
              g_failures);
  return g_failures == 0 ? 0 : 1;
}
