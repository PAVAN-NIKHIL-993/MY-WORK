# Application Flow

> Parent: [ARCHITECTURE](../ARCHITECTURE.md). How control moves through firmware
> and tools at runtime.

## 1. Firmware: the universal shape

```mermaid
flowchart TD
    RST["Reset vector\n(configs applied by HW)"] --> MAIN["main(): TRIS/ANSEL/clock/peripheral init"]
    MAIN --> LOOP{"while(1)"}
    LOOP -->|basics| POLL["poll + __delay_ms"]
    LOOP -->|intermediate+| FLAG["check ISR-set volatile flag /\nmillis() window"]
    POLL --> LOOP
    FLAG --> WORK["debounce / sample / send"]
    WORK --> LOOP
    IRQ["ISR (T0/INT)"] -.->|sets flag/counter| FLAG
```

- `02-basics/`: pure polling (`button_pressed()` blocks on `__delay_ms`).
- `03-intermediate/` + capstone: ISRs stay short (count/flag); `main()` owns
  policy (debounce, 500 ms cadence). EXCEPTION that proves the rule:
  `temp_logger` reads 16-bit `ms_ticks` under a GIE guard ([component](../components/temp-logger-16f877a.md)).
- `watchdog_sleep`: `SLEEP()` → WDT wake → continue after `SLEEP`.

## 2. Tools: the universal shape

```mermaid
flowchart LR
    A["parse args"] --> V["validate (>0, choices, files)"]
    V -->|bad| E2["stderr ERROR, exit 2"]
    V -->|good| W["do work"]
    W -->|device/file lost| E13["stderr ERROR, exit 1/3"]
    W --> D["stdout report / CSV rows"]
    D --> Z["exit 0"]
    W -->|Ctrl+C| Z
```

## 3. End-to-end capture sequence

```mermaid
sequenceDiagram
    participant PIC as temp_logger (PIC)
    participant USB as USB-UART
    participant LOG as serial_logger.py
    participant CSV as temp.csv
    participant AN as analyze_log.py
    PIC->>USB: "t_ms,temp_c\r\n" every 500 ms
    USB->>LOG: readline() loop
    LOG->>LOG: decode+strip, monotonic clock
    LOG->>CSV: pc_time_iso,elapsed_s,raw_line (flush/line)
    LOG->>LOG: Ctrl+C / --seconds → close, print count
    CSV->>AN: parse_rows() skips header/garbage
    AN->>AN: min/max/avg + ASCII chart to stdout
```

Failure branches: port missing → exit 3 before anything; disconnect mid-run →
exit 3 with partial (valid) CSV; empty/garbage CSV → analyzer exit 1.
