# Module: routing

**Location.** `src/state/router.ts`
**Consumers.** `src/App.tsx` (route table), `AppShell` (nav), every screen (links
via `paths`).
**Depends on.** React only.

## Purpose

Map `location.hash` to a route object, keep navigation declarative (`<a href>`),
and provide one place where entity URLs are constructed so links cannot drift.

## Public interface

```ts
parseHash(hash: string): Route
useRoute(): { route: Route; navigate(path: string): void }
navigate(path: string): void
paths: { overview, projects, project(id), findings, scan(id),
         reports, report(projectId), contrast, rules, settings }
```

```ts
interface Route {
  name: 'overview' | 'projects' | 'project' | 'findings' | 'scan'
      | 'reports' | 'report' | 'contrast' | 'rules' | 'settings' | 'not-found';
  segments: string[];   // e.g. ['projects','prj_1']
  raw: string;
}
```

## Grammar

| Hash | `name` | `segments` |
| --- | --- | --- |
| `''`, `'#'`, `'#/'` | `overview` | `[]` |
| `#/projects` | `projects` | `['projects']` |
| `#/projects/prj_1` | `project` | `['projects','prj_1']` |
| `#/findings` | `findings` | `['findings']` |
| `#/findings/scn_1` | `scan` | `['findings','scn_1']` |
| `#/reports` | `reports` | `['reports']` |
| `#/reports/prj_1` | `report` | `['reports','prj_1']` |
| `#/contrast`, `#/rules`, `#/settings` | matching name | `[name]` |
| anything else (incl. query strings) | `not-found` | parsed segments |

## Behaviour

* **Empty hash normalisation.** On mount, when `location.hash` is empty, the hook
  calls `location.replace(pathname + '#/')` so the Back button does not return to
  a hashless URL that re-renders the overview unexpectedly.
* **Change detection.** A single `hashchange` listener updates state; the
  `useMemo` on the hash string prevents re-parsing on unrelated renders.
* **`navigate` is idempotent.** Setting the same hash does nothing, avoiding a
  redundant history entry.
* **Unknown routes are `not-found`, not a redirect.** A typo shows the 404 screen
  instead of pretending to be a valid page.

## Why not a router library

See ADR-003 in [`../architecture/decisions.md`](../architecture/decisions.md).

## Error behaviour

* `parseHash` is total: any string yields a `Route`; malformed input becomes
  `not-found` (verified for `#/%zz` and `#/projects?x=1`).
* A valid route with an unknown entity id is handled by the screen (it renders
  `NotFoundScreen` with a "gone" message), because only the screen can tell
  "deleted" from "never existed".

## Testing

`src/state/router.test.ts` (8 tests): root variants, list routes, detail routes,
tool routes, unknown paths, trailing slashes, and the round-trip property that
every `paths.*` value parses back to the expected route.

## Extension points

Adding a route requires exactly three edits:

1. `parseHash` — map the segment to a `name`;
2. `paths` — add a builder;
3. `App.tsx` — add the `case` and (if it has a document title) `ROUTE_TITLES`.

## Modification risks

| Change | Risk |
| --- | --- |
| Renaming a `name` | `App.tsx` switch and `AppShell` `matches` arrays silently stop matching — nav highlighting breaks |
| Changing `#/findings/:id` semantics | Stored/external links break |
| Switching to `BrowserRouter` | Static hosting needs rewrite rules; GitHub Pages breaks without a 404 hack |
