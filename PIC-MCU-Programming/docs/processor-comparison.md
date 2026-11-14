# Processor, MCU, module, board, and accelerator comparison

> **Scope:** all 85 numbered entries in the request. This is a selection aid, not a substitute for the exact ordering-code datasheet, errata, reference manual, radio certification, or board schematic. Research checked 2026-09-10. The estimated prices below are the user's rough estimates, **not independently checked quotes, guaranteed prices, or like-for-like silicon prices**.
>
> Practical recommendations are in the companion [processor selection guide](guides/processor-selection-guide.md).

## How to read these comparisons

- **Silicon is not a board.** `MCU/SoC` means the chip; `module/SiP` may package or add flash, RAM, crystals, RF matching, and an antenna; `board` adds its own connectors, regulators, debug bridge, transceivers, PHYs, and possibly memory; `accelerator` is not a host processor. Rows and tables say which layer a feature belongs to. Do not attribute a board's Ethernet, radio, flash, or exposed header pins to the chip.
- **Family ranges are not one purchasable part.** A family row gives the documented range or common representative. Flash, SRAM, ADC channels, GPIO, package, temperature grade, and even peripheral presence can change with the suffix. Pick an exact ordering code and re-check its pinout and errata before layout.
- **Package pins are not GPIO.** Pin count includes power, ground, crystal, reset, exposed pad and dedicated interface pins. GPIO counts are the manufacturer's available/configurable I/O for a stated package or SKU; functions are multiplexed, some I/O is input-only or reserved for boot/flash/radio, and boards often expose fewer. There is no safe universal conversion from package pin count to usable GPIO.
- **Ethernet MAC is not Ethernet PHY.** An MAC/controller usually needs an external PHY, reference clock, magnetics and connector; a particular module/board may supply them. `MAC` below is not a ready-to-plug RJ45 port.
- **CAN controller is not a CAN bus port.** Unless the board/module explicitly includes one, each CAN/CAN-FD controller needs a suitable external physical-layer transceiver, termination and protection. CAN 2.0 and CAN-FD are separate; a classical CAN controller is not CAN-FD capable.
- **USB role matters.** FS = full speed; HS = high speed; OTG generally supports host/device role selection, not simultaneous host and device. A USB device port is not a host port. Host designs need a 5-V VBUS supply/switch and overcurrent strategy; connector, PHY, cable and power circuitry are distinct. USB-UART bridges on dev boards are not the MCU's USB controller.
- **`—`** means the cited silicon specification does not list that integrated feature. **`Variant`** means the family/package/SKU or board controls it. **`Not established`** means the available exact source did not justify a claim, so it is deliberately not guessed.
- **I²S is digital audio.** It usually needs an external codec, ADC, DAC, amplifier and/or microphone. I²C is a control bus, not an audio output. PWM plus a filter is not a precision DAC.
- **AI numbers are not directly comparable.** TOPS/GOPS, MACs, supported arithmetic, model/compiler constraints, and test conditions differ. Accelerator memory/throughput is not CPU speed or general-purpose RAM.

## Feature matrices

