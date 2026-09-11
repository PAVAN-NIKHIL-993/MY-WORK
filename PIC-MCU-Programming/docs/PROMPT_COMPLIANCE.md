# PROMPT_COMPLIANCE (§§1–43 + Steps 1–17 → evidence)

> The user prompt has two tracks: §§1–43 (whole-project product track) and
> Steps 1–17 (topic work-package track). This file maps EVERY section to its
> status and evidence. Legend: ✅ done · 🔀 adapted (reason noted) · ➖ N/A
> (reason noted — never padded).

## Track A — §§1–43

| § | Requirement | Status | Evidence |
|---|---|---|---|
| 1 | Understand existing project first | ✅ | Steps 1+3; [ANALYSIS](ANALYSIS.md) from read code; root inspected (1-line README + topic dir) |
| 2 | UX refinement | 🔀 CLI-UX (no GUI exists) | Friendly errors+hints, `--help` everywhere, exit codes; [cli-contracts](api/cli-contracts.md) |
| 2 | Visual design | 🔀 plain-text restraint | No color, ASCII-only output ([ACCESSIBILITY](ACCESSIBILITY.md) §1) |
| 2 | Responsive | ➖ no UI | Markdown docs render anywhere; stated, not padded |
| 3 | Code quality | ✅ | Validation, hints, tests; firmware frozen per recorded [D5](architecture/decisions.md) (no local XC8 = practical reason) |
| 4 | Reliability | ✅ | E1–E4 + mid-run write failure fixed; exit 1/2/3 paths tested incl. live socket + /dev/full |
| 5 | Performance | ✅ | Computed budgets + labeled observations; zero invented numbers ([PERFORMANCE](PERFORMANCE.md)) |
| 6 | Security review | ✅ | Sweeps clean, no secrets, posture in [SECURITY](SECURITY.md) |
| 7 | Accessibility | 🔀 CLI-a11y | stdout/stderr split, exit codes, no color-only signals, N/A reasons ([ACCESSIBILITY](ACCESSIBILITY.md)) |
| 8 | Consistency | ✅ | Unified errors/exits, test-locked ([TESTING](TESTING.md) §3) |
| 9 | Feature completeness | ✅ | All tools test-verified; firmware audit-verified; quiz math computationally verified |
| 10 | Exhaustive docs | ✅ | 58-file `docs/` system, code-grounded |
| 11 | Required structure | 🔀 inside topic folder | All 16 core files + 7 subdirs under `docs/` (not root `/docs` — containment rule) |
| 12 | README | 🔀 topic README | All 16 required elements in [README](../README.md); root README untouched per containment (conflict C1) |
| 13 | Project structure | ✅ | [PROJECT_STRUCTURE](PROJECT_STRUCTURE.md): dirs + file map + full records |
| 14 | Architecture + Mermaid | ✅ | [ARCHITECTURE](ARCHITECTURE.md) + 6 files; diagrams: system, app-flow, capture-seq, ER |
| 15 | Data flow | ✅ | 4 workflows Input→Output + normative byte formats ([data-flow](architecture/data-flow.md)) |
| 16 | Modules | ✅ | 6 docs × 20 fields ([modules](modules/python-tools.md)) |
| 17 | Functions/methods | ✅ | Folded into each [components](components/baud-calc.md) doc (signatures, params, returns, effects) |
| 18 | UI components | ➖ no UI | 17 CLI/firmware programs documented as components/ instead |
| 19 | API | 🔀 no HTTP | UART protocol + CLI contracts + CSV interchange ([api/overview](api/overview.md) maps every template aspect) |
| 20 | Database | 🔀 no RDBMS | EEPROM byte + 2 CSV schemas + ER + lifecycle ([schema](database/schema.md)) |
| 21 | Configuration | ✅ | Full tables; no env vars exist — stated ([CONFIGURATION](CONFIGURATION.md)) |
| 22 | Environment | ✅ | [ENVIRONMENT](ENVIRONMENT.md): PC + firmware + parts |
| 23 | Dependencies | ✅ | 1 dep + stdlib + toolchain ([DEPENDENCIES](DEPENDENCIES.md)) |
| 24 | Development | ✅ | [DEVELOPMENT](DEVELOPMENT.md) + [developer-guide](guides/developer-guide.md) |
| 25 | Build | ✅ | [BUILD](BUILD.md): XC8 procedure, validation, failures |
| 26 | Testing + matrix | ✅ | [TESTING](TESTING.md) + matrix; gaps listed, none hidden |
| 27 | Deployment | ✅ | Flashing-as-deploy + rollback ([DEPLOYMENT](DEPLOYMENT.md)) |
| 28 | Operations | ✅ | Logger ops, rotation math, health checks ([OPERATIONS](OPERATIONS.md)) |
| 29 | Troubleshooting | ✅ | 9 real issues in required format ([TROUBLESHOOTING](TROUBLESHOOTING.md)) |
| 30–32 | Security/Perf/A11y docs | ✅ | [SECURITY](SECURITY.md) · [PERFORMANCE](PERFORMANCE.md) · [ACCESSIBILITY](ACCESSIBILITY.md) |
| 33 | Decisions | ✅ | D1–D9 in required format ([decisions](architecture/decisions.md)) |
| 34 | Changelog | ✅ | [CHANGELOG](CHANGELOG.md), all 7 headings |
| 35 | Doc quality | ✅ | Relative links, tables, code blocks, Mermaid; `check_docs --strict` green |
| 36 | Traceability | ✅ | Implementation links in ARCHITECTURE/modules/components |
| 37 | Coverage audit | ✅ | [DOCUMENTATION_COVERAGE](DOCUMENTATION_COVERAGE.md) + matrix |
| 38 | Final standard (15 Qs) | ✅ | What/Why→README · Architected→ARCHITECTURE · Where→STRUCTURE · Parts→modules/components · Data→data-flow · Functions→components · Configured→CONFIGURATION · Built→BUILD · Tested→TESTING · Deployed→DEPLOYMENT · Operated→OPERATIONS · Debugged→debugging-guide · Break→TROUBLESHOOTING · Modify→DEVELOPMENT/extension · Why→decisions |
| 39 | 16-item verification | ✅ | Table below |
| 40 | Git workflow | 🔀 session branch | Stayed on `arena/…` (environment lock — conflict C2); grouped commits ✅ |
| 41 | Push | ✅ | Session branch pushed, no force-push (merge), unrelated branches untouched |
| 42 | Final review | ✅ | Re-read files, links, snippets, secrets, tests, branch, push — this pass |
| 43 | Final response | ✅ | Step-17 report + this compliance file |

