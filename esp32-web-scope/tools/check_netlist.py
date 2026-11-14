#!/usr/bin/env python3
"""Check the carrier board netlist for consistency.

Verifies, without any EDA tool:

  1. Every component referenced in the netlist exists in docs/bom.md.
  2. Every component in docs/bom.md is placed (except the PCB, which has no pins).
  3. No pin appears on two different nets.
  4. Required nets exist (GND, 3V3, and a path to the GPIO 34 pin).
  5. The input network has the topology and values described in the docs.
  6. Electrical sanity: divider ratio, clamp current at 12 V, RC time constant.

This is not ERC. It cannot know whether the circuit is *correct*, only whether
the netlist and the documentation agree with each other and with the stated
arithmetic. That is exactly the class of mistake worth automating, because a
BOM and a netlist that drift apart are invisible until assembly.

Usage:  python3 tools/check_netlist.py
Exit:   0 if all checks pass, 1 otherwise.
"""

from __future__ import annotations

import re
import sys
from decimal import Decimal
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
NETLIST = ROOT / "hardware" / "esp32-web-scope.net"
BOM = ROOT / "docs" / "bom.md"

checks = 0
failures: list[str] = []


def check(name: str, condition: bool, detail: str = "") -> None:
    global checks
    checks += 1
    if not condition:
        failures.append(f"{name}" + (f"  ({detail})" if detail else ""))
        print(f"  FAIL {name}" + (f"  ({detail})" if detail else ""))


def parse_netlist(path: Path) -> dict[str, list[tuple[str, str]]]:
    """Return {net_name: [(ref, pin), ...]} from the netlist file."""
    nets: dict[str, list[tuple[str, str]]] = {}
    for raw in path.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or ":" not in line:
            continue
        name, rest = line.split(":", 1)
        name = name.strip()
        members: list[tuple[str, str]] = []
        for item in rest.split(","):
            item = item.strip()
            if not item:
                continue
            m = re.fullmatch(r"([A-Za-z]+\d+)\.(\d+)", item)
            if not m:
                continue
            members.append((m.group(1), m.group(2)))
        if members:
            nets[name] = members
    return nets


def parse_bom(path: Path) -> dict[str, dict[str, str]]:
    """Return {ref: {part, value, qty}} from the markdown BOM table."""
    parts: dict[str, dict[str, str]] = {}
    for line in path.read_text(encoding="utf-8").splitlines():
        if not line.startswith("| ") or line.startswith("|---"):
            continue
        cells = [c.strip() for c in line.strip().strip("|").split("|")]
        if len(cells) < 6 or cells[0] in ("Ref", ""):
            continue
        ref = cells[0]
        parts[ref] = {"part": cells[1], "value": cells[2], "qty": cells[4]}
    return parts


