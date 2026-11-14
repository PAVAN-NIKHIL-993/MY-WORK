# 3. Analog Circuits and the 555 Timer

Analog circuits represent continuously varying quantities such as sensor voltage, audio, and supply ripple. An operational amplifier (op-amp) can condition those signals. The 555 timer combines comparators, a latch, and a discharge switch to create timing and pulse circuits.

## 3.1 Op-amp fundamentals

An op-amp has a non-inverting input `V+`, an inverting input `V−`, an output, and supply pins. A simple open-loop model is:

```text
Vout = Aol × (V+ − V−)
```

`Aol` (open-loop gain) is very large, so even a small input difference can drive the output close to a supply limit. The output cannot exceed its supply rails and typically cannot reach them exactly.

An ideal op-amp model assumes infinite open-loop gain, infinite input impedance, zero output impedance, infinite bandwidth, and zero input offset. Real devices have finite versions of all these properties, plus limits on input common-mode range, output swing/current, slew rate, stability, and supply voltage.

### The two “golden rules” — with conditions

For an op-amp operating in its linear range with **negative feedback**:

1. Input currents are approximately zero (very small, not exactly zero).
2. Feedback drives the inputs toward nearly the same voltage (`V+ ≈ V−`), called a virtual short.

These are analysis shortcuts, not universal laws. They do not apply when an input is outside the common-mode range, the output is saturated, the feedback is absent or positive, or the device is unstable.

## 3.2 Common op-amp circuits

The equations below assume an ideal op-amp, negative feedback, and operation within the device's valid input/output ranges.

### Comparator (open-loop comparison)

With no linear feedback, the output moves toward one rail or the other according to the sign of `V+ − V−`. A comparator is intended for this job and generally switches more cleanly and recovers from saturation more predictably than a general-purpose op-amp. Add hysteresis (positive feedback) when a noisy input near the threshold could cause repeated switching.

### Non-inverting amplifier

The signal enters `V+`; a resistor divider returns part of the output to `V−`:

```text
Av = Vout/Vin = 1 + Rf/Rg
```

For `Rf = 9 kΩ` and `Rg = 1 kΩ`, the ideal gain is `10`. A `0.5 V` input would ask for `5 V` output; the circuit can produce it only if its supplies, input range, output swing, load, and bandwidth allow it.

### Inverting amplifier

The input reaches `V−` through `Rin`; `Rf` feeds the output back to `V−`; `V+` is the reference (often ground):

```text
Av = Vout/Vin = −Rf/Rin
```

`Rin = 10 kΩ` and `Rf = 100 kΩ` give an ideal gain of `−10`; a `1 V` input asks for `−10 V`, which requires a supply and output range capable of reaching that level.

### Voltage follower (buffer)

Connect the output directly to `V−` and drive `V+` with the input. The ideal closed-loop gain is one. The high input impedance and lower output impedance can isolate a sensor from a load, but the chosen op-amp must still support the sensor's common-mode voltage, desired output swing, and load.

### Summing amplifier

For an inverting summer with input resistors `Ri` and feedback resistor `Rf`:

```text
Vout = −Rf × (V1/R1 + V2/R2 + ... + Vn/Rn)
```

With equal input resistors, the output is a scaled, inverted sum. Applications include signal mixing and weighted analog sums; the output range still limits the result.

### Difference amplifier

A four-resistor difference amplifier can produce:

```text
Vout = (R2/R1) × (V2 − V1)
```

when the resistor ratios are matched (`R2/R1 = R4/R3`) and the reference connection is as assumed. Resistor-ratio mismatch reduces common-mode rejection. Instrumentation amplifiers are often a better choice for small sensor differences in the presence of a large common-mode voltage.

### Integrator and differentiator

An ideal inverting integrator uses an input resistor and a feedback capacitor:

```text
Vout = −(1/RC) × ∫Vin dt
```

A constant input produces a ramp until output saturation. Real integrators often add a resistor in parallel with the feedback capacitor to limit DC gain and avoid drifting into saturation.

An ideal inverting differentiator uses an input capacitor and feedback resistor:

```text
Vout = −RC × dVin/dt
```

It responds strongly to rapid changes, but also amplifies high-frequency noise. Practical circuits limit bandwidth with additional resistors/capacitors selected for the application; the exact topology should be analyzed rather than copied blindly.

## 3.3 Feedback

