# Components: feature screens

One entry per screen. Every screen is a pure function of the route + workspace,
except where local UI state is listed.

Common structure: `PageHeader` (the single `h1`) → contextual banner/empty state
→ content → supporting detail. Actions live in the header, destructive ones
require a second click.

---

## `OverviewScreen`

**File.** `src/features/workspace/OverviewScreen.tsx` · **Route** `#/`
**Purpose.** Answer "what needs work, where, and what next" in one screen.

| Section | Content |
| --- | --- |
| Header | Title changes when the workspace is empty ("Start your first accessibility audit"), description with project/scan/open counts |
| Onboarding (empty only) | Four-step list: create project → capture → triage → report |
| Stat tiles | Open findings, Critical, Serious, Resolution % |
| Severity card | Proportional `SeverityBar` + text legend with counts |
| Projects card | Up to six projects, open count or "Clear"/"New", link to manage |
| Failing rules card | Top five rules by occurrences with severity and open counts |

**Empty states.** No projects → onboarding. No findings → severity card hidden and
a neutral "Nothing captured yet" state in the rules card.
**Loading.** None needed (synchronous store).
**Accessibility.** Each card is a labelled region; the bar is `aria-hidden` and the
numbers are in text; project rows are links.
**Modification risks.** The `projectRows` memo combined two selectors
(`projectScans` + inline open count); if refactored, keep using `openFindings`
rather than re-implementing "resolved" inline (a status could be missed).

---

## `ProjectsScreen`

**File.** `src/features/projects/ProjectsScreen.tsx` · **Route** `#/projects`

* Grid of `.project-card` links: name, scope (2-line clamp), severity badges,
  scans/open counts and last-scan date.
* Search filters name, scope and owner, with a polite result count.
* Empty: "No projects yet" with a primary "Create your first project".
* No results: "No matching projects" with a Clear search action.
* Create dialog: `ProjectFormDialog`.

