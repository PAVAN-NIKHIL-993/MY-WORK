# Bill of materials

Extracted from the original design session. Prices are the recorded unit costs at
the time of design (2024–2025 volume pricing) and have **not** been re-verified
against current supplier catalogues — treat them as design-time estimates, not
quotations.

| Ref | Part Number | Description | Qty | Unit Price | Supplier |
| --- | --- | --- | --- | --- | --- |
| U1 | STC15W408AS | 8051 MCU, SOP-20, 8KB Flash, 512B RAM, 10-bit ADC | 1 | $0.18 | LCSC/STC Micro |
| R1 | 0603 100kΩ ±1% | Fixed resistor for NTC divider | 1 | $0.003 | Yageo |
| R2 | 0603 10kΩ ±5% | Pull-down for power button | 1 | $0.002 | Yageo |
| R3 | 0603 1kΩ ±5% | Buzzer current limit | 1 | $0.002 | Yageo |
| C1 | 0603 100nF 16V X7R | Power decoupling | 1 | $0.005 | Samsung/Murata |
| C2 | 0603 10µF 6.3V X5R | Bulk capacitor | 1 | $0.008 | Samsung |
| RT1 | NTC 100kΩ ±1% B3950 | Glass-encapsulated NTC thermistor | 1 | $0.05 | TDK/Semitec 103AT-11 |
| BZ1 | SMD Piezo 12mm | Passive buzzer 2.7kHz | 1 | $0.08 | Murata PKM13 |
| SW1 | 3×6×2.5mm Tact Switch | SPST momentary | 1 | $0.02 | ALPS SKQGAFE010 |
| LCD1 | Custom 3.5 digit TN LCD | 14-seg, 3V, multiplex drive | 1 | $0.15 | Custom/COG bonding |
| BT1 | CR2032 holder SMD | Button cell holder | 1 | $0.06 | Linx BAT-HLD-001 |
| BAT | CR2032 | 3V 220mAh Lithium coin cell | 1 | $0.12 | Panasonic |
| - | PCB 2-layer FR4 | 12×35mm, 1oz copper, ENIG | 1 | $0.08 | JLCPCB/PCBWay |
| - | Plastic housing | ABS white with flexible tip | 1 | $0.20 | Injection mold |

## Cost summary

Summed from the priced rows above (**not** an independent quotation):

| Item | Unit cost |
| --- | --- |
| Electronic components (U1, R1–R3, C1, C2, RT1, BZ1, SW1, LCD1, BT1) | $0.56 |
| CR2032 cell (BAT) | $0.12 |
| PCB, 2-layer FR4 12 × 35 mm | $0.08 |
| Plastic housing, ABS | $0.20 |
| **Total per unit** | **$0.96** |

The two largest single costs are the MCU ($0.18) and the custom TN LCD ($0.15);
the thermistor is only $0.05.

**Excluded from the total:** LCD tooling/NRE, PCB tooling and stencil, programming
and calibration labour, test fixtures, and yield loss. For a small first run those
dominate the per-unit price.

## Sourcing notes

* **U1 STC15W408AS** — STC Micro (China). SOP-20, 7×12.8 mm, 1.27 mm pitch. Free
  Keil C51-compatible toolchain and a USB-to-TTL ISP programmer.
* **RT1** — the design specifies a glass-encapsulated NTC, 100 kΩ ±1%, β = 3950.
  TDK/Semitec 103AT-11 is the named example. A ±1% part is required: a ±5% part
  would make the accuracy claim unreachable regardless of calibration.
* **LCD1** — custom 3.5-digit TN, 14-segment, 3 V, multiplex drive, COG bonding.
  This is a custom part with a tooling/NRE cost that is **not** in the per-unit
  price above; it is the main barrier to a small first run.
* **R1** — must be ±1% to keep the divider ratio known; it forms the other half of
  the ratiometric measurement.

## Critical-to-accuracy parts

| Ref | Why it matters |
| --- | --- |
| RT1 | Sets the measurement curve. Tolerance dominates the uncalibrated error |
| R1 | Divider partner; its tolerance shifts the curve |
| U1 ADC | 10-bit, internal reference drift is part of the residual error |
| C1, C2 | Decoupling affects noisy ADC readings |

Everything else (buzzer, switch, holder, resistors R2/R3) has no effect on
measurement accuracy and can be substituted freely.
