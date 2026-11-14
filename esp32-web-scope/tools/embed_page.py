#!/usr/bin/env python3
"""Regenerate firmware/esp32_web_scope/web_ui.cpp from the source page.

The dashboard is authored as test/dashboard_preview.html and shipped to the
device inside a C++ raw string literal. Keeping those two in step by hand is the
kind of bookkeeping that silently drifts, so it is a script, and `make embedded`
fails if the committed copy does not match the page.

Usage:
    python3 tools/embed_page.py            # regenerate
    python3 tools/embed_page.py --check    # exit 1 if out of date
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PAGE = ROOT / "test" / "dashboard_preview.html"
OUT = ROOT / "firmware" / "esp32_web_scope" / "web_ui.cpp"
DELIM = "HTMLPAGE"

HEADER = """// ---------------------------------------------------------------------------
// web_ui.cpp - the dashboard HTML, stored in flash.
//
// GENERATED FILE - do not edit. Source: test/dashboard_preview.html
// Regenerate with:  python3 tools/embed_page.py
//
// The page is embedded as a raw string literal so no escaping is needed and what
// the device serves is byte-for-byte the page that was tested.
//
// test/test_embedded_ui.cpp compiles this file on the host and checks that the
// page survived embedding, so a broken literal cannot reach the device.
// ---------------------------------------------------------------------------
#include "web_ui.h"

const char kIndexHtml[] PROGMEM = R"DELIM("""


def build(page: str) -> str:
    if f"){DELIM}" in page:
        raise SystemExit(
            f"the page contains the raw-string delimiter ){DELIM}; "
            "change DELIM in tools/embed_page.py"
        )
    header = HEADER.replace("DELIM", DELIM)
    return header + page + f"){DELIM}\";\n"


def main() -> int:
    check = "--check" in sys.argv[1:]
    page = PAGE.read_text(encoding="utf-8")
    expected = build(page)

    if check:
        actual = OUT.read_text(encoding="utf-8") if OUT.exists() else ""
        if actual != expected:
            print(
                "web_ui.cpp is out of date with test/dashboard_preview.html.\n"
                "Run: python3 tools/embed_page.py"
            )
            return 1
        print("web_ui.cpp is in sync with the page")
        return 0

    OUT.write_text(expected, encoding="utf-8")
    print(f"wrote {OUT.relative_to(ROOT)} ({len(page)} bytes of page)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
