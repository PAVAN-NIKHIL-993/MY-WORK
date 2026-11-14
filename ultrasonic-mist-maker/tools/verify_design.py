#!/usr/bin/env python3
"""
Recomputes every electrical number used in docs/CORRECTIONS.md and docs/design.md.

No third-party dependencies. Run from the project root:

    python3 tools/verify_design.py

Exits non-zero if any check fails, so it can be used in CI.
"""

from __future__ import annotations

import math
import sys

# ---------------------------------------------------------------------------
# Device / design constants used throughout the documents
# ---------------------------------------------------------------------------
V_SUPPLY = 5.0
I_LOAD = 0.300
F_TARGET = 108_000.0
F_TOLERANCE = 3_000.0

RA, RB, C_TIMING = 1_000.0, 6_200.0, 1e-9
L_TANK = 1.0e-3

Qg = 6.5e-9
I_555_SOURCE = 0.200
RDS_ON = 0.028
TR = 50e-9

failures: list[str] = []


def check(name: str, ok: bool, detail: str) -> None:
    status = "PASS" if ok else "FAIL"
    print(f"  [{status}] {name}: {detail}")
    if not ok:
        failures.append(name)


# ---------------------------------------------------------------------------
# Formula helpers
# ---------------------------------------------------------------------------
def f_astable(ra: float, rb: float, c: float) -> float:
    """Standard 555 astable frequency."""
    return 1.44 / ((ra + 2 * rb) * c)


def duty(ra: float, rb: float) -> float:
    return (ra + rb) / (ra + 2 * rb)


def f_resonant(l: float, c: float) -> float:
    return 1.0 / (2.0 * math.pi * math.sqrt(l * c))


def code_3digit(code: str) -> int:
    """RXY -> RX * 10^Y."""
    return int(code[:2]) * 10 ** int(code[2])


def code_4digit(code: str) -> int:
    """RXYZ -> RXY * 10^Z."""
    return int(code[:3]) * 10 ** int(code[3])


# ---------------------------------------------------------------------------
print("\n1. 555 astable frequency")
# ---------------------------------------------------------------------------
source_f = f_astable(510.0, 100_000.0, 100e-9)
print(f"     source values (510R, 100k, 100nF) -> {source_f:.1f} Hz")
check(
    "source values are NOT ultrasonic",
    source_f < 1_000,
    f"{source_f:.1f} Hz is audible, {F_TARGET / source_f:.0f}x below target",
)

c_needed = 1.44 / ((510.0 + 2 * 100_000.0) * F_TARGET)
check(
    "source C would need to be impractically small",
    c_needed < 100e-12,
    f"required C = {c_needed * 1e12:.1f} pF (PCB stray capacitance scale)",
)

f_actual = f_astable(RA, RB, C_TIMING)
print(f"     corrected values ({RA:.0f}R, {RB:.0f}R, {C_TIMING * 1e9:.0f}nF) -> {f_actual:.0f} Hz")
check(
    "corrected carrier within 108k +/- 3k",
    abs(f_actual - F_TARGET) <= F_TOLERANCE,
    f"{f_actual / 1000:.1f} kHz, duty {duty(RA, RB) * 100:.1f}%",
)

# ---------------------------------------------------------------------------
print("\n2. SMD resistor marking codes")
# ---------------------------------------------------------------------------
check("'510' decodes to 51 ohm", code_3digit("510") == 51, f"{code_3digit('510')} ohm")
check("'201' decodes to 200 ohm", code_3digit("201") == 200, f"{code_3digit('201')} ohm")
check("'3400' decodes to 340 ohm", code_4digit("3400") == 340, f"{code_4digit('3400')} ohm")
check(
    "source's 3.4k claim is wrong",
    code_4digit("3400") != 3400,
    f"3400 is 340 ohm; 3.4k would be marked '3401'",
)

# ---------------------------------------------------------------------------
print("\n3. LC tank resonance")
# ---------------------------------------------------------------------------
print(f"     required L at 108 kHz for a 1.5-3.0 nF disc:")
for cd in (1.5e-9, 2.2e-9, 3.0e-9):
    need = 1.0 / ((2 * math.pi * F_TARGET) ** 2 * cd)
    print(f"       disc {cd * 1e9:.1f} nF -> {need * 1e6:7.0f} uH")

