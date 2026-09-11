# Data Flow

> Parent: [ARCHITECTURE](../ARCHITECTURE.md). Every major workflow as
> Input → Validation → Transformation → State → Processing → Output.

## 1. Capstone temperature sample (the main pipeline)

| Stage | Detail |
|---|---|
| Input | LM35 Vout (10 mV/°C) on RA0/AN0; 1 ms `ms_ticks` clock |
| Validation | 500 ms window (`millis()-last >= 500`); ADC 0–1023 by construction |
| Transformation | `tenths = ADC*5000/1024` (32-bit intermediate — 16-bit would overflow); decimal via `uart_putdec16` |
| State | `last += 500` (drift-free); `ms_ticks++` in ISR |
| Processing | Format `t_ms,temp_c\r\n`, toggle heartbeat LED |
| Output | UART 9600 → logger CSV row → analyzer stats/chart |
| Error path | UART TX is fire-and-forget (no ACK at 9600 text); framing errors on PC side surface as skipped lines in `parse_rows` |

## 2. UART echo (03-intermediate)

Input: RX byte → Validation: `OERR`→reset CREN, `FERR`→discard+0 →
Transformation: none (identity) → State: none → Output: TX same byte + RB0
toggle. Error path: overrun self-heals; persistent garbage = baud/clock fault
([TROUBLESHOOTING](../TROUBLESHOOTING.md)).

## 3. I2C scan (04-advanced)

Input: none (timer) → Validation: `ACKSTAT==0` per address → Transformation:
address → `"Found 0x.."` text → State: none → Output: UART report + heartbeat.
Error path: bus stuck LOW needs slave power-cycle (documented in stage README).

## 4. EEPROM counter (04-advanced)

Input: button press → Validation: 20 ms debounce + release-wait →
Transformation: `count++` (uint8 wrap) → State: `eeprom_write(0x00)` (~4 ms,
GIE-guarded unlock) → Output: RD0–RD3 nibble. Survives reset by design.

## 5. Byte formats (normative)

- UART line: ASCII `"<uint16_ms>,<temp w/ 1 decimal>\r\n"`, e.g. `1500,27.3`;
  one header line `t_ms,temp_c` at boot. Full spec: [uart-protocol](../api/uart-protocol.md).
- CSV row: `pc_time_iso,elapsed_s,raw_line` (logger wraps raw line, quoting
  safe). Full spec: [schema](../database/schema.md).
