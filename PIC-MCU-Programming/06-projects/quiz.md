# Final Quiz (Steps 2–7) — 12 questions, answers hidden

Score yourself: 10+/12 = workspace mastered. 🏁

---

**Q1.** `TRISB = 0xF0` — which PORTB pins are inputs, which are outputs?

<details><summary>Answer</summary>
TRIS <b>1 = input, 0 = output</b>. 0xF0 = 11110000 → RB4–RB7 inputs, RB0–RB3 outputs.
</details>

**Q2.** At Fosc = 20 MHz, what is the instruction clock (Fcy)? A Timer0 tick with 1:256 prescaler lasts how long?

<details><summary>Answer</summary>
Fcy = Fosc/4 = <b>5 MHz</b> (0.2 µs/cycle). Timer0 tick = 256 × 0.2 µs = <b>51.2 µs</b>;
overflow every 256 ticks ≈ <b>13.1 ms</b>.
</details>

**Q3.** Your LED program flashes fine but the LED never lights. Name 3 hardware/config causes (not code logic).

<details><summary>Answer</summary>
Any three: MCLR floating (no 10k pull-up); pin still analog (ANSEL/ADCON1); TRIS set to input;
LED backwards / no resistor; <code>FOSC</code> mismatch (e.g. HS config, no crystal);
VDD/VSS pin unconnected; no decoupling causing brown-out resets.
</details>

**Q4.** Compute SPBRG for 9600 baud at 20 MHz with BRGH=1. Is the error acceptable?

<details><summary>Answer</summary>
SPBRG = 20000000/(16×9600) − 1 = 129.2 → <b>129</b>. Actual = 20000000/(16×130) ≈ 9615 baud,
error <b>+0.16%</b> — fine (UART tolerates ≈ ±2%).
</details>

**Q5.** Why must ISR-shared variables be `volatile`? Why must `TMR0IF` be cleared in software?

<details><summary>Answer</summary>
<code>volatile</code> stops the compiler caching the variable — otherwise <code>main()</code> may never
see the ISR's update. <code>TMR0IF</code> is a software-cleared latch: if you don't clear it, the CPU
re-enters the ISR forever (or it fires only once, depending on the source).
</details>

**Q6.** A button press toggles your LED 5 times. What's happening and what's the fix?

<details><summary>Answer</summary>
Mechanical <b>bounce</b> (~5–20 ms of chatter). Fix: <b>debounce</b> — on first edge wait ~20 ms,
re-check, then wait for release (Steps 3–4 pattern), or use a timer-based debouncer.
</details>

**Q7.** I2C scanner finds nothing although a sensor is wired to RC3/RC4. Top two suspects?

<details><summary>Answer</summary>
1) Missing <b>4.7k pull-ups</b> on SDA/SCL (open-drain bus floats without them).
2) Wrong address assumption / slave unpowered / no common GND. (Bonus: bus stuck LOW mid-byte.)
</details>

**Q8.** What is the data-EEPROM write unlock sequence on PIC16F877A, and why is GIE cleared around it?

<details><summary>Answer</summary>
Set <code>WREN</code>, then write <code>0x55</code> then <code>0xAA</code> to <code>EECON2</code>, then set <code>WR</code>.
GIE is cleared because the sequence must execute back-to-back — an interrupt between the two
writes aborts the unlock and the write silently never happens.
</details>

**Q9.** With `WDTE = ON` and WDT prescaler 1:128, roughly how long can a `__delay_ms()` be? What happens in SLEEP on WDT timeout?

<details><summary>Answer</summary>
WDT ≈ 18 ms × 128 ≈ <b>2.3 s</b> — keep every blocking delay (well) under that or the chip resets
mid-delay. In SLEEP a timeout <b>wakes</b> the chip (execution continues after <code>SLEEP()</code>)
instead of resetting; TO=0, PD=0 identifies a WDT wake.
</details>

**Q10.** The capstone prints temperature without `printf`. Why, and how does `uart_putdec16()` work?

<details><summary>Answer</summary>
<code>printf</code> pulls in kilobytes of library + heap usage — too heavy for 368 B RAM / 8 KW flash
parts. <code>uart_putdec16()</code> divides by 10000/1000/… peeling off digits with <code>'0'+d</code>,
skipping leading zeros — ~30 bytes, no RAM buffers.
</details>

**Q11.** `tenths = ADC*5000/1024` — why is the multiply done in 32 bits (`(uint32_t)adc * 5000UL`)?

<details><summary>Answer</summary>
<code>1023 × 5000 = 5,115,000</code> overflows 16 bits (max 65,535) — the result would wrap and
temperatures would be garbage. The 32-bit intermediate holds it; division by 1024 brings it back
to a 0–4999 range that fits in 16 bits.
</details>

**Q12.** `millis()` disables GIE while copying `ms_ticks`. Why is that needed on an 8-bit PIC?

<details><summary>Answer</summary>
A 16-bit read is <b>two 8-bit instructions</b>. If the Timer0 ISR fires between them and increments
<code>ms_ticks</code> (e.g. 0x00FF → 0x0100), main could read a torn mix like 0x0000 or 0x01FF.
Briefly disabling interrupts makes the copy <b>atomic</b>.
</details>
