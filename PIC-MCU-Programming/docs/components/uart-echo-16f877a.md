# Component: uart_echo_16f877a.c

- **File:** [`03-intermediate/uart_echo_16f877a.c`](../../03-intermediate/uart_echo_16f877a.c) (85 lines) · **Module:** [firmware-intermediate](../modules/firmware-intermediate.md)
- **Purpose:** first serial link: banner + echo at 9600 8-N-1; RB0 toggles per byte. The PC pipeline's hello-world peer.
- **Interface:** RC6/TX→USB-UART RX, RC7/RX←USB-UART TX, common GND; LED RB0.
- **Config:** `SPBRG=129` (BRGH=1, +0.16%), `TXSTA: SYNC=0,BRGH=1,TXEN=1`, `RCSTA: SPEN+CREN=1`, TRISC7=in/TRISC6=out.
- **Functions:** `uart_init()`; `uart_putc(u8)` (wait `TRMT`, write `TXREG`); `uart_puts(str)`; `uart_getc()→u8` — OERR→CREN reset, wait `RCIF`, FERR→discard+0, else `RCREG` (read clears `RCIF` in HW). `main` — banner, echo loop.
- **State:** none. **Errors:** overrun self-heals; framing discards one byte; chronic garbage ⇒ baud/clock/wiring (terminal-side) fault.
- **Perf:** polling fine at human rates; TX ~1 ms/byte.
- **Failure modes:** silent (SPEN/TRIS/COM-port/driver); garbage (baud/GND/crossover) — full table in stage README.
- **Debug:** terminal first (banner proves TX); short TX→RX on the USB module to isolate PC vs PIC.
- **Extension:** `1`/`0` commands + `OK` replies (exercise). **Risks:** MEDIUM (baud chain); frozen (D5). Protocol: [uart-protocol](../api/uart-protocol.md).
