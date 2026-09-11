"""Live tests for serial_logger.py via pyserial URLs (no hardware needed).

A stdlib TCP server feeds lines to the logger through a socket:// URL:
proves the real read→parse→CSV→console loop. Skipped cleanly when pyserial
is missing; the /dev/full case additionally needs Linux.
"""

import csv
import importlib.util
import os
import socket
import tempfile
import threading
import time
import unittest

from helpers import TOOLS_DIR, run_cli

SCRIPT = TOOLS_DIR / "serial_logger.py"
HAS_PYSERIAL = importlib.util.find_spec("serial") is not None
HAS_DEV_FULL = os.path.exists("/dev/full")


def _start_server(lines, hold=0.15, linger=4.0):
    """Serve `lines` once over TCP; return the port. Daemon thread."""
    srv = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    srv.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    srv.bind(("127.0.0.1", 0))
    srv.listen(1)
    port = srv.getsockname()[1]

    def _run():
        try:
            conn, _ = srv.accept()
            with conn:
                for ln in lines:
                    conn.sendall(ln.encode("utf-8"))
                    time.sleep(hold)
                time.sleep(linger)
        except OSError:
            pass
        finally:
            try:
                srv.close()
            except OSError:
                pass

    threading.Thread(target=_run, daemon=True).start()
    return port


@unittest.skipUnless(HAS_PYSERIAL, "needs pyserial (no hardware needed)")
class TestLiveCapture(unittest.TestCase):
    def test_socket_capture_end_to_end(self):
        port = _start_server(["t_ms,temp_c\r\n", "500,27.3\r\n",
                              "1000,27.5\r\n"])
        with tempfile.TemporaryDirectory() as d:
            out = os.path.join(d, "cap.csv")
            r = run_cli(SCRIPT, "--port", f"socket://127.0.0.1:{port}",
                        "--baud", "9600", "--out", out, "--seconds", "3")
            self.assertEqual(r.returncode, 0, msg=r.stderr)
            with open(out, newline="", encoding="utf-8") as f:
                rows = list(csv.reader(f))
        self.assertEqual(rows[0], ["pc_time_iso", "elapsed_s", "raw_line"])
        self.assertEqual([row[2] for row in rows[1:]],
                         ["t_ms,temp_c", "500,27.3", "1000,27.5"])
        self.assertIn("Saved 3 lines", r.stdout)

    @unittest.skipUnless(HAS_DEV_FULL, "needs /dev/full (Linux)")
    def test_write_failure_midrun(self):
        port = _start_server(["500,27.3\r\n"])
        r = run_cli(SCRIPT, "--port", f"socket://127.0.0.1:{port}",
                    "--baud", "9600", "--out", "/dev/full",
                    "--seconds", "5")
        self.assertEqual(r.returncode, 1)
        self.assertIn("ERROR", r.stderr)
        self.assertIn("write", r.stderr)


if __name__ == "__main__":
    unittest.main()
