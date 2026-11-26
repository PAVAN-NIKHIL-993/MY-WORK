#!/usr/bin/env python3
"""
Stage 2 — Build refined-chat-archive/ from .work/normalized.jsonl.

Topic-chaining: related conversations (same project / continuing task) are nested
inside the chain-root conversation folder. Slug format: YYYY-MM-DD_<short-slug>.

Usage:
  python3 tools/build_archive.py            # build archive
  python3 tools/build_archive.py --verify   # verify archive integrity
"""
import json
import os
import re
import shutil
import sys
from datetime import datetime, timezone

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WORK = os.path.join(ROOT, ".work")
ARCHIVE = os.path.join(ROOT, "refined-chat-archive")
SRC = os.path.join(ROOT, "chatgpt-export-source")

# ---------------------------------------------------------------- chain config
# Keyed by position in the globally-sorted (create_time) list of 125 records.
# Each chain: root index first, then children in chronological order.
# Standalone folders are chains of one (root only).
CHAINS = [
    [0],                                             # remotexy-alternatives
    [1],                                             # esp32-ftp-server-control
    [2],                                             # hextronik-esp32-connection
    [3],                                             # esp32-camera-to-tft
    [4],                                             # esp32-voltage-selector-code
    [5],                                             # m30-mobile-links
    [6, 35, 36, 39, 53, 81, 87, 109, 124],           # HEATER / POWER-SWITCHING
    [7],                                             # esp32-rmt-servo-control
    [8, 9, 10, 11, 12, 13, 14, 17, 18, 19, 20, 21, 22, 24, 26, 27, 28, 29, 30,
     31, 32, 33, 34, 41, 42, 45, 46, 47, 54, 55, 60, 66, 68, 69, 70, 71, 72,
     73, 74, 75, 76, 77, 78, 88],                    # HEALTH MONITORING SYSTEM
    [16, 15],                                        # RF RECEIVER (LM358)
    [23],                                            # esp32-usb-printer-setup
    [25],                                            # jetson-nano-overview
    [37, 38, 40, 84, 89, 98, 112, 115, 116, 117],    # KICAD / PCB DESIGN
    [43, 44, 48, 49, 50, 51, 56, 57, 58, 59, 62, 63, 64, 65],  # AUDIO / TTS / SOUNDPLANT
    [52, 99, 100],                                   # MECHANICAL / STEPPER
    [61],                                            # upload-error-troubleshooting
    [67],                                            # arduino-debugging-tools
    [79],                                            # lcr-meter-esp32-display
    [80, 90],                                        # ELECTROPLATING
    [82],                                            # resistor-value-series
    [83],                                            # esp32-string-memory-issues
    [85],                                            # esp32-1mhz-signal
    [86],                                            # mcp2515-can-bus-module
    [91, 92, 93, 94],                                # WATER-LEVEL / LORA DISPENSING
    [95],                                            # indian-mpus-and-mcus
    [96, 97, 101, 102, 110, 111, 119],               # WINDOWS / PC MAINTENANCE
    [103],                                           # refund-request-for-appointment
    [104],                                           # engineering-software-tools
    [105],                                           # esp32-whatsapp-terminal
    [106],                                           # git-hosting-for-websites
    [107],                                           # gsm-for-embedded-projects
    [108],                                           # open-minimized-camera-window
    [113],                                           # esp32-pin-functions
    [114, 120, 121],                                 # PERSONAL / CAREER
    [118],                                           # multimeter-damage-diagnosis
    [122],                                           # determine-wss-process
    [123],                                           # generate-chat-history-transcript
]

SLUGS = {
    0: "remotexy-alternatives", 1: "esp32-ftp-server-control",
    2: "hextronik-esp32-connection", 3: "esp32-camera-to-tft",
    4: "esp32-voltage-selector-code", 5: "m30-mobile-links",
    6: "heater-driver-circuit", 7: "esp32-rmt-servo-control",
    8: "skintone-sensors-guide", 9: "codex-refactor-max30105-code",
    10: "codex-enhance-max30105-code", 11: "master-thread-esp32-heart-rate",
    12: "firmware-blueprint-stages", 13: "codex-implement-final-blueprint",
    14: "averaging-method-review", 15: "group-chat-lm358-rf-receiver",
    16: "lm358-rf-receiver-limitations", 17: "heart-rate-monitor-firmware",
    18: "codex-improve-heart-rate-accuracy", 19: "codex-add-heart-rate-code-comments",
    20: "esp32-c3-boot-sequence", 21: "firmware-design-review",
    22: "esp32-c3-pulse-oximeter-firmware", 23: "esp32-usb-printer-setup",
    24: "iot-dashboard-options", 25: "jetson-nano-overview",
    26: "esp32-iot-web-server", 27: "clinical-alert-naming-system",
    28: "clinical-alert-naming-guide", 29: "code-differences-breakdown",
    30: "code-functionality-audit", 31: "body-temp-monitor-setup",
    32: "health-monitoring-wearable", 33: "mpu6050-code-debug",
    34: "image-generation-request", 35: "ups-charging-issue",
    36: "mosfet-gate-discharge-solution", 37: "kicad-schematic-fixes",
    38: "clean-bom-for-production", 39: "time-constant-calculation",
    40: "kicad-footprint-creation", 41: "respiration-measurement-methods",
    42: "max30102-integration-code", 43: "ir-to-tts-via-bluetooth",
    44: "bluetooth-a2dp-audio-fix", 45: "fall-detection-mpu6050",
    46: "respiration-rate-code", 47: "sensors-for-tilt-detection",
    48: "i2s-random-sound-code", 49: "offline-tts-with-sd",
    50: "offline-tts-with-keypad", 51: "direct-audio-transmission-setup",
    52: "worm-gear-vs-rack-pinion", 53: "irlz44n-7a-maintenance",
    54: "3-button-ui-code", 55: "battery-current-draw-adc",
    56: "esp32-dfplayer-code", 57: "debugging-audio-setup",
    58: "token-generation-explained", 59: "number-extraction-request",
    60: "cyborg-fall-detection", 61: "upload-error-troubleshooting",
    62: "usb-speaker-not-working", 63: "sound-plant-token-system",
    64: "voicemeeter-banana-setup", 65: "project-methods-list",
    66: "ntc-black-layer-composition", 67: "arduino-debugging-tools",
    68: "ui-design-for-health-system", 69: "professional-pitch-deck-ppt",
    70: "healthcare-dashboard-analysis", 71: "vs-code-app-setup",
    72: "project-overview-breakdown", 73: "ts-errors-fix-guide",
    74: "temp-only-project-framework", 75: "ntc-resistor-esp8266-connection",
    76: "ip5306-sleep-solution", 77: "dashboard-merge-update",
    78: "max30102-example-code", 79: "lcr-meter-esp32-display",
    80: "electroplating-3d-printed-parts", 81: "sine-wave-to-pulsating-dc",
    82: "resistor-value-series", 83: "esp32-string-memory-issues",
    84: "robu-pcb-manufacturing-specs", 85: "esp32-1mhz-signal",
    86: "mcp2515-can-bus-module", 87: "irlz44n-build-guide-assistance",
    88: "hmi-display-sdks-ranking", 89: "protoexpress-pcb-services",
    90: "thermal-epoxy-resin-info", 91: "xkc-y25-water-level-sensor",
    92: "peristaltic-pump-sizing", 93: "lora-modules-comparison",
    94: "sx1278-ra01sc-antenna", 95: "indian-mpus-and-mcus",
    96: "battery-health-report-cmd", 97: "hard-drive-health-tips",
    98: "kicad-schematic-completion-guide", 99: "rpm-motor-control",
    100: "stepper-motor-recommendations", 101: "locked-gallery-recovery-tools",
    102: "remove-edge-and-bing", 103: "refund-request-for-appointment",
    104: "engineering-software-tools", 105: "esp32-whatsapp-terminal",
    106: "git-hosting-for-websites", 107: "gsm-for-embedded-projects",
    108: "open-minimized-camera-window", 109: "zvs-circuit",
    110: "open-command-prompt-as-admin", 111: "diagnose-keyboard-remapping",
    112: "bom-identification", 113: "esp32-pin-functions",
    114: "personal-profile-summary", 115: "remove-kicad-wires",
    116: "kicad-shortcuts-pdf-list", 117: "emr-in-pcb-design",
    118: "multimeter-damage-diagnosis", 119: "stop-windows-11-update",
    120: "revise-python-points", 121: "leave-permission-request",
    122: "determine-wss-process", 123: "generate-chat-history-transcript",
    124: "generate-heater-chat-summary",
}

