# SECURITY

## 1. Threat surface (small, honestly stated)

- **No auth/users/network/cloud** in this topic — nothing to log into, no
  sessions, tokens, cookies, or API keys. Verified: `grep` for credential
  assignments across `.py/.c/.md/.txt` returns zero hits (re-run any time).
- **No secrets in repo, ever.** There is nothing that needs one (local serial
  + local files). If a future integration needs credentials: env vars, never
  committed, documented in [CONFIGURATION](CONFIGURATION.md).

## 2. What IS reviewed

| Area | Status |
|---|---|
| Unsafe input | CLI ints validated (> 0); CSV parse skips garbage; no `eval`/shell (`subprocess` list-form, no `shell=True`) |
| Serial trust | Logger treats the port as untrusted bytes (`errors="replace"`, per-line CSV quoting) — a glitchy device can't inject CSV structure beyond one cell |
| Dependencies | One dep (`pyserial`, stable API); install via pip from PyPI; pin in production if desired |
| Firmware readout | Examples ship `CP = OFF` (dev-friendly); set code protection before any real deployment ([DEPLOYMENT §2](DEPLOYMENT.md)) |
| Logging/PII | Captures contain only sensor text + timestamps; no PII; logs are local-only and git-ignored |
| File writes | Logger overwrites `--out` (documented); path errors → exit 2, no partial-file confusion (header written first, flushed per line) |

## 3. Known limitations

- No encryption/auth on the UART link (physical-access assumption — fine for a
  bench USB cable, not for untrusted links).
- No signature verification of `.hex` (MPLAB/PICkit chain trusted as-is).
