# 2. Transistors and Thyristors: Switching and Power Control

Resistors, capacitors, and inductors shape voltage, current, and stored energy. Transistors use a control signal to switch or amplify another signal. Thyristors provide latching power switching, especially in AC-control circuits.

## 2.1 Bipolar junction transistor (BJT)

A BJT has three terminals—**base (B), collector (C), emitter (E)**—and two junctions. NPN and PNP parts use opposite semiconductor layer sequences and require different bias polarities. A small base current can control a larger collector current, but the device is not an ideal current amplifier.

In the forward-active region, a useful first approximation is:

```text
IC ≈ β × IB
```

`β` (also written `hFE`) varies substantially between devices and with collector current, temperature, and operating point. The relation does not guarantee a chosen collector current in a saturated switch, and base-emitter voltage is not a fixed 0.7 V under all conditions.

### Operating regions

| Region | Approximate condition | Typical use |
|---|---|---|
| Cutoff | Base-emitter junction not sufficiently forward biased; collector current is very small | Switch treated as off |
| Forward active | Base-emitter junction forward biased; collector-base junction reverse biased | Amplification, with bias and feedback designed for linear operation |
| Saturation | Both junctions forward biased; extra base drive no longer produces the active-region current relationship | Switch treated as on; `VCE(sat)` is nonzero and specified under test conditions |

### NPN low-side switch

A common arrangement connects the load between `+V` and the collector, the emitter to ground, and drives the base through a resistor. The load current is not supplied by the logic pin; it comes from the load supply. The control circuit and load supply need a suitable common reference unless the interface is isolated.

