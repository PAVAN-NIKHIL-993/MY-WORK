# Component: i2c_scanner_16f877a.c

- **File:** [`04-advanced/i2c_scanner_16f877a.c`](../../04-advanced/i2c_scanner_16f877a.c) (110 lines) · **Module:** [firmware-advanced](../modules/firmware-advanced.md)
- **Purpose:** MSSP I2C master @100 kHz probes 0x08–0x77, reports ACKers over UART (`Found 0x..`), heartbeat per scan. Works with any I2C slave (RTC, LCD backpack…).
- **Interface:** RC3/SCL + RC4/SDA (**4.7k pull-ups mandatory** — open-drain bus); RC6/TX report @9600; RB0 heartbeat.
- **Config:** `SSPCON=0x28` (SSPEN + I2C master), `SSPADD=49` (=Fosc/(4·100k)−1), `SSPSTAT=0x80` (slew off), TRISC3/4=in; UART TX-only init (`SPBRG=129`).
- **Functions:** `uart_*` (putc/puts/puthex — TX-only subset, D1-duplicated intentionally); `i2c_init/start/stop`; `i2c_write(u8)→ACKSTAT` (0=ACK: `SSPIF`-waited 9 clocks); `main` — scan loop + 2 s cadence.
- **State:** loop vars only. **Errors:** NACK = "nobody home" (signal, skipped); stuck-LOW bus needs slave power-cycle (README).
- **Perf:** ~35 ms scan per 2 s. **Failure modes:** eternal `(none)` (pull-ups/power/GND); fewer hits than expected (10-bit/clocked-stretch slaves — out of scope).
- **Debug:** meter SDA/SCL idle HIGH; scope START/ACK bits; terminal shows exact responding addresses.
- **Extension:** talk to a found device (RTC read). **Risks:** MEDIUM (bus physics); frozen (D5).
