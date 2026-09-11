# TROUBLESHOOTING

> Real issues only (from the guides + refinement). Firmware entries assume the
> [minimum circuit](../01-docs/02-wiring-and-power-basics.md).

**Problem:** Chip programs fine but does nothing.
**Symptoms:** No LED, no UART. **Likely causes:** `FOSC` ≠ hardware osc; MCLR
floating; VDD/VSS pin open. **Diagnose:** measure 5 V at pins; check MCLR ≈ 5 V;
confirm crystal present iff `FOSC = HS`. **Solution:** fix wiring/config, reflash.
**Prevention:** build the §1 minimum circuit once, reuse forever.

**Problem:** UART garbage characters.
**Symptoms:** `��` at any baud. **Causes:** baud mismatch (`_XTAL_FREQ` wrong,
terminal ≠ 9600); no common GND; TX→TX (not crossover). **Diagnose:** run
`baud_calc.py --fosc <yours> --baud 9600` (error must be < 2%); check GND.
**Solution:** correct clock constant/SPBRG/wiring. **Prevention:** validate with
`baud_calc.py` before flashing.

**Problem:** `Target device ID does not match` / programming fails.
**Symptoms:** PICkit errors. **Causes:** wrong device selected; PGC/PGD swapped
or loaded (RB6/RB7); weak power. **Diagnose:** read device ID; inspect ICSP
order; measure VDD under load. **Solution:** select exact chip, fix wiring.
**Prevention:** short ICSP leads, no heavy RB6/RB7 loads while programming.

**Problem:** Button toggles randomly / many times per press.
**Symptoms:** erratic counts. **Causes:** floating pin (no pull-up) / missing
debounce. **Diagnose:** scope/meter the pin idle level. **Solution:** enable
pull-up (10k or WPU) + 20 ms debounce (examples already do both).

**Problem:** I2C scanner finds nothing.
**Symptoms:** `(none)` every scan. **Causes:** missing 4.7k pull-ups; slave
unpowered; no common GND. **Diagnose:** SDA/SCL idle HIGH? Slave VDD present?
**Solution:** fit pull-ups, power slave, common GND.

**Problem:** `serial_logger` — `ERROR: cannot open port` (exit 3).
**Symptoms:** immediate exit. **Causes:** wrong port, port busy, USB unplugged,
Linux perms. **Diagnose:** `--list`; replug; check `dialout` group.
**Solution:** correct `--port`, free the port, fix perms.

**Problem:** `ERROR: pyserial is not installed` (exit 1).
**Solution:** `pip install -r 05-python-tools/requirements.txt`.

**Problem:** `analyze_log` — `No valid samples` (exit 1).
**Causes:** logged a non-CSV stream (echo/scan text), wrong file, or PIC sent
only headers. **Diagnose:** `head` the CSV — need `t_ms,temp_c` numeric lines.
**Solution:** flash `temp_logger`, re-capture.

**Problem:** Tests fail on `test_serial_logger` live cases.
**Causes:** pyserial installed but no hardware — those tests use fake ports and
pass; a failure means real breakage. **Diagnose:** run that module verbosely.
