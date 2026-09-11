# CHANGELOG

> Refinement era (prompt-driven STEPS 1–17). Original build history lives in
> [ROADMAP](../ROADMAP.md) (7 steps, kept as historical record).

## [Unreleased] — product refinement (2026-09-11)

### Added
- `tests/` — 26 automated `unittest` checks (baud math, config blocks, CSV
  parsing, CLI exit codes) + `tests/data/sample_temp.csv` fixture.
- `scripts/check_docs.py` — fails on broken doc links/missing sources.
- `docs/` engineering system (ARCHITECTURE … CHANGELOG + architecture/,
  modules/, components/, api/, database/, testing/, guides/).
- Exit-code contract (0/1/2/3) on all four Python tools.
- `*.log` to `.gitignore`.
- Live `socket://` capture test + `/dev/full` write-failure test (logger now accepts pyserial URLs).

### Changed
- `serial_logger.py`: friendly `ERROR:` + hints on bad port (exit 3),
  mid-run disconnect handling, `--baud/--seconds` validation, CSV-open errors.
- `baud_calc.py`: rejects non-positive `--fosc/--baud` (exit 2).
- `analyze_log.py`: friendly missing-file error (exit 2), full type hints.
- `config_helper.py`: errors to stderr (was stdout), exit codes documented.
- Topic `README.md`: rewritten as product front door + doc index.

### Fixed
- `baud_calc --baud 0` crashed with `ZeroDivisionError` → usage error.
- `analyze_log` on missing file printed a traceback → `ERROR:` + exit 2.
- `serial_logger` on bad port printed a traceback → `ERROR:` + hint + exit 3.
- `serial_logger` mid-run output write failure (e.g. disk full) printed a traceback → `ERROR:` + exit 1.

### Removed
- Nothing (no dead code found; firmware untouched by design).

### Performance
- No changes needed (all budgets have 50×+ headroom; see PERFORMANCE.md).

### Security
- Verified zero secrets/credentials (grep); documented UART/link assumptions.

### Documentation
- See Added (`docs/`). Every claim traced to implementation; coverage audited
  in DOCUMENTATION_COVERAGE.md.
