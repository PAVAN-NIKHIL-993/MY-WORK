# 5. The 8051 Microcontroller

The 8051 is a classic 8-bit microcontroller architecture. The name describes a **family of compatible cores and derivatives**, not one single modern chip with a universal memory size, clock, voltage, pinout, or peripheral set. The details below distinguish the original/classic MCS-51 baseline from later variants.

## 5.1 Classic baseline and variants

| Feature | Classic Intel 8051 baseline | What can change in a derivative |
|---|---|---|
| CPU | 8-bit MCS-51 core | Instruction timing, extensions, speed, debug support |
| Program memory | Original part had 4 KiB mask ROM | Flash/OTP/ROM size, boot ROM, or no on-chip program memory |
| Internal data RAM | 128 bytes | More internal RAM, extra indirectly addressed RAM, or different map |
| I/O | Four 8-bit ports (32 port bits) | Pin count/package, extra ports, alternate functions, electrical behavior |
| Timers/counters | Two 16-bit timers, Timer 0 and Timer 1 | Additional timers, capture/compare, PWM, different clock dividers |
| Serial | One full-duplex serial port | Extra UARTs, SPI/I²C, baud-rate generators, USB, and other interfaces |
| Interrupts | Five classic interrupt sources, two priority levels | More sources, nesting/priority options, extra vectors |
| Machine cycle | Classic core commonly uses 12 oscillator periods per machine cycle | Many derivatives are 1T, 2T, or otherwise different; peripheral clocks may differ |

The values in the classic column are not promises about every “8051-compatible” chip. Some legacy derivatives intentionally differ, and modern devices can be much faster or add substantial peripherals. Read the exact device's datasheet and compiler header before using addresses or timing values.

## 5.2 Harvard-style organization

The classic 8051 has separate **program/code** and **data** address spaces and control signals, a Harvard-style arrangement. Code is fetched from the code space while data is read/written through the data space. This is an architectural distinction; it does not require two visible external memory chips in every implementation.

A classic core can address up to 64 KiB of code space and up to 64 KiB of external data space, subject to the particular chip's internal memory and hardware mapping. The original 8051's 4 KiB on-chip ROM occupies part of its code space; external code memory can be selected using the EA pin and external bus signals. Compatible derivatives may use on-chip flash instead.

## 5.3 Classic 40-pin DIP pin groups

This table is only for the classic 40-pin DIP pinout. Smaller packages and modern derivatives have different package pinouts or multiplexed functions.

| Pin(s) | Classic function |
|---:|---|
| 1–8 | `P1.0`–`P1.7` |
| 9 | `RST` (active high on the classic part) |
| 10–17 | `P3.0`–`P3.7` / alternate functions |
| 18, 19 | `XTAL2`, `XTAL1` |
| 20 | `GND` |
| 21–28 | `P2.0`–`P2.7` |
| 29 | `/PSEN` — external program-memory read strobe |
| 30 | `ALE/PROG` — address-latch enable / programming function on some parts |
| 31 | `/EA/VPP` — external-access selection / programming function on some parts |
| 32–39 | `P0.7`–`P0.0` |
| 40 | `VCC` |

A slash-prefixed name is active low. External-memory connections have timing and latch requirements; do not wire the bus from a pin-name list alone.

## 5.4 I/O ports and alternate functions

| Port | General-purpose behavior on classic 8051 | Alternate function / important caveat |
|---|---|---|
| `P0.0`–`P0.7` | Open-drain when used as GPIO; external pull-ups are normally needed for a high level | Multiplexed low address/data bus `AD0`–`AD7` for external memory |
| `P1.0`–`P1.7` | General-purpose quasi-bidirectional I/O with internal pull-ups | Mostly general-purpose on the classic part; derivatives may multiplex pins |
| `P2.0`–`P2.7` | General-purpose quasi-bidirectional I/O with internal pull-ups | High address bus `A8`–`A15` during external-memory access |
| `P3.0`–`P3.7` | General-purpose quasi-bidirectional I/O with internal pull-ups | Each pin also has a dedicated peripheral/control function below |

Classic `P3` alternate functions are:

