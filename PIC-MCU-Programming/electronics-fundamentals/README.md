# Electronics Fundamentals

A standalone, concept-first learning track that accompanies the PIC programming workspace. It explains the circuit ideas behind common components and digital systems; it does **not** add or alter firmware examples.

## Why this folder exists

The uploaded `passive components.html` file is a saved Arena conversation, not a clean article. Its main lesson is titled **“Complete Deep Dive into Electronics”** and ranges well beyond passive parts: from resistors, capacitors, inductors, and diodes through transistors, thyristors, op-amps, the 555 timer, digital logic, memory, and the 8051. This folder extracts that full lesson and its interview-preparation material, while leaving out the saved page's interface and unrelated conversation history.

The source is conversational study material, not an authoritative component datasheet. The explanations below retain its scope but clarify idealized models, correct common oversimplifications, and call out where a device's own datasheet governs.

## Suggested reading order

| Order | Guide | What it covers |
|---:|---|---|
| 1 | [Passive components](01-passive-components.md) | Circuit quantities; resistors, capacitors, inductors, and diodes |
| 2 | [Transistors and thyristors](02-transistors-and-thyristors.md) | BJT and MOSFET switching; SCR, TRIAC, and DIAC power control |
| 3 | [Analog circuits and the 555](03-analog-and-555.md) | Op-amp behavior and configurations; 555 timer modes and timing equations |
| 4 | [Digital logic and memory](04-digital-logic-and-memory.md) | Number systems, gates, sequential logic, arithmetic, and addressing |
| 5 | [The 8051 microcontroller](05-8051-microcontroller.md) | Classic MCS-51 architecture, ports, timers, UART, and interrupts |
| 6 | [Review and practice](06-review-and-practice.md) | Interview-style answers, calculation exercises, and misconception checks |

## Safety before building

- Start with an isolated, current-limited **low-voltage DC** supply. Check the ratings and polarity of every part before connecting it.
- **Do not build the mains TRIAC/SCR dimmer examples on household AC.** Mains can kill and can start a fire. This guide explains the principle only; real mains equipment requires an appropriately certified design, isolation, enclosure, protection, and qualified supervision.
- Capacitors can retain charge after power is removed. Inductors and motors can generate damaging voltage spikes when switched. Use appropriate discharge and clamp/protection methods; never assume a powered-off circuit is safe to touch.
- Never drive a motor, relay coil, or other high-current load directly from a microcontroller pin. Use a correctly rated transistor/driver and protection circuit. Follow the exact PIC's absolute-maximum and recommended operating ratings.
- A breadboard is for low-energy experiments, not high voltage, high current, or safety-critical circuits.

## Quick equation map

| Topic | Starting equation |
|---|---|
| Ohm's law | `V = I R` |
| Electrical power | `P = V I = I²R = V²/R` (resistor forms apply to a resistor) |
| Capacitor charge/current | `Q = C V`; `i = C · dv/dt` |
| RC time constant | `τ = R C` |
| Inductor voltage/energy | `v = L · di/dt`; `E = ½ L I²` |
| Inductive reactance | `X_L = 2πfL` |
| Capacitive reactance | `X_C = 1/(2πfC)` |
| Non-inverting op-amp (ideal closed loop) | `Aᵥ = 1 + Rf/Rg` |
| Inverting op-amp (ideal closed loop) | `Aᵥ = −Rf/Rin` |
| 555 monostable (common approximation) | `t ≈ 1.1 R C` |
| 555 astable (common basic circuit) | `f ≈ 1.44 / ((RA + 2RB) C)` |
| Address capacity | `n` address bits select at most `2ⁿ` distinct locations |

These equations use idealized circuit models unless a guide says otherwise. Units, operating conditions, loading, tolerances, and device limits matter.

## Related PIC workspace material

- [PIC wiring and power basics](../01-docs/02-wiring-and-power-basics.md) — decoupling, LEDs, buttons, ADC wiring, and safe MCU connections.
- [PIC programming workspace](../README.md) — firmware stages, project setup, and documentation index.
- [LC inductance-meter prototype](../lc-inductance-meter/README.md) — optional Arduino/LM393 application of LC resonance; its limitations and unverified status are explicit.
- This track is supplementary theory: the existing code examples target PIC16 devices, not the 8051, and no new hardware behavior is implied or claimed here.
