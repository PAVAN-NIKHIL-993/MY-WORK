# CONFIGURATION

> There are **no environment variables, no config files, no feature flags** in
> this topic — by design (bare-metal firmware + single-file CLIs). Everything
> configurable is compile-time (firmware) or CLI args (tools), listed below.

## 1. Firmware compile-time configuration

| Symbol | Type | Where | Values in repo | Purpose |
|---|---|---|---|---|
| `#pragma config FOSC` etc. | pragma | top of every `.c` | 8-line block (877A) / 5-line (18345) | osc, WDT, BOR, LVP, protections — see [`config_word_guide`](../04-advanced/config_word_guide.md) |
| `_XTAL_FREQ` | `#define` Hz | every `.c` | 20000000 (877A) / 8000000 (18345) | MUST equal real clock; drives `__delay_*` + baud math |
| `OSCFRQ.HFFRQ` | reg bits | 18345 `main()` | `0b100` = 8 MHz | Sets HFINTOSC to match `_XTAL_FREQ` |
| `SPBRG` | reg value | UART `.c` files | `129` @20 MHz/9600/BRGH=1 | Validate with `baud_calc.py` before changing |
| `OPTION_REG` | reg value | timer/WDT `.c` | `0x87` (T0 1:256) / `0x84` (1:32) / `0x8F` (WDT 1:128) | Prescaler routing — see component docs |
| `PR2` / `T2CON` / `CCP1CON` | reg values | PWM `.c` | 249 / `0x07` / `0x0C` | 1.25 kHz PWM, duty 0–1000 |
| `ADCON1/ADCON0` | reg values | ADC `.c` files | `0xCE`/`0x41` | Right-justify, Fosc/64, AN0, ADC on |
| `SSPADD` | reg value | I2C `.c` | `49` = 100 kHz @20 MHz | `SSPADD = Fosc/(4·Fscl) − 1` |
| `SAMPLE_PERIOD_MS` | `#define` | capstone | `500` | CSV stream rate (2 Hz) |

Generate pragma blocks: `python 05-python-tools/config_helper.py --chip 16F877A --osc HS`
([component](components/config-helper.md)) or the MPLAB X Configuration Bits GUI.

## 2. CLI arguments (all tools: `--help` is authoritative)

`serial_logger.py`: `--port` (required unless `--list`) · `--baud` (default
9600, must be > 0) · `--out` (default `pic_log.csv`) · `--seconds` (default 0
= forever, must be ≥ 0) · `--list`. Exits: 0 ok · 1 no pyserial · 2 usage ·
3 serial failure.

`baud_calc.py`: `--fosc` (required, > 0) · `--baud` (default 9600, > 0) ·
`--brgh` (0/1, default 1) · `--all` sweep. Exits: 0/2.

`config_helper.py`: `--chip` (required: 16F877A/16F18345/18F45K22) · `--osc` ·
`--list`. Exits: 0/2.

`analyze_log.py`: `csvfile` positional. Exits: 0 ok · 1 no valid samples ·
2 unreadable file.

## 3. Data-format configuration (fixed by code — change both sides together)

- UART: 9600 8-N-1; line `t_ms,temp_c\r\n` + header line ([uart-protocol](api/uart-protocol.md)).
- CSV: `pc_time_iso,elapsed_s,raw_line` ([schema](database/schema.md)).
- EEPROM demo: counter at data address `0x00`, 1 byte.
