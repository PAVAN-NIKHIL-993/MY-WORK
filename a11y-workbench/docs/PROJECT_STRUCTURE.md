# Project structure

Directory by directory, then file by file. "Significant file" means a file a
maintainer will need to open; test files are grouped per suite rather than
repeated in full (see [`TESTING.md`](TESTING.md) for the per-file test map).

---

## Top level

```
a11y-workbench/
├── index.html
├── package.json
├── package-lock.json
├── vite.config.ts
├── tsconfig.json
├── eslint.config.js
├── .env.example
├── .gitignore
├── README.md
├── public/
├── src/
└── docs/
```

### Directory: `/` (project root)

**Purpose.** Build tooling, dependency manifest and the SPA host document.
**Belongs here.** Configuration that a tool expects at the root.
**Does not belong here.** Application source (that is `src/`), documentation
(`docs/`), generated output (`dist/`, `coverage/` — both git-ignored).

| File | Purpose |
| --- | --- |
| `index.html` | The only HTML the toolchain ships. Provides `<div id="root">`, the meta description, `color-scheme`, favicon link and a `<noscript>` message. Loads `/src/main.tsx`. No application markup is here, by design: all UI is React. |
| `package.json` | Scripts (`dev`, `build`, `preview`, `typecheck`, `lint`, `test`, `test:coverage`, `verify`), pinned dependencies, `engines.node >= 20.19`. |
| `package-lock.json` | Exact resolved tree (468 entries). Commit it; the build is reproducible from it. |
| `vite.config.ts` | React plugin, `@` → `src` alias, dev/preview servers bound to `0.0.0.0` with `allowedHosts: true` (required for proxied previews), build target `es2022`, sourcemaps on, and the **Vitest** block (jsdom, globals, setup file, coverage config). |
| `tsconfig.json` | `strict`, `noUnusedLocals`, `noUnusedParameters`, `noUncheckedIndexedAccess`, `noEmit`, `jsx: react-jsx`, path `@/*`. |
| `eslint.config.js` | Flat config: `@eslint/js`, `typescript-eslint`, `react-hooks`, **`jsx-a11y`**, plus `no-console` (warn/error only), `no-explicit-any`, `eqeqeq`, `prefer-const`. |
| `.env.example` | The four `VITE_*` variables with defaults and explanations. |
| `.gitignore` | `node_modules`, `dist`, `coverage`, `.env*`, editor/OS noise, caches. |
| `README.md` | Product entry point and documentation index (see the root file). |

### `public/`

**Purpose.** Files copied verbatim to `dist/` by Vite.
**Contains.** `favicon.svg` — the app mark (inline SVG, decorative `role="img"`,
no external request).

---

## `src/` — application source

### `src/types/`

**Architectural role.** The domain model; the bottom of the dependency graph.
Nothing here imports anything, so every other layer can depend on it.

| File | Purpose |
| --- | --- |
| `domain.ts` | All persisted and engine types: `Severity`, `WcagLevel`, `FindingStatus`, `Project`, `EngineFinding`, `Finding`, `ScanSummary`, `Scan`, `Workspace`, `RuleDescriptor`, `EngineResult`. Also exports the label maps (`SEVERITY_LABEL`, `FINDING_STATUS_LABEL`), `SEVERITY_ORDER` and `RESOLVED_STATUSES` so ordering and wording cannot drift between UI, selectors and exports. |
| `jsx.d.ts` | Bridges the React 19 `JSX` namespace so components can declare `(): JSX.Element` without importing React. Declares only `Element`. |

**What could break.** Adding/changing a field in `domain.ts` is a persisted-data
change. `storage/schema.ts` normalises unknown shapes, so old documents will not
crash — but the new field must also be handled in `normalizeScan`/`normalizeFinding`
or it will be silently dropped on load.

### `src/config.ts`

**Purpose.** Single source of truth for constants, limits and build-time env.
**Exports.** `APP_NAME`, `APP_VERSION`, `APP_TAGLINE`, `SCHEMA_VERSION` (3),
`STORAGE_KEY`, `THEME_KEY`, `LIMITS` (clamped numbers), `SNIPPET_LENGTH`,
`ROUTES`/`RouteName`.
**Dependencies.** `import.meta.env` only.
**Consumers.** Nearly everything.
**Important behaviour.** `readInt` clamps each `VITE_*` value into a safe range,
so a malformed environment value degrades to the default instead of disabling
the app (e.g. `VITE_MAX_CAPTURE_KB=0` becomes 8 KB, not 0).
**Modification risk.** Changing `STORAGE_KEY` orphans existing data; changing
`SCHEMA_VERSION` without a migration path drops data. See
[`CONFIGURATION.md`](CONFIGURATION.md).

### `src/lib/` — pure utilities

