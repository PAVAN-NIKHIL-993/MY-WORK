# Component: baud_calc.py

- **File:** [`05-python-tools/baud_calc.py`](../../05-python-tools/baud_calc.py) (60 lines) · **Module:** [python-tools](../modules/python-tools.md)
- **Purpose:** pre-flash baud validation: SPBRG + actual baud + error% for any Fosc/baud/BRGH; flags error ≥ 2%.
- **Interface:** CLI `--fosc` (req, >0) `--baud` (def 9600, >0) `--brgh` (0/1, def 1) `--all`; exit 0/2. Stdout report + comparison with the other BRGH.
- **Functions:** `spbrg_for(fosc,baud,brgh)→(spbrg,actual,err)` — `round(F/(div·baud))−1`, clamped 0–255. `show(…)` — prints `[OK ]/[WARN]` + hint. `main()` — argparse + positive-int validation.
- **Deps:** stdlib `argparse` only. **Consumers:** humans; tests (`test_baud_calc`: 129-case ≡ firmware const, BRGH0, 8M/115200 WARN, clamp, CLI rejections).
- **State:** none. **Errors:** non-positive inputs → argparse exit 2 (was `ZeroDivisionError` — fixed E3).
- **Perf:** trivial. **Security:** ints only, no I/O, no risk.
- **Failure modes:** none at runtime (pure math). **Debug:** `--all` sweep shows the landscape.
- **Risks:** LOW — formula change must match datasheet + firmware + tests simultaneously.
