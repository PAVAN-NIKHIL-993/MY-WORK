# 1. Passive Components: Resistors, Capacitors, Inductors, and Diodes

This chapter builds the basic circuit vocabulary, then explains what each part does, how to calculate simple values, and where the ideal model stops matching the real component.

## 1.1 Circuit quantities and units

| Quantity | Symbol | Unit | Useful intuition |
|---|---|---|---|
| Voltage / potential difference | `V` | volt (V) | Energy transferred per unit charge between two points |
| Current | `I` | ampere (A) | Rate of charge flow; `1 A = 1 C/s` |
| Resistance | `R` | ohm (Ω) | Opposition to current in the resistor model |
| Charge | `Q` | coulomb (C) | Amount of electric charge |
| Capacitance | `C` | farad (F) | Charge stored per volt |
| Inductance | `L` | henry (H) | Magnetic energy storage / opposition to changing current |
| Power | `P` | watt (W) | Rate of energy transfer |

A voltage is always measured **between two points**. “Ground” is the circuit's chosen reference node; it is not automatically earth ground. Current must have a complete return path. The water-flow analogy (voltage like pressure, current like flow, resistance like a restriction) can help with first intuition, but it is not a literal model of charge motion or every circuit effect.

## 1.2 Resistors

A resistor converts electrical energy mainly to heat and, in the ideal model, obeys Ohm's law:

```text
V = I × R       I = V/R       R = V/I
```

For example, `12 V` across `4 Ω` gives `I = 12/4 = 3 A`. That resistor would dissipate `P = V I = 36 W`, so an ordinary small signal resistor would be destroyed. Always check power as well as resistance:

```text
P = V × I = I² × R = V²/R
```

Choose a resistor with a suitable power rating, tolerance, working voltage, and temperature rating; leave practical margin rather than designing at its absolute limit.

### Series and parallel networks

**Series:** the same current flows through every element, and the resistances add.

```text
Rtotal = R1 + R2 + ... + Rn
```

So `100 Ω + 200 Ω + 300 Ω = 600 Ω`.

**Parallel:** each branch has the same voltage, and branch currents add.

```text
1/Rtotal = 1/R1 + 1/R2 + ... + 1/Rn
```

For two resistors, `Rtotal = (R1 × R2)/(R1 + R2)`. For `100 Ω` in parallel with `200 Ω`, the result is about `66.7 Ω`, lower than either branch.

### Voltage divider and loading

With `R1` above `R2`, and `R2` returning to ground, an **unloaded** divider gives:

```text
Vout = Vin × R2/(R1 + R2)
```

At `Vin = 12 V` with two equal `10 kΩ` resistors, `Vout = 6 V`. A load connected across `R2` is in parallel with it and lowers the effective lower-leg resistance, so the output falls. For instance, a `10 kΩ` load across a `10 kΩ` lower resistor makes that leg `5 kΩ`, giving `12 × 5/(10 + 5) = 4 V`. A divider is not a regulated power supply; use a buffer or regulator when the load current is significant or the output must stay stable.

### Common uses and types

| Type | Typical use / note |
|---|---|
| Fixed resistor | Current limiting, biasing, pull-up/pull-down, gain setting |
| Potentiometer / trimmer | Adjustable divider, level or calibration control; check end-to-end and wiper ratings |
| LDR (photoresistor) | Light-dependent sensing; response and resistance vary by part and illumination |
| Thermistor | Temperature sensing; NTC resistance falls with temperature, PTC rises (check the part) |
| Shunt resistor | Small resistance used to infer current from its voltage drop; power and Kelvin routing matter |

A pull-up or pull-down gives a digital input a defined state when no driver is active; it does not “create” a logic state from a floating wire without a reference. Check the input's voltage thresholds and the pull resistor's current/power.

### LED current-limiting example

For an LED in series with a resistor, estimate:

```text
R = (Vsupply − Vf_LED − Vother) / I_LED
```