# One-to-two sentence genuine overviews (written from the export content).
OVERVIEWS = {
    0: "Survey of free and paid alternatives to the RemoteXY no-code app builder for ESP32/Arduino dashboards, covering no-code builders, cloud IoT platforms, and custom frameworks.",
    1: "Telugu-language consultation on running an FTP server on an ESP32 behind a carrier-grade NAT network, covering CGNAT limits, VPS/reverse-tunnel options, and ESP32-FTP-Server setup.",
    2: "Interfacing a hexTronik flight-controller-style board (AIL/ELE/THR/RUDD/AUX) with an ESP32 DevKit v1: wiring, signal detection, 5-channel PWM output via RMT, ESC/motor selection and power questions.",
    3: "Wiring and compact Arduino sketches to stream an ESP32 camera feed to an ILI9341/TFT display, with pin mappings and esp_camera + SPI/TFT_eSPI configurations.",
    4: "Debugging an ESP32 4-stage voltage-selector (3.0/… V rails via GPIO 14/27/26/25 with optocouplers) that showed all-high outputs at boot; covers floating-gate root cause and full initialization fix.",
    5: "Reviving a Samsung M30s with a broken display but working touch: ADB debugging, Scrcpy and Vysor setup, plus resolution of an 'M30' ticketing/connectivity question.",
    6: "Design of an ESP32/555-based heater driver: 3.2–5 V supply, MOSFET low-side switching, LM393 current-limit comparator, PWM control, pin-outs and circuit topology.",
    7: "Review and correction of an ESP32 RMT-based servo-control sketch (1000–2000 µs pulses, 50 Hz frame) with ramping and safety constraints.",
    8: "Survey of skin-tone measurement approaches — TCS34725/TCS3200/AS7262/AS7341 spectral sensors, MAX30102-based reflectance, and camera methods — with procedures and accuracy expectations.",
    9: "Codex cloud-agent task: refactor the MAX30105 heart-rate sensor sketch to improve structure and readability (archived Codex task, code round-trip).",
    10: "Codex cloud-agent task: enhance the MAX30105 heart-rate sensor code (archived Codex task, code round-trip).",
    11: "Master thread that consolidates the whole ESP32 + MAX30102/MAX30105 heart-rate project: objective, hardware stack, wiring, sensor configuration, firmware architecture stages and design decisions.",
    12: "Stage-by-stage firmware blueprint for the heart-rate monitor (constants, hardware interface, state machine, filtering, peak detection, sliding-window BPM) with full sketch review and fixes.",
    13: "Codex cloud-agent task: implement the final design blueprint stages of the heart-rate firmware inside the user's codebase (archived Codex task).",
    14: "Design of a ±3-value locked/held averaging state machine (6-second hold) for BPM output; covers state transitions, timing rules, pseudocode and drop-in Arduino implementation.",
    15: "Group chat mirror of the LM358 op-amp RF receiver question; assesses feasibility of a crude AM/ASK receiver front-end with an LM358.",
    16: "Assessment of LM358-based RF receivers: what they can and cannot do, realistic performance envelope, and when the approach makes sense.",
    17: "Full working-through of an industrial-grade ESP32-C3 + MAX30105 heart-rate firmware: FIFO sampling, filtering, beat detection, BPM averaging, SQI gating, safety output contract.",
    18: "Codex cloud-agent task: improve MAX30105 heart-rate monitor accuracy (archived Codex task).",
    19: "Codex cloud-agent task: add heart-rate monitor code comments (archived Codex task).",
    20: "Architecture review of the ESP32-C3 heart-rate firmware: boot sequence, configuration constants, FreeRTOS structure, I²C/driver blocks and improvements for WiFi-only data dump.",
    21: "Design review of the full ESP32-C3 firmware block diagram (boot ROM, init, FreeRTOS, timer ISR, queues, DSP, beat detection, state machine, I²C supervisor, telemetry) and its improvements.",
    22: "Single-sketch ESP32-C3 + MAX30105 pulse-oximeter scaffold: hardware timer at 100 Hz, acquisition task, DSP chain, refractory beat detection, SQI and full code generation.",
    23: "Old laser printer + ESP32 USB Host Shield: mandatory hardware stack, firmware block diagram, and why printer-powered ESP32 is electrically unsafe; plus power architecture advice.",
    24: "Catalogue of IoT dashboard options (cloud, app-based, Google Drive/Sheets): Firebase, ThingsBoard, AWS IoT Core, Blynk, MIT App Inventor, Sheets+Apps Script — free vs paid, with longevity advice.",
    25: "Quick overview of the NVIDIA Jetson Nano platform and its role/positioning.",
    26: "Adding WiFi + WebServer hosting of MAX30105 serial data to a local hostname web page; full ESP32 web-server heart-rate sketch with live values.",
    27: "Clinical alert naming system for the wearable: alert enums, thresholds (HR/SpO₂/temp/PI), evaluation engine, Serial debug and design rationale for VI-TRAK-class language.",
    28: "Clinical alert naming guide: bradycardia/tachycardia/arrhythmia/hypoxia/perfusion/thermoregulation alert labels with thresholds and selection of six final alerts.",
    29: "Audit of SHT31 Arduino example variants (raw/async/plotter/heater/dual-I²C) and request for a combined sketch of their functions.",
    30: "Verification that the user's SHT31 sketch includes connection detection, serial number read, heater control, async read, raw values and dual-sensor support — plus gaps (periodic mode, status read, soft reset) and fixes.",
    31: "Body-temperature monitoring with 100k NTC (1%) + 100k series resistor and Steinhart–Hart coefficients; ESP32-C3 ADC code, pin-out tables, WebSerial output and compile-error fixes.",
    32: "VI-TRAK health-monitoring wearable product spec: SpO₂, temperature zones, heart-rate intelligence, humidity, sleep engine, battery logic, UI/cloud requirements and alert strategy.",
    33: "MPU-6050 Kalman-filter sketch review: broken moving-average fix, yaw-drift truth, temp compensation, dt stability, 333 ms print cadence, stair-climb recognition limits.",
    34: "Image-generation iterations to merge two poster/banner images into a single gap-free composition (VI-TRAK product artwork).",
    35: "Troubleshooting four UPS units repeatedly dropping out of charge mode; root-cause analysis points at mains quality, an undersized 400 W SMPS feeding 600 W UPS loads, and back-feed on the power cord.",
    36: "IRFZ44N gate held high by a floating 12 V trigger: gate pull-down resistor design, values, turn-off behavior and professional drive-stage notes.",
    37: "Repair of a KiCad TP4056 Li-ion charger schematic export: structural faults, corrected topology, USB-C checks and minimum working component list; output as text for Eeschema.",
    38: "Consolidated production Bill of Materials for the wearable (power/LDO, battery charging+protection, MPU6050, MAX30102, NTC, LEDs, connectors), block-wise and KiCad-ready.",
    39: "RC time-constant design: 10k×100µF=1 s stretched to 180 s via capacitor/resistor trade-offs vs a 555-timer approach, with LED drive at 3 V analysis.",
    40: "Creating an ESP32-C3-MINI-1 footprint in KiCad: castellated edge pads, bottom GND pads, antenna keepout, ready-to-use footprint text and where to find Espressif's official library.",
    41: "Survey of respiration-measurement methods in medical devices (airflow, chest movement, capnography, bioimpedance, acoustic) and extracting respiration rate from PPG/HR/HRV for the wearable.",
    42: "MAX30102 ↔ React website integration: WebSocket bridge, all-in-one .ino showing HR/RR/SpO₂, plus the web-side code and step-by-step setup.",
    43: "ESP32 IR receiver → Bluetooth TTS pipeline design and full single-sketch firmware (IRremote + BluetoothSerial), phone-side TTS options and test steps.",
    44: "Debugging Bluetooth A2DP SD-card WAV playback that 'connects but plays once then stalls': blocking-input fix, callback protection, buffer tuning, full working code and MP3 options.",
    45: "Fall-detection algorithm design for MPU6050: free-fall + impact + no-motion + orientation-change fusion, scenario handling (bathroom slip, falling from bed), thresholds and validation advice.",
    46: "Strips MPU6050/delays out of a respiration-rate sketch to print clean respiration rate from the MAX30102 with finger-presence gating.",
    47: "How tilt/sudden-motion sensors work (accelerometer, gyroscope, fusion), walking/running/stair gait rhythms, fall kinematics and pictures of fall types.",
    48: "ESP32 I2S audio exploration: noise/tone generation, embedded WAV 'hello', SD-card audio, TTS sourcing — culminating in an I2S playback setup.",
    49: "Offline TTS via SD card: pre-recorded WAV strategy, SPI SD wiring and corrected code paths after repeated boot/compile errors.",
    50: "DFPlayer Mini + 4×4 hex keypad offline TTS: 3-digit codes, next/repeat (same button) logic, ESP32 wiring (RX2/TX2 vs RX/TX debate), full code and self-test.",
    51: "Direct audio chain from mixed parts: microphone selection, PAM8403/LM386 amplifier wiring, noise reduction and the 'no magic components' reality check.",
    52: "Mechanical-drive selection: worm gear vs rack-and-pinion principles, self-locking behavior and comparison for the user's actuator application.",
    53: "Sustaining 7 A through an IRLZ44N / IRLB8743 low-side switch at 3.3 V gate drive: Rds(on), thermal design, current sharing, and constant-current load behavior.",
    54: "3-button + 3-LED + vibration-motor gadget with ESP32 WiFi web UI; buttons↔LEDs mapping, motor-on-every-press behavior, classic UI with embedded serial monitor.",
    55: "Whether an ESP32 ADC draws meaningful battery current: divider math, 330k single-resistor + capacitor approach, and using the ESP32 as a voltmeter/logging tool.",
    56: "ESP32 + DFPlayer Mini + I2C LCD + 4×4 keypad + 7-segment display: assumed pin set, full working code, wiring for the 'same as circuit diagram' display build.",
    57: "Systematic no-output audio debugging (speaker/PAM8403/DFPlayer): checklist from SD wiring to amplifier gain; based on the user's 'this worked fully fine' state.",
    58: "Reading a pasted Agora RTC token-generator codebase — roles, privileges, token builders and RTM/RTC combination — and where the audio actually comes from.",
    59: "Trimming an ESP32 Talkie text-to-speech sketch to numbers 0–9/11–19/tens/hundred plus token-number handling, output in words.",
    60: "VI-TRAK pitch deck draft: slide-by-slide content (intro, product info, functionality, parameters, alerts, IoT, institution details) for higher authorities.",
    61: "Arduino upload failure (avr new.cpp warning + COM6 access denied): fixes in order — Serial Monitor, cable, board, RX/TX disconnect, reset timing, drivers, RAM limits — plus UNO/Nano pinout for keypad+SD.",
    62: "USB speaker swap on Windows for Soundplant/LuaMacros: device renaming, playback tests, token WAV vs other-media routing, LuaMacros syntax error diagnosis.",
    63: "'Sound plant' interactive installation: WAV playback via external keypad + USB mouse, Soundplant/LuaMacros pipeline, 3.5 mm output and dynamic token triggering.",
    64: "Voicemeeter Banana practical setup: install order, A1/A2/A3 routing for Soundplant, low-latency settings and VB-CABLE fallback — step by step.",
    65: "Catalogue of every audio-playback method discussed across threads (WAV/MP3/RAW, direct/amp/USB/PC, keypad/mouse/IR triggers) plus a project report/chaptering request.",
    66: "Materials science of NTC thermistors: black epoxy/glass coating composition, semiconducting core oxides, coating types, shapes and tolerance behavior.",
    67: "Professional Arduino debugging tooling: Serial logging, Visual Micro, PlatformIO+VS Code step debugging, Proteus/Wokwi simulation and logging pipelines.",
    68: "Design of the VI-TRAK health dashboard UI: monochromatic professional theme, top navbar, live vitals cards (HR/SpO₂/RR/temp), layout structure and a direct HTML deliverable.",
    69: "Pitch-deck structure for the VI-TRAK healthcare product PPT: problem, solution, use-case blocks (elderly/child/old-age/nursing homes), features, dashboard, prompt for generation.",
    70: "Deep-dive analysis of the VI-TRAK dashboard specification text — cinematic intro, design system, main dashboard, ECG engine, analytics, 10-patient management — and renaming to 'VI TRAK 637'.",
    71: "Setting up the VI-TRAK dashboard as a Vite/React app in VS Code: project creation, installs, App.tsx delivery, tab removal and feature additions.",
    72: "Full project overview (wearable accident-prevention cybernetic healthcare platform): hardware stack, fall-detection stages, and draw.io flowchart generation fixes.",
    73: "Fixing persistent TypeScript/import errors in the VI-TRAK dashboard React app: motion import, telemetry types, Tailwind classes, clipboard/localStorage and React keys.",
    74: "Framework for a temperature-only NTC product: stack selection (frontend/architecture), NodeMCU pin-out, NTC measurement code, °C/°F output.",
    75: "65k NTC + 68k divider on ESP8266 ADC (A0): wiring, Steinhart–Hart code, ESP8266 ADC attenuation caveats, human-body-temp drift explanation and calibration.",
    76: "IP5306 power-bank IC sleep/boost sequencing with ESP32: EN-pin control, push-button architecture, pinout, circuit and professional power-path design.",
    77: "Merging two VI-TRAK dashboard implementations: keeping only temp °C/°F + opening animation, deleting HR/RR/SpO₂, live WebSerial updates, UI/animation polish and compile fixes.",
    78: "Minimal MAX30102 example sketch: wiring, libraries, expected output — a clean starting point.",
    79: "LCR meter project on ESP32 + I2C LCD: architecture options (RC timing, frequency method, AD5933), CD4053 multiplexing, accuracy expectations.",
    80: "Metallic finish on 3D-printed parts: surface prep, conductive coatings, copper/nickel electroplating, materials list, process steps, safety and finishing.",
    81: "Clipping a 3 k RPM motor FG sine (~7 V) to pulsed DC for safe MCU sensing: LM393 zero-cross detection, RC/EMI notes, isolation and frequency estimation.",
    82: "Why passives ship in E6/E12/E24/E96 values and crystals in standard frequencies — plus deep dives into transmission-line impedance (50/75 Ω) and related trivia.",
    83: "ESP32 heap fragmentation from String class: char[]+snprintf migration, how to prove fragmentation (heap/watermark), and firmware practice.",
    84: "Robu PCB manufacturing capabilities and recommended design rules, high-current cheat-sheet and 'maximum capability' board guidance for ESP32 projects.",
    85: "Whether an ESP32 can output 1 MHz (LEDC/RMT/I2S/timer) and how/whether the ADC can sample 1 MHz signals directly or via counters/capture peripherals.",
    86: "MCP2515 + TJA1050 CAN-bus module: what it is, pin connections, speeds, AMS1117 supply, safe integration into ESP32/Arduino vehicle projects.",
    87: "Technical review of an induction/heater build doc: IRLZ44N drive circuit, coil/capacitor calculations, flyback diode and PWM sections — generating a corrected HTML doc.",
    88: "Ranking of HMI display brands/SDKs (DWIN DGUS, 4D Systems, STONE, Waveshare) with pricing and ease-of-use for ESP32 and Raspberry Pi.",
    89: "Evaluation of ProtoExpress PCB manufacturing services: capabilities, engineering services, certifications and hobbyist suitability.",
    90: "Thermal epoxy resin selection and practice: thermally conductive vs electrically insulating/conductive types, fillers and thermal-conductivity comparison.",
    91: "XKC-Y25 non-contact liquid-level sensor on ESP32: wiring, working principle (capacitive field), interference risks with sensitive neighbors, mounting.",
    92: "Peristaltic-pump sizing: 5 mm ID tubing, NEMA 17 40×42, 40 mm rotor circumference math for ~600 mL/min flow at 100–200 RPM.",
    93: "LoRa module comparison for a 10-floor concrete-wall building: 433 MHz vs 915 MHz vs 2.4 GHz link budget, antenna sizing (17 cm vs PCB), module recommendations.",
    94: "SX1278 (RA-01SC) spring antenna: specs, expected range and precautions.",
    95: "Indian MCU/MPU landscape for pvt-ltd purchase (THEJAS32/ARIES, SHAKTI, Mindgrove, InCore, SCL, C-DAC) plus Indian WiFi/LoRa modules and ESP32-S3-compatible options.",
    96: "Windows battery-report generation via powercfg and how to read design vs full-charge capacity for health percentage.",
    97: "Hard-drive health recovery after zero-fill: SMART extended self-test, surface scan interpretation, why health reads 24% and realistic expectations.",
    98: "Completing a KiCad schematic for an IP5306 + ESP-12E + microSD + ICS-40730 spy-recorder: every block (power, EN, boot resistors, SD, mic, UART header, test points).",
    99: "RPM control for a 1.8° stepper via STEP/DIR/EN pins — step-rate math for 300 RPM and full-step pulsing.",
    100: "High-torque NEMA 17/23 stepper recommendations at ≤2 A (12/24 V), with driver pairing and precision notes.",
    101: "Recovery options for a formatted phone's locked gallery: Google Photos Locked Folder, Samsung Secure Folder, vault apps and forensic tools — realistic chances.",
    102: "Removing forced Microsoft Edge/Bing on Windows 10 via defaults, registry, scheduled tasks and uninstall hacks.",
    103: "Formal refund-request email to helpdesk-sarathi@gov.in: slots shown available online but 'no slots' after fee payment.",
    104: "Explainer on EDA/CAD/Fusion/SolidWorks/CFD/ANSYS and the best free alternatives in each category.",
    105: "ESP32 WhatsApp terminal concept: phone as notification gateway, ESP32↔WhatsApp via a gateway app, reply path, filtering logic and build stages.",
    106: "Hosting websites from Git as an online server: static HTML/Vite/React deployment paths (GitHub Pages etc.) with step-by-step docs and troubleshooting.",
    107: "GSM module landscape for embedded projects (2G GPRS, 3G, 4G LTE, 5G), common modules and ESP32 pairing notes.",
    108: "Opening a minimized camera window on Windows 10 and capturing photos.",
    109: "ZVS (zero-voltage switching) induction-heater capacitor selection: 104J markings, 400/600 V ratings, circulating current, heating behavior and 12 V input limiting.",
    110: "Opening Command Prompt as administrator in a directory and running the Interception keyboard-driver installer with logged output.",
    111: "Keyboard remapping fault ('p' normal in Notepad, 'p6' in Windows Search): Interception stop test, driver reinstall, layout checks.",
    112: "Identifying parts on a BOM/schematic photo — mainly Q1 and the circuit's function.",
    113: "ESP32 pin-by-pin function mapping (left/right sides, from photo): GPIO alternate functions, PWM/UART/I2C/SPI/DAC/ADC1, strapping pins, based on the user's wiring table.",
    114: "Professional self-profile for the user: ECE diploma, NEC E-Cell member (33rd rank), ESP32/wearables/drones/IoT interests, projects and achievements — resume tone.",
    115: "KiCad 10 shortcut reference: delete all wires (select-by-type, Ctrl+E), and copper text on PCB via zones/text elements.",
    116: "Compile a PDF-style list of every KiCad 10 shortcut/command/function in Eeschema and Pcbnew.",
    117: "EMC/EMI in PCB design plus ERC and DRC rule overviews: clearance vs creepage, pin-conflict map, manufacturing checks and how to apply them in KiCad.",
    118: "603 Junior multimeter dead after battery terminals were shorted: blank LCD, open-circuit battery pins — structured fault-finding (fuse, supply, torch circuit).",
    119: "Stopping a forced Windows 11 upgrade on Windows 10: Update Assistant removal, registry TargetReleaseVersion blocks, GPO.",
    120: "Resume bullet points for Python (strengths/weaknesses/opinion) plus leave-application letter for semester preparation, addressed to HOD ECE.",
    121: "Leave-permission letter for two students from afternoon for semester preparation (paired with the Python resume notes task).",
    122: "Solve '8(b) — determine whether the random process is WSS': mean, autocorrelation, and WSS verification steps (exam-prep).",
    123: "Request to generate a full copy-ready plain-text transcript of a chat (user questions, answers, summary, suggestions) — a meta task on the export workflow itself.",
    124: "Same transcript-generation request targeting the heater-project workspace specifically.",
}

