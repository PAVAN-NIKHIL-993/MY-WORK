# Module: firmware-advanced (`04-advanced/`)

- **Purpose:** buses + nonvolatility + power: I2C master scanning, data-EEPROM persistence, WDT/SLEEP duty-cycling, SPI loopback, and full config-word literacy.
- **Location:** [`04-advanced/`](../../04-advanced/README.md) — 3 `.c` + `spi_loopback_note.md` + `config_word_guide.md` + stage README.
- **Responsibilities:** 100 kHz I2C scan→UART report; press counter surviving reset; ~2.3 s WDT wake loop with TO/PD discrimination; SPI proof-by-loopback; `#pragma` reference.
- **Public interface:** RC3/SCL + RC4/SDA (4.7k pull-ups!) + RC6/TX (scanner); RB1 + RD0–3 (EEPROM); RB0 (WDT); RC5↔RC4 jumper + RC6/TX (SPI).
- **Dependencies:** XC8; I2C/SPI examples need external devices (any sensor / wire jumper). **Consumers:** capstone inherits EEPROM + sleep ideas (stretch goals).
- **Internal architecture:** 3 standalone programs + 2 knowledge docs; scanner reuses the UART-TX-only pattern (D1 duplication, intentional).
- **Data/state:** EEPROM byte @`0x00` (persistent); `STATUS<TO,PD>` (reset-cause); I2C `ACKSTAT` per probe.
- **Error handling:** NACK-as-signal; EEPROM WR-spin + GIE-guarded unlock; WDT as the hang recovery itself.
- **Performance:** scan ≈ 35 ms/2 s; EEPROM 4 ms/write (human-rate only — never for logging); SLEEP ≈ µA.
- **Security:** `CPD = OFF` required for the demo (noted); WDT demo is the only `WDTE = ON` file — do not copy that line blindly.
- **Configuration:** scanner `SSPADD=49`; EEPROM `0x55/0xAA` sequence; WDT `OPTION_REG=0x8F`; SPI `SSPCON=0x21`.
- **Failure modes:** empty scan (pull-ups/power); EEPROM never writes (unlock order); constant resets (delay > WDT period); SPI mismatch (jumper/mode).
- **Debugging:** terminal text is the scope (scan lines, TX-vs-RX lines); TO/PD print via LED patterns.
- **Extension points:** real I2C/SPI slaves (RTC, 25LC256, MCP3008), sleep-current measurement, EEPROM-backed settings.
- **Modification risks:** MEDIUM-HIGH — WDT timing and I2C pull-up requirements are physics, not style; SPI doc contains a full listing that must stay in sync with its prose.
- **Implementation:** [i2c-scanner](../components/i2c-scanner-16f877a.md) · [eeprom-demo](../components/eeprom-demo-16f877a.md) · [watchdog-sleep](../components/watchdog-sleep-16f877a.md) · [spi note](../../04-advanced/spi_loopback_note.md) · [config guide](../../04-advanced/config_word_guide.md).
