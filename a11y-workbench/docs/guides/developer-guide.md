# Developer guide

A task-oriented path from "never seen this repo" to "shipped a change".

## Day one

| Step | Command / file | What to look at |
| --- | --- | --- |
| 1 | `npm install` | 468 entries, no native build |
| 2 | `npm run dev` | Open `http://localhost:5173/#/` |
| 3 | Follow the first-run checklist | [`../SETUP.md`](../SETUP.md#first-run-checklist) |
| 4 | `src/App.tsx` | The whole route table in 60 lines |
| 5 | `src/features/workspace/OverviewScreen.tsx` | How a screen composes selectors + primitives |
| 6 | `src/engine/rules/index.ts` | The 19-rule registry — the heart of the product |
| 7 | `src/storage/repository.ts` | Invariants; every mutation lives here |
| 8 | `docs/ARCHITECTURE.md` | Then this whole directory |

Reading order for depth: `types/domain.ts` → `lib/dom.ts` → `engine/audit.ts` →
`engine/rules/*` → `storage/*` → `state/*` → `features/*` → `styles/*`.

## Mental model in one page

```
User pastes markup
      │
      ▼
CaptureDialog ──validateScanInput──► repository.createScan
                                          │
                                          ├─► runAudit(markup)
                                          │      ├─ DOMParser (inert)
                                          │      └─ 19 rules → EngineFinding[]
                                          ├─ prune old scans (cap)
                                          ├─ build Scan {markup, findings, warnings}
                                          └─ saveWorkspace → localStorage
                                          │
                                          ▼
                        WorkspaceProvider.apply()
                        ├─ setWorkspace
                        ├─ setPersistenceError (if the write failed)
                        └─ setStoredBytes
                                          │
                                          ▼
              Screens read via selectors (memoised) → render
                                          │
                                          ▼
                 Triage (status/note) → repository.updateFinding → save
                                          │
                                          ▼
                   Report → buildConformance → CSV / HTML / Markdown
```

Three invariants worth memorising:

1. **The engine never touches the DOM of the app, only an inert parse of the
   capture.**
2. **The repository never mutates its input and always persists.**
3. **A failed save is always surfaced — never swallowed.**

## Common tasks

### Add a rule

See [`../DEVELOPMENT.md`](../DEVELOPMENT.md#adding-a-rule-most-common-extension).
Short version: descriptor → `evaluate` → register (append) → fixtures → 2 tests →
catalogue row → bump `ENGINE_VERSION`.

### Add a screen

Route in `router.ts` (3 places) → screen file with `PageHeader` → `case` in
`App.tsx` → integration test → docs row.

### Add a persisted field

`types/domain.ts` → `storage/schema.ts` **normaliser** → bump `SCHEMA_VERSION` →
fixture → migration note in `docs/database/schema.md`.

### Change a design token

`src/styles/tokens.css` (both theme blocks) → run `npx vitest run src/test` →
update the measured tables in `docs/ACCESSIBILITY.md` if a ratio changed.

### Change an export format

`src/features/reports/exporters.ts` → update `exporters.test.ts` (including the
escaping tests) → update [`../modules/exporters.md`](../modules/exporters.md).
Remember: adding a CSV column means editing both the header array and the row
array.

## Where the risk is

| Area | Risk | Mitigation |
| --- | --- | --- |
| `storage/schema.ts` | A missing normaliser silently drops a field on reload | Follow the model-change checklist |
| `storage/repository.ts` | Mutating the input workspace | Spread, never push |
| `lib/dom.ts` caches | Cached values across documents | `resetDomCaches()` is called per audit |
| `state/router.ts` names | Two other files depend on the strings | `grep` before renaming |
| `features/reports/exporters.ts` | Positional CSV coupling | Header and row arrays are adjacent |
| `styles/tokens.css` | Contrast regressions | Token test |

## Testing habits that paid off here

* Assert on **user-visible text**, not class names — many defects in this codebase
  were wording/duplication bugs, and class-based tests would not have found them.
* For anything that writes, assert the **persisted document**, not just the UI.
* For any failure path, assert **exactly one** announcement. Duplicate messaging
  was a real bug twice.
* Give each fixture one clear defect so a failure names its cause.

## Reviewing your own change

| Question | If "no" |
| --- | --- |
| Does `npm run verify` pass? | Fix before committing |
| Is there a test that fails without this change? | Add one |
| Are docs updated for any contract change? | Update them in the same commit |
| Does it work with an empty workspace? | Add an empty state |
| Does it work at 360 px wide? | Add a breakpoint rule |
| Does it announce once, not twice? | Remove the duplicate |
| Does it survive a full-page reload? | Check persistence + schema |
| Did you add a dependency you could have written in 100 lines? | Remove it |