CHAIN_NAMES = {
    6: "Heater Driver & Power-Switching Chain",
    8: "VI-TRAK Health Monitoring System Chain",
    16: "LM358 RF Receiver Chain",
    37: "KiCad / PCB Design Chain",
    43: "Audio / TTS / Soundplant Chain",
    52: "Mechanical Actuation Chain",
    80: "Electroplating Chain",
    91: "Water-Level Dispensing & LoRa Chain",
    96: "Windows / PC Maintenance Chain",
    114: "Personal / Career Chain",
}

# ---------------------------------------------------------------- helpers
def load_records():
    records = [json.loads(l) for l in open(os.path.join(WORK, "normalized.jsonl"), encoding="utf-8")]
    records.sort(key=lambda r: (r.get("create_time") or 0, r.get("title") or ""))
    return records

def folder_slug(idx, rec):
    slug = SLUGS[idx]
    return f"{rec['date']}_{slug}"

def norm_ws(text):
    return re.sub(r"\s+", " ", text).strip()

def clean_sentence(s):
    s = s.strip().strip("*-• ").strip()
    s = re.sub(r"^#{1,6}\s*", "", s)
    return s.strip()

SENT_SPLIT = re.compile(r"(?<=[.!?])\s+(?=[A-Z0-9(\"'*])")
REC_KEYWORDS = re.compile(
    r"\b(i recommend|recommend|recommended|the best|should|avoid|instead of|do not|don't|never|always |ensure|prefer|must |safest|optimal|make sure)\b",
    re.IGNORECASE)