| File | Purpose | Key exports |
| --- | --- | --- |
| `dom.ts` | The security boundary and the DOM performance layer. Parses markup into an inert document; computes accessible names, selectors, snippets, hidden state. | `parseMarkup`, `escapeHtml`, `normalizeWhitespace`, `isHiddenFromAT`, `buildSelector`, `snippetOf`, `queryAll`, `isNativelyFocusable`, `textOf`, `accessibleName`, `visibleText`, `attributesOf`, `resetDomCaches` |
| `color.ts` | Colour parsing and WCAG contrast maths; no DOM dependency. | `parseColor`, `toHex`, `relativeLuminance`, `contrastRatio`, `assessContrast`, `colorFromStyle`, `AA_THRESHOLDS`, `AAA_THRESHOLDS` |
| `format.ts` | Locale-explicit formatting so UI text and exports are deterministic. | `formatDate`, `formatDateTime`, `pluralize`, `percent`, `truncate`, `byteLength`, `formatBytes`, `hostnameOf` |
| `id.ts` | Prefixed ids with `crypto.randomUUID` and a fallback. | `createId` |
| `download.ts` | Blob download helper, keeping exporters pure. | `downloadTextFile`, `fileSlug` |
| `theme-init.ts` | Boot-time theme application (imported for side effects before render). | — |

`dom.ts` carries three caches (`hiddenCache`, `labelForCache`,
`formControlLabelCache`) added after measuring quadratic behaviour — see
[`PERFORMANCE.md`](PERFORMANCE.md). They are safe because the engine treats
parsed documents as immutable; `resetDomCaches()` exists for tests that mutate a
fixture.

### `src/engine/` — the audit engine

| File | Purpose |
| --- | --- |
| `types.ts` | `RuleContext` and the `Rule` contract (`RuleDescriptor` + `evaluate`). |
| `finding.ts` | `violation(rule, input)` builds every `EngineFinding`; `sortFindings` gives deterministic output ordering. |
| `audit.ts` | `runAudit(markup)` — the public entry point. Parses, runs every rule with per-rule isolation, caps and sorts output, builds the summary. Exports `ENGINE_VERSION`. |
| `rules/index.ts` | The rule registry (order is a product contract) and `RULE_DESCRIPTORS` for the UI. |
| `rules/shared.ts` | `isAuditable`, `auditable`, and the selectors/type-sets rules share, so all rules agree on what "hidden" and "interactive" mean. |
| `rules/*.ts` | One file per rule or rule family (19 rules total): `image-alt`, `button-name`, `link-name`, `label`, `heading-order`, `document-lang`, `page-title`, `list-structure`, `contrast-style`, `structure` (7 rules), `aria` (3 rules). |

Module documentation with per-rule semantics:
[`modules/audit-engine.md`](modules/audit-engine.md).

### `src/storage/` — persistence

| File | Purpose |
| --- | --- |
| `schema.ts` | `emptyWorkspace`, `migrateWorkspace(raw)` → `{ workspace, repairs, reset }`, per-record normalisers, `isEngineFinding`. Never throws. |
| `local-store.ts` | `loadWorkspace`, `saveWorkspace`, `clearWorkspace`, `measureStoredBytes`. Owns the availability probe and the typed failure reasons (`quota`, `unavailable`, `unknown`). |
| `backup.ts` | `createBackup`, `serializeBackup`, `parseBackup`, `downloadBackup`. Import validation reuses `migrateWorkspace`. |
| `repository.ts` | The only write path: `createProject`, `updateProject`, `deleteProject`, `createScan`, `deleteScan`, `updateFinding`, `bulkUpdateFindings`, `replaceWorkspace`, `resetWorkspace`, plus the shared validators and `projectPath`/`evidenceLabel`. |

Module documentation: [`modules/storage-repository.md`](modules/storage-repository.md).

### `src/state/` — application state and routing

| File | Purpose |
| --- | --- |
| `workspace-context.tsx` | `WorkspaceProvider` + `useWorkspace()`. Holds workspace, load warnings, persistence error, stored bytes and the toast queue; wraps every mutation so a failed save is never silent. |
| `selectors.ts` | All derived data: severity/status counts, `workspaceStats`, `latestScanByProject`, `aggregateByRule`, `buildConformance`, `severityTrend`, `searchFindings`. |
| `router.ts` | `parseHash`, `useRoute`, `navigate`, `paths`. Route grammar documented in the file header. |

### `src/hooks/`

| File | Purpose |
| --- | --- |
| `useTheme.ts` | `light`/`dark`/`system` preference, persisted under `THEME_KEY`, applied to `<html data-theme>`, listens to the system media query. |

### `src/components/`

