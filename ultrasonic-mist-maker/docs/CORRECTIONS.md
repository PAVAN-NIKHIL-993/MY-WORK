# Corrections

The design text this project is based on contained several **numerical errors that
would stop the circuit working**. This document records each one, shows the
arithmetic, and states what the corrected design uses instead.

Every figure below was recomputed from first principles; the formulas are given so
they can be checked.

---

## Summary

| # | Claim in the source | Verified problem | Severity |
| --- | --- | --- | --- |
| 1 | "NE555 generates ~108 kHz at the transducer" with Ra=510 Ω, Rb=100 kΩ, C=100 nF | Produces **71.8 Hz**, not 108 kHz — off by **1504×** | **Fatal** |
| 2 | "`510` = 510 Ω", "`3400` = 3.4 kΩ" | SMD codes read wrong: `510` = **51 Ω**, `3400` = **340 Ω** | **Fatal** |
| 3 | "L1 = 22–47 µH **or 220 µH** for 108 kHz" | Wrong by a wide margin: 220 µH + 2.2 nF resonates at **228.8 kHz**, not 108 kHz. Needs **≈ 1 mH** | **Fatal** |
| 4 | "~300 mA, 1.5–2 W" **and** "40–50 mL/h" | Mutually inconsistent: 1.5–2 W realistically yields **~20–30 mL/h** | Moderate |
| 5 | Polyfuse "~300 mA hold" for a 300 mA board | No margin; will nuisance-trip. Needs **≥ 450 mA hold** | Moderate |
| 6 | Q2 described as "NPN transistor" in the first BOM | AO3400A is an **N-channel MOSFET** | Confusing |
| 7 | Input is "Micro USB" in one place, "USB Type-C" in the title | Different connectors; a Type-C receptacle needs **two 5.1 kΩ CC pulldowns** | **Fatal for Type-C** |
| 8 | 555 alone drives a resonant piezo load | A plain 555 astable cannot drive 2.2 nF at 108 kHz well; it needs a buffer/tank | Design choice |

**Severity key:** *Fatal* = the circuit does not work as drawn. *Moderate* = works
but will misbehave or under-perform. *Confusing* = documentation error.

---

## 1. The 555 timing is off by three orders of magnitude

The 555 astable frequency is:

```
f = 1.44 / ((Ra + 2·Rb) · C)
```

With the values stated in the source (Ra = 510 Ω, Rb = 100 kΩ, C = 100 nF):

```
f = 1.44 / ((510 + 2·100000) · 100e-9)
  = 1.44 / (200510 · 100e-9)
  = 71.8 Hz
```

**71.8 Hz is an audible buzz, not 108 kHz.** Nothing about the circuit is
ultrasonic. To reach 108 kHz with Rb = 100 kΩ you would need C ≈ **66 pF**, which
is on the order of PCB stray capacitance — not a buildable value.

### Corrected values

The source's C1/C2 = "104P" (100 nF) cannot be both the 555 timing capacitor and a
100 nF decoupling capacitor. The design needs them separated, and the timing
component must be 1 nF:

| Parameter | Source | Corrected | Result |
| --- | --- | --- | --- |
| Ra (R3) | 510 Ω | **1 kΩ** | — |
| Rb (R4) | 100 kΩ | **6.2 kΩ** | — |
| C (C2) | 100 nF | **1 nF** | — |
| Frequency | "108 kHz" | **107.5 kHz** | ✓ |
| Duty cycle | — | **53.7 %** | ✓ |

Verification:

```
f = 1.44 / ((1000 + 2·6200) · 1e-9)
  = 1.44 / (13400 · 1e-9)
  = 107,463 Hz  ≈ 107.5 kHz

duty = (Ra + Rb) / (Ra + 2·Rb) = 7200 / 13400 = 53.7 %
```

107.5 kHz sits inside the stated **108 kHz ±3 kHz** tolerance.

