#!/usr/bin/env python3
"""serial_logger.py — log PIC UART output to console + timestamped CSV.

Needs: pip install pyserial

Usage:
    python serial_logger.py --port COM3 --baud 9600
    python serial_logger.py --port /dev/ttyUSB0 --baud 9600 --out temp.csv --seconds 60
    python serial_logger.py --list          (show available ports)

Each received line is printed live and appended to CSV as:
    pc_time_iso, elapsed_s, raw_line
Ctrl+C stops cleanly (file is flushed on every line).

Exit codes: 0 ok (incl. Ctrl+C) · 1 pyserial missing · 2 usage/bad input
· 3 serial device failure (cannot open / disconnected mid-run).
"""

import argparse
import csv
import sys
import time
from datetime import datetime, timezone

try:
    import serial
    from serial.tools import list_ports
except ImportError:
    print("ERROR: pyserial is not installed. Run: pip install pyserial",
          file=sys.stderr)
    sys.exit(1)


def list_ports_and_exit() -> None:
    ports = list(list_ports.comports())
    if not ports:
        print("No serial ports found.")
    for p in ports:
        print(f"{p.device}  {p.description or ''}")
    sys.exit(0)


def open_port(port: str, baud: int) -> "serial.Serial":
    """Open the port or exit(3) with a friendly error (never a traceback)."""
    try:
        return serial.Serial(port, baud, timeout=1)
    except serial.SerialException as e:
        print(f"ERROR: cannot open port '{port}': {e}", file=sys.stderr)
        print("Hint: run with --list to see available ports.", file=sys.stderr)
        sys.exit(3)


def main() -> None:
    ap = argparse.ArgumentParser(description="PIC UART serial logger")
    ap.add_argument("--port", default=None, help="Serial port, e.g. COM3 or /dev/ttyUSB0")
    ap.add_argument("--baud", type=int, default=9600, help="Baud rate (default 9600)")
    ap.add_argument("--out", default="pic_log.csv", help="CSV file (default pic_log.csv)")
    ap.add_argument("--seconds", type=float, default=0,
                    help="Stop after N seconds (0 = run until Ctrl+C)")
    ap.add_argument("--list", action="store_true", help="List ports and exit")
    args = ap.parse_args()
    if args.baud <= 0:
        ap.error("--baud must be a positive integer")
    if args.seconds < 0:
        ap.error("--seconds must be >= 0")

    if args.list:
        list_ports_and_exit()
    if not args.port:
        print("ERROR: give a port (--port COM3) or use --list to see ports.",
              file=sys.stderr)
        sys.exit(2)

    ser = open_port(args.port, args.baud)
    print(f"Logging {args.port} @ {args.baud} -> {args.out}  (Ctrl+C to stop)")
    start = time.monotonic()
    n = 0
    exit_code = 0
    try:
        try:
            outfile = open(args.out, "w", newline="", encoding="utf-8")
        except OSError as e:
            print(f"ERROR: cannot write '{args.out}': {e}", file=sys.stderr)
            sys.exit(2)
        with outfile as f:
            wr = csv.writer(f)
            wr.writerow(["pc_time_iso", "elapsed_s", "raw_line"])
            f.flush()
            while True:
                if args.seconds and (time.monotonic() - start) >= args.seconds:
                    break
                try:
                    raw = ser.readline()
                except serial.SerialException as e:
                    print(f"\nERROR: lost device on '{args.port}': {e}",
                          file=sys.stderr)
                    exit_code = 3
                    break
                if not raw:
                    continue
                line = raw.decode("utf-8", errors="replace").strip()
                elapsed = time.monotonic() - start
                now = datetime.now(timezone.utc).isoformat()
                wr.writerow([now, f"{elapsed:.3f}", line])
                f.flush()
                n += 1
                print(f"[{elapsed:8.3f}s] {line}")
    except KeyboardInterrupt:
        print("\nStopped by user.")
    finally:
        ser.close()
    print(f"Saved {n} lines to {args.out}")
    sys.exit(exit_code)


if __name__ == "__main__":
    main()