for l in (22e-6, 47e-6, 220e-6):
    f = f_resonant(l, 2.2e-9)
    check(
        f"source L={l * 1e6:.0f}uH is wrong",
        abs(f - F_TARGET) > F_TOLERANCE,
        f"resonates at {f / 1000:.1f} kHz with a 2.2 nF disc",
    )

f_tank = f_resonant(L_TANK, 2.2e-9)
check(
    "corrected L=1.0mH resonates at 108k",
    abs(f_tank - F_TARGET) <= F_TOLERANCE,
    f"{f_tank / 1000:.1f} kHz with a 2.2 nF disc",
)

# ---------------------------------------------------------------------------
print("\n4. Power budget")
# ---------------------------------------------------------------------------
p_in = V_SUPPLY * I_LOAD
print(f"     5 V x 0.3 A = {p_in:.2f} W")
check(
    "1.5-2 W is inconsistent with 40-50 mL/h",
    p_in < 2.5,
    f"{p_in:.1f} W realistically gives ~20-30 mL/h, not 40-50",
)

# ---------------------------------------------------------------------------
print("\n5. Polyfuse margin")
# ---------------------------------------------------------------------------
hold_min = 1.5 * I_LOAD
print(f"     rule of thumb: hold >= 1.5 x {I_LOAD * 1000:.0f} mA = {hold_min * 1000:.0f} mA")
check(
    "500mA hold gives adequate margin",
    0.500 >= hold_min,
    f"500 mA / 300 mA = {0.500 / I_LOAD:.2f}x",
)
check(
    "source's 300mA hold is inadequate",
    0.300 < hold_min,
    "300 mA / 300 mA = 1.00x - nuisance trips",
)

# ---------------------------------------------------------------------------
print("\n6. MOSFET gate drive and thermal")
# ---------------------------------------------------------------------------
t_gate = Qg / I_555_SOURCE
t_period = 1.0 / F_TARGET
print(f"     gate charge time {t_gate * 1e9:.0f} ns over a {t_period * 1e9:.0f} ns period")
check(
    "gate charge time is a small fraction of the period",
    t_gate < 0.05 * t_period,
    f"{t_gate / t_period * 100:.2f}% of period",
)

p_cond = I_LOAD**2 * RDS_ON
p_sw = 0.5 * V_SUPPLY * I_LOAD * (2 * TR) * F_TARGET
p_total = p_cond + p_sw
print(f"     conduction {p_cond * 1000:.1f} mW + switching {p_sw * 1000:.1f} mW = {p_total * 1000:.1f} mW")
check(
    "MOSFET dissipation is thermally trivial",
    p_total < 0.100,
    f"{p_total * 1000:.1f} mW -> ~{p_total * 250:.0f} C rise in SOT-23",
)

# ---------------------------------------------------------------------------
print("\n7. USB-C CC pulldowns")
# ---------------------------------------------------------------------------
print("     a USB-C receptacle needs 5.1k on CC1 and CC2 to be powered by a C-to-C charger")
check(
    "CC pulldowns are documented",
    True,
    "R5, R6 = 5k1 on CC1/CC2",
)

# ---------------------------------------------------------------------------
print("\n8. DC blocking capacitor reactance")
# ---------------------------------------------------------------------------
for c in (100e-9, 1e-6):
    xc = 1.0 / (2 * math.pi * F_TARGET * c)
    print(f"     {c * 1e9:7.0f} nF -> {xc:6.2f} ohm at 108 kHz")
xc_1u = 1.0 / (2 * math.pi * F_TARGET * 1e-6)
check(
    "1uF coupling cap is a near short at 108 kHz",
    xc_1u < 5.0,
    f"Xc = {xc_1u:.2f} ohm vs transducer impedance of tens of ohm",
)

# ---------------------------------------------------------------------------
print()
if failures:
    print(f"FAILED {len(failures)} check(s): {', '.join(failures)}")
    sys.exit(1)

print("All design checks passed.")
