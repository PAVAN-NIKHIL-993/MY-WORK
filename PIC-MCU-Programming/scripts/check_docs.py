#!/usr/bin/env python3
"""check_docs.py — verify docs links + referenced sources exist (stdlib only).

Usage:
    python scripts/check_docs.py            (from PIC-MCU-Programming/)
    python scripts/check_docs.py --strict   (unreferenced sources also fail)

Checks:
  FAIL: relative Markdown link whose target file does not exist.
  WARN: .c/.py source file referenced by no document (--strict makes it fail).
Exit code: 0 pass · 1 fail.
"""

import argparse
import re
import sys
from pathlib import Path

LINK_RE = re.compile(r"\[[^\]]*\]\(([^)\s]+)\)")
ROOT = Path(__file__).resolve().parent.parent
SOURCE_SUFFIXES = {".c", ".py"}


def iter_links(md: Path):
    for m in LINK_RE.finditer(md.read_text(encoding="utf-8")):
        target = m.group(1).split("#")[0].strip()
        if not target or target.startswith(("http://", "https://",
                                            "mailto:", "#")):
            continue
        yield target


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(
        description="Verify docs links + referenced sources exist.")
    ap.add_argument("--strict", action="store_true",
                    help="unreferenced sources also fail")
    strict = ap.parse_args(argv).strict
    failures: list[str] = []
    warnings: list[str] = []
    referenced: set[str] = set()

    md_files = sorted(ROOT.rglob("*.md"))
    for md in md_files:
        for target in iter_links(md):
            resolved = (md.parent / target).resolve()
            try:
                rel = resolved.relative_to(ROOT)
            except ValueError:
                failures.append(f"{md.relative_to(ROOT)} -> {target} "
                                f"(escapes topic root!)")
                continue
            referenced.add(rel.as_posix())
            if not resolved.exists():
                failures.append(f"{md.relative_to(ROOT)} -> {target} (missing)")

    for src in sorted(ROOT.rglob("*")):
        if src.suffix in SOURCE_SUFFIXES and src.is_file():
            rel = src.relative_to(ROOT).as_posix()
            if rel not in referenced and "tests/" not in rel \
                    and "scripts/" not in rel:
                warnings.append(f"unreferenced source: {rel}")

    print(f"checked {len(md_files)} markdown files, "
          f"{len(referenced)} link targets")
    for w in warnings:
        print(f"WARN: {w}")
    for f in failures:
        print(f"FAIL: {f}")
    if failures or (strict and warnings):
        return 1
    print("docs check: PASS")
    return 0


if __name__ == "__main__":
    sys.exit(main())
