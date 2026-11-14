# Deployment

The output is a folder of static files. Any static host works — no server runtime,
no database, no environment configuration at run time.

## Prerequisites

```bash
npm ci
npm run verify      # typecheck, lint, 242 tests, build
ls dist/            # index.html + assets/
```

## Publishing options

### GitHub Pages

```bash
VITE_BASE_PATH=/<repo-name>/ npm run build
# then publish dist/ to the gh-pages branch, or use actions/deploy-pages
```

**Important for Pages:** the app uses hash routing, so no SPA rewrite rule is
needed and deep links work (`#/projects/prj_…` is a fragment). This is exactly why
hash routing was chosen (ADR-003).

### Netlify / Vercel / Cloudflare Pages

| Setting | Value |
| --- | --- |
| Build command | `npm ci && npm run build` |
| Publish directory | `dist` |
| Node version | 20.19+ |
| Environment variables | none required |
| Rewrites | none (hash routing) |
| SPA fallback | not required — `index.html` is served for `/`, all other views are fragments |

### Any web server (nginx)

```nginx
server {
  listen 80;
  root /var/www/a11y-workbench;
  index index.html;

  # No SPA fallback needed: routing is client-side via the fragment.

  # Long cache for hashed assets, short for the entry HTML.
  location /assets/ {
    add_header Cache-Control "public, max-age=31536000, immutable";
  }

  location = /index.html {
    add_header Cache-Control "no-cache";
  }

  # Optional hardening (see Security)
  add_header X-Content-Type-Options "nosniff" always;
  add_header Referrer-Policy "strict-origin-when-cross-origin" always;
  add_header X-Frame-Options "SAMEORIGIN" always;

  gzip on;
  gzip_types text/css application/javascript application/json image/svg+xml;
}
```

### Offline / air-gapped use

Copy `dist/` to a USB stick and open `index.html` directly.

**Caveat:** `file://` gives each page an opaque origin, and `localStorage` may be
unavailable or non-persistent. The app detects this and states that changes will
not be saved. For a proper offline install, serve the folder with any static server
on `localhost` (e.g. `npx serve dist`), which gives a real origin and working
storage.

## Release checklist

| # | Step |
| --- | --- |
| 1 | `npm run verify` passes |
| 2 | Update `APP_VERSION` in `src/config.ts` and `package.json`; add a CHANGELOG entry |
| 3 | Bump `SCHEMA_VERSION` if the persisted shape changed, with a migration |
| 4 | Bump `ENGINE_VERSION` if rule behaviour changed |
| 5 | Run the manual demo path (SETUP.md → first-run checklist) against the **preview** build |
| 6 | Build with the correct `VITE_BASE_PATH` for the target host |
| 7 | Upload, then verify: fresh load, dark theme, sample audit, export, reload persistence |
| 8 | Decide on source maps: they are **on by default** (1.49 MB, full source). Set `VITE_SOURCEMAP=false` if publishing source is not acceptable |

## Rollback

Static hosts keep previous deployments. Serve the prior `dist/`; no data migration
is required to roll back *code*, but be careful with `SCHEMA_VERSION`:

| Rollback across | Effect |
| --- | --- |
| Same schema version | Safe |
| Newer → older schema | Older app may drop fields it does not know; it warns, and does not crash |

Because data lives in the user's browser, a rollback cannot restore data that a
newer version already trimmed. Export a backup before deploying a schema bump.

## Post-deployment verification

```bash
curl -sI https://<host>/ | head -5                 # 200, content-type text/html
curl -s https://<host>/ | grep -o 'assets/[^"]*'   # hashed assets
```

Then in a browser: load, audit a sample, reload (data persists), open a report,
toggle theme, resize to 360 px wide.

## Known deployment limitations

| Limitation | Impact | Mitigation |
| --- | --- | --- |
| Storage is per origin | Moving hosts loses the workspace | Export/import backup |
| Safari clears site data after ~7 days of inactivity | Workspace disappears | Backup reminders in Settings |
| No CSP applied by the build | A host-level CSP is recommended | See SECURITY.md for a tested policy |
| `file://` origins | Storage unreliable | Serve over HTTP |
| No multi-tab sync | Two tabs overwrite each other | Use one tab, or accept last-write-wins |
