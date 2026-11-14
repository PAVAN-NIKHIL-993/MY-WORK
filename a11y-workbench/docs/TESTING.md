# Testing

Entry point for the test documentation. Detailed material lives in
[`testing/test-strategy.md`](testing/test-strategy.md) and
[`testing/test-cases.md`](testing/test-cases.md).

## At a glance

| | |
| --- | --- |
| Framework | Vitest 3.2.7 (Vite-native) |
| Environment | `jsdom` 26.1.0 |
| Libraries | `@testing-library/react` 16.3, `@testing-library/dom` 10.4, `@testing-library/user-event` 14.6, `@testing-library/jest-dom` 6.9.1 |
| Files | **12** |
| Tests | **242, all passing** |
| Runtime | ~14 s cold |
| Setup | `src/test/setup.ts` — jest-dom matchers, `matchMedia`/`createObjectURL`/`scrollTo` mocks, `localStorage` cleared after each test |

## Commands

```bash
npm test                              # all suites once
npm run test:watch                    # watch mode
npm run test:coverage                 # v8 coverage → coverage/
npx vitest run src/engine             # one directory
npx vitest run src/test/integration.test.tsx   # one file
npx vitest run -t "image-alt"         # one test by name
```

The release gate is `npm run verify` = typecheck → lint → test → build.

## Where the tests live

| File | Tests | Covers |
| --- | --- | --- |
| `src/engine/audit.test.ts` | 35 | All 19 rules, sorting, determinism, malformed input, summaries |
| `src/lib/color.test.ts` | 19 | Parsing, luminance, ratios, AA/AAA assessment |
| `src/lib/dom.test.ts` | 18 | Parsing, escaping, hidden detection, accessible names, selectors |
| `src/storage/storage.test.ts` | 35 | Migration/repair, load/save typing, backups, all repository invariants |
| `src/state/selectors.test.ts` | 22 | Counts, stats, aggregation, conformance mapping, search |
| `src/state/router.test.ts` | 8 | Hash grammar, not-found, round-trip |
| `src/features/reports/exporters.test.ts` | 17 | CSV/HTML/Markdown escaping and structure |
| `src/components/ui/ui.test.tsx` | 20 | Primitive semantics and behaviour |
| `src/components/layout/AppShell.test.tsx` | 8 | Navigation landmarks, mobile menu, skip link |
| `src/hooks/useTheme.test.ts` | 5 | Theme persistence and system resolution |
| `src/test/tokens-contrast.test.ts` | 35 | 28 colour pairs across both themes |
| `src/test/integration.test.tsx` | 20 | Full app flows and error states |

## Testing philosophy in one paragraph

Pure logic is tested exhaustively and cheaply; the full app is tested end-to-end
with **no mocks** (real provider, engine, router and `localStorage`) because that is
the only way to prove the workflow; UI semantics are asserted as users and screen
readers experience them (`getByRole`, `aria-*`, live regions, focus), not as
implementation details. Every defect found during development has a regression
test, and several were found *by* tests that asserted exactly-once user messaging.

## Fixtures

| Fixture | File | Purpose |
| --- | --- | --- |
| 19 violating pages + one clean page | `src/test/fixtures/pages.ts` | Rule tests |
| Hand-built domain objects | `src/test/fixtures/workspace.ts` | State/storage/export tests decoupled from the engine |
| Bundled demo pages | `src/samples/index.ts` | Integration tests and the in-app demo |

## Coverage claims

No line-coverage percentage is claimed here. Coverage was not part of the release
gate and the number was not measured for this documentation. What *is* claimed is
enumerated in [`testing/test-cases.md`](testing/test-cases.md) — every case listed
exists and runs.

## Gaps (stated plainly)

| Not covered | Reason |
| --- | --- |
| Real-browser E2E (Playwright/Cypress) | No browser binary available in this environment |
| Visual regression | No baselines |
| Print output | Not testable in jsdom |
| Clipboard behaviour | jsdom has no clipboard implementation |
| Multi-tab sync | Not supported by design |
| Real-browser performance | jsdom timings differ; see [`PERFORMANCE.md`](PERFORMANCE.md) |
| Screen-reader output | Requires real AT |

## Adding a test

1. Put it next to the code (`*.test.ts(x)`) unless it exercises the whole app — then
   `src/test/integration.test.tsx`.
2. Query by role and accessible name first; `getByText` second; test ids never.
3. For anything persisted, assert the stored document.
4. For any error path, assert how many times a message appears.
5. Update [`testing/test-cases.md`](testing/test-cases.md) and the count in this
   file if the totals change.
