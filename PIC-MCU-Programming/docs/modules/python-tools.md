# Module: python-tools (`05-python-tools/`)

- **Purpose:** remove bench guesswork: validate baud math pre-flash, capture UART to CSV, print safe config blocks.
- **Location:** [`05-python-tools/`](../../05-python-tools/README.md) — 3 tools + `requirements.txt` + README.
- **Responsibilities:** `baud_calc` (SPBRG + error%, `<2%` gate); `serial_logger` (UART→console+CSV, Ctrl+C-safe); `config_helper` (3-chip `#pragma` printer).
- **Public interface:** CLIs with `--help`; exit codes 0/1/2/3 ([TESTING](../TESTING.md)); stdout=data, stderr=diagnostics.
- **Dependencies:** stdlib everywhere; `pyserial>=3.5` for the logger only. **Consumers:** humans at the bench; capstone capture step; tests (26 checks).
- **Internal architecture:** 3 standalone scripts (D3); `spbrg_for()` pure math; logger = open→loop→flush/line; helper = `BLOCKS` dict + template `.format(osc=…)`.
- **Data:** SPBRG ints + error floats; CSV rows; config text lines. Stateless across runs.
- **Error handling:** positive-int validation; `SerialException`→exit 3; `OSError`→exit 2; missing pyserial→exit 1. All covered by tests.
- **Performance:** I/O-bound trivial; per-line flush is free at serial rates.
- **Security:** no shell, no `eval`; port bytes treated untrusted (`errors="replace"`); logger overwrites `--out` (documented).
- **Configuration:** CLI args only ([CONFIGURATION](../CONFIGURATION.md)); no env/config files.
- **Failure modes:** wrong port (exit 3 + `--list` hint); garbage (baud mismatch — re-run `baud_calc`); perms (`dialout`).
- **Debugging:** `--help` → `--list` → short `--seconds` capture → `head` CSV.
- **Extension points:** a 5th tool would trigger shared-pkg reconsideration (D3); CSV rotation lives with the user (by design).
- **Modification risks:** LOW — but keep exit-code contract + README + tests in sync on any flag change.
- **Implementation:** [baud-calc](../components/baud-calc.md) · [serial-logger](../components/serial-logger.md) · [config-helper](../components/config-helper.md).
