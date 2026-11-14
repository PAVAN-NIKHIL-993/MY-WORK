# Module: exporters

**Location.** `src/features/reports/exporters.ts`
**Consumers.** `ReportDetailScreen` (HTML + Markdown), `ScanDetailScreen` (CSV),
`/tmp` benchmark-free contexts, tests.
**Depends on.** `types/domain.ts`, `lib/dom.ts` (`escapeHtml`), `lib/format.ts`,
`state/selectors.ts`, `engine/audit.ts` (`ENGINE_VERSION`), `config.ts`.

## Purpose

Turn scans into portable documents. Pure string builders only — no DOM, no Blob,
no download. That separation is what makes them unit-testable and reusable (the
same function could feed a future CLI or API).

## Public interface

| Function | Input | Output |
| --- | --- | --- |
| `findingsToCsv(scans)` | `Scan[]` | RFC-4180 CSV string |
| `buildMarkdownReport(input)` | `ReportInput` | Markdown document |
| `buildHtmlReport(input)` | `ReportInput` | Standalone HTML document |
| `ReportInput` | `{ project, scans, generatedAt? }` | — |

`generatedAt` is injectable so tests can assert exact output; production omits it
and gets `new Date().toISOString()`.

## CSV

* Header row always present, even with zero findings (so a spreadsheet import does
  not fail on an empty file).
* One row per finding, 16 columns: project, scan, URL, rule id, rule name,
  severity, WCAG level, success criteria, status, selector, message, remediation,
  evidence, detail, note, captured timestamp.
* Quoting: a field is quoted when it contains `"`, `,`, `\r` or `\n`; embedded
  quotes are doubled. Line endings are CRLF per RFC 4180.

## Markdown

Structure: title → metadata (owner/scope) → summary table → per-rule table →
conformance table (latest scan) → one section per scan with a findings table →
a closing limitations paragraph.

* Pipes inside cells are escaped (`\|`) and newlines collapsed, so a finding
  message cannot break the table.
* Empty findings produce an explicit `_No violations found in the captured
  markup._` line rather than an empty table.
* The limitations paragraph is always included — the report never leaves the
  building without its caveats.

## HTML

A single self-contained file: `<!doctype html>`, inline `<style>`, no external
assets, so it can be emailed, printed or archived and still render.

Accessibility of the exported document itself:

* `<html lang="en">`, `<title>` with the project name.
* `<caption>` on every table and `scope="col"` on headers.
* Semantic `<header>`/`<main>`/`<section>`/`<footer>`.
* Print styles (`break-inside: avoid` on sections, reduced padding).

**Escaping:** every interpolated value goes through `escapeHtml`. A finding whose
message is `<script>alert(1)</script>` renders as literal text — asserted by a
test.

## Conformance table source

The Markdown report includes conformance rows from `buildConformance(latestScan)`
using the mapping documented in [`../architecture/data-flow.md`](../architecture/data-flow.md#conformance-mapping).
The HTML report focuses on per-scan findings plus a severity table (the on-screen
report carries the full conformance table).

## Failure behaviour

These functions cannot throw on valid input:

* Missing optional fields render as `—` or empty cells.
* Zero scans render a summary with `0` and no scan sections.
* `formatDateTime` returns `—` rather than "Invalid Date" for a bad timestamp.

The only realistic failure is a caller passing a hand-built object that violates
the domain type — a programming error caught by TypeScript.

## Performance

String concatenation over arrays; a 400-finding scan produces roughly 60 KB of
HTML in well under a millisecond. No measurement is claimed beyond "not
noticeable" because it has not been separately benchmarked.

## Security considerations

* HTML: escaped values, no `dangerouslySetInnerHTML` equivalent, no remote assets.
* CSV: **formula injection is neutralised.** A cell beginning with `=`, `+`, `-`,
  `@`, a tab or a carriage return is prefixed with `'` so a spreadsheet treats it
  as text. Captured markup is attacker-influenced input and a finding message or
  selector could otherwise execute as a formula when the CSV is opened in Excel or
  Sheets. Covered by three tests.

## Extension points

* New format: add a builder with the same `ReportInput` signature; wire a button
  in `ReportDetailScreen`.
* New column: add to the CSV header array **and** the row array (they are
  positionally coupled — the one fragile part of this module).

## Modification risks

| Change | Risk |
| --- | --- |
| Changing CSV column order | Breaks downstream spreadsheets/templates that reference positions |
| Removing the escaping | XSS in the exported HTML when opened from disk |
| Removing the CSV neutralisation | Formula execution when a CSV export is opened in a spreadsheet |
| Removing the limitations paragraph | The report over-claims conformance |
| Making these functions touch the DOM | Loses testability and break in SSR/Node contexts |
