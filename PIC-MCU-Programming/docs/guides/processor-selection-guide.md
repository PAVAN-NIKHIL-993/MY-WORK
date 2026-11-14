# Processor selection guide: choosing among entries 1–85

This guide turns the [processor comparison](../processor-comparison.md) into practical shortlists. It covers every numbered entry, but it cannot choose an exact order code without a workload, board/package, operating-temperature, lifecycle, toolchain, and production-volume target. Use it to shortlist; then validate the chosen suffix against its datasheet and the comparison's package/peripheral notes.

**Price caveat:** all price figures in the comparison are the rough estimates supplied with the request. They are not independently verified, may refer to different product layers (bare chip, module, or development board), and should not be used as current quotes or total-system costs. Entry **28** arrived with its use-case text truncated after “BLE w”; its recommendation here is based on nRF52832 capability, not an assumption about the missing words.

## Quick shortlist by job

| If the main job is… | Start here | Why / the main caveat |
|---|---|---|
| Tiny, inexpensive control with no radio | **72 CH32V003**, **43 ATtiny1616**, **78 GD32E230**, or **54 MSPM0G3507** | Pick by required analog/PWM/peripheral and toolchain. CH32V003 is extremely small and inexpensive but has no USB and very little memory. MSPM0G3507 costs more than the tiniest parts but brings a much richer 32-bit peripheral set, including CAN-FD. |
| A first microcontroller or classroom board | **59 RP2040/Pico**, **60 RP2350/Pico 2**, **40 ATmega328P/Uno-class board**, or **79/80 Teensy** | Choose a documented board, not just silicon, if you want USB, debugger, regulator, headers, and support in one package. RP2040 and RP2350 chips need boot flash; Pico boards supply it. |
| Wi-Fi plus a general-purpose MCU | **11 ESP32-C3** for value; **10 ESP32-S3** for more CPU/USB; **12 ESP32-C6** for Wi-Fi 6 plus 802.15.4 | None is a substitute for checking module antenna, certifications, flash, power and GPIO. C3/C6 USB is not a general-purpose USB host. |
| Wi-Fi plus Bluetooth Classic or a built-in voltage DAC | **8 ESP32** | A useful legacy/low-cost fit. Prefer a newer family member if USB, Wi-Fi 6, or a longer product-life/feature roadmap matters. |
| Wi-Fi, USB OTG, and a voltage DAC, but no BLE requirement | **9 ESP32-S2** | Native FS USB host/device and DAC are useful; it has no Bluetooth radio. Host still requires VBUS power circuitry. |
| BLE-only low-power sensor or beacon | **28 nRF52832**, **26 STM32WB55**, **55 CC2652R**, or **29 nRF52840** | Choose by memory, protocol stack and ecosystem. The nRF52832 is BLE-focused; WB55/CC2652R/nRF52840 add 802.15.4 capabilities in their supported stacks. None has Wi-Fi. |
| Thread/Zigbee or Matter-over-Thread | **13 ESP32-H2**, **12 ESP32-C6**, **29 nRF52840**, **30 nRF5340**, **26 STM32WB55**, or **55 CC2652R** | H2 has no Wi-Fi; C6 combines Wi-Fi 6 with 802.15.4; verify the exact protocol stack, certification and concurrent-radio behavior. |
| Sub-GHz links / LoRa | **27 STM32WL55** for integrated LoRa-capable sub-GHz radio; **56 CC1352R** for sub-GHz plus 2.4 GHz protocols | CC1352R's sub-GHz radio is not itself LoRa. Verify regional frequency, antenna and protocol stack; radio frequency coverage is not interchangeable. |
| Cellular IoT | **31 nRF9160 SiP** | Cellular and GNSS are in the SiP, but the application still needs a SIM/eSIM plan, band-compatible antennas, certification and a power design. |
| Camera, image processing, or embedded vision | **6 RTL8735B/AMB82 Mini**, **1 K230**, or **5 BL808**; **2 K210** for a constrained/educational low-cost path | The AMB82 is a module/board product, K230/BL808 need carefully designed memory/boot hardware, and K210's KPU/toolchain is constrained. Camera, RAM, codec and display features are variant/board-specific. |
| Small, low-power quantized CNN inference | **4 MAX78002** for more model storage; **3 MAX78000** for a smaller design | These are MCUs with dedicated CNN accelerators, not general-purpose GPU/CPU replacements. Check supported operator, quantization, model conversion and CNN memory. |
| Add inference to an existing Linux host | **7 Coral USB Accelerator** | It is an accelerator peripheral, not a standalone MCU. Budget for a USB 3 host, runtime/driver, compatible quantized model and host-side power. |
| Classical CAN | **15 STM32F103**, **17–20 STM32 F4**, **32/33 LPC**, **54 MSPM0G3507**, or **76 GD32VF103** | Many listed chips support Classical CAN only. Add a matching transceiver; do not infer CAN-FD from “CAN” or from a board connector. |
| CAN-FD / motor-control networking | **25 STM32G474**, **21/22 STM32H7**, **24 STM32U575**, **38 MCXN947**, **46/47 Microchip SAME54/SAMV71**, **62 RA6M5**, **37 RT1170**, or **85 HPM6750** | Confirm the exact silicon has FDCAN/FlexCAN CAN-FD and budget an FD-capable transceiver per bus. MCXN947's FRDM board adds physical-layer hardware that the bare chip does not. |
| Wired Ethernet | **38 MCXN947** for a development-board start; **17 F407**, **21 H743**, **46 SAME54**, **48 PIC32MZ EF**, **62 RA6M5**, or **85 HPM6750** | An Ethernet MAC is not an RJ45 port. Bare-silicon designs normally need a PHY, clocking, magnetics, connector and layout; the board may add them. |
| Precision motor / power conversion control | **58 TMS320F28379D** for dedicated real-time control; **25 STM32G474** for a strong integrated MCU/analog option; **54 MSPM0G3507** for a lower-cost CAN-FD/analog design | Compare ADC timing, PWM synchronization, comparator trips, isolation, safety requirements and control libraries—not just CPU MHz. Add gate drivers, current sensing, protection and isolated interfaces as needed. |
| Fast bare-metal compute without Linux | **37 i.MX RT1170**, **21 STM32H743**, **22 STM32H747**, **36 i.MX RT1062**, or **85 HPM6750** | External boot flash/RAM, PCB routing, startup/boot and software complexity grow with performance. HPM6750 is the unusual dual-core, high-speed-I/O option; it is not an automatic choice for a simple MCU project. |
| Low-power mixed-signal / event logging | **52 MSP430FR5992**, **23 STM32L476**, **24 STM32U575**, **28 nRF52832**, or **27 STM32WL55** | Compare measured sleep/wake/application energy and radio duty cycle for the actual workload. “Low power” is not a reliable family-wide ranking without firmware and board measurements. |
| A low-cost 8-bit design with a modern analog/peripheral set | **50 AVR128DB**, **43 ATtiny1614/1616**, or **49 PIC18 K42** | Good where the workload fits 8-bit performance and memory. Exact suffix/package determines DAC, ADC, pin count, USB and programming interface. |
| Existing board/software investment | Keep the same MCU/board family unless the requirements force a change | Reusing libraries, fixtures, bootloaders, layouts and qualified supply can outweigh a newer core or a lower estimated chip price. |

