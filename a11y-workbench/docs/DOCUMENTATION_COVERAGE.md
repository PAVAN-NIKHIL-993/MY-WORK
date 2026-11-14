# Documentation coverage

An honest audit of this documentation set: what is documented, how it is verified,
and where the gaps are.

## Coverage summary

| Area | Documents | Status |
| --- | --- | --- |
| Product overview | [`../README.md`](../README.md) | Complete |
| Documentation index | [`README.md`](README.md) | Complete |
| Architecture | [`ARCHITECTURE.md`](ARCHITECTURE.md), `architecture/*` (6) | Complete |
| Modules | `modules/*` (6) | Complete |
| Components | `components/*` (3) | Complete |
| API contracts | `api/*` (5) | Complete |
| Storage schema/models | `database/*` (2) | Complete |
| Testing | `testing/*` (2) | Complete |
| Guides | `guides/*` (3) | Complete |
| Operations set | SETUP, CONFIGURATION, ENVIRONMENT, DEPENDENCIES, DEVELOPMENT, BUILD, DEPLOYMENT, OPERATIONS, TROUBLESHOOTING, SECURITY, PERFORMANCE, ACCESSIBILITY | Complete |
| History | [`CHANGELOG.md`](CHANGELOG.md) | Complete |
| Analysis record | `analysis/*` (2) | Complete |

## Measured scale (verified)

| Measure | Value | How |
| --- | --- | --- |
| Application source (`.ts`/`.tsx`, excluding tests) | 8,279 lines | `find … | xargs wc -l` |
| Test code (suites, setup, fixtures) | 2,385 lines | as above |
| CSS (three files) | 2,127 lines | `wc -l src/styles/*.css` |
| Source files (`.ts`/`.tsx`) | 77 | `find src` |
| Documentation (Markdown) | 6,614 lines across 51 files | `find docs README.md` |

Documentation is roughly 80% the size of the application source — deliberate, since
the brief called for engineering-grade documentation rather than a minimal README.

## Verification method per claim type

| Claim type | How it was verified |
| --- | --- |
| Rule count (19) | `node` import of the rule registry, and the `rulesEvaluated` assertion in tests |
| Test counts (240 / 12 files) | `npx vitest run` output |
| Bundle sizes | `npx vite build` output |
| Contrast ratios | `npx vitest run src/test/tokens-contrast.test.ts` plus a standalone measurement script |
| Performance numbers | jsdom benchmark scripts, median of 7 (labelled as jsdom) |
| `catch` occurrences (17 / 7 files) | `grep -rn catch src` |
| No `innerHTML` / no network | `grep` over `src/` |
| Storage keys, limits, versions | Read from `src/config.ts` |
| File paths | Every path in these docs refers to a real file |
| Behavioural claims | Backed by a named test, or marked as inspection-only |

## Statement-by-statement risk table

| Statement class | Reliability | Notes |
| --- | --- | --- |
| "X tests pass" | High | Reproducible command given |
| "Token Y is 3.41:1" | High | Computed by the app's own maths, asserted in tests |
| "The engine is linear beyond 100 rows" | Medium | Two data points (119 KB, 238 KB); linearity is an inference, not a proof |
| "Real-browser performance is lower" | **Speculative** | Explicitly flagged as unverified |
| "Screen readers will announce …" | **Inspection only** | Attributes are present and tested; no AT session was run |
| "Responsive at 320 px" | **Unverified** | Breakpoints are written; no browser available |
| CSP correctness | **Derived** | Built from actual resource usage; not browser-tested |

## Known documentation gaps

| Gap | Why it exists | Impact |
| --- | --- | --- |
| No real-browser screenshots | No browser in the build environment | Readers cannot see the UI; the wireframe-free screen docs describe structure and text instead |
| No measured first-paint/LCP | No browser | No web-vitals claims are made |
| No AT transcripts | No screen reader available | Accessibility claims are attribute-level |
| No load/stress test of multi-tab behaviour | Not supported by design | Documented as a limitation instead |
| No per-line coverage report | Coverage was not part of the release gate | Test-count and behaviour claims are used instead of percentages |
| `analysis/` documents are decision records | Written before implementation | They may describe intent that evolved; the module docs are authoritative |

## Claims deliberately **not** made

| Not claimed | Because |
| --- | --- |
| "WCAG 2.2 AA conformant" | The app audits markup only; it cannot assert conformance |
| "100% test coverage" | Not measured |
| "Production-ready at scale" | Single-user client app with a quota-bounded store |
| "Zero defects" | Known limitations are listed in the CHANGELOG and ARCHITECTURE |
| "Browser-verified" | No browser was available |
| Any benchmark against other tools | None was run |

## Maintenance rules

1. **A contract change requires a doc change in the same commit.** Storage schema,
   engine rules, routes, export formats and public component props all count.
2. **Numbers must be re-measured, not copied.** If a doc states a count, a size or a
   ratio, the command that produced it is in the doc.
3. **Relative links only** — no absolute URLs to repository files, so the docs work
   in any branch/fork.
4. **Mermaid diagrams** for flows; no image assets (they would rot).
5. **No aspirational "will" statements.** Describe what the code does; put plans in
   CHANGELOG or the extension guide.

## Link inventory (spot-checked)

| From | To | Status |
| --- | --- | --- |
| `README.md` | `docs/README.md`, `docs/ARCHITECTURE.md`, module docs | Resolves |
| `docs/README.md` | Every document in this set | Resolves |
| `docs/*` | `../modules/*`, `../api/*`, `../database/*` | Resolves (all relative) |
| `docs/modules/*` | `../architecture/*`, `../PERFORMANCE.md` | Resolves |
| `docs/testing/*` | `../DEPLOYMENT.md`, `../DOCUMENTATION_COVERAGE.md` | Resolves |

No external links are used except the Keep a Changelog and SemVer references in the
CHANGELOG, which are stable project homepages.

## Last verified

| Item | Value |
| --- | --- |
| Date | 2026-11-14 |
| Test run | 12 files, 242 tests, all passing |
| Typecheck | Clean |
| Lint | Clean |
| Build | 89 modules, 355.4 kB JS / 108.43 kB gzip, 33.28 kB CSS / 6.68 kB gzip |
| Browser verification | **None available** |
