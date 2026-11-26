# raw_dat_attachments/

This folder is the designated landing zone for binary `.dat` payloads from the full ChatGPT export.

Status (2026-11-26): **no binary `.dat` files were included in the provided export** — only the 15 JSON
metadata files + THIRD_PARTY_NOTICES.txt + export_manifest.json were attached.

- `MANIFEST_MISSING.md` — complete accounting of all 367 `.dat` files listed in `export_manifest.json`:
  which are referenced by conversation transcripts (with folder links) and which are unlinked, each with
  its manifest size and original asset name (from `conversation_asset_file_names.json`).
- SHA-256/MD5 checksums will be computed automatically by `tools/build_archive.py` once the `.dat` files
  are supplied (it copies them here untouched and writes `CHECKSUMS.sha256` / `CHECKSUMS.md5`).

Do not commit copyrighted third-party media manually; keep this folder as the single source of truth for
binary attachments.
