# 6. Review, Interview Practice, and Worked Problems

Use this chapter to practice explaining the electronics ideas clearly. A strong technical answer usually follows this order:

1. **Define** the component or circuit.
2. **Explain the operation** and give the relevant equation or state behavior.
3. **Give one real application.**
4. **State one important limit or design check.**

Use units in calculations. If a value depends on the exact component, say so and identify the datasheet parameter you would check.

## 6.1 Short interview answers

| Question | Concise answer | Useful follow-up / caveat |
|---|---|---|
| What does a resistor do? | It relates voltage and current, dissipates energy, and can limit current, divide voltage, or set bias. | Apply `V=IR` and check `P=VI` and resistor ratings. |
| How do series and parallel resistors differ? | Series parts carry the same current and their resistances add; parallel branches share voltage and their conductances add. | Parallel equivalent resistance is below the smallest branch resistance. |
| What does a capacitor do? | It stores electric-field energy; current depends on the rate of change of its voltage. | `i=C·dv/dt`; leakage, ESR, polarity, and voltage rating matter. |
| Why place a capacitor beside an IC supply pin? | A local bypass capacitor helps supply fast transient current and provides a short path for high-frequency noise. | Placement, return path, value, and package/layout recommendations matter. |
| What does an inductor oppose? | It opposes a change in current and stores energy magnetically. | `v=L·di/dt`; switched coils need a designed clamp path. |
| What is a Zener diode used for? | It can clamp or provide a reference while operated in its specified reverse-breakdown region. | It needs current limiting and adequate power/thermal margin. |
| BJT vs MOSFET? | A BJT uses base-junction current to control collector current; a MOSFET uses gate-source voltage and gate charge to control its channel. | Use forced beta for a BJT switch; use `RDS(on)` at real `VGS` for a MOSFET. |
| What makes a MOSFET logic-level? | Its on-resistance is specified low enough at the available logic gate drive. | `VGS(th)` is measured at small current and does not mean fully on. |
| What does an SCR do? | It is a latching unidirectional power switch triggered by a gate signal. | It turns off when its current falls below the holding condition; a gate command normally cannot turn it off. |
| What does a TRIAC do? | It controls current in either direction and is commonly used for AC power control. | Trigger quadrant, load type, commutation, isolation, and mains safety matter. |
| What is an op-amp? | A high-gain differential amplifier commonly used with feedback for analog signal processing. | Check input common-mode range, output swing, supply, bandwidth, slew rate, and stability. |
| When are the op-amp “golden rules” valid? | Approximately, when negative feedback keeps the op-amp operating linearly within its limits. | They fail in saturation, open-loop comparator use, or invalid input/supply conditions. |
| What is a 555 monostable? | A one-shot that produces a pulse of approximate duration `1.1RC` after a valid trigger. | Real timing depends on the exact IC, RC tolerances, leakage, and trigger/reset behavior. |
| What is a MUX? | A data selector that routes one of several inputs to one output using select bits. | A DEMUX routes one input to a selected output. |
| What does a flip-flop store? | One bit of state, commonly sampled on a clock edge. | Setup/hold time and asynchronous control behavior matter. |
| What does a 16-bit address bus select? | Up to `2^16 = 65,536` distinct address locations. | Total bytes depend on how wide each addressable location is. |
| What is distinctive about the classic 8051? | It is an 8-bit MCS-51 microcontroller with separate code/data spaces, four 8-bit ports, two timers, a serial port, and five classic interrupt sources. | ROM/RAM, timing, pinout, and peripheral details vary among derivatives. |

## 6.2 Worked calculation practice

### 1. Ohm's law and power

A `4 Ω` resistor is connected across `12 V`:

```text
I = V/R = 12/4 = 3 A
P = V×I = 12×3 = 36 W
```

That is a high dissipation for a typical small resistor. The calculation is also a reminder to check the supply's current limit and the resistor's power rating.

### 2. Parallel resistance

For `100 Ω` in parallel with `200 Ω`:

```text
Rtotal = (100×200)/(100+200) = 20,000/300 ≈ 66.7 Ω
```

### 3. Divider with and without a load

Two equal `10 kΩ` resistors across `12 V` make an unloaded midpoint of `6 V`. If a `10 kΩ` load is connected from the output to ground, the lower leg becomes `10 kΩ || 10 kΩ = 5 kΩ`:

```text
Vout = 12 × 5/(10+5) = 4 V
```

All resistor values in the ratio are in `kΩ` here. The example shows why an unbuffered divider's output depends on its load.

### 4. LED resistor estimate

For `5 V`, estimated LED drop `2 V`, and target `10 mA`:

```text
R = (5−2)/0.010 = 300 Ω
```

