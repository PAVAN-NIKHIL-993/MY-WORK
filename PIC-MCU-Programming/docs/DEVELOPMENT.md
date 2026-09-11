# DEVELOPMENT

## 1. Everyday commands (run from `PIC-MCU-Programming/`)

```bash
python -m unittest discover -s tests     # 26 tests, expect OK
python scripts/check_docs.py             # expect PASS (WARNs ok, FAILs not)
python 05-python-tools/<tool>.py --help  # every tool documents itself
```

## 2. Conventions (must-follow)

1. **Firmware is frozen.** No behavior/pin/timing edits: audit-verified code +
   no local compiler = unverifiable risk. Typo in a comment? Allowed, and note
   it in [CHANGELOG](CHANGELOG.md).
2. **Tools stay standalone single files.** No shared package, no new deps
   (see [D3](../docs/architecture/decisions.md)). Copy-one-file-and-run.
3. **Errors:** `ERROR: <what>. Hint: <fix>` to **stderr**, exit codes
   0 ok · 1 env/no-data · 2 usage · 3 serial-device. Never a bare traceback
   for user-caused failures.
4. **Tests for every behavior change** in `tests/test_<tool>.py`; hardware
   cases skip via `importlib.util.find_spec`, never fail.
5. **Docs updated in the same change** as the code they describe; run
   `check_docs.py` before committing.
6. **Containment:** all topic work inside this folder; root repo files untouched.

## 3. Workflows

- **Add a firmware example:** pick stage folder → standalone `.c` with header
  comment (device/clock/wiring/expected) → extend stage README (table +
  exercise) → add [component doc](components/temp-logger-16f877a.md) →
  reference it from [modules](modules/python-tools.md) → `check_docs.py`.
- **Add/change a tool flag:** argparse + validation (positive ints!) → docstring
  exit codes → tests (valid + invalid + `--help` smoke) → tool README section.
- **Change UART/CSV formats:** update producer + consumer + `sample_temp.csv` +
  tests + [api](api/uart-protocol.md)/[schema](database/schema.md) together.

## 4. Debugging

Python: run the tool directly (small files, plain tracebacks for real bugs);
tests reproduce CLI bugs via `run_cli`. Firmware: MPLAB X debugger + Simulator
watches; start at [debugging-guide](guides/debugging-guide.md).