> The transducer is a *self-resonant* device: it has a sharp mechanical resonance,
> and driving it at a frequency well away from it produces almost no mist. This is
> why an error of 1504× is fatal rather than merely suboptimal.

---

## 2. SMD resistor markings were misread

Three-digit SMD codes are **value × 10^exponent**. The source consistently treated
the first digits as a literal value.

| Marking | Source interpretation | Correct value | Error |
| --- | --- | --- | --- |
| `510` | 510 Ω | **51 Ω** | 110× |
| `201` | 200 Ω | 200 Ω | correct |
| `3400` | 3.4 kΩ | **340 Ω** | 10× |
| `104P` | 100 nF | 100 nF | correct |
| `100K` | 100 kΩ | 100 kΩ | correct (4-digit `1003` would also be 100 kΩ) |

`3400` is a **4-digit** code: 340 × 10⁰ = 340 Ω. It is *not* 3.4 kΩ, which would be
marked `3401`.

### Consequence

If you populate a board with 51 Ω where the schematic expects 1 kΩ, the 555 timing
is wrong again. The corrected design therefore uses **explicit E24 values** in the
schematic and BOM (`1k0`, `6k2`, `100R`, `10k`, `1k`) rather than bare markings, so
the value is unambiguous.

---

## 3. The inductor value cannot resonate at 108 kHz

Resonance of the LC tank:

```
f = 1 / (2·π·√(L·C))
```

A 108 kHz mist-maker piezo disc has a typical capacitance of **1.5–3 nF**. Solving
for L at 108 kHz:

| Disc capacitance | Required L |
| --- | --- |
| 1.5 nF | 1448 µH |
| 2.2 nF | **987 µH** |
| 3.0 nF | 724 µH |

What the source's values actually give:

| L | Disc 2.2 nF | Verdict |
| --- | --- | --- |
| 22 µH | 723 kHz | 6.7× too high |
| 47 µH | 495 kHz | 4.6× too high |
| 220 µH | 229 kHz | 2.1× too high |
| **1.0 mH** | **107.3 kHz** | ✓ |

### Corrected

**L1 = 1.0 mH.** With a 2.2 nF disc the tank resonates at 107.3 kHz, matching the
555 carrier at 107.5 kHz.

The source's note "220 µH more likely for 108 kHz" was directionally right (bigger
than 47 µH) but still more than 4× too small.

**Important caveat:** this assumes a 2.2 nF disc. Real discs vary. That is why the
design uses a **socketed/THT inductor** and documents how to retune:

```
L = 1 / ((2·π·f)² · C_disc)
```

Measure the disc's capacitance, or sweep the drive frequency, before committing a
PCB. See [`tuning.md`](tuning.md).

---

## 4. The power and atomisation figures are mutually optimistic

* 5 V × 300 mA = **1.5 W** input.
* Real ultrasonic mist makers need roughly **3–5 W** for 40–50 mL/h.
* At 1.5–2 W, expect **~20–30 mL/h**.

The source states both "1.5–2 W" and "40–50 mL/h". They are not both true for this
board. The corrected BOM keeps the 300 mA figure (that is what the module is rated
for) and this document states the realistic output.

---

## 5. The polyfuse has no margin

A resettable fuse (polyfuse/PTC) is specified by *hold* current — the current it
passes indefinitely. Its *trip* current is typically ~2× hold.

| Parameter | Source | Corrected |
| --- | --- | --- |
| Load | 300 mA | 300 mA |
| Hold current | 300 mA | **500 mA** |
| Margin | 1.0× (will run hot, trip on warm days) | 1.67× |

Rule of thumb: **hold ≥ 1.5 × operating current.** Use a 500 mA or 750 mA hold part.

---

## 6. Q2 is a MOSFET, not a bipolar transistor

