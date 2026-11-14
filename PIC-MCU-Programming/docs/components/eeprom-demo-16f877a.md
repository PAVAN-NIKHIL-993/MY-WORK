# Component: eeprom_demo_16f877a.c

- **File:** [`04-advanced/eeprom_demo_16f877a.c`](../../04-advanced/eeprom_demo_16f877a.c) (86 lines) · **Module:** [firmware-advanced](../modules/firmware-advanced.md)
- **Purpose:** press counter in data EEPROM addr `0x00`, shown binary on RD0–RD3 — survives reset AND power-off. Teaches the unlock sequence + write-cycle discipline.
- **Interface:** button RB1 (10k pull-up, active-low); RD0–RD3 binary nibble (low 4 bits of count).
- **Config:** `CPD = OFF` (required to use data EEPROM freely); `EEPGD=0` selects data (not flash) memory.
- **Functions:** `eeprom_read(u8)→u8` (`EEADR`, `RD=1`, return `EEDATA`); `eeprom_write(u8,u8)` — WR-spin, `WREN=1`, GIE off, `0x55/0xAA` to `EECON2`, `WR=1`, GIE on, `WREN=0`, WR-spin (~4 ms); `button_pressed()` (stage-3 debounce); `main` — restore at boot, increment+store+display per press.
- **State:** the EEPROM byte (persistent, ~1 M-cycle endurance — human-rate only). **Errors:** WR-spin orders back-to-back writes; GIE-off window protects the magic sequence (an ISR between the bytes would silently abort).
- **Failure modes:** value never changes (`EEPGD` wrong / sequence order / `WREN` off during `WR`); wearing out (only if misused for logging — documented).
- **Debug:** re-read after write in Simulator; power-cycle the board (the demo's proof).
- **Extension:** store last PWM/LED state at boot (exercise). **Risks:** MEDIUM (unlock ritual); frozen (D5). Storage spec: [schema](../database/schema.md).