| Path | Purpose |
| --- | --- |
| `ui/Button.tsx` | Button primitive. Defaults `type="button"`; `iconOnly` **requires** an `aria-label` at the type level. |
| `ui/Icon.tsx` | ~30 inline SVG glyphs behind a name union; always `aria-hidden` + `focusable="false"`. |
| `ui/Badge.tsx` | `Badge`, `SeverityBadge`, `WcagBadge`, `StatusBadge`, `SeverityBreakdown` — always text + colour, never colour alone. |
| `ui/Card.tsx` | `Card`, `CardHeader`, `CardTitle` (as heading), `CardBody`, `CardFooter`. Region labelling via `ariaLabelledBy`. |
| `ui/Field.tsx` | Label/hint/error wiring through a render prop; guarantees `aria-describedby`/`aria-invalid`. |
| `ui/Modal.tsx` | Accessible dialog: `role="dialog"`, `aria-modal`, Escape/backdrop close, focus trap, focus restore, scroll lock. |
| `ui/Feedback.tsx` | `EmptyState`, `Alert`, `Skeleton`, `PageHeader` (the only `h1` per screen). |
| `ui/ToastRegion.tsx` | Live region for toasts; assertive when any toast is an error. |
| `layout/AppShell.tsx` | Sidebar nav (two labelled groups), top bar, mobile off-canvas menu with scrim, skip link. |
| `layout/ErrorBoundary.tsx` | Class boundary that renders a recoverable screen plus the technical stack in a `<details>`. |

Component documentation: [`components/ui-primitives.md`](components/ui-primitives.md),
[`components/app-shell.md`](components/app-shell.md).

### `src/features/` — one folder per screen

| Path | Purpose |
| --- | --- |
| `workspace/OverviewScreen.tsx` | Workspace home: stats, severity bar, per-project rows, top failing rules, onboarding when empty. |
| `workspace/SeverityBar.tsx` | Presentational proportional bar (`aria-hidden`; numbers are printed in the legend). |
| `workspace/RulesScreen.tsx` | Rule reference generated from `RULE_DESCRIPTORS`, searchable/filterable. |
| `workspace/SettingsScreen.tsx` | Theme, data (export/import/reset), limits, privacy notes. |
| `workspace/NotFoundScreen.tsx` | 404 and deleted-entity screen. |
| `projects/ProjectsScreen.tsx` | Project grid + search. |
| `projects/ProjectDetailScreen.tsx` | Scans list, capture entry point, edit, delete with confirm. |
| `projects/ProjectFormDialog.tsx` | Create/edit form; field-level validation, form-level error only for non-field failures. |
| `scans/CaptureDialog.tsx` | The primary data-entry workflow: project/name/url/template/markup, live size budget, file load, samples. |
| `findings/FindingsScreen.tsx` | Global inbox with filters and paging. |
| `findings/ScanDetailScreen.tsx` | Evidence view: metadata, counts, findings, captured markup, bulk action. |
| `findings/FindingCard.tsx` | One finding: severity, rule, WCAG, message, selector, triage select, evidence details, note, copy-defect-text. |
| `contrast/ContrastScreen.tsx` | Contrast checker with validation, presets, live preview and AA/AAA checks. |
| `reports/ReportsScreen.tsx` | Report index: ready vs awaiting-capture projects. |
| `reports/ReportDetailScreen.tsx` | Conformance summary, per-scan list, include-all-scans toggle, three exports, print. |
| `reports/exporters.ts` | Pure string builders: `findingsToCsv`, `buildMarkdownReport`, `buildHtmlReport`. |

### `src/samples/index.ts`

**Purpose.** Two bundled captures: a realistic failing marketing page and an
accessible checkout baseline. Used by the capture dialog **and** by the engine
tests, so tests exercise what users actually see. Exports `SAMPLES`, `SamplePage`,
`findSample`.

### `src/styles/`

| File | Purpose |
| --- | --- |
| `tokens.css` | All design tokens: type scale, 4px spacing scale, radii, layout, motion, and the light/dark palettes (37 colour tokens each, including `--border-control` chosen to meet 3:1 for UI component boundaries). |
| `base.css` | Reset, document typography, `:focus-visible` policy, skip link, utilities, form primitives, reduced-motion and forced-colors handling. |
| `components.css` | Component layer, one block per family, plus the responsive breakpoints (1100/960/720/480px) and print styles. |

### `src/test/`

| File | Purpose |
| --- | --- |
| `setup.ts` | Jest-DOM matchers, cleanup, and the jsdom gaps (`matchMedia`, `createObjectURL`, `scrollTo`). |
| `fixtures/pages.ts` | One minimal markup fixture per rule (violating + clean). |
| `fixtures/workspace.ts` | Hand-built `Project`/`Finding`/`Scan`/`Workspace` factories so state tests do not depend on engine behaviour. |
| `integration.test.tsx` | Full-app flows through the real store, engine, router and localStorage. |
| `tokens-contrast.test.ts` | Parses `tokens.css` and asserts every text/control pair meets WCAG AA. |

### `src/main.tsx` and `src/App.tsx`

`main.tsx` is the boot sequence: theme side effect → CSS imports →
`ErrorBoundary` → `WorkspaceProvider` → `App`, with `onUncaughtError` logging.
`App.tsx` is the route table and the banner stack (persistence error, load
repairs). It deliberately contains no feature logic.

---

## `docs/`

Documentation only. Nothing in `src/` imports from here; nothing here is bundled.

**What does not belong in this repository:** `dist/`, `coverage/`,
`node_modules/`, real `.env` files, or any captured markup from a real client
engagement (fixtures must stay synthetic — see [`SECURITY.md`](SECURITY.md)).
