# Debugging guide

Problem-first recipes. Each one names the tool, the command and the decision point.

## 1. "A rule is not firing"

```bash
npx vitest run src/engine -t "name of the rule"
```

Then, inside `src/engine/audit.test.ts`, add a temporary log of the parsed body:

```ts
const result = runAudit(markup);
console.log(result.findings, result.warnings);
```

| Check | Detail |
| --- | --- |
| Is the fixture actually in the document? | Most "rule broken" reports are fixtures placed outside `<body>` |
| Is the element hidden? | `isHiddenFromAT` short-circuits many rules (by design) |
| Is the rule registered? | `RULES` in `src/engine/rules/index.ts`; count must be 19 |
| Does it throw? | `runAudit` converts a throw into a warning — look at `warnings` |
| Does the selector skip it? | Some rules deliberately ignore elements inside `aria-hidden` subtrees |

## 2. "The audit misses a real problem"

1. Confirm the problem is **in the captured markup** — the engine never loads
   CSS/JS, so stylesheet-driven failures cannot be seen.
2. Check `#/rules`: is there a rule for that criterion?
3. Reproduce in isolation:

```ts
import { runAudit } from '@/engine/audit';
runAudit('<html><body>…minimal repro…</body></html>');
```

If the minimal repro works but the real page does not, the difference is usually an
ancestor (`aria-hidden`, `hidden`, a `role="presentation"` table) — which is
correct behaviour, not a bug.

## 3. "Storage says it failed"

| Message | Meaning | Reproduction |
| --- | --- | --- |
| "Browser storage is full" | Quota `reason: 'quota'` | Fill `localStorage` with a large key, then mutate |
| "Browser storage is unavailable" | Probe write failed | Block site data / private mode |
| "Saving failed: …" | `reason: 'unknown'` | Circular JSON in a hand-built object (test-only) |

Reproduce a quota failure precisely — the naive approach (replace `setItem` with a
thrower) also breaks the availability probe, which produces the wrong message. The
test in `storage.test.ts` throws only for the workspace key:

```ts
const original = Storage.prototype.setItem;
Storage.prototype.setItem = function (key: string, value: string) {
  if (key === STORAGE_KEY) throw new DOMException('Quota', 'QuotaExceededError');
  return original.call(this, key, value);
};
```

## 4. "The UI shows data that does not exist"

```js
// Console on the app origin
JSON.parse(localStorage.getItem('a11y-workbench:workspace'))
```

If the stored document disagrees with the UI, the load path repaired something —
look for a banner listing repairs. If the UI disagrees with the stored document
after a reload, a selector is computing from stale state.

## 5. "Focus is in the wrong place"

| Symptom | Cause |
| --- | --- |
| Focus stays behind a dialog | The modal's focus effect did not run; check the dialog actually mounted |
| Focus is lost on close | The trigger was unmounted while the dialog was open; the modal restores to the previously focused element only if it still exists |
| No focus ring | `:focus-visible` (mouse click) — expected |
| Skip link does not move focus | Target must have `tabIndex={-1}` (it does: `main#main-content`) |

React Testing Library assertion pattern:

```ts
expect(document.activeElement).toBe(screen.getByRole('button', { name: /close/i }));
```

## 6. "A test fails only in the full run"

Almost always shared state:

* `localStorage` — cleared in `src/test/setup.ts` `afterEach`.
* Timers — `ToastRegion` uses real timers; tests that assert dismissal should use
  fake timers and restore them.
* Module-level caches in `lib/dom.ts` — `resetDomCaches()` runs per `runAudit`.

Run the file alone to confirm:

```bash
npx vitest run src/test/integration.test.tsx
```

## 7. "Two identical match errors"

`getByText` / `getByLabelText` fail when two elements match. This has happened
three times here, and twice it was a **real product bug** (duplicate messaging),
not a query problem:

* When the same message legitimately appears twice, fix the product.
* When two controls genuinely share a label, give them distinct accessible names.
* Only if neither applies use `getAllBy*` with an explicit length assertion.

## 8. Profiling the engine

```bash
npx vite-node /tmp/prof.mjs
```

Template:

```js
import { JSDOM } from 'jsdom';
import { runAudit } from './src/engine/audit.ts';
const dom = new JSDOM('<!doctype html><html><body></body></html>');
globalThis.document = dom.window.document;
globalThis.DOMParser = dom.window.DOMParser;

for (let i = 0; i < 8; i += 1) {
  const t = performance.now();
  runAudit(markup);
  if (i > 0) console.log((performance.now() - t).toFixed(1));
}
```

Rules for honest numbers: warm up, take a median of 7, report the document size and
finding count, and state that it is jsdom (**not** a browser).

## 9. Reading a stack trace from the error boundary

The boundary shows the message, then a `<details>` with the component stack. The
stack names the component that threw, not the code — follow it into the feature
file and reproduce with a unit test before fixing.

## 10. Quick reference

| Need | Command |
| --- | --- |
| Types only | `npx tsc --noEmit` |
| Lint one file | `npx eslint src/path/file.tsx` |
| One test file | `npx vitest run src/path/file.test.ts` |
| One test by name | `npx vitest run -t "substring"` |
| Coverage | `npx vitest run --coverage` |
| Fresh build | `rm -rf dist && npm run build` |
| Serve build | `npx vite preview` |
| Engine only | `npx vitest run src/engine` |
