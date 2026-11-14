# Changelog

All notable changes to this project. Format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versioning follows
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

The first release below is the initial implementation of the product (the
repository contained no application code before it).

## [1.0.0] — 2026-11-14

### Added — product

* **Workspace model.** Projects → scans → findings, persisted in `localStorage`
  with a versioned schema, migration, repair messages and typed persistence
  failures.
* **Deterministic audit engine** with **19 rules** covering WCAG 2.2 A/AA
  criteria that can be decided from markup alone: document language, page title,
  image text alternatives, button/link names, form labels, heading order, list
  structure, inline contrast, bypass blocks, landmark structure, interactive
  semantics, positive `tabindex`, SVG names, table headers, `fieldset`/`legend`,
  ARIA validity, `aria-checked`, and ARIA attribute spelling.
* **Findings triage.** Five statuses (`open`, `in_progress`, `fixed`, `accepted`,
  `ignored`), per-finding notes (500 chars), bulk "mark filtered as fixed",
  severity filters, search across message/selector/note/evidence.
* **Capture workflow.** Paste markup or load an HTML file (512 KB default, live
  byte budget), optional URL/template metadata, two bundled sample pages
  (failing and accessible).
* **Reports.** On-screen VPAT-style report with a conformance table, CSV export
  (RFC 4180 + formula-injection neutralisation), standalone HTML export (escaped,
  printable), and Markdown export (GitHub-flavoured).
* **Contrast checker.** Standalone WCAG ratio calculator with AA/AAA verdicts at
  normal and large text sizes and a live preview.
* **Rule reference.** Generated from the engine registry, so documentation cannot
  drift from behaviour.
* **Backup and restore.** JSON export/import with validation, plus a workspace
  reset behind a confirmation.
* **Settings/operations view.** Storage usage, schema version, limits, privacy
  statement, and the raw backup copy action.

### Added — platform

* Dark and light themes with a token system (37 colour tokens per theme),
  `prefers-color-scheme` support and no flash of incorrect theme on load.
* Responsive layout at 480/720/960/1100 px, off-canvas navigation below 960 px.
* Accessible primitives: skip link, labelled landmarks, modal focus trap and
  restore, live-region toasts, form field wiring, single `h1` per screen.
* Print styles for reports; `prefers-reduced-motion` and `forced-colors` support.

### Added — engineering

* 242 tests across 12 files: engine (35), colour (19), DOM utilities (18),
  storage/repository (35), selectors (22), routing (8), exporters (17), UI
  primitives (20), shell (8), theme hook (5), design tokens (35), full-app
  integration (20), plus regression cases for the two defects fixed late
  (exporters 17, storage 35 include them).
* TypeScript `strict` mode plus `noUnusedLocals`, `noUnusedParameters`,
  `noFallthroughCasesInSwitch` and `noUncheckedIndexedAccess`; ESLint flat config
  with type-aware rules; a single `verify` script for the release gate.
* Documentation set (this directory) with architecture, module, component, API,
  storage, testing, deployment and operations references.

### Fixed during development

* Select elements were named by their option text instead of their own label,
  producing false `form-label` findings.
* `isHiddenFromAT` ignored an ancestor's `aria-hidden`, so descendant content was
  audited when it should have been skipped.
* The severity filter for "open" included resolved findings through a mismatched
  predicate.
* Generic page titles ("Home") were reported at a severity that overstated their
  impact; now `minor`.
* Withdrawn characters in `parseColor` allowed signed channel values.
* The contrast pair used to validate thresholds actually failed AA, which had made
  the assertion meaningless.
* A modal query collided with two identically labelled close controls.
* Form validation announced the same error twice (alert + field).
* A storage failure was announced twice (persistent banner + dialog alert) and
  blocked the workflow; dialogs now close and the banner is the single source.
* `buildSelector` was quadratic in sibling count (12 KB page took ~219 ms and a
  1000-row page never finished); now linear (~0.39 ms/row).
* CSV export allowed spreadsheet formula injection from captured markup.
* Engine warnings (truncation, failed rules, pruning) were toast-only and lost on
  reload; they are now persisted on the scan and shown in the scan detail.

### Known limitations at 1.0.0

* Computed-style analysis is not possible: the engine sees captured markup and
  inline `style` attributes only, so stylesheet-driven contrast, focus visibility
  and layout issues are out of scope.
* No real-browser or screen-reader verification was performed (no browser
  available in the build environment). Performance figures are jsdom
  measurements.
* Single-user, single-tab: no accounts, no sharing, no cross-tab sync.
* No scheduled or site-wide crawling; one capture is one page.
