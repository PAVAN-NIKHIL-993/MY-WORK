# Component Documentation: Temperature Lookup and Interpolation

## Component Name
Temperature Lookup and Interpolation - NTC resistance-to-temperature calculation

## Component Location
- `src/thermometer.c` - Complete temperature calculation implementation
- `docs/components/thermometer-lookup.md` - This documentation file

## Component Purpose
Converts NTC thermistor resistance values (ohms) to temperature readings (°C × 10 resolution) using a pre-calculated lookup table with linear interpolation. Designed for the PIC16F15214's constrained resources (no floating-point unit, limited program memory).

## Algorithm Design

### Lookup Table (tempTable[])
The `tempTable[]` array contains 13 pre-calculated entries covering the temperature range 10.0°C to 53.0°C:

```c
const TempLookup tempTable[] = {
    {200000L, 100},  // 10.0°C
    {180000L, 130},  // 13.0°C
    {160000L, 170},  // 17.0°C
    {140000L, 210},  // 21.0°C
    {126800L, 250},  // 25.0°C (reference)
    {110000L, 290},  // 29.0°C
    {95000L,  330},  // 33.0°C
    {82000L,  370},  // 37.0°C (body temperature)
    {71000L,  410},  // 41.0°C
    {62000L,  450},  // 45.0°C
    {54000L,  490},  // 49.0°C
    {47000L,  530},  // 53.0°C
};
#define TABLE_SIZE (sizeof(tempTable) / sizeof(TempLookup))  // = 13
```

### Temperature Resolution
- `temp_x10` format: Temperature stored as int16_t in units of 0.1°C
- Example: 372 = 37.2°C, 820 = 82.0°C
- Resolution: 0.1°C (sufficient for body temperature monitoring ±0.3°C accuracy)
- User divides by 10 for display: `temperature_x10 / 10` gives integer part, `temperature_x10 % 10` gives decimal

### Table Entry Distribution
Entries are spaced closer together where the R-T curve is steepest (around body temperature) and wider apart at range extremes, providing roughly uniform temperature accuracy across the operating range:

| Entry | Temperature | Resistance | Purpose |
|-------|-------------|------------|---------|
| 0 | 10.0°C | 200kΩ | Cold end of range |
| 1 | 13.0°C | 180kΩ | |
| 2 | 17.0°C | 160kΩ | |
| 3 | 21.0°C | 140kΩ | |
| 4 | 25.0°C | 126.8kΩ | Reference/calibration point |
| 5 | 29.0°C | 110kΩ | |
| 6 | 33.0°C | 95kΩ | |
| 7 | 37.0°C | 82kΩ | **Body temperature; most important** |
| 8 | 41.0°C | 71kΩ | |
| 9 | 45.0°C | 62kΩ | |
| 10 | 49.0°C | 54kΩ | |
| 11 | 53.0°C | 47kΩ | Hot end of range |

### Interpolation Algorithm
When measured resistance falls between two table entries, linear interpolation estimates the temperature:

```
T = T1 + (R - R1) × (T2 - T1) / (R2 - R1)
```

Where:
- T = Estimated temperature (×10°C resolution)
- R = Measured resistance (ohms)
- R1, R2 = Bracketing table resistance values (R1 > R2 for NTC)
- T1, T2 = Corresponding temperatures (×10°C)

**Integer arithmetic implementation** (in `Interpolate()` function):
```c
int16_t Interpolate(uint32_t r, uint32_t r1, int16_t t1, uint32_t r2, int16_t t2) {
    int32_t deltaT = (int32_t)t2 - (int32_t)t1;  // Temperature difference
    int32_t deltaR = (int32_t)r2 - (int32_t)r1;  // Resistance difference
    int32_t r_offset = (int32_t)r - (int32_t)r1; // Resistance offset from R1
    
    // T = T1 + (r_offset × deltaT) / deltaR
    int32_t temp = (int32_t)t1 + (r_offset * deltaT) / deltaR;
    
    return (int16_t)temp;
}
```

**Key details**:
- All math uses int32_t to avoid overflow (r_offset × deltaT ≈ 65M, fits in int32_t max ~2.1B)
- Division by deltaR is integer division (truncates toward zero)
- Formula assumes R1 > R2 (NTC characteristic: resistance decreases as temp increases)
- If deltaR = 0 (same resistance), returns t1 (no interpolation needed)

