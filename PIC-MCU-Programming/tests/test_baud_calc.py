"""Tests for 05-python-tools/baud_calc.py (pure math + CLI validation)."""

import unittest

from helpers import TOOLS_DIR, load_module, run_cli

baud_calc = load_module("baud_calc", TOOLS_DIR / "baud_calc.py")
SCRIPT = TOOLS_DIR / "baud_calc.py"


class TestSpbrgMath(unittest.TestCase):
    def test_known_good_20mhz_9600_brgh1(self):
        # Must match the firmware constant SPBRG=129 (uart_echo/i2c/temp_logger).
        spbrg, actual, err = baud_calc.spbrg_for(20000000, 9600, 1)
        self.assertEqual(spbrg, 129)
        self.assertAlmostEqual(actual, 9615.38, places=1)
        self.assertAlmostEqual(err, 0.16, places=2)

    def test_brgh0_comparison(self):
        spbrg, _, err = baud_calc.spbrg_for(20000000, 9600, 0)
        self.assertEqual(spbrg, 32)
        self.assertAlmostEqual(err, -1.36, places=2)

    def test_8mhz_115200_is_unreliable(self):
        # Documents real behavior: 8 MHz cannot do 115200 (error > 2%).
        _, _, err = baud_calc.spbrg_for(8000000, 115200, 1)
        self.assertGreater(abs(err), 2.0)

    def test_spbrg_clamps_to_byte(self):
        spbrg, _, _ = baud_calc.spbrg_for(20000000, 100, 1)
        self.assertEqual(spbrg, 255)


class TestCliValidation(unittest.TestCase):
    def test_rejects_zero_baud(self):
        r = run_cli(SCRIPT, "--fosc", "20000000", "--baud", "0")
        self.assertEqual(r.returncode, 2)  # was ZeroDivisionError (E3)

    def test_rejects_negative_inputs(self):
        r = run_cli(SCRIPT, "--fosc", "-1", "--baud", "9600")
        self.assertEqual(r.returncode, 2)
        r = run_cli(SCRIPT, "--fosc", "20000000", "--baud", "-5")
        self.assertEqual(r.returncode, 2)

    def test_all_flag_sweeps(self):
        r = run_cli(SCRIPT, "--fosc", "20000000", "--all")
        self.assertEqual(r.returncode, 0)
        self.assertIn("SPBRG=", r.stdout)


if __name__ == "__main__":
    unittest.main()