At `5 V`, assuming `Vf_LED = 2.0 V` and `I_LED = 10 mA`, `R = (5 − 2)/0.010 = 300 Ω`; `330 Ω` is a common next choice, giving about `9.1 mA` under those assumptions. Actual LED forward voltage, supply voltage, resistor tolerance, and MCU output voltage vary. Check the LED and MCU datasheets, and do not exceed the pin's current limits. Use a separate resistor for each LED in a parallel array unless the circuit is specifically designed for current sharing.

## 1.3 Capacitors

A capacitor stores energy in an electric field. Its ideal charge-voltage relationship and current law are:

```text
Q = C × V
 i = C × dv/dt
Stored energy: E = ½ C V²
```

The current depends on how quickly the capacitor voltage changes. In the ideal steady-state DC case, once charged, no current flows through it; while a voltage is changing, current flows. Real capacitors have leakage, equivalent series resistance (ESR), parasitic inductance, and finite voltage/current ratings, so “blocks DC, passes AC” is a useful first model, not an absolute rule.

### Series, parallel, and RC timing

- **Parallel:** `Ctotal = C1 + C2 + ...` (same voltage; capacitances add).
- **Series:** `1/Ctotal = 1/C1 + 1/C2 + ...` (same charge in the ideal model; total capacitance decreases).
- For a simple first-order RC network, `τ = R × C` is the time constant. After one `τ`, a charging capacitor reaches about 63.2% of its final voltage; a discharging capacitor has about 36.8% of its initial voltage left.

Example: `R = 10 kΩ`, `C = 100 µF` gives `τ = 10,000 × 0.0001 = 1 s`. The circuit does not generally reach its final value exactly at one time constant; the response is exponential.

For sinusoidal signals, ideal capacitive reactance is:

```text
Xc = 1/(2πfC)
```

At higher frequency, the ideal capacitor's reactance is lower. Real behavior also depends on ESR, parasitic inductance, dielectric, and frequency rating.

### Practical uses and capacitor types

| Use / type | What it does | Selection cautions |
|---|---|---|
| Decoupling / bypass | Supplies short transient current locally and shunts supply noise | Place close to the IC supply/return pins; follow the IC datasheet and layout guidance. A small ceramic is common; bulk capacitance may also be needed. |
| Supply smoothing | Reduces ripple after rectification or load transients | Check capacitance, voltage rating, ripple current, ESR, temperature, and life. |
| Coupling | Passes changing signal while blocking a DC offset in the ideal model | The capacitor and surrounding resistance set a low-frequency cutoff. |
| RC timing | Creates a predictable charge/discharge interval | Tolerance, leakage, and input threshold affect timing. |
| Ceramic | Often compact, non-polar, and useful for high-frequency decoupling | Capacitance can change with bias, temperature, and dielectric; check the series. |
| Aluminum electrolytic | Large capacitance in a compact part; commonly polarized | Observe polarity, ripple, ESR, and voltage rating. Reverse connection or overvoltage can cause failure, venting, or rupture. |
| Tantalum | Compact polarized capacitance | Requires careful voltage derating and surge-current limits; failure can be severe. |
| Supercapacitor | Very large capacitance for short-term backup/hold-up | Low voltage rating, leakage, balancing, charging current, and backup duration matter. |

Do not choose a capacitor from capacitance alone. Check the manufacturer's ratings and the circuit's maximum voltage, transients, temperature, frequency, and polarity.

## 1.4 Inductors

An inductor stores energy in a magnetic field when current flows. For the ideal sign convention in which current enters the positively referenced terminal:

```text
v = L × di/dt
Stored energy: E = ½ L I²
```

An inductor resists a **change** in current. In ideal steady-state DC it behaves like a short; a real inductor still has winding resistance and may heat. In AC, its ideal reactance is:

```text
XL = 2πfL
```

