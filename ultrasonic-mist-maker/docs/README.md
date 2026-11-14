# Documentation

| Document | Read it for |
| --- | --- |
| [`design.md`](design.md) | How the circuit works, the power budget, known weaknesses and open questions |
| [`bom.md`](bom.md) | Corrected bill of materials, cost estimate, which parts are critical |
| [`CORRECTIONS.md`](CORRECTIONS.md) | **Start here.** Every numerical error in the source brief, with the arithmetic that proves it |
| [`tuning.md`](tuning.md) | Measured-disc → inductor calculation, bring-up sequence, symptom/cause table |

## Artifacts

| File | What it is |
| --- | --- |
| [`../hardware/mist-maker-108k.sch`](../hardware/mist-maker-108k.sch) | KiCad EESchema v4 schematic — 21 components, structurally verified |
| [`../tools/verify_design.py`](../tools/verify_design.py) | Recomputes every number in these docs; exits non-zero if a check fails |

## Verification status

| Claim | How it was checked |
| --- | --- |
| 555 frequency 107.5 kHz | Formula, `verify_design.py` |
| Tank resonance 107.3 kHz | Formula, `verify_design.py` |
| Resistor-code decoding | EIA 3/4-digit rules, `verify_design.py` |
| MOSFET thermal | Conduction + switching loss estimate, `verify_design.py` |
| Polyfuse margin | 1.5× rule, `verify_design.py` |
| Schematic integrity | 39 balanced `$Comp` blocks, 21 unique non-power refs |
| BOM ↔ schematic match | 21/21 refs, no orphans |
| **Atomisation rate** | **Not measured** — estimated from the power budget |
| **Efficiency / mist output** | **Not measured** — no hardware was built |
| **Disc life** | **Not characterised** |

The distinction matters: the electrical design is arithmetic and can be trusted; the
fluid-dynamic performance is an estimate.
