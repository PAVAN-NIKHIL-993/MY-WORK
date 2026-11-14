#!/usr/bin/env python3
"""analyze_log.py — stats + ASCII chart for temp-logger captures (stdlib only).

Reads either:
  1. serial_logger.py output (header pc_time_iso,elapsed_s,raw_line where
     raw_line looks like "1500,27.3"), or
  2. a plain two-column CSV "ms,temp" (e.g. stripped from a terminal).

Usage:
    python serial_logger.py --port COM3 --baud 9600 --out temp.csv --seconds 60
    python analyze_log.py temp.csv

Exit codes: 0 ok · 1 no valid samples · 2 unreadable file.
"""

import argparse
import csv
import sys


def parse_rows(path: str) -> list[tuple[int, float]]:
    """Return list of (t_ms:int, temp:float). Skips headers/garbage lines."""
    pts: list[tuple[int, float]] = []
    with open(path, newline="", encoding="utf-8") as f:
        rdr = csv.reader(f)
        for row in rdr:
            if not row:
                continue
            payload = row[-1] if len(row) >= 3 else ",".join(row)
            parts = payload.split(",")
            if len(parts) < 2:
                continue
            try:
                t = int(parts[0].strip())
                temp = float(parts[1].strip())
            except ValueError:
                continue  # header / banner / corrupted line
            pts.append((t, temp))
    return pts


def ascii_chart(pts: list[tuple[int, float]], width: int = 48,
                height: int = 10) -> None:
    temps = [t for _, t in pts]
    lo, hi = min(temps), max(temps)
    span = (hi - lo) or 1.0
    # downsample to `width` columns
    cols = []
    for i in range(width):
        idx = int(i * len(pts) / width)
        cols.append(pts[idx][1])
    print(f"\nTemp chart (each column = one sample slice, "
          f"top={hi:.1f} C, bottom={lo:.1f} C):")
    for r in range(height, -1, -1):
        level = lo + span * r / height
        line = "".join("#" if v >= level else " " for v in cols)
        print(f"{level:6.1f} |{line}|")


def main() -> None:
    ap = argparse.ArgumentParser(description="Analyze temp-logger CSV")
    ap.add_argument("csvfile", help="CSV from serial_logger.py (or plain ms,temp)")
    args = ap.parse_args()

    try:
        pts = parse_rows(args.csvfile)
    except FileNotFoundError:
        print(f"ERROR: file not found: '{args.csvfile}'", file=sys.stderr)
        sys.exit(2)
    except OSError as e:
        print(f"ERROR: cannot read '{args.csvfile}': {e}", file=sys.stderr)
        sys.exit(2)
    if not pts:
        print("No valid 'ms,temp' samples found. Did the PIC stream t_ms,temp_c lines?",
              file=sys.stderr)
        sys.exit(1)

    temps = [t for _, t in pts]
    dur_s = (pts[-1][0] - pts[0][0]) / 1000.0 if len(pts) > 1 else 0.0
    print(f"Samples : {len(pts)}")
    print(f"Duration: {dur_s:.1f} s  (t {pts[0][0]} -> {pts[-1][0]} ms)")
    print(f"Min     : {min(temps):.1f} C")
    print(f"Max     : {max(temps):.1f} C")
    print(f"Average : {sum(temps) / len(temps):.1f} C")
    ascii_chart(pts)


if __name__ == "__main__":
    main()
