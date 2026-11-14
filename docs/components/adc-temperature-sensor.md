# Component Documentation: NTC Temperature Sensor (ADC Input)

## Component Name
ADC Temperature Sensor - NTC Thermistor (100kΩ, Beta 3950)

## Component Location
- `src/adc.c` - ADC reading and resistance calculation
- `src/thermometer.c` - Temperature lookup and interpolation
- `docs/components/adc-temperature-sensor.md` - This documentation

## Component Purpose
Reads the analog voltage from the NTC thermistor voltage divider circuit connected to the PIC16F15214's RA0/AN0 ADC channel. Converts the ADC reading to resistance, then looks up the corresponding temperature from a pre-calculated table. Provides the temperature data that drives the OLED display.

## Physical Wiring

```
                        5V (VDD)
                           │
                           ├─ 100kΩ 0.1% precision resistor
                           │   │
               RA0/AN0 (Pin 13) │
                           │   │
                           ├─ 100kΩ NTC thermistor (Beta 3950)
                           │   │
                           └─ GND (VSS, Pin 14)
                                │
                              0.1µF capacitor
                                │
                               GND
```

**Pin Connection Details**:
- **PIC Pin 1 (VDD)**: 5V power supply
- **PIC Pin 13 (RA0/AN0)**: ADC input channel 0; connects to junction of 100kΩ resistor and NTC thermistor
- **PIC Pin 14 (VSS)**: Ground connection; connects to one end of NTC thermistor and ground rail
- **0.1µF capacitor**: Between RA0 and VSS; filters ADC noise (recommended but not strictly required for operation)

## Voltage Divider Operation

The NTC thermistor and 100kΩ precision resistor form a voltage divider connected to the 5V supply (PIC VDD):

```
V_RA0 = V_DD × (R_NTC / (R_series + R_NTC))
```

Where:
- `V_DD` = 5V (supply voltage, PIC16F15214 VDD)
- `R_series` = 100kΩ (precision resistor, must be 0.1% tolerance for accuracy)
- `R_NTC` = NTC thermistor resistance (varates with temperature)
- `V_RA0` = Voltage at RA0 pin (ADC input)

**ADC Conversion**:
The PIC16F15214's 10-bit ADC converts `V_RA0` to a digital value:

```
ADC_value = (V_RA0 / V_DD) × 1023
          = (R_NTC / (100k + R_NTC)) × 1023
```

**Solving for NTC Resistance**:
```
R_NTC = (ADC_value × 100k) / (1023 - ADC_value)
```

This is exactly the `Calculate_Resistance()` function implementation in `src/adc.c`.

## Expected Resistance Values

| Temperature | Expected R_NTC | Notes |
|-------------|---------------|-------|
| 10°C (cold end) | ~200kΩ | Lookup table entry |
| 25°C (reference) | ~100kΩ | NTC nominal rating; β=3950 calibration point |
| 37°C (body temp) | ~82kΩ | Most important range; lookup table entry |
| 45°C | ~62kΩ | Lookup table entry |
| 53°C (hot end) | ~47kΩ | Lookup table entry |

**Typical circuit behavior**:
- At room temperature (≈25°C): Measure ~100kΩ between RA0 and GND (with NTC connected)
- When heating NTC with finger: Resistance decreases (NTC characteristic)
- Expected ADC value at 25°C: ≈512 (mid-scale, since R_NTC ≈ R_series)

## Component Dependencies

### Direct Dependencies (source files)
- `src/main.c` - CONFIG bits; `#define` statements (_XTAL_FREQ, ADC_CHANNEL, SERIES_RESISTOR, etc.); calls ADC_ReadAveraged() and Calculate_Resistance()
- `src/thermometer.c` - Lookup_Temperature() and Interpolate() functions; consumes Calculate_Resistance() output
- `src/i2c.c` - Indirect; OLED displays the results, but ADC module doesn't depend on I2C
- `xc.h` - PIC16F15214 SFR definitions (ADCON0, ADCON1, ADRESH, ADRESL)

