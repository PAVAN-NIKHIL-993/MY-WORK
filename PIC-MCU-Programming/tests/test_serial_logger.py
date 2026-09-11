"""Tests for 05-python-tools/serial_logger.py (CLI only, no hardware).

Live port tests are skipped when pyserial is unavailable — a missing
optional dependency must skip, never fail (see TESTING.md).
"""

import importlib.util
import unittest

from helpers import TOOLS_DIR, run_cli

SCRIPT = TOOLS_DIR / "serial_logger.py"
HAS_PYSERIAL = importlib.util.find_spec("serial") is not None


class TestDependencyGuard(unittest.TestCase):
    @unittest.skipIf(HAS_PYSERIAL, "pyserial installed: guard not exercised")
    def test_missing_pyserial_friendly_error(self):
        r = run_cli(SCRIPT, "--list")
        self.assertEqual(r.returncode, 1)
        self.assertIn("pyserial", r.stderr)


@unittest.skipUnless(HAS_PYSERIAL, "needs pyserial (no hardware needed)")
class TestCliValidation(unittest.TestCase):
    def test_list_flag(self):
        r = run_cli(SCRIPT, "--list")
        self.assertEqual(r.returncode, 0)

    def test_missing_port_arg(self):
        r = run_cli(SCRIPT)
        self.assertEqual(r.returncode, 2)
        self.assertIn("ERROR", r.stderr)

    def test_bad_port_friendly_error(self):
        r = run_cli(SCRIPT, "--port", "DEF_NOT_A_PORT_XYZ", "--baud", "9600")
        self.assertEqual(r.returncode, 3)  # was raw traceback (E1)
        self.assertIn("ERROR", r.stderr)
        self.assertIn("--list", r.stderr)

    def test_bad_baud_rejected(self):
        r = run_cli(SCRIPT, "--port", "X", "--baud", "0")
        self.assertEqual(r.returncode, 2)

    def test_negative_seconds_rejected(self):
        r = run_cli(SCRIPT, "--port", "X", "--seconds", "-5")
        self.assertEqual(r.returncode, 2)


if __name__ == "__main__":
    unittest.main()
