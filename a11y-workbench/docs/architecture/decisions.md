# Engineering decisions

Each entry records the context, the options considered, the decision, the reason,
the consequences, and when it should be revisited. Decisions made *before* this
work package existed are marked **(baseline)** — in this repository there were
none, since the baseline contained only a stub README (see
[`../analysis/existing-implementation.md`](../analysis/existing-implementation.md)).

---

## ADR-001 — No backend; the product is a client-side SPA

**Context.** Audit material is often unreleased markup from a client. Sending it
to a server creates a data-handling obligation (retention, encryption in transit
and at rest, access control, breach notification) and a deployment to operate.

**Options considered.**
1. Server API + database (Postgres) with accounts.
2. Static SPA with browser storage.
3. Desktop application.

**Decision.** Static SPA, no network I/O at runtime.

**Reason.** It removes an entire class of risk and an entire class of operations
work. It also makes the product trivially deployable (any static host) and usable
offline. The cost — no cross-device sync, no multi-user review — is acceptable
for the target user (an individual auditor producing a report).

**Consequences.**
* Persistence is bounded by `localStorage` and is per browser profile.
* Backup/restore is the only migration path; it must therefore be first-class.
* Performance is CPU-bound in one thread; the engine must be efficient (see
  ADR-006).

**Revisit when.** Multi-auditor review, sign-off workflows, or audit history
across devices becomes a requirement. The `storage/` layer is already isolated
behind a repository interface, so a server adapter is a contained change.

---

## ADR-002 — Own rule engine instead of axe-core

**Context.** `axe-core` is the de-facto standard and far more complete.

**Options considered.**
1. Bundle axe-core and re-shape its results.
2. Write a small, deterministic rule engine.

**Decision.** Own engine, 19 rules.

**Reason.** Three concrete reasons, in order of weight:
1. **Explainability.** Every finding must carry a rule id, severity, WCAG level
   and remediation that we control and can defend in a VPAT. Mapping axe's
   output to our vocabulary would be a lossy translation layer.
2. **Testability.** Rules are pure functions over a `Document`; 35 engine tests
   run in ~260 ms with no browser and no global state.
3. **No surprise updates.** A dependency bump must not silently change stored
   evidence. `ENGINE_VERSION` is recorded per scan; we control when it changes.

**Consequences.**
* **Fewer rules than axe-core.** The engine does not claim completeness and the
  UI/report say the audit is one evidence source.
* We own the correctness of accessible-name computation, which is genuinely hard.
  The implementation is documented as a heuristic that only reports when *all*
  labelling mechanisms are empty (conservative by design).
* Zero runtime dependency, smaller bundle, no CSP/CDN concerns.

**Revisit when.** An audit requires rule parity with axe or a certified scanner.
The pragmatic path would be running both and reconciling, not replacing this
engine outright.

---

## ADR-003 — Hash routing instead of a router library

**Context.** Nine routes, one entity id parameter. The build must work when
served from a sub-path (GitHub Pages project sites) and ideally from `file://`.

**Options considered.**
1. `react-router-dom` with `BrowserRouter` — needs server rewrite rules.
2. `react-router-dom` with `HashRouter` — works, adds ~12 KB gz.
3. ~100-line hash router.

**Decision.** Hand-written hash router in `src/state/router.ts`.

**Reason.** The router is a table of string prefixes and one `hashchange`
listener. A library would add a dependency, a version-upgrade obligation and an
API surface to learn, without removing code.

**Consequences.**
* Links are real `<a href="#/…">` anchors, so history and "open in new tab" work.
* No nested layouts/loaders — not needed at this size.
* Route grammar is a manual `switch`; adding a route means touching two files
  (`router.ts` and `App.tsx`). Documented in the developer guide.

**Revisit when.** Nested routes, route-level code splitting or typed route params
with validation become necessary.

---

## ADR-004 — `localStorage` with whole-document writes

**Context.** The workspace is a single object tree (projects → scans → findings).
Writes happen per user action.

**Options considered.**
1. `localStorage`, whole document per write.
2. `localStorage`, per-entity keys.
3. IndexedDB with object stores.

**Decision.** One key, whole-document write.

**Reason.** `localStorage` has no transactions. With per-entity keys a crash
mid-write would leave a scan without its findings — a corrupt state the app would
then have to repair anyway. Writing one document makes every save atomic from the
reader's perspective: either the old document or the new one. IndexedDB would be
better at scale but is asynchronous and far more code for a dataset that is
routinely well under 1 MB.

**Consequences.**
* Write cost grows with workspace size: measured ~1–3 ms at realistic sizes
  (see [`../PERFORMANCE.md`](../PERFORMANCE.md)).
* Hard limits must be enforced: 100 projects, 25 scans/project (default), 400
  findings/scan (default). These are enforced in `repository.ts` and
  `config.ts`, not in the UI, so a programmatic caller cannot bypass them.
* Quota failure is a first-class, tested path.

