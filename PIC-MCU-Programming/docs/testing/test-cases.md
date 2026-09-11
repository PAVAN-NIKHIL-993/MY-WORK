# Test Cases (all 26, by suite)

> Source of truth: [`tests/`](../../tests/__init__.py). Helpers: `load_module`
> (file-load, dirs contain `-`) + `run_cli` (subprocess, no shell, 60 s timeout).

## `test_baud_calc.py` (7)

| Test | Asserts |
|---|---|
| `test_known_good_20mhz_9600_brgh1` | `(129, ≈9615.4, ≈+0.16)` — equals firmware `SPBRG = 129` |
| `test_brgh0_comparison` | `(32, ≈−1.36%)` |
| `test_8mhz_115200_is_unreliable` | `abs(err) > 2` (documents real unreliability) |
| `test_spbrg_clamps_to_byte` | `255` for absurdly low baud |
| `test_rejects_zero_baud` | CLI `--baud 0` → exit 2 (was `ZeroDivisionError`) |
| `test_rejects_negative_inputs` | negative `--fosc`/`--baud` → exit 2 |
| `test_all_flag_sweeps` | `--all` → exit 0, contains `SPBRG=` |

## `test_config_helper.py` (7)

| Test | Asserts |
|---|---|
| `test_supported_chips` | keys ≡ `{16F877A, 16F18345, 18F45K22}` |
| `test_877a_block_matches_firmware` | FOSC/WDTE/LVP/CP lines present |
| `test_18345_block_is_minimal_safe_set` | 5 lines incl. `RSTOSC = HFINTOSC` |
| `test_18f_block_stays_labeled_starter` | contains `Starter block` (D8 lock) |
| `test_prints_877a_block` | CLI → exit 0 + `FOSC = HS` on stdout |
| `test_rejects_bad_osc` | `--osc NOPE` → exit 2, `ERROR` on **stderr** |
| `test_list_option` | `--list` → exit 0, shows `INT` |

## `test_analyze_log.py` (6)

| Test | Asserts |
|---|---|
| `test_wrapped_logger_format` | fixture → exact 4 tuples (banner + garbage skipped) |
| `test_plain_two_column_format` | tmp `ms,temp` file → exact 2 tuples |
| `test_chart_smoke` | `ascii_chart()` doesn't raise |
| `test_stats_output` | CLI → exit 0 + exact Min/Max/Avg lines |
| `test_missing_file_friendly_error` | → exit 2 + `ERROR` on stderr (was traceback) |
| `test_no_samples_exit_1` | header-only CSV → exit 1 |

## `test_serial_logger.py` (6: 1 guard + 5 conditional)

| Test | Asserts |
|---|---|
| `test_missing_pyserial_friendly_error` | (no-pyserial only) → exit 1 + install hint |
| `test_list_flag` | (pyserial) `--list` → exit 0 |
| `test_missing_port_arg` | (pyserial) no `--port` → exit 2 + `ERROR` |
| `test_bad_port_friendly_error` | (pyserial) fake port → exit 3 + `ERROR` + `--list` hint |
| `test_bad_baud_rejected` | (pyserial) `--baud 0` → exit 2 |
| `test_negative_seconds_rejected` | (pyserial) `--seconds -5` → exit 2 |

Last run: `Ran 26 tests … OK (skipped=5)` — the 5 conditional skips (no pyserial
in sandbox) are expected and documented, not failures.
