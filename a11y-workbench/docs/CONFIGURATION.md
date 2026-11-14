# Configuration

Everything configurable is either a build-time environment variable or a constant
in `src/config.ts` / `src/styles/tokens.css`. Nothing is read at runtime from a
remote source.

## Environment variables

All are optional, public (`VITE_` prefix ⇒ inlined into the client bundle), and
clamped to a safe range so a bad value degrades to the default.

| Variable | Type | Required | Default | Clamp range | Purpose | Example | Security sensitive |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `VITE_BASE_PATH` | string | no | `/` | — | Base path of the built app | `/my-work/` | no |
| `VITE_MAX_FINDINGS_PER_SCAN` | integer | no | `400` | 20–5000 | Findings kept per scan | `800` | no |
| `VITE_MAX_CAPTURE_KB` | integer | no | `512` | 8–8192 | Max markup per capture (KB) | `1024` | no |
| `VITE_MAX_SCANS_PER_PROJECT` | integer | no | `25` | 1–500 | Retained scans per project | `50` | no |
| `VITE_SOURCEMAP` | string | no | `true` | — | Set `false` to omit `.map` files | `false` | no (but see below) |

**How they are read** (`src/config.ts`):

```ts
function readInt(raw: unknown, fallback: number, min: number, max: number): number {
  const parsed = typeof raw === 'string' && raw.trim() !== '' ? Number.parseInt(raw, 10) : Number.NaN;
  if (Number.isNaN(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}
```

Consequences: `""`, whitespace, `NaN` and non-numeric values fall back; out-of-range
values are clamped (e.g. `VITE_MAX_CAPTURE_KB=0` → 8 KB, not 0, so the app cannot be
made useless by a typo).

**Not secrets.** `VITE_*` values are embedded in the JS bundle and visible to
anyone. There are no API keys, tokens or endpoints in this project.

### Where each value is used

| Variable | Read in | Effect |
| --- | --- | --- |
| `VITE_BASE_PATH` | `vite.config.ts` (`base`) | Asset URLs in `dist/index.html` |
| `VITE_MAX_FINDINGS_PER_SCAN` | `config.ts` → `runAudit` | Findings capped; warning recorded on the scan |
| `VITE_MAX_CAPTURE_KB` | `config.ts` → `validateScanInput`, `CaptureDialog` | Capture rejected above the limit; live budget in the dialog |
| `VITE_MAX_SCANS_PER_PROJECT` | `config.ts` → `createScan` | Oldest scans pruned; warning recorded |
| `VITE_SOURCEMAP` | `vite.config.ts` (`build.sourcemap`) | Whether `.js.map` files are published (1.49 MB of source) |

### Development vs production

| Context | Notes |
| --- | --- |
| Development | `.env.local` (git-ignored) is loaded by Vite; omit it to use defaults |
| CI/build | Set the variables in the build environment before `npm run build` |
| Production runtime | Nothing is read at runtime — the values are baked in at build time |

## Hard-coded constants (`src/config.ts`)

| Constant | Value | Purpose | Change risk |
| --- | --- | --- | --- |
| `APP_NAME` | `a11y-workbench` | Sidebar brand, boundary UI, export footers | Low |
| `APP_VERSION` | `1.0.0` | Shown in Settings and stamped on exports | Low |
| `APP_TAGLINE` | `Accessibility audit workbench` | Available copy | Low |
| `SCHEMA_VERSION` | `3` | Persisted shape | **High** — bump with a migration |
| `STORAGE_KEY` | `a11y-workbench:workspace` | localStorage key | **High** — changing orphans all data |
| `THEME_KEY` | `a11y-workbench:theme` | Theme preference key | Low |
| `LIMITS.maxProjects` | `100` | Workspace cap | Medium (storage size) |
| `LIMITS.maxNoteLength` | `500` | Auditor note cap | Low |
| `LIMITS.maxNameLength` | `120` | Project/scan name cap | Low |
| `LIMITS.maxUrlLength` | `2048` | Captured URL cap | Low |
| `SNIPPET_LENGTH` | `240` | Stored evidence length | Low (perf/storage) |
| `ROUTES` | route paths | Nav and link building | Medium (see router docs) |

## Design tokens (`src/styles/tokens.css`)

| Group | Change risk |
| --- | --- |
| Colours (36 per theme) | **High** — must keep WCAG AA; guarded by `src/test/tokens-contrast.test.ts` |
| Type scale | Medium — affects density and readability |
| Spacing scale | Low |
| Radius / shadows | Low |
| `--touch-target` (44 px) | High — below 44 px fails SC 2.5.8 (AA in 2.2) |

## Engine configuration

The engine has no tunables; behaviour is defined by the 19 rules. Two things look
like configuration but are contracts:

| Item | Contract |
| --- | --- |
| `ENGINE_VERSION` | Bump when findings could change for identical markup |
| `RULES` order | Determines execution order and warning order; keep stable |

## Feature flags

**None.** There are no feature flags, no `localStorage` switches and no
environment-driven UI. This is deliberate: a single-user client app gains nothing
from flag infrastructure, and hidden branches make the test matrix unmanageable.
If a flag is ever needed, add it to `config.ts` as an explicit constant so it is
visible in the bundle rather than fetched.

## Theme

| Setting | Values | Storage |
| --- | --- | --- |
| Appearance | `light` \| `dark` \| `system` | `THEME_KEY` (`system` = key absent) |

Resolved at boot by `lib/theme-init.ts` (no flash) and kept in sync by
`hooks/useTheme.ts` (system media query changes).
