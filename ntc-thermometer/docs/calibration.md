# Calibration

The ±0.1 °C accuracy claim rests entirely on this procedure. Without it the design
has a ±0.5–1.0 °C error, which is not clinically useful.

## Why calibration is mandatory

| Error source | Uncalibrated contribution |
| --- | --- |
| NTC tolerance (±1%) | ±0.5–1.0 °C |
| Divider resistor tolerance (±1%) | fraction of a °C |
| ADC gain/reference error | fraction of a °C |
| Combined | **too large for a clinical thermometer** |

Calibration converts these *systematic* errors into a measured offset that the
firmware subtracts. It cannot remove random error, and it is only valid over the
range it was performed in.

## Procedure

1. **Program** the MCU (before SMT placement, per the manufacturing table).
2. **Assemble** the board, including the NTC and the LCD.
3. **Point 1:** stabilise the unit in a 35.0 °C reference bath, let the reading
   settle, record the raw ADC value.
4. **Point 2 (optional but recommended):** repeat at 42.0 °C to derive a gain term
   as well as an offset. A single-point calibration corrects offset only.
5. **Store** the correction in EEPROM and set the calibration flag to `0xAA`.
6. **Verify:** re-read at one intermediate temperature (e.g. 37.0 °C) and confirm
   the result is within ±0.1 °C.

The firmware sketch in `../firmware/thermometer.c` encodes this contract:

```c
#define CAL_FLAG_ADDR   0x0000
#define CAL_OFFSET_ADDR 0x0001
if (EEPROM_read(CAL_FLAG_ADDR) != 0xAA) {
    LCD_display("--CAL--");
    while(1);  // refuse to run uncalibrated
}
```

Refusing to operate uncalibrated is the right default: a thermometer that displays
a confident wrong number is worse than one that refuses to start.

## Range restriction

Calibration is performed at 35 °C and 42 °C, so the accuracy claim **only** applies
between those temperatures. Outside that window the correction is an extrapolation
and the error grows. This is why the design must not be used for ambient,
industrial or oven temperatures.

## Reproducibility for production

| Requirement | Detail |
| --- | --- |
| Reference | Precision water bath, stable to better than ±0.05 °C |
| Dwell time | Long enough for the NTC and housing to reach equilibrium — thermal mass, not electronics, sets this |
| Fixture | ISP connection must be available with the unit assembled |
| Record keeping | Store offset (and gain, if two-point) against a serial number |
| Throughput | The recorded figure is ~30 s/unit, which assumes a bath that is already at temperature |

## What is not covered

* **Drift over time.** NTC aging and reference drift are not characterised here.
  A production product needs a periodic re-verification plan.
* **Self-heating.** The divider current through the NTC raises its temperature.
  At 3 V across ~200 kΩ the current is ~15 µA, giving microwatts of dissipation —
  small, but it is part of the residual error and is not separately measured.
* **Batch calibration of the reference.** The bath itself must be traceable, or the
  "0.1 °C" is only 0.1 °C relative to an unknown reference.