- **Negative feedback** subtracts part of the output from the input. It can stabilize gain and linearize a circuit, within the op-amp's bandwidth and stability limits.
- **Positive feedback** reinforces a change. It is useful for switching thresholds with hysteresis (a Schmitt trigger) and for oscillators, but uncontrolled positive feedback drives an amplifier toward saturation.

Feedback does not make an op-amp ideal. Check gain-bandwidth product, phase margin/stability, slew rate, input/output ranges, and load capacitance.

## 3.4 The 741: useful historical example, poor default for a modern MCU

The 741 is a classic general-purpose bipolar op-amp and a useful example for learning differential amplification and feedback. It is **not rail-to-rail** and is generally unsuitable for direct operation from a single `3.3 V` or `5 V` MCU rail. Its input common-mode range and output swing require headroom from the supply rails; many 741 circuits use dual supplies. Check the exact manufacturer's datasheet before using one.

For a low-voltage sensor-to-PIC circuit, select an op-amp designed for the available supply, input common-mode voltage, output range, load, noise, and bandwidth. A comparator is often the correct choice when the output is meant to be a digital decision.

## 3.5 555 timer overview

A classic bipolar NE555 contains two comparators, an internal reference divider, a latch, an output stage, and a discharge transistor. In the usual configuration the trigger comparator uses approximately `1/3 VCC` and the threshold comparator approximately `2/3 VCC` as switching levels. CMOS 555 variants and specific implementations can differ; use the exact datasheet.

### Pin functions (standard 8-pin package)

| Pin | Name | Function |
|---:|---|---|
| 1 | GND | Ground / negative supply |
| 2 | TRIG | A low trigger (commonly below about `1/3 VCC`) sets the timing state |
| 3 | OUT | Logic/power output; drive limits depend on the exact part |
| 4 | RESET | Active-low reset; hold high for normal operation, often tie to a valid supply level |
| 5 | CTRL / CONT | Control-voltage input; a small bypass capacitor may help in noisy circuits if the datasheet recommends it |
| 6 | THRES | Senses the timing capacitor; crossing the upper threshold resets the timing state |
| 7 | DISCH | Internal discharge transistor for the timing capacitor |
| 8 | VCC | Positive supply; range is device-specific |

Decouple the supply near the IC. The 555 output is not automatically suitable for a motor, relay, loudspeaker, or other high-current/inductive load; choose a rated driver and protection circuit.

## 3.6 The three common 555 modes

### Astable: repeating oscillator

The common two-resistor/one-capacitor circuit repeatedly charges through `RA + RB` and discharges through `RB`:

```text
THIGH ≈ 0.693 × (RA + RB) × C
TLOW  ≈ 0.693 × RB × C
T      ≈ 0.693 × (RA + 2RB) × C
f      ≈ 1.44 / ((RA + 2RB) × C)
Duty   ≈ (RA + RB) / (RA + 2RB)
```

In this basic circuit, the duty cycle is greater than 50%; other circuits can alter the charge/discharge paths. Example: `RA = 1 kΩ`, `RB = 10 kΩ`, `C = 100 µF` gives `T ≈ 1.455 s`, `f ≈ 0.687 Hz`, high time about `0.762 s`, and low time about `0.693 s`.

### Monostable: one-shot pulse

A trigger starts one output pulse. The common timing approximation is:

```text
t ≈ 1.1 × R × C
```

For `R = 10 kΩ` and `C = 100 µF`, `t ≈ 1.1 s`. Trigger pulse width, retrigger behavior, reset, and capacitor leakage affect the real circuit.

### Bistable: set/reset latch

With appropriate trigger/reset wiring, the 555 can store a state: a valid set event makes the output high and reset (pin 4 low) forces it low. The exact trigger thresholds and input arrangement depend on the circuit; prevent floating control inputs and verify the manufacturer's timing diagrams.

### Timing cautions

These equations are nominal approximations for the common textbook circuit. Resistor/capacitor tolerance, capacitor leakage, supply variation, comparator thresholds, load, and temperature affect the actual timing. Large electrolytic timing capacitors can have substantial tolerance and leakage. Measure the built circuit if timing matters.

## 3.7 Quick self-check

1. Under what conditions is `V+ ≈ V−` a valid op-amp approximation?
2. Why might a comparator be preferable to a 741 for a `3.3 V` logic threshold?
3. What causes an ideal integrator's output to ramp, and why can a real one saturate?
4. In the common 555 astable, which resistor controls the discharge path?
5. What assumptions are hidden in `t ≈ 1.1RC`?
