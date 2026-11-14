# Test cases

Grouped by suite. Every case below exists in the repository; the file is named so
it can be located. "Regression" marks a case added because a real defect was found
during this work.

## Test matrix

| Area | Test type | Covered | Important cases |
| --- | --- | --- | --- |
| Rule engine | Unit (fixture) | Yes, 19 rules | Each rule fires on a violating fixture and stays silent on a clean page; determinism; malformed input; `select` naming (regression) |
| DOM utilities | Unit | Yes | Hidden content behind an ancestor (regression), accessible-name order, selector paths, escaping |
| Colour maths | Unit | Yes | 21:1 and 1:1 invariants, symmetry, thresholds, clamp, `null` on invalid |
| Storage/migration | Unit | Yes | Corrupt JSON, orphan scans, enum repair, recomputed summary, quota typing |
| Repository | Unit | Yes | Cascades, pruning, caps, no-op on unknown ids, warning persistence |
| Selectors | Unit | Yes | Counts, conformance mapping, ordering, search |
| Routing | Unit | Yes | Grammar, not-found, round-trip |
| Exporters | Unit | Yes | CSV quoting + formula injection, Markdown pipe escaping, HTML escaping |
| UI primitives | Component | Yes | Field wiring, modal focus trap/restore/Escape, live regions, icon-button label |
| App shell | Component | Yes | Two labelled navs, one `aria-current`, mobile menu, skip link |
| Tokens | Unit (CSS parse) | Yes | 28 colour pairs, both themes |
| Full app | Integration | Yes | Create → capture → audit → triage → persist; all error/empty states |
| Responsive layout | — | **No** | No browser available; see gaps |
| Real-browser E2E | — | **No** | No browser available |

---

## `src/engine/audit.test.ts` — 35 tests

| # | Case | Assertion |
| --- | --- | --- |
| 1 | Contract | Returns engine version, `rulesEvaluated === RULES.length`, warnings array |
| 2 | Clean page | Zero findings |
| 3 | Determinism | Two runs on the same markup produce identical findings |
| 4 | Sorting | Severity ranks are non-decreasing across the output |
| 5 | Empty markup | Empty findings + "empty" warning |
| 6 | Malformed markup | Recovers and still reports `image-alt`; all rules evaluated |
| 7 | Pathological input | `'<'.repeat(500)` and repeated click divs do not throw |
| 8–10 | `document-lang` | Missing → finding; invalid → BCP-47 message; `en-GB` passes |
| 11–12 | `page-title` | Missing → finding; generic "Home" → **minor** severity (regression: fixture had a usable title) |
| 13–15 | `image-alt` | Only the unlabelled image is flagged; `alt=""` passes; images inside `aria-hidden` are ignored (regression) |
| 16 | `button-name` | Only the unnamed icon button flagged |
| 17 | `link-name` | "Click here" + empty link flagged; `aria-label` and descriptive text pass |
| 18 | `form-label` | Unlabelled input/select/textarea flagged; placeholder-only reported specially; submit passes (regression: select option text) |
| 19–20 | `heading-order` | Skipped level detected; missing `h1` detected |
| 21 | `list-structure` | Non-`li` children and empty list detected |
| 22 | `contrast-inline` | Low-contrast pair flagged with hex detail; undeclared background skipped; passing pair ignored |
| 23–24 | `bypass-blocks` | No landmark and no skip link flagged; `main` alone passes |
| 25 | `landmark-structure` | Duplicate unnamed `main` flagged |
| 26 | `interactive-semantics` | Bare `onclick` div flagged; native button and role+tabindex+keydown pass |
| 27 | `tabindex-order` | Positive tabindex flagged; `-1` passes |
| 28 | `svg-name` | Unnamed SVG flagged; `<title>` and `aria-hidden` pass |
| 29 | `table-header` | Data table without `th` flagged; `role="presentation"` skipped |
| 30 | `fieldset-legend` | Missing legend flagged; one with legend passes |
| 31–33 | ARIA family | Invalid role, missing `aria-checked`, misspelled `aria-labeledby` |
| 34–35 | `summarize` | Passes counted per level; severity counts match findings |

## `src/lib/color.test.ts` — 19 tests

3/6-digit hex · `rgb()`/`rgba()` · named colours (case-insensitive) · `null` for
transparent/var/unknown · channel clamping (regression: signed values) · `toHex`
round-trip and padding · luminance endpoints · 21:1, 1:1, symmetry · AA normal-text
pass at 21 · fail with required ratio attached · large-text threshold (regression:
picked a pair that actually fails AA normal) · AAA thresholds · `null` on invalid ·
inline-style extraction, order-independent · `color` not confused with
`background-color` · absent property → `null`.

