# Ultrasonic mist maker — 108 kHz driver (Rev 2, corrected)

A complete, analysed design for a 5 V **USB-C ultrasonic atomizer** board: a 555
astable generates a ~107.5 kHz carrier, which switches a MOSFET into an
inductor–piezo resonant tank to atomise water into fine mist.

Typical use: mini humidifiers, aroma diffusers, egg incubators, fog effects, science
projects.

> **What this is.** A corrected, buildable *design record* with a verified
> schematic, BOM and tuning procedure. It is **not** a copy of the commercial
> module — the module uses a purpose-built driver IC, and this replaces it with a
> 555 plus discrete parts.
>
> **What it is not.** A prototype. No board was built, no disc was driven, and no
> mist was measured. Output rate and efficiency are calculated from the power
> budget, not observed.

---

## Read this first

The design brief this project started from contained **three errors that would stop
the circuit working**, plus several smaller ones:

| Brief said | Reality |
| --- | --- |
| 555 with 510 Ω / 100 kΩ / 100 nF gives 108 kHz | Gives **71.8 Hz** — a factor of **1504** too low |
| `510` is 510 Ω, `3400` is 3.4 kΩ | SMD codes: `510` = **51 Ω**, `3400` = **340 Ω** |
| L1 = 22–47 µH or 220 µH | 220 µH + 2.2 nF = **228.8 kHz**. Needs **≈ 1 mH** |

Full working in [`docs/CORRECTIONS.md`](docs/CORRECTIONS.md); every number is
recomputed by [`tools/verify_design.py`](tools/verify_design.py).

## Specifications (verified design values)

| Parameter | Value |
| --- | --- |
| Supply | 5 V DC via USB-C, 300 mA rated |
| Carrier | 107.5 kHz, 53.7 % duty (555 astable) |
| Tank | L1 1.0 mH resonant with a 2.2 nF disc → 107.3 kHz |
| Switch | AO3400A N-MOSFET, SOT-23, ~11 mW dissipation |
| Protection | 500 mA polyfuse, SS34 flyback clamp, 1 µF DC block |
| Output | PH2.0 to the piezo disc |
| PCB | 2-layer, 1.2 mm FR-4 |
| Realistic atomisation | **~20–30 mL/h** (1.5 W input) |
| Parts | 21 on the PCB + piezo disc, housing, wick |

## Contents

```
ultrasonic-mist-maker/
├── README.md
├── hardware/
│   └── mist-maker-108k.sch        KiCad EESchema v4, 21 components, verified
├── docs/
│   ├── README.md                  index
│   ├── design.md                  circuit operation, power budget, weaknesses
│   ├── bom.md                     corrected BOM, cost, critical parts
│   ├── CORRECTIONS.md             every error found, with the arithmetic
│   └── tuning.md                  bring-up and resonant tuning procedure
└── tools/
    └── verify_design.py           recomputes all numbers, exits non-zero on failure
```

## Quick verification

```bash
python3 tools/verify_design.py
```

Prints the 555 frequency, the tank resonance for each candidate inductor, resistor
code decoding, the power budget, the polyfuse margin and the MOSFET thermal
figures — 18 checks, all of which must pass.

## How it works, in one paragraph

The 555 runs as an astable multivibrator at 107.5 kHz. Its output drives the gate of
an N-channel MOSFET through a 100 Ω resistor. The MOSFET switches one end of a
1.0 mH inductor to ground; the inductor and the piezo disc's capacitance form a
resonant tank, so the disc sees a large sinusoidal voltage at its mechanical
resonance and vibrates. At resonance the disc's tip displacement is enough to shear
the water surface into ~3–5 µm droplets. A Schottky diode clamps the inductive kick
each cycle, and a 1 µF capacitor blocks DC from the crystal.

## Critical build notes

* **L1 must match your disc.** Measure the disc capacitance and use
  `L = 1/((2πf)²C)`. A 1.0 mH inductor suits a 2.2 nF disc. See
  [`docs/tuning.md`](docs/tuning.md).
* **C2 is 1 nF**, not 100 nF. The 100 nF parts are decoupling only.
* **R5 and R6 (5.1 kΩ on CC1/CC2) are mandatory** for a USB-C receptacle. Without
  them a C-to-C charger supplies nothing.
* **Never run the disc dry.** It overheats and cracks in seconds.
* Use distilled water; minerals crust the disc and kill output.

## Known weaknesses (honest)

| Weakness | Consequence |
| --- | --- |
| 555 gate drive is only ~3.3 V | Marginal for the AO3400A; a logic-level FET would be better |
| Duty cycle can't drop below 50 % | Asymmetric drive, lower efficiency than the original IC |
| Fixed tuning, no resonance tracking | Mist drops if the disc's capacitance differs from nominal |
| Single-ended drive | Half the theoretical swing across the piezo |
| 1.5 W input | ~20–30 mL/h, not the 40–50 mL/h the brief claimed |

This design is a **learning and repair reference**. For maximum output or
efficiency, buy a module with a real driver IC.

## Safety

5 V only. Keep the PCB dry — only the disc goes in the water. Do not run
unattended. 108 kHz is inaudible but is not a toy frequency: keep the running disc
away from skin and eyes.

## Provenance

Built from a design brief and a follow-up BOM correction supplied by the user. The
brief's component identifications (NE555, AO3400A, polyfuse, 22–47 µH/220 µH, Type-C)
were taken as the design intent; its *values* were re-derived from first principles
and corrected where they did not work. Nothing here was measured on hardware.