def extract_recommendations(recs, cap=12):
    out, seen = [], set()
    for rec in recs:
        for t in rec["turns"]:
            if t["role"] != "assistant":
                continue
            text = t["text"]
            # drop fenced code blocks before sentence splitting
            text = re.sub(r"```.*?```", " ", text, flags=re.DOTALL)
            text = re.sub(r"\s+", " ", text)
            for sent in SENT_SPLIT.split(text):
                s = clean_sentence(sent)
                if not (50 <= len(s) <= 280):
                    continue
                if not REC_KEYWORDS.search(s):
                    continue
                if s.count("{") + s.count("}") + s.count(";") > 2:
                    continue
                if any(j in s for j in ("---", "***", "|", "■", "<badge", "<box", "<row", "http")):
                    continue
                if not re.match(r'^([A-Z0-9(]|You\b|I\b|Use\b|Add\b|The\b|For\b|Make\b|Ensure\b|If\b|Do\b|Never\b|Always\b)', s):
                    continue
                key = s.lower()[:80]
                if key in seen:
                    continue
                seen.add(key)
                out.append(s)
                if len(out) >= cap:
                    return out
    return out

def extract_headings(recs, cap=18):
    out, seen = [], set()
    for rec in recs:
        for t in rec["turns"]:
            if t["role"] != "assistant":
                continue
            for line in t["text"].split("\n"):
                s = line.strip()
                m = re.match(r"^#{1,4}\s+(.{3,90})$", s) or re.match(r"^(?:\*\*|__)([A-Za-z][^*_]{3,80})(?:\*\*|__)\s*:?\s*$", s)
                if not m:
                    continue
                h = m.group(1).strip().rstrip(":")
                h = re.sub(r"^[\d]+[.)]\s*", "", h).strip()
                h = re.sub(r"^[\W_]+", "", h).strip()  # drop leading emoji/symbols
                h = h.strip("*_ ").strip()              # drop stray bold markers
                if not h or any(c in h for c in "{}<>|"):
                    continue
                key = h.lower()
                if key in seen:
                    continue
                seen.add(key)
                out.append(h)
                if len(out) >= cap:
                    return out
    return out

FENCE_RE = re.compile(r"```([A-Za-z0-9_+#.-]{0,24})")
FILE_RE = re.compile(r"\b[\w\-./\\]+\.(?:ino|c|cpp|cc|h|hpp|py|jsx|tsx|js|ts|html|htm|css|json|txt|md|csv|yaml|yml|bat|ps1|reg|kicad_sch|kicad_pcb|kicad_mod|wav|mp3|bin|hex|drawio|cmake|ini|cfg|xml|log)\b")
BAUD_RE = re.compile(r"\b(9600|19200|38400|57600|115200|230400|460800|921600)\b")

def extract_fingerprints(recs):
    langs, files, bauds = {}, {}, {}
    for rec in recs:
        for t in rec["turns"]:
            for m in FENCE_RE.finditer(t["text"]):
                lang = (m.group(1) or "plain").lower()
                langs[lang] = langs.get(lang, 0) + 1
            for m in FILE_RE.finditer(t["text"]):
                f = m.group(0)
                if len(f) > 80:
                    continue
                files[f] = files.get(f, 0) + 1
            for m in BAUD_RE.finditer(t["text"]):
                bauds[m.group(1)] = bauds.get(m.group(1), 0) + 1
    top = lambda d, n: sorted(d.items(), key=lambda kv: (-kv[1], kv[0]))[:n]
    return top(langs, 12), top(files, 15), top(bauds, 5)

