# Performance

## Summary

| Metric | Value | Context |
| --- | --- | --- |
| Production JS bundle | 355.4 kB (108.43 kB gzip) | Includes React; source map optional and not downloaded by browsers |
| Production CSS | 33.28 kB (6.68 kB gzip) | All tokens, components, print styles |
| Modules | 89 | Single chunk |
| Audit, 2 KB page | **10.9 ms** median | 20 findings |
| Audit, 3 KB clean page | **10.3 ms** median | 0 findings |
| Audit, 23 KB / 100 rows | **59.7 ms** median | 301 findings |
| Audit, 119 KB / 500 rows | **210.8 ms** median | 400 findings (capped) |
| Audit, 238 KB / 1000 rows | **385.1 ms** median | 400 findings (capped) |
| Save | ~1–3 ms | JSON stringify + `setItem` |
| First paint | No measurement claimed | Static, no network, no fonts |

> **Measurement caveat.** All engine timings above were measured in **jsdom**
> (Node.js), not in a real browser — no browser binary is available in this
> environment. jsdom's DOM is generally *slower* than a real browser for traversal,
> so real-browser numbers are likely lower, but that has **not** been verified.
> Do not quote these as browser benchmarks.

## Method

1. A standalone script parses the fixture with jsdom, sets global `document`, then
   imports `runAudit` through `vite-node` so TypeScript aliases resolve.
2. Warm-up run (module init, JIT), then 7 timed runs; the median is reported.
3. The same document is reused per iteration where the cost under test allows it;
   parse cost is reported separately (~9–11 ms at 100 rows).

Reproducing the shape of the measurement:

```ts
import { JSDOM } from 'jsdom';
import { runAudit } from './src/engine/audit.ts';

const dom = new JSDOM('<!doctype html><html><body></body></html>');
globalThis.document = dom.window.document;
globalThis.DOMParser = dom.window.DOMParser;

const times = [];
for (let i = 0; i < 8; i += 1) {
  const start = performance.now();
  runAudit(markup);
  if (i > 0) times.push(performance.now() - start);
}
times.sort((a, b) => a - b);
console.log(times[3]);  // median of 7
```

## Scaling behaviour

| Page size | Time | Findings | Observation |
| --- | --- | --- | --- |
| 2–3 KB | ~10 ms | 0–20 | Dominated by rule dispatch, not content |
| 12 KB | ~219 ms **before optimisation** | 400 (capped) | Quadratic selector building |
| 23 KB | 59.7 ms | 301 | Linear |
| 119 KB | 210.8 ms | 400 | Linear (~0.38 ms/row) |
| 238 KB | 385.1 ms | 400 | Linear |

**What fixed the quadratic behaviour:** `buildSelector` originally walked from the
element to the body collecting `nth-of-type` indices with an `indexOf` per
sibling — O(n²) in siblings. It now computes sibling indices incrementally while
walking upward. `visibleText` also gained fast paths and a results cache, and
`isHiddenFromAT` gained memoisation plus ancestor-aware short-circuiting.

## Hot-path attribution (100-row document)

| Function | Time | Share |
| --- | --- | --- |
| `visibleText` | 9.2 ms | — |
| `buildSelector` | 6.7 ms | — |
| `isHiddenFromAT` | 2.1 ms | — |
| `snippetOf` | 1.8 ms | — |
| `accessibleName` | 1.3 ms | — |

Remaining cost is jsdom element traversal itself, not application logic. Further
micro-optimisation has low return; the honest conclusion is recorded here so
nobody repeats the exercise expecting a win.

## Memory

| Item | Approximate |
| --- | --- |
| Parsed document for a 100 KB page | Several MB (jsdom/browser DOM overhead) |
| Workspace in memory | Captured markup + findings; the markup dominates |
| Stored workspace | Same order as captured markup + a few hundred bytes per finding |

Limits exist so these numbers stay bounded: 512 KB capture, 400 findings, 25 scans
per project, 100 projects.

## Rendering performance

| Interaction | Cost | Notes |
| --- | --- | --- |
| Route change | < 16 ms | Selectors memoised on `[workspace, filters]` |
| Triage a finding | < 16 ms + save | Whole-document write is the dominant cost |
| Findings list | 25 rendered per page | Pagination exists specifically to bound render cost |
| Toast | Re-renders all context consumers | Cheap screens; documented as the first thing to split if it ever matters |

## Optimisations deliberately not done

| Idea | Why not |
| --- | --- |
| Web Worker for the engine | 10 ms typical; the message-passing and bundling complexity is not justified |
| Virtualised lists | Pagination at 25 bounds the DOM already |
| Memoising every component | Adds noise; profiling shows no re-render bottleneck |
| Code splitting | One entry, one route graph; splitting would add round-trips |
| Precomputed index of findings | Linear scans over ≤ 2500 scans are fast enough |
| Incremental/partial persistence | Whole-document writes are 1–3 ms; complexity not justified yet |

## Budgets (proposed, not enforced)

| Budget | Target |
| --- | --- |
| JS gzip | < 150 kB (currently 108.43 kB) |
| CSS gzip | < 15 kB (currently 6.68 kB) |
| Audit at 100 rows | < 150 ms in a browser (unverified) |
| Interaction | < 100 ms perceived |

There is no CI performance gate; these are review expectations.
