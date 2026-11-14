# Bill of materials — Rev 2 (corrected)

Every value below is the value **drawn in the schematic**
([`../hardware/mist-maker-108k.sch`](../hardware/mist-maker-108k.sch)), not the
value printed on the part. See [`CORRECTIONS.md`](CORRECTIONS.md) for why several
of the original values were wrong.

The column "Source marking" records what the physical part is usually silkscreened
or marked with, because that is where the original errors came from.

## Active components

| # | Ref | Component | Value / Part | Package | Source marking | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | U4 | Timer IC | **NE555P** (or TLC555 for lower supply spikes) | DIP-8 | `NE555` | Astable, 107.5 kHz. **Not** the original module's driver IC |
| 2 | Q1 | N-channel MOSFET | **AO3400A** — 30 V, 5.7 A, Rds(on) ≈ 28 mΩ @ 4.5 V | SOT-23 | `AO3400A` / `3400` | MOSFET, *not* an NPN transistor |
| 3 | D1 | Schottky diode | **SS34** — 40 V, 3 A | SMA | `SS34` | Flyback clamp across L1 |
| 4 | D2 | LED | Any 0603 LED, 2 V Vf | 0603 | — | Power indicator, 3 mA via R9 |

## Passives

| # | Ref | Component | Value | Package | Source marking | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| 5 | R3 | Resistor | **1 kΩ** (Ra) | 0603 | `1001` | 555 timing. *Source said 510 Ω* |
| 6 | R4 | Resistor | **6.2 kΩ** (Rb) | 0603 | `6201` | 555 timing. *Source said 100 kΩ* |
| 7 | C2 | Ceramic capacitor | **1 nF** (C) | 0603 | `102` | 555 timing. *Source said 100 nF* |
| 8 | R5 | Resistor | **5.1 kΩ** | 0603 | `5101` | USB-C CC1 pulldown — **required** |
| 9 | R6 | Resistor | **5.1 kΩ** | 0603 | `5101` | USB-C CC2 pulldown — **required** |
| 10 | R7 | Resistor | **100 Ω** | 0603 | `1000` | Gate resistor, damps ringing |
| 11 | R8 | Resistor | **10 kΩ** | 0603 | `1002` | Gate pull-down, holds FET off at power-up |
| 12 | R9 | Resistor | **1 kΩ** | 0603 | `1001` | LED current limit (≈3 mA at 5 V) |
| 13 | C1 | Ceramic capacitor | **100 nF** | 0603 | `104` | Bulk rail decoupling |
| 14 | C4 | Ceramic capacitor | **10 nF** | 0603 | `103` | 555 CONTROL pin (pin 5) bypass — datasheet value |
| 15 | C5 | Ceramic capacitor | **100 nF** | 0603 | `104` | 555 Vcc decoupling, placed at the IC |
| 16 | C6 | Ceramic capacitor | **1 µF / 25 V** | 0805 | `105` | DC block to the transducer (Xc ≈ 1.5 Ω @ 108 kHz) |
| 17 | C3 | Electrolytic capacitor | **100 µF / 16 V** | Radial 6.3 × 5.4 mm | — | Bulk reservoir for the 300 mA pulses |

## Power, protection and connectors

| # | Ref | Component | Value / Part | Package | Notes |
| --- | --- | --- | --- | --- | --- |
| 18 | J1 | USB Type-C receptacle | HRO TYPE-C-31-M-12 or equivalent, USB 2.0 only | SMD | 16-pin. Using a Micro-USB socket instead means omitting R5/R6 |
| 19 | F1 | Resettable fuse (polyfuse) | **500 mA hold**, 6–16 V | 1206 | *Source said 300 mA — no margin for a 300 mA load* |
| 20 | L1 | Inductor | **1.0 mH**, ≥ 500 mA saturating | Axial THT, 16 × 9 mm, 20.32 mm pitch | **Critical.** 22–220 µH will not resonate at 108 kHz |
| 21 | J2 | Connector | PH2.0, 2-pin | THT | To the piezo disc |

## Not on the PCB (external)

| Item | Specification | Notes |
| --- | --- | --- |
| Piezo transducer | 108 kHz ± 3 kHz, 1.5–3 nF, ~1.5–2 W | The "white disc". Capacitance determines the required L |
| Float / housing caps | 2× mushroom-shaped black plastic | Keeps the disc 1–3 mm below the surface |
| Cotton wick | — | Draws water up in cap-style builds |
| Water | Distilled or demineralised | Prevents mineral crust on the disc |

## Critical parts — get these right

| Ref | Why it matters |
| --- | --- |
| **L1** | Sets the resonant frequency. Wrong value = no mist. Must be retuned to the actual disc (see [`tuning.md`](tuning.md)) |
| **C2** | Sets the 555 frequency. 1 nF, not 100 nF |
| **R3, R4** | Set the 555 frequency together with C2 |
| **R5, R6** | Without them a USB-C charger supplies no power |
| **Q1** | Must be a MOSFET with logic-level Vgs(th), not a BJT |

Everything else (R9, D2, C1, C4, C5, J2, housing) can be substituted freely.

## Cost estimate

Design-time estimates at low volume; **not** quotations, and not verified against
current distributor pricing.

| Group | Cost |
| --- | --- |
| Active semiconductors (U4, Q1, D1, D2) | ~$0.42 |
| Passives (10 resistors/caps, C3 electrolytic) | ~$0.15 |
| Connectors (J1 Type-C, J2 PH2.0) | ~$0.28 |
| Fuse, inductor | ~$0.30 |
| PCB, 2-layer 1.2 mm FR-4 | ~$0.15 |
| **PCB assembly total** | **~$1.30** |
| Piezo disc (external) | ~$0.60 |
| Housing + wick (external) | ~$0.70 |
| **Complete build** | **~$2.60** |

That sits at the low end of the "$2–5" range the source quoted for the commercial
module — which is expected: a discrete 555 build costs about the same as the
purpose-built module it replaces, and performs worse. See
[`design.md`](design.md#why-a-555-and-not-the-original-ic).