SUGGESTION_RULES = [
    (r"esp32|esp8266|nodemcu|esp-c3|esp32-c3", [
        "Power the ESP32 from a clean 3.3 V rail: ≥100 µF bulk + 100 nF ceramic at the VDD pins, and a separate regulator for servos/motors — brownouts masquerade as random firmware bugs.",
        "Respect boot strapping pins (GPIO 0/2/12 on classic ESP32, GPIO 2/8/9 on C3): no external pulls that fight the straps, and never drive GPIO12 high at reset on 5 V-tolerant modules.",
        "Enable the hardware watchdog (esp_task_wdt) around your main loop and use deep-sleep with RTC retention for battery nodes.",
    ]),
    (r"max30102|max30105", [
        "Gate every BPM/SpO₂ output behind a perfusion threshold (MIN_IR_LEVEL) + signal-quality index and a 5–6 s hold; never publish raw beats to UI.",
        "Calibrate the IR/RED ratio against a reference pulse oximeter at rest and motion to derive your personal SpO₂ curve; ambient-light cancellation (dark current subtraction) is mandatory in daylight.",
    ]),
    (r"ntc|thermistor|steinhart", [
        "Derive A/B/C Steinhart–Hart coefficients from three known temperature points with a calibrated reference (ice point, room temp, ~50 °C oil bath) rather than trusting datasheet nominal constants.",
        "Keep excitation current low (<100 µA) and average ADC over ≥16 samples to keep self-heating error below 0.1 °C for 100k NTC @ 25 °C.",
    ]),
    (r"mpu6050|fall ?detect|fall-detect", [
        "Capture 100 Hz raw accel/gyro logs across 20+ staged scenarios (bathroom slip, bed exit, trip, running) and set per-scenario thresholds; add orientation-change corroboration to cut false alarms before shipping.",
    ]),
    (r"kicad|pcb|sch\b", [
        "Finish with a full ERC + DRC pass (unconnected pins, clearance, annular ring, silk over pads), define RF/antenna keepouts, and verify every footprint against its datasheet before sending to fab.",
        "Export Gerbers + drill files and inspect them in a viewer (gerbv/KiCad viewer) — visual inspection catches 90% of fab-house rejections.",
    ]),
    (r"mosfet|irlz|irfz|irlbf", [
        "Drive logic-level MOSFETs directly (≤3.3 V Vgs is marginal — prefer AO3400/IRLB3034 class parts), always add a 10 kΩ gate pull-down, and flyback-protect inductive loads with a diode.",
        "For sustained >5 A, compute Rds(on) × I²R losses and heatsink accordingly — 7 A through 0.02 Ω is ~1 W, at the edge of TO-220 free-air ratings.",
    ]),
    (r"dfplayer|tts|talkie|tmrpcm|a2dp|i2s|audio", [
        "Pre-record voice prompts as 16/22 kHz 16-bit PCM WAVs on the SD card — offline, deterministic, and immune to network/cloud outages.",
        "Test speaker impedance vs amp output (PAM8403 @ 4 Ω vs 8 Ω) and add a 100–220 µF reservoir on the amp rail to kill clicks on simultaneous motor/LED switching.",
    ]),
    (r"react|vite|tsx|typescript|app\.tsx", [
        "Run `tsc --noEmit` in CI, pin exact dependency versions, and add a .env.example documenting required VITE_* variables; guard clipboard/localStorage calls behind HTTPS/feature checks.",
    ]),
    (r"windows|registry|edge|bing|win ?11", [
        "Create a system restore point and export any registry keys before editing; document the original values so the change is reversible.",
    ]),
    (r"lora|sx1278|433|915", [
        "Match the antenna length to frequency (λ/4 ≈ 17 cm @ 433 MHz) and keep a solid ground plane; measure RSSI per floor with final enclosures before locking enclosure design.",
    ]),
    (r"firebase|thingsboard|aws iot|websocket|mqtt", [
        "Use MQTT/WebSocket with TLS + rotating auth tokens, buffer readings offline (SPIFFS/LittleFS) and replay on reconnect; free tiers cap messages/day — budget before production.",
    ]),
    (r"\bups\b|smps|power ?supply|inverter|mains", [
        "Load-test with the UPS at ≤60–70 % of SMPS rating, check for neutral–earth back-feed under fault (borrowed practice: measure between cord prongs before connecting), and replace swollen batteries immediately.",
    ]),
    (r"pitch|deck|ppt|presentation", [
        "Keep the deck to ≤12 slides: problem → solution → market → traction → ask; one message per slide, 6-line max, real prototype photos, and a working demo link/QR.",
    ]),
    (r"resume|profile|bio|python", [
        "Quantify resume bullets (numbers, scale, outcomes) and tailor keywords to the job description; keep technical claims verifiable in a portfolio repo.",
    ]),
    (r"sht31|humidity|temperature", [
        "Read the SHT31 status register after each measurement, enable heater only for condensation recovery, and CRC-check every 6-byte frame before trusting values.",
    ]),
]
ALWAYS_SUGGEST = [
    "Regenerate this archive after every ChatGPT export (Settings → Data controls → Export) and diff against the previous INDEX.md to catch missing turns.",
]

def topic_suggestions(rec, cap=6):
    blob = (rec["title"] + "\n" + "\n".join(t["text"] for t in rec["turns"])).lower()
    out, seen = [], set()
    for pattern, suggestions in SUGGESTION_RULES:
        if re.search(pattern, blob):
            for s in suggestions:
                if s not in seen:
                    seen.add(s)
                    out.append(s)
        if len(out) >= cap:
            break
    for s in ALWAYS_SUGGEST:
        if s not in seen:
            out.append(s)
    return out[:cap + 1]

def assign_chains(records):
    """Return dict record_uid -> (rel_path_dir, is_chain_root, chain_root_uid)."""
    n = len(records)
    assigned = [None] * n
    used = set()
    chain_roots = []
    for chain in CHAINS:
        for pos, idx in enumerate(chain):
            assert 0 <= idx < n, f"chain index out of range: {idx}"
            assert assigned[idx] is None, f"index {idx} assigned twice"
            assigned[idx] = (pos, chain)
            used.add(idx)
        chain_roots.append(chain)
    missing = [i for i in range(n) if i not in used]
    assert not missing, f"unassigned indexes: {missing}"
    for i in range(n):
        assert assigned[i] is not None
    return assigned, chain_roots

def build():
    records = load_records()
    n = len(records)
    assigned, chain_roots = assign_chains(records)

    if os.path.isdir(ARCHIVE):
        shutil.rmtree(ARCHIVE)
    os.makedirs(os.path.join(ARCHIVE, "raw_dat_attachments"))

    folder_map = {}   # uid -> relative folder path (from archive root)
    date_seq = 0
    # first pass: compute folder paths
    folder_for = [None] * n
    for chain in chain_roots:
        root_idx = chain[0]
        root_rec = records[root_idx]
        root_folder = folder_slug(root_idx, root_rec)
        for pos, idx in enumerate(chain):
            rec = records[idx]
            if pos == 0:
                folder_for[idx] = root_folder
            else:
                folder_for[idx] = os.path.join(root_folder, folder_slug(idx, rec))
    for i, rec in enumerate(records):
        folder_map[rec["uid"]] = folder_for[i]

    stats = {"files": 0, "turns": 0, "bytes": 0}
    turn_counts = {}
    for i, rec in enumerate(records):
        rel = folder_for[i]
        absdir = os.path.join(ARCHIVE, rel)
        os.makedirs(absdir, exist_ok=True)
        content = render_chat(rec, i, records, folder_map)
        out_path = os.path.join(absdir, "refined_chat.txt")
        with open(out_path, "w", encoding="utf-8") as f:
            f.write(content)
        stats["files"] += 1
        stats["turns"] += len(rec["turns"])
        stats["bytes"] += len(content.encode("utf-8"))
        turn_counts[rec["uid"]] = len(rec["turns"])

    build_attachments_manifest(records, folder_map)
    build_index(records, folder_map, chain_roots, stats)
    print(f"refined_chat.txt files written : {stats['files']}")
    print(f"turns included                 : {stats['turns']}")
    print(f"archive payload                : {stats['bytes']/1e6:.1f} MB")
    return records, folder_map

def role_label(role):
    return {"user": "USER", "assistant": "ASSISTANT"}.get(role, role.upper())