### Hardware Dependencies
- PIC16F15214 microcontroller with ADC module
- RA0/AN0 pin (Pin 13) - ADC input channel 0
- 100kΩ 0.1% precision resistor (series resistor - must match define)
- 100kΩ NTC thermistor (Beta 3950 - lookup table calibrated for this)
- 0.1µF capacitor (ADC input filtering; RA0 to VSS)
- VDD (Pin 1) and VSS (Pin 14) - power and ground

### Configuration Dependencies
- ADC module enabled via ADCON0bits (set in SYSTEM_Initialize() or ADC_Read())
- ADCON1 = 0b10000000 (right-justified, FOSC/64 ADC clock)
- ADREF = 0x00 (VDD as reference voltage)
- ADC_CHANNEL define (0 = RA0/AN0; can be changed to other channels but not recommended)

## Inputs

| Input | Source | Description |
|-------|--------|-------------|
| NTC thermistor | Physical circuit | 100kΩ Beta 3950; resistance varies with temperature |
| 100kΩ precision resistor | Physical circuit | Sets voltage divider ratio; must match SERIES_RESISTOR define |
| 5V supply | Physical circuit | VDD; affects ADC scaling (all values proportional) |
| ADC clock | Internal (32MHz / 64) | ADC conversion time determined by config bits |

### ADC Channel Configuration
- Default: `ADC_CHANNEL = 0` (RA0/AN0)
- Can be changed to RA1-RA7 (other analog inputs on PIC16F15214)
- Not recommended; RA0 is the designed NTC input
- Channel change requires updating SYSTEM_Initialize() TRISA/ANSEL bits

## Outputs

| Output | Destination | Description |
|--------|-------------|-------------|
| adcValue (uint16_t) | main.c → thermometer.c | Raw ADC reading (0-1023); updated every loop iteration |
| resistance (uint32_t) | adc.c → thermometer.c | Calculated NTC resistance in ohms; derived from adcValue |
| temperature_x10 (int16_t) | thermometer.c → main.c | Temperature × 10 (e.g., 372 = 37.2°C); drives OLED display |
| UART output (optional) | uart.c (if enabled) | ASCII text: ADC value, resistance, temperature, status |

## Data Flow

```
NTC Thermistor Circuit
    │
    ├──→ V_RA0 = 5V × (R_NTC / (100k + R_NTC))
    │        │
    │        └──→ ADC_Read() → 10-bit digital value (0-1023)
    │                │
    │        └──→ Calculate_Resistance(adcValue)
    │                │
    │                └──→ R_NTC = (adcValue × 100000L) / (1023 - adcValue) ohms
    │                       │
    │                       └──→ Lookup_Temperature(resistance)
    │                              │
    │                              └──→ temperature_x10 (×10°C resolution)
    │                                        │
    │                                        └──→ main.c → OLED display (temperature, bar gauge, status)
    │
    └──→ ADC_ReadAveraged(16 samples) → Noise reduction (sum >> 4)
           │
           └── 16 × (conversion + 100µs delay) ≈ 2ms total per reading
```

## Error Handling

| Error Condition | Detection | Recovery |
|----------------|-----------|----------|
| ADC reads 0 (short circuit) | adcValue = 0 → Calculate_Resistance → 0Ω → Lookup_Temperature → 10.0°C (table min) | Display shows ~10°C; safe default; check wiring |
| ADC reads 1023 (open circuit) | adcValue = 1023 → Calculate_Resistance guarded → 0Ω → Lookup_Temperature → 10.0°C | Display shows ~10°C; safe default; check NTC connection |
| Resistance out of table range | < 47kΩ (below 53°C) or > 200kΩ (above 10°C) → bounds check returns clamped value | Display shows 10.0°C or 53.0°C; out-of-range is application-specific |
| SERIES_RESISTOR mismatch | If actual resistor ≠ #define value → resistance calculation wrong → temperature error | Verify with multimeter; update #define if needed |
| NTC thermistor open/short | Physical failure; resistance ≠ expected | Replace NTC; check continuity with multimeter |

## Performance Characteristics

