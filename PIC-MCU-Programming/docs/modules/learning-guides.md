# Module: learning-guides (`01-docs/` + stage READMEs)

- **Purpose:** the human knowledge layer — concepts, setup, wiring, math, exercises, troubleshooting — that makes firmware files learnable in order.
- **Location:** [`01-docs/`](../../01-docs/00-pic-family-overview.md) (3 guides) + 5 stage READMEs (`02/03/04/05/06`) + [`quiz`](../../06-projects/quiz.md).
- **Responsibilities:** family/chip selection; MPLAB X + XC8 + PICkit setup; minimum circuit + LED/button/UART wiring; per-stage concepts (TRIS/LAT, ISR rules, baud math, pull-ups, WDT); exercises (beginner → stretch); symptom tables.
- **Public interface:** Markdown reading order 01 → 02 → … → 06 → quiz. No code interface.
- **Dependencies:** none (refer to firmware/tools by relative path; verified by `check_docs.py`). **Consumers:** learners; troubleshooting flows; this engineering docs system (which assumes, not repeats, guide content).
- **Internal architecture:** guides teach *why/how*; stage READMEs index *what* (file tables) + *try it* (exercises) + *fix it* (symptom rows).
- **Data/state/config:** none. **Error handling:** n/a (prose) — accuracy enforced by `check_docs.py` links + command re-runs in [TESTING](../TESTING.md).
- **Performance/security:** n/a. **Modification risks:** LOW-MEDIUM — prose rots when code changes: any pin/flag/format change must update the touching guide + stage README in the same commit ([DEVELOPMENT](../DEVELOPMENT.md) rule 5).
- **Extension points:** new guides (e.g. Proteus simulation, PCB layout) slot into `01-docs/` with numeric prefixes; keep the 10-minute-read sizing.
- **Implementation:** [00-overview](../../01-docs/00-pic-family-overview.md) · [01-toolchain](../../01-docs/01-toolchain-setup.md) · [02-wiring](../../01-docs/02-wiring-and-power-basics.md) · stage READMEs (linked from each [module](firmware-basics.md)).