Each matrix keeps the requested features vertical and limits product columns to a small, related family. Memory and pin figures are representative/ranges; an exact SKU and package can be narrower. `PHY`, `transceiver`, and external-memory requirements are called out in the last row and explained in [hardware that may need to be added](#hardware-that-may-need-to-be-added).

### 1–4 · Vision / AI SoCs and microcontrollers

| Feature | **1 · K230 SoC** | **2 · Kendryte K210 SoC** | **3 · MAX78000 MCU** | **4 · MAX78002 MCU** |
|---|---|---|---|---|
| CPU / clock | Dual 64-bit RISC-V C908; 800 MHz + 1.6 GHz | Dual 64-bit RISC-V; up to 400 MHz | Cortex-M4F 100 MHz + RV32 coprocessor 60 MHz | Cortex-M4F 120 MHz + RV32 coprocessor up to 60 MHz |
| On-chip memory | 2 MiB SRAM plus 2 MiB default KPU SRAM; CPU caches are separate | 8 MiB on-chip SRAM; no general-purpose on-chip program flash | 512 KiB flash, up to 128 KiB MCU SRAM; separate CNN SRAM | 2.5 MiB flash, up to 384 KiB MCU SRAM; separate CNN SRAM |
| External memory / boot | DDR3L/LPDDR3/LPDDR4 external DRAM up to 2 GiB; documented SiP integrates 128 MiB LPDDR4; boot/storage depends on carrier/module | SPI flash normally external/on a module or board | External boot/application memory is not required for the stated MCU flash | External boot/application memory is not required for the stated MCU flash |
| Package / I/O | BGA; up to 64 GPIO + 8 PMU GPIO (SiP variant: 50 + 6); camera/display functions are muxed | BGA; FPIOA routes functions, so exposed I/O depends on board/module | 81-pin CTBGA; up to 52 GPIO | 144-pin CSBGA; up to 60 GPIO |
| Wireless | Not an integrated Wi-Fi/BLE radio in the base SoC specification | — | — | — |
| Ethernet | No MAC/PHY claim used here | — | — | — |
| CAN / CAN-FD | Not established as an integrated CAN controller | — | — | — |
| USB | 2 × USB 2.0 OTG in SoC documentation; port implementation is carrier-dependent | No native USB port assumed; common boards add USB-to-UART | No native host/OTG port cited | USB 2.0 HS controller/PHY; host/device capability depends on configuration and board power |
| I²C | 5 controllers in K230 brief | I²C present; exact count is not relied on here | I²C present; exact count varies by interface block | I²C present; exact count varies by interface block |
| I²S | I²S/audio peripherals; exact lane count depends on documented interface mode | I²S present; digital audio | 1 I²S | I²S/audio present |
| ADC / DAC | Audio ADC/DAC blocks in some documentation; not a general-purpose precision ADC/DAC claim | Do not assume general-purpose ADC/DAC; board audio codec is separate | 10-bit sigma-delta ADC; no DAC relied on | 10-bit sigma-delta ADC; no DAC relied on |
| PWM / timing | PWM present; GPIO and multimedia functions are muxed | PWM/timers present | Timers/PWM; not positioned as a motor-control MCU | Timers/PWM; not positioned as a motor-control MCU |
| AI / other acceleration | KPU. Published K230 throughput claims conflict (2 TOPS in the user's source versus 6-TOPS-equivalent in some board materials); benchmark the exact model/toolchain | KPU plus FFT/audio/image blocks; benchmark supported networks and the exact compiler/clock configuration | CNN accelerator: 442 KiB weight storage, plus CNN data SRAM; very low-power quantized inference | CNN accelerator: 2 MiB weight storage and about 1.3 MiB data SRAM; quantized CNN inference |
| Add-on boundary | Needs memory/boot implementation, power sequencing, antenna/radio if required, and board-level connectors | Needs SPI boot flash and board-level clock/power/USB interface | Camera, audio codec/ADC/DAC, network PHY and radio are external if needed | Camera/audio and network interfaces need board support; add radio/PHY if needed |

Sources: [S01](#s01)–[S04](#s04).

### 5–7 · Heterogeneous SoC, smart-vision module, and USB-only accelerator

| Feature | **5 · BL808 SoC** | **6 · RTL8735B / AMB82 Mini** | **7 · Coral USB Accelerator** |
|---|---|---|---|
| Product class | Multi-core wireless/multimedia SoC | RTL8735B is the SoC; AMB82 Mini is a module/board product built around it | Edge-TPU accelerator peripheral, **not** an MCU/SoC host |
| CPU / clock | Three RISC-V cores; commonly documented around RV64 C906 480 MHz, RV32 E907 320 MHz, RV32 E902 150–160 MHz | Real-M500 Armv8-M, up to 500 MHz | No host CPU |
| On-chip memory | About 2 MiB on-chip SRAM split among subsystems; memory maps differ by revision | 512 KiB SRAM + ROM; embedded DDR2 is SKU/package-dependent | No general-purpose RAM/flash for a host application |
| External memory / boot | SPI-NOR/NAND and 32/64 MiB pSRAM/DRAM variants; M1s module commonly adds 64 MiB PSRAM and flash | SoC/module DDR and flash vary; AMB82 module adds RF, memory and antenna implementation | Host supplies storage, drivers, OS and model files |
| Package / I/O | QFN88; 36 or 40 GPIO by variant | QFN128 SoC has up to 59 GPIO; module routes fewer (AMB82/module-specific) | USB plug; no GPIO header |
| Wireless | Wi-Fi 4 2.4 GHz, Bluetooth dual mode and 802.15.4/Zigbee integrated | Wi-Fi 4; 2.4/5 GHz depends on exact RTL8735B SKU; BLE 5.x | — |
| Ethernet | MAC/controller present; PHY/magnetics/connector are external unless supplied by a board/module | No Ethernet MAC claim used | — |
| CAN / CAN-FD | No standard CAN controller claim used | No standard CAN controller claim used | — |
| USB | USB 2.0 HS OTG controller; board/module connector and VBUS implementation vary | USB 2.0 host/device is listed for RTL8735B configurations; verify module pinout | USB 3.0 host interface; host port must provide adequate power and support the driver stack |
| I²C | I²C present; counts vary by datasheet/variant | 2–4 I²C reported across silicon/module revisions; verify exact module | — |
| I²S | I²S/audio codec blocks | Audio codec/I²S on RTL8735B system; module routing varies | — |
| ADC / DAC | General ADC/DAC and audio ADC/DAC blocks; variant and mode matter | General ADC plus audio ADC/DAC are listed; do not confuse integrated codec with board-level audio connector | — |
| PWM / timing | PWM and timers; multimedia DMA/parallel I/O | Up to 12 PWM in SoC material; module can expose fewer | — |
| AI / other acceleration | BLAI-100 NN accelerator appears on some products/modules; do not assume every BL808 assembly includes the same external/embedded memory | 0.4 TOPS NPU plus ISP and H.264/H.265 video encode in Realtek product material | Edge TPU, advertised at 4 TOPS for supported quantized models; the host still runs the OS/application |
| Add-on boundary | Module/board may add flash, PSRAM, RF antenna, PHY, USB connector, display, camera or codec | `AMB82 Mini` additions are board/module facts, not bare-chip facts; check revision and exposed I/O | Requires a USB-capable host (for example, Linux SBC/PC), model conversion/runtime and compatible USB 3 host; no MCU peripherals are provided |

Sources: [S05](#s05)–[S07](#s07).

### 8–11 · Espressif Wi-Fi MCU family, set A

| Feature | **8 · ESP32** | **9 · ESP32-S2** | **10 · ESP32-S3** | **11 · ESP32-C3** |
|---|---|---|---|---|
| CPU / clock | Xtensa LX6, commonly dual-core up to 240 MHz; single-core SKUs exist | Single Xtensa LX7, up to 240 MHz | Dual Xtensa LX7, up to 240 MHz | Single RISC-V, up to 160 MHz |
| On-chip memory | 520 KiB SRAM; ROM | 320 KiB SRAM + RTC SRAM | 512 KiB SRAM + RTC SRAM | 400 KiB SRAM (includes cache allocation) + RTC SRAM |
| External memory / boot | Bare chips normally use external QSPI flash; selected package variants/modules add flash and/or PSRAM | External flash or selected in-package flash; PSRAM optional | External flash or selected in-package flash; PSRAM optional | External flash or selected in-package flash, depending part/module |
| Package / I/O | Up to 34 chip GPIO, fewer usable/exposed on modules; 6 input-only on classic package | Up to 43 chip GPIO; modules expose fewer | Up to 45 SoC GPIO; modules commonly expose 36–39 | 22 GPIO in some QFN32 SKUs; in-package-flash variants can have 16; module often 15 |
| Wireless | 2.4 GHz Wi-Fi 4 + Bluetooth Classic/BLE | 2.4 GHz Wi-Fi 4; **no Bluetooth** | 2.4 GHz Wi-Fi 4 + Bluetooth LE 5 | 2.4 GHz Wi-Fi 4 + BLE 5 |
| Ethernet | EMAC/MAC; external PHY and magnetics required | — | — | — |
| CAN / CAN-FD | TWAI CAN 2.0 controller; external transceiver; no CAN-FD | TWAI CAN 2.0; external transceiver; no CAN-FD | TWAI CAN 2.0; external transceiver; no CAN-FD | TWAI CAN 2.0; external transceiver; no CAN-FD |
| USB | No native USB controller in the common original ESP32; dev boards use USB-UART | Full-speed USB OTG host/device with integrated PHY | Full-speed USB OTG plus USB-Serial/JTAG device; USB pins are multiplexed | USB-Serial/JTAG device only; **not** USB OTG/host |
| I²C | 2 controllers | 2 controllers | 2 controllers | 1 controller |
| I²S | 2 controllers | 1 controller | 2 controllers | 1 controller |
| ADC / DAC | 2 × 12-bit ADC; 2 × 8-bit DAC | 2 × 12-bit ADC; 2 × 8-bit DAC | 2 × 12-bit ADC; no integrated DAC | 12-bit SAR ADC; no integrated DAC |
| PWM / timing | LED PWM (up to 16 channels) + motor PWM | LED PWM (up to 8 channels) + motor PWM | LED PWM + motor PWM | LED PWM; no dedicated motor-control claim |
| AI / other acceleration | No dedicated neural accelerator | No dedicated neural accelerator | Vector/DSP instructions and AI-oriented extensions; no separate NPU | No dedicated neural accelerator |
| Add-on boundary | External CAN PHY, Ethernet PHY/magnetics, and USB-UART/USB interface as needed | External CAN PHY; USB host requires VBUS/power switching | External CAN transceiver; host VBUS/power; reserve USB pins if using native USB | External CAN transceiver; USB connector gives device/debug, not host |

Sources: [S08](#s08)–[S11](#s11).

### 12–14 · Espressif Wi-Fi 6, 802.15.4, and multimedia MCU

| Feature | **12 · ESP32-C6** | **13 · ESP32-H2** | **14 · ESP32-P4** |
|---|---|---|---|
| CPU / clock | Single RISC-V, up to 160 MHz | Single RISC-V, up to 96 MHz | Dual high-performance RISC-V up to 400 MHz + LP RISC-V up to 40 MHz |
| On-chip memory | 512 KiB HP SRAM + 16 KiB LP SRAM; ROM | 320 KiB SRAM + LP SRAM/ROM | 768 KiB HP L2MEM + 32 KiB LP SRAM; ROM/SPM |
| External memory / boot | External flash or in-package flash on some SKUs; module flash is SKU-specific | 2/4 MiB in-package flash variants | External boot flash required; high-speed memory interfaces support external memory, and some package products add PSRAM |
| Package / I/O | QFN40 up to 30 GPIO; QFN32 up to 22; modules fewer | Up to 19 GPIO; package/module limits apply | QFN104, up to 55 GPIO (16 LP + 39 HP); strapping and peripheral muxing consume pins |
| Wireless | 2.4 GHz Wi-Fi 6 + BLE + 802.15.4 (Thread/Zigbee) | BLE + 802.15.4 (Thread/Zigbee/Matter); **no Wi-Fi** | **No integrated Wi-Fi/Bluetooth radio**; pair with a radio/companion module if needed |
| Ethernet | — | — | EMAC/MAC; external PHY, magnetics and connector needed |
| CAN / CAN-FD | 2 × TWAI CAN 2.0; external transceiver; no CAN-FD | TWAI CAN 2.0; external transceiver; no CAN-FD | 3 × TWAI CAN 2.0; external transceiver; no CAN-FD |
| USB | USB-Serial/JTAG device only; not host/OTG | USB-Serial/JTAG device only; not host/OTG | USB 2.0 HS OTG + FS OTG + Serial/JTAG; host VBUS still needs board power circuitry |
| I²C | I²C + low-power I²C | 2 controllers | 2 HP I²C + LP/analog I²C options; exact controller count depends on function set |
| I²S | 1 controller | I²S present | 3 I²S plus LP audio options in current family documentation |
| ADC / DAC | 12-bit ADC, up to 7 channels; no DAC | 12-bit ADC, up to 5 channels; no DAC | 2 ADC controllers, 12-bit measurement on up to 14 pins; no on-chip DAC listed |
| PWM / timing | LED PWM + MCPWM | LED PWM + MCPWM | LED PWM + 2 MCPWM; hardware timers/parallel I/O |
| AI / other acceleration | No NPU; ETM/parallel I/O | No NPU; ETM/parallel I/O | ISP, JPEG, PPA and video/image accelerators; **not a general NN NPU** |
| Add-on boundary | External CAN transceiver; USB host requires a different controller/host solution | External CAN transceiver; no Wi-Fi can be added by software | External Ethernet PHY/magnetics and CAN transceivers; add a C-series radio module or host-controlled radio for wireless |

Sources: [S12](#s12)–[S14](#s14).

### 15–17 · STM32 entry and mid-range F-series

| Feature | **15 · STM32F103C8 / Blue Pill** | **16 · STM32F401/F411 / Black Pill** | **17 · STM32F407** |
|---|---|---|---|
| Product class | F103C8 is silicon; Blue Pill is a third-party board | F401/F411 are silicon variants; Black Pill is a board family | MCU family; exact F407 order code/package required |
| CPU / clock | Cortex-M3, up to 72 MHz | Cortex-M4F; F401 up to 84 MHz, F411 up to 100 MHz | Cortex-M4F, up to 168 MHz |
| On-chip memory | C8 nominal 64 KiB flash/20 KiB SRAM; clone parts may differ | F401: up to 512 KiB flash/96 KiB RAM; F411: up to 512 KiB/128 KiB | Common F407: up to 1 MiB flash/192 KiB SRAM (partitioned banks) |
| External memory / boot | Internal flash; board may use bootloader/USB-UART | Internal flash; Black Pill adds board power/debug/USB connector, not RAM | External-memory interface on selected parts/packages |
| Package / I/O | C8 LQFP48: up to 37 I/O (package pin count 48); board headers expose fewer | Depends on variant/package; boards expose only routed header pins | Up to about 114 GPIO on large package; package-specific |
| Wireless | — | — | — |
| Ethernet | — | — | 10/100 MAC on F407 line; add external PHY, magnetics and jack |
| CAN / CAN-FD | 1 × classical CAN 2.0B; transceiver external | — | 2 × classical CAN 2.0B; transceivers external; no CAN-FD |
| USB | FS **device** controller; not host/OTG | FS OTG controller with on-chip FS PHY (host/device) | FS OTG; HS-capable controller, but HS normally needs external ULPI PHY; check package |
| I²C | 2 | 3 (variant/function set) | 3 |
| I²S | — | 2, multiplexed with SPI | 2, multiplexed with SPI |
| ADC / DAC | 2 × 12-bit ADC; no DAC | 1 × 12-bit ADC; no DAC | 3 × 12-bit ADC; 2 × 12-bit DAC |
| PWM / timing | Timer PWM; channel/function muxing | General/motor-control timers; package limits | Advanced timer PWM; channel pins muxed |
| AI / other acceleration | No AI accelerator | No AI accelerator | No AI accelerator; DSP/FPU only |
| Add-on boundary | Blue Pill's USB connector does not turn the F103 USB device controller into a host; CAN needs transceiver | Confirm exact F401/F411 before assuming pinout or memory | External PHY and CAN transceivers are required; HS USB PHY may be external |

Sources: [S15](#s15)–[S17](#s17).

### 18–20 · STM32 F4 connectivity / performance parts

| Feature | **18 · STM32F429** | **19 · STM32F446** | **20 · STM32F767** |
|---|---|---|---|
| CPU / clock | Cortex-M4F, up to 180 MHz | Cortex-M4F, up to 180 MHz | Cortex-M7, up to 216 MHz |
| On-chip memory | Up to 2 MiB flash, 256 KiB SRAM + backup RAM | Up to 512 KiB flash, 128 KiB SRAM + backup RAM | Up to 2 MiB flash, about 512 KiB SRAM; exact partition by SKU |
| External memory / boot | FMC/QSPI interfaces on selected packages | QSPI/FMC availability is package-dependent | FMC/QSPI external memory support, package-dependent |
| Package / I/O | Up to 144-pin; up to 114 GPIO-class I/O | 64–144-pin family; GPIO depends on package | Up to 216-pin family; GPIO/package dependent |
| Wireless | — | — | — |
| Ethernet | 10/100 MAC; external PHY/magnetics | — | 10/100 MAC; external PHY/magnetics |
| CAN / CAN-FD | 2 × classical CAN 2.0B; external transceivers | 2 × classical CAN 2.0B; external transceivers | Up to 3 × classical CAN 2.0B; external transceivers |
| USB | FS OTG + HS/FS OTG; external ULPI PHY needed for HS | FS OTG + HS/FS OTG; ULPI PHY needed for HS | FS and HS OTG controllers; external ULPI PHY for HS mode |
| I²C | 3 | Up to 4 | Up to 4 |
| I²S | Up to 2 I²S + SAI, variant-dependent | Up to 3 I²S + 2 SAI (package caveat) | Up to 3 I²S + SAI |
| ADC / DAC | 3 × 12-bit ADC; 2 × 12-bit DAC | 3 × 12-bit ADC; 2 × 12-bit DAC | 3 × 12-bit ADC; 2 × 12-bit DAC |
| PWM / timing | Advanced timers; LCD-TFT/camera on F429 | Advanced motor-control timers | Advanced timers; DSP/FPU |
| AI / other acceleration | Chrom-ART graphics accelerator on selected parts, not NPU | Math/ART accelerator, not NPU | DSP/FPU and graphics/camera blocks, not NPU |
| Add-on boundary | PHY and CAN transceivers; high-speed USB PHY as noted | CAN transceivers; USB high-speed PHY if required | PHY and CAN transceivers; high-speed USB PHY; check exact part |

Sources: [S18](#s18)–[S20](#s20).

### 21–25 · STM32 H7, L4, U5, and G4

| Feature | **21 · STM32H743/H750** | **22 · STM32H747** | **23 · STM32L476** | **24 · STM32U575/U585** | **25 · STM32G474** |
|---|---|---|---|---|---|
| CPU / clock | H743/H750 Cortex-M7, up to 480 MHz | Cortex-M7 up to 480 MHz + M4 up to 240 MHz | Cortex-M4F, up to 80 MHz | Cortex-M33, up to 160 MHz | Cortex-M4F, up to 170 MHz |
| On-chip memory | H743 up to 2 MiB flash; H750 has only small boot flash (about 128 KiB); up to 1 MiB RAM | Up to 2 MiB flash, 1 MiB RAM | Up to 1 MiB flash, 128 KiB SRAM | Up to 2 MiB flash, 786 KiB SRAM (ECC configuration reduces usable RAM) | 128–512 KiB flash, up to 128 KiB SRAM; exact SKU varies |
| External memory / boot | H750 usually needs external boot/application flash; FMC/QSPI available by part | FMC/QSPI; external memory optional | QSPI/FSMC on applicable packages | Octo-SPI/FSMC options vary by package | External memory not normally needed |
| Package / I/O | Exact package; H743/H750 pinouts are not interchangeable | Exact package; high-pin-count variants expose more I/O | Up to 100+ I/O on largest package | GPIO count scales by 48–169 pin package | Package-dependent; smaller packages lose ADC/PWM pins |
| Wireless | — | — | — | — | — |
| Ethernet | 10/100 MAC; external PHY/magnetics | 10/100 MAC; external PHY/magnetics | — | — | — |
| CAN / CAN-FD | 2 × FDCAN; external transceivers | 2 × FDCAN; external transceivers | 1 × classical CAN 2.0B; external transceiver | 1 × CAN-FD; external transceiver | Up to 3 × FDCAN; external transceivers |
| USB | FS + HS/FS OTG; HS operation needs correct PHY/interface | FS + HS/FS OTG; HS ULPI PHY as required | USB FS OTG host/device | USB FS OTG host/device; Type-C PD controller is a separate interface | USB FS **device**; not a general host/OTG port |
| I²C | 4 | 4 | 3 | 4 | 4 |
| I²S | Up to 3 I²S + SAI | Up to 3 I²S + multiple SAI | 2 SAI digital-audio blocks | 2 SAI; no dedicated I²S claim | Up to 2 I²S + SAI, muxed with SPI |
| ADC / DAC | 3 ADCs, up to 16-bit resolution; 2 × 12-bit DAC | 3 ADCs, up to 16-bit; 2 × 12-bit DAC | Up to 3 × 12-bit ADC; 2 × 12-bit DAC | 14-bit + 12-bit ADC blocks; 2 × 12-bit DAC | Up to 5 ADCs with oversampling to 16-bit; up to 7 × 12-bit DAC outputs |
| PWM / timing | Advanced motor PWM/timers | Advanced motor PWM/timers | Timers/PWM, low-power | Timers/PWM, lower-power | High-resolution motor-control PWM and analog front-end |
| AI / other acceleration | DSP/FPU, graphics/DMA; no NPU | DSP/FPU, graphics/DMA; no NPU | DSP/FPU | TrustZone/security; no NPU | CORDIC/FMAs/analog accelerators; no NPU |
| Add-on boundary | H750 external flash, Ethernet PHY, CAN transceivers, and USB HS PHY/interface as applicable | Ethernet PHY, CAN transceivers, USB HS PHY as applicable | CAN transceiver; USB host power circuitry | CAN transceiver; verify USB PHY/mode by exact part | CAN transceivers; do not assume FDCAN implies CAN-FD transceiver |

Sources: [S21](#s21)–[S25](#s25).

### 26–27 · STM32 wireless MCUs

| Feature | **26 · STM32WB55** | **27 · STM32WL55** |
|---|---|---|
| CPU / clock | Cortex-M4 up to 64 MHz + radio Cortex-M0+ up to 32 MHz | Cortex-M4 + radio/security Cortex-M0+, both up to 48 MHz |
| On-chip memory | Up to 1 MiB flash, 256 KiB SRAM; density depends on suffix | 256 KiB flash, 64 KiB SRAM for WL55 |
| External memory / boot | QSPI on selected devices | No external code flash normally required |
| Package / I/O | Up to 72 I/O in large packages; packages expose fewer | Up to 43 GPIO (package-dependent; smaller package fewer) |
| Wireless | Integrated 2.4 GHz BLE + IEEE 802.15.4 (Thread/Zigbee); **no Wi-Fi** | Integrated sub-GHz LoRa/(G)FSK/(G)MSK/BPSK; no Wi-Fi/BLE |
| Ethernet | — | — |
| CAN / CAN-FD | — | — |
| USB | FS USB device on applicable package; not HS/OTG host | No native USB host/device listed for WL55 |
| I²C | Up to 3 | I²C present; exact count/package dependent |
| I²S | SAI/digital audio on selected parts; verify package | No I²S claim used |
| ADC / DAC | 12-bit ADC, oversampling; no general DAC relied on | 12-bit ADC + 12-bit DAC (low-power sample/hold) |
| PWM / timing | Timers/PWM; package multiplexing matters | Timers/PWM; package multiplexing matters |
| AI / other acceleration | Radio processor + crypto; no NN accelerator | Radio processor + crypto; no NN accelerator |
| Add-on boundary | Antenna/matching design and certification; add an external CAN controller if needed | RF matching/antenna and regional frequency plan; board may add RF components |

Sources: [S26](#s26), [S27](#s27).

### 28–31 · Nordic wireless silicon and cellular SiP

| Feature | **28 · nRF52832** | **29 · nRF52840** | **30 · nRF5340** | **31 · nRF9160 SiP** |
|---|---|---|---|---|
| Product class | 2.4 GHz radio SoC | 2.4 GHz radio SoC | Dual-core radio SoC | Cellular system-in-package (SiP), not a generic MCU module |
| CPU / clock | Cortex-M4F, 64 MHz | Cortex-M4F, 64 MHz | App M33 up to 128 MHz + network M33 64 MHz | App Cortex-M33, 64 MHz + integrated cellular modem |
| On-chip memory | 256/512 KiB flash, 32/64 KiB RAM | 1 MiB flash, 256 KiB RAM | App 1 MiB flash/512 KiB RAM; net 256 KiB/64 KiB | 1 MiB flash, 256 KiB RAM |
| External memory / boot | Internal flash | Internal flash; QSPI for external memory | QSPI/HS-SPI for external storage | SiP integrates modem/RF components; SIM/eSIM and antenna system still needed |
| Package / I/O | GPIO count/package variant; typically 32-class usable I/O | Up to 48 GPIO | Package variant; up to 48-class GPIO | 32 GPIO-class signals on the SiP; confirm exact board/module routing |
| Wireless | BLE, mesh, ANT, NFC, proprietary 2.4 GHz; no Wi-Fi | BLE + 802.15.4 Thread/Zigbee + NFC; no Wi-Fi | BLE + 802.15.4 Thread/Zigbee + NFC; no Wi-Fi | LTE-M/NB-IoT cellular + GNSS; no Wi-Fi/Bluetooth radio in this SiP |
| Ethernet | — | — | — | — |
| CAN / CAN-FD | — | — | — | — |
| USB | — | FS USB device, not host/OTG | FS USB device on supported design, not general OTG host | — |
| I²C | TWI present | TWI present | TWI present | I²C present |
| I²S | 1 I²S | 1 I²S | I²S + PDM audio | I²S + PDM audio |
| ADC / DAC | 12-bit ADC; no voltage DAC | 12-bit ADC; no voltage DAC | 12-bit ADC; no voltage DAC | 12-bit ADC; no voltage DAC |
| PWM / timing | 4 PWM units | 4 PWM units | 4 PWM units | PWM present |
| AI / other acceleration | Crypto, no NPU | Crypto, no NPU | Crypto; separate radio core, no NPU | Cellular modem/GNSS; no NN NPU |
| Add-on boundary | Antenna/RF layout; no bus PHYs | Antenna; USB device only | Antenna and USB device implementation | Cellular plan/SIM, cellular/GNSS antenna, matching/certification; DK's nRF52840 is a separate chip |

Sources: [S28](#s28)–[S31](#s31).

### 32–34 · LPC and first i.MX RT crossover MCU

| Feature | **32 · LPC1768** | **33 · LPC4088** | **34 · i.MX RT1010** |
|---|---|---|---|
| CPU / clock | Cortex-M3, 100 MHz | Cortex-M4, up to 120 MHz | Cortex-M7, up to 500 MHz |
| On-chip memory | Up to 512 KiB flash/64 KiB SRAM | Up to 512 KiB flash/96 KiB SRAM | 128 KiB RAM; no on-chip application flash |
| External memory / boot | External memory controller | EMC/SPIFI; external memory optional | **External boot flash required** (FlexSPI); 128 KiB on-chip RAM is not program flash |
| Package / I/O | 100-pin variant up to 70 GPIO | Package-dependent, up to 165 GPIO in largest package | Package-dependent; high-speed GPIO and multiplexed pads |
| Wireless | —; add host-controlled radio module if needed | —; expansion header may take a radio module | —; external radio/module over SPI/SDIO |
| Ethernet | 10/100 MAC; external PHY/magnetics | 10/100 MAC; external PHY/magnetics | — |
| CAN / CAN-FD | 2 × classical CAN; external transceivers | 2 × classical CAN; external transceivers | No CAN controller relied on |
| USB | FS host/device/OTG controller with on-chip PHY | FS host/device/OTG with on-chip PHY | USB OTG FS with integrated PHY |
| I²C | 3 | 3 | 2 |
| I²S | 1 | 1 | SAI/I²S audio interfaces |
| ADC / DAC | 12-bit 8-channel ADC; 10-bit DAC | 12-bit 8-channel ADC; 10-bit DAC | 12-bit ADC; no DAC relied on |
| PWM / timing | Motor PWM + general PWM | Motor PWM, SCTimer and general PWM | FlexPWM/timers |
| AI / other acceleration | — | LCD/EMC/DMA; no NPU | — |
| Add-on boundary | PHY, magnetics, CAN transceivers, USB host VBUS | PHY, CAN transceivers, external memory/board features | External flash is mandatory for normal application boot; PHY/transceivers are not included |

Sources: [S32](#s32)–[S34](#s34).

### 35–37 · i.MX RT high-performance crossover parts

| Feature | **35 · i.MX RT1060 family** | **36 · i.MX RT1062** | **37 · i.MX RT1170** |
|---|---|---|---|
| CPU / clock | Cortex-M7; speed grade up to 600 MHz on selected RT1060 variants | Cortex-M7; common RT1062 rated 528 MHz; Teensy board may run 600 MHz | M7 up to 1 GHz + M4 up to 400 MHz (ordering code/conditions matter) |
| On-chip memory | 1 MiB RAM; no on-chip application flash | 1 MiB RAM; no on-chip application flash | 2 MiB RAM; no on-chip application flash |
| External memory / boot | External QSPI flash required; SDRAM/PSRAM optional | External QSPI flash required; Teensy board supplies flash | External NOR/HyperFlash/QSPI and optional SDRAM/PSRAM; external flash required for application storage |
| Package / I/O | Package-dependent; up to 127 GPIO-class pads in high-I/O variants | SoC package-dependent; Teensy boards expose board-specific subsets | Package-dependent high-I/O BGA; exact multiplexing is substantial |
| Wireless | —; external radio | —; Teensy add-on/module required | —; external radio/module |
| Ethernet | 10/100 MAC on selected derivatives; PHY/magnetics external | 10/100 MAC; PHY external or board-supplied | 10/100 + Gigabit MAC options; external PHY/magnetics |
| CAN / CAN-FD | FlexCAN controllers; CAN-FD support depends on controller/variant | FlexCAN controllers, including FD-capable configurations; verify exact part | 3 × FlexCAN with FD support |
| USB | 2 × USB OTG; PHY/interface configuration by exact chip/board | 2 × USB OTG; host requires VBUS/power | 2 × USB 2.0 OTG with integrated PHYs |
| I²C | 4 | 4 | 6 |
| I²S | Up to 3 SAI/I²S | Up to 3 SAI/I²S | 4 SAI supporting I²S/TDM/AC97 |
| ADC / DAC | 2 ADC blocks; no DAC relied on | 2 ADC blocks; no DAC relied on | 2 ADCs + 1 DAC on applicable family configuration |
| PWM / timing | FlexPWM, QTimer and quadrature encoders | FlexPWM/QTimer; Teensy board routes subset | Multiple FlexPWM/timers |
| AI / other acceleration | PXP 2D graphics; no NPU | PXP 2D graphics; no NPU | DSP/graphics accelerators; no dedicated NPU claim |
| Add-on boundary | External flash; Ethernet PHY/magnetics and CAN transceivers; USB host power | External flash; Ethernet PHY/CAN transceivers; Teensy 4.x board adds its own connectors | External flash/DRAM as required; PHY/magnetics and CAN transceivers; USB host VBUS |

Sources: [S35](#s35)–[S37](#s37).

### 38–39 · MCX N947 and Kinetis KW41Z

| Feature | **38 · MCX N947 MCU / FRDM-MCXN947 board** | **39 · KW41Z radio MCU** |
|---|---|---|
| Product class | MCXN947 is silicon; FRDM-MCXN947 is a development board | Radio MCU/SoC |
| CPU / clock | Dual Cortex-M33, up to 150 MHz each | Cortex-M0+, up to 48 MHz |
| On-chip memory | Up to 2 MiB flash and 1 MiB RAM; ECC configuration can reduce usable RAM by exact part | Up to 512 KiB flash/128 KiB SRAM (smaller density variants exist) |
| External memory / boot | FlexSPI external flash; FRDM board includes 64-Mbit QSPI flash | Internal flash; external storage optional |
| Package / I/O | VFBGA184 up to 124 GPIO; LQFP100 lower GPIO (package-specific) | Package-specific; QFN/WLCSP options |
| Wireless | None in MCXN947 silicon; FRDM board's Wi-Fi header is an expansion point, not built-in radio | 2.4 GHz BLE 4.2, IEEE 802.15.4, generic FSK; no Wi-Fi |
| Ethernet | MAC/controller; FRDM board populates an Ethernet PHY and connector | — |
| CAN / CAN-FD | 2 × CAN-FD-capable FlexCAN; FRDM board populates one CAN-FD transceiver | — |
| USB | USB HS host/device with on-chip PHY; board adds Type-C connector | — |
| I²C | Flexcomm configurable I²C | 2 × I²C |
| I²S | SAI/audio interface present | No I²S claim used |
| ADC / DAC | ADCs; DAC count/resolution varies by N94x ordering code | 16-bit ADC and 12-bit DAC on family documentation |
| PWM / timing | FlexPWM, event/control and motor-control support | PWM/timers; channel set depends on part |
| AI / other acceleration | NPU, PowerQuad DSP/math accelerator, SmartDMA | Radio MAC/PHY accelerators; no NN accelerator |
| Add-on boundary | On bare silicon add Ethernet PHY/magnetics and CAN-FD transceiver; FRDM board supplies both physical-layer parts, 64-Mbit QSPI flash and debugger | RF antenna/matching and protocol stack; no CAN/Ethernet/USB controller assumed |

Sources: [S38](#s38), [S39](#s39).

### 40–43 · Classic AVR and tinyAVR

| Feature | **40 · ATmega328P** | **41 · ATmega2560** | **42 · ATtiny85** | **43 · ATtiny1614/1616** |
|---|---|---|---|---|
| CPU / clock | 8-bit AVR, up to 20 MHz (operating-voltage grade matters) | 8-bit AVR, up to 16 MHz | 8-bit AVR, up to 20 MHz at rated voltage | 8-bit AVR, up to 20 MHz |
| On-chip memory | 32 KiB flash, 2 KiB SRAM, 1 KiB EEPROM | 256 KiB flash, 8 KiB SRAM, 4 KiB EEPROM | 8 KiB flash, 512 B SRAM, 512 B EEPROM | 16 KiB flash, 2 KiB SRAM, 256 B EEPROM |
| External memory / boot | Internal flash; USB-to-serial is external board hardware | Internal flash; USB-to-serial is external board hardware | Internal flash; ISP programming | Internal flash; UPDI programming |
| Package / I/O | 28/32-pin; up to 23 GPIO, package dependent | 100-pin; up to 86 GPIO | 8-pin; 6 GPIO | 14/20-pin; about 12/18 usable GPIO, mux-dependent |
| Wireless | — | — | — | — |
| Ethernet | — | — | — | — |
| CAN / CAN-FD | — | — | — | — |
| USB | — | — | — | — |
| I²C | 1 TWI | 1 TWI | USI can be software-configured for two-wire modes; not a full I²C peripheral | 1 TWI |
| I²S | — | — | — | — |
| ADC / DAC | 10-bit ADC; no DAC | 10-bit ADC; no DAC | 10-bit ADC; no DAC | 10-bit ADC; 8-bit DAC outputs/features vary by part |
| PWM / timing | Timer PWM | Timer PWM | 2 PWM outputs | TCA/TCD timer PWM |
| AI / other acceleration | — | — | — | Core-independent peripherals/logic; not AI |
| Add-on boundary | Arduino Uno-style board adds USB-UART, power and headers | Mega board adds USB-UART and headers | External USB programmer; no native USB | Requires UPDI programmer; package and pin mux limit exposed channels |

Sources: [S40](#s40)–[S43](#s43).

### 44–47 · Microchip SAM families

| Feature | **44 · SAMD21** | **45 · SAMD51** | **46 · SAME54** | **47 · SAME70 / SAMV71** |
|---|---|---|---|---|
| CPU / clock | Cortex-M0+, 48 MHz | Cortex-M4F, 120 MHz | Cortex-M4F, 120 MHz | Cortex-M7, up to 300 MHz |
| On-chip memory | 32–256 KiB flash, 4–32 KiB SRAM | Up to 1 MiB flash, 256 KiB SRAM | Up to 1 MiB flash, 256 KiB SRAM | Up to 2 MiB flash, 384 KiB SRAM (family/part varies) |
| External memory / boot | Internal flash; board may add external storage | QSPI available on selected parts | QSPI available; external memory optional | QSPI/EBI/SDRAM interfaces on selected parts |
| Package / I/O | Up to 52 I/O on largest package; common G18 has 48-pin package | Package variants; large-pin parts expose more SERCOM/ADC | 48–128-pin; up to 114 I/O in large package | Up to 144-pin; around 114 GPIO in high-I/O variants |
| Wireless | —; board may add a radio module | —; board may add a radio module | —; board may add a radio module | — |
| Ethernet | — | — | 10/100 MAC; external PHY/magnetics | E70/V71 variants have 10/100 MAC; external PHY; S70/V70 may omit Ethernet |
| CAN / CAN-FD | — | — | Up to 2 × CAN-FD | E70/V71: up to 2 × CAN-FD; exact product line differs |
| USB | FS host/device controller; board/connector-dependent | FS host/device controller | FS host/device | HS device/mini-host; PHY and host implementation depend on exact package/board |
| I²C | SERCOM instances can be I²C | SERCOM instances can be I²C | SERCOM plus dedicated I²C; I²S-capable SAI | TWIHS controllers; I2SC/SSC provide digital audio |
| I²S | I²S peripheral | I²S peripherals | I²S/SAI | I2SC and SSC with I²S/TDM |
| ADC / DAC | 12-bit ADC; 10-bit DAC in family | Dual 12-bit ADC and dual 12-bit DAC, density/package variant | Dual 12-bit ADC, dual 12-bit DAC | Dual AFEC/12-bit ADC, 2-channel 12-bit DAC |
| PWM / timing | TCC/TC timer PWM | TCC/timer PWM | TCC/TC PWM | TC/PWM channels, package-dependent |
| AI / other acceleration | Event system; no NPU | DSP/FPU; no NPU | DSP/FPU; no NPU | DSP/FPU/graphics; no NPU |
| Add-on boundary | Add Wi-Fi/BLE module separately; USB host power circuitry | Add radio module separately | External Ethernet PHY and CAN-FD transceivers unless supplied by board | External PHY and CAN transceivers; high-speed USB port details are board/package-specific |

Sources: [S44](#s44)–[S47](#s47).

### 48–50 · PIC32MZ, PIC18, and AVR Dx

| Feature | **48 · PIC32MZ EF** | **49 · PIC18 K42 representative** | **50 · AVR128DA/DB** |
|---|---|---|---|
| CPU / clock | MIPS microAptiv M-class, up to 200/252 MHz depending part | 8-bit PIC18, up to 64 MHz | 8-bit AVR, up to 24 MHz |
| On-chip memory | 512 KiB–2 MiB flash, 128–512 KiB SRAM by suffix | 32–128 KiB flash and RAM varies by K42 SKU | 128 KiB flash, 16 KiB SRAM, EEPROM/configuration memory |
| External memory / boot | SQI/EBI and external memory on selected parts | Internal flash; boot block/SAF | Internal flash; external memories via serial interfaces |
| Package / I/O | 64–144-pin family; pin count and exposed analog differ | 28–64-pin family; GPIO and memory vary by device | 28/32/48/64-pin; up to about 55 GPIO on the largest package |
| Wireless | — | — | — |
| Ethernet | 10/100 MAC; external PHY/magnetics | — | — |
| CAN / CAN-FD | 2 × classical CAN 2.0B; external transceivers | — | — |
| USB | HS OTG controller; external ULPI PHY needed for HS; FS PHY support is variant/configuration-specific | No USB controller in the K42 example family | — |
| I²C | Multiple I²C modules | MSSP/I²C; count varies | TWI/I²C; count varies by pin-count variant |
| I²S | Audio/I²S interface | — | — |
| ADC / DAC | 12-bit high-speed ADC (up to 18 MSPS, many inputs); no DAC in EF | 12-bit ADC with computation; small 5-bit DAC on relevant members | 12-bit ADC; DB has 10-bit DAC; DA variants do not all have DAC |
| PWM / timing | Output compare/PWM | CCP/PWM and timer modules | TCA/TCB/TCD timer PWM |
| AI / other acceleration | FPU/DSP; no NPU | Core-independent peripherals, no NPU | CCL/event system, no NPU |
| Add-on boundary | PHY, magnetics, CAN transceivers, high-speed USB PHY and board-level connectors may be external | Exact part number is essential; PIC18 is a broad family | Check DA versus DB and package before counting DAC, GPIO or ADC channels |

Sources: [S48](#s48)–[S50](#s50).

### 51–54 · TI low-power/general-purpose MCUs

| Feature | **51 · MSP430G2 / G2553** | **52 · MSP430FR / FR5992** | **53 · MSP432P4111** | **54 · MSPM0G3507** |
|---|---|---|---|---|
| CPU / clock | 16-bit MSP430, 16 MHz | 16-bit MSP430, 16 MHz | Cortex-M4F, up to 48 MHz | Cortex-M0+, up to 80 MHz |
| On-chip memory | 16 KiB flash, 512 B SRAM | Family varies; the cited MSP430FR5992 has 128 KiB FRAM and 8 KiB SRAM | Up to 2 MiB flash, 256 KiB SRAM | 128 KiB flash, 32 KiB SRAM |
| External memory / boot | Internal flash | On-chip FRAM is nonvolatile program/data memory; density depends on exact family member | Internal flash | Internal flash |
| Package / I/O | 20/28/32-pin; 24 GPIO-class I/O max by package | Up to 68 GPIO on largest package | Package-dependent, up to about 100 GPIO-class I/O | 24–60 GPIO by package |
| Wireless | — | — | — | — |
| Ethernet | — | — | — | — |
| CAN / CAN-FD | — | — | Exact P4111 variant needs datasheet check; do not infer CAN-FD | CAN-FD controller; external transceiver |
| USB | — | — | USB availability is device/board-dependent; check P4111 exact datasheet | — |
| I²C | USCI I²C | eUSCI I²C | I²C modules | 2 I²C |
| I²S | — | — | No I²S claim used | — |
| ADC / DAC | 10-bit ADC; no DAC | 12-bit ADC; no DAC | 14-bit ADC; no DAC claim | Dual 12-bit ADCs; 12-bit DAC on supported package/variant |
| PWM / timing | Timer_A PWM | Timer PWM | Timer/PWM | Advanced PWM/timers, analog control peripherals |
| AI / other acceleration | — | LEA low-energy signal accelerator | DSP/FPU | MATHACL math accelerator; not a neural NPU |
| Add-on boundary | Programmer/debug hardware; no wireless/Ethernet/USB | Verify FRAM density and GPIO package | Confirm exact part's USB/CAN/analog matrix | CAN needs transceiver; no radio/Ethernet |

Sources: [S51](#s51)–[S54](#s54).

### 55–58 · TI wireless and real-time control

| Feature | **55 · CC2652R** | **56 · CC1352R** | **57 · CC3220S** | **58 · TMS320F28379D** |
|---|---|---|---|---|
| CPU / clock | Cortex-M4F, 48 MHz | Cortex-M4F, 48 MHz | Cortex-M4, 80 MHz | 2 × C28x at 200 MHz + 2 × CLA accelerators |
| On-chip memory | 352 KiB flash, 88 KiB SRAM + ROM | 352 KiB flash, 88 KiB SRAM + ROM | 256 KiB RAM; S variant relies on external serial flash | 1 MiB flash, about 204 KiB RAM |
| External memory / boot | Internal flash | Internal flash | External serial flash required for application image on `CC3220S`; SF has different flash integration | Internal flash; board may add external storage |
| Package / I/O | Up to 31 GPIO | Up to 28 GPIO | Up to 27 GPIO | Up to 169 GPIO by package |
| Wireless | 2.4 GHz BLE, Thread, Zigbee; no Wi-Fi | Sub-1 GHz + 2.4 GHz multiprotocol (BLE/802.15.4/FSK etc); no Wi-Fi | 2.4 GHz Wi-Fi; no integrated Bluetooth | — |
| Ethernet | — | — | — | — |
| CAN / CAN-FD | — | — | — | 2 × classical CAN; transceivers external; no CAN-FD claim |
| USB | — | — | — | USB 2.0 FS controller; host/device role depends on configuration |
| I²C | Yes | Yes | Yes | 2 I²C |
| I²S | Yes | Yes | McASP/I²S audio support | McBSP/serial audio; not generic I²S peripheral |
| ADC / DAC | 12-bit ADC; small 8-bit DAC on sensor subsystem; no line DAC claim | 12-bit ADC + sensor-controller DAC | 12-bit ADC; no DAC claim | Multiple 12-bit/16-bit ADC modules; 2 × 12-bit DAC outputs (variant/configuration) |
| PWM / timing | Timers/PWM | Timers/PWM | PWM/timers | Up to 24 PWM outputs, capture/QEP |
| AI / other acceleration | Sensor controller, crypto; no NPU | Sensor controller, crypto; no NPU | Network processor/security hardware; no NPU | CLA, FPU, trigonometric math/control accelerators; not a neural NPU |
| Add-on boundary | RF antenna/matching; no Wi-Fi | RF antenna/matching; sub-GHz antenna band-specific | External serial flash for S; Wi-Fi antenna/RF design | CAN transceivers; motor drivers/isolation/current-sense circuitry are board-level |

Sources: [S55](#s55)–[S58](#s58).

### 59–60 · Raspberry Pi RP2040 and RP2350 silicon

| Feature | **59 · RP2040** | **60 · RP2350 / RP2354** |
|---|---|---|
| CPU / clock | Dual Cortex-M0+, up to 133 MHz (some operating points higher) | Dual Cortex-M33 **or** dual Hazard3 RISC-V, up to 150 MHz |
| On-chip memory | 264 KiB SRAM; no internal flash | 520 KiB SRAM; no internal flash on RP2350; RP2354 has stacked 2 MiB flash |
| External memory / boot | External QSPI flash required | External QSPI flash required except RP2354 stacked flash; extra PSRAM via QMI supported |
| Package / I/O | QFN56; 30 GPIO, 4 ADC-capable | RP2350A 30 GPIO/4 ADC, RP2350B 48 GPIO/8 ADC; RP2354 variants include flash |
| Wireless | — (Pico W board adds CYW43439) | — (Pico 2 W board adds CYW43439) |
| Ethernet | — | — |
| CAN / CAN-FD | No native CAN controller; PIO can implement custom serial signaling, not a substitute for a validated CAN MAC | No native CAN controller; PIO can implement custom protocols, not equivalent to a CAN peripheral |
| USB | USB 1.1 FS host/device controller + PHY; host needs VBUS power circuitry | USB 1.1 FS host/device controller + PHY; host needs VBUS power circuitry |
| I²C | 2 | 2 |
| I²S | No dedicated I²S; PIO can implement I²S | No dedicated I²S; PIO can implement I²S |
| ADC / DAC | 12-bit, 4 external channels; no DAC | 12-bit, 4/8 external channels by package; no DAC |
| PWM / timing | 16 PWM channels + 2 PIO blocks | 24 PWM channels + 3 PIO blocks |
| AI / other acceleration | PIO/state machines, DMA; no NPU | PIO/state machines, HSTX/crypto features; no NPU |
| Add-on boundary | Flash and board power/USB connector; a Pico board adds regulator/debug/headers | Flash on RP2354 only; board header exposes fewer pins; USB host requires VBUS design |

Sources: [S59](#s59), [S60](#s60).

### 61–63 · Renesas RA/RX families

| Feature | **61 · RA4M1** | **62 · RA6M5** | **63 · RX65N** |
|---|---|---|---|
| CPU / clock | Cortex-M4, 48 MHz | Cortex-M33, 200 MHz | Renesas RXv2, 120 MHz |
| On-chip memory | 256 KiB flash, 32 KiB SRAM | 1–2 MiB flash, about 512 KiB SRAM (parity/ECC allocation) | 512 KiB–2 MiB flash; 256/640 KiB SRAM by variant |
| External memory / boot | Internal flash | OSPI/QSPI and external bus on selected parts | SDRAM interface on selected variants |
| Package / I/O | 40–100 pins; 28–84 I/O by package | Up to about 133 I/O by package | 100–176 pins; up to about 137 I/O |
| Wireless | — | — | — |
| Ethernet | — | 10/100 MAC; PHY/magnetics external | 10/100 MAC; PHY/magnetics external |
| CAN / CAN-FD | 1 × classical CAN 2.0B | Up to 2 × CAN-FD (or classical mode, device-specific) | Up to 2 × classical CAN; no CAN-FD |
| USB | FS host/device | FS and HS controller variants; check PHY and package | FS host/device/OTG |
| I²C | 2 IIC | 2–3 IIC | Multiple RIIC/I²C interfaces |
| I²S | SSIE audio interface on supported device | Serial sound interface; exact part-specific | SSIE/audio interface on supported device |
| ADC / DAC | 14-bit ADC; 12-bit + 8-bit DAC features | 12-bit ADC; 2 × 12-bit DAC | 12-bit ADC; 1–2 12-bit DAC by variant |
| PWM / timing | GPT/AGT PWM | GPT/AGT PWM | Many timer/PWM channels |
| AI / other acceleration | Touch, event control; no NPU | Security/crypto; no NPU | DSP/control peripherals; no NPU |
| Add-on boundary | No radio/Ethernet; CAN transceiver and USB host power if used | Ethernet PHY/magnetics and CAN transceivers | Ethernet PHY/magnetics and CAN transceivers |

Sources: [S61](#s61)–[S63](#s63).

### 64–66 · Infineon PSoC families

| Feature | **64 · PSoC 4 family** | **65 · PSoC 5LP** | **66 · PSoC 6 family** |
|---|---|---|---|
| CPU / clock | Cortex-M0/M0+; roughly 16–48 MHz by subfamily | Cortex-M3, up to 80 MHz | Dual Cortex-M4 + M0+; up to 150/100 MHz by part |
| On-chip memory | About 16–256 KiB flash, 2–32 KiB SRAM across family | Up to 256 KiB flash/64 KiB SRAM | 256 KiB–2 MiB flash, 128 KiB–1 MiB SRAM |
| External memory / boot | Internal flash; variant-dependent | External memory interface on selected parts | QSPI memory expansion; variant-dependent |
| Package / I/O | Wide range; about 20–98 GPIO across family | 68/100-pin class; package-specific | Package-dependent; check exact CY8C part and module |
| Wireless | BLE only on selected PSoC 4 BLE devices | — | BLE integrated on selected PSoC 6 devices; not the whole family |
| Ethernet | — | — | — |
| CAN / CAN-FD | CAN/USB only on selected subfamilies; not a PSoC 4-wide guarantee | CAN 2.0 on selected parts; not universal | CAN-FD on selected products; check part |
| USB | Selected variants; usually device function | FS USB device | FS USB host/device on selected parts |
| I²C | SCB or programmable logic, varies | Programmable digital blocks can implement I²C | SCB I²C/SPI/UART |
| I²S | Can be built in programmable logic on some variants | UDB implementation possible | I²S/PDM on selected family members |
| ADC / DAC | Family-variant analog (SAR/slope ADC, IDAC); do not assume a buffered voltage DAC | Flexible analog, ADC and DAC/IDAC resources | 12-bit ADC, 12-bit DAC and op-amps on applicable parts |
| PWM / timing | TCPWM, configurable logic | Programmable digital blocks/timers | TCPWM and programmable logic |
| AI / other acceleration | Configurable analog/digital blocks, no NPU | Digital filter block; no NPU | Crypto/DSP, no NPU |
| Add-on boundary | Choose exact PSoC family part; analog blocks and wireless are highly variant-dependent | USB is device, not OTG host; CAN transceiver required | Check BLE/CAN-FD/USB feature against exact ordering code; CAN transceiver required |

Sources: [S64](#s64)–[S66](#s66).

### 67–68 · Host-controlled radio and Infineon XMC

| Feature | **67 · CYW43439 radio IC** | **68 · XMC4000 family** |
|---|---|---|
| Product class | Host-controlled Wi-Fi/Bluetooth radio; **not a general MCU** | Industrial Cortex-M4 MCU family; exact XMC part required |
| CPU / clock | No host CPU | Cortex-M4, about 120–180 MHz across XMC4000 members |
| On-chip memory | Radio firmware memory; not application flash/RAM for a host MCU | Flash/SRAM vary widely by XMC member |
| External memory / boot | Host processor and host driver required | Varies by part; some include external memory interfaces |
| Package / I/O | Radio package/module; no user GPIO bank comparable to an MCU | Package-dependent I/O/peripheral matrix |
| Wireless | 2.4 GHz Wi-Fi 4 + Bluetooth; exact Bluetooth profile/version is SKU/document-specific | — unless attached to external radio |
| Ethernet | — | Ethernet MAC on selected XMC4000 members; PHY external |
| CAN / CAN-FD | — | Classical CAN on selected members; check exact part for FD (do not infer) |
| USB | — | USB device/host varies by member |
| I²C | Host interface is typically SDIO or SPI; I²C not an MCU peripheral | Varies |
| I²S | PCM/I²S audio interface may be available to host | Varies |
| ADC / DAC | — | ADC/analog resources vary; do not assume a DAC on every XMC4000 |
| PWM / timing | — | Timers/PWM vary by member |
| AI / other acceleration | Radio/baseband offload only | Industrial control peripherals; no NPU claim |
| Add-on boundary | Needs a host MCU/MPU, firmware/driver, RF antenna, power, and host-bus routing | Choose exact XMC SKU, PHY/transceivers, package and pinout before design |

Sources: [S67](#s67), [S68](#s68).

### 69–71 · Bouffalo Lab Wi-Fi / BLE families

| Feature | **69 · BL602** | **70 · BL616/BL618** | **71 · BL702** |
|---|---|---|---|
| CPU / clock | Single 32-bit RISC-V, up to about 192 MHz | Single 32-bit RISC-V, up to 320 MHz | Single 32-bit RISC-V, up to 144 MHz |
| On-chip memory | About 276 KiB SRAM (datasheet revision/usable region matters); ROM | About 484–532 KiB SRAM by document revision; 128 KiB ROM | 132 KiB RAM, 192 KiB ROM; optional in-package flash SKU |
| External memory / boot | External QSPI flash on many parts/modules | External flash; BL618 package/module may add 4 MiB PSRAM | In-package flash on some C/S SKU; external QSPI optional |
| Package / I/O | QFN32; GPIO subset shared with RF/flash | QFN40 up to 19 GPIO / QFN56 up to 35 | BL702 about 15 GPIO; related BL704/706 have more (not the same part) |
| Wireless | 2.4 GHz Wi-Fi 4 + BLE | Wi-Fi 6 + BLE + 802.15.4; BL618 adds audio features | BLE 5 + 802.15.4/Zigbee; **no Wi-Fi** |
| Ethernet | — | MAC on BL618 configurations only; external PHY/magnetics | No Ethernet on BL702; related BL704/706 add MAC |
| CAN / CAN-FD | — | No CAN-FD claim in cited datasheet; controller presence is unclear across BL61x material, so verify the exact part/SDK or use an external controller | — |
| USB | No native USB host/device claim relied on | USB 2.0 HS OTG host/device | USB 2.0 FS device (not assume OTG host) |
| I²C | I²C present | 2 I²C | 1 I²C master |
| I²S | I²S present | 1 I²S; audio codec in BL618 | 1 I²S |
| ADC / DAC | ADC/DAC blocks, resolution/channel counts vary by datasheet | General ADC/DAC; BL618 adds audio ADC/DAC | 12-bit ADC; 10-bit DAC |
| PWM / timing | PWM/timers | PWM/timers | 5 PWM channels + timers |
| AI / other acceleration | No dedicated NPU claim | No dedicated NPU claim | No NPU |
| Add-on boundary | External flash/antenna; no Ethernet/CAN | Verify BL618 vs BL616 for EMAC/audio/pin count; PHY external; for CAN, verify the exact controller or add an external controller plus transceiver | No Wi-Fi or Ethernet on BL702; RF antenna and flash are SKU-dependent |

Sources: [S69](#s69)–[S71](#s71). Bouffalo datasheet links are vendor documents mirrored by third-party document hosts where an official English URL was not available.

### 72–75 · WCH inexpensive MCU family

| Feature | **72 · CH32V003** | **73 · CH32V203** | **74 · CH32V307** | **75 · CH552** |
|---|---|---|---|---|
| CPU / clock | QingKe RISC-V V2A, 48 MHz | QingKe RISC-V V4B, up to 144 MHz | QingKe RISC-V V4F, up to 144 MHz | Enhanced E8051, up to 24 MHz |
| On-chip memory | 16 KiB flash, 2 KiB SRAM | 32–128 KiB flash, 10–64 KiB SRAM by suffix | Common high-density part 256 KiB flash/64 KiB SRAM | 16 KiB flash, 256 B iRAM + 1 KiB xRAM |
| External memory / boot | Internal flash; single-wire debug | Internal flash; USB boot paths vary | Internal flash; external memories on selected interfaces | Internal ROM/bootloader; USB/UART ISP |
| Package / I/O | 8–20 pins; 6–18 GPIO depending package | 20–64 pins; up to about 51 GPIO by part | Up to 100-pin; around 80 GPIO on high-pin part | Up to 17 GPIO, many pins shared with USB/clock/reset |
| Wireless | — | — | — | — |
| Ethernet | — | — | Gigabit MAC + integrated 10-M PHY on documented V307 variant; verify exact SKU | — |
| CAN / CAN-FD | — | 1 × classical CAN 2.0B | 2 × classical CAN 2.0B; not CAN-FD | — |
| USB | — | FS host/device interface(s); controller/role count depends on exact suffix | FS OTG + HS host/device with integrated HS PHY on V307 family | USB FS controller/transceiver; documented host/device support depends on CH552 revision/manual; do not assume OTG |
| I²C | 1 | 2 | 2 | No dedicated I²C claim; bit-banged possible |
| I²S | — | — on V203 entry | 2 | — |
| ADC / DAC | 10-bit ADC; no DAC | 12-bit ADC; no DAC in common V203 | 2 × 12-bit DAC; 2 ADC blocks, 12-bit | 8-bit ADC; no DAC |
| PWM / timing | Timer PWM; one advanced timer | Timers/PWM | Advanced motor PWM/timers | 2 × 8-bit PWM |
| AI / other acceleration | OPA; no NPU | OPA/touch peripherals; no NPU | OPA/touch peripherals; no NPU | Touch-key logic; no NPU |
| Add-on boundary | No USB; low-pin-count parts reduce analog/GPIO | CAN transceiver and USB connector/power; check suffix | PHY/connector may be external despite integrated MAC/10M-PHY; CAN transceivers required | USB host VBUS and role support must be verified; GPIO count includes multiplexed pins |

Sources: [S72](#s72)–[S75](#s75).

### 76–78 · GigaDevice GD32 variants

| Feature | **76 · GD32VF103** | **77 · GD32F303** | **78 · GD32E230** |
|---|---|---|---|
| CPU / clock | RISC-V 32-bit, up to 108 MHz | Cortex-M4F, up to 120 MHz | Cortex-M23, up to 72 MHz |
| On-chip memory | 16–128 KiB flash, 16–32 KiB SRAM | Family ranges widely; up to 3 MiB flash/96 KiB SRAM, but the exact F303 part is often much smaller | Up to 64 KiB flash/8 KiB SRAM |
| External memory / boot | Internal flash | EXMC on high-pin variants; no external boot memory generally required | Internal flash |
| Package / I/O | Up to 100-pin; up to 80 GPIO | Up to 144-pin; up to 112 GPIO | Up to 48-pin; up to 39 GPIO |
| Wireless | — | — | — |
| Ethernet | — for GD32VF103 | No EMAC on the F303 entry; related F305/F307 are different parts | — |
| CAN / CAN-FD | Up to 2 × classical CAN 2.0B; external transceiver | Classical CAN 2.0B, count/package varies; external transceiver | — |
| USB | FS USB controller; FS OTG/device role depends on exact part | FS USB device on documented F303 parts | — |
| I²C | Up to 2 | Up to 2 | I²C present; exact count varies |
| I²S | Up to 2 | Up to 2, multiplexed with SPI | — |
| ADC / DAC | Up to 2 × 12-bit ADC + 2 × 12-bit DAC | Up to 3 × 12-bit ADC; DAC count varies by F303 suffix | 12-bit ADC, up to 2 MSPS; no DAC claim used |
| PWM / timing | Advanced timer + general timers | Advanced PWM/timers | Timer PWM |
| AI / other acceleration | — | DSP/FPU, no NPU | — |
| Add-on boundary | CAN transceiver; check USB role and flash/RAM suffix | Do not transfer F305/F307 Ethernet/CAN counts to F303 | Small memory/pin budget; exact part and package matter |

Sources: [S76](#s76)–[S78](#s78).

### 79–80 · Teensy boards (i.MX RT1062 silicon)

| Feature | **79 · Teensy 4.0 board** | **80 · Teensy 4.1 board** |
|---|---|---|
| Product class | PJRC development board using NXP i.MX RT1062 | PJRC development board using NXP i.MX RT1062 |
| CPU / clock | Cortex-M7, board runs at 600 MHz | Cortex-M7, board runs at 600 MHz |
| On-chip memory | 1 MiB SRAM in MCU | 1 MiB SRAM in MCU |
| External memory / boot | Board supplies 1,984 KiB QSPI flash; MCU has 1 MiB RAM | Board supplies 7,936 KiB QSPI flash; microSD socket and optional memory pads; MCU has 1 MiB RAM |
| Package / I/O | Board exposes 40 digital I/O; package pins are not all headers | Board exposes 55 digital I/O; microSD/USB-host/other uses consume pins |
| Wireless | None; add a radio module | None; add a radio module |
| Ethernet | RT1062 has an MAC, but Teensy 4.0 intentionally does not expose the required Ethernet signals; no native PHY/port. Use SPI Ethernet or another board | Standard Teensy 4.1 includes DP83825 10/100 PHY; MagJack/connector kit is sold separately. `TEENSY41_NE` omits the PHY chip |
| CAN / CAN-FD | Board exposes 3 CAN buses, one CAN-FD capable; add transceiver(s) | Board exposes 3 CAN buses, one CAN-FD capable; add transceiver(s) |
| USB | 480-Mbit/s USB device and host controller; host needs board cable/connector and VBUS circuitry | 480-Mbit/s USB device and host controller; host needs board cable/connector and VBUS circuitry |
| I²C | Multiple I²C pin choices | Multiple I²C pin choices |
| I²S | SAI/I²S in MCU | SAI/I²S in MCU |
| ADC / DAC | 2 ADC blocks; no on-chip DAC | 2 ADC blocks; no on-chip DAC |
| PWM / timing | Many PWM-capable pins/timers | Many PWM-capable pins/timers |
| AI / other acceleration | PXP/graphics; no NPU | PXP/graphics; no NPU |
| Add-on boundary | Board price includes MCU/flash/regulator/header features; CAN needs transceiver; native Ethernet MAC signals are not exposed, so use an SPI Ethernet module or a different board; wireless needs module | Standard `TEENSY41` includes the PHY chip but needs the MagJack/connector kit; `TEENSY41_NE` has no PHY. CAN needs transceivers and wireless needs a module |

Sources: [S79](#s79), [S80](#s80). Teensy pin counts and on-board parts describe the boards, not a new MCU silicon variant.

### 81–85 · 8051, Nuvoton, Holtek, Artery, and HPMicro

| Feature | **81 · STC8 family** | **82 · Nuvoton M480** | **83 · Holtek HT32F72388** | **84 · Artery AT32F403A** | **85 · HPM6750** |
|---|---|---|---|---|---|
| CPU / clock | Enhanced 1T 8051; STC8H parts commonly 24–48 MHz | Cortex-M4F, up to 192 MHz | Cortex-M0+, up to 72 MHz | Cortex-M4F, up to 240 MHz | Dual RISC-V; up to 816 MHz/core |
| On-chip memory | STC8 variants range from small to 64 KiB flash; RAM/peripherals vary | Up to 2.5 MiB flash and 160 KiB SRAM across M480 | 512 KiB flash, 80 KiB SRAM | 256 KiB–1 MiB flash; SRAM banks depend on suffix | 2 MiB SRAM; HPM6750 normally has no embedded application flash; HPM6754 adds flash |
| External memory / boot | Variant-specific; USB/UART ISP on selected `U` parts | External bus/serial flash on selected parts | EBI/QSPI options | SPIM/XMC external memory interface | External SPI/XPI NOR/DRAM for boot/application; some related parts have embedded flash |
| Package / I/O | Package/part-specific; STC8H8K64U varies from small package to 60 GPIO-class pins | Up to about 114 I/O depending subfamily/package | Up to 67 GPIO; 48/64/80-pin LQFP | About 37–80 GPIO by package | Up to about 195 GPIO on BGA package |
| Wireless | — | — | — | — | — |
| Ethernet | — | M487 Ethernet subfamily has 10/100 MAC; PHY/magnetics external | — | — for AT32F403A; do not assume F407/F437 Ethernet features | 2 × Gigabit MAC; PHY/magnetics/connector are board-level unless supplied |
| CAN / CAN-FD | — | Classical CAN 2.0B on selected M480/M487; exact count varies | Up to 2 × classical CAN; external transceivers | Up to 2 × classical CAN 2.0B; external transceivers; no CAN-FD claim | Up to 4 × CAN-FD; external transceivers |
| USB | `U` variants may include FS device/controller; verify exact STC8 part | FS or HS OTG by subfamily; M487 includes HS OTG controller/PHY | FS USB device | FS USB device; not assume HS OTG | 2 × USB 2.0 HS OTG with integrated PHY |
| I²C | Varies; commonly UART/SPI/I²C on newer parts | Up to 3 I²C | Up to 3 I²C | Up to 3 I²C | 4 I²C |
| I²S | Varies; not assumed for STC8H | I²S/SPI-I²S on selected members | 1 I²S | Up to 4 SPI/I²S instances | 4 I²S |
| ADC / DAC | ADC resolution/channel count varies (10/12-bit parts); no family-wide DAC claim | 12-bit EADC up to 5 MSPS on selected M48x; 1–2 12-bit DAC by variant | 12-bit ADC, up to 2 MSPS; 2 × 12-bit DAC | Up to 3 × 12-bit ADC; 2 × 12-bit DAC | 3 × 12-bit ADC up to 5 MSPS + 1 × 16-bit ADC up to 2 MSPS; no DAC claim used |
| PWM / timing | Timer PWM; avoid treating PWM as a DAC | Up to 24 PWM channels on selected members | MCTM/GPTM/PWM | Advanced motor timers/PWM | 4 × 8-channel high-resolution PWM blocks; motor-control timing |
| AI / other acceleration | — | DSP/FPU/crypto; no NPU claim | AES/RNG/divider; no NPU | DSP/FPU; no NPU | DSP/SIMD, local memory; no dedicated NPU claim |
| Add-on boundary | Exact model suffix is essential; some variants have USB, others do not | PHY/transceivers and memory vary with subfamily | CAN transceivers, USB connector and host are external/not implied | CAN transceivers; no Ethernet on F403A | PHY/magnetics, CAN transceivers, boot flash/DRAM and connectors are board-level |

Sources: [S81](#s81)–[S85](#s85).

## Consolidated all-entry catalog

This index keeps every requested number visible in one place. It is deliberately a compact catalog rather than an 85-column feature table; the matrices above give the vertical feature-by-feature comparison. Price figures are the estimates supplied by the user, not verified market quotes. **B** = board, **M** = module/SiP, **A** = accelerator, **F** = broad family/variant, **S** = silicon/SoC/MCU.

| # | Entry and layer | Core / top clock; memory shorthand | Radio / wired / analog & standout | User estimate | Source |
|---:|---|---|---|---:|---|
| 1 | K230 **S** | 2× RISC-V C908, 0.8/1.6 GHz; shared/KPU SRAM, external LPDDR/DDR | KPU; USB2 OTG; no integrated Wi-Fi/EMAC claim | $12 | [S01](#s01) |
| 2 | K210 **S** | 2× 64-bit RISC-V, 400 MHz; 8 MiB SRAM, external boot flash | KPU/FFT/audio/vision; board/module dependent | $5 | [S02](#s02) |
| 3 | MAX78000 **S** | M4F 100 MHz + RV32 60 MHz; 512 KiB flash/128 KiB SRAM | Low-power CNN, I²S, camera interface; no Ethernet/radio | $12 | [S03](#s03) |
| 4 | MAX78002 **S** | M4F 120 MHz + RV32 60 MHz; 2.5 MiB flash/384 KiB SRAM | Larger CNN memory; USB HS; no Ethernet/radio | $25 | [S04](#s04) |
| 5 | BL808 **S/M** | 3 heterogeneous RISC-V cores; memory/package varies | Wi-Fi4/BT/802.15.4; MAC, HS USB; optional NPU/module memory | $7 | [S05](#s05) |
| 6 | RTL8735B / AMB82 Mini **S/M/B** | Real-M500 500 MHz; 512 KiB SRAM + SKU-specific DDR | Wi-Fi4/BLE, 0.4-TOPS NPU, ISP/audio, USB; board/module extras | $22 | [S06](#s06) |
| 7 | Coral USB Edge TPU **A** | No host CPU or application RAM | USB3 Edge TPU accelerator; host required; no MCU GPIO/ADC/etc. | $25–30 | [S07](#s07) |
| 8 | ESP32 **S/F** | Xtensa LX6, usually dual 240 MHz; 520 KiB SRAM | Wi-Fi4 + BT/BLE; MAC, classic CAN2, ADC+2 DAC; no native USB | $3 | [S08](#s08) |
| 9 | ESP32-S2 **S** | LX7 single 240 MHz; 320 KiB SRAM | Wi-Fi4, USB FS OTG, CAN2 controller, ADC+2 DAC; no BLE | $3 | [S09](#s09) |
| 10 | ESP32-S3 **S** | LX7 dual 240 MHz; 512 KiB SRAM | Wi-Fi4/BLE; USB FS OTG/JTAG, CAN2, ADC; AI/DSP extensions | $4 | [S10](#s10) |
| 11 | ESP32-C3 **S** | RISC-V single 160 MHz; 400 KiB SRAM | Wi-Fi4/BLE; USB-Serial/JTAG device, CAN2, ADC | $2 | [S11](#s11) |
| 12 | ESP32-C6 **S** | RISC-V single 160 MHz; 512+16 KiB SRAM | Wi-Fi6/BLE/802.15.4; 2 CAN2 controllers, ADC; USB debug device | $4 | [S12](#s12) |
| 13 | ESP32-H2 **S** | RISC-V single 96 MHz; 320 KiB SRAM | BLE/802.15.4, Thread/Zigbee; CAN2; no Wi-Fi | $3 | [S13](#s13) |
| 14 | ESP32-P4 **S** | Dual HP RISC-V 400 MHz + LP 40 MHz; 768 KiB HP memory | MAC, 3 CAN2 controllers, USB HS/FS, ISP/PPA; no radio | $7 | [S14](#s14) |
| 15 | STM32F103C8 / Blue Pill **S/B** | Cortex-M3 72 MHz; 64 KiB flash/20 KiB SRAM | CAN2, USB FS device, ADC; board headers/USB are board-specific | $2 | [S15](#s15) |
| 16 | STM32F401/F411 / Black Pill **S/B** | M4F 84/100 MHz; flash/SRAM varies by suffix | USB FS OTG; F411 I²S; no Ethernet/CAN/radio | $4 | [S16](#s16) |
| 17 | STM32F407 **S** | M4F 168 MHz; up to 1 MiB flash/192 KiB SRAM | Ethernet MAC, 2 CAN2, USB FS/HS, ADC/DAC/I²S | $8 | [S17](#s17) |
| 18 | STM32F429 **S** | M4F 180 MHz; up to 2 MiB flash/256 KiB SRAM | Ethernet MAC, 2 CAN2, USB FS/HS, LCD/camera, ADC/DAC | $12 | [S18](#s18) |
| 19 | STM32F446 **S** | M4F 180 MHz; up to 512 KiB flash/128 KiB SRAM | 2 CAN2, USB FS/HS, ADC/DAC/I²S; no EMAC | $8 | [S19](#s19) |
| 20 | STM32F767 **S** | M7 216 MHz; up to 2 MiB flash/512 KiB SRAM | Ethernet MAC, up to 3 CAN2, USB FS/HS, ADC/DAC | $15 | [S20](#s20) |
| 21 | STM32H743/H750 **S/F** | M7 480 MHz; H743 up to 2 MiB flash; H750 small flash; 1 MiB RAM | Ethernet MAC, 2 FDCAN, USB, ADC/DAC; H750 often needs external flash | $15–20 | [S21](#s21) |
| 22 | STM32H747 **S** | Dual M7 480 + M4 240 MHz; 2 MiB flash/1 MiB RAM | Ethernet MAC, 2 FDCAN, USB, ADC/DAC, multiple SAI | $25–30 | [S22](#s22) |
| 23 | STM32L476 **S** | M4F 80 MHz; up to 1 MiB flash/128 KiB SRAM | USB FS OTG, classical CAN, ADC/DAC/SAI | $8 | [S23](#s23) |
| 24 | STM32U575/U585 **S/F** | M33 160 MHz; up to 2 MiB flash/786 KiB SRAM | USB FS, CAN-FD, ADC/DAC/SAI; package varies | $12 | [S24](#s24) |
| 25 | STM32G474 **S** | M4F 170 MHz; 128–512 KiB flash, up to 128 KiB SRAM | 3 FDCAN, USB device, ADC/DAC-rich motor control | $8 | [S25](#s25) |
| 26 | STM32WB55 **S** | M4 64 + M0+ 32 MHz; up to 1 MiB flash/256 KiB SRAM | BLE + 802.15.4; USB FS device, no Wi-Fi/CAN | $10 | [S26](#s26) |
| 27 | STM32WL55 **S** | M4 + M0+, up to 48 MHz; 256 KiB flash/64 KiB SRAM | Integrated sub-GHz LoRa/FSK radio; 12-bit ADC/DAC | $12 | [S27](#s27) |
| 28 | nRF52832 **S** | M4F 64 MHz; 256/512 KiB flash, 32/64 KiB RAM | BLE/ANT/NFC; I²S, ADC; no Wi-Fi/USB/Ethernet | $6 | [S28](#s28) |
| 29 | nRF52840 **S** | M4F 64 MHz; 1 MiB flash/256 KiB RAM | BLE/Thread/Zigbee/802.15.4; USB device, I²S/ADC | $8 | [S29](#s29) |
| 30 | nRF5340 **S** | Dual M33 128/64 MHz; 1 MiB+256 KiB flash, 512+64 KiB RAM | BLE/Thread/Zigbee; USB device, I²S/PDM | $15 | [S30](#s30) |
| 31 | nRF9160 **SiP** | M33 64 MHz; 1 MiB flash/256 KiB RAM | LTE-M/NB-IoT + GNSS; cellular RF/antenna/SIM design | $25–30 | [S31](#s31) |
| 32 | LPC1768 **S** | Cortex-M3 100 MHz; 512 KiB flash/64 KiB SRAM | Ethernet MAC, USB FS OTG, 2 CAN, ADC/DAC/I²S | $8 | [S32](#s32) |
| 33 | LPC4088 **S** | Cortex-M4 120 MHz; 512 KiB flash/96 KiB SRAM | Ethernet MAC, USB FS OTG, 2 CAN, ADC/DAC/I²S | $12 | [S33](#s33) |
| 34 | i.MX RT1010 **S** | M7 500 MHz; 128 KiB RAM, external boot flash | USB OTG, I²S/SAI, ADC; no Ethernet/CAN assumption | $5 | [S34](#s34) |
| 35 | i.MX RT1060 **S/F** | M7 up to 600 MHz; 1 MiB RAM, external flash | Ethernet MAC, FlexCAN/CAN-FD variants, USB, SAI | $12 | [S35](#s35) |
| 36 | i.MX RT1062 **S** | M7 528 MHz rating; Teensy runs 600 MHz; 1 MiB RAM | External flash; Ethernet MAC, FlexCAN, USB, ADC | $15 | [S36](#s36) |
| 37 | i.MX RT1170 **S** | M7 up to 1 GHz + M4 400 MHz; 2 MiB RAM | Ethernet, 3 CAN-FD, USB HS OTG, ADC/DAC/SAI | $20–30 | [S37](#s37) |
| 38 | MCX N947 / FRDM-MCXN947 **S/B** | Dual M33 150 MHz; up to 2 MiB flash, RAM config varies | NPU/PowerQuad, Ethernet, 2 CAN-FD, USB HS; board adds PHY/transceiver | $15 | [S38](#s38) |
| 39 | KW41Z **S** | M0+ 48 MHz; up to 512 KiB flash/128 KiB SRAM | BLE4.2/802.15.4/FSK; 16-bit ADC/12-bit DAC | $10 | [S39](#s39) |
| 40 | ATmega328P **S** | 8-bit AVR, up to 20 MHz; 32 KiB flash/2 KiB SRAM | 10-bit ADC, PWM; no USB/wireless/CAN | $2 | [S40](#s40) |
| 41 | ATmega2560 **S** | 8-bit AVR 16 MHz; 256 KiB flash/8 KiB SRAM | 86 GPIO, 4 UART, ADC; no USB/Wi-Fi/Ethernet | $5 | [S41](#s41) |
| 42 | ATtiny85 **S** | 8-bit AVR up to 20 MHz; 8 KiB flash/512 B SRAM | 6 GPIO, ADC, PWM; no dedicated I²C/USB | $1 | [S42](#s42) |
| 43 | ATtiny1614/1616 **S/F** | 8-bit AVR 20 MHz; 16 KiB flash/2 KiB SRAM | 14/20-pin variants, ADC/DAC/timers vary | $1 | [S43](#s43) |
| 44 | SAMD21 **S/F** | M0+ 48 MHz; 32–256 KiB flash/4–32 KiB SRAM | USB host/device, I²S, 12-bit ADC/10-bit DAC | $4 | [S44](#s44) |
| 45 | SAMD51 **S/F** | M4F 120 MHz; up to 1 MiB flash/256 KiB SRAM | USB host/device, ADC/DAC, I²S; no Ethernet/CAN | $8 | [S45](#s45) |
| 46 | SAME54 **S** | M4F 120 MHz; 1 MiB flash/256 KiB SRAM | Ethernet MAC, 2 CAN-FD, USB FS, ADC/DAC/I²S | $12 | [S46](#s46) |
| 47 | SAME70/SAMV71 **F** | M7 300 MHz; up to 2 MiB flash/384 KiB SRAM | Ethernet (E/V71), 2 CAN-FD, USB HS, ADC/DAC/I²S | $15–20 | [S47](#s47) |
| 48 | PIC32MZ EF **S/F** | MIPS 200–252 MHz; up to 2 MiB flash/512 KiB RAM | Ethernet MAC, USB HS, 2 CAN2, 12-bit high-speed ADC | $12 | [S48](#s48) |
| 49 | PIC18 K42 **S/F** | 8-bit PIC18, up to 64 MHz; 32–128 KiB flash | ADC² 12-bit, 5-bit DAC on relevant part; USB/Ethernet not assumed | $2–5 | [S49](#s49) |
| 50 | AVR128DA/DB **S/F** | 8-bit AVR 24 MHz; 128 KiB flash/16 KiB SRAM | ADC 12-bit; DB adds 10-bit DAC; GPIO/package varies | $3 | [S50](#s50) |
| 51 | MSP430G2 / G2553 **S/F** | 16-bit MSP430 16 MHz; 16 KiB flash/512 B RAM | 10-bit ADC, timers; no USB/CAN/Wi-Fi | $1 | [S51](#s51) |
| 52 | MSP430FR family (FR5992 reference) **S/F** | 16-bit MSP430 16 MHz; cited FR5992 has 128 KiB FRAM/8 KiB SRAM (family varies) | 12-bit ADC, LEA on FR599x; no USB/Ethernet | $3 | [S52](#s52) |
| 53 | MSP432P4111 **S** | M4F 48 MHz; up to 2 MiB flash/256 KiB SRAM | ADC14; confirm exact USB and pinout; no radio | $6 | [S53](#s53) |
| 54 | MSPM0G3507 **S** | M0+ 80 MHz; 128 KiB flash/32 KiB RAM | CAN-FD, dual ADC, DAC, motor/math accelerator | $2 | [S54](#s54) |
| 55 | CC2652R **S** | M4F 48 MHz; 352 KiB flash/88 KiB RAM | 2.4 GHz BLE/Thread/Zigbee; ADC/I²S; no Wi-Fi | $8 | [S55](#s55) |
| 56 | CC1352R **S** | M4F 48 MHz; 352 KiB flash/88 KiB RAM | Sub-GHz + 2.4 GHz radio; ADC/I²S; no Wi-Fi | $10 | [S56](#s56) |
| 57 | CC3220S **S** | M4 80 MHz; 256 KiB RAM; external serial flash | Wi-Fi; add external flash/antenna; ADC/PWM | $12 | [S57](#s57) |
| 58 | TMS320F28379D **S** | 2× C28x 200 MHz + 2× CLA; 1 MiB flash/204 KiB RAM | Real-time control, 24 PWM, CAN2, USB, multi-channel ADC/DAC | $25 | [S58](#s58) |
| 59 | RP2040 **S** | Dual M0+ 133 MHz; 264 KiB SRAM, external QSPI flash | USB host/device; 4 ADC channels, 16 PWM, PIO | $1 | [S59](#s59) |
| 60 | RP2350 **S/F** | Dual M33 **or** Hazard3, 150 MHz; 520 KiB SRAM | RP2354 has 2 MiB stacked flash; 30/48 GPIO by package, USB host/device | $1.50 | [S60](#s60) |
| 61 | RA4M1 **S** | Cortex-M4 48 MHz; 256 KiB flash/32 KiB RAM | USB FS, CAN2, 14-bit ADC/12-bit DAC | $5 | [S61](#s61) |
| 62 | RA6M5 **S/F** | Cortex-M33 200 MHz; up to 2 MiB flash/~512 KiB SRAM | Ethernet MAC, up to 2 CAN-FD, USB, ADC/DAC | $12 | [S62](#s62) |
| 63 | RX65N **S/F** | RXv2 120 MHz; up to 2 MiB flash/640 KiB RAM | Ethernet MAC, USB FS OTG, 2 classical CAN, ADC/DAC | $15 | [S63](#s63) |
| 64 | PSoC 4 **F** | M0/M0+ 16–48 MHz; flash/SRAM vary widely | Programmable analog/digital; BLE/CAN/USB only on selected variants | $3 | [S64](#s64) |
| 65 | PSoC 5LP **F** | Cortex-M3 up to 80 MHz; up to 256 KiB flash/64 KiB SRAM | USB FS device, CAN2 on selected parts; configurable analog | $10 | [S65](#s65) |
| 66 | PSoC 6 **F** | Dual M4/M0+; up to 150/100 MHz | BLE/CAN-FD/USB/I²S/ADC/DAC vary by exact CY8C SKU | $12 | [S66](#s66) |
| 67 | CYW43439 **S (radio)** | No application CPU | Host-controlled Wi-Fi/Bluetooth radio; host bus, antenna and driver needed | $5 | [S67](#s67) |
| 68 | XMC4000 **F** | Cortex-M4, roughly 120–180 MHz by member | Ethernet/CAN/USB/ADC/PWM vary by exact XMC part | $8 | [S68](#s68) |
| 69 | BL602 **S** | RISC-V up to about 192 MHz; flash/package varies | Wi-Fi4/BLE; ADC/DAC; no Ethernet/CAN | $2 | [S69](#s69) |
| 70 | BL616/BL618 **S/F** | RISC-V up to 320 MHz; SRAM revision-dependent | Wi-Fi6/BLE/802.15.4; BL618 adds audio/EMAC features | $4 | [S70](#s70) |
| 71 | BL702 **S** | RISC-V up to 144 MHz; 132 KiB RAM/192 KiB ROM | BLE/802.15.4; USB FS device; no Wi-Fi | $3 | [S71](#s71) |
| 72 | CH32V003 **S** | RISC-V 48 MHz; 16 KiB flash/2 KiB SRAM | Tiny 10-bit ADC/OPA/PWM; no USB/CAN/wireless | $0.10 | [S72](#s72) |
| 73 | CH32V203 **S/F** | RISC-V up to 144 MHz; flash/RAM by suffix | USB FS host/device, classical CAN, ADC; no Ethernet | $0.50 | [S73](#s73) |
| 74 | CH32V307 **S** | RISC-V up to 144 MHz; 256 KiB flash/64 KiB SRAM common | USB HS, Gigabit MAC/10M PHY, CAN2, ADC/DAC/I²S | $2 | [S74](#s74) |
| 75 | CH552 **S** | Enhanced 8051 24 MHz; 16 KiB flash, ~1 KiB xRAM | USB FS, 8-bit ADC, PWM; package GPIO is multiplexed | $0.30 | [S75](#s75) |
| 76 | GD32VF103 **S/F** | RISC-V 108 MHz; 16–128 KiB flash/16–32 KiB SRAM | USB FS, up to 2 CAN2, ADC/DAC/I²S; no Ethernet | $2 | [S76](#s76) |
| 77 | GD32F303 **S/F** | Cortex-M4F 120 MHz; large family range, exact SKU matters | USB FS, classical CAN; ADC/DAC/I²S; no Ethernet on F303 entry | $3 | [S77](#s77) |
| 78 | GD32E230 **S/F** | Cortex-M23 72 MHz; up to 64 KiB flash/8 KiB SRAM | ADC/comparator/timers; no Wi-Fi/Ethernet/CAN | $1 | [S78](#s78) |
| 79 | Teensy 4.0 **B** | Board with i.MX RT1062, M7 600 MHz; 1 MiB RAM | 1,984 KiB QSPI flash, USB host/device, 3 CAN buses (one FD); Ethernet MAC signals are not exposed; no radio | $24 | [S79](#s79) |
| 80 | Teensy 4.1 **B** | Board with i.MX RT1062, M7 600 MHz; 1 MiB RAM | 7,936 KiB QSPI flash, microSD, USB host/device, 3 CAN buses (one FD); standard board includes Ethernet PHY, MagJack kit sold separately | $32 | [S80](#s80) |
| 81 | STC8 **F** | 1T 8051; speed/memory vary by model | ADC/PWM/USB vary; not a single peripheral set | $0.30 | [S81](#s81) |
| 82 | Nuvoton M480 **F** | Cortex-M4F 192 MHz; up to 2.5 MiB flash/160 KiB RAM | Selected M487 adds EMAC/HS USB/ADC/DAC/I²S/CAN2 | $5 | [S82](#s82) |
| 83 | Holtek HT32F72388 **S** | Cortex-M0+ 72 MHz; 512 KiB flash/80 KiB SRAM | USB FS device, 2 CAN2, ADC/DAC/I²S | $2 | [S83](#s83) |
| 84 | Artery AT32F403A **S/F** | Cortex-M4F 240 MHz; 256 KiB–1 MiB flash, SRAM banks by SKU | USB FS device, 2 CAN2, ADC/DAC/I²S; no Ethernet claim | $2 | [S84](#s84) |
| 85 | HPM6750 **S** | Dual RISC-V up to 816 MHz; 2 MiB SRAM, external flash | 2 Gigabit MAC, 4 CAN-FD, 2 HS USB, high-speed ADC; no radio | $15 | [S85](#s85) |

## Hardware that may need to be added

| Silicon feature | Usually required outside the chip | Check before calling it “included” |
|---|---|---|
| Ethernet MAC / EMAC | MII/RMII PHY, reference clock, magnetics, RJ45/connector, power and layout | Some dev boards/modules populate the PHY; many MCUs expose only MAC pins. A board's RJ45 is not a PHY inside the MCU. |
| Classical CAN or CAN-FD controller | CAN/CAN-FD transceiver, termination, protection and connector | CAN-FD requires a CAN-FD-capable controller **and** transceiver; a CAN2 controller is not FD. |
| USB host | VBUS 5-V supply and current-limited switch, overcurrent sensing, connector and host software | A USB device port, USB-UART bridge, or USB-C connector alone does not provide host capability. Confirm PHY/speed and host/device role. |
| USB HS | HS controller plus the PHY/interface required by that exact part (integrated or external ULPI) | Some “HS” MCUs require an external ULPI PHY; others integrate it. Check the exact datasheet, not the family marketing page. |
| Wi-Fi/BLE/sub-GHz radio | RF matching/layout, antenna, certification, protocol stack and sometimes host processor | A radio module can include antenna/matching; a bare radio IC/SoC usually does not include the antenna or regulatory approvals. |
| Cellular | SIM/eSIM, carrier subscription, antennas, regional band support, certification and power design | nRF9160 is a SiP with a modem; its development kit's nRF52840 is a separate board-controller MCU. |
| External boot flash / SDRAM / PSRAM | Flash/RAM, power sequencing, routing and boot straps | RT1010/1060/1062/1170 and RP2040/RP2350 need external boot flash unless a specific SiP/board supplies it. |
| Accurate analog measurement/output | External reference, signal conditioning, anti-alias filter, buffer/amplifier or external ADC/DAC as required | On-chip ADC bit count is not equivalent to accuracy, ENOB, bandwidth, input range or noise performance. PWM is not a true DAC. |
| Audio | Codec/ADC/DAC, mic/line interface, amplifier, clocking and passives | I²S only transports digital audio. Some boards supply codecs; the MCU silicon may not. |
| AI camera/audio | Sensor, memory bandwidth, codec/ISP path, model conversion and runtime | TOPS and CNN RAM claims need a supported model/operator, quantization and benchmark condition. A Coral USB accelerator still needs a host. |

## Sources

The sources below are manufacturer datasheets/product pages or first-party project documentation where available. Some Bouffalo, K210, STC and third-party board materials are mirrored; where a vendor's exact English document URL was not available, the mirror is identified by the link. Family sources prove only what the family datasheet says, not that every suffix includes every peripheral.

- <a id="s01"></a>**S01 · K230:** [Kendryte K230 product brief](https://www.kendryte.com/k230/en/v2.0/K230_brief_datasheet.html) · [K230 full datasheet](https://www.kendryte.com/k230/en/main/00_hardware/K230_datasheet.html).
- <a id="s02"></a>**S02 · K210:** [Kendryte K210 datasheet repository](https://github.com/kendryte/kendryte-doc-datasheet/blob/master/en/002.md).
- <a id="s03"></a>**S03 · MAX78000:** [Analog Devices product page and datasheet](https://www.analog.com/en/products/max78000.html) · [datasheet PDF](https://www.analog.com/media/en/technical-documentation/data-sheets/max78000.pdf).
- <a id="s04"></a>**S04 · MAX78002:** [Analog Devices product page and datasheet](https://www.analog.com/en/products/max78002.html) · [datasheet PDF](https://www.analog.com/media/en/technical-documentation/data-sheets/max78002.pdf).
- <a id="s05"></a>**S05 · BL808:** [BL808 datasheet PDF mirror](https://files.pine64.org/doc/datasheet/ox64/BL808_DS_en_1.1(open).pdf) · [BL808 reference manual](https://files.pine64.org/doc/datasheet/ox64/BL808_RM_en_1.0(open).pdf).
- <a id="s06"></a>**S06 · RTL8735B / AMB82 Mini:** [Realtek/Ameba RTL8735B product page](https://aiot.realmcu.com/en/product/rtl8735b.html) · [AmebaPro2/module documentation](https://www.amebaiot.com/en/amebapro2/).
- <a id="s07"></a>**S07 · Coral USB Accelerator:** [Coral USB Accelerator datasheet](https://gweb-coral-full.uc.r.appspot.com/docs/accelerator/datasheet/) · [Coral accelerator overview](https://www.coral.ai/products/accelerator).
- <a id="s08"></a>**S08 · ESP32:** [Espressif ESP32 datasheet](https://documentation.espressif.com/esp32_datasheet_en.pdf).
- <a id="s09"></a>**S09 · ESP32-S2:** [Espressif ESP32-S2 datasheet](https://documentation.espressif.com/esp32-s2_datasheet_en.pdf).
- <a id="s10"></a>**S10 · ESP32-S3:** [Espressif ESP32-S3 datasheet](https://documentation.espressif.com/esp32-s3_datasheet_en.pdf) · [ESP32-S3 hardware guidelines](https://documentation.espressif.com/projects/esp-hardware-design-guidelines/en/latest/esp32s3/esp-hardware-design-guidelines-en-master-esp32s3.pdf).
- <a id="s11"></a>**S11 · ESP32-C3:** [Espressif ESP32-C3 datasheet](https://documentation.espressif.com/esp32-c3_datasheet_en.pdf).
- <a id="s12"></a>**S12 · ESP32-C6:** [Espressif ESP32-C6 datasheet](https://documentation.espressif.com/esp32-c6_datasheet_en.pdf).
- <a id="s13"></a>**S13 · ESP32-H2:** [Espressif ESP32-H2 datasheet](https://documentation.espressif.com/esp32-h2_datasheet_en.pdf).
- <a id="s14"></a>**S14 · ESP32-P4:** [Espressif ESP32-P4 datasheet](https://documentation.espressif.com/esp32-p4-chip-revision-v1.3_datasheet_en.pdf) · [ESP32-P4 board guide](https://documentation.espressif.com/esp-dev-kits/en/latest/esp32p4/esp32-p4x-c5-function-ev-board/user_guide.html).
- <a id="s15"></a>**S15 · STM32F103:** [ST STM32F103C8 datasheet](https://www.st.com/resource/en/datasheet/stm32f103c8.pdf).
- <a id="s16"></a>**S16 · STM32F401/F411:** [ST STM32F401RE datasheet](https://www.st.com/resource/en/datasheet/stm32f401re.pdf) · [STM32F401CC datasheet](https://www.st.com/resource/en/datasheet/stm32f401cc.pdf).
- <a id="s17"></a>**S17 · STM32F407:** [ST STM32F407 product page](https://www.st.com/en/microcontrollers-microprocessors/stm32f407vg.html).
- <a id="s18"></a>**S18 · STM32F429:** [ST STM32F429ZI datasheet](https://www.st.com/resource/en/datasheet/stm32f429zi.pdf).
- <a id="s19"></a>**S19 · STM32F446:** [ST STM32F446 datasheet](https://www.st.com/resource/en/datasheet/stm32f446mc.pdf).
- <a id="s20"></a>**S20 · STM32F767:** [ST STM32F767VG datasheet](https://www.st.com/resource/en/datasheet/stm32f767vg.pdf).
- <a id="s21"></a>**S21 · STM32H743/H750:** [H743 datasheet](https://www.st.com/resource/en/datasheet/stm32h743vi.pdf) · [H750 datasheet](https://www.st.com/resource/en/datasheet/stm32h750ib.pdf).
- <a id="s22"></a>**S22 · STM32H747:** [ST STM32H747 datasheet](https://www.st.com/resource/en/datasheet/stm32h747ag.pdf).
- <a id="s23"></a>**S23 · STM32L476:** [ST STM32L476RG datasheet](https://www.st.com/resource/en/datasheet/stm32l476rg.pdf).
- <a id="s24"></a>**S24 · STM32U575/U585:** [ST STM32U575 datasheet](https://www.st.com/resource/en/datasheet/stm32u575ag.pdf).
- <a id="s25"></a>**S25 · STM32G474:** [ST STM32G474 product page](https://www.st.com/en/microcontrollers-microprocessors/stm32g474re.html).
- <a id="s26"></a>**S26 · STM32WB55:** [ST STM32WB55CC datasheet](https://www.st.com/resource/en/datasheet/stm32wb55cc.pdf).
- <a id="s27"></a>**S27 · STM32WL55:** [ST STM32WL55CC datasheet](https://www.st.com/resource/en/datasheet/stm32wl55cc.pdf).
- <a id="s28"></a>**S28 · nRF52832:** [Nordic product page](https://www.nordicsemi.com/Products/nRF52832).
- <a id="s29"></a>**S29 · nRF52840:** [Nordic product page](https://www.nordicsemi.com/Products/nRF52840).
- <a id="s30"></a>**S30 · nRF5340:** [Nordic product page](https://www.nordicsemi.com/Products/nRF5340).
- <a id="s31"></a>**S31 · nRF9160:** [Nordic nRF9160 SiP page](https://www.nordicsemi.com/Products/nRF9160) · [nRF9160 DK](https://www.nordicsemi.com/Products/Development-hardware/nrf9160-dk).
- <a id="s32"></a>**S32 · LPC1768:** [NXP LPC1768 product page](https://www.nxp.com/products/LPC1768FBD100).
- <a id="s33"></a>**S33 · LPC4088:** [NXP LPC4088 product page](https://www.nxp.com/products/LPC4088FBD208).
- <a id="s34"></a>**S34 · i.MX RT1010:** [NXP RT1010 datasheet](https://www.nxp.com/docs/en/data-sheet/IMXRT1010CEC.pdf).
- <a id="s35"></a>**S35 · i.MX RT1060:** [NXP RT1060 datasheet](https://www.nxp.com/docs/en/data-sheet/IMXRT1060XCEC.pdf).
- <a id="s36"></a>**S36 · i.MX RT1062:** [NXP RT1060/1062 family datasheet](https://www.nxp.com/docs/en/data-sheet/IMXRT1060XCEC.pdf).
- <a id="s37"></a>**S37 · i.MX RT1170:** [NXP RT1170 datasheet](https://www.nxp.com/docs/en/data-sheet/IMXRT1170IEC.pdf).
- <a id="s38"></a>**S38 · MCXN947:** [NXP MCXN947/MCXN family datasheet and FRDM board](https://www.nxp.com/design/design-center/development-boards-and-designs/FRDM-MCXN947).
- <a id="s39"></a>**S39 · KW41Z:** [NXP KW41Z datasheet](https://www.nxp.com/docs/en/data-sheet/MKW41Z512.pdf).
- <a id="s40"></a>**S40 · ATmega328P:** [Microchip ATmega328P datasheet](https://ww1.microchip.com/downloads/en/DeviceDoc/Atmel-7810-Automotive-Microcontrollers-ATmega328P_Datasheet.pdf).
- <a id="s41"></a>**S41 · ATmega2560:** [Microchip ATmega2560 family datasheet](https://ww1.microchip.com/downloads/aemDocuments/documents/OTH/ProductDocuments/DataSheets/ATmega640-1280-1281-2560-2561-Datasheet-DS40002211A.pdf).
- <a id="s42"></a>**S42 · ATtiny85:** [Microchip ATtiny25/45/85 datasheet](https://ww1.microchip.com/downloads/en/DeviceDoc/Atmel-7598_Automotive-Microcontrollers-ATtiny25-45-85_Datasheet.pdf).
- <a id="s43"></a>**S43 · ATtiny1614/1616:** [Microchip ATtiny1614/1616/1617 datasheet](https://ww1.microchip.com/downloads/en/DeviceDoc/ATtiny3216_ATtiny1616-data-sheet-40001997.pdf).
- <a id="s44"></a>**S44 · SAMD21:** [Microchip SAM D21 datasheet](https://ww1.microchip.com/downloads/en/DeviceDoc/SAM-D21DA1-Family-Data-Sheet-DS40001882G.pdf).
- <a id="s45"></a>**S45 · SAMD51:** [Microchip SAM D5x/E5x family datasheet](http://ww1.microchip.com/downloads/en/DeviceDoc/SAM_D5xE5x_Family_Data_Sheet_DS60001507F.pdf).
- <a id="s46"></a>**S46 · SAME54:** [Microchip SAME54 product page](https://www.microchip.com/en-us/product/atsame54p20a) · [family datasheet](http://ww1.microchip.com/downloads/en/DeviceDoc/SAM_D5xE5x_Family_Data_Sheet_DS60001507F.pdf).
- <a id="s47"></a>**S47 · SAME70/SAMV71:** [Microchip SAM E70/S70/V70/V71 family datasheet](https://ww1.microchip.com/downloads/en/DeviceDoc/SAM-E70-S70-V70-V71-Family-Data-Sheet-DS60001527F.pdf).
- <a id="s48"></a>**S48 · PIC32MZ EF:** [Microchip PIC32MZ EF datasheet](https://ww1.microchip.com/downloads/en/DeviceDoc/PIC32MZ-Embedded-Connectivity-with-Floating-Point-Unit-Family-Data-Sheet-DS60001320H.pdf).
- <a id="s49"></a>**S49 · PIC18 K42:** [Microchip PIC18 K42 datasheet](https://ww1.microchip.com/downloads/en/DeviceDoc/PIC18(L)F26-27-45-46-47-55-56-57K42-Data-Sheet-40001919G.pdf).
- <a id="s50"></a>**S50 · AVR128DA/DB:** [Microchip AVR128DB datasheet](https://ww1.microchip.com/downloads/aemDocuments/documents/MCU08/ProductDocuments/DataSheets/AVR128DB28-32-48-64-DataSheet-DS40002247.pdf).
- <a id="s51"></a>**S51 · MSP430G2553:** [TI MSP430G2553 product page/datasheet](https://www.ti.com/product/MSP430G2553).
- <a id="s52"></a>**S52 · MSP430FR5992:** [TI MSP430FR5992 product page/datasheet](https://www.ti.com/product/MSP430FR5992).
- <a id="s53"></a>**S53 · MSP432P4111:** [TI MSP432P4111 product page](https://www.ti.com/product/MSP432P4111).
- <a id="s54"></a>**S54 · MSPM0G3507:** [TI MSPM0G3507 product page/datasheet](https://www.ti.com/product/MSPM0G3507).
- <a id="s55"></a>**S55 · CC2652R:** [TI CC2652R product page/datasheet](https://www.ti.com/product/CC2652R).
- <a id="s56"></a>**S56 · CC1352R:** [TI CC1352R product page/datasheet](https://www.ti.com/product/CC1352R).
- <a id="s57"></a>**S57 · CC3220S:** [TI CC3220S product page/datasheet](https://www.ti.com/product/CC3220S).
- <a id="s58"></a>**S58 · TMS320F28379D:** [TI TMS320F28379D product page/datasheet](https://www.ti.com/product/TMS320F28379D).
- <a id="s59"></a>**S59 · RP2040:** [Raspberry Pi RP2040 datasheet](https://datasheets.raspberrypi.com/rp2040/rp2040-datasheet.pdf).
- <a id="s60"></a>**S60 · RP2350:** [Raspberry Pi RP2350 datasheet](https://datasheets.raspberrypi.com/rp2350/rp2350-datasheet.pdf).
- <a id="s61"></a>**S61 · RA4M1:** [Renesas RA4M1 product page/datasheet](https://www.renesas.com/en/products/ra4m1).
- <a id="s62"></a>**S62 · RA6M5:** [Renesas RA6M5 group datasheet](https://www.renesas.com/en/document/dst/ra6m5-group-datasheet).
- <a id="s63"></a>**S63 · RX65N:** [Renesas RX65N product page](https://www.renesas.com/en/products/rx65n).
- <a id="s64"></a>**S64 · PSoC 4:** [Infineon PSoC 4 feature comparison / application note](https://documentation.infineon.com/psoc4000t/docs/xim1745489334160).
- <a id="s65"></a>**S65 · PSoC 5LP:** [Infineon CY8C58LP family datasheet](https://www.infineon.com/dgdl/Infineon-PSoC_5LP_CY8C58LP_Family_Datasheet_Programmable_System-on-Chip_(PSoC_)-DataSheet-v15_00-EN.pdf?fileId=8ac78c8c7d0d8da4017d0ec547013ab9).
- <a id="s66"></a>**S66 · PSoC 6:** [Infineon PSoC 6 overview](https://documentation.infineon.com/psoc6/docs/rkg1651145413836) · [CY8C62x5 datasheet](https://www.infineon.com/assets/row/public/documents/30/49/infineon-psoc-6-mcu-cy8c62x5-datasheet-datasheet-en.pdf).
- <a id="s67"></a>**S67 · CYW43439:** [Infineon CYW43439 product page](https://www.infineon.com/part/CYW43439).
- <a id="s68"></a>**S68 · XMC4000:** [Infineon XMC4500 product page](https://www.infineon.com/cms/en/product/microcontroller/32-bit-industrial-microcontroller-based-on-arm-cortex-m/32-bit-xmc4000-industrial-microcontroller-arm-cortex-m4/xmc4500/).
- <a id="s69"></a>**S69 · BL602:** [BL602/604 datasheet mirror](http://download.bl602.fun/BL602_%E5%AE%98%E6%96%B9%E8%8A%AF%E7%89%87%E8%B5%84%E6%96%99.pdf).
- <a id="s70"></a>**S70 · BL616/BL618:** [BL616/618 datasheet mirror](https://aithinker-static.oss-cn-shenzhen.aliyuncs.com/docs/Public%20Document%20Center/WiFi/ai_m62/ChipManual/bl616_bl618_ds_zh_cn_2.5_open_.pdf).
- <a id="s71"></a>**S71 · BL702:** [BL702/704/706 datasheet mirror](http://download.bl602.fun/BL702_%E5%AE%98%E6%96%B9%E8%8A%AF%E7%89%87%E6%89%8B%E5%86%8C.pdf).
- <a id="s72"></a>**S72 · CH32V003:** [WCH CH32V003 product page/datasheet](https://www.wch-ic.com/products/CH32V003.html).
- <a id="s73"></a>**S73 · CH32V203:** [WCH CH32V203 product page/datasheet](https://www.wch-ic.com/products/CH32V203.html).
- <a id="s74"></a>**S74 · CH32V307:** [WCH CH32V307 product page/datasheet](https://www.wch-ic.com/products/CH32V307.html).
- <a id="s75"></a>**S75 · CH552:** [WCH CH552 datasheet page](https://www.wch-ic.com/downloads/CH552DS1_PDF.html).
- <a id="s76"></a>**S76 · GD32VF103:** [GigaDevice GD32VF103 datasheet](https://www.gd32mcu.com/data/documents/datasheet/GD32VF103_Datasheet_Rev1.7.pdf).
- <a id="s77"></a>**S77 · GD32F303:** [GigaDevice GD32F303 datasheet](https://www.gd32mcu.com/data/documents/datasheet/GD32F303xx_Datasheet_Rev1.9.pdf).
- <a id="s78"></a>**S78 · GD32E230:** [GigaDevice GD32E230xx datasheet, Rev. 2.9](https://www.gd32mcu.com/data/documents/datasheet/GD32E230xx%20Datasheet_Rev2.9.pdf).
- <a id="s79"></a>**S79 · Teensy 4.0:** [PJRC Teensy 4.0 board page](https://www.pjrc.com/store/teensy40.html) · [PJRC forum explanation of the intentionally unexposed native Ethernet pins](https://forum.pjrc.com/index.php?threads/teensy-4-0-ethernet-im-guessing-its-not-avaliable.57126/).
- <a id="s80"></a>**S80 · Teensy 4.1:** [PJRC Teensy 4.1 board page](https://www.pjrc.com/store/teensy41.html).
- <a id="s81"></a>**S81 · STC8:** [STC STC8H8K64U product page](https://stcmicro.com/stc/stc8h8k64u.html).
- <a id="s82"></a>**S82 · Nuvoton M480:** [Nuvoton M480 family datasheet](https://www.nuvoton.com/export/resource-files/en-us--DS_M480_Series_EN_Rev3.09.pdf).
- <a id="s83"></a>**S83 · HT32F72388:** [Holtek HT32F72388 datasheet](https://www.holtek.com/webapi/116711/HT32F72388_Datasheet_v100.pdf).
- <a id="s84"></a>**S84 · AT32F403A:** [Artery AT32F403A datasheet](https://www.arterytek.com/download/DS/DS_AT32F403A_V2.04_CH.pdf).
- <a id="s85"></a>**S85 · HPM6750:** [HPMicro HPM6700/6400 documentation](https://www.hpmicro.com/Public/Uploads/uploadfile/files/20240822/HPM67006400FSV20.pdf).
