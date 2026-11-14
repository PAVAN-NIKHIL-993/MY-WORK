# Bill of materials

Single-unit prices, rounded. These are order-of-magnitude figures for a one-off build from a
distributor (LCSC, Digi-Key, Mouser) in 2025, **not a quote**. Every total below is the sum of the
line items; none was estimated independently.

| Ref | Part | Value / spec | Package | Qty | Unit | Ext | Purpose |
|---|---|---|---|---|---|---|---|
| U1 | ESP32-WROOM-32 dev board | 38-pin, CP2102 USB-UART, 4 MB flash | Module | 1 | 4.50 | 4.50 | The instrument |
| R1 | Resistor | 1 kΩ ±1% 0603 | Yageo RC0603 | 1 | 0.01 | 0.01 | Series input protection |
| R2 | Resistor | 10 kΩ ±1% 0603 | Yageo RC0603 | 1 | 0.01 | 0.01 | Pull-down, defines floating input |
| R3 | Resistor | 2.2 kΩ ±1% 0603 | Yageo RC0603 | 1 | 0.01 | 0.01 | Divider top (5 V tolerance) |
| R4 | Resistor | 3.3 kΩ ±1% 0603 | Yageo RC0603 | 1 | 0.01 | 0.01 | Divider bottom |
| D1 | Schottky dual | BAT54S, 30 V 200 mA | Nexperia | 1 | 0.06 | 0.06 | Clamp to GND and 3V3 |
| C1 | Capacitor | 100 nF X7R 0603 | Murata | 1 | 0.01 | 0.01 | Input filter / decoupling |
| C2 | Capacitor | 10 µF X5R 0805 | Murata | 1 | 0.02 | 0.02 | Bulk decoupling |
| J1 | Terminal block | 2-pin 5 mm pitch | Any | 1 | 0.15 | 0.15 | Probe and ground |
| J2 | Pin header | 2×19 2.54 mm female | Any | 1 | 0.10 | 0.10 | ESP32 board socket |
| PCB | Printed circuit board | 40 × 50 mm, 2-layer, 1.6 mm | JLCPCB 5-off | 1 | 1.80 | 1.80 | Carrier |

**Carrier only (everything except the ESP32 module): $2.18**  
**Complete unit: $6.68**

## Cost notes

- The ESP32 dev board is **68 %** of the total. Everything this project adds is $2.18.
- The PCB dominates the carrier cost because a 5-piece minimum order is assumed. In a 50-piece
  run the per-board cost falls to roughly $0.35 and the carrier drops to about $0.73.
- Nothing here is a specialised part. Every line item is a commodity available from multiple
  distributors.

## Choosing the ESP32 board

Any ESP32-WROOM-32 board with the standard 38-pin footprint works. Two things to check:

1. **The board must break out GPIO 34, 18, 19 and 21.** Most 38-pin boards do.
2. **GPIO 34 is input-only**, so do not plan on driving it; the firmware only reads it.

Boards based on ESP32-S3, C3 or C6 will **not** work unchanged: the S3 has a different PCNT/RMT
API layout and the C3/C6 lack MCPWM. Stick to the classic ESP32.

## Parts not on the board

These were considered and left out, with the reason:

| Part | Why not |
|---|---|
| TFT display | Explicitly dropped; the web dashboard replaces it |
| Rotary encoder | Not needed; the dashboard has the controls |
| Physical buttons | Not needed for the same reason |
| SD card | There is no sample buffer to store |
| External ADC | Would help, but a fast one (≥2 MS/s) costs more than the whole unit and still needs a front end |
| Op-amp front end | Would improve the ≤10 kHz ADC path; not justified for a digital-signal instrument |

## If you want to extend it

The cheapest meaningful improvement is a **fast external ADC** (for example an AD9280-class part at
32 MS/s) on an SPI or parallel bus. That would give a genuine ~1 MHz analog path. It would cost
roughly 3× the rest of the project and require a real front end with an anti-alias filter, so it is
out of scope here — but it is the honest way to get what the original sketch claimed.
