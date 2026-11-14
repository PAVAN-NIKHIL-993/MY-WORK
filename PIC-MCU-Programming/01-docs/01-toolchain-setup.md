# 01 — Toolchain Setup (MPLAB X + XC8 + PICkit)

> Goal: go from zero to a blinking LED project that compiles. ~30–45 min first time.

## 1. Install the software (all free)

| # | Tool | Where | Notes |
|---|---|---|---|
| 1 | **MPLAB X IDE** (v6.x) | microchip.com/mplabx | The editor + project manager + debugger. Install FIRST |
| 2 | **MPLAB XC8 compiler** (Free mode is fine) | microchip.com/xc8 | C compiler for 8-bit PICs. MPLAB X finds it automatically |
| 3 | **PICkit 3/4/5 drivers** | come with MPLAB X | Just plug the PICkit in; MPLAB X handles the rest |
| 4 | **Python 3.10+** (for Step 6 tools) | python.org | Check `python --version`. Needed only from Step 6 |
| 5 | *(Optional)* Proteus / MPLAB Simulator | — | No hardware? Use MPLAB X's built-in **Simulator** (free, already installed) |

**Linux users:** also install `libusb` + udev rules per Microchip's README; run MPLAB X installer with `sudo ./MPLABX-*.sh`.
**Windows users:** default install paths are fine; restart the IDE after installing XC8.

## 2. Create your first project (click-by-click)

1. MPLAB X → **File → New Project → Microchip Embedded → Standalone Project → Next**.
2. **Device:** select your chip, e.g. `PIC16F877A` → Next.
3. **Tool:** select your connected tool:
   - Real hardware → `PICkit3/4/5`.
   - No hardware → `Simulator` (you can still compile + simulate).
4. **Compiler:** select `XC8` → Next.
5. **Project name:** `blink` (no spaces), location anywhere → Finish.
6. Right-click **Source Files → New → C Main File** → name it `main.c` → Finish.
7. Paste a Step-3 example (e.g. `02-basics/blink.c`) into `main.c`.
8. Press **F11 (Clean & Build)** — output should end with `BUILD SUCCESSFUL`.

## 3. Flash to hardware (PICkit)

Wiring needed on your board (details in `02-wiring-and-power-basics.md`):

| PICkit pin | Goes to |
|---|---|
| `MCLR` | PIC `MCLR` pin |
| `VDD` | PIC `VDD` (+5 V) — or power board separately and connect grounds |
| `VSS` | PIC `VSS` (GND) |
| `PGD` | PIC `PGD` pin |
| `PGC` | PIC `PGC` pin |

Then in MPLAB X: **Run → Run Main Project (F6)**. First flash programs the chip;
LED should blink. Use **Debug → Debug Main Project (Ctrl+F5)** to single-step and watch variables.

> ⚠️ Flashing fails 90% of the time for 3 reasons: (1) wrong device selected,
> (2) MCLR floating (no 10 kΩ pull-up), (3) PGC/PGD swapped. Check these first.

## 4. No hardware? Use the Simulator

1. Project Properties → **Conf → Hardware Tool → Simulator**.
2. **Debug → Debug Main Project** — code runs virtually.
3. **Window → Debugging → Watches** → add `PORTB` to see bits toggle.
4. **Window → Simulator → Logic Analyzer** (pins) for UART/PWM visualization later.

The Simulator is enough for Steps 2–4 logic; real hardware is recommended from UART/ADC onward.

## 5. Project settings that matter (XC8)

- **Project Properties → XC8 Compiler → Optimization:** Free mode = `-O1`. Fine for learning.
- **XC8 Linker → Heap size:** leave default; avoid `malloc` on PICs (RAM is tiny).
- **Conf → XC8 Compiler → Additional options:** add `-Wall` to see all warnings. Fix warnings — on PICs they often mean real bugs (truncation, bank issues).
- After changing device: **always** update `#pragma config` block — configs differ per chip!

## 6. Suggested MPLAB X workflow (fast loop)

```
Edit code → F11 (build) → F6 (run/flash) → observe LED/behaviour
→ Ctrl+F5 (debug) if broken → set breakpoint → inspect Watches
→ fix → repeat
```

Keyboard shortcuts worth memorizing: `F11` build · `F6` run · `Ctrl+F5` debug · `F5` continue · `F7` step-into · `F8` step-over.

## 7. Verify your install (checklist)

- [ ] MPLAB X opens; XC8 listed under **Tools → Options → Embedded → Build Tools**.
- [ ] Sample `blink` project builds with `BUILD SUCCESSFUL`.
- [ ] PICkit detected (or Simulator selected) — device ID reads correctly.
- [ ] `python --version` ≥ 3.10 (for Step 6; can wait).

## 8. Troubleshooting quick table

| Symptom | Most likely cause | Fix |
|---|---|---|
| `cannot find -lpic` / build tool missing | XC8 not installed or not detected | Reinstall XC8 → restart MPLAB X |
| `Target device ID does not match` | Wrong device in project | Project Properties → Device → select exact chip |
| `Programming failed` | Power/MCLR/ICSP wiring | Check 5 V, GND, MCLR pull-up, PGC/PGD order |
| Code runs in Simulator, not on board | Config bits (oscillator) wrong | `#pragma config FOSC` must match your crystal/internal osc |
| LED never lights, code flashes fine | ANSEL analog / TRIS input | Set pin digital + `TRISx = 0`, check LED polarity + resistor |

Next: `02-wiring-and-power-basics.md` — wire the chip so it runs reliably, then start Step 3 code.