**Revisit when.** Workspaces approach a few thousand scans, or a user needs a
history of audits. IndexedDB with per-scan records is the natural migration, and
`storage/schema.ts` is the single place that would need to change shape.

---

## ADR-005 — Findings are copied from engine output, then owned by the scan

**Context.** Findings need triage state, but the engine's output must remain
reproducible evidence.

**Decision.** `createScan` copies each `EngineFinding` into a `Finding` (adding
`id`, `scanId`, `status`, `note`, `updatedAt`). Triage mutates only those added
fields.

**Reason.** If triage could rewrite `message` or `selector`, the stored evidence
would no longer match what the engine actually found, and a re-run would produce a
diff that looks like a regression.

**Consequences.** Re-running an audit creates a **new scan**; it never edits the
old one. Comparison across scans is therefore possible (the report can include
all scans, and `severityTrend`/`latestScanByProject` exist for exactly this).

**Revisit when.** Users ask for "diff two scans"; the data model already supports
it, only a UI is missing.

---

## ADR-006 — Performance work driven by measurement, not intuition

**Context.** The first implementation took 219 ms for a 12 KB capture and did not
finish on a 1000-row page.

**Method.** Per-rule timing with fresh documents, then micro-benchmarks of the DOM
helpers, in jsdom under Node 22 (see [`../PERFORMANCE.md`](../PERFORMANCE.md) for
the numbers).

**Findings and fixes.**

| Symptom | Actual cause | Fix | Effect |
| --- | --- | --- | --- |
| Audit superlinear in element count | `buildSelector` collected `parent.children` per ancestor and used `indexOf` | Lazily-built per-parent tag index with stored positions | 100 rows: 219 → 60 ms; 1000 rows: did not finish → ~385 ms |
| Repeated ancestor walks | `isHiddenFromAT` walked to the root for every element | Per-element memo, propagated down the visited path | 39 → 5 µs per element |
| `select` falsely reported as unlabelled | Option text counted as the control's name | Form controls excluded from content-based naming | correctness fix |
| Hidden-subtree false positives | Only the marked element was skipped, not its descendants | Ancestor chain checked (memoised) | correctness fix |

**Decision.** Keep the caches in `lib/dom.ts`, documented as valid because rules
never mutate the parsed document, with `resetDomCaches()` for tests.

**Consequences.** A rule that mutates the document would now produce stale
results. This is stated as a hard constraint in `ARCHITECTURE.md` and enforced by
review.

**Revisit when.** The engine gains a rule that needs to mutate the document (it
should not) or when the app moves to a worker (caches are per-worker, which is
fine).

---

## ADR-007 — Accessibility of the product is tested, not asserted

**Context.** An accessibility tool with an inaccessible interface is not credible.

**Decision.**
1. `eslint-plugin-jsx-a11y` is part of the lint gate.
2. `src/test/tokens-contrast.test.ts` parses `tokens.css` and asserts 28 colour
   pairs meet WCAG AA (4.5:1 text, 3:1 UI boundaries) in both themes.
3. Component tests assert semantics that screenshots cannot: label association,
   `aria-invalid` + `aria-describedby`, dialog focus trap/restore, live regions,
   icon-only labelling.

**Reason.** Contrast and semantics regress invisibly. Catching them in CI is
cheaper than an audit.

**Consequence found and fixed during this work:** form-control borders were
`#d7dce4` on white (1.38:1), below the 3:1 required by SC 1.4.11. A dedicated
`--border-control` token (`#828c99` light, `#66717f` dark) was added and is now
guarded by the test.

**Revisit when.** The token set changes; the test reads the CSS, so it will
follow automatically and fail if a pair regresses.

---

## ADR-008 — Reports are generated, never stored

**Context.** A report could be snapshotted at generation time.

**Decision.** Generate on demand from current triage state; store nothing.

**Reason.** A stored report would immediately drift from the findings the moment
anyone triaged a finding, and the drift is invisible. Generating on demand means
the exported document always matches what the screen shows.

**Consequences.** Reports are not reproducible as artefacts unless exported. The
export includes `generatedAt` and the engine/app versions, so an exported file is
traceable.

**Revisit when.** Signed/immutable reports are required for a compliance process;
that would need snapshot storage plus a hash.

---

## ADR-009 — Conformance mapping is deliberately conservative

**Context.** A VPAT-style table must map findings to Supports / Partially
Supports / Does Not Support.

**Decision.** See the mapping table in
[`data-flow.md`](data-flow.md#conformance-mapping): unresolved → Does Not
Support; partially resolved or all-accepted → Partially Supports; rules that
produced no findings are **omitted**, with an explicit statement that a
non-applicable rule and a passing rule are indistinguishable from a capture.

**Reason.** Over-claiming conformance is the failure mode that damages real
accessibility programmes. It is better to under-claim and explain.

**Consequences.** The report cannot be used to claim "100% conformant" even on a
clean capture. That limitation is printed in the report body.

**Revisit when.** The engine gains per-rule applicability signals (e.g. "this
page has no forms, so the label rule is not applicable"), which would let the
report distinguish N/A from a pass.
