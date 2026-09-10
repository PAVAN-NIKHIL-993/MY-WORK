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


def main() -> None:
    ap = argparse.ArgumentParser(description="PIC UART serial logger")
    ap.add_argument("--port", default=None, help="Serial port, e.g. COM3 or /dev/ttyUSB0")
    ap.add_argument("--baud", type=int, default=9600, help="Baud rate (default 9600)")
    ap.add_argument("--out", default="pic_log.csv", help="CSV file (default pic_log.csv)")
    ap.add_argument("--seconds", type=float, default=0,
                    help="Stop after N seconds (0 = run until Ctrl+C)")
    ap.add_argument("--list", action="store_true", help="List ports and exit")
    args = ap.parse_args()

    if args.list:
        list_ports_and_exit()
    if not args.port:
        print("ERROR: give a port (--port COM3) or use --list to see ports.",
              file=sys.stderr)
        sys.exit(2)

    ser = serial.Serial(args.port, args.baud, timeout=1)
    print(f"Logging {args.port} @ {args.baud} -> {args.out}  (Ctrl+C to stop)")
    start = time.monotonic()
    n = 0
    try:
        with open(args.out, "w", newline="", encoding="utf-8") as f:
            wr = csv.writer(f)
            wr.writerow(["pc_time_iso", "elapsed_s", "raw_line"])
            f.flush()
            while True:
                if args.seconds and (time.monotonic() - start) >= args.seconds:
                    break
                raw = ser.readline()
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


if __name__ == "__main__":
    main()
