# DEPLOYMENT

> Lifecycle: Source → (XC8) Build → `.hex` Artifact → PICkit Flash → Runtime on
> chip. Python tools need no deployment (run from source).

## 1. Firmware deployment (per example)

Prerequisites: [ENVIRONMENT](ENVIRONMENT.md) §2 + wired minimum circuit
([wiring](../01-docs/02-wiring-and-power-basics.md)).

1. Build: F11 → `BUILD SUCCESSFUL`, note the `.hex` path.
2. Connect ICSP (MCLR/VDD/VSS/PGD/PGC), power the board (verify 5 V at pins).
3. Flash: F6 (Run Main Project). First flash programs + runs.
4. Validate on hardware against the file's "Expected" header (LED cadence,
   UART banner @9600, ADC bar, scan output…).
5. For UART examples: connect USB-UART (TX→RX, common GND), open terminal
   9600 8-N-1, confirm traffic; optionally capture with `serial_logger.py`.

## 2. Production configuration

Learning examples ship dev-safe: protections off (`CP/CPD/WRT = OFF`),
`LVP = OFF`, BOR on. Before any "real" use: set `CP/CPD` as needed, confirm
`FOSC` matches the final board osc, enable WDT with a `CLRWDT`/sleep design
(see [watchdog component](components/watchdog-sleep-16f877a.md)).

## 3. Rollback

Re-flash the previous known-good `.hex` (keep released hex files next to the
hardware revision). Data EEPROM survives re-flash unless bulk-erased — the
counter demo intentionally relies on this.

## 4. Python tools

No build/deploy: copy the single `.py` (+ `requirements.txt` for the logger)
to any Python 3.10+ machine and run. Pin `pyserial` in production if desired.
