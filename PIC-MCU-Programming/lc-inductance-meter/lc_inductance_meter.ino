/*
 * DIY LC inductance-meter prototype
 * Target: 5 V ATmega328P Arduino Uno/Nano/Pro Mini.
 *
 * D8 (ATmega328P PB0) -> 1 kOhm -> LC tank node. After the short excitation
 * pulse, the sketch makes PB0 an input with its pull-up disabled so it does
 * not clamp the tank while ringing. D5 reads the LM393 open-collector output
 * with an external 10 kOhm pull-up to +5 V.
 *
 * This is an educational, software-timed approximation, not a calibrated
 * instrument. pulseIn() timing is too coarse for accurate low-inductance,
 * high-frequency measurements. See README.md for wiring and input-limit checks.
 */

#include <avr/io.h>

const uint8_t MEASURE_PIN = 5;
const uint8_t SAMPLE_COUNT = 16;
const uint8_t MIN_VALID_SAMPLES = 9;

// Effective C1 in farads. Measure/calibrate for the assembled tank.
const double C_TANK_F = 1.0e-6;

const unsigned int EXCITATION_US = 200;
const unsigned long PULSE_TIMEOUT_US = 50000UL;
const unsigned long SAMPLE_SETTLE_MS = 10UL;
const double PI_VALUE = 3.14159265358979323846;

static void exciteAndReleaseTank() {
  // D8 is PB0 on the specified ATmega328P boards. Keep the PORT latch low
  // while the pin is an input, so the AVR's internal pull-up remains disabled.
  PORTB &= static_cast<uint8_t>(~_BV(PORTB0));
  DDRB |= _BV(DDB0);  // Output, initially LOW
  PORTB |= _BV(PORTB0);
  delayMicroseconds(EXCITATION_US);

  // Briefly drive LOW, then release PB0 to high impedance. The short LOW
  // transition is much shorter than the tank period; D8 must not remain LOW.
  PORTB &= static_cast<uint8_t>(~_BV(PORTB0));
  DDRB &= static_cast<uint8_t>(~_BV(DDB0));
}

void setup() {
  Serial.begin(9600);

  // Safe idle state: D8/PB0 is input, with its output latch low (no pull-up).
  PORTB &= static_cast<uint8_t>(~_BV(PORTB0));
  DDRB &= static_cast<uint8_t>(~_BV(DDB0));
  pinMode(MEASURE_PIN, INPUT); // External R2 pull-up is required

  Serial.println(F("DIY LC inductance meter prototype"));
  Serial.println(F("5 V ATmega328P | LM393 | C1 = 1.0 uF"));
  Serial.println(F("Readings are approximate; see project README."));
}

void loop() {
  unsigned long totalHighTimeUs = 0UL;
  uint8_t validSamples = 0;

  for (uint8_t i = 0; i < SAMPLE_COUNT; ++i) {
    exciteAndReleaseTank();

    // For a roughly zero-crossing comparator, a HIGH pulse approximates one
    // half-cycle. This assumption is imperfect for a damped, offset waveform.
    const unsigned long highTimeUs =
        pulseIn(MEASURE_PIN, HIGH, PULSE_TIMEOUT_US);

    if (highTimeUs > 0UL) {
      totalHighTimeUs += highTimeUs;
      ++validSamples;
    }
    delay(SAMPLE_SETTLE_MS);
  }

  if (validSamples >= MIN_VALID_SAMPLES && C_TANK_F > 0.0) {
    const double avgHalfPeriodUs =
        static_cast<double>(totalHighTimeUs) / validSamples;
    const double frequencyHz = 1000000.0 / (2.0 * avgHalfPeriodUs);
    const double denom = 4.0 * PI_VALUE * PI_VALUE *
                         frequencyHz * frequencyHz * C_TANK_F;

    if (denom > 0.0) {
      const double inductanceH = 1.0 / denom;
      const double inductanceMh = inductanceH * 1000.0;
      const double inductanceUh = inductanceH * 1000000.0;

      Serial.print(F("Resonant frequency: "));
      Serial.print(frequencyHz, 1);
      Serial.print(F(" Hz | estimated L: "));

      if (inductanceMh >= 1.0) {
        Serial.print(inductanceMh, 3);
        Serial.println(F(" mH"));
      } else {
        Serial.print(inductanceUh, 1);
        Serial.println(F(" uH"));
      }
    } else {
      Serial.println(F("Invalid calculation; check C_TANK_F and signal."));
    }
  } else {
    Serial.println(F("No reliable ringing pulse; check wiring, Lx, and tank Q."));
  }

  delay(1000UL);
}
