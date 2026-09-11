# Component: serial_logger.py

- **File:** [`05-python-tools/serial_logger.py`](../../05-python-tools/serial_logger.py) (133 lines) · **Module:** [python-tools](../modules/python-tools.md)
- **Purpose:** UART → console + timestamped CSV (`pc_time_iso,elapsed_s,raw_line`), flushed per line, Ctrl+C-safe. The pipeline's capture stage.
- **Interface:** CLI `--port` (req unless `--list`) `--baud` (def 9600, >0) `--out` (def `pic_log.csv`) `--seconds` (def 0=forever, ≥0) `--list`; exits 0/1/2/3.
- **Functions:** `list_ports_and_exit()`; `open_port(port,baud)` — `SerialException`→stderr+hint, exit 3; `main()` — validate → open → header → `readline` loop (decode `errors="replace"`, monotonic clock, UTC ISO time, flush/line) → count summary. `KeyboardInterrupt`→clean exit 0; mid-run `SerialException`→exit 3, partial CSV kept.
- **Deps:** `pyserial>=3.5` (only third-party dep); missing → exit 1 with install hint. **Consumers:** humans, capstone runs, `analyze_log.py` (via CSV).
- **State:** output CSV (append-only during run; overwritten per run — documented).
- **Errors:** all in [error-handling](../architecture/error-handling.md); no tracebacks for user/device faults (fixed E1/E2); mid-run write failure → exit 1.
- **Perf:** I/O-bound; flush/line free at serial rates. **Security:** port bytes untrusted (replace-on-decode, CSV quoting); no shell.
- **Failure modes:** exit 3 (port busy/wrong/perms — `--list` first); unwritable `--out` (disk full — exit 1); garbage (baud mismatch — `baud_calc` first).
- **Debug:** `--list` → 5 s `--seconds` capture → `head` CSV. **Risks:** LOW-MEDIUM (only HW-dependent tool); flag changes need tests+README sync.