Thus higher frequency means greater ideal inductive reactance. Actual impedance depends on winding resistance, core losses, parasitic capacitance, frequency, and current. If the core saturates, inductance can fall sharply and current can rise dangerously.

### Uses and design notes

- **Filtering:** Inductors and capacitors can attenuate selected frequency ranges; the actual filter response depends on topology, loading, losses, and component tolerances.
- **Switch-mode power supplies:** A buck/boost converter switches current through an inductor, stores energy in its magnetic field, and transfers that energy to the output. The switch, diode/synchronous switch, capacitor, control loop, and inductor ratings all matter.
- **EMI suppression:** Chokes and filter networks impede unwanted high-frequency current; placement and return paths matter.
- **Relay/motor coils:** When current is interrupted, the magnetic field collapses and produces a voltage spike. Provide an appropriate clamp (for example, a flyback diode for a compatible DC coil circuit) and check the switching speed and load requirements. See [Transistors and thyristors](02-transistors-and-thyristors.md).

Check inductance, saturation current, RMS current, winding resistance, core loss, and voltage/temperature ratings. An inductor is not simply a resistor whose value changes with frequency.

## 1.5 Diodes

Resistors, capacitors, and inductors are the canonical passive components. Diodes are nonlinear semiconductor devices; some introductory courses group them with passives because they do not provide signal gain, while others treat them as a separate device class. A diode has two terminals: **anode** and **cathode**. In the simplest model it conducts readily in one direction and blocks in the other. In a real diode, forward current is nonlinear, the forward drop depends on current, temperature, and device type, and reverse leakage is not exactly zero. There is **no universal silicon forward voltage of exactly 0.7 V**; use the datasheet curve for a design.

Reverse breakdown is normally a limit to stay within, except for a component designed and rated to operate there (such as a Zener diode). A diode is not a perfect open/closed switch.

### Common diode types

| Type | Main purpose | Important qualification |
|---|---|---|
| Rectifier (for example, 1N400x family) | Rectification and low-frequency protection | Check peak inverse voltage, average/surge current, recovery, and thermal ratings; parts in a family are not interchangeable in every circuit. |
| Zener | Reference or clamp in reverse breakdown | Needs a current-limiting path; calculate Zener current and power across the full load/supply range. It is not a precision regulator in every condition. |
| Schottky | Lower forward drop and often fast switching | Reverse leakage and reverse-voltage capability may be worse than a comparable silicon diode. |
| LED | Emits light when forward biased | Requires current limiting or a properly regulated current driver. Observe polarity and current/power ratings. |
| Photodiode | Converts incident light into current | Commonly used with a suitable bias/readout circuit; operating mode affects speed and sensitivity. |

### Practical diode applications

- **Rectification:** A diode can pass one half-cycle of an AC waveform; bridge circuits use multiple diodes to produce full-wave rectification. Smoothing and regulation are separate tasks.
- **Zener clamp/reference:** A series resistor or current-regulating source must limit current; the Zener's minimum/maximum current and dissipation must be respected.
- **Flyback clamp:** For a low-side switched DC relay coil, a diode is commonly placed across the coil with its cathode toward the positive supply and anode at the switched low-side node. It is reverse-biased during normal drive, then provides a path for coil current when the switch opens. This slows current decay; faster release may need a different rated clamp.
- **Reverse-polarity protection:** A series diode is simple but loses voltage and dissipates power. Other topologies can reduce loss; verify their failure modes and ratings.

For every diode, check polarity, current, reverse voltage, surge, power, thermal conditions, and switching behavior against the exact datasheet.

## 1.6 Quick self-check

1. What stays the same for resistors in series? What stays the same for branches in parallel?
2. Why might a divider's output change when a load is attached?
3. What does one RC time constant mean, and what does it **not** mean?
4. Why does a switched coil need a voltage clamp?
5. Why is “a silicon diode is always 0.7 V” not a safe design rule?