## Recommendations by workload

### 1. Decide what is a processor and what is an add-on

Start with the product layer. Entries **7** and **67** are host-controlled accelerators/radios, not general-purpose MCUs. Entries **6**, **31**, **79**, and **80** explicitly mix silicon with a module, SiP or development board. Several other entries are broad families. Choose the physical product you will actually buy and put on the PCB, not just a family name.

For a bare-chip design, add all required external items to the schematic and cost: boot flash/RAM, RF parts/antenna, Ethernet PHY/magnetics, CAN transceiver, USB host VBUS supply, audio codec, analog front end, debugger and connector. A development board may supply some of these, but board-supplied hardware is not a silicon capability.

### 2. Use protocol requirements to narrow radio MCUs

- **Wi-Fi is mandatory:** start with ESP32-C3/S3/C6, original ESP32, ESP32-S2, ESP32-P4 plus a companion radio, CC3220S, BL602/BL616, BL808, RTL8735B, or a board/module using one of them. Then choose based on Wi-Fi generation, CPU, USB role, Bluetooth need, memory and support. **P4 has no integrated Wi-Fi or Bluetooth**, and **H2 has no Wi-Fi**. CYW43439 is a host radio; it needs a separate host processor.
- **BLE is mandatory but Wi-Fi is not:** compare nRF52832/nRF52840/nRF5340, STM32WB55, CC2652R, CC1352R, KW41Z, ESP32-C3/S3/C6/H2, BL602/BL616 and BL702 by required protocol, RAM, power, certification and SDK. BLE support alone does not establish a Thread/Zigbee stack or a low-power application result.
- **Thread/Zigbee/802.15.4 is required:** favor parts with a documented 802.15.4 radio and a supported stack: ESP32-C6/H2, nRF52840/5340, STM32WB55, CC2652R and applicable BL616 configurations. Verify that the precise part, SDK release and radio concurrency support your network. C6 additionally has Wi-Fi; H2 does not.
- **Sub-GHz or cellular is required:** STM32WL55 and CC1352R are different radio choices; the first has integrated sub-GHz LoRa-capable radio, while CC1352R offers sub-GHz and 2.4 GHz radio protocols. nRF9160 is cellular LTE-M/NB-IoT with GNSS; it is not a substitute for a local LoRa or BLE mesh.