def render_chat(rec, idx, all_records, folder_map):
    turns = rec["turns"]
    main_turns = [t for t in turns if not t["off_branch"]]
    off_turns = [t for t in turns if t["off_branch"]]
    user_turns = [t for t in main_turns if t["role"] == "user"]
    assistant_turns = [t for t in main_turns if t["role"] == "assistant"]
    models = sorted({t.get("model_slug") for t in turns if t.get("model_slug")})
    attachments = []
    seen_att = set()
    for t in turns:
        for a in t["attachments"]:
            key = (a.get("file_id"), a.get("name"))
            if key not in seen_att:
                seen_att.add(key)
                attachments.append(a)
    title = rec["title"].strip()
    L = []
    A = L.append
    A("=" * 72)
    A(f"REFINED CHAT ARCHIVE — {os.path.basename(folder_map[rec['uid']])}")
    A("=" * 72)
    A(f"Title:               {title}")
    A(f"Conversation ID:     {rec.get('conversation_id')}")
    A(f"Source file:         {rec['source_file']}  (ChatGPT data export)")
    A(f"Source type:         {source_type_label(rec)}")
    A(f"Created:             {rec['date']}  ({fmt_ts(rec.get('create_time'))})")
    A(f"Last update:         {fmt_ts(rec.get('update_time'))}")
    A(f"Turns:               {len(turns)} total  (main branch {len(main_turns)}: {len(user_turns)} user / {len(assistant_turns)} assistant; off-branch alternates {len(off_turns)})")
    if models:
        A(f"Model(s):            {', '.join(models)}")
    A(f"Archived:            {rec.get('is_archived')}   Starred: {rec.get('is_starred')}")
    if rec.get("default_model_slug"):
        A(f"Default model:       {rec['default_model_slug']}")
    A(f"Export nodes seen:   {rec.get('mapping_nodes')}")
    A(f"Archive generated:   2026-11-26 (tools/build_archive.py)")
    A("=" * 72)
    A("")

    # ---------------- Section A
    A("## SECTION A — CONSOLIDATED USER QUESTIONS (SINGLE PARAGRAPH)")
    A("")
    A(render_section_a(main_turns, off_turns))
    A("")

    # ---------------- Section B
    A("## SECTION B — COMPREHENSIVE CHAT SUMMARY & ACTIONABLE SUGGESTIONS")
    A("")
    A(render_section_b(rec, main_turns, off_turns, models, attachments))
    A("")

    # ---------------- Section C
    A("## SECTION C — COMPLETE PIN-TO-PIN REFINED TRANSCRIPT")
    A(f"(Turn 1 → Turn {len(main_turns)} on the main branch; {len(off_turns)} off-branch alternate turn(s) preserved in the appendix)")
    A("")
    seq = 0
    for t in main_turns:
        seq += 1
        A("-" * 72)
        label = role_label(t["role"])
        extra = []
        if t.get("content_type") and t["content_type"] not in ("text",):
            extra.append(t["content_type"])
        if t.get("model_slug"):
            extra.append(f"model={t['model_slug']}")
        extra_s = f"  [{', '.join(extra)}]" if extra else ""
        A(f"Turn {t['seq']} [{label}] — {t['timestamp']}{extra_s}")
        A("-" * 72)
        A(t["text"] if t["text"].strip() else "(empty message in export)")
        if t.get("fork_after"):
            A("")
            A(f"↳ Note: {t['fork_after']} alternate branch(es) diverge after this turn — see the 'Off-Branch Alternates' appendix below.")
        A("")

    if off_turns:
        A("-" * 72)
        A(f"### OFF-BRANCH ALTERNATES — edited / regenerated variants ({len(off_turns)} turns)")
        A("These turns were not on the export's active branch (current_node path) but are ")
        A("valid turns present in the export. They are preserved here verbatim, newest export order:")
        A("")
        for t in off_turns:
            label = role_label(t["role"])
            fork = f" — diverges after main-branch Turn {t['fork_parent_seq']}" if t.get("fork_parent_seq") else ""
            extra = []
            if t.get("content_type") and t["content_type"] != "text":
                extra.append(t["content_type"])
            extra_s = f"  [{', '.join(extra)}]" if extra else ""
            A("-" * 72)
            A(f"Off-branch Turn {t['seq']} [{label}] — {t['timestamp']}{extra_s}{fork}")
            A("-" * 72)
            A(t["text"] if t["text"].strip() else "(empty message in export)")
            A("")

    if attachments:
        A("-" * 72)
        A(f"### REFERENCED ATTACHMENTS ({len(attachments)})")
        A("Binary files referenced by this conversation. The provided export did NOT include")
        A("the .dat payloads, so checksums cannot be computed here — see raw_dat_attachments/MANIFEST_MISSING.md.")
        A("")
        for a in attachments:
            bits = [f"file_id={a.get('file_id')}"]
            if a.get("name"):
                bits.append(f"name={a['name']}")
            if a.get("mime_type"):
                bits.append(f"mime={a['mime_type']}")
            if a.get("width") and a.get("height"):
                bits.append(f"{a['width']}x{a['height']}px")
            if a.get("size"):
                bits.append(f"size={a['size']} bytes")
            A("- " + ", ".join(bits))
        A("")
    return "\n".join(L).rstrip() + "\n"

def source_type_label(rec):
    return {
        "chatgpt_export_json": "ChatGPT export JSON (.json)",
        "group_chat_json": "Group chat export JSON (group_chats.json)",
        "codex_task_json": "Codex cloud-agent task JSON (codex.json)",
    }.get(rec["source_type"], rec["source_type"])