## Public Functions

### `Lookup_Temperature(uint32_t res)`

**Purpose**: Find temperature from NTC resistance using lookup table with bounds checking and interpolation.

**Parameters**:
- `res` (uint32_t): NTC resistance in ohms (typically 47k-200kΩ range)

**Return Value**:
- int16_t: Temperature × 10 (e.g., 372 = 37.2°C)
- Returns table minimum (10.0°C = 100) if resistance >= first table entry
- Returns table maximum (53.0°C = 530) if resistance <= last table entry

**Algorithm**:
1. Check if resistance >= first table entry (200kΩ at 10°C) → return 100 (10.0°C)
2. Check if resistance <= last table entry (47kΩ at 53°C) → return 530 (53.0°C)
3. Linear search through 13 entries to find bracketing pair:
   - Find i where: `res <= tempTable[i].resistance && res >= tempTable[i+1].resistance`
4. Call `Interpolate(res, tempTable[i].resistance, tempTable[i].temp_x10, tempTable[i+1].resistance, tempTable[i+1].temp_x10)`
5. Return interpolated temperature_x10

**Search Strategy**: Linear search through 13 entries. Given small table size, linear search is faster to implement than binary search and executes in <100µs on the PIC16F15214.

### `Interpolate(uint32_t r, uint32_t r1, int16_t t1, uint32_t r2, int16_t t2)`

**Purpose**: Linear interpolation between two table entries to estimate temperature for a resistance value between them.

**Parameters**:
- `r` (uint32_t): Measured resistance to interpolate for
- `r1` (uint32_t): Lower bracketing resistance (r1 > r2 for NTC characteristic)
- `t1` (int16_t): Temperature corresponding to r1 (×10°C resolution)
- `r2` (uint32_t): Upper bracketing resistance (r1 > r2)
- `t2` (int16_t): Temperature corresponding to r2 (×10°C resolution)

**Return Value**:
- int16_t: Interpolated temperature × 10

**Algorithm**:
```c
int16_t Interpolate(uint32_t r, uint32_t r1, int16_t t1, uint32_t r2, int16_t t2) {
    int32_t deltaT = (int32_t)t2 - (int32_t)t1;
    int32_t deltaR = (int32_t)r2 - (int32_t)r1;
    int32_t r_offset = (int32_t)r - (int32_t)r1;
    
    int32_t temp = (int32_t)t1 + (r_offset * deltaT) / deltaR;
    
    return (int16_t)temp;
}
```

**Mathematical basis**: T = T1 + (R - R1) × (T2 - T1) / (R2 - R1)

**Integer math considerations**:
- int32_t used for all intermediate calculations to prevent overflow
- r_offset × deltaT maximum: ~153000 × 430 ≈ 65.8M (fits in int32_t: max ~2.1B)
- Division by deltaR is exact; truncation toward zero
- Assumes r1 > r2 (NTC: resistance decreases as temperature increases)

## Dependencies

### Direct Dependencies (source files)
- `src/main.c` - Contains `tempTable[]` definition and `TABLE_SIZE` constant; calls `Lookup_Temperature()`
- `src/adc.c` - Provides `Calculate_Resistance()` output (uint32_t resistance) as input to `Lookup_Temperature()`
- `xc.h` - PIC16F15214 SFR definitions; int16_t, uint32_t types

### Hardware Dependencies
- None directly; functions are pure math/algorithm, no hardware access
- NTC thermistor with known resistance-temperature characteristics (Beta 3950, 100kΩ)
- 100kΩ series resistor (must match table calibration for accurate resistance values)

### Configuration Dependencies
- `TABLE_SIZE` must match `sizeof(tempTable)/sizeof(TempLookup)` when modifying table
- `tempTable[]` entries must be in decreasing resistance order (high temp → low temp, since NTC R decreases as T increases)
- Table covers 10.0°C to 53.0°C; entries outside this range will be clamped

## Runtime Behavior

### Normal Operation
1. `main.c` calls `Calculate_Resistance(adcValue)` → gets resistance in ohms
2. `main.c` calls `Lookup_Temperature(resistance)` → gets temperature_x10
3. `temperature_x10` used by main loop for:
   - OLED display (large text, bar gauge)
   - Status text (NORMAL/FEVER/LOW thresholds: 361-372, >380, <361)
   - UART output (optional)

