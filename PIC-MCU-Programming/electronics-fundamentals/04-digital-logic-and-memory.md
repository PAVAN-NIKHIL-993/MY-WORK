# 4. Digital Logic and Memory

Digital circuits represent information using a finite set of logic states. Binary is the common two-state representation, but a physical `0` or `1` corresponds to a voltage range—not necessarily exactly `0 V` or `5 V`. The receiving device's logic thresholds and noise margins define whether a voltage is reliably read as low or high.

## 4.1 Number systems

### Binary (base 2)

Binary digits are `0` and `1`; each place has a power-of-two weight:

```text
1010₂ = 1×2³ + 0×2² + 1×2¹ + 0×2⁰
      = 8 + 0 + 2 + 0
      = 10₁₀
```

### Hexadecimal (base 16)

Hex digits are `0–9` and `A–F`, where `A=10` through `F=15`. One hex digit represents four binary bits:

```text
0x2A = 2×16¹ + 10×16⁰ = 42₁₀
0x2A = 0010 1010₂
```

Hexadecimal is compact for addresses, register values, and bit patterns. A written `0x` prefix commonly marks a hexadecimal number in C, though the exact notation depends on the language.

## 4.2 Logic gates

A logic gate computes a Boolean function. In positive logic, a high voltage represents `1` and a low voltage represents `0`; active-low signals and inverted conventions are common and should be identified explicitly.

| A | B | AND | OR | NAND | NOR | XOR | XNOR |
|---:|---:|---:|---:|---:|---:|---:|---:|
| 0 | 0 | 0 | 0 | 1 | 1 | 0 | 1 |
| 0 | 1 | 0 | 1 | 1 | 0 | 1 | 0 |
| 1 | 0 | 0 | 1 | 1 | 0 | 1 | 0 |
| 1 | 1 | 1 | 1 | 0 | 0 | 0 | 1 |

`NOT` inverts one input: `NOT 0 = 1`, `NOT 1 = 0`. AND and OR are analogous to Boolean multiplication and addition (with Boolean, not ordinary arithmetic, rules). NAND and NOR are called **universal gates** because either type alone can implement any Boolean function. XOR is high when the inputs differ; XNOR is high when they match.

Real logic families specify input/output voltage limits, propagation delay, current, fan-out, and noise margins. Do not connect logic from different voltage families without checking compatibility and absolute-maximum ratings.

## 4.3 Combinational vs sequential logic

- **Combinational logic** depends on current inputs (for example, gates, decoders, and adders).
- **Sequential logic** also depends on stored state, usually updated in relation to a clock (for example, flip-flops, registers, and counters).

A flip-flop stores one bit. Edge-triggered flip-flops sample their input at a clock edge, subject to setup and hold times. Violating these timing limits can cause metastability or unpredictable system behavior. An asynchronous set/reset input can override the clock; its polarity and release requirements are device-specific.

### Common flip-flops

| Type | Basic behavior | Caution |
|---|---|---|
| SR | Set makes `Q=1`; reset makes `Q=0`; otherwise hold | Simultaneously asserting set and reset is forbidden or implementation-dependent for common forms; check the symbol/truth table. |
| D | On the active clock edge, `Q` takes the value of `D` | The `D` value must satisfy setup/hold timing. |
| JK | `J=K=0` holds; `J=1,K=0` sets; `J=0,K=1` resets; `J=K=1` toggles | Exact behavior depends on the clocking implementation; avoid treating a level-sensitive latch as an edge-triggered flip-flop. |
| T | `T=0` holds; `T=1` toggles on the active clock edge | A toggling flip-flop can divide a periodic clock frequency by two. |

A group of flip-flops forms a **register**. A register may hold a word or shift bits in or out over clock edges.

## 4.4 Counters and shift registers

### Counters

A counter advances through a state sequence in response to clock pulses. Common types include up, down, up/down, and modulo-`N` counters.

- **Asynchronous (ripple):** one flip-flop's output clocks the next. Propagation delays accumulate, so intermediate outputs can glitch while the count changes.
- **Synchronous:** flip-flops share a clock and next-state logic determines the next value. This is generally easier to time at higher speeds, but still has finite propagation delay.
- **Modulo-`N`:** visits `N` states before repeating. A decade/BCD counter is modulo 10 (`0` through `9`). A simple reset-on-terminal-count implementation must account for decoding glitches and the counter's reset behavior.

