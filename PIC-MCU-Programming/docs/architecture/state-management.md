# State Management

> Parent: [ARCHITECTURE](../ARCHITECTURE.md). Where state lives, who mutates it,
> and what survives power loss.

## 1. State inventory

| State | Location | Mutated by | Scope | Survives reset? |
|---|---|---|---|---|
| `t0_count`, `int_flag` | RAM (`volatile uint8`) | ISR writes, `main` reads/clears | one run | No |
| `ms_ticks` | RAM (`volatile uint16`) | Timer0 ISR | one run | No (wraps ~65 s — cadence math uses differences, safe) |
| `last` (capstone) | RAM (main-local) | `main` (`+= 500`, drift-free) | one run | No |
| Counter byte | Data EEPROM addr `0x00` | `eeprom_write` on press | device lifetime | **Yes** (until ~1 M writes / bulk erase) |
| CSV captures | PC filesystem | `serial_logger` append | until deleted | Yes (git-ignored by design) |
| Tools | none (stateless) | — | per invocation | n/a |

## 2. Concurrency rules (firmware)

1. ISR ↔ main sharing is **always `volatile`** (3/3 verified).
2. 8-bit reads are atomic; the one 16-bit (`ms_ticks`) read disables GIE
   briefly (`millis()`) — torn-read impossible.
3. ISR never blocks, never touches UART/ADC/EEPROM drivers (all in `main`).
4. EEPROM unlock (`0x55/0xAA` + `WR`) runs with GIE off — an interrupt between
   the two writes would silently abort the write.

## 3. Power-loss semantics

- RAM state: defined boot state (counters 0, LEDs off, UART banner re-sent).
- EEPROM: byte-wise atomic enough for a counter (single-byte write; worst case
  is one lost increment, never corruption of neighbors).
- CSV: per-line flush → at most the in-flight line is lost on kill/power cut;
  header-first layout keeps partial files parseable (`parse_rows` skips junk).