### §39 verification log

| # | Check | Result |
|---|---|---|
| 1 | Dependencies | stdlib ✅; pyserial 3.5 installed ✅ (was missing) |
| 2–3 | Lint / typecheck | mypy/pylint unavailable → recorded unenforced, not pretended |
| 4–6 | Unit / integration / e2e | 28 green; pipeline + socket capture live ✅ |
| 7 | Production build | XC8 absent → documented gap (firmware audit-verified) |
| 8–9 | Fix errors/warnings | 2 found in Step 10 (both fixed + re-verified); 0 warnings introduced |
| 10–11 | Workflows / runtime | All CLI paths incl. failure exits tested ✅ |
| 12 | Responsive | ➖ N/A (no UI) |
| 13–14 | API / storage flows | UART grammar + CSV round-trip tested; HW EEPROM untested here (stated) |
| 15 | Docs vs final code | Re-read pass: counts/math/refs re-verified, 3 corrections applied |
| 16 | Repo audit | Clean tree, ignores proven, secrets clean, containment holds |

## Track B — Steps 1–17

| Step | Status | Evidence |
|---|---|---|
| 1 Understand topic | ✅ | Repo/branch/remote inspected; PIC-MCU scope confirmed with user |
| 2 Topic folder | ✅ | Verified existing, logical, contained |
| 3 Analyze | ✅ | [ANALYSIS](ANALYSIS.md) (E1–E6, F1–F4, debt) |
| 4 Design | ✅ | [DESIGN](DESIGN.md) (goals, F1–F3, D-decisions, risks) |
| 5 Foundation | ✅ | `tests/` skeleton + helpers + fixture |
| 6 Features ×3 | ✅ | Hardening → 28 tests → docs checker, each verified |
| 7 Integration | ✅ | Suite + pipeline + SPBRG cross-checks |
| 8 Refinement | ✅ | stderr consistency, docstrings, dead-code sweep |
| 9 Docs | ✅ | 58 files in 4 batches, link-audited per batch |
| 10–12 Test/Audit/QA | ✅ | Battery green, coverage matrix, strict PASS |
| 13–16 Branch/review/commit/push | ✅ | Session branch, 4 grouped commits, merge (no force), pushed + verified |
| 17 Report | ✅ | Delivered; this file extends it to §§1–43 |

## Conflict resolutions (prompt-vs-prompt / prompt-vs-environment)

- **C1 (§12 root README vs work-package containment):** containment wins —
  the work package's own rule ("equivalent inside the folder exists → outside
  change not necessary") resolves it; topic README carries all §12 elements.
- **C2 (§40 new branch vs session lock):** session branch wins — creating or
  pushing any other branch would orphan this session (disclosed at Step 1).
- **C3 (web-app template vs embedded reality):** adapt + mark N/A with reasons
  (prompt's own "only relevant files" rule); nothing invented.
