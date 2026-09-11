# BUILD

## 1. Firmware build (per example — the only real "build")

Prerequisites: [ENVIRONMENT](ENVIRONMENT.md) §2 (MPLAB X + XC8 + PICkit).

1. MPLAB X → New Project → Standalone, **Device = the `.c` file's chip**.
2. Tool = PICkit (or Simulator), Compiler = XC8.
3. New C main file → paste the example → **F11 Clean & Build**.
4. Expect `BUILD SUCCESSFUL`; artifact: `dist/.../production/*.hex` (+ `.elf`).
5. **F6** flashes; **Ctrl+F5** debugs.

Build modes: Debug vs Production (project configuration); warnings: add `-Wall`
and fix them (on PICs they usually mean real bugs). No Makefiles/CMake — the
IDE owns the build; each `.c` deliberately has no project files so it pastes
anywhere ([D2](architecture/decisions.md)).

## 2. Python: no build step

Tools run directly (`python 05-python-tools/<tool>.py …`). Syntax gate:
`python -m py_compile` (also exercised implicitly by every test run).

## 3. Build validation

- [ ] `BUILD SUCCESSFUL`, 0 errors (warnings reviewed, none new).
- [ ] Correct device + matching `#pragma config` (never copy blocks across chips).
- [ ] Post-flash behavior matches the file's "Expected" header (LED/UART/ADC…).

## 4. Common build failures

| Failure | Cause | Fix |
|---|---|---|
| Tool/compiler missing | XC8 not installed/detected | Reinstall XC8, restart IDE |
| `Target device ID mismatch` | Wrong device selected | Project Properties → exact chip |
| Config errors on new chip | Copied block from another family | Regenerate via Config Bits GUI / `config_helper.py` |
| Builds, chip dead | `FOSC` ≠ hardware osc | Match crystal/INTOSC (see [TROUBLESHOOTING](TROUBLESHOOTING.md)) |