### 3. Treat USB, Ethernet and CAN as whole interfaces

- If you need to plug a USB device into your product, select a **host-capable** controller and budget VBUS, power switching, overcurrent handling, connector, role-selection and software. A USB device controller/debug connector is not enough. RP2040/RP2350, some STM32/NXP parts and USB OTG MCUs are useful candidates; inspect whether high-speed operation requires an external PHY.
- For Ethernet, check for an **MAC**, then select the matching external PHY (MII/RMII/other interface), clock, magnetics and connector. If the board already has a PHY, note its speed and whether the signals are routed/exposed. A MAC-only design does not provide a cable-ready network port.
- For CAN, count each controller and each physical bus separately. Add a transceiver, termination, isolation/protection where needed, and the connector. CAN-FD requires both a CAN-FD-capable controller and an FD-capable transceiver. F103/F4, LPC, GD32VF103 and many small MCUs are useful for **Classical CAN**, not interchangeable FD picks.

### 4. Match compute and AI to the actual workload

For application control, a Cortex-M7/RISC-V clock or TOPS figure is not enough. Measure worst-case latency, memory and bandwidth with the actual compiler, interrupt load, peripherals, model and power constraints. Choose K230/RTL8735B/BL808 for vision/multimedia only after checking the module, boot memory, camera interface and supported model path. Choose MAX78000/MAX78002 for low-power quantized CNN use cases their accelerators support. Coral USB requires a host OS and Edge-TPU-compatible model. Do not compare its 4 TOPS directly with another chip's marketing TOPS number.

### 5. Choose the analog/control path

If analog accuracy matters, read the ADC/DAC electrical specifications: effective resolution, noise, reference, input range, channel settling, sample rate, calibration, temperature drift and analog pin constraints. A “12-bit ADC” is not automatically 12-bit accurate. For precision, isolation, high bandwidth, high input voltage or repeatable measurements, an external ADC/reference/amplifier may be the better architecture. PWM is a switching output, not a precision DAC.

For control loops and motor drives, evaluate synchronized ADC triggering, PWM dead time, comparator fault response, encoder capture, DMA and control-toolchain support. TMS320F28379D and STM32G474 target this class particularly well; HPM6750/H7/MCXN947 can be appropriate for larger real-time systems. A high-speed core alone does not supply gate drivers, isolation, current sensors or a safety case.

## Where each numbered entry fits