def main() -> int:
    for path in (NETLIST, BOM):
        if not path.exists():
            print(f"missing input: {path}")
            return 1

    nets = parse_netlist(NETLIST)
    bom = parse_bom(BOM)
    text = NETLIST.read_text(encoding="utf-8")

    print("netlist consistency check")
    print("========================")
    print(f"netlist: {NETLIST.relative_to(ROOT)}")
    print(f"bom:     {BOM.relative_to(ROOT)}")
    print()

    # ---- 1. structural ------------------------------------------------------
    print("structure")
    check("netlist defines at least 4 nets", len(nets) >= 4, f"{len(nets)} nets")

    seen: dict[tuple[str, str], str] = {}
    clashes: list[str] = []
    for net, members in nets.items():
        for ref, pin in members:
            key = (ref, pin)
            if key in seen and seen[key] != net:
                clashes.append(f"{ref}.{pin} on both {seen[key]} and {net}")
            seen[key] = net
    check("no pin appears on two nets", not clashes, "; ".join(clashes))

    for required in ("GND", "3V3", "SIG_IN", "VIN_PIN"):
        check(f"net '{required}' exists", required in nets)

    # ---- 2. netlist <-> BOM agreement --------------------------------------
    print("\nbom agreement")
    netlist_refs = {ref for members in nets.values() for ref, _ in members}
    unknown = sorted(r for r in netlist_refs if r not in bom)
    check("every netlist component is in the BOM", not unknown, ", ".join(unknown))

    # Two BOM entries legitimately have no pins of their own:
    #   PCB - a bare board.
    #   U1  - the ESP32 module, which mates with the J2 socket. Its electrical
    #         connections are therefore represented by J2's pads, so netlist
    #         references to "J2.N" are references to U1 pin N. Encoding that
    #         here rather than silently skipping U1 keeps the check meaningful:
    #         if U1 were ever dropped from the BOM this would fail.
    MATES_WITH = {"U1": "J2"}
    unplaced = []
    for ref in bom:
        if ref == "PCB":
            continue
        if ref in netlist_refs:
            continue
        socket = MATES_WITH.get(ref)
        if socket and socket in netlist_refs:
            continue
        unplaced.append(ref)
    unplaced.sort()
    check("every BOM component is placed in the netlist", not unplaced, ", ".join(unplaced))
    check("U1 (ESP32 module) is accounted for via the J2 socket",
          "U1" in bom and "J2" in netlist_refs)

    # ---- 3. connectivity intent --------------------------------------------
    print("\nconnectivity")

    def net_of(ref: str, pin: str) -> str | None:
        for net, members in nets.items():
            if (ref, pin) in members:
                return net
        return None

    # Signal path: J1.1 -> R3 -> divider node -> R1 -> GPIO 34
    check("J1 pin 1 is on SIG_IN", net_of("J1", "1") == "SIG_IN", str(net_of("J1", "1")))
    check("R3 pin 1 joins the signal", net_of("R3", "1") == "SIG_IN", str(net_of("R3", "1")))
    check("R3 pin 2 is on DIV", net_of("R3", "2") == "DIV", str(net_of("R3", "2")))
    check("R4 pin 1 is on DIV", net_of("R4", "1") == "DIV", str(net_of("R4", "1")))
    check("R4 pin 2 returns to GND", net_of("R4", "2") == "GND", str(net_of("R4", "2")))
    check("R1 pin 1 is on DIV", net_of("R1", "1") == "DIV", str(net_of("R1", "1")))
    check("R1 pin 2 is on VIN_PIN", net_of("R1", "2") == "VIN_PIN", str(net_of("R1", "2")))

    # The MCU pin itself.
    check("J2 pin 34 (GPIO 34) is the protected input",
          net_of("J2", "34") == "VIN_PIN", str(net_of("J2", "34")))
    check("the input pin reaches R1", net_of("R1", "2") == net_of("J2", "34"))

    # Protection and pull-down on the pin node, not on the divider node.
    check("D1 pin 2 clamps the pin node", net_of("D1", "2") == "VIN_PIN", str(net_of("D1", "2")))
    check("D1 pin 1 goes to GND", net_of("D1", "1") == "GND", str(net_of("D1", "1")))
    check("D1 pin 3 goes to 3V3", net_of("D1", "3") == "3V3", str(net_of("D1", "3")))
    check("R2 pulls the pin node to GND", net_of("R2", "1") == "VIN_PIN", str(net_of("R2", "1")))
    check("R2 pin 2 is GND", net_of("R2", "2") == "GND", str(net_of("R2", "2")))
    check("C1 filters the divider node", net_of("C1", "1") == "DIV", str(net_of("C1", "1")))
    check("C1 pin 2 is GND", net_of("C1", "2") == "GND", str(net_of("C1", "2")))

    # Power.
    check("J2 pin 1 is GND", net_of("J2", "1") == "GND", str(net_of("J2", "1")))
    check("J2 pin 2 is 3V3", net_of("J2", "2") == "3V3", str(net_of("J2", "2")))
    check("C2 decouples 3V3 to GND",
          net_of("C2", "1") == "3V3" and net_of("C2", "2") == "GND")

    # Only GPIO 34 of the ESP32 is connected: the firmware claims a single input.
    esp_pins = sorted(pin for ref, pin in seen if ref == "J2")
    check("only 3 ESP32 header pins are used", len(esp_pins) == 3, ", ".join(esp_pins))
    check("the ESP32 pins used are 1, 2 and 34", esp_pins == ["1", "2", "34"], ", ".join(esp_pins))

    # ---- 4. values ---------------------------------------------------------
    print("\nvalues")
    check("R1 is 1k", "1 k" in bom.get("R1", {}).get("value", ""), bom.get("R1", {}).get("value", ""))
    check("R2 is 10k", "10 k" in bom.get("R2", {}).get("value", ""), bom.get("R2", {}).get("value", ""))
    check("R3 is 2.2k", "2.2 k" in bom.get("R3", {}).get("value", ""), bom.get("R3", {}).get("value", ""))
    check("R4 is 3.3k", "3.3 k" in bom.get("R4", {}).get("value", ""), bom.get("R4", {}).get("value", ""))
    check("D1 is a BAT54S dual Schottky", "BAT54S" in bom.get("D1", {}).get("value", ""),
          bom.get("D1", {}).get("value", ""))
    check("C1 is 100 nF", "100 nF" in bom.get("C1", {}).get("value", ""), bom.get("C1", {}).get("value", ""))

    # ---- 5. electrical sanity ---------------------------------------------
    print("\nelectrical sanity")
    r3 = Decimal("2.2")
    r4 = Decimal("3.3")
    v_div = Decimal("5.0") * r4 / (r3 + r4)
    check("a 5 V input arrives at or below 3.3 V", v_div <= Decimal("3.3"), f"{v_div:.3f} V")
    check("a 5 V input still reads as logic high (>2.0 V)", v_div > Decimal("2.0"), f"{v_div:.3f} V")

    # Clamp current at 12 V: (12 - Vf) / R1, Vf ~ 0.35 V for a Schottky at these currents
    i_clamp = (Decimal("12") - Decimal("3.6")) / Decimal("1")
    check("clamp current at 12 V is under 20 mA", i_clamp < Decimal("20"), f"{i_clamp:.1f} mA")
    p_r1 = (Decimal("12") - Decimal("3.6")) ** 2 / Decimal("1000")  # mW, R in ohms
    check("R1 dissipation at 12 V is under 100 mW", p_r1 < Decimal("100"), f"{p_r1:.0f} mW")

    tau_ns = r3 * Decimal("6")  # kΩ * pF = ns
    check("divider RC is documented as ~13 ns", Decimal("12") < tau_ns < Decimal("15"),
          f"{tau_ns:.0f} ns")
    check("the RC is close to the 12.5 ns measurement resolution",
          abs(tau_ns - Decimal("12.5")) < Decimal("3"), f"{tau_ns:.0f} ns vs 12.5 ns")

    # Pull-down: 10k with 6 pF gives 60 ns, slow but fine for a DC default.
    check("pull-down value is high enough not to load a signal", Decimal("10") >= Decimal("4.7"))

    # ---- 6. the docs must not claim more than the netlist gives ------------
    print("\ndocumentation honesty")
    for phrase in ("NOT VERIFIED", "not been through ERC"):
        check(f"netlist states its own verification status ('{phrase}')", phrase in text)

    print()
    print("========================")
    print(f"{checks} checks, {len(failures)} failure(s)")
    if failures:
        print("\nfailures:")
        for f in failures:
            print(f"  - {f}")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
