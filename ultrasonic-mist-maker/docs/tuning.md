# Tuning and bring-up

The single most likely reason a build produces no mist is a **mistuned tank**.
This is the procedure to get it right.

## Before you power anything

1. **Measure your disc's capacitance.** It is the input that decides L1.
   * A cheap LCR meter at 1 kHz–10 kHz is ideal.
   * No meter? Compare against the nominal 2.2 nF and see the sweep procedure below.
2. **Calculate the required inductor:**

```
L = 1 / ((2·π·f)² · C_disc)

f = 108 000 Hz
```

| Disc measured | Required L | Nearest standard |
| --- | --- | --- |
| 1.5 nF | 1448 µH | 1.5 mH |
| 1.8 nF | 1207 µH | 1.2 mH |
| **2.2 nF** | **987 µH** | **1.0 mH** |
| 2.7 nF | 804 µH | 820 µH |
| 3.0 nF | 724 µH | 680 µH or 750 µH |

3. **Socket or hand-wind L1** so it can be changed. Do not commit a PCB footprint
   until you have confirmed the value on a breadboard.

## Bring-up sequence

**Step 1 — verify the carrier without the disc.**

Disconnect J2. Power at 5 V with a 100 mA current limit. Probe the 555 output
(pin 3) with an oscilloscope or a frequency counter.

| Expected | Value |
| --- | --- |
| Frequency | 107–108 kHz |
| Duty cycle | ~54 % |
| High level | ~3.3 V |
| Current draw | ~10–20 mA |

If the frequency is ~72 Hz, you have 100 nF in the timing position instead of 1 nF.
If it is ~7 kHz, your resistors are 51 Ω/100 kΩ rather than 1 kΩ/6.2 kΩ. Both are
the exact errors in the original design — see [`CORRECTIONS.md`](CORRECTIONS.md).

**Step 2 — check the gate.**

Probe the MOSFET gate. You should see the same 107 kHz square wave, with edges
slower than the 555's output by the RC of R7 × Ciss (~32 ns). If the gate looks
rounded into a triangle, R7 is too large.

**Step 3 — check the tank with the disc connected, dry.**

With the disc connected but **not in water**, briefly power up. Probe across the
disc — you should see a substantially larger sine-like swing than the 5 V rail
(the tank is stepping up). Current draw should be well under 300 mA when dry.

> Keep this brief. Running dry heats the disc and can crack it.

**Step 4 — tune for maximum swing.**

If you have a variable inductor or a capacitor decade box, adjust for peak
amplitude across the disc. Peak amplitude = resonance = maximum mist.

Practical alternative without instruments: place the disc in water and try the
candidate inductors in order of amplitude of the mist plume. It is crude but works.

**Step 5 — in water.**

Set the disc 1–3 mm below the surface, power from a 5 V supply capable of 500 mA,
and confirm visible mist within a few seconds.

## Symptom → cause

| Symptom | Most likely cause | Check |
| --- | --- | --- |
| No mist at all, low current | Carrier far from resonance | Step 1: measure the 555 frequency |
| Disc buzzes audibly but no mist | Carrier in the audio range | C2 is probably 100 nF, not 1 nF |
| Weak mist | Tank slightly off resonance | Retune L1 (step 4) |
| Heavy current, no mist | Tank shorted or FET stuck on | Check Q1 and D1 orientation; check for solder bridges |
| Disc gets hot | Running dry, or DC across the piezo | Verify C6 is fitted; keep the disc wet |
| Fuse trips | Load above 500 mA | Check for a short; check the FET is not latched on |
| Works on a USB-A cable, dead on C-to-C | CC pulldowns missing | Fit R5 and R6 (5.1 kΩ each) |
| 555 overheats | Driving a shorted or very lossy tank | Disconnect the disc and re-measure |

## Measuring without an oscilloscope

Minimum viable bench:

| Tool | Use |
| --- | --- |
| Multimeter (DC + AC volts) | AC volts across the disc is a usable proxy for drive amplitude — higher means closer to resonance |
| Current-limited supply | Protects the FET while you experiment |
| LCR meter | Directly gives C_disc for the L calculation |

An AC-volts reading across the disc that peaks as you change L is the whole tuning
signal. You do not need a scope to succeed at this.

## When to stop tuning

Stop when the AC voltage across the disc peaks and the current draw is within
rating. If you cannot get a peak with any inductor in the 680 µH–1.5 mH range:

* the disc may have a different capacitance than assumed (remeasure),
* the disc may already be cracked from a dry run,
* or the 555 is not actually running at 108 kHz (return to step 1).
