# Data models

Types are defined in `src/types/domain.ts`. This file documents each model's
meaning, invariants and the decisions behind its fields.

---

## `Workspace`

| Field | Type | Invariant | Notes |
| --- | --- | --- | --- |
| `schemaVersion` | `number` | equals `SCHEMA_VERSION` after any load | Drives migration |
| `projects` | `Project[]` | ≤ 100, unique ids, newest first | Order is creation order (newest prepended) |
| `scans` | `Scan[]` | each `projectId` refers to an existing project | Not sorted globally; selectors sort |
| `updatedAt` | ISO string | set on every mutation | Informational, not used for sync |

**Why one root document:** atomic reads/writes. See ADR-004.

---

## `Project`

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `id` | `string` | yes | `prj_` + 20 chars |
| `name` | `string` | yes | 1–120 chars — the only validated field for creation |
| `description` | `string` | yes (may be `''`) | Called "Scope" in the UI; ≤ 1000 |
| `owner` | `string` | yes (may be `''`) | Team/auditor; printed in reports |
| `createdAt` | ISO string | yes | |
| `updatedAt` | ISO string | yes | Updated by `updateProject` only |

A project with no scans is valid ("awaiting first capture"); the UI separates it
from an audited project in the overview and reports.

---

## `Scan`

| Field | Type | Notes |
| --- | --- | --- |
| `id` | `string` | `scn_` + 20 chars |
| `projectId` | `string` | owner |
| `name` | `string` | user label or sample name |
| `url` | `string` | captured context, may be `''` |
| `template` | `string` | optional grouping for reports |
| `markup` | `string` | the evidence, stored verbatim, ≤ 512 KB by default |
| `engineVersion` | `string` | engine that produced the findings |
| `createdAt` | ISO string | capture time |
| `summary` | `ScanSummary` | **derived**, recomputed on load |
| `findings` | `Finding[]` | ≤ 400 by default |
| `warnings` | `string[]` | ≤ 20; non-fatal problems (truncation, failed rule, pruning) |

**Why markup is stored:** a finding is only useful if the element it refers to can
be inspected later, and a re-audit needs the same input. This is also why captures
are size-limited and why the privacy model matters.

---

## `ScanSummary`

| Field | Type | Meaning |
| --- | --- | --- |
| `total` | `number` | number of findings |
| `bySeverity` | `Record<Severity, number>` | instance counts |
| `passedByLevel` | `Record<WcagLevel, number>` | count of **rules** that produced no findings, by rule level |
| `rulesEvaluated` | `number` | 19 for the current registry |

`bySeverity` is trusted for display only after `migrateWorkspace` recomputes it.
`passedByLevel` is a coverage signal and is **not** used as a conformance claim
(see `buildConformance`).

---

## `EngineFinding` → `Finding`

The first is engine output (never persisted directly); the second is the stored
record.

| Field | On `EngineFinding` | On `Finding` | Notes |
| --- | --- | --- | --- |
| `ruleId` | ✓ | ✓ | permanent identifier |
| `ruleName` | ✓ | ✓ | snapshot of the rule name at capture time |
| `severity` | ✓ | ✓ | rule-level (or a per-instance override) |
| `wcagLevel` | ✓ | ✓ | `A`/`AA`/`AAA` |
| `successCriteria` | ✓ | ✓ | e.g. `['1.1.1']` |
| `message` | ✓ | ✓ | what is wrong, one sentence |
| `remediation` | ✓ | ✓ | how to fix |
| `selector` | ✓ | ✓ | generated path for the offending element |
| `snippet` | ✓ | ✓ | ≤ 240 chars of escaped-safe `outerHTML` |
| `detail` | optional | optional | measurement, e.g. `foreground #9aa0a6 on background #ffffff` |
| `id` | — | ✓ | `<scanId>_f<index>` |
| `scanId` | — | ✓ | owner |
| `status` | — | ✓ | triage state |
| `note` | — | ✓ | auditor note ≤ 500 |
| `updatedAt` | — | ✓ | last triage change |

**Snapshot rationale:** `ruleName`, `severity` and `remediation` are copied so a
later engine change cannot rewrite history. Renaming a rule therefore leaves old
scans with the old name — intentional, and the reason rule ids must never change.

---

## `FindingStatus`

| Value | Label | Counts as resolved | Intended meaning |
| --- | --- | --- | --- |
| `open` | Open | no | not yet assessed |
| `in_progress` | In progress | no | being fixed |
| `fixed` | Fixed | yes | remediated (verify by re-scanning) |
| `accepted` | Accepted risk | yes | knowingly not fixed; documented exception |
| `ignored` | Not applicable | yes | false positive or out of scope |

`RESOLVED_STATUSES` is the single source for "resolved", used by selectors, the
inbox filter and the report mapping. Adding a status means updating that array,
the label map, `schema.ts`'s allowed list, `STATUS_TONE` and the triage select.

---

## `Severity`

Ordered `critical → serious → moderate → minor`; `SEVERITY_ORDER` drives sorting
and the proportional bar. Definitions are in
[`../modules/audit-engine.md`](../modules/audit-engine.md#severity-policy).

---

## Transient models (not persisted)

| Type | Where | Purpose |
| --- | --- | --- |
| `EngineResult` | `engine/audit.ts` | `findings` + `summary` + `warnings` + version |
| `MutationOutcome` | `storage/repository.ts` | `{ workspace, persistence? }` |
| `LoadResult` | `storage/local-store.ts` | `{ workspace, fresh, repairs, bytes }` |
| `SaveResult` | `storage/local-store.ts` | `{ ok, reason?, message? }` |
| `ReportInput` | `features/reports/exporters.ts` | `{ project, scans, generatedAt? }` |
| `Toast` | `state/workspace-context.tsx` | id, tone, message, optional action |

---

## Model change checklist

When changing any persisted model:

1. Update `src/types/domain.ts`.
2. Update the normaliser in `src/storage/schema.ts` (this is the step that is
   easy to miss — an unhandled field is silently dropped on reload).
3. Bump `SCHEMA_VERSION` and add a migration branch if the change is not
   defaultable.
4. Update the fixtures in `src/test/fixtures/workspace.ts`.
5. Update the CSV column list if the field should be exported.
6. Update this document and [`schema.md`](schema.md).
