#!/usr/bin/env python3
"""baud_calc.py — PIC UART baud-rate / SPBRG calculator (no dependencies).

Formulas (async mode):
    BRGH = 0 (low speed)  : baud = Fosc / (64 * (SPBRG + 1))
    BRGH = 1 (high speed) : baud = Fosc / (16 * (SPBRG + 1))

Usage:
    python baud_calc.py --fosc 20000000 --baud 9600
    python baud_calc.py --fosc 8000000 --baud 115200 --brgh 1
    python baud_calc.py --fosc 20000000 --baud 9600 --all   (sweep common bauds)

Exit codes: 0 ok · 2 usage error (non-positive --fosc/--baud).
"""

import argparse

COMMON_BAUDS = (1200, 2400, 4800, 9600, 19200, 38400, 57600, 115200)


def spbrg_for(fosc: int, baud: int, brgh: int) -> tuple[int, float, float]:
    """Return (SPBRG, actual_baud, error_percent)."""
    div = 16 if brgh else 64
    spbrg = round(fosc / (div * baud)) - 1
    spbrg = max(0, min(255, spbrg))
    actual = fosc / (div * (spbrg + 1))
    err = (actual - baud) / baud * 100
    return spbrg, actual, err


def show(fosc: int, baud: int, brgh: int) -> None:
    spbrg, actual, err = spbrg_for(fosc, baud, brgh)
    flag = "OK " if abs(err) < 2.0 else "WARN"
    print(f"[{flag}] Fosc={fosc}  baud={baud}  BRGH={brgh}  -> "
          f"SPBRG={spbrg}  actual={actual:.1f}  error={err:+.2f}%")
    if abs(err) >= 2.0:
        print("      WARNING: error > 2% — UART may be unreliable. "
              "Try the other BRGH or another crystal.")


def main() -> None:
    ap = argparse.ArgumentParser(description="PIC SPBRG / baud calculator")
    ap.add_argument("--fosc", type=int, required=True, help="Oscillator Hz, e.g. 20000000")
    ap.add_argument("--baud", type=int, default=9600, help="Target baud (default 9600)")
    ap.add_argument("--brgh", type=int, choices=(0, 1), default=1, help="BRGH bit (default 1)")
    ap.add_argument("--all", action="store_true", help="Sweep common baud rates")
    args = ap.parse_args()
    if args.fosc <= 0:
        ap.error("--fosc must be a positive integer (Hz)")
    if args.baud <= 0:
        ap.error("--baud must be a positive integer")

    if args.all:
        for b in COMMON_BAUDS:
            show(args.fosc, b, args.brgh)
    else:
        show(args.fosc, args.baud, args.brgh)
        other = 0 if args.brgh else 1
        print("-- comparison with BRGH=%d --" % other)
        show(args.fosc, args.baud, other)


if __name__ == "__main__":
    main()