## `src/lib/dom.test.ts` — 18 tests

Inert parsing (script does not run) · escaping all five characters · whitespace
collapse · hidden via ancestor (regression) · hidden via `hidden`/`display`/
`visibility` · visible content · id short-circuit · `nth-of-type` only when needed ·
path rooted at body · snippet normalisation · name: `aria-labelledby` > `aria-label` ·
`label[for]` · wrapping label · select not named by option text (regression) ·
`alt` and `title` fallbacks · image `alt` inside a link · svg `title` inside a link.

## `src/storage/storage.test.ts` — 35 tests

**Migration:** non-object reset · valid data kept + version stamped · orphan scan
dropped · invalid enums defaulted · non-object findings dropped · newer-version
warning · summary recomputed · over-long strings truncated.
**Load/save:** fresh · round-trip · corrupt JSON repaired · unavailable storage
reported · quota typed (probe still succeeds — precise mock) · clear · empty
document valid.
**Backup:** envelope round-trip · bare workspace accepted · empty/invalid/foreign
rejected.
**Projects:** validation · trim + ordering · partial update · cascade delete ·
in-memory change kept on persistence failure.
**Scans:** required fields · project existence · size limit · engine run +
`status:'open'` · warnings persisted · pruning notice recorded (regression) ·
per-project prune · single delete.
**Triage:** status + timestamp · note truncation · bulk subset · unknown ids no-op.
**Reset:** valid empty document.

## `src/state/selectors.test.ts` — 22 tests

Severity counts · status counts · resolved definition · `openFindings` · workspace
stats (incl. zero-resolution without NaN, audited vs unaudited) · rule aggregation
ordering · conformance mapping (all three branches, empty scan) · newest-first scans ·
latest per project · lookups · flatten · trend chronological + open-only · search
(empty query, fields, evidence snippet, case-insensitivity).

## `src/state/router.test.ts` — 8 tests

Root variants · list routes · detail routes with ids · tool routes · not-found for
unknown/query/malformed hashes (regression: expectation said "project") ·
trailing slash · round-trip for every `paths.*` · id embedding.

## `src/features/reports/exporters.test.ts` — 17 tests

CSV header always · quoting · one row per finding · formula-injection neutralised
for `= + - @` (regression, security) · CRLF. Markdown: header/metadata · totals
and percentages · pipe escaping · limitations paragraph · clean-scan statement ·
zero scans. HTML: escaping of script-like content (regression) · metadata escaping ·
standalone document · captions/scope · clean-scan row.

## `src/components/ui/ui.test.tsx` — 20 tests

Button default `type` · icon-only naming · keyboard activation · disabled ·
Field label association + `required` · hint/error `aria-describedby` +
`aria-invalid` + `role="alert"` · no `aria-invalid` without an error · Modal
semantics · Escape/close button · Tab trap · initial focus · scroll lock ·
badges always textual · Alert `role="alert"` only when `live` · Skeleton busy
status · EmptyState actions · PageHeader single `h1` · Card region naming.

## `src/components/layout/AppShell.test.tsx` — 8 tests

Two labelled navs · one current link · current on detail routes · skip link target ·
mobile menu `aria-expanded` + `data-open` · Escape closes · scrim closes
(regression: duplicate label made the query ambiguous) · save failure shows no
false "saved" claim.

## `src/hooks/useTheme.test.ts` — 5 tests

Apply to document · system resolution · default system · persist + apply ·
clear on system · storage failure survived.

## `src/test/tokens-contrast.test.ts` — 35 tests

Palette parses (≥ 30 tokens per theme; corrected from an incorrect 40 threshold) ·
12 text pairs × 2 themes · 4 control pairs × 2 themes · primary button text.

## `src/test/integration.test.tsx` — 20 tests

Onboarding · single `aria-current` · skip link first tab stop · create project
(regression: "No open findings" was the wrong badge text) · validation error
(regression: message duplicated in alert + field) · capture sample → findings ·
clean capture → pass state · empty capture validation · triage persists to
`localStorage` · restore from storage · corrupt-data banner · unknown route ·
deleted entity · contrast evaluation · contrast validation · rule reference listing ·
rule search filter · settings limits · samples present · **save-failure banner with
exactly one explanation** (regression: duplicate alert).
