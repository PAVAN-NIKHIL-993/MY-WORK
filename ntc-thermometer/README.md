# NTC thermometer — clinical digital thermometer design

A design record for a low-cost clinical digital thermometer: a 2×AAA/CR2032-powered
STC15W408AS (8051) board with an NTC thermistor in a ratiometric divider, driving a
custom 3.5-digit TN LCD, with ±0.1 °C accuracy **after factory calibration** over
35–42 °C.

> **Status: design documentation, not a finished, buildable product.**
> The schematic and bill of materials are complete enough to review and prototype
> from. The firmware is a sketch (it does not compile), there is no PCB layout, and
> no physical prototype was built or measured as part of this record. See
> [Status](#status) before relying on any number here.

---

## The product in one page

| Property | Value |
| --- | --- |
| Measurement | Human body temperature, 35–42 °C |
| Sensor | NTC 100 kΩ ±1%, β = 3950 (glass-encapsulated) in a divider with a 100 kΩ ±1% resistor |
| MCU | STC15W408AS — 8051 core, SOP-20, 8 KB flash, 512 B RAM, 10-bit ADC, internal RC oscillator, EEPROM |
| Display | Custom 3.5-digit TN LCD, 14-segment, 3 V, multiplex drive |
| Feedback | Piezo buzzer (stability beep, power-on beep), fever icon above 38 °C |
| Power | CR2032 coin cell (or 2×AAA), 2.4–5.5 V, no regulator needed |
| Resolution | 0.01 °C displayed |
| Accuracy | ±0.1 °C over 35–42 °C, **post-calibration only** |
| Board | 2-layer FR4, 12 × 35 mm, 1 oz copper, ENIG |
| Material cost | ~$0.96 per unit (sum of the BOM; design-time estimate) |

## Why this architecture

The whole design follows from one decision: use an MCU with everything integrated
so the board has almost no external components.

* **10-bit ADC built in** — no external ADC, no I²C sensor.
* **Internal ±1% RC oscillator** — no crystal, saving cost and board space.
* **EEPROM built in** — the per-unit calibration offset lives on the same chip.
* **2.4–5.5 V range** — runs directly from a coin cell, no boost or LDO.
* **Free toolchain** — Keil C51-compatible compiler plus a USB-to-TTL ISP dongle.

The trade-off is accuracy: a 10-bit ADC over a 7 °C window is coarse, so the design
leans on oversampling and factory calibration to reach the claimed numbers. That
trade-off is analysed honestly in [`docs/design.md`](docs/design.md).

## Repository contents

```
ntc-thermometer/
├── README.md                          this file
├── hardware/
│   └── clinical-thermometer.sch       KiCad EESchema v4 schematic (21 instances)
├── firmware/
│   └── thermometer.c                  firmware sketch — does NOT compile, see header
└── docs/
    ├── README.md                      documentation index
    ├── design.md                      architecture, accuracy, error budget, limits
    ├── bom.md                         bill of materials and cost breakdown
    └── calibration.md                 the mandatory factory calibration procedure
```

## Documentation

| Document | Read it for |
| --- | --- |
| [`docs/design.md`](docs/design.md) | Schematic walkthrough, measurement chain, why each part was chosen, accuracy analysis, error budget, manufacturing flow, open design questions |
| [`docs/bom.md`](docs/bom.md) | Full bill of materials, cost breakdown, which parts are critical to accuracy |
| [`docs/calibration.md`](docs/calibration.md) | The factory calibration procedure the accuracy claim depends on |

## Status

| Artifact | State |
| --- | --- |
| Schematic | Complete KiCad file, opens in Eeschema, terminates with `$EndSCHEMATC` |
| Bill of materials | Complete, with suppliers and design-time prices |
| Engineering analysis | Complete — accuracy, error budget, and explicit limitations |
| Firmware | **Sketch only.** Missing lookup table and all peripheral functions; invalid syntax (`3_seconds`) |
| PCB layout | **Absent** |
| Gerbers / fabrication data | **Absent** |
| Mechanical / housing drawing | **Absent** |
| LCD datasheet | **Absent** |
| Prototype build and measurements | **Not performed** |

Nothing in this repository was electrically built, flashed or measured. Every
numeric claim (accuracy, resolution, cost, battery life) is a **design claim** from
the original session, not a measurement.

## Honest accuracy note

Two numbers are easy to confuse, and the difference matters:

* **0.01 °C resolution** — what the display can show. Achieved by oversampling the
  ADC 64× (≈13 effective bits) and a sub-LSB lookup.
* **±0.1 °C accuracy** — how close the reading is to truth. Achieved only by
  calibrating each assembled unit in a reference bath.

Without calibration the error is ±0.5–1.0 °C, driven by the thermistor's ±1%
tolerance. Without oversampling the display resolution claim is unsupported.

**One source claim did not survive checking.** The original session said a 10-bit
ADC gives ≈0.07 °C/step; recomputing the divider gives **0.097–0.104 °C/step** for
every practical resistor choice, so the true quantisation floor is ≈0.10 °C — very
close to the accuracy target. The analysis, and what it means for the design, is in
[`docs/design.md`](docs/design.md#a-discrepancy-in-the-source-design-verified).

See [`docs/design.md`](docs/design.md#accuracy) and
[`docs/calibration.md`](docs/calibration.md).

## Where this must not be used

| Use | Why it fails |
| --- | --- |
| Ambient room temperature (15–30 °C) | Poor sensitivity: few ADC steps across the range, large quantisation error |
| Industrial / oven temperatures (>50 °C) | NTC drift and aging; no calibration outside 35–42 °C |
| Precision laboratory work (±0.01 °C) | Absolute accuracy is ±0.1 °C at best, limited by ADC linearity and reference drift |
| Fast-changing temperatures (airflow) | Thermal mass too high — responds in seconds, not milliseconds |

**Not a medical device.** Nothing here is certified, validated or fit for clinical
diagnosis. See [`docs/design.md`](docs/design.md#design-review--open-questions).

## Provenance

This project was reconstructed from a saved browser session of the original design
conversation. The schematic, bill of materials and engineering analysis are
reproduced verbatim from that session and have not been independently re-derived.

The saved page also contained the account holder's personal information and internal
session identifiers. That page was **not** committed; only the engineering artifacts
were extracted. Nothing in this repository contains credentials or personal data.

Artifacts that were never part of the session (PCB layout, gerbers, mechanical
drawings, LCD datasheet) are absent rather than invented.
