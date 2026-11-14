# Module: capstone-system (`06-projects/` + pipeline)

- **Purpose:** prove the whole stack: LM35 → PIC (ADC+Timer0+UART) → USB-UART → logger CSV → analyzer report. The "product" of the workspace.
- **Location:** [`06-projects/`](../../06-projects/README.md) — `temp_logger_16f877a.c` + `analyze_log.py` + `quiz.md` + README (runbook + completion checklist).
- **Responsibilities:** 2 Hz `t_ms,temp_c` stream (non-blocking); CSV stats (min/max/avg) + ASCII chart; 12-question mastery quiz.
- **Public interface:** firmware pins (RA0 LM35, RC6 TX, RB0 heartbeat); CLI `analyze_log.py <csv>` (exits 0/1/2); quiz Markdown with `<details>` answers.
- **Dependencies:** XC8 (firmware); stdlib-only analyzer; `serial_logger.py` for capture (pyserial). **Consumers:** end users; the completion checklist gates "workspace mastered".
- **Internal architecture:** firmware = 1 ms ISR clock + windowed sampler + decimal UART (no `printf`); analyzer = tolerant two-format CSV parser + stats + downsampling chart.
- **Data:** `ms_ticks` (RAM), ADC→tenths (32-bit intermediate), CSV rows, `(t_ms,temp)` tuples.
- **Error handling:** UART fire-and-forget (bench assumption); analyzer skips garbage, exits 1 on zero samples, 2 on unreadable file.
- **Performance:** TX ≈ 2% CPU; analyzer handles 100k+ rows in RAM comfortably.
- **Security:** sensor text only, local files, no PII. **Configuration:** `SAMPLE_PERIOD_MS=500`, `SPBRG=129`, `TMR0=100` preload.
- **Runtime:** flash → stream forever; capture with `--seconds`; analyze offline.
- **Failure modes:** flat wrong temp (LM35 pinout/Vref); empty analysis (logged wrong stream); torn 16-bit reads (prevented by `millis()` GIE guard).
- **Debugging:** terminal first (see raw lines), then `head` the CSV, then analyzer; touch-LM35 rise test.
- **Extension points:** threshold alarm, EEPROM daily-max, WDT sleep cadence, sensor swap (README stretch goals).
- **Modification risks:** MEDIUM — line format change requires firmware + `parse_rows` + fixture + tests + [api](../api/uart-protocol.md) updated atomically.
- **Implementation:** [temp-logger fw](../components/temp-logger-16f877a.md) · [analyze-log](../components/analyze-log.md) · [quiz](../../06-projects/quiz.md).