For a saturated switch, choose a **forced beta** (often deliberately much smaller than the datasheet's typical small-signal gain), then estimate:

```text
IB ≥ IC(load) / forced_beta
RB ≤ (Vdrive − VBE(on)) / IB
```

Example: a `10 mA` load with an illustrative forced beta of `10` needs about `1 mA` base current. With a `5 V` drive and an estimated `0.8 V` base-emitter drop, `RB ≈ (5 − 0.8)/0.001 = 4.2 kΩ`; `4.3 kΩ` is a nearby standard value. Then check the actual transistor's saturation data, base-current limit, resistor power, MCU pin drive limit, and supply/load behavior. If the MCU cannot safely source that base current, use a different transistor, MOSFET, or driver stage.

An NPN low-side switch is convenient, but it does not provide high-side switching. PNP high-side arrangements are possible with appropriate drive polarity/level shifting. For relays and motors, add a clamp chosen for the load and desired release behavior; do not rely on the transistor's voltage rating alone.

### BJT uses

- Low-current switching of indicators, logic-level loads, and relays (within ratings).
- Analog amplification when the bias point, gain, impedance, frequency response, and thermal behavior are designed.
- A Darlington pair provides high composite current gain but has greater voltage drop and usually slower switching than a single transistor.

## 2.2 MOSFETs

A MOSFET has **gate (G), drain (D), source (S)** terminals. The insulated gate is voltage-controlled and draws little steady-state current, but it has capacitance and must be charged/discharged during switching. Gate charge, drive strength, and switching frequency therefore matter.

For a common enhancement-mode N-channel MOSFET:

- `VGS` below the device's turn-on region: channel is off (apart from leakage).
- Sufficient `VGS`: channel conducts; its on-state loss is approximately `I² × RDS(on)` while the resistive model is suitable.

**Gate threshold voltage (`VGS(th)`) is not the voltage for fully turning a power MOSFET on.** It is specified at a small test current. A “logic-level” MOSFET should have `RDS(on)` specified at the actual gate drive available—such as 2.5 V, 3.3 V, or 4.5 V—not merely a low threshold number.

### Choosing a MOSFET

Check all of the following in the exact datasheet and circuit:

1. `VDS` rating, including transients and margin.
2. Continuous and pulsed current under the real board's thermal conditions (not just a headline current figure).
3. `RDS(on)` at the actual gate-source voltage and relevant temperature; estimate conduction loss.
4. Total gate charge and switching frequency/transition loss; determine whether a gate driver is needed.
5. Safe operating area, avalanche rating where relevant, package thermal resistance, heatsinking, and pinout.
6. Maximum positive and negative `VGS`; use a gate-source pull-up or pull-down where necessary so reset or high-impedance states do not leave the MOSFET floating.

A small **series gate resistor** may damp ringing and limit peak drive current; its value depends on the driver, wiring, and switching goals. A gate-to-source pull resistor serves a different purpose: it establishes a default state. Neither value is a universal MOSFET requirement.

### Low-side, high-side, and the body diode

- **N-channel low-side:** load to the positive rail, MOSFET between load and ground. It is often easy to drive, provided the source/ground reference is correct.
- **P-channel high-side:** source near the positive rail, load below the drain. Pulling its gate below its source turns it on; ensure `VGS` stays within its absolute maximum.
- **N-channel high-side:** often needs a gate driver that raises the gate above the source, especially when the source rises near the supply rail.

Power MOSFETs include a parasitic **body diode**. Its direction is fixed by the device structure. It may provide a path in a bridge or synchronous circuit, but it is **not automatically a safe flyback clamp** for every motor/coil arrangement. Design the recirculation path deliberately.

In an H-bridge, never command the upper and lower switch in the same leg on together: that creates shoot-through from supply to ground. Use appropriate dead time, gate drive, current limiting, and protection.

## 2.3 BJT vs MOSFET at a glance

| Feature | BJT | MOSFET |
|---|---|---|
| Control | Base current / junction bias | Gate-source voltage; gate charge during transitions |
| Useful switch model | Saturated switch with base drive | Low `RDS(on)` when driven to the specified gate voltage |
| Steady control current | Base current is required | Very small after the gate is charged, but switching current is needed |
| Common benefit | Simple, inexpensive, useful for small signals and modest loads | Efficient switching at low on-resistance with appropriate drive |
| Common trap | Using nominal `β` as a guaranteed saturated-switch gain | Treating `VGS(th)` as the fully-on voltage |
| Must check | `IC`, `VCE`, `VCE(sat)`, base current, power/thermal limits | `VDS`, `ID`, `RDS(on)`, gate charge, `VGS` limits, thermal/SOA limits |

Neither type is universally faster or more efficient; compare the actual device, drive, frequency, and load.

## 2.4 Thyristor family

### SCR (silicon-controlled rectifier)

An SCR is a four-layer PNPN device with anode, cathode, and gate. It blocks forward current until triggered (subject to its ratings). A gate pulse can turn it on; after latching, removing the gate signal does **not** turn a standard SCR off.

The SCR remains conducting while its anode current is above its **holding current**. It must fall below the relevant turn-off condition for long enough to recover; a current pulse may also need to exceed the **latching current** to establish conduction. These are distinct datasheet parameters.

- With AC, current may fall below holding current near a current zero crossing, allowing natural commutation. Inductive loads shift current relative to voltage, so do not assume a voltage zero crossing is sufficient.
- With DC, the circuit must provide a suitable forced-commutation method or interrupt the current path; a normal gate command does not turn it off.
- Uses include controlled rectifiers, battery/power control, and **crowbar protection**. A crowbar intentionally creates a high-current fault path and requires correctly coordinated fuse/current protection; it must be designed, not improvised.

### TRIAC

A TRIAC conducts in either direction after triggering and can control both AC half-cycles. It is often modeled as two inverse-parallel SCRs with a shared gate, though its real triggering behavior is more complex. Trigger sensitivity depends on the quadrant (polarity of MT2 and gate relative to MT1); consult the component data.

Common uses include lamp, heater, and some AC motor/fan control. Phase-angle control delays the trigger within each half-cycle. Commutation, inductive loads, `dv/dt`, gate drive, snubbers, EMI, and load compatibility all matter. Do not infer that every TRIAC/load combination will switch reliably or quietly.

### DIAC

A DIAC is a bidirectional breakover trigger device. Below its specified breakover voltage it conducts little; after breakover it conducts strongly enough to deliver a trigger pulse, then returns to its blocking state as current falls. A DIAC is commonly paired with a TRIAC in phase-control circuits. Breakover voltage is part-specific—not a universal `30–40 V` value.

### Mains safety

SCR/TRIAC dimmers and heaters can expose lethal mains voltage even when their control signal is low voltage. No mains wiring instructions are provided here. Learn the principle using an isolated, safe, low-voltage setup; use certified, enclosed hardware and qualified supervision for any mains application.

## 2.5 Quick self-check

1. Why is `IC = βIB` not a reliable guarantee of a saturated switch's collector current?
2. What datasheet value is more useful than `VGS(th)` when choosing a logic-driven MOSFET?
3. Why is a MOSFET body diode not a universal substitute for a flyback diode?
4. What current condition turns a standard SCR off, and why is a DC SCR circuit different from AC?
5. What does a gate pull resistor do that a series gate resistor does not?
