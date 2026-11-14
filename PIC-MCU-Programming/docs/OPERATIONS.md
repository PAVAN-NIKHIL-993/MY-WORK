# OPERATIONS

## 1. Running the logger (the only long-lived process)

```bash
python 05-python-tools/serial_logger.py --list
python 05-python-tools/serial_logger.py --port <PORT> --baud 9600 \
    --out session.csv --seconds 3600
python 06-projects/analyze_log.py session.csv
```

- Stop: Ctrl+C (exit 0, file flushed every line — safe to kill).
- `--seconds 0` = run forever; prefer explicit durations for unattended runs.
- Growth: ~60 bytes/line → 2 Hz capstone ≈ **10 MB/day**. Rotate dengan `--out
  day1.csv day2.csv…` (no built-in rotation — by design, keep it simple).
- Mid-run USB unplug → `ERROR: lost device…` exit 3; data so far is intact.

## 2. Health checks

| Check | Command / observation | Healthy |
|---|---|---|
| Port visible | `--list` shows your USB-UART | yes |
| PIC alive | terminal shows banner / echo / CSV lines | yes |
| Logger writing | console lines + growing CSV | yes |
| Data sane | `analyze_log.py` min/max plausible | yes |

## 3. Exit codes & logs

Exit codes: [TESTING §3](TESTING.md#3-exit-codes-contract-tested). Tools log to
stdout (data) + stderr (errors); firmware has no logs — its "health endpoint"
is the heartbeat LED + UART stream.

## 4. Maintenance

- Re-run `python -m unittest discover -s tests` + `check_docs.py` after any change.
- Keep one known-good `.hex` per deployed example (rollback).
- No backups needed beyond git (captures are local-only, git-ignored).