Using `330 Ω` gives approximately `3/330 = 9.1 mA`, before accounting for the LED's actual forward voltage, supply tolerance, and driver voltage drop.

### 5. RC time constant

`10 kΩ × 100 µF = 10,000 × 0.0001 = 1 s`. After one time constant a simple first-order charging capacitor has reached about 63.2% of its final voltage (or a discharging capacitor has 36.8% remaining).

### 6. Inductor voltage

If `L = 100 mH = 0.1 H` and current changes at `0.5 A/ms = 500 A/s`:

```text
|v| = L × |di/dt| = 0.1 × 500 = 50 V
```

The sign depends on current/voltage reference direction; a switch may need a clamp to keep a transient within ratings.

### 7. Non-inverting amplifier

With `Rf = 9 kΩ`, `Rg = 1 kΩ`, and `Vin = 0.2 V`:

```text
Av = 1 + 9/1 = 10
Vout (ideal) = 10 × 0.2 = 2 V
```

The actual op-amp must support that input and output voltage on its supply and into the connected load.

### 8. 555 astable estimate

For `RA=1 kΩ`, `RB=10 kΩ`, `C=100 µF`:

```text
f ≈ 1.44 / ((1k + 2×10k) × 100µF)
  ≈ 1.44 / 2.1 s
  ≈ 0.686 Hz
Duty ≈ (RA+RB)/(RA+2RB) = 11/21 ≈ 52.4%
```

This is a nominal estimate for the basic circuit; real capacitor tolerance/leakage can dominate.

### 9. Address-space capacity

A 16-bit address has `65,536` possible values. If each address selects one byte, the total is `65,536 bytes = 64 KiB`. If it selects a wider word, state that width before calculating total storage.

### 10. Classic 8051 UART reload

Assuming a classic 12T core, `11.0592 MHz`, Timer 1 mode 2, `SMOD=0`, and `TH1=0xFD`:

```text
Baud = 11,059,200 / (384×(256−253)) = 9,600 baud
```

Change the clock or derivative and the reload value may no longer be correct.

## 6.3 Common misconceptions to avoid

| Oversimplification | Better statement |
|---|---|
| “A silicon diode drops exactly `0.7 V`.” | Forward voltage varies with current, temperature, and part; use its datasheet curve. |
| “A MOSFET is fully on when `VGS` exceeds `VGS(th)`.” | Threshold is specified at a small current; check `RDS(on)` at the actual gate voltage. |
| “A BJT switch needs `IC/β` base current using the typical datasheet beta.” | Typical `β` is not a saturation guarantee; choose suitable forced beta and verify base/driver limits. |
| “A capacitor blocks all DC.” | An ideal capacitor blocks steady-state DC after settling; real parts leak and transients still matter. |
| “A flyback diode is always a free improvement.” | It changes coil-current decay and release time; select a clamp that meets the switching and voltage needs. |
| “An SCR turns off when its gate goes low.” | A standard SCR latches; current must fall below the holding condition for long enough. |
| “The 741 works from any supply, including 3.3 V.” | It is not rail-to-rail and is generally a poor fit for low-voltage single-supply MCU work. |
| “All 8051s have 4 KB ROM, 128 bytes RAM, and 12 clocks per machine cycle.” | Those are classic-baseline facts; derivatives differ substantially. |
| “Water pressure/current is exactly how electrons behave.” | It is only a limited analogy; charge, fields, and energy transfer require the actual circuit model. |

## 6.4 Final concept checklist

- **Resistors** limit/control current, set bias, and divide voltage; verify power and loading.
- **Capacitors** store electric-field energy and respond to changing voltage; verify polarity, ESR, tolerance, and ratings.
- **Inductors** store magnetic energy and resist changing current; verify saturation/current and protect switched loads.
- **Diodes** provide nonlinear, directional current paths; use the correct type and observe reverse/current limits.
- **BJTs and MOSFETs** switch or amplify; choose their drive and ratings for the real load, not a headline gain/threshold.
- **SCRs, TRIACs, and DIACs** provide triggering/latching behavior for power control; mains circuits require qualified, certified safety design.
- **Op-amps** condition analog signals with feedback; their supply, input range, output swing, and stability limit the math.
- **A 555** creates timing and pulse functions; its RC equations are approximations tied to a particular circuit and IC.
- **Digital logic** maps input states to outputs and stored states; timing, voltage thresholds, and active-low conventions matter.
- **Memory** uses addresses to name locations; maps and capacities are device-specific.
- **The 8051** is a family architecture; use the exact derivative's datasheet and toolchain documentation.

A useful mental summary is: **passive parts shape or store energy; active devices control signals and power; analog circuits handle continuous values; digital circuits handle encoded states; microcontrollers combine logic, memory, and peripherals to control a system.**
