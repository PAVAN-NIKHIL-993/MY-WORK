# 00 — PIC Family Overview (what to know before coding)

> Read time: ~10 min. Goal: pick the right PIC and understand its building blocks.

## 1. What "PIC" means

**PIC = Peripheral Interface Controller** — Microchip's family of microcontrollers.
Almost everything in this workspace targets the **8-bit** PICs (PIC10 / PIC12 / PIC16 / PIC18).
They are small, cheap, 5 V-tolerant-friendly, and excellent for learning bare-metal C.

## 2. The families at a glance

| Family | Example | Flash | RAM | Use it when… |
|---|---|---|---|---|
| PIC10F | PIC10F200 | 256 W – 1.5 KW | 16–256 B | Tiny 6-pin jobs: blinkers, small glue logic |
| PIC12F | PIC12F675 | 1–3.5 KW | 64–256 B | 8-pin sensor nodes, needs ADC |
| **PIC16F (mid-range)** | **PIC16F877A** ⭐ classic | 8 KW | 368 B | Learning, school/college labs, tons of tutorials |
| **PIC16F1xxx (enhanced mid-range)** | **PIC16F18345** ⭐ modern | 14–28 KB | 1–2 KB | New designs: internal osc, PPS, more peripherals |
| **PIC18F** | **PIC18F45K22** ⭐ modern | 16–128 KB | 768 B–4 KB | Bigger C programs, more RAM, advanced peripherals |

⭐ = devices used in this workspace. All Step-3+ examples state the exact device + clock at the top.

**Rule of thumb:** learning → `PIC16F877A`; new/simple real project → `PIC16F18345`;
needs more memory/C horsepower → `PIC18F45K22`.

## 3. What's inside a PIC (the 6 blocks you must know)

1. **CPU** — runs your C code. 8-bit data bus, RISC (few, fast instructions).
2. **Flash (program memory)** — holds your compiled `.hex`. Written via PICkit programmer.
   Measured in "words" on PIC16 (1 word = 14 bits) — `8 KW` ≈ 14 KB of PC-file bytes. Don't overthink; the IDE shows % used.
3. **RAM (data memory)** — variables while running. Small! (368 bytes on 16F877A). Use `uint8_t`, avoid big arrays/`printf`.
4. **EEPROM (data)** — bytes that survive power-off (store settings, calibration). Not on every chip — check datasheet.
5. **Peripherals** — GPIO, Timer0/1/2, CCP/PWM, ADC (10-bit), USART/EUSART, I2C/SPI (MSSP), comparators, watchdog (WDT).
6. **Clock system** — everything is timed from this:
   - `Fosc` = oscillator frequency (e.g. 8 MHz internal, 20 MHz crystal).
   - Instruction clock `Fcy = Fosc / 4` → at 8 MHz you get 2 MIPS (2 million instructions/sec).
   - PIC16F877A: needs external crystal for high speed (has no accurate internal osc).
   - PIC16F18345 / PIC18F45K22: good internal oscillator — fewer parts needed.

## 4. Pins you will meet on every project

| Pin / group | Purpose |
|---|---|
| `VDD`, `VSS` | Power (+5 V / GND). Every VDD pin gets a 100 nF cap to GND (see `02-wiring…`) |
| `MCLR` | Master clear (reset). Pull to VDD via 10 kΩ, or it never runs |
| `OSC1/OSC2` (or `OSC1/CLKIN`) | Crystal/resonator if using external clock |
| `PGC / PGD` (+ MCLR) | ICSP programming pins → PICkit |
| `PORTA…PORTE` | GPIO + shared analog/peripheral pins. `ANx` = analog-capable, check `ADCON1`/`ANSEL` to make digital! |
| `TX/CK`, `RX/DT` | UART pins for serial (Step 4 + Python tools) |

## 5. Config words (fuses) — 30-second version

Before `main()` runs, the chip reads **configuration words**: oscillator choice, watchdog on/off,
code protection, `MCLR` enable. In XC8 you set them with `#pragma config`:

```c
// Example: PIC16F877A, 20 MHz crystal, watchdog OFF
#pragma config FOSC = HS     // HS oscillator (crystal ≥ 4 MHz)
#pragma config WDTE = OFF    // watchdog timer OFF (ON later in Step 5)
#pragma config PWRTE = ON    // power-up timer ON (safer startup)
#pragma config BOREN = ON    // brown-out reset ON (safer on weak supplies)
#pragma config LVP = OFF     // low-voltage programming OFF (use PICkit normally)
```

Every example in this workspace ships with a tested config block — copy it, don't guess.

## 6. How to read a datasheet (the only 5 sections beginners need)

1. **Pin diagram + pin table** — find VDD/VSS/MCLR/PGC/PGD first.
2. **Memory organization** — Flash/RAM/EEPROM sizes.
3. **Oscillator module** — which clock modes exist.
4. **The peripheral chapter you need** (GPIO → Timers → USART → ADC → CCP/PWM).
5. **Electrical specs** — max current per pin (25 mA), total limits, VDD range.

Datasheets: search Microchip.com for `PIC16F877A datasheet` / `PIC16F18345 datasheet` / `PIC18F45K22 datasheet` (PDF, free).

## 7. Key terms cheat-sheet

| Term | Meaning |
|---|---|
| `TRISx` | Direction register: `1` = input, `0` = output. Mnemonic: **1 looks like I (nput)** |
| `PORTx` / `LATx` | Read inputs on `PORTx`; **write outputs to `LATx`** (avoids read-modify-write bugs; PIC18/16F1xxx have LATx) |
| `ANSELx` / `ADCON1` | Selects analog vs digital on shared pins — #1 beginner gotcha |
| `Fosc / Fcy` | Oscillator freq / instruction freq (`Fcy = Fosc/4`) |
| `.hex` file | Compiled firmware you flash with PICkit |
| ICSP | In-circuit serial programming (PGC/PGD/MCLR + power) |
| WDT | Watchdog timer — resets a stuck chip (Step 5) |

## ✅ Check yourself (Step 2, part 0)

- [ ] I can name the 3 workspace devices and when to use each.
- [ ] I know `Fcy = Fosc/4` and what TRIS/PORT/LAT/ANSEL mean.
- [ ] I downloaded at least the PIC16F877A datasheet.

Next: `01-toolchain-setup.md` — install MPLAB X + XC8 and build your first project.