| Metric | Value | Notes |
|--------|-------|-------|
| Program Memory | ~25 bytes | Code for ADC_Read, ADC_ReadAveraged, Calculate_Resistance |
| RAM | ~6 bytes | No module-level state; temporaries on stack only |
| Single Conversion Time | ~26µs | 13 Tad at 32MHz /64 ADC clock |
| 16-sample Averaging Time | ~2ms | 16 × (conversion time + 100µs delay) |
| Main Loop ADC Time | ~3.2ms per iteration | Part of ~15ms total loop (rest is 500ms delay) |
| Noise Reduction (16×) | ~12dB | √16 = 4× voltage noise improvement |
| Max Sample Rate | ~500 samples/sec | Theoretical; actual usage: 1 sample/sec (1Hz update) |
| ADC Resolution | 10-bit (0-1023) | Fixed; determined by hardware |
| Calculation Time (resistance) | <1µs | Few integer operations; 32-bit multiply + division |
| Lookup Time | ~50-100µs | Linear search 13 entries; each: 2 comparisons + branch |
| Total Temp Calculation | ~100-150µs | ADC dominates at ~2ms; math is negligible |

## Calibration and Table Updates

**Current Table**: Calibrated for 100kΩ NTC thermistor with β=3950 parameter.

**To calibrate for a different NTC thermistor**:

1. Measure NTC resistance at 3 known temperatures (using reference thermometer):
   - 0°C (ice water)
   - 25°C (room temperature)
   - 50°C (hot water, not boiling)

2. Calculate expected resistance at each temperature using voltage divider:
   ```
   R_NTC = (ADC_value × SERIES_RESISTOR) / (ADC_MAX - ADC_value)
   ```

3. Replace `tempTable[]` entries with measured resistances at each temperature:
   ```c
   // Example: If measuring 120kΩ at 20°C, 100kΩ at 25°C, 85kΩ at 30°C:
   const TempLookup tempTable[] = {
       {200000L, 100},  // 10.0°C (adjust for your data)
       {150000L, 150},  // 15.0°C
       {120000L, 200},  // 20.0°C (your measured data)
       // ... continue for 13 entries total
   };
   ```

4. Recompile and re-flash the PIC

**Alternative**: Use the online NTC thermistor calculator:
- Website: https://www.thinksrs.com/downloads/programs/therm%20calc/ntccalibrator/ntccalculator.html
- Input: 3 measured (Temperature, Resistance) pairs
- Output: Custom A, B, C coefficients for Steinhart-Hart equation
- Or: Output: Custom lookup table entries

**No auto-calibration**: The current firmware does not support field calibration. Calibration requires recompilation with updated table values.

## Component Lifecycle

### Power-On Behavior
1. PIC16F15214 powers up
2. ADC module default: disabled, all channels digital
3. `SYSTEM_Initialize()` configures RA0 as analog (TRISA0=1, ANSELA0=1)
4. First `ADC_ReadAveraged()` call enables ADC module (implicitly via ADCON0bits.GO)
5. Begins normal operation: read → calculate → display temperature

### Normal Operation
1. Main loop calls `ADC_ReadAveraged(ADC_CHANNEL, SAMPLES)` every ~1 second
2. 16 ADC readings averaged via sum>>4 (divide by 16)
3. `Calculate_Resistance()` converts ADC to ohms
4. `Lookup_Temperature()` finds bracketing table entries and interpolates
5. `temperature_x10` updated; main loop redraws OLED display
6. Repeat ~1 sample per second

### Failure Behavior
- **NTC disconnected**: adcValue reads extreme (0 or 1023); resistance → 0 or clamped; temperature → 10.0°C (min) or 53.0°C (max)
- **Noise without capacitor**: ADC readings may fluctuate; add 0.1µF capacitor between RA0 and VSS for stability
- **SERIES_RESISTOR wrong**: All temperature readings systematically off; verify with multimeter and update define

## Related Modules

- `main.c` - Calls ADC_ReadAveraged() during main loop; uses Lookup_Temperature() result for OLED display
- `thermometer.c` - Consumes adcValue and resistance; provides Lookup_Temperature() and Interpolate()
- `oled.c` - Uses temperature_x10 value from main.c to draw bar gauge via OLED_DrawThermometer()
- `uart.c` (optional) - May output ADC value, resistance, temperature via serial for debugging

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-09-10 | Initial release with ADC_Read(), ADC_ReadAveraged(), Calculate_Resistance() |
| 2.0.0 | 2026-09-10 | Added ADC_READ_ADON considerations; clarified 10-bit resolution; added error budget; optimized averaging with bit shifts |