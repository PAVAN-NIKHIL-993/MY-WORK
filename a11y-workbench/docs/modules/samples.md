# Module: samples

**Location.** `src/samples/index.ts`
**Consumers.** `features/scans/CaptureDialog.tsx` (two buttons),
`src/test/integration.test.tsx`, `src/engine/audit.test.ts` (via engine tests on
their own fixtures, not these), README/demo instructions.

## Purpose

Give a first-time user a working demo in two clicks, and give the product a
canonical pair of pages ("broken" and "accessible") that anyone can reason about.

## Contents

| `id` | Name | Demonstrates | Expected audit result |
| --- | --- | --- | --- |
| `sample-failing` | Marketing page (common failures) | A realistic landing page with the mistakes audits find first | ~20 findings spanning most rules |
| `sample-passing` | Checkout page (accessible baseline) | Skip link, single `h1`, labelled fields, scoped table headers, descriptive link | 0 findings |

## Why they are shipped in the app (not only in tests)

* A user can evaluate the engine without pasting client markup.
* The capture dialog names the sample automatically, so a demo scan is
  self-explanatory in the project list.
* Integration tests drive the UI through these exact strings, so the demo path is
  covered end to end.

## Deliberate design of the failing sample

It is *not* a list of one-line violations. It mirrors real markup:

* `<html>` without `lang`, generic `<title>Home`.
* A `div` with `onclick` acting as a menu button.
* `h2` followed by `h4` (skipped level) and no `h1`.
* An `<img>` with no `alt`.
* Inline colours that fail contrast (`#9aa0a6` on `#ffffff`).
* A `ul` whose children are `div`s.
* An unlabelled text input (placeholder only), an unlabelled `select`.
* An icon-only submit button with no name.
* A `fieldset` without a `legend`.
* A data table without `th`.
* An unnamed inline `<svg>`.
* `role="checkbox"` with no `aria-checked`, and a misspelled `aria-labeledby`.
* A vague link ("Click here") and a positive `tabindex="3"`.

## Deliberate design of the passing sample

It demonstrates the *positive* patterns rather than being minimal:

* `lang="en"`, descriptive `<title>`, skip link, `header`/`main`/`footer`.
* One `h1`, sequential `h2`s.
* `fieldset` + `legend`, `label for` on every control, `autocomplete`.
* `ul > li`, `table` with `caption`, `th scope="col"` and `th scope="row"`.
* A descriptive link ("Contact support about this order").
* Inline colours that pass (`#20242b` on `#ffffff`).

## Assumptions

* Sample markup is synthetic. It must never contain real client markup, real
  names, or credentials — see `SECURITY.md`.
* The samples are allowed to be "old-fashioned" HTML; they are evidence of
  patterns, not a style guide.

## Failure behaviour

None: samples are static strings. If a sample is edited such that it no longer
demonstrates the intended states, the integration test "reports a clean page with
an explicit pass state" fails — that is the guard rail.

## Modification risks

| Change | Risk |
| --- | --- |
| Making the passing sample non-clean | The integration test fails (intended), and the demo misrepresents the engine |
| Removing a violation from the failing sample | Fewer rule categories demoed; the assertion on "Image is missing an alt attribute" / "Button has no accessible name" may fail |
| Adding a huge sample | Capture-size limits and the engine cap could truncate it |
