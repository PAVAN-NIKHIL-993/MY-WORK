# Accessibility

A tool that audits accessibility must survive its own audit. This document records
what the app does, what is verified, and — importantly — what is not.

## Verification status

| Claim | Evidence | Status |
| --- | --- | --- |
| Text and control colour contrast (both themes) | `src/test/tokens-contrast.test.ts`, 28 pairs | **Verified in code** |
| Keyboard operability of dialogs, menu, forms | Component + integration tests | **Verified in code** |
| Labels on every form control | `Field` primitive + tests | **Verified in code** |
| Landmarks, headings, skip link | Integration tests | **Verified in code** |
| Live-region behaviour | Tests (toast, alerts, result count) | **Verified in code** |
| Focus-visible styling | CSS review; not automatable in jsdom | **By inspection only** |
| Responsive reflow at 320 px | CSS breakpoints written; **no browser to test** | **Unverified** |
| Real screen reader output | No AT available in this environment | **Unverified** |
| Automated axe sweep of the UI | Not run (jsdom lacks layout) | **Not done** |

Nothing in this document claims a real assistive-technology session. The honest
summary: *semantics and contrast are verified in code; real-device and
real-screen-reader behaviour is not.*

## Contrast — measured

Both themes, AA normal text (4.5:1) for text, AA non-text (3:1) for control
boundaries, via `relativeLuminance`/`contrastRatio` in `src/lib/color.ts`.

### Light

| Pair | Ratio | Requirement | Result |
| --- | --- | --- | --- |
| text-primary on surface | 17.60 | 4.5 | PASS |
| text-secondary on surface | 7.87 | 4.5 | PASS |
| text-muted on surface | 5.22 | 4.5 | PASS |
| text-muted on canvas | 4.83 | 4.5 | PASS |
| accent on surface | 8.56 | 4.5 | PASS |
| white on accent | 8.56 | 4.5 | PASS |
| badge pairs (4 severities) | 6.64–7.90 | 4.5 | PASS |
| control border on surface | 3.41 | 3.0 | PASS |
| control border on canvas | 3.15 | 3.0 | PASS |
| control border on subtle | 3.04 | 3.0 | PASS |
| focus ring on canvas | 7.92 | 3.0 | PASS |

### Dark

| Pair | Ratio | Result |
| --- | --- | --- |
| text-primary on surface | 15.55 | PASS |
| text-secondary on surface | 9.32 | PASS |
| text-muted on surface | 6.22 | PASS |
| text-muted on canvas | 6.74 | PASS |
| accent on surface | 7.83 | PASS |
| inverse text on accent | 8.41 | PASS |
| badge pairs | 8.83–9.74 | PASS |
| control border on surface | 3.52 | PASS |
| focus ring on canvas | 10.31 | PASS |

Decorative hairlines (`--border-default`, `--border-subtle` at 1.37–1.38) are
intentionally exempt from SC 1.4.11 — they delimit layout, not controls. Controls
use `--border-control`, which was added specifically because the decorative
hairline would have failed.

## Semantics

| Element | Implementation |
| --- | --- |
| Page structure | `header`/`nav`/`main`/`aside` landmarks; skip link → `main#main-content` |
| Headings | Exactly one `h1` per screen (`PageHeader`); card titles are real headings forming a coherent outline |
| Navigation | Two `<nav>` elements with distinct `aria-label`s ("Workspace", "Tools"); `aria-current="page"` on exactly one item |
| Lists | Real `ul`/`ol` for navigation and findings metadata |
| Tables | `caption` + `scope="col"`; used only for tabular data |
| Buttons vs links | `<button>` for actions, `<a href>` for navigation |
| Icons | `aria-hidden`, always accompanied by text or a labelled control |
| Status | Text badge + `severity`/`status` words; colour is never the sole carrier |

## Forms

* `Field` guarantees a `<label for>` on every control, with hint and error text
  attached via `aria-describedby`.