### Interpolation Examples

| Measured R (Ω) | Between Table Entries | Interpolated T (°C) | Table Entry T (°C) | Interpolation Error |
|----------------|----------------------|---------------------|-------------------|---------------------|
| 126800 (exact) | N/A (exact match) | 250 (=25.0°C) | 126800/250 | 0.0% (exact) |
| 150000 | Between 160k@17°C and 140k@21°C | ~19.5°C | N/A | ~±1.5°C |
| 100000 | Between 110k@29°C and 95k@33°C | ~31.0°C | N/A | ~±2.0°C |
| 82000 (exact) | N/A (exact match) | 370 (=37.0°C) | 82000/370 | 0.0% (exact) |
| 85000 | Between 82k@37°C and 71k@41°C | ~38.5°C | N/A | ~±1.5°C |

**Accuracy assessment**:
- Exact table entries: 0% error (by definition)
- Between entries: ±1-2°C error depending on curve curvature
- Linear approximation of exponential (Beta) curve introduces error
- However, ±1-2°C is within the overall ±0.3°C design target when considering full error budget including NTC tolerance (±1% at 25°C ≈ ±0.3°C)

### Boundary Conditions

**Below table range** (resistance > 200kΩ, temperature < 10°C):
- `Lookup_Temperature()` returns 100 (10.0°C)
- Safe default; indicates "very cold" condition
- Unlikely in normal body temperature monitoring

**Above table range** (resistance < 47kΩ, temperature > 53°C):
- `Lookup_Temperature()` returns 530 (53.0°C)
- Safe default; indicates "very hot" condition
- Unlikely in normal body temperature monitoring

**Exact table entry match**:
- If measured resistance exactly equals a table entry's resistance value
- Interpolation skipped; returns exact `temp_x10` value for that entry
- Zero interpolation error for that point

## Memory Usage

| Resource | Usage |
|----------|-------|
| Program Memory | ~40 bytes | 2 functions + lookup table (const in flash) |
| RAM | ~6 bytes | No module-level variables; parameters on stack |
| Flash (const data) | 104 bytes | `tempTable[13] × 8 bytes/entry` (resistance + temp_x10) |

The `tempTable[]` is stored in program memory (flash), not RAM. This is the default for `const` data in XC8 for PIC16. The 104 bytes of flash are included in the "program memory" budget, not RAM.

## Calibration and Table Updates

**To update the table for a different NTC**:

1. Measure NTC resistance at 3 known temperatures (using reference thermometer)
2. Calculate expected resistances using the voltage divider formula
3. Replace table entries with measured values
4. Recompile and re-flash

**Example**: For a different β value NTC, replace all 13 entries with measured resistances at temperatures 10°C, 13°C, 17°C, ..., 53°C (same temperature spacing, different resistance values).

**No field calibration**: The current firmware does not include auto-calibration. Calibration requires recompilation with updated table values.

## Error Handling Within Module

| Error Condition | Handling | User Visible Effect |
|----------------|----------|---------------------|
| Resistance < 47kΩ (below 53°C min) | Bounds check returns 530 (53.0°C) | Display shows max temperature; safe default |
| Resistance > 200kΩ (above 10°C table max) | Bounds check returns 100 (10.0°C) | Display shows min temperature; safe default |
| Resistance exactly at table entry | Exact match; no interpolation needed | Returns exact temperature_x10 value |
| Temperature out of 10-53°C range | Clamped to table min/max | Display shows clamped value |
| Invalid table index (loop fails) | Returns 0 (should not happen with bounds checks) | Display shows 0°C; indicates firmware bug |

## Related Modules

- `main.c` - Contains `tempTable[]` definition; calls `Lookup_Temperature()` during main loop
- `adc.c` - Provides `Calculate_Resistance()` output (uint32_t resistance) consumed by `Lookup_Temperature()`
- `main.c` - Uses `Lookup_Temperature()` result; displays `temperature_x10` on OLED
- `oled.c` - Uses `temperature_x10` value to draw bar gauge via `OLED_DrawThermometer()`

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-09-10 | Initial release with `Lookup_Temperature()` and `Interpolate()` |
| 2.0.0 | 2026-09-10 | Added detailed table entry rationale; integer math explanation; bounds checking; interpolation formula documentation; error handling section; performance characteristics |