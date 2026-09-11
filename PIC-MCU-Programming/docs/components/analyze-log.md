# Component: analyze_log.py

- **File:** [`06-projects/analyze_log.py`](../../06-projects/analyze_log.py) (~90 lines) · **Module:** [capstone-system](../modules/capstone-system.md)
- **Purpose:** CSV → samples/duration/min/max/avg + downsampled ASCII chart. Reads wrapped logger CSVs AND plain `ms,temp` files.
- **Interface:** CLI `analyze_log.py <csvfile>`; exit 0/1/2; report to stdout, errors to stderr.
- **Functions:** `parse_rows(path)→list[(int,float)]` — `row[-1]` if ≥3 cols else joined row, split `,`, int+float or skip (header/banner/garbage indistinguishable = all safe to skip). `ascii_chart(pts,width=48,height=10)` — column downsample, `#` rendering. `main()` — `FileNotFoundError/OSError`→exit 2 (fixed E4), zero samples→exit 1, else stats.
- **Deps:** stdlib (`argparse/csv/sys`); full type hints. **Consumers:** humans; tests (`sample_temp.csv` asserts exact tuples + stats + exits).
- **State:** none (reads file fresh each run). **Perf:** all-samples-in-RAM (~MBs per 100k rows — fine; split beyond ~1 M lines).
- **Failure modes:** exit 1 (logged a non-CSV stream — `head` the file); exit 2 (bad path).
- **Debug:** `head` CSV → confirm numeric `ms,temp` lines exist.
- **Risks:** LOW — format support change needs fixture + tests + [schema](../database/schema.md) updated together.
