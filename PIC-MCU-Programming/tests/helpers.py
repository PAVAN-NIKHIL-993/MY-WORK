"""Shared helpers for the topic test-suite (stdlib only)."""

import importlib.util
import subprocess
import sys
from pathlib import Path

TOPIC_ROOT = Path(__file__).resolve().parent.parent
TOOLS_DIR = TOPIC_ROOT / "05-python-tools"
PROJECTS_DIR = TOPIC_ROOT / "06-projects"


def load_module(name: str, path: Path):
    """Import a script from an arbitrary path (dirs contain '-', not packages).

    NOTE: do not use for serial_logger when pyserial may be missing — it
    exits(1) at import. Test that script via run_cli() instead.
    """
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def run_cli(script: Path, *args: str) -> subprocess.CompletedProcess:
    """Run a tool exactly as a user would; capture output. No shell."""
    return subprocess.run([sys.executable, str(script), *args],
                          capture_output=True, text=True, timeout=60)
