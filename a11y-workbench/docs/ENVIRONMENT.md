# Environment

What the app requires from the environment it runs in, and what each environment is
used for.

## Supported runtimes

| Environment | Version | Status |
| --- | --- | --- |
| Node.js | ≥ 20.19 | Supported (development/build) |
| Node.js | 22 LTS | **Verified** — all 242 tests, build, lint, typecheck |
| Node.js | 24 | Expected to work (not verified in this environment) |
| Browsers | Last 2 versions of Chrome, Edge, Firefox, Safari | Expected; only jsdom verified |
| Internet Explorer | any | **Not supported** (ES2022 output, CSS custom properties) |

## Runtime environments

| Environment | URL | Command | Data | Purpose |
| --- | --- | --- | --- | --- |
| Development | `http://localhost:5173/` | `npm run dev` | Real `localStorage` of that origin | Local feature work; HMR |
| Preview | `http://localhost:4173/` | `npm run build && npm run preview` | Separate origin ⇒ separate storage | Verify the production bundle |
| Production | static host | `npm run build` + upload `dist/` | Per-origin `localStorage` | Real use |
| Test | jsdom | `npm test` | Cleared per test | Automated verification |

**Storage is per origin.** `localhost:5173`, `localhost:4173` and the deployed site
each have their own workspace. Moving data between them requires a backup file
(Settings → Export backup).

## Build-time environment

| Variable | Effect | Default |
| --- | --- | --- |
| `NODE_ENV` | Set by Vite to `production` for `build` | — |
| `VITE_BASE_PATH` | Asset base path | `/` |
| `VITE_MAX_*` | Limits (see CONFIGURATION.md) | see table there |

## Browser platform requirements

| Feature | Needed for | Fallback |
| --- | --- | --- |
| ES2022 modules | Loading the app | None (target is ES2022; verified in `vite.config.ts` build target) |
| CSS custom properties | Theming | None — the UI depends on tokens |
| `localStorage` | Persistence | App runs in memory and says so |
| `DOMParser` | Auditing | Audit returns a warning |
| `matchMedia` | System theme | Treated as light |

Full matrix in [`api/browser-apis.md`](api/browser-apis.md).

## Network requirements

| Phase | Network needed |
| --- | --- |
| `npm install` | Yes (npm registry) |
| `npm run dev/build/test` | No (after install) |
| **Running the app** | **No** — zero runtime requests |
| Using the app offline | Works (static files served from cache/disk) |

This is verifiable: the production bundle contains no `fetch`, no `XMLHttpRequest`
and no absolute `http(s)://` reference other than in inline SVG namespaces.

## Filesystem and permissions

| Path | Written by | Notes |
| --- | --- | --- |
| `node_modules/` | `npm install` | Git-ignored |
| `dist/` | `npm run build` | Git-ignored; upload this |
| `coverage/` | `npm run test:coverage` | Git-ignored |
| `.env.local` | developer | Git-ignored — but there are no secrets to put in it |

No global installs, no elevated permissions, no daemons.

## Version pinning

| Item | Policy |
| --- | --- |
| Runtime deps | Exact versions in `package.json` (`react@19.3.1`, `react-dom@19.3.1`) |
| Dev deps | Exact versions, except `@types/*` and `eslint-plugin-*` which are tilde-pinned |
| Lockfile | `package-lock.json` committed — 468 entries |
| Node engine | Declared in `package.json` (`>=20.19.0`) |

No `^` ranges on the two runtime dependencies: a React minor must be a deliberate
change, not an accident of `npm install`.

## CI expectations

Any CI runner must provide Node ≥ 20.19 and run:

```bash
npm ci
npm run verify
```

No additional services, no browser download, no environment variables.