| Pin | Alternate function |
|---|---|
| `P3.0` | `RXD` — serial receive |
| `P3.1` | `TXD` — serial transmit |
| `P3.2` | `/INT0` — external interrupt 0 |
| `P3.3` | `/INT1` — external interrupt 1 |
| `P3.4` | `T0` — Timer 0 external input |
| `P3.5` | `T1` — Timer 1 external input |
| `P3.6` | `/WR` — external data-memory write strobe |
| `P3.7` | `/RD` — external data-memory read strobe |

For the classic quasi-bidirectional ports, writing a `1` releases a pin so it can act as an input; verify the exact port and peripheral rules in the part's datasheet. Do not assume every modern derivative uses the same port-latch or pull-up behavior. Check pin voltage, current, reset state, and any conflict with programming/debug pins.

## 5.5 Timers and counters

Classic Timer 0 and Timer 1 can be configured as timers or external event counters. The classic `TMOD` modes include:

| Mode | Classic meaning |
|---:|---|
| 0 | 13-bit timer/counter |
| 1 | 16-bit timer/counter |
| 2 | 8-bit auto-reload |
| 3 | Split Timer 0 into two smaller timer functions; Timer 1 behavior is constrained |

In classic timer mode, the timer increments once per machine cycle, commonly `fosc/12` on a 12T core. For a classic 12 MHz oscillator, that is a 1 MHz timer tick (`1 µs` per count). Derivatives may use different divisors and timer clock trees.

### Illustrative 1 ms polling delay

For a classic 12T 8051 at 12 MHz, a 16-bit Timer 0 reload of `0xFC18` leaves 1,000 timer increments before overflow (`65,536 − 1,000`). The following is **Keil C51-style illustrative code**, not portable ISO C and not suitable unchanged for every derivative:

```c
#include <REG51.H>

void delay_1ms(void)
{
    TMOD = (TMOD & 0xF0) | 0x01;  /* Timer 0, mode 1, internal timer */
    TR0 = 0;
    TF0 = 0;
    TH0 = 0xFC;
    TL0 = 0x18;
    TR0 = 1;
    while (TF0 == 0) { }          /* Busy wait */
    TR0 = 0;
    TF0 = 0;
}
```

The timer interval is nominally 1 ms; polling and software overhead affect how long the calling routine occupies the CPU. Real-time tasks generally use a timer interrupt or compare peripheral rather than a blocking delay. Check clock selection, mode bits, flag behavior, and reload values against the actual part.

## 5.6 UART serial port

The classic serial port supports four modes: a synchronous shift-register mode, an 8-bit UART mode, and two 9-bit modes. Mode 1 is a common asynchronous UART format. It is full duplex: transmit and receive can operate independently, subject to the device's buffering/flags.

For classic mode 1 using Timer 1 in 8-bit auto-reload mode, a common baud-rate equation is:

```text
Baud = (2^SMOD × fosc) / (384 × (256 − TH1))
```

This assumes the classic 12-clock timer behavior and the normal Timer 1 setup; `SMOD` is the baud-doubling bit. With `fosc = 11.0592 MHz`, `SMOD = 0`, and `TH1 = 0xFD`, the result is `11,059,200 / (384 × 3) = 9,600 baud`.

Illustrative Keil C51-style setup and one-character transmit/receive (device header and oscillator setup omitted):

```c
#include <REG51.H>

void main(void)
{
    unsigned char received;

    /* Configure Timer 1 mode 2 while preserving Timer 0's TMOD nibble. */
    TMOD = (TMOD & 0x0F) | 0x20;
    TH1 = 0xFD;
    TL1 = 0xFD;
    SCON = 0x50;       /* Serial mode 1, receiver enabled */
    TR1 = 1;

    SBUF = 'A';        /* Start transmit */
    while (TI == 0) { }
    TI = 0;

    while (RI == 0) { }
    received = SBUF;
    RI = 0;

    for (;;) { }       /* Keep the example's main routine alive */
}
```