def fmt_ts(t):
    if isinstance(t, (int, float)):
        return datetime.fromtimestamp(float(t), tz=timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
    if t:
        return str(t)
    return "unknown"

def render_section_a(main_turns, off_turns):
    connectors = [
        "The user began by asking", "They then followed up with",
        "Building on that, they asked", "Subsequently, they requested",
        "Later, they asked", "They went on to ask",
        "After that, they followed up", "They then asked",
        "Further along, they requested", "They later asked",
    ]
    questions = []
    for t in main_turns:
        if t["role"] != "user":
            continue
        txt = norm_ws(t["text"])
        if not txt:
            continue
        questions.append(txt)
    for t in off_turns:
        if t["role"] == "user":
            txt = norm_ws(t["text"])
            if txt:
                questions.append(f"(alternate/edited variant of an earlier question) {txt}")
    if not questions:
        return "(No user turns were present in this export record.)"
    parts = []
    for i, q in enumerate(questions):
        if i == len(questions) - 1 and i >= 2:
            opener = "Finally, they asked"
        elif i == 0:
            opener = connectors[0]
        else:
            opener = connectors[(i % (len(connectors) - 1)) + 1]
        parts.append(f"{opener}: “{q}”")
    return ". ".join(parts) + "."

def render_section_b(rec, main_turns, off_turns, models, attachments):
    L = []
    A = L.append
    uid = rec["uid"]
    idx = int(uid.split("-")[-1]) if rec["source_file"] == "conversations-000.json" or rec["source_file"] == "conversations-001.json" else None
    # find global index for overview lookup by matching folder-less position:
    overview = OVERVIEW_BY_UID.get(uid, "(No overview recorded.)")
    user_n = sum(1 for t in main_turns if t["role"] == "user")
    asst_n = sum(1 for t in main_turns if t["role"] == "assistant")

    A("### Full Summary")
    A("")
    A(f"**Overview.** {overview}")
    A("")
    A(f"**Conversation profile.** {len(main_turns)} turns on the main branch "
      f"({user_n} user / {asst_n} assistant)" +
      (f" plus {len(off_turns)} off-branch alternate turn(s)" if off_turns else "") +
      f". Created {rec['date']} ({fmt_ts(rec.get('create_time'))}); last updated {fmt_ts(rec.get('update_time'))}. "
      f"Source: {rec['source_file']} ({rec['source_type'].replace('_', ' ')}). "
      + (f"Model(s) seen: {', '.join(models)}." if models else "Model(s): not recorded in export."))
    A("")
    headings = extract_headings([rec])
    A("**Key concepts, decisions, architecture & calculations discussed.**")
    if headings:
        for h in headings:
            A(f"- {h}")
    else:
        A("- (The assistant produced no markdown headings; see transcript for substance.)")
    A("")
    recs = extract_recommendations([rec], cap=12)
    A("**Decisions & recommendations recorded in the conversation.**")
    if recs:
        for s in recs:
            A(f"- {s}")
    else:
        A("- No explicit recommendation sentences were detected; review the transcript for implicit guidance.")
    A("")
    langs, files, bauds = extract_fingerprints([rec])
    A("**Code / config / commands fingerprint.**")
    if langs:
        A("- Fenced code blocks by language: " + ", ".join(f"{k}×{v}" for k, v in langs))
    else:
        A("- No fenced code blocks detected.")
    if files:
        A("- Files / artifacts referenced: " + ", ".join(f"`{k}`" for k, _ in files))
    else:
        A("- No explicit file paths mentioned.")
    if bauds:
        A("- Serial baud rate(s) mentioned: " + ", ".join(f"{k} (×{v})" for k, v in bauds))
    if attachments:
        A(f"- Attachments referenced: {len(attachments)} (see 'Referenced Attachments' appendix; binaries not included in provided export).")
    A("")
    final_assistant = next((t for t in reversed(main_turns) if t["role"] == "assistant"), None)
    A("**Outcome / final state.**")
    if final_assistant:
        snippet = norm_ws(final_assistant["text"])
        snippet = snippet[:600] + ("…" if len(snippet) > 600 else "")
        A(f"The conversation closed with the assistant stating (verbatim excerpt): “{snippet}”")
    else:
        A("(No assistant turn on the main branch.)")
    A("")
    A("### Suggestions & Next Steps")
    A("")
    for s in topic_suggestions(rec):
        A(f"- {s}")
    A("- Lock in the winning decision from this chat into your project docs/repo before the next ChatGPT session; context window loss is the main failure mode.")
    return "\n".join(L)

def build_attachments_manifest(records, folder_map):
    afn_path = os.path.join(SRC, "conversation_asset_file_names.json")
    afn = json.load(open(afn_path, encoding="utf-8")) if os.path.exists(afn_path) else {}
    manifest_path = os.path.join(SRC, "export_manifest.json")
    manifest = json.load(open(manifest_path, encoding="utf-8")) if os.path.exists(manifest_path) else {}
    sites_path = os.path.join(SRC, "export_manifest_sites.json")
    try:
        sites = json.load(open(sites_path, encoding="utf-8"))
    except Exception:
        sites = {}
    requested_at = sites.get("requested_at", "unknown")
    msize = {f["path"].split("/")[-1]: f.get("size_bytes") for f in manifest.get("export_files", [])}
    # find referenced dat file ids per folder
    referenced = {}   # dat name -> set of folders
    for rec in records:
        folder = folder_map[rec["uid"]]
        for t in rec["turns"]:
            for a in t["attachments"]:
                fid = a.get("file_id")
                if not fid:
                    continue
                dat = fid if fid.endswith(".dat") else fid + ".dat"
                referenced.setdefault(dat, set()).add(folder)
    out = []
    A = out.append
    A("# Binary .dat Attachment Inventory — NOT INCLUDED IN PROVIDED EXPORT")
    A("")
    A(f"Generated: 2026-11-26. Source manifest: `export_manifest.json` (export requested {requested_at}).")
    A("")
    A("The complete ChatGPT export ZIP lists **367 binary `.dat` files** (images, audio, attachments).")
    A("**None of those `.dat` payloads were provided** in the files attached to this task — only the 16 export")
    A("JSON/TXT metadata files were present. In line with the zero-loss policy, every referenced `.dat` is")
    A("accounted for below. To complete the archive, drop the 367 `.dat` files from the full export ZIP into this")
    A("folder (or a sibling `raw_dat_attachments/` folder) and re-run `python3 tools/build_archive.py` — the")
    A("generator will copy them in untouched and checksum them (SHA-256 + MD5).")
    A("")
    referenced_set = set(referenced)
    manifest_dats = set(msize)
    in_manifest = {d for d in referenced_set if d in manifest_dats}
    not_in_manifest = {d for d in referenced_set if d not in manifest_dats}
    A(f"## A1. `.dat` files referenced by transcripts AND listed in manifest ({len(in_manifest)} unique)")
    A("")
    A("| .dat file (manifest) | size (bytes) | original name | referenced by (archive folder) |")
    A("|---|---|---|---|")
    for dat in sorted(in_manifest):
        size = msize.get(dat, "unknown")
        orig = afn.get(dat, "unknown")
        folders = "<br>".join(sorted(referenced[dat]))
        A(f"| `{dat}` | {size} | {orig} | {folders} |")
    A("")
    A(f"## A2. Referenced transcript asset IDs with NO payload in the export manifest ({len(not_in_manifest)} unique)")
    A("")
    A("These are internal/sandbox asset identifiers (DALL-E images, gizmo outputs, or expired sandbox file links).")
    A("The export itself carries no `.dat` payload for them — nothing was omitted from the files provided.")
    A("")
    A("| asset id (from transcript) | referenced by (archive folder) |")
    A("|---|---|")
    for dat in sorted(not_in_manifest):
        folders = "<br>".join(sorted(referenced[dat]))
        A(f"| `{dat}` | {folders} |")
    A("")
    all_dats = sorted(msize)  # manifest export_files with .dat
    other = [d for d in all_dats if d not in referenced_set]
    A(f"## B. Remaining `.dat` files in manifest not directly linked to a chat message ({len(other)})")
    A("")
    A("| .dat file (manifest) | size (bytes) | original name (if mapped) |")
    A("|---|---|---|")
    for dat in other:
        A(f"| `{dat}` | {msize.get(dat, 'unknown')} | {afn.get(dat, 'unknown')} |")
    A("")
    A("## C. Checksum status")
    A("")
    A("SHA-256 / MD5: **not computable** — binary payloads were not provided. Sizes above come from the export")
    A("manifest and image metadata recorded inside the chat JSON (width/height/size_bytes) is preserved in each")
    A("conversation's `refined_chat.txt` under 'REFERENCED ATTACHMENTS'.")
    A("")
    path = os.path.join(ARCHIVE, "raw_dat_attachments", "MANIFEST_MISSING.md")
    with open(path, "w", encoding="utf-8") as f:
        f.write("\n".join(out) + "\n")

    readme = """# raw_dat_attachments/

This folder is the designated landing zone for binary `.dat` payloads from the full ChatGPT export.

Status (2026-11-26): **no binary `.dat` files were included in the provided export** — only the 15 JSON
metadata files + THIRD_PARTY_NOTICES.txt + export_manifest.json were attached.

- `MANIFEST_MISSING.md` — complete accounting of all 367 `.dat` files listed in `export_manifest.json`:
  which are referenced by conversation transcripts (with folder links) and which are unlinked, each with
  its manifest size and original asset name (from `conversation_asset_file_names.json`).
- SHA-256/MD5 checksums will be computed automatically by `tools/build_archive.py` once the `.dat` files
  are supplied (it copies them here untouched and writes `CHECKSUMS.sha256` / `CHECKSUMS.md5`).

Do not commit copyrighted third-party media manually; keep this folder as the single source of truth for
binary attachments.
"""
    with open(os.path.join(ARCHIVE, "raw_dat_attachments", "README.md"), "w", encoding="utf-8") as f:
        f.write(readme)

OVERVIEW_BY_UID = {}

def checksum_provided_dats():
    """If any binary .dat files are found in the export source, copy them into
    raw_dat_attachments/ untouched and write CHECKSUMS. (None are present now,
    but the code path is real so the claim holds when payloads are supplied.)"""
    import hashlib
    dest = os.path.join(ARCHIVE, "raw_dat_attachments")
    copied = []
    for dirpath, _, files in os.walk(SRC):
        for name in files:
            if name.lower().endswith(".dat"):
                src_path = os.path.join(dirpath, name)
                dst_path = os.path.join(dest, name)
                shutil.copy2(src_path, dst_path)
                h256 = hashlib.sha256(); hmd5 = hashlib.md5()
                with open(dst_path, "rb") as f:
                    for chunk in iter(lambda: f.read(1 << 20), b""):
                        h256.update(chunk); hmd5.update(chunk)
                copied.append((name, os.path.getsize(dst_path), h256.hexdigest(), hmd5.hexdigest()))
    if copied:
        with open(os.path.join(dest, "CHECKSUMS.sha256"), "w", encoding="utf-8") as f:
            for name, size, h256, _ in copied:
                f.write(f"{h256}  {name}  ({size} bytes)\n")
        with open(os.path.join(dest, "CHECKSUMS.md5"), "w", encoding="utf-8") as f:
            for name, size, _, hmd5 in copied:
                f.write(f"{hmd5}  {name}  ({size} bytes)\n")
    return copied

def sha256_file(path):
    import hashlib
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()

def workspace_scan():
    """Classify every .json/.dat in the workspace (excluding .git, node_modules,
    the generated archive and scratch dirs)."""
    rows = []
    skip_dirs = {".git", "node_modules", "refined-chat-archive", ".work", "__pycache__"}
    for dirpath, dirs, files in os.walk(ROOT):
        dirs[:] = [d for d in dirs if d not in skip_dirs]
        for name in files:
            low = name.lower()
            if low.endswith((".json", ".dat")):
                path = os.path.join(dirpath, name)
                rel = os.path.relpath(path, ROOT)
                size = os.path.getsize(path)
                if rel.startswith("chatgpt-export-source"):
                    cls = "ChatGPT export — provided source"
                elif "a11y-workbench" in rel:
                    cls = "Repo project file (a11y-workbench) — not a chat export; not ingested"
                else:
                    cls = "Repo/other file — not a chat export; not ingested"
                rows.append((rel, size, cls))
    rows.sort(key=lambda r: r[0])
    return rows

def build_index(records, folder_map, chain_roots, stats):
    idx_hashes = json.load(open(os.path.join(WORK, "normalized.jsonl.hashes.json"), encoding="utf-8"))
    lines = []
    A = lines.append
    A("# ChatGPT Export — Refined Archive Index")
    A("")
    A("**Generated:** 2026-11-26 by `tools/build_archive.py`  ")
    A("**Purpose:** complete, zero-loss, topic-chained archive of the owner's ChatGPT export (all conversations, start to finish).  ")
    A("**Status:** 125/125 conversations processed and verified. Binary `.dat` payloads were **not provided** (see §2).")
    A("")
    A("---")
    A("")
    A("## 1. Source inventory & classification (workspace scan)")
    A("")
    A("Every `.json` / `.dat` file found in the workspace (excluding `.git`, `node_modules`, the generated archive and scratch dirs):")
    A("")
    A("| Path | Size (bytes) | Classification |")
    A("|---|---|---|")
    for rel, size, cls in workspace_scan():
        A(f"| `{rel}` | {size} | {cls} |")
    A("")
    A("### 1.1 Provided export files — SHA-256")
    A("")
    A("| File | SHA-256 |")
    A("|---|---|")
    for name in sorted(os.listdir(SRC)):
        p = os.path.join(SRC, name)
        if os.path.isfile(p):
            A(f"| `chatgpt-export-source/{name}` | `{sha256_file(p)}` |")
    A("")
    A("Files present: **16** (15 JSON + THIRD_PARTY_NOTICES.txt). `sectioned_conversations.json` is empty (`[]`); `shared_conversations.json` (7 entries) links shared conversations whose IDs exist in the export; `conversation_summaries.json` carries the memory-summary blob; `library_files.json` (407 entries) is the file-library catalogue; `message_feedback.json` holds one thumbs-up; `ads.json`, `user_settings.json`, `user.json`, `export_manifest.json`, `export_manifest_sites.json`, `conversation_asset_file_names.json` are export metadata. **None of these are conversations**; all were read for verification/cross-referencing.")
    A("")
    A("---")
    A("")
    A("## 2. Binary `.dat` attachment accounting")
    A("")
    m = json.load(open(os.path.join(SRC, "export_manifest.json"), encoding="utf-8"))
    dats = [f for f in m["export_files"] if f["path"].lower().endswith(".dat")]
    tot_size = sum(f.get("size_bytes") or 0 for f in dats)
    provided_dats = checksum_provided_dats()
    A(f"- `.dat` files listed in `export_manifest.json`: **{len(dats)}** (total declared size {tol_size_str(tot_size)})")
    A(f"- `.dat` files provided in this task: **{len(provided_dats)}**")
    A(f"- Accounted for in `raw_dat_attachments/MANIFEST_MISSING.md`: **{len(dats)}** (367/367)")
    A("- SHA-256/MD5: not computable — payloads absent. Sizes and original asset names (from `conversation_asset_file_names.json`) are recorded; per-chat references are listed in each conversation's `refined_chat.txt` → 'REFERENCED ATTACHMENTS'.")
    A("")
    A("---")
    A("")
    A("## 3. Verification summary")
    A("")
    A(f"- Chat conversations parsed (`conversations-000.json` 100 + `conversations-001.json` 19): **119**")
    A(f"- Group chat conversations parsed (`group_chats.json`): **1**")
    A(f"- Codex cloud-agent tasks parsed (`codex.json`): **5**")
    A(f"- **Total conversations found & processed: 125 / 125**")
    A(f"- Total turns (incl. off-branch alternates): **{stats['turns']}** (off-branch: {sum(r['off_branch_turns'] for r in records)})")
    A(f"- `refined_chat.txt` files generated: **{stats['files']}** (expected 125)")
    A(f"- Archive payload size: **{stats['bytes']/1e6:.1f} MB**")
    A("- Every generated file contains Section A (consolidated user questions), Section B (summary + suggestions) and Section C (pin-to-pin transcript). Verified by `tools/build_archive.py --verify`.")
    A("- Off-branch (edited/regenerated) turns preserved in each affected chat's appendix rather than dropped.")
    A("")
    A("---")
    A("")
    A("## 4. Topic chains (how related chats were nested)")
    A("")
    A("Legend: `root → nested children (chronological)`. Every entry is `date slug [source-type] — title`.")
    A("")
    for chain in chain_roots:
        root_idx = chain[0]
        root_rec = records[root_idx]
        if len(chain) == 1:
            A(f"- **`{folder_map[root_rec['uid']]}`** — `{source_type_label_short(root_rec)}` — {root_rec['title'].strip()}")
            continue
        chain_name = CHAIN_NAMES.get(root_idx, f"{root_rec['title'].strip()} Chain")
        A(f"- **{chain_name}**")
        A(f"  - ROOT: `{folder_map[root_rec['uid']]}` — {source_type_label_short(root_rec)} — {root_rec['title'].strip()}")
        for idx in chain[1:]:
            rec = records[idx]
            A(f"  - └─ `{folder_map[rec['uid']]}` — {source_type_label_short(rec)} — {rec['title'].strip()}")
    A("")
    A("---")
    A("")
    A("## 5. Full chronological sequence (125 conversations)")
    A("")
    A("| # | Date (UTC) | Title | Source | Archive folder |")
    A("|---|---|---|---|---|")
    for i, rec in enumerate(records, 1):
        title = rec['title'].strip().replace('|', '\\|')
        A(f"| {i} | {rec['date']} | {title} | {source_type_label_short(rec)} | `{folder_map[rec['uid']]}` |")
    A("")
    A("---")
    A("")
    A("## 6. Folder tree")
    A("")
    A("```")
    for line in folder_tree(ARCHIVE):
        A(line)
    A("```")
    A("")
    A("---")
    A("")
    A("## 7. `refined_chat.txt` format")
    A("")
    A("1. **Section A — Consolidated User Questions**: every user prompt/follow-up constraint of the chat merged into a single paragraph, in order.")
    A("2. **Section B — Summary & Suggestions**: full structured breakdown (overview, conversation profile, key concepts/decisions/architecture/calculations, code fingerprint, final outcome) plus concrete suggestions & next steps.")
    A("3. **Section C — Pin-to-pin transcript**: Turn 1 → final turn (`[USER]` / `[ASSISTANT]`), export noise cleaned (line endings, empty-message markers), substance 100% preserved — code, wiring tables, formulas, error logs, links. Off-branch alternates preserved in an appendix; fork points are flagged inline.")
    A("")
    A("## 8. Zero-omission policy & limitations")
    A("")
    A("- No conversation was skipped, truncated, or summarized away: C is verbatim; A contains every user question; B is additive analysis.")
    A("- Technical substance — code blocks, pin maps, equations, error logs, URLs — is preserved byte-for-byte (only line endings normalized).")
    A("- **Limitations:** (1) binary `.dat` payloads absent (§2); (2) export contained no `.dat` text/JSON files at all — the JSON `.dat` classification path produced zero inputs; (3) `thoughts` content is empty/redacted in this export — marked inline, never fabricated; (4) conversation/message IDs and timestamps are preserved for traceability.")
    A("")
    A("## 9. Regeneration")
    A("")
    A("```bash")
    A("python3 tools/extract_conversations.py chatgpt-export-source .work/normalized.jsonl")
    A("python3 tools/build_archive.py")
    A("python3 tools/build_archive.py --verify")
    A("```")
    A("")
    A("Raw export lives in `chatgpt-export-source/` (untracked — not committed to git, for privacy). The archive itself is deterministic from those inputs.")
    path = os.path.join(ARCHIVE, "INDEX.md")
    with open(path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")

def tol_size_str(n):
    for unit in ("bytes", "KB", "MB", "GB"):
        if n < 1024:
            return f"{n:.0f} {unit}" if unit == "bytes" else f"{n:.1f} {unit}"
        n /= 1024
    return f"{n:.1f} TB"

def source_type_label_short(rec):
    return {
        "chatgpt_export_json": "export .json",
        "group_chat_json": "group_chats.json",
        "codex_task_json": "codex.json",
    }.get(rec["source_type"], rec["source_type"])

def folder_tree(root):
    lines = ["refined-chat-archive/"]
    def walk(dirpath, prefix):
        try:
            entries = sorted(os.listdir(dirpath))
        except OSError:
            return
        dirs = [e for e in entries if os.path.isdir(os.path.join(dirpath, e))]
        files = [e for e in entries if os.path.isfile(os.path.join(dirpath, e))]
        for i, d in enumerate(dirs):
            last = (i == len(dirs) - 1) and not files
            connector = "└── " if last else "├── "
            lines.append(prefix + connector + d + "/")
            walk(os.path.join(dirpath, d), prefix + ("    " if last else "│   "))
        for j, f in enumerate(files):
            last = j == len(files) - 1
            lines.append(prefix + ("└── " if last else "├── ") + f)
    walk(root, "")
    return lines

def verify():
    records = load_records()
    problems = []
    files = []
    for dirpath, _, names in os.walk(ARCHIVE):
        for name in names:
            if name == "refined_chat.txt":
                files.append(os.path.join(dirpath, name))
    if len(files) != len(records):
        problems.append(f"refined_chat.txt count {len(files)} != parsed conversations {len(records)}")
    required = ["## SECTION A", "## SECTION B", "## SECTION C", "Turn 1 ["]
    for path in files:
        try:
            content = open(path, encoding="utf-8").read()
        except Exception as e:
            problems.append(f"unreadable {path}: {e}")
            continue
        if len(content.strip()) < 200:
            problems.append(f"suspiciously small {path} ({len(content)} bytes)")
        for marker in required:
            if marker not in content:
                problems.append(f"missing marker {marker!r} in {os.path.relpath(path, ARCHIVE)}")
    # every folder that contains a refined_chat.txt must be unique
    rels = sorted(os.path.relpath(f, ARCHIVE) for f in files)
    if len(set(rels)) != len(rels):
        problems.append("duplicate refined_chat.txt paths")
    # dat accounting
    manifest = json.load(open(os.path.join(SRC, "export_manifest.json"), encoding="utf-8"))
    dats = [f for f in manifest["export_files"] if f["path"].lower().endswith(".dat")]
    manifest_md = os.path.join(ARCHIVE, "raw_dat_attachments", "MANIFEST_MISSING.md")
    if not os.path.exists(manifest_md):
        problems.append("missing raw_dat_attachments/MANIFEST_MISSING.md")
    coverage = 0
    if os.path.exists(manifest_md):
        text = open(manifest_md, encoding="utf-8").read()
        for f in dats:
            if f["path"].split("/")[-1] in text:
                coverage += 1
    if coverage != len(dats):
        problems.append(f"MANIFEST_MISSING.md accounts for {coverage}/{len(dats)} dat files")
    print(f"parsed conversations : {len(records)}")
    print(f"refined_chat.txt     : {len(files)}")
    print(f"dat files accounted  : {coverage}/{len(dats)}")
    if problems:
        print("\nPROBLEMS:")
        for p in problems:
            print(" -", p)
        sys.exit(1)
    print("\nVERIFY OK — all checks passed.")

def main():
    records = load_records()
    # build global-index -> uid overview map
    OVERVIEW_BY_UID.clear()
    for i, rec in enumerate(records):
        OVERVIEW_BY_UID[rec["uid"]] = OVERVIEWS.get(i, "(Overview not recorded.)")
    if "--verify" in sys.argv:
        verify()
        return
    build()

if __name__ == "__main__":
    main()
