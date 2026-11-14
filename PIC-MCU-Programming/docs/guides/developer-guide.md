# Developer Guide (end-to-end workflows)

> Conventions: [DEVELOPMENT](../DEVELOPMENT.md). Debug flows: [debugging-guide](debugging-guide.md).
> Growth paths: [extension-guide](extension-guide.md).

## 1. First hour (new contributor)

1. Read topic [README](../../README.md) → [ARCHITECTURE](../ARCHITECTURE.md) → this guide.
2. `pip install -r 05-python-tools/requirements.txt` (if you have hardware; else skip).
3. `python -m unittest discover -s tests` → green (≤5 skips OK).
4. `python scripts/check_docs.py` → PASS.
5. Flash one example (`blink_16f877a.c`) to touch the firmware side.

## 2. Change recipe (any change, no exceptions)

1. **Code + tests + docs in one commit** (a flag without a test, or a test
   without a doc line, is incomplete).
2. Keep the contracts: exit codes ([TESTING](../TESTING.md)), UART lines
   ([uart-protocol](../api/uart-protocol.md)), CSV columns ([schema](../database/schema.md)).
3. Run: full suite + `check_docs.py` (+ `--strict` before release).
4. Update [CHANGELOG](../CHANGELOG.md) under the right heading.
5. Re-read your diff: no `TODO`s, no stray prints, no firmware behavior drift.

## 3. Tool change checklist

- [ ] argparse + validation (positive ints; choices tuples) + docstring exits
- [ ] stderr for errors, stdout for data; hint included
- [ ] `tests/test_<tool>.py`: happy path + each exit code + `--help` smoke
- [ ] Tool README section + [component](../components/baud-calc.md) + [cli-contracts](../api/cli-contracts.md) synced

## 4. Firmware change checklist (only with XC8 available — D5)

- [ ] Header comment (device/clock/wiring/expected) matches reality
- [ ] `#pragma` regenerated for the exact chip (never copied across families)
- [ ] Builds with `-Wall`, zero new warnings; behaves per header on hardware
- [ ] Stage README + [component](../components/temp-logger-16f877a.md) + affected
  [api](../api/uart-protocol.md)/[schema](../database/schema.md) synced
