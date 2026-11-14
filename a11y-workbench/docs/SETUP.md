# Setup

From a fresh clone to a running app in three commands.

## Prerequisites

| Requirement | Version | Check |
| --- | --- | --- |
| Node.js | ≥ 20.19 (22 LTS recommended) | `node --version` |
| npm | ≥ 10 | `npm --version` |
| Git | any recent | `git --version` |

No database, no Docker, no API keys, no system libraries. The project has no
native dependencies, so no compiler toolchain is needed.

## Install

```bash
git clone https://github.com/PAVAN-NIKHIL-993/MY-WORK.git
cd MY-WORK/a11y-workbench
npm install
```

`npm install` resolves from `package-lock.json`; the verified tree is 468
packages.

## Run in development

```bash
npm run dev
```

Expected output:

```
VITE v7.3.8  ready in ~150 ms
➜  Local:   http://localhost:5173/
➜  Network: http://<lan-ip>:5173/
```

Open `http://localhost:5173/`. The dev server binds `0.0.0.0` (so it also works
behind a proxy or from another device on the LAN) and does not restrict hostnames.

## First-run checklist

1. The overview shows **"Start your first accessibility audit"** and a four-step
   onboarding card — this confirms the app rendered and storage is empty.
2. `Projects → New project` → name it → the card appears with a "No scans" badge.
3. Open the project → `Capture page` → click **Failing page** → **Run audit**.
4. The scan detail shows ~20 findings across severities, with a warning-free
   summary. Click a finding's "Evidence and remediation" to see the captured
   element.
5. Change one finding's status to *Fixed* → the badge updates → Settings shows the
   stored bytes increase.
6. `Reports → Open report` → `Download HTML` produces a file you can open offline.

If any step fails, see [`TROUBLESHOOTING.md`](TROUBLESHOOTING.md).

## Verify the toolchain

```bash
npm run typecheck   # tsc --noEmit
npm run lint        # eslint .
npm test            # 242 tests
npm run build       # typecheck + vite build → dist/
```

All four should pass on a clean clone. `npm run verify` runs them in order.

## Optional configuration

```bash
cp .env.example .env.local
# edit VITE_MAX_CAPTURE_KB etc., then restart the dev server
```

See [`CONFIGURATION.md`](CONFIGURATION.md). There are no secrets to configure.

## Production build locally

```bash
npm run build
npm run preview     # serves dist/ on http://localhost:4173/
```

## Editor setup

* **VS Code**: install ESLint and TypeScript extensions; the flat config is picked
  up automatically. No workspace settings file is committed on purpose (editor
  preferences are personal).
* **Path alias**: `@/` maps to `src/` in both TypeScript and Vite. If an editor
  cannot resolve it, reload the TS server (`TypeScript: Restart TS Server`).
