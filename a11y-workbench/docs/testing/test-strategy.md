# Test strategy

## Principles

1. **Test behaviour, not implementation.** Assertions are on findings, rendered
   semantics and persisted documents — not on private functions or DOM structure.
2. **Where a bug is possible, a test is mandatory.** Every bug found during this
   work has a regression test (listed in `test-cases.md`).
3. **Pure layers get fast, exhaustive tests.** The engine and storage are pure and
   synchronous, so they carry the bulk of the assertions.
4. **Component tests assert what screenshots cannot.** Labels, `aria-*`, focus,
   live regions.
5. **Do not claim coverage that does not exist.** Real-browser E2E is absent and
   is listed as a gap.

## Test pyramid (actual)

| Layer | Files | Tests | Runtime | What it proves |
| --- | --- | --- | --- | --- |
| Engine (unit, fixture-driven) | `src/engine/audit.test.ts` | 35 | ~270 ms | Every rule fires correctly and stays silent on clean markup; determinism; robustness |
| Pure utilities | `src/lib/color.test.ts`, `src/lib/dom.test.ts` | 19 + 18 | ~50 ms | Contrast maths, parsing, accessible-name resolution, hidden detection, selector building |
| Storage / repository | `src/storage/storage.test.ts` | 35 | ~210 ms | Migration/repair, quota typing, all invariants and cascades |
| Selectors | `src/state/selectors.test.ts` | 22 | ~10 ms | Counts, conformance mapping, ordering, search |
| Routing | `src/state/router.test.ts` | 8 | ~5 ms | Grammar and round-trip |
| Exporters | `src/features/reports/exporters.test.ts` | 17 | ~10 ms | CSV quoting/injection, Markdown escaping, HTML escaping |
| Primitives (component) | `src/components/ui/ui.test.tsx` | 20 | ~280 ms | Field/label wiring, modal focus trap, live regions, icon-button typing |
| Theme hook | `src/hooks/useTheme.test.ts` | 5 | ~27 ms | Persistence, system resolution, storage failure |
| Shell | `src/components/layout/AppShell.test.tsx` | 8 | ~400 ms | Nav landmarks, current page, mobile menu, skip link |
| Design tokens | `src/test/tokens-contrast.test.ts` | 35 | ~8 ms | 28 colour pairs meet WCAG AA in both themes |
| Integration (real app) | `src/test/integration.test.tsx` | 20 | ~2 s | Create → capture → audit → triage → persist → report, error states |
| **Total** | **12 files** | **242** | **~14 s** | |

## Why the integration tests use the real stack

`integration.test.tsx` renders `<App/>` inside the real `WorkspaceProvider` with
the real engine, real router and real `localStorage` (jsdom). Nothing is mocked.
That is why it can prove the workflow end-to-end; a mocked store would only prove
that mocks are wired together.

The only mocked platform pieces are the ones jsdom lacks, added globally in
`src/test/setup.ts`: `matchMedia`, `URL.createObjectURL`, `scrollTo`.

## What is deliberately not tested

| Not tested | Why | Risk |
| --- | --- | --- |
| Real browser rendering (layout, responsive breakpoints) | No headless browser available in this environment | Medium — CSS regressions are not caught automatically; mitigated by a small, token-driven stylesheet |
| Visual regression | No baseline images | Medium |
| Safari/Firefox-specific behaviour | jsdom is one implementation | Low–medium |
| `navigator.clipboard` behaviour | jsdom has no clipboard | Low (silently optional) |
| Print output | Not testable in jsdom | Low |
| Multi-tab behaviour | Not supported by design | Documented limitation |
| Performance in a real browser | jsdom timings differ | See `../PERFORMANCE.md` for the caveat |

These are recorded in [`../DOCUMENTATION_COVERAGE.md`](../DOCUMENTATION_COVERAGE.md)
as honest gaps, not silently skipped.

## Test data strategy

| Fixture set | Purpose | File |
| --- | --- | --- |
| Per-rule markup (19 violating + a clean page) | Rule tests | `src/test/fixtures/pages.ts` |
| Hand-built domain objects | State/storage/export tests independent of engine output | `src/test/fixtures/workspace.ts` |
| Bundled samples | Integration + demo | `src/samples/index.ts` |
| Good/bad colour pairs, known ratios | Colour maths | inline in tests |

The split is deliberate: if rule tests used the same hand-built findings, a rule
change could break an unrelated state test.

## How to run

```bash
npm test                        # all suites, once
npm run test:watch              # watch mode
npx vitest run src/engine       # one directory
npx vitest run -t "rule: image-alt"   # one test by name
npm run test:coverage           # v8 coverage into coverage/
```

## Gate used before every commit

```bash
npm run verify   # typecheck → lint → test → build
```

All four must pass. `verify` is the same command CI should run (see
[`../DEPLOYMENT.md`](../DEPLOYMENT.md)).
