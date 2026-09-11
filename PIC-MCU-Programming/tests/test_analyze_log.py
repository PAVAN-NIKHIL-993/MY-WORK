"""Tests for 06-projects/analyze_log.py (CSV parsing + CLI)."""

import tempfile
import unittest
from pathlib import Path

from helpers import PROJECTS_DIR, TOPIC_ROOT, load_module, run_cli

analyze_log = load_module("analyze_log", PROJECTS_DIR / "analyze_log.py")
SCRIPT = PROJECTS_DIR / "analyze_log.py"
SAMPLE = TOPIC_ROOT / "tests" / "data" / "sample_temp.csv"


class TestParseRows(unittest.TestCase):
    def test_wrapped_logger_format(self):
        pts = analyze_log.parse_rows(str(SAMPLE))
        self.assertEqual(pts, [(500, 27.3), (1000, 27.5),
                               (1500, 28.1), (2000, 31.2)])

    def test_plain_two_column_format(self):
        with tempfile.NamedTemporaryFile("w", suffix=".csv",
                                         delete=False) as f:
            f.write("ms,temp\n0,25.0\n500,26.5\n")
            path = f.name
        try:
            self.assertEqual(analyze_log.parse_rows(path),
                             [(0, 25.0), (500, 26.5)])
        finally:
            Path(path).unlink()

    def test_chart_smoke(self):
        # Must not raise on real data (visual output, not asserted).
        analyze_log.ascii_chart([(0, 25.0), (500, 26.5)])


class TestCli(unittest.TestCase):
    def test_stats_output(self):
        r = run_cli(SCRIPT, str(SAMPLE))
        self.assertEqual(r.returncode, 0)
        for want in ("Samples : 4", "Min     : 27.3 C",
                     "Max     : 31.2 C", "Average : 28.5 C"):
            self.assertIn(want, r.stdout)

    def test_missing_file_friendly_error(self):
        r = run_cli(SCRIPT, str(TOPIC_ROOT / "tests" / "nope.csv"))
        self.assertEqual(r.returncode, 2)  # was raw traceback (E4)
        self.assertIn("ERROR", r.stderr)

    def test_no_samples_exit_1(self):
        with tempfile.NamedTemporaryFile("w", suffix=".csv",
                                         delete=False) as f:
            f.write("pc_time_iso,elapsed_s,raw_line\n")
            path = f.name
        try:
            r = run_cli(SCRIPT, path)
            self.assertEqual(r.returncode, 1)
        finally:
            Path(path).unlink()


if __name__ == "__main__":
    unittest.main()
