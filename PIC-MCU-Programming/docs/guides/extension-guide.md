# Extension Guide (growing the workspace without breaking it)

> Rules: [DEVELOPMENT](../DEVELOPMENT.md) conventions · [D1–D9](../architecture/decisions.md).

## 1. Add a firmware example (new peripheral/pattern)

1. Choose the stage folder (or justify a new one); write ONE standalone `.c`
   with the standard header (device/clock/wiring/expected) + matching `#pragma`.
2. Build with `-Wall` on XC8; verify behavior on hardware per header.
3. Stage README: file-table row + concept note + ≥1 exercise + symptom row.
4. New [component](../components/temp-logger-16f877a.md) doc; link from the
   [module](../modules/firmware-advanced.md) + [PROJECT_STRUCTURE](../PROJECT_STRUCTURE.md).
5. `check_docs.py --strict` must pass (no unreferenced sources).

## 2. Add a Python tool (or flag)

1. Keep it a single file, stdlib-only unless hardware I/O (pyserial precedent).
2. Follow the CLI contract: `--help`, validation, stderr+hint errors, exit codes.
3. `tests/test_<tool>.py` mirroring [test-cases](../testing/test-cases.md) style;
   skip (never mock) hardware-dependent paths.
4. Tool README + component + [cli-contracts](../api/cli-contracts.md) + CHANGELOG.

## 3. Add a sensor to the capstone (e.g. BME280 over I2C)

1. Prototype talk in a scratch `.c` using the [i2c-scanner](../components/i2c-scanner-16f877a.md) pattern.
2. Change ONLY the `adc → units` line shape in `temp_logger` (or fork it as
   `env_logger.c` — preferred: keeps the LM35 path intact).
3. If the UART line gains fields: update `parse_rows` + fixture + tests +
   [uart-protocol](../api/uart-protocol.md) + [schema](../database/schema.md) atomically.

## 4. Add a chip family (e.g. PIC18F exemplars)

1. Prove the `#pragma` block on hardware first (replaces the 18F starter, D8).
2. Port one basic + one intermediate example; keep 877A files untouched.
3. Add family column to porting tables + [ENVIRONMENT](../ENVIRONMENT.md) + [BUILD](../BUILD.md).

## 5. Contracts you must not silently break

UART 9600 lines · CSV column order (`raw_line` last) · exit codes · one-file
firmware rule · zero-new-deps without a recorded decision. Break one only via a
new [decision](../architecture/decisions.md) entry + major CHANGELOG note.
