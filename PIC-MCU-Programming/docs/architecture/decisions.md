# Architectural Decisions

> Format: Decision / Context / Options / Reason / Consequences / Revisit-when.
> D1–D4 are inherited from the original build; D5–D9 from this refinement.

**D1 — One standalone `.c` per example (no shared headers).**
Context: learners paste into fresh MPLAB X projects. Options: (a) standalone
files, (b) shared `uart.h`/`delay.h`. Decision: (a). Reason: zero-setup paste
→build→flash beats DRY for teaching; a shared header is a new failure point
(include paths, versions). Consequences: UART helpers duplicated in 3 files
(intentional — see [F2](../ANALYSIS.md)). Revisit when: a multi-file capstone
product (not tutorial) is needed.

**D2 — PIC16F877A as the primary chip, 18345 for modern contrast.**
Context: most learners own 877A hardware; 18345 shows internal-osc/PPS-era
practice. Options: 877A-only / 18345-only / both. Decision: both, 877A-first
(all of stages 3–5), 18345 in basics + porting tables. Reason: matches lab
reality; shows old-vs-new without doubling every file. Consequences: 18F
limited to config-starter. Revisit when: lab hardware changes.

**D3 — Python tools stay single-file, stdlib (+pyserial), no packaging.**
Context: 4 tiny CLIs. Options: (a) standalone scripts, (b) pip package with
shared pkg. Decision: (a). Reason: copy-one-file-and-run; testable via
`importlib`+`subprocess`. Consequences: 3-line arg validation repeated;
acceptable. Revisit when: a 5th+ tool or shared protocol parser appears.

**D4 — `unittest` + subprocess black-box tests, skips over mocks.**
Context: need regression tests with zero new deps. Options: pytest+mocks /
stdlib unittest+subprocess. Decision: stdlib. Reason: runs everywhere,
tests the real user path (`--help`, exit codes). Hardware/pyserial cases
`skipUnless` — honest gaps, not fake greens. Revisit when: async/complex
mocking needs arise.

**D5 — Firmware FROZEN during refinement (this prompt's run).**
Context: audit-passing C + no local XC8. Options: refactor C / freeze C.
Decision: freeze (docs + PC-side only). Reason: any C edit is unverifiable
here; risk without benefit. Consequences: C improvements live as exercises/
extension-guide ideas. Revisit when: XC8 available to rebuild all 13 files.

**D6 — UART text protocol (9600 8-N-1, CSV-ish lines, no framing).**
Context: human-readable bench link. Options: binary+checksum / plain text.
Decision: plain text. Reason: debuggable with any terminal; corruption degrades
to skipped lines. Consequences: no integrity guarantee (stated in
[SECURITY](../SECURITY.md)). Revisit when: noisy/long links or binary sensors.

**D7 — Logger CSV wraps raw lines (`pc_time_iso,elapsed_s,raw_line`).**
Context: need PC timestamps + verbatim device text. Options: parse-then-log /
wrap-raw. Decision: wrap-raw with `csv` quoting. Reason: analyzer stays
compatible with plain `ms,temp` files too; raw text preserved for forensics.
Consequences: `parse_rows` handles two layouts (tested). Revisit when: schema
v2 needed (add column, keep `raw_line` last).

**D8 — 18F45K22 stays a labeled starter, never implied-verified.**
Context: `config_helper` covers 3 chips, firmware covers 2. Options: drop 18F /
mark starter. Decision: mark starter in code + tests assert the label.
Reason: honesty > coverage theater. Revisit when: 18F examples are built on HW.

**D9 — Docs adapt the template to reality (no invented UI/API/DB).**
Context: prompt template assumes a web app. Options: pad N/A sections /
adapt + mark N/A. Decision: adapt (UART=api, EEPROM+CSV=database, CLI=a11y)
and mark the rest N/A with reasons. Reason: accurate > voluminous.
Revisit when: the project gains the corresponding subsystem.