These are first-pass fit recommendations, not rankings. Each citation links to the corresponding source entry in the [comparison's manufacturer-source list](../processor-comparison.md#sources). Read the matrix row before choosing an exact package or board.

### Entries 1–14 · Vision and wireless SoCs

1. **K230** — choose for a capable vision/multimedia SoC when you can design the external memory, boot and board support. Benchmark the model on the exact KPU toolchain; throughput claims conflict. [Source](../processor-comparison.md#s01)
2. **K210** — a low-cost learning or constrained vision-inference option with a distinctive KPU. It is less attractive when you need modern radio, large general-purpose RAM, easy model porting or a simple bare-MCU design. [Source](../processor-comparison.md#s02)
3. **MAX78000** — shortlist for very low-energy, quantized CNN inference with a modest model, paired with a conventional M4 control application. Check accelerator memory/operator constraints before coding the model. [Source](../processor-comparison.md#s03)
4. **MAX78002** — consider when the MAX78000 accelerator approach fits but the model needs more weight/data storage. It is still a specialized quantized-CNN MCU, not a general-purpose AI processor. [Source](../processor-comparison.md#s04)
5. **BL808** — consider for heterogeneous RISC-V, wireless and multimedia workloads where a capable module/board and software stack are available. Confirm the selected BL808 product actually supplies the external memory and accelerator resources you need. [Source](../processor-comparison.md#s05)
6. **RTL8735B / AMB82 Mini** — choose the AMB82 product when a smart-camera module/board is more useful than bare-chip integration. Treat its antenna, memory and routed peripherals as module/board facts, not universal RTL8735B pinout. [Source](../processor-comparison.md#s06)
7. **Coral USB Accelerator** — use to speed supported inference on an existing USB 3 host. Do not select it as the only processor: it has no host CPU, application storage or MCU GPIO/peripherals. [Source](../processor-comparison.md#s07)
8. **ESP32** — a practical low-cost Wi-Fi plus Bluetooth Classic/BLE MCU, especially where its DAC or established ecosystem is useful. It is a weaker default for new designs needing native USB or newer radio features. [Source](../processor-comparison.md#s08)
9. **ESP32-S2** — choose when 2.4-GHz Wi-Fi, native USB OTG and the two DAC channels matter more than BLE. It has no Bluetooth radio. [Source](../processor-comparison.md#s09)
10. **ESP32-S3** — a strong connected general-purpose choice when Wi-Fi/BLE, more CPU and native USB are useful. It does not add Wi-Fi 6 or the original ESP32's DAC. [Source](../processor-comparison.md#s10)
11. **ESP32-C3** — a sensible low-cost Wi-Fi/BLE controller for moderate compute. Its USB-Serial/JTAG function is a device/debug interface, not a general USB host/OTG port. [Source](../processor-comparison.md#s11)
12. **ESP32-C6** — choose where Wi-Fi 6 and BLE/802.15.4 in one chip matter. Its USB function is debug/device, not host; add a separate host-capable solution if USB host is a requirement. [Source](../processor-comparison.md#s12)
13. **ESP32-H2** — choose for BLE/Thread/Zigbee without Wi-Fi. Do not pick it for a Wi-Fi product and expect firmware to add Wi-Fi. [Source](../processor-comparison.md#s13)
14. **ESP32-P4** — choose for a high-performance ESP multimedia/control design needing USB or an Ethernet MAC; pair a radio if wireless is needed and add the Ethernet physical layer. It is not the ESP32 family's Wi-Fi/Bluetooth member. [Source](../processor-comparison.md#s14)

### Entries 15–27 · STM32

15. **STM32F103C8 / Blue Pill** — a familiar low-cost learning/prototype option and classical-CAN controller. Confirm the actual chip/flash provenance on third-party boards, and remember USB is device-only and CAN needs a transceiver. [Source](../processor-comparison.md#s15)
16. **STM32F401/F411 / Black Pill** — choose for a compact Cortex-M4 project that benefits from a ready board. The exact F401/F411 and board revision change clock, memory, USB and pins; do not design from the name “Black Pill” alone. [Source](../processor-comparison.md#s16)
17. **STM32F407** — a useful wired-connectivity M4 when its Ethernet MAC, two Classical-CAN controllers and ADC/DAC set fit. Add Ethernet PHY/magnetics and CAN transceivers; this is not CAN-FD. [Source](../processor-comparison.md#s17)
18. **STM32F429** — consider for an F4-class user interface/display or camera-oriented design with Ethernet and Classical CAN. Confirm LCD/camera signal pins and package; external PHY and transceivers remain needed. [Source](../processor-comparison.md#s18)
19. **STM32F446** — a better fit than F407 when USB, audio/I²S and F4 compute matter more than Ethernet. It has Classical CAN, not CAN-FD. [Source](../processor-comparison.md#s19)
20. **STM32F767** — choose for a faster Cortex-M7 wired application with Ethernet and legacy CAN. Use another entry if CAN-FD is a hard requirement. [Source](../processor-comparison.md#s20)
21. **STM32H743/H750** — H743 suits a high-performance M7 design needing substantial internal flash; H750 suits a design willing to supply external boot/application flash. Both need a PHY for Ethernet and physical transceivers for FDCAN. [Source](../processor-comparison.md#s21)
22. **STM32H747** — choose when splitting tasks across M7 and M4 cores earns its added synchronization, shared-memory, power and debug complexity. It is usually excessive for a single simple control loop. [Source](../processor-comparison.md#s22)
23. **STM32L476** — a balanced lower-power M4 option with useful analog, USB FS and Classical CAN. Pick it when its performance is enough and a CAN-FD bus is not required. [Source](../processor-comparison.md#s23)
24. **STM32U575/U585** — shortlist for a low-power M33 system that needs modern security and CAN-FD/USB capabilities. Verify the exact package, memory configuration and peripheral pins; add an FD transceiver. [Source](../processor-comparison.md#s24)
25. **STM32G474** — a strong first choice for motor control or mixed-signal real-time work needing rich ADC/DAC, advanced PWM and FDCAN. USB is not a substitute for a general high-speed host port; add CAN-FD transceivers. [Source](../processor-comparison.md#s25)
26. **STM32WB55** — choose for BLE plus 802.15.4 use cases using ST's radio stack and dual-core arrangement. It has no Wi-Fi; plan antenna/RF and validate stack fit. [Source](../processor-comparison.md#s26)
27. **STM32WL55** — choose for low-power sub-GHz/LoRa-capable links when the band and protocol fit. It is not a Wi-Fi/BLE substitute; RF layout and regional compliance are central. [Source](../processor-comparison.md#s27)

### Entries 28–39 · Nordic and NXP

28. **nRF52832** — a good BLE sensor/beacon/endpoint candidate when its exact flash/RAM variant is enough. The supplied use-case phrase is incomplete, so any more specific fit needs that missing requirement. [Source](../processor-comparison.md#s28)
29. **nRF52840** — choose for BLE plus 802.15.4 protocols and a USB-device interface in a mature Nordic ecosystem. It is not Wi-Fi, and its USB is not a general host port. [Source](../processor-comparison.md#s29)
30. **nRF5340** — choose when a dual-core radio/application design, additional memory and separation of radio work justify greater complexity. Use a simpler radio MCU for straightforward BLE sensor work. [Source](../processor-comparison.md#s30)
31. **nRF9160 SiP** — shortlist for LTE-M/NB-IoT cellular plus GNSS telemetry. The SiP is not a ready-to-deploy service: account for SIM/subscription, band coverage, antenna, certification and the exact carrier plan. [Source](../processor-comparison.md#s31)
32. **LPC1768** — useful for maintaining an existing LPC project or learning from a legacy Cortex-M3 with Ethernet/USB/CAN. For new products, check lifecycle and availability before choosing this older family. [Source](../processor-comparison.md#s32)
33. **LPC4088** — consider for legacy designs needing its high-I/O/USB/external-memory combination. It is not automatically a better new design than a current MCU; validate supply and support. [Source](../processor-comparison.md#s33)
34. **i.MX RT1010** — choose for high M7 throughput in a small crossover MCU when external boot flash is acceptable. It is not a radio/Ethernet solution by itself. [Source](../processor-comparison.md#s34)
35. **i.MX RT1060 family** — use when an RT106x board/reference design matches the needed compute and peripherals. The family has meaningful speed, memory and controller variants; select the exact order code before layout. [Source](../processor-comparison.md#s35)
36. **i.MX RT1062** — a proven fast control/compute chip used on Teensy 4.x boards. Bare silicon needs external flash; use a board if you want the integrated prototyping experience. [Source](../processor-comparison.md#s36)
37. **i.MX RT1170** — choose for demanding mixed real-time workloads where its M7+M4 cores, high-speed interfaces and external-memory design are justified. Plan board complexity and boot memory rather than treating it as a drop-in MCU. [Source](../processor-comparison.md#s37)
38. **MCX N947 / FRDM-MCXN947** — shortlist for a modern dual-M33 MCU with NPU and CAN-FD, especially when the FRDM board's Ethernet PHY and CAN transceiver accelerate evaluation. Those board parts do not automatically come with the bare MCU. [Source](../processor-comparison.md#s38)
39. **KW41Z** — consider for an existing BLE/802.15.4/FSK product or a project that explicitly fits its older radio stack. Verify current toolchain, protocol support and supply before a new design; it is not Wi-Fi. [Source](../processor-comparison.md#s39)

### Entries 40–50 · AVR, SAM and PIC

40. **ATmega328P** — choose for simple 8-bit Arduino-compatible control and a huge legacy ecosystem. Avoid it if native USB, radio, more RAM, high performance or many UARTs are requirements. [Source](../processor-comparison.md#s40)
41. **ATmega2560** — useful where legacy shields, many pins and serial ports matter more than CPU speed or power. Its board's USB is normally a bridge; it is not native USB in the MCU. [Source](../processor-comparison.md#s41)
42. **ATtiny85** — fits tiny, low-resource tasks where six GPIO and a small program are enough. Its USI is not a full hardware I²C peripheral, and there is no native USB controller. [Source](../processor-comparison.md#s42)
43. **ATtiny1614/1616** — a better small AVR starting point when a modern timer/analog/peripheral set is needed. Account for UPDI programming and package-specific GPIO. [Source](../processor-comparison.md#s43)
44. **SAMD21** — a familiar low-cost 32-bit MCU for basic control, sensors and USB device projects. It needs a separate radio for wireless and is not an Ethernet/CAN choice. [Source](../processor-comparison.md#s44)
45. **SAMD51** — choose for more M4F performance and memory than SAMD21 without moving to a high-end connectivity MCU. It adds no built-in Ethernet or CAN-FD. [Source](../processor-comparison.md#s45)
46. **SAME54** — shortlist for a Cortex-M4 system needing an Ethernet MAC and CAN-FD. Add PHY/magnetics and transceivers unless the board already provides them. [Source](../processor-comparison.md#s46)
47. **SAME70/SAMV71** — choose for higher-throughput M7 wired-control designs with Ethernet and CAN-FD on the applicable E/V variants. Verify the S/E/V suffix; family marketing ranges include members without every interface. [Source](../processor-comparison.md#s47)
48. **PIC32MZ EF** — a fit for high-performance designs already invested in Microchip PIC32 tooling or needing its Ethernet/USB/CAN combination. Check specific flash/RAM, MAC/PHY and USB PHY configuration before board design. [Source](../processor-comparison.md#s48)
49. **PIC18 K42** — choose for cost-sensitive 8-bit control where the exact member's ADC, DAC, timers and pin count fit. “PIC18 K42” is a family, not one fixed peripheral set. [Source](../processor-comparison.md#s49)
50. **AVR128DA/DB** — choose for a modern 8-bit AVR with more memory and richer analog/event peripherals. Check DA versus DB and package for DAC and pin availability. [Source](../processor-comparison.md#s50)

### Entries 51–63 · TI, Raspberry Pi, and Renesas

51. **MSP430G2 / G2553** — fits small, simple, low-compute control and educational work with the MSP430 toolchain. Its tiny RAM/flash and lack of USB/radio make it a poor default for a connected product. [Source](../processor-comparison.md#s51)
52. **MSP430FR / FR5992** — shortlist when FRAM's nonvolatile data behavior, low-power sensing and LEA signal acceleration are useful. The cited FR5992 has 128 KiB FRAM and 8 KiB SRAM; other family members differ, so confirm the exact density and toolchain. [Source](../processor-comparison.md#s52)
53. **MSP432P4111** — choose if a Cortex-M4F and TI ecosystem are a specific fit. Confirm device lifecycle, development-tool availability, USB/peripheral details and exact package early. [Source](../processor-comparison.md#s53)
54. **MSPM0G3507** — strong value candidate for analog/control work needing a modern M0+, motor timers and CAN-FD. Add the physical CAN-FD transceiver and verify its package's analog pins. [Source](../processor-comparison.md#s54)
55. **CC2652R** — choose for 2.4-GHz BLE/Thread/Zigbee products that benefit from TI's radio stack and sensor-control features. It is not a Wi-Fi MCU. [Source](../processor-comparison.md#s55)
56. **CC1352R** — choose when sub-GHz reach plus 2.4-GHz protocol support are both useful. Validate antenna bands, stack and regional RF requirements; sub-GHz is not synonymous with LoRa. [Source](../processor-comparison.md#s56)
57. **CC3220S** — a Wi-Fi-connected MCU candidate where TI's network processor/security model is useful. The S variant needs external serial flash; include that, antenna and power design. [Source](../processor-comparison.md#s57)
58. **TMS320F28379D** — choose for serious real-time power electronics, servo and motor-control work that benefits from tightly timed PWM/ADC and C2000 control libraries. It is specialized and usually overkill for general IoT firmware. [Source](../processor-comparison.md#s58)
59. **RP2040** — an excellent low-cost maker/control option when PIO flexibility and a wide board ecosystem matter. The chip needs external flash; the Pico board supplies it. No native radio or CAN controller is built in. [Source](../processor-comparison.md#s59)
60. **RP2350** — choose for a newer RP-family board or design needing more SRAM, dual-core Cortex-M33/RISC-V choice and newer PIO features. Select RP2354 if stacked flash is desired; otherwise provide boot flash. [Source](../processor-comparison.md#s60)
61. **RA4M1** — a sensible general-purpose Cortex-M4 for moderate control/analog work with Renesas tooling and USB. It is not a Wi-Fi/Ethernet MCU. [Source](../processor-comparison.md#s61)
62. **RA6M5** — choose for a more connected M33 design needing Ethernet MAC and CAN-FD on the exact variant. Budget PHY/magnetics, transceivers and package-specific memory/pins. [Source](../processor-comparison.md#s62)
63. **RX65N** — consider for mature industrial/wired products needing Ethernet and USB with Renesas RX tools. Its CAN is Classical CAN in the compared family, not CAN-FD. [Source](../processor-comparison.md#s63)

### Entries 64–71 · PSoC, XMC and Bouffalo Lab

64. **PSoC 4** — choose for a small mixed-signal/control design that benefits from configurable analog and digital blocks. The family varies widely; identify the exact part before assuming BLE, USB, CAN or a particular ADC/DAC. [Source](../processor-comparison.md#s64)
65. **PSoC 5LP** — useful when an existing design relies on its programmable digital blocks, analog flexibility or legacy ecosystem. Check current availability and exact USB/CAN member; do not treat family capabilities as universal. [Source](../processor-comparison.md#s65)
66. **PSoC 6** — consider for dual-core, low-power connected applications where the exact variant's BLE/USB/analog set matches. Some PSoC 6 parts have BLE; the family name alone does not guarantee it. [Source](../processor-comparison.md#s66)
67. **CYW43439** — use as a Wi-Fi/Bluetooth radio companion when an appropriate host MCU, host bus, driver, antenna and module/board design are already part of the system. It cannot run the application alone. [Source](../processor-comparison.md#s67)
68. **XMC4000** — consider for industrial timing/motor-control projects already aligned with Infineon XMC tools. Select an exact XMC part because Ethernet, CAN, USB, ADC and package support are not uniform across the family. [Source](../processor-comparison.md#s68)
69. **BL602** — a low-cost Wi-Fi/BLE RISC-V candidate for prototypes or products with a verified vendor SDK and supply path. Check external flash, board antenna, documentation and production support. [Source](../processor-comparison.md#s69)
70. **BL616/BL618** — shortlist for Wi-Fi 6/BLE/802.15.4 projects in the Bouffalo ecosystem. BL618-specific audio/MAC/memory features should not be attributed to BL616 without checking the exact datasheet. [Source](../processor-comparison.md#s70)
71. **BL702** — consider for a small BLE/802.15.4 controller where Wi-Fi is unnecessary. Do not assume the Ethernet or GPIO features of related BL704/BL706 variants are present. [Source](../processor-comparison.md#s71)

### Entries 72–85 · WCH, GigaDevice, boards, and other MCUs

72. **CH32V003** — fits ultra-low-cost, very small control tasks and RISC-V learning. It has limited memory/pins and no USB controller; avoid it when the cost of external support/debug dominates. [Source](../processor-comparison.md#s72)
73. **CH32V203** — a budget RISC-V option when the selected suffix's USB, Classical CAN and analog functions fit. Verify package, flash/RAM and host/device role; do not assume one V203 SKU represents the whole family. [Source](../processor-comparison.md#s73)
74. **CH32V307** — consider for a higher-feature RISC-V design with USB and wired networking. Verify the exact EMAC/PHY implementation, speed, package and board circuit; it is not a drop-in equivalent to every 10/100 MAC MCU. [Source](../processor-comparison.md#s74)
75. **CH552** — useful for low-cost USB-device/HID and 8051 projects when its small memory and toolchain fit. Confirm host/device mode, USB pin usage and current manual revision before committing to the USB role. [Source](../processor-comparison.md#s75)
76. **GD32VF103** — choose for an inexpensive RISC-V project where the selected package's Classical-CAN/ADC/peripheral set and development ecosystem are validated. Add the CAN transceiver; do not assume CAN-FD. [Source](../processor-comparison.md#s76)
77. **GD32F303** — a Cortex-M4F option for cost-conscious control when an exact F303 member provides the required flash, ADC, timers and serial interfaces. Do not borrow Ethernet features from the distinct F305/F307 families. [Source](../processor-comparison.md#s77)
78. **GD32E230** — use for simple, low-cost M23 control where the modest memory and pin budget suffice. It is not the choice for wireless, Ethernet, CAN or a large application. [Source](../processor-comparison.md#s78)
79. **Teensy 4.0** — choose as a development board for fast high-performance prototyping with a compact header footprint. Although its MCU has an Ethernet MAC, the board intentionally does not expose the required Ethernet signals; use an SPI Ethernet module or another board for native Ethernet. CAN needs transceivers and wireless needs an add-on. [Source](../processor-comparison.md#s79)
80. **Teensy 4.1** — choose when the extra I/O, microSD and expansion options matter. The standard `TEENSY41` board includes a DP83825 10/100 Ethernet PHY, but the MagJack/connector kit is sold separately; `TEENSY41_NE` omits the PHY chip. CAN still needs transceivers. [Source](../processor-comparison.md#s80)
81. **STC8** — a practical low-cost 8051 family where local supply, established tools and the exact STC8 suffix are known. USB, ADC and GPIO vary by model; never order from the family label alone. [Source](../processor-comparison.md#s81)
82. **Nuvoton M480** — a capable M4 family for control/connectivity when the exact M480/M487 member has the needed EMAC, USB, CAN, analog and memory. Include external PHY/transceivers; not all M480 variants share M487 features. [Source](../processor-comparison.md#s82)
83. **Holtek HT32F72388** — a cost-focused M0+ candidate for moderate control with USB device, Classical CAN and analog needs. It does not provide an Ethernet MAC or CAN-FD in the compared configuration. [Source](../processor-comparison.md#s83)
84. **Artery AT32F403A** — consider when its M4F performance/peripheral mix and local supply are attractive. Validate the exact flash/RAM/package, vendor tool support and lifecycle; add Classical-CAN transceivers and do not assume Ethernet. [Source](../processor-comparison.md#s84)
85. **HPM6750** — shortlist for demanding real-time/high-speed I/O work that can use dual RISC-V cores, Gigabit MACs and multiple CAN-FD controllers. Expect a more complex BGA, external boot/memory and board-level PHY/transceiver design; it has no integrated radio or NPU in the compared part. [Source](../processor-comparison.md#s85)

## Final decision checklist

Before committing to a chip or board, write down each answer:

1. **Exact part and product layer:** silicon, module, SiP or board? What exact ordering code/revision and package will be purchased?
2. **Workload:** worst-case CPU time, interrupt latency, RAM/flash/model size, boot time, image/audio throughput and any supported AI operators.
3. **Pin budget:** usable GPIO after power/reset/boot, programming, radio, flash, ADC and multiplexed peripheral pins. Check the package pinout and board schematic.
4. **Interfaces by role and count:** USB host/device/OTG and speed; Ethernet MAC versus PHY; CAN versus CAN-FD and transceiver; serial-bus controller count and alternate-function conflicts.
5. **Memory/boot:** internal versus external flash/RAM, PSRAM/SDRAM bandwidth, boot source, startup sequence and whether a particular board has already installed the memory.
6. **Wireless:** standard, regional bands, antenna, RF layout, certification, protocol stack, security updates and radio duty-cycle power.
7. **Analog and control:** ADC/DAC accuracy and timing, reference, analog pin count, PWM synchronization, fault response and isolation—not only headline resolution or PWM count.
8. **Software and supply:** toolchain, debugger, vendor SDK, examples, licensing, long-term availability, lifecycle status, second source, production test and board support.
9. **Whole-system cost:** add external memory, PHY, magnetics, transceivers, antennas, host processor, connectors, regulators, debug hardware, certification and assembly. A bare-chip estimate is not comparable to a development-board price.
10. **Evidence:** save the datasheet revision, product page, reference manual, errata, schematic and software-release notes used to approve the design. Re-check them before production.

For per-feature figures, variants, add-on circuitry and primary-source links, return to the [comparison and consolidated 1–85 catalog](../processor-comparison.md).
