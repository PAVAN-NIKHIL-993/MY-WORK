# SETUP

## 1. PC-side (Python tools + tests) — 5 minutes

Requirements: Python 3.10+ on Windows/macOS/Linux (`python --version`).
No compiler, no services, no env vars.

```bash
cd PIC-MCU-Programming
pip install -r 05-python-tools/requirements.txt   # logger only (pyserial)
python -m unittest discover -s tests              # expect: OK (28 tests)
python scripts/check_docs.py                      # expect: PASS
python 05-python-tools/baud_calc.py --fosc 20000000 --baud 9600
```

Linux serial permissions: `sudo usermod -a -G dialout $USER`, then log out/in.

## 2. Firmware side (build + flash) — first time ~45 minutes

Full click-by-click: [`01-toolchain-setup`](../01-docs/01-toolchain-setup.md).
Summary: install MPLAB X IDE → install XC8 → connect PICkit (or use Simulator)
→ New Project (device = the `.c` file's chip) → paste file → **F11 build** →
**F6 flash**. Wire per [`02-wiring`](../01-docs/02-wiring-and-power-basics.md):
5 V + decoupling, MCLR 10k pull-up, ICSP header.

## 3. Verify your setup (checklist)

- [ ] `python -m unittest discover -s tests` → OK (skips ≤7 without pyserial).
- [ ] `python scripts/check_docs.py` → PASS.
- [ ] `blink_16f877a.c` builds (`BUILD SUCCESSFUL`) and the LED blinks.
- [ ] `uart_echo_16f877a.c` shows its banner in a terminal at 9600 8-N-1.

If anything fails: [TROUBLESHOOTING](TROUBLESHOOTING.md) → [BUILD](BUILD.md).
Environment details: [ENVIRONMENT](ENVIRONMENT.md).