### Shift-register forms

| Name | Input → output | Example use |
|---|---|---|
| SISO | Serial in, serial out | Delay line / serial stream |
| SIPO | Serial in, parallel out | Expand serial data to several outputs |
| PISO | Parallel in, serial out | Read several inputs over fewer wires |
| PIPO | Parallel in, parallel out | Temporary word storage or transfer |

Ring and Johnson counters feed selected register outputs back into the input to create repeating patterns. UART and SPI hardware commonly use shift-register concepts internally; protocol framing and timing are additional layers.

## 4.5 Data selection and code conversion

### Multiplexer (MUX)

A multiplexer selects one of multiple data inputs and routes it to one output. A `4:1` MUX with select bits `S1,S0` uses `00→D0`, `01→D1`, `10→D2`, `11→D3`. With `n` select bits, a basic MUX can select among up to `2ⁿ` inputs.

### Demultiplexer (DEMUX)

A demultiplexer routes one data input to one of several outputs according to its select code. A decoder with an enable can serve similar address-selection roles; exact polarity and output behavior are component-specific.

### Encoder and decoder

- **Encoder:** maps an active input line to a binary code. A simple encoder may require only one active input; a priority encoder defines what happens when several are active.
- **Decoder:** maps a binary code to one or more asserted outputs. Uses include memory-chip selects and display decoding. Check active-high/active-low outputs and enable pins.

## 4.6 Arithmetic circuits

A **half adder** adds two one-bit inputs:

```text
Sum   = A XOR B
Carry = A AND B
```

A **full adder** also accepts carry-in:

```text
Sum       = A XOR B XOR Cin
Carry_out = (A AND B) OR (Cin AND (A XOR B))
```

Connecting full adders creates a multi-bit adder. Ripple-carry versions are simple but accumulate carry delay; faster designs use more complex carry logic.

## 4.7 Memory and addressing

### Memory types

| Type | Volatile? | Basic idea |
|---|---|---|
| SRAM | Yes | Stores bits using latch/flip-flop-like cells; fast, no refresh, larger cell area |
| DRAM | Yes | Stores charge in capacitors; needs refresh; high density |
| Mask ROM | No | Programmed during manufacture |
| PROM | No | User-programmable once (typical meaning) |
| EPROM | No | Traditionally erased with ultraviolet light and reprogrammed |
| EEPROM | No | Electrically erased/written, often in small units; endurance and write time are finite |
| Flash | No | Electrically erased/written in blocks or pages, depending on device |

“ROM” is often used informally for nonvolatile program storage, but exact erase/write behavior differs. Microcontrollers commonly place program code in flash and runtime variables in SRAM; some include EEPROM or EEPROM-emulated storage.

### Address bus, data bus, and capacity

An `n`-bit address can encode up to `2ⁿ` distinct locations. A `m`-bit data bus transfers `m` bits per location in a basic parallel-memory model. For a **byte-addressed** 16-bit address space:

```text
2^16 = 65,536 byte locations = 64 KiB
```

If each address selects a word wider than one byte, total capacity changes. Always state whether capacity is measured in bits, bytes, words, or addressable locations.

For example, an address `0x2000` names a location only if that address exists in the particular device's map; the value stored there is separate from the address. A **memory map** assigns ranges to code, RAM, peripherals, boot space, or other functions. It is specific to a CPU/device, not a universal table.

### Chip select and memory-mapped I/O

Address-decoding logic can assert a memory chip's **chip-select (CS)** input when an address falls in its range. With memory-mapped I/O, peripheral registers occupy part of the address map and are accessed with ordinary memory operations. Other CPUs use separate I/O addressing. The processor and peripheral datasheets define which model applies.

### Harvard and Von Neumann organization

A Von Neumann design uses one address/data path for code and data. A Harvard-style design has separate code and data paths/address spaces. This can allow simultaneous instruction fetch and data access, but it does not mean every implementation has separate physical chips. Many modern processors use hybrid caches and buses; inspect the architecture and memory map rather than relying on a one-word label.

## 4.8 Quick self-check

1. What is the difference between a MUX and a DEMUX?
2. Why can a simple asynchronous counter show transient intermediate values?
3. What conditions define the capacity of an address bus in bytes?
4. Why is an example address such as `0x2000` not a universal location for RAM or I/O?
5. How does a full adder differ from a half adder?
