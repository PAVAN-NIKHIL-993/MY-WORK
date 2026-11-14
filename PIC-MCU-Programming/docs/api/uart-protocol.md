# API: UART Text Protocol (PIC ↔ PC)

- **Transport:** async serial, **9600 baud, 8 data, no parity, 1 stop (8-N-1)**,
  `BRGH=1`, `SPBRG=129` @20 MHz (+0.16% — validated by `baud_calc.py`).
- **Framing:** lines terminated `\r\n`; ASCII only; no checksum/length prefix
  (bench-cable trust — see [D6](../architecture/decisions.md)).
- **Direction:** mostly PIC→PC; the only PC→PIC traffic is `uart_echo` input.

## Message shapes (per producer)

| Producer | Lines | Example | Rate |
|---|---|---|---|
| `uart_echo` | banner once, then echo of each RX byte | `PIC16F877A UART echo ready…` / `a`→`a` | human |
| `i2c_scanner` | banner, `scan...`, zero+ `Found 0x..`, blank | `scan... Found 0x68 Found 0x27` | /2 s |
| `temp_logger` | header `t_ms,temp_c` once, then `ms,temp` | `500,27.3` `1000,27.4` | 2 Hz |
| SPI note prog | banner, `TX=0x.. RX=0x.. OK` | `TX=0x41 RX=0x41 OK` | 2 Hz |

## Grammar (temp stream — the only machine-parsed shape)

```
line      := uint16_ms "," temp "\r\n"
uint16_ms := 0..65535          (wraps ~65 s; analyzer uses differences)
temp      := whole "." frac    (1 decimal, e.g. 27.3; tenths of °C)
header    := "t_ms,temp_c"
```

## Behavior & limits

- **Timeouts/retries:** none — TX is fire-and-forget; a corrupted line degrades
  to a skipped analyzer row (visible in sample counts).
- **Backpressure:** none — PC must drain at line rate (trivially true at 9600).
- **Error responses:** there are none on the wire; PC-side errors are tool
  exit codes ([cli-contracts](cli-contracts.md)).
- **Security:** plaintext, no auth — physical-access assumption ([SECURITY](../SECURITY.md)).

## Examples

Terminal @9600: flash `temp_logger` → see `t_ms,temp_c` then rising `ms,temp`
lines; touch LM35 → values climb. Capture: `serial_logger.py --port … --out
t.csv --seconds 60` → `analyze_log.py t.csv`.

## Traceability

Producers: [uart-echo](../components/uart-echo-16f877a.md) ·
[i2c-scanner](../components/i2c-scanner-16f877a.md) ·
[temp-logger](../components/temp-logger-16f877a.md); consumer:
[serial-logger](../components/serial-logger.md).
