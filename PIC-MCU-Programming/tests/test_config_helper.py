"""Tests for 05-python-tools/config_helper.py (blocks + CLI)."""

import unittest

from helpers import TOOLS_DIR, load_module, run_cli

config_helper = load_module("config_helper", TOOLS_DIR / "config_helper.py")
SCRIPT = TOOLS_DIR / "config_helper.py"


class TestBlocks(unittest.TestCase):
    def test_supported_chips(self):
        self.assertEqual(set(config_helper.BLOCKS),
                         {"16F877A", "16F18345", "18F45K22"})

    def test_877a_block_matches_firmware(self):
        block = "\n".join(config_helper.BLOCKS["16F877A"]["block"]).format(osc="HS")
        for line in ("#pragma config FOSC = HS", "#pragma config WDTE = OFF",
                     "#pragma config LVP = OFF", "#pragma config CP = OFF"):
            self.assertIn(line, block)

    def test_18345_block_is_minimal_safe_set(self):
        block = config_helper.BLOCKS["16F18345"]["block"]
        self.assertEqual(len(block), 5)
        self.assertTrue(any("RSTOSC = HFINTOSC" in l for l in block))

    def test_18f_block_stays_labeled_starter(self):
        block = "\n".join(config_helper.BLOCKS["18F45K22"]["block"])
        self.assertIn("Starter block", block)  # must never look verified (E6)


class TestCli(unittest.TestCase):
    def test_prints_877a_block(self):
        r = run_cli(SCRIPT, "--chip", "16F877A", "--osc", "HS")
        self.assertEqual(r.returncode, 0)
        self.assertIn("#pragma config FOSC = HS", r.stdout)

    def test_rejects_bad_osc(self):
        r = run_cli(SCRIPT, "--chip", "16F877A", "--osc", "NOPE")
        self.assertEqual(r.returncode, 2)
        self.assertIn("ERROR", r.stderr)

    def test_list_option(self):
        r = run_cli(SCRIPT, "--chip", "16F18345", "--list")
        self.assertEqual(r.returncode, 0)
        self.assertIn("INT", r.stdout)


if __name__ == "__main__":
    unittest.main()