* `required` produces both a visible `*` and hidden "(required)" text.
* Errors set `aria-invalid="true"` and render with `role="alert"`.
* Errors appear **once** per problem (a fixed defect — previously the same message
  appeared in the alert and again in the field, and a storage failure was announced
  twice).
* The capture dialog shows a live byte budget, so the limit is predictable rather
  than a surprise rejection.

## Keyboard

| Interaction | Keys |
| --- | --- |
| Skip to content | `Tab` (first stop) |
| Navigate | `Tab`/`Shift+Tab` through nav, buttons and links |
| Open/close mobile menu | `Enter` on the toggle; `Escape` closes and restores focus |
| Dialog | Focus moves in on open, `Tab` cycles within, `Escape` closes, focus returns |
| Finding triage | Native `<select>` — full arrow-key support |
| Evidence disclosure | Native `<details>`/`<summary>` |
| Contrast checker | Native colour inputs plus text inputs |

No keyboard traps; nothing requires a pointer. Focus is never removed
(`:focus-visible` draws a 2 px ring with 2 px offset everywhere).

## Screen reader considerations

| Feature | Behaviour |
| --- | --- |
| Live regions | Save/validation toasts `polite`; errors `assertive`; the filter result count is `polite`; the contrast result is `polite` |
| Dialog announcement | `role="dialog"`, `aria-modal`, labelled by title, described by description |
| Loading | `Skeleton` uses `role="status" aria-busy="true"` with hidden text |
| Icon-only buttons | Compile-time requirement of an `aria-label` |
| Decorative SVG | `focusable="false"`, `aria-hidden="true"` |

**Not verified:** actual announcements with NVDA/JAWS/VoiceOver. The attributes
are present and tested for presence, not for output quality.

## Motion, zoom and reflow

| Requirement | Implementation |
| --- | --- |
| 1.4.4 Resize text (200%) | Relative units; no fixed-height text containers |
| 1.4.10 Reflow (320 px) | Breakpoints at 480/720/960/1100 px; tables scroll inside a wrapper, never the page |
| 2.3.3 Animation from interactions | `prefers-reduced-motion` collapses transitions/animations |
| 1.4.12 Text spacing | No `!important` line-height locks; text can reflow |
| Forced colours | `@media (forced-colors: active)` restores control borders in `CanvasText` |

## Known accessibility gaps

| Gap | Impact | Why it exists |
| --- | --- | --- |
| No real-browser or AT verification | Unfalsified risk of layout/announcement issues | No browser available in this environment |
| Severity bar is `aria-hidden` | Visual only | The same numbers are always present as text next to it |
| Findings list is paginated at 25 | Screen reader users cannot "read all" in one pass | Bounded DOM for performance; filters reduce the set |
| Toast auto-dismiss (6 s) | May be too fast for some users | Errors persist in a banner; WCAG 2.2.1 applies to time limits, and this is non-essential feedback |
| Print styles not verified | Unknown output fidelity | Cannot print from jsdom |
| No high-contrast theme beyond forced-colors | Users needing more than AA rely on OS settings | The token system makes adding one straightforward |

## Auditing the app with the app

A reasonable smoke test: capture the app's own served HTML into the workbench.
Expect the engine to report `document-lang` only if `lang` is missing (it is not),
and nothing else on static markup. The engine cannot see the runtime DOM, so this
checks markup, not the rendered UI — be explicit about that when presenting
results.

## Checklist for new UI

1. Labelled control (`Field`) or labelled control via `aria-label`.
2. Focus visible; reachable by `Tab`; no positive `tabindex`.
3. Contrast ≥ 4.5:1 text / 3:1 control boundaries (add to the token test if it is a
   new pair).
4. Semantics before ARIA: prefer native elements.
5. Any status conveyed by colour also conveyed by text.
6. Test at 320 px width and with 200% zoom.
7. If it moves, respect `prefers-reduced-motion`.
