# DIY LC Inductance Meter (Arduino Prototype)

A low-voltage learning project that estimates an unknown inductor from the ringing frequency of an LC tank. It uses a **5 V ATmega328P Arduino board**, an **LM393 dual comparator**, a known capacitor, and a small Arduino sketch.

> **This measures inductance only; it is not a complete LCR meter.** The supplied circuit and sketch are an educational prototype, not a calibrated instrument. They have not been bench-validated here. Do not rely on the readings for production, safety, or component qualification.

## Scope and important corrections

The attached `lcr.txt` contains several revisions of a schematic, duplicated explanations, and more than one sketch. This folder keeps one coherent version and omits the intermediate conversation and diagrams. It also corrects important issues in the supplied material:

- The excitation pin must be **released to high impedance** after the pulse so the LC tank can ring. Leaving an Arduino output actively LOW damps/clamps the tank. The sketch releases D8 to input mode after each pulse.
- The sketch uses **D8**, not D13. D13 has an onboard LED/circuit on common Uno/Nano boards that can load the tank.
- Pulse release uses ATmega328P `PB0`/`DDRB`/`PORTB` registers for a brief high-impedance transition; port this code before using another Arduino architecture.
- The 10 kΩ comparator pull-up is **R2** (the source BOM accidentally labels it R1 twice). LM393 outputs are open-collector; use the external pull-up shown.
- The source labels D1 anode-to-tank/cathode-to-GND as a negative clamp; that polarity would clamp **positive** excursions. This version reverses D1 for a negative clamp (anode to GND, banded cathode to tank), but that clamp still does not guarantee the LM393 input stays within its absolute-maximum range.
- Unused LM393 comparator inputs should not float. This version ties pins 5 and 6 to GND and leaves unused output pin 7 unconnected.
- The source's “high accuracy,” fixed 10 µH–100 mH range, exact cost, and fixed 50 Ω DCR cutoff are not established. Range and accuracy depend on the exact parts, tank losses, wiring, comparator limits, and timing method.

## How it works

A short pulse injects energy into the parallel tank formed by the unknown inductor `Lx` and the known capacitor `C1`. Once the Arduino drive pin is released, the tank rings. The LM393 turns the sensed waveform into a logic signal, and the sketch measures the duration of its HIGH portions using `pulseIn()` (software-timed polling, not a hardware input-capture unit).

For an ideal, lossless LC network:

```text
f0 = 1 / (2π√(Lx × C1))
Lx = 1 / (4π² × f0² × C1)
```

The real circuit is damped and has parasitic capacitance, coil resistance, comparator offset/delay, and wiring effects. The code treats each HIGH pulse as approximately half a resonant period; this is only an approximation. Averaging can reduce random jitter, but it cannot remove systematic error or `pulseIn()` timing quantization.

With `C1 = 1.0 µF`, the ideal frequencies are approximately 503 Hz at 100 mH, 1.59 kHz at 10 mH, 5.03 kHz at 1 mH, 15.9 kHz at 100 µH, and 50.3 kHz at 10 µH. On a typical 16 MHz Uno-class Arduino, `pulseIn()`/`micros()` timing has microsecond-scale resolution (commonly about 4 µs); low-inductance readings therefore become coarse quickly. Treat this implementation as a rough **mH-range experiment**, not a guaranteed 10 µH–100 mH meter. For better low-inductance measurement, use a comparator/input-capture design with a timing method and front end designed for the target frequency.

## Bill of materials

| Qty | Ref. | Part | Notes |
|---:|---|---|---|
| 1 | MCU | Arduino Uno/Nano/Pro Mini, ATmega328P, **5 V logic** | A 3.3 V Pro Mini is not the target. Pin mapping and onboard loads vary by board. |
| 1 | U1 | LM393 dual comparator, DIP-8 | Check the exact manufacturer's supply, input common-mode, absolute-maximum, and output ratings. |
| 1 | C1 | 1.0 µF film capacitor, preferably 1–5% | Enter the measured/effective capacitance in the sketch; lead and board capacitance affect it. |
| 1 | C2 | 0.1 µF ceramic bypass capacitor | Mount directly between U1 pin 8 and pin 4, close to the IC. |
| 1 | R1 | 1 kΩ, ¼ W | Series excitation resistor from D8 to the tank node. |
| 1 | R2 | 10 kΩ, ¼ W | External pull-up from U1 pin 1 to +5 V. |
| 1 | D1 | 1N4148 switching diode | Negative clamp orientation: anode to GND, cathode/band to tank; verify input limits below. |
| 2 | — | Test clips/socket pins | Connect the inductor under test between the tank node and GND. |
| 1 | Lx | Unknown inductor | Measure its DC resistance separately if possible; high loss can prevent ringing. |

