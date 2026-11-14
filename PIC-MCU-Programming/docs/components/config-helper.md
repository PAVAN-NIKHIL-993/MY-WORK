# Component: config_helper.py

- **File:** [`05-python-tools/config_helper.py`](../../05-python-tools/config_helper.py) (95 lines) · **Module:** [python-tools](../modules/python-tools.md)
- **Purpose:** print the tested `#pragma config` block for 16F877A / 16F18345 / 18F45K22 (paste at top of `main.c`).
- **Interface:** CLI `--chip` (req, choices) `--osc` (chip-dependent, defaulted) `--list`; exit 0/2; block to stdout, errors to stderr.
- **Internals:** `BLOCKS` dict — `desc`, `oscs` tuple, `block` lines with `{osc}` template (877A only); `main()` validates `osc ∈ oscs` else stderr + exit 2.
- **Deps:** stdlib. **Consumers:** humans scaffolding projects; tests assert 877A ≡ firmware block, 18345 = 5-line set, 18F keeps its "Starter block" label (E6/D8 — enforced by test).
- **State:** none. **Errors:** bad osc → stderr + options + exit 2 (fixed: was stdout).
- **Failure modes:** none at runtime; misuse risk is pasting the 18F starter unverified — mitigated by in-output warning + test lock.
- **Risks:** LOW — block text changes must match datasheet + firmware + tests + [config guide](../../04-advanced/config_word_guide.md).
