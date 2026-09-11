# Component: pwm_dimmer_16f877a.c

- **File:** [`03-intermediate/pwm_dimmer_16f877a.c`](../../03-intermediate/pwm_dimmer_16f877a.c) (65 lines) · **Module:** [firmware-intermediate](../modules/firmware-intermediate.md)
- **Purpose:** CCP1 PWM + Timer2: LED "breathing" fade (0→1000→0 duty, ~1 s cycle, 1.25 kHz — flicker-free).
- **Interface:** RC2/CCP1 → LED (MUST be the CCP1 pin — hardware-fixed on 877A).
- **Config:** `PR2=249`, `CCP1CON=0x0C` (PWM mode), `T2CON=0x07` (Timer2 on, 1:16, post 1:1), TRISC2=0; one TMR2 cycle waited for clean start.
- **Math:** period = 250·4·50 ns·16 = 800 µs; duty 10-bit 0–1000 (`CCPR1L`=top 8, `CCP1Y:X`=low 2).
- **Functions:** `pwm_set(u16)` (clamp + split write); `main` — init + up/down ramps (±10 per 5 ms).
- **State:** loop counter only. **Errors:** none; `pwm_set` clamps over-range.
- **Perf:** zero-ISR hardware PWM; `main` step rate sets fade speed.
- **Failure modes:** pin dark/DC-only (not RC2, or T2/CCP init order wrong); visible flicker (PR2/prescale math wrong).
- **Debug:** scope/logic on RC2; Simulator CCP view.
- **Extension:** pot-driven duty (ADC→`pwm_set`). **Risks:** MEDIUM (duty-bit split); frozen (D5).
