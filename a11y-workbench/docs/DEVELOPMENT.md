# Development

How to change this codebase without breaking it.

## Scripts

| Script | Command | Purpose |
| --- | --- | --- |
| `dev` | `vite` | Dev server on :5173 (host `0.0.0.0`), HMR |
| `build` | `tsc --noEmit && vite build` | Typecheck then production bundle |
| `preview` | `vite preview` | Serve `dist/` on :4173 |
| `typecheck` | `tsc --noEmit` | Types only |
| `lint` | `eslint .` | Flat config, TS-aware, zero warnings tolerated |
| `lint:fix` | `eslint . --fix` | Auto-fixable issues |
| `test` | `vitest run` | 242 tests |
| `test:watch` | `vitest` | Watch mode |
| `test:coverage` | `vitest run --coverage` | v8 coverage |
| `verify` | typecheck + lint + test + build | The gate before every commit |

## Workflow

```bash
git switch -c feat/my-change
npm run dev                     # iterate
npm run verify                  # must pass
git add -A && git commit -m "feat(scope): what changed and why"
```

Trace in this order: **type → repository → selector → screen → CSS**. A change that
starts in CSS usually ends up needing a type.

## Layering rules

```
types ← lib ← engine ← storage ← state ← components/features
```

| Rule | Reason |
| --- | --- |
| `engine` must not import `storage`, `state` or React | Keeps the engine pure and testable |
| `lib` must not import `engine` | Avoids cycles |
| Screens must not import `storage/*` | All persistence goes through context |
| `components/ui` must not import features | Primitives stay generic |
| No imports from `features/*` into `lib`/`engine` | Direction is one-way |

`npm run lint` does not enforce layering automatically — it is a review rule.
`grep -rn "from '@/storage'" src/features` should only show `repository` type
imports, if any.

## Adding a rule (most common extension)

1. **Descriptor.** Add `{ id: 'my-rule', name, description, severity, wcagLevel,
   successCriteria, remediation }` to the rule file.
2. **Implement** `evaluate({ body })` returning `violation(descriptor, {...})[]`
   (see [`api/engine-api.md`](api/engine-api.md)).
3. **Register** it in `src/engine/rules/index.ts` (`RULES` array). Order is a
   contract — append, do not insert in the middle unless you also bump the engine
   version and update the count assertions.
4. **Fixture.** Add a violating page and a passing page to
   `src/test/fixtures/pages.ts`.
5. **Tests.** Add "fires" and "stays silent" cases in `audit.test.ts`; update the
   rule-count assertions (`19` appears in a few tests).
6. **Docs.** Add a row to the catalogue in
   [`modules/audit-engine.md`](modules/audit-engine.md) and bump `ENGINE_VERSION`.

Never change a rule `id` after release: stored findings reference it.

## Adding a screen

1. `src/features/<area>/<Name>Screen.tsx` — `PageHeader` first.
2. Add a route name in `parseHash`, a builder in `paths`, a `case` in `App.tsx`,
   a title in `ROUTE_TITLES`.
3. Add a nav entry in `AppShell` only if it belongs in the primary navigation.
4. Integration test: render `App`, navigate to the route, assert the `h1` and one
   real state.
5. Docs: add the screen to [`components/screens.md`](components/screens.md).

## Adding a mutation

`repository.ts` function → export from `WorkspaceProvider`'s `value` via `apply()`
→ selection in docs → unit test in `storage.test.ts` covering happy path, bounds
and (if it writes) the persistence-failure case.

## State and effects

* One `useEffect` in `App` (document title), one in `AppShell` (close menu), one in
  `useTheme` (media listener), one in `Modal` (focus/scroll). Do not add effects that
  could be derived values.
* Never `setState` in render.
* Timers must be cleared on unmount (`ToastRegion` provider pattern).

## Styling

* Tokens only. A raw colour in a component is a defect.
* `class` composition: `className="button button--primary"`.
* No inline styles except measured widths (bar segments) and the error boundary.
* Test contrast for anything new that carries text.

## Commits

Conventional prefixes used in this repository:

```
feat(engine): add aria-required-children rule
fix(storage): keep triage when the write fails
refactor(dom): reuse a single parsed document per scan
test(reports): cover CSV formula neutralisation
docs(modules): document storage contracts
chore(deps): pin @testing-library/jest-dom to 6.9.1
```

One logical change per commit; do not mix a refactor with a behaviour change.

## Definition of done

| Gate | Command |
| --- | --- |
| Types | `npx tsc --noEmit` |
| Lint | `npx eslint .` |
| Tests | `npx vitest run` |
| Build | `npx vite build` |
| Docs | Updated for any changed contract |
| Manual | Demo path from SETUP.md still works |

## Debugging recipes

| Symptom | First thing to check |
| --- | --- |
| A rule does not fire | Is the fixture reaching `evaluate`? Add a `console.log(body.innerHTML)` in the test |
| A finding's selector is wrong | `buildSelector` uses an incremental index; check the element path in the scanned document |
| Contrast rule silent | Inline styles only — the engine cannot read stylesheets |
| Test fails only in full run | Cross-test `localStorage` leakage; `setup.ts` clears it |
| HMR shows stale state | Full reload; the workspace provider reads storage once |