Compiler headers, register names, baud generators, clock dividers, and flag-clearing rules vary. The example assumes reset/default `SMOD=0`, a stable 11.0592 MHz clock, and a classic-compatible timer/UART. Confirm those assumptions and configure both endpoints for matching baud, data bits, parity, and stop bits.

## 5.7 Interrupts

The classic 8051 has five interrupt sources (not counting reset as a normal interrupt source):

| Source | Classic vector address | Port/peripheral |
|---|---:|---|
| External interrupt 0 | `0003h` | `P3.2` |
| Timer 0 overflow | `000Bh` | Timer 0 |
| External interrupt 1 | `0013h` | `P3.3` |
| Timer 1 overflow | `001Bh` | Timer 1 |
| Serial port | `0023h` | Transmit and/or receive flag |

Reset begins at `0000h`. The classic architecture provides two interrupt priority levels; a higher-priority interrupt can preempt a lower-priority one. Enable the global and selected source bits in the interrupt-enable registers, configure priority/edge behavior if needed, and clear each peripheral flag as specified by the device manual. Keep interrupt handlers short; use a flag or small data handoff for longer work. Compiler-specific interrupt declarations and register names are not portable between 8051 toolchains.

## 5.8 Classic memory organization

For the original 128-byte internal RAM model, the lower internal data RAM is commonly organized as:

| Address range | Classic use |
|---|---|
| `00h–1Fh` | Four register banks (`R0`–`R7`, selected by PSW bits) |
| `20h–2Fh` | Bit-addressable RAM (16 bytes / 128 individually addressable bits) |
| `30h–7Fh` | General-purpose internal RAM and stack space |
| `80h–FFh` | Special Function Registers (SFRs), accessed by direct addressing; only implemented SFR addresses are valid |

Some 8052-class derivatives add upper internal RAM addressable indirectly; it is not the same as the SFR space. External `XDATA` and code spaces are separate in the classic architecture. A compatible microcontroller may remap or extend these regions, so use its actual memory map.

Selected classic SFR addresses include:

| SFR | Address | Purpose |
|---|---:|---|
| `P0`, `P1`, `P2`, `P3` | `80h`, `90h`, `A0h`, `B0h` | Port latches |
| `SP` | `81h` | Stack pointer |
| `DPL`, `DPH` | `82h`, `83h` | Data pointer low/high |
| `TCON`, `TMOD` | `88h`, `89h` | Timer/interrupt control and timer mode |
| `TL0`, `TL1`, `TH0`, `TH1` | `8Ah`, `8Bh`, `8Ch`, `8Dh` | Timer registers |
| `SCON`, `SBUF` | `98h`, `99h` | Serial control and data buffer |
| `IE`, `IP` | `A8h`, `B8h` | Interrupt enable and priority |
| `PSW`, `ACC`, `B` | `D0h`, `E0h`, `F0h` | Status, accumulator, and B register |

This is a study map for the classic baseline, not a list of addresses guaranteed on all 8051 devices.

## 5.9 Learning path and common mistakes

1. Identify the exact part and package; obtain its datasheet and compiler-supported device header.
2. Verify supply, reset, oscillator, and unused-pin behavior before coding.
3. Configure one GPIO output and input; remember classic Port 0's external pull-up requirement.
4. Add a timer only after checking the core's timer clock and mode.
5. Add UART after calculating baud for the actual clock and confirming the electrical interface (logic-level UART is not RS-232 voltage).
6. Add interrupts after polling versions work; document which flags the hardware clears and which software must clear.

Do not copy classic `TMOD`, `TH1`, `SCON`, pin, or memory values into a modern derivative without checking its reference manual. The 8051 examples here are conceptual and compiler-specific; this PIC project does not claim to build or test 8051 firmware.

## 5.10 Quick self-check

1. What is different between the original 8051's 4 KiB program ROM and a modern 8051-compatible part?
2. Why does classic Port 0 need special attention when used as GPIO?
3. Under what exact clock assumption does the `0xFC18` reload represent about 1 ms?
4. Which classic UART setup assumptions produce 9,600 baud with `TH1=0xFD`?
5. Why are code space, internal data RAM, SFRs, and external data memory not one interchangeable address map?
