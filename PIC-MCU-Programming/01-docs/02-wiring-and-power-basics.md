# 02 — Wiring & Power Basics (make it run reliably)

> 80% of "my PIC doesn't work" is wiring, not code. Build this minimal circuit once, reuse forever.

## 1. Minimum circuit (every PIC16/18 project needs this)

```
        +5V o---+--------------------------------------+
                |                                      |
               10kΩ                                    |
                |                                  100nF + 10µF
  PICkit MCLR o-+----[ MCLR ] PIC [ VDD ]----+---||---+--- +5V rail
  PICkit VSS o-------------[ VSS ]     [ VSS ]----+----------+ GND rail
  PICkit PGD o-------------[ PGD/RB7 ]         [ PGC/RB6 ]---o PICkit PGC
```

Checklist for the minimum build:

- [ ] **Every VDD–VSS pair** gets a **100 nF ceramic cap** as close to the pins as possible + one **10 µF** bulk cap on the rail.
- [ ] **MCLR → VDD via 10 kΩ.** Floating MCLR = random resets / won't program. (Add a reset button MCLR→GND if you like.)
- [ ] **All VSS pins to GND**, all VDD pins to +5 V. Don't leave power pins unconnected "because one is enough" — it isn't.
- [ ] **PGC/PGD** routed to the PICkit header, short wires, no heavy loads on RB6/RB7 during programming.
- [ ] Common GND between PIC board, PICkit (if self-powered), and USB-UART module.

## 2. Clock options (pick one)

| Option | Chips | Wiring | `#pragma config FOSC` hint |
|---|---|---|---|
| Internal oscillator (simplest) | 16F18345, 18F45K22 | Nothing! Set `OSCCON` in code | `INTOSC` |
| Crystal 4–20 MHz (accurate UART) | all, esp. 16F877A | Crystal across OSC1–OSC2 + 2× 22 pF caps to GND | `HS` (≥4 MHz) / `XT` (<4 MHz) |
| External RC (rare today) | legacy | Skip unless a tutorial demands it | — |

**Beginner advice:** 16F18345/18F45K22 → internal 8/16 MHz, zero extra parts.
16F877A → 20 MHz crystal + 22 pF caps (it has no good internal oscillator), `FOSC = HS`.

## 3. Outputs: LED the right way

```
  PIC pin o----[ 330Ω ]----|>|----o GND     (active-high: pin=1 → LED on)
```

- Resistor math: `(5 V − 2 V LED) / 10 mA ≈ 300 Ω` → use **220–470 Ω**.
- Limits: **25 mA per pin max**, ~90–200 mA total per chip (see datasheet!). One LED per pin, never drive motors directly — use a transistor/MOSFET.
- Writing outputs: set `TRISx = 0` (output), pin digital (ANSEL/ADCON1), then write `LATx` (or `PORTx` on 16F877A).

## 4. Inputs: button the right way

```
  +5V o----[ 10kΩ ]----+----o PIC pin (reads 1 idle, 0 pressed)
                        |
                       [button]
                        |
                       GND o
```

- Idle HIGH, pressed LOW → enable internal pull-up instead if your chip has it (`OPTION_REG`/`WPUx`) and wire button pin→GND only.
- **Always debounce** in software (~20 ms) — see `02-basics/button.c` in Step 3.
- Never feed > VDD (5.5 V max!) or negative voltages into a pin.

## 5. Analog input preview (for Step 4 ADC)

```
  +5V o----[ 10k pot ]----o GND
                 |
                 wiper o----o AN0/RA0 (PIC16F877A) or ANA0 (16F18345)
```

- Pot wiper gives 0–5 V → ADC reads 0–1023 (10-bit).
- Keep analog wires short, add 100 nF from AN pin to GND if noisy.

## 6. UART wiring preview (for Step 4 + Step 6 Python tools)

```
  PIC TX  o----o RX  USB-UART module
  PIC RX  o----o TX  USB-UART module
  PIC GND o----o GND USB-UART module   (common ground is mandatory!)
```

- **TX→RX crossover**, same baud both sides (9600 to start), 8-N-1.
- 5 V PIC ↔ 5 V-tolerant USB-UART: direct connect. 3.3 V-only modules need level shifting — check your module.

## 7. Power supply rules

- VDD range is typically **4.0–5.5 V** (verify in datasheet; some LF parts go to 1.8 V).
- USB ports / 7805 regulators work; breadboard rails must be **solid** — measure 5 V at the PIC pins, not just at the supply.
- Brown-out reset (`BOREN = ON`) saves you from corrupted EEPROM/RAM on weak supplies.
- Add a power LED (5 V → 1 kΩ → LED → GND) so "is it even powered?" is answered at a glance.

## 8. Common mistakes (memorize this table)

| # | Mistake | Symptom | Fix |
|---|---|---|---|
| 1 | No decoupling caps | Random resets, ADC noise, UART garbage | 100 nF at every VDD pin |
| 2 | MCLR floating | Won't program / random resets | 10 kΩ MCLR→VDD |
| 3 | Pin left in analog mode | Digital read always 0 / LED dead | Clear ANSEL / set ADCON1 for digital |
| 4 | TRIS wrong direction | Pin won't drive / won't read | `1`=input, `0`=output |
| 5 | VSS/VDD pin unconnected | Weird partial behaviour | Wire ALL power pins |
| 6 | PGC/PGD swapped or loaded | Programming fails | Check order, remove heavy RB6/RB7 loads |
| 7 | LED without resistor | Dead LED / dead pin | Always 220–470 Ω |
| 8 | No common GND with UART module | Garbage characters | Tie grounds together |

## ✅ Check yourself (Step 2, part 2)

- [ ] I can draw the minimum circuit (power, MCLR, ICSP) from memory.
- [ ] I know the LED resistor value (330 Ω) and button wiring.
- [ ] My breadboard has decoupling caps + MCLR pull-up installed.

Next: **Step 3** — `02-basics/` first C programs (LED blink, GPIO, button).