**Note.** A project with scans but no open findings shows a success badge ("No
open findings"), not an error tone — the visual language distinguishes "clean"
from "not started".

---

## `ProjectDetailScreen`

**File.** `src/features/projects/ProjectDetailScreen.tsx` · **Route** `#/projects/:id`

* Breadcrumb, header with owner eyebrow, Edit / Delete / Capture page.
* Stat tiles (only when findings exist): open, resolved %, severity breakdown.
* Scans card: newest first, each row shows date, template, URL, open count or
  "Clear", plus a per-row Delete that becomes "Confirm".
* Empty: "Capture the first page" with the primary action.
* Success banner when scans exist but no findings ("No findings in this project")
  with the static-capture caveat.
* Metadata card: created, updated, owner, scan count.
* Delete project: two-step, names the number of scans that will be lost.
* Missing project → `NotFoundScreen` with a "deleted" message.

**Modification risk.** Deleting a project cascades to its scans (repository). The
confirmation text must keep naming that consequence.

---

## `CaptureDialog`

**File.** `src/features/scans/CaptureDialog.tsx` · opened from project screens

**Fields.** Project (only shown when >1 exists), Capture name (auto-defaults),
Template, Page URL, Page markup (required). Live byte budget under the textarea.
"Load HTML file" (validates size before reading) and two sample buttons.

**Validation.** `validateScanInput`: project exists, name 1–120, URL ≤ 2048,
markup non-empty and ≤ `maxCaptureBytes`. Errors are inline; the "Run audit"
button is disabled while over the size limit.

**Behaviour.** On success: `addScan` → persist → navigate to the scan detail. On
persistence failure: the scan still opens and the app-wide banner explains; the
dialog does not duplicate the message.

**Accessibility.** Modal focus trap; labels for every field; the size budget is
hint text tied via `aria-describedby`; error uses `role="alert"`.

**Modification risks.** Removing the pre-read size check lets a 50 MB file into
memory; removing the byte (not character) limit computation lets a multi-byte
capture slip past the limit.

---

## `FindingCard`

**File.** `src/features/findings/FindingCard.tsx`

| Area | Content |
| --- | --- |
| Title row | severity badge, rule name, WCAG level badge, success criteria, status badge (when not open) |
| Message | one sentence from the engine |
| Meta | monospace selector, optional `detail` (e.g. measured ratio) |
| Control | triage `<select>` with a visually hidden label naming the rule |
| Disclosure | "Evidence and remediation": captured element markup (escaped in a `<pre>`), how to fix, auditor note (saves on blur, 500 char limit with a live counter), "Copy defect text" |

**Why `<details>`:** native keyboard support and screen reader announcement for
free; collapsed by default keeps a 80-finding list scannable.

**Accessibility.** The select's label includes the rule name so a screen reader
user knows which finding is being changed.

**Modification risks.** Saving the note per keystroke would write to
`localStorage` dozens of times per sentence; keep the blur handler.

---

## `FindingsScreen`

**File.** `src/features/findings/FindingsScreen.tsx` · **Route** `#/findings`

* Filters: search (rule/message/selector/note/evidence), project, severity,
  status (default "Needs work"), reset button.
* Polite live count: "N findings match the current filters — showing the first 25".
* 25 at a time with "Show 25 more".
* Empty workspace → "No findings yet" with a route to projects.
* Empty filter result → distinguishes "no findings match" (filters active) from
  "nothing needs work" (no filters).

**Modification risk.** The status filter treats `open` as "needs work" (excludes
fixed/accepted/ignored). That definition comes from the same resolution rule as
`isResolved` and must stay aligned.

---

## `ScanDetailScreen`

**File.** `src/features/findings/ScanDetailScreen.tsx` · **Route** `#/findings/:scanId`

* Breadcrumb (Projects / project / scan), title, captured timestamp eyebrow,
  description with counts, rules evaluated, engine version and URL.
* Actions: Export CSV (this scan), Delete (two-step).
* Stat tiles: total, critical, serious, moderate (from the stored summary).
* Metadata grid: project, template, URL, captured, markup size, triage counts.
* Toolbar: severity filter (with counts), "Mark filtered as fixed", toggle
  captured markup.
* Findings list; empty states distinguish "passed every rule" from "no findings in
  this severity".
* Captured markup panel: escaped `<pre>`, copy button, never rendered.

**Note.** This screen is the only place a user can see the exact captured HTML,
which is what makes a finding reproducible.

---

## `ReportsScreen`

**File.** `src/features/reports/ReportsScreen.tsx` · **Route** `#/reports`

Table of projects with scans (scans, findings, resolved %, open-by-severity
badges, last capture, Open report) and a second list of projects awaiting a first
capture. Empty workspace → empty state.

---

## `ReportDetailScreen`

**File.** `src/features/reports/ReportDetailScreen.tsx` · **Route** `#/reports/:projectId`

* Header actions: Print, Markdown, Download HTML (disabled when no scans).
* Info alert stating what the report can and cannot claim.
* "Include all N scans" checkbox with an explanation of why the latest-only default
  exists.
* Stat tiles: scans included, findings, resolved %, open critical.
* Conformance table from `buildConformance(latest)`, with an explicit statement
  when the latest scan had no findings.
* Severity badge row, list of included scans, generation note.

**Modification risks.** Export buttons build the document at click time — do not
cache the string in state, or an export could reflect stale triage.

---

## `ContrastScreen`

**File.** `src/features/contrast/ContrastScreen.tsx` · **Route** `#/contrast`

* Two colour fields (text/background) with native colour pickers, validation
  errors, five presets, swap button.
* Result card: large ratio (pass/fail colour + word), pass/fail badge, live
  preview at three sizes on the actual colours, three threshold checks with
  ratios, and an explanation of the large-text definition.
* Invalid input: inline error, result hidden (never "0:1").

**Accessibility.** The ratio is `aria-live="polite"`; colour is never the only
signal (the word "Pass"/"Fail" is present).

---

## `RulesScreen`

**File.** `src/features/workspace/RulesScreen.tsx` · **Route** `#/rules`

Generated from `RULE_DESCRIPTORS` — cannot drift from the engine. Search by name,
id or success criterion; severity filter; one `<article>` per rule with severity,
WCAG badge, description, success criteria and remediation.

---

## `SettingsScreen`

**File.** `src/features/workspace/SettingsScreen.tsx` · **Route** `#/settings`

| Card | Content |
| --- | --- |
| Appearance | Light / dark / match system radio cards, resolved theme stated |
| Workspace data | Counts, schema version, storage key, Export backup, Restore backup, Reset workspace (confirm panel) |
| Operational limits | Max capture size, findings cap, scans per project, projects cap, engine version, rules, app version |
| Privacy and security | No-network statement, `DOMParser` explanation, unencrypted-storage warning, raw JSON download, copy backup |

**Modification risks.** Reset must stay behind the confirmation panel; the copy
must keep stating that data is unencrypted.

---

## `NotFoundScreen`

**File.** `src/features/workspace/NotFoundScreen.tsx`

Two messages: "Page not found" (unknown route) and "Not available / This item is
gone" (deleted or unknown entity, message supplied by the caller), both with
"Go to overview" and "Browse projects".