The first BOM called Q2 "NPN Transistor, 3400". A follow-up message corrected it to
**AO3400A**, which is an **N-channel enhancement-mode MOSFET** (30 V, 5.7 A,
SOT-23, Rds(on) ≈ 28 mΩ at 4.5 V Vgs).

These are not interchangeable: the drive conditions, the gate resistor, and the
pull-down are all different. The corrected schematic draws it as a MOSFET with:

* **R7 = 100 Ω** gate resistor (limits the 555's output edge into the gate),
* **R8 = 10 kΩ** gate pull-down (holds the FET off during 555 power-up).

### Gate drive check

| Parameter | Value |
| --- | --- |
| AO3400A total gate charge Qg | ≈ 6.5 nC |
| 555 output source current | ≈ 200 mA |
| Gate charge time | ≈ 32 ns |
| Carrier period at 108 kHz | 9259 ns |
| Switching time as % of period | **0.35 %** — acceptable |

The 555's output high is roughly Vcc − 1.7 V ≈ **3.3 V**, comfortably above the
AO3400A threshold, but it is a **marginal** gate voltage: it raises Rds(on)
somewhat and increases switching loss. A logic-level MOSFET with a lower Vgs(th)
would be better. See [`design.md`](design.md#known-weaknesses).

### Thermal check

| Loss term | Value |
| --- | --- |
| Conduction (0.3 A, 28 mΩ) | 2.5 mW |
| Switching (tr ≈ 50 ns) | ≈ 8 mW |
| Total | ≈ 11 mW → ~3 °C rise in SOT-23 |

Thermally fine. The dominant heat is the transducer and the inductor, not the FET.

---

## 7. Micro USB vs USB Type-C

The title says **Type-C**; the component list says **Micro USB**.

This matters: on a USB-C receptacle, **CC1 and CC2 must each have a 5.1 kΩ pulldown
to GND** or a C-to-C charger will not supply 5 V at all (the port stays unpowered).
A Micro-USB socket has no such requirement.

The corrected schematic adds **R5, R6 = 5.1 kΩ** on CC1/CC2. If you build with a
Micro-USB socket instead, omit R5/R6 and J1 changes footprint — but then it will not
work from a C-to-C cable.

---

## 8. Why a 555 is the wrong choice (documented, not hidden)

The **original module used a purpose-built driver IC (U4)**. Replacing it with a 555
+ discrete MOSFET is not an upgrade:

| Issue | Detail |
| --- | --- |
| Asymmetric drive | A plain 555 astable cannot go below 50 % duty, so the piezo sees an asymmetric waveform |
| Supply transients | The bipolar 555's totem-pole output draws a current spike at every transition |
| Slow edges | ~100 ns edges into a 2.2 nF load mean soft switching and extra loss |
| Single-ended drive | One N-MOSFET drives the piezo half-wave; a push-pull stage would be more efficient |
| Temperature drift | 555 timing drifts ~50–200 ppm/°C, moving the carrier off the disc's resonance |

This build is therefore presented as **a documented, buildable learning design**,
not as a drop-in replacement for the module. If you want maximum mist output or
efficiency, buy a module with a real driver IC.

---

## What was *not* changed

These source claims were checked and stand:

| Claim | Status |
| --- | --- |
| 5 V, ~300 mA input | Consistent |
| `104P` = 100 nF | Correct |
| `201` = 200 Ω | Correct |
| `100K` = 100 kΩ | Correct |
| 108 kHz ±3 kHz operating frequency | Typical for this class of disc |
| Do not run dry — disc will overheat and crack | Correct and important |
| Distilled water reduces mineral buildup | Correct |
| Disc submerged 1–3 mm below the surface | Correct |
| 1.2 mm FR-4 PCB | Reasonable for this power level |

---

## Reproducing these checks

```bash
# 555 frequency, LC resonance, and resistor-code decoding
python3 tools/verify_design.py
```

The script recomputes every number in this document and prints PASS/FAIL against
the targets. It has no dependencies beyond the Python standard library.