Prices and availability vary; no build-cost claim is made.

## LM393 DIP-8 pinout

Top view, notch/dot at the top. Verify against the exact package datasheet before wiring.

| Pin | Name | Connection in this project |
|---:|---|---|
| 1 | OUT1 | Measurement output; connect to Arduino D5 and R2 pull-up to +5 V |
| 2 | IN1− | GND reference (the circuit's nominal zero threshold) |
| 3 | IN1+ | LC tank node through the documented connection |
| 4 | GND | Common ground |
| 5 | IN2+ | GND (defined unused-comparator input) |
| 6 | IN2− | GND (defined unused-comparator input) |
| 7 | OUT2 | Leave unconnected; this comparator output is unused |
| 8 | VCC | +5 V; C2 bypasses pin 8 to pin 4 |

The classic LM393 input range is **not rail-to-rail**. A 1N4148's negative-clamp forward drop can still let the tank go below the comparator's negative input limit; the clamp does not by itself make the input safe. Before connecting U1 pin 3, check the exact datasheet and observe the tank waveform with a suitable oscilloscope/probe. If it can exceed the allowed common-mode or absolute-maximum range, redesign the input clamp/bias network; do not rely on the Arduino or comparator protection diodes.

## Connection table

Use a common +5 V and GND for the Arduino and LM393. Power down before changing wiring.

| From | To | Purpose |
|---|---|---|
| Arduino 5V | +5 V rail | Powers the 5 V prototype |
| Arduino GND | GND rail | Common reference/return |
| Arduino D8 | R1 (1 kΩ), other side of R1 | Tank-node excitation with current limiting |
| R1 other side | Tank node | Excitation path |
| Tank node | Lx terminal 1 | Unknown inductor branch |
| Lx terminal 2 | GND rail | LC return |
| Tank node | C1 terminal 1 | Known capacitor branch |
| C1 terminal 2 | GND rail | LC return; Lx and C1 are in parallel |
| GND rail | D1 anode | Negative-swing clamp connection |
| D1 cathode (band) | Tank node | Clamp return; check clamp current and input limits |
| Tank node | U1 pin 3 (IN1+) | Ringing-signal sense |
| U1 pin 2 (IN1−) | GND rail | Nominal comparison reference |
| U1 pin 4 (GND) | GND rail | Comparator supply return |
| U1 pin 8 (VCC) | +5 V rail | Comparator supply |
| C2 one terminal | U1 pin 8 / +5 V | Local supply bypass |
| C2 other terminal | U1 pin 4 / GND | Keep this loop short, next to U1 |
| U1 pin 1 (OUT1) | Arduino D5 | Comparator output signal |
| U1 pin 1 (OUT1) | R2 (10 kΩ), other side of R2 | Open-collector pull-up |
| R2 other side | +5 V rail | Provides the output HIGH level |
| U1 pins 5 and 6 | GND rail | Keeps unused comparator inputs defined |
| U1 pin 7 | No connection | Unused comparator output |

The sketch makes D8 high briefly, then switches it to input/high impedance. **Do not change that behavior to leave D8 driven LOW during measurement**; doing so can suppress the ring. D5 must be a 5 V-compatible input for this 5 V board, and the external R2 pull-up must be present.

## Assembly sequence

1. **Use a low-voltage, current-limited bench supply or the intended 5 V Arduino rail.** Confirm the board is a 5 V ATmega328P model. Do not connect this prototype to mains or a high-energy circuit.
2. Connect Arduino 5 V and GND to the breadboard rails. Confirm the rails and common ground with a meter before inserting U1.
3. Insert the LM393 DIP-8 across the breadboard center gap. Identify pin 1 from the notch/dot and verify its orientation.
4. Wire U1 pin 8 to +5 V and pin 4 to GND. Place C2 directly across those pins. Tie pin 2 to GND; tie unused pins 5 and 6 to GND; leave pin 7 unconnected.
5. Wire U1 pin 1 to Arduino D5. Fit R2 (10 kΩ) from pin 1 to +5 V. Do not omit the pull-up.
6. Build the tank node. Connect D8 through R1 (1 kΩ) to the node. Connect C1 and the test clips from the node to GND. For the negative clamp, connect D1's **anode to GND** and its **banded cathode to the tank node**.
7. **Before connecting U1 pin 3**, inspect the tank node during an excitation pulse and ring. Confirm its voltage stays within the exact LM393 input limits. If not, stop and redesign the input interface.
8. Connect U1 pin 3 to the tank node only after the voltage check. Inspect the output at pin 1/D5; verify a clean logic waveform and that the tank continues ringing after D8 is released.

The SVG [schematic](schematic.svg) is a connection aid; this README's pin table and limits take precedence if a drawing is ambiguous.

## Sketch and use

Open [`lc_inductance_meter.ino`](lc_inductance_meter.ino) in the Arduino IDE. It assumes the 5 V ATmega328P board, the connections above, `C1 = 1.0 µF`, and an external 10 kΩ output pull-up. It uses ATmega328P `PB0` register access for the excitation pin, so it is not portable to a different Arduino architecture without adapting that code. Edit `C_TANK_F` if using another measured capacitor value. A plain-text version of the build steps is in [`build-guide.txt`](build-guide.txt).

1. Upload the sketch and open Serial Monitor at **9600 baud**.
2. With no inductor connected, confirm it reports no valid ringing rather than a plausible reading.
3. Connect one inductor across the clips and observe the reported frequency and estimated inductance.
4. Repeat with a known reference inductor. Record its measured value, frequency, and setup.

`pulseIn()` is software-timed and waits for a pulse; it is not an interrupt-driven frequency counter. The sketch rejects a result if fewer than nine of sixteen attempts return a pulse. A stable-looking number does not prove accuracy.

## Calibration

Use a known, preferably low-tolerance inductor and keep the layout, clips, and C1 unchanged. The `C_TANK_F` value should represent the **effective** tank capacitance, including relevant parasitics. For a one-point scale correction:

```text
C_new = C_old × (L_read / L_reference)
```

For example, if a known 10.00 mH part reads 9.40 mH using `C_old = 1.000 µF`, the one-point adjustment is `C_new ≈ 0.940 µF`. This compensates a scale error near that reference and setup; it does not establish accuracy across a wide range or correct damping, comparator, and timing nonlinearity. Do not describe an unverified one-point calibration as “exact.”

## Two 5 mH inductors in series

For uncoupled ideal inductors, `Ltotal = L1 + L2`, so two 5 mH parts would nominally give 10 mH. If the coils are magnetically coupled, the relation is:

```text
Ltotal = L1 + L2 ± 2M
```

where `M` is mutual inductance and the sign depends on winding orientation/polarity. Spacing or rotating the coils can reduce coupling, but no fixed distance or angle guarantees `M = 0`; measure the assembled pair. Series DC resistance also adds, reducing tank Q and ring amplitude. There is no universal 50 Ω pass/fail threshold.

## Troubleshooting

| Symptom | Checks |
|---|---|
| No valid pulses | Verify common ground, U1 power/pinout, R2 pull-up, D5 wiring, D8 high-impedance release, coil continuity, and tank voltage. |
| Ring stops immediately | Confirm D8 is not held LOW, check R1 and wiring, use a lower-loss inductor, shorten leads, and verify C1 is actually connected in parallel with Lx. |
| Reading unstable | Check breadboard/contact resistance, coil DCR/Q, C1 tolerance and value, probe loading, comparator threshold/noise, and ringing amplitude. |
| Reading consistently high/low | Verify C1's actual/effective value and units; then compare against a known inductor and document any one-point calibration. |
| Low-inductance readings jump | The resonant frequency is likely too high for `pulseIn()` timing resolution; use a suitable hardware capture/frequency-measurement method and front end. |

## Limits and safety

- This is a **low-voltage educational prototype**, not a calibrated LCR meter. It estimates `L`; it does not measure resistance or capacitance.
- The attachment's 10 µH–100 mH range, “high accuracy,” fixed DCR cutoff, and cost estimate are not verified. Measurement range depends on `C1`, coil Q, frequency, comparator, wiring, Arduino core, and calibration.
- Use only the intended 5 V ATmega328P setup unless the entire circuit is redesigned for another board. Do not connect a 5 V pull-up/output to a 3.3 V-only input.
- Verify the tank waveform and comparator limits before connecting U1. Do not assume D1 protects every input condition.
- Keep the project on isolated, low-energy DC. No mains use. Capacitors can retain charge; coils can generate transients.
- No Arduino toolchain or target hardware was available for build/bench verification in this workspace; the sketch is supplied as a prototype, not as tested firmware.
