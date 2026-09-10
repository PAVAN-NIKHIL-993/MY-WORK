# Step 6 — Python Tools (automation + data)

Small helpers that remove guesswork: baud math, UART logging to CSV, config blocks.

## 1. The tools

| File | Needs | What it does |
|---|---|---|
| `baud_calc.py` | stdlib only | SPBRG + error % for any Fosc/baud/BRGH; `--all` sweeps common bauds |
| `serial_logger.py` | `pip install pyserial` | Logs UART lines live to console + timestamped CSV (`--seconds` to auto-stop) |
| `config_helper.py` | stdlib only | Prints the tested `#pragma config` block for 16F877A / 16F18345 / 18F45K22 |
| `requirements.txt` | — | `pyserial>=3.5` (only for the logger) |

## 2. Quick start

```bash
# 0) one-time (for the logger only)
pip install -r requirements.txt

# 1) check your baud settings BEFORE flashing (must be < 2% error)
python baud_calc.py --fosc 20000000 --baud 9600
python baud_calc.py --fosc 8000000 --baud 115200 --all

# 2) find your USB-UART port, then log the PIC's output
python serial_logger.py --list
python serial_logger.py --port COM3 --baud 9600 --out session.csv
python serial_logger.py --port /dev/ttyUSB0 --baud 9600 --out temp.csv --seconds 60

# 3) generate a config block for a new project
python config_helper.py --chip 16F877A --osc HS
python config_helper.py --chip 16F18345
```

## 3. How they connect to the firmware steps

- **Step 4 UART echo** (`uart_echo_…c`): open it in a terminal, or log a session
  with `serial_logger.py` to prove every byte round-trips.
- **Step 5 I2C scanner / SPI loopback**: capture scans with the logger instead
  of copy-pasting from the terminal.
- **Step 7 capstone** (`temp-logger`): the PIC streams `t_ms,temp_c` CSV lines;
  `serial_logger.py` saves them, `analyze_log.py` (in `06-projects/`) reports
  min/max/avg + an ASCII chart.

## 4. Troubleshooting

| Symptom | Check |
|---|---|
| `No serial ports found` | USB-UART plugged in? Driver installed? (CH340/CP2102/FTDI need drivers on Windows) |
| `Permission denied /dev/ttyUSB0` | Linux: `sudo usermod -a -G dialout $USER`, then log out/in |
| Garbage in the log | Baud mismatch — re-run `baud_calc.py`, confirm PIC `_XTAL_FREQ` + SPBRG |
| Empty CSV (headers only) | PIC not transmitting? Check TX→RX crossover + common GND + `SPEN=1` |

Next: **Step 7** — `06-projects/`: the `temp-logger` capstone + checklist + quiz.
