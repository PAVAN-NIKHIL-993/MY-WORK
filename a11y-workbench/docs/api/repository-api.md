# API: repository

Module: `src/storage/repository.ts`
Consumers: `src/state/workspace-context.tsx`, forms (validators), tests.

## Common contract

Every function:

* takes the **current workspace** as its first argument;
* returns `MutationOutcome = { workspace: Workspace; persistence?: SaveResult }`;
* **never mutates** its arguments;
* touches `workspace.updatedAt`;
* persists through `saveWorkspace` before returning;
* keeps the in-memory change even when persistence fails (the failure is in
  `persistence`).

`SaveResult` is `{ ok: true }` or `{ ok: false, reason: 'quota' | 'unavailable' |
'unknown', message: string }`.

---

## Validators

### `validateProjectInput(input)`

| | |
| --- | --- |
| Signature | `({ name, description?, owner? }) => string \| null` |
| Returns | `null` when valid, otherwise a user-facing message |
| Rules | name required, trimmed, ≤ 120 chars |

### `validateScanInput(workspace, input)`

| | |
| --- | --- |
| Signature | `(Workspace, { projectId, name, url?, template?, markup }) => { ok:true } \| { ok:false, field?, message }` |
| `field` | `'project' \| 'name' \| 'markup' \| 'url'` — so the form can attach the error |
| Rules | project exists · name 1–120 · URL ≤ 2048 · markup non-empty · markup ≤ `maxCaptureBytes` (UTF-8 bytes) |

Both validators are used by the UI **and** called again inside the mutation, so a
programmatic caller cannot bypass them.

---

## Projects

### `createProject(workspace, input) → MutationOutcome`

Prepends a new project (newest first), trims values, caps at `maxProjects`.

```ts
const outcome = createProject(workspace, { name: 'Acme Store', owner: 'QA' });
if (!outcome.persistence?.ok) { /* show banner */ }
```

### `updateProject(workspace, projectId, patch) → MutationOutcome`

Only the keys present in `patch` are changed (`name`, `description`, `owner`).
Unknown id ⇒ no change (workspace returned unchanged apart from `updatedAt`).

### `deleteProject(workspace, projectId) → MutationOutcome`

**Cascades:** removes the project and every scan belonging to it. Irreversible.

---

## Scans

### `createScan(workspace, input) → MutationOutcome & { scan?; warnings? }`

1. Validates input; on failure returns `{ workspace, warnings: [message] }` and
   **no scan**.
2. Runs `runAudit(markup)`.
3. Builds findings with `status:'open'`, `note:''` and ids `<scanId>_f<n>`.
4. Prunes the project's scans to `maxScansPerProject`, recording a warning.
5. Persists and returns `{ workspace, scan, warnings, persistence? }`.

Warnings come from the engine (truncation, failed rules) plus the pruning notice,
and are **stored on the scan** (`scan.warnings`) as well as returned.

### `deleteScan(workspace, scanId) → MutationOutcome`

Removes the scan and its findings.

---

## Triage

### `updateFinding(workspace, scanId, findingId, { status?, note? })`

Patches only the supplied fields, always sets `updatedAt`. Unknown ids are a no-op
(the function is safe to call from a stale row).

### `bulkUpdateFindings(workspace, scanId, findingIds, status)`

One write for many findings — used by "Mark filtered as fixed".

---

## Workspace-level

### `replaceWorkspace(workspace) → MutationOutcome`

Full replacement (backup restore). The caller is responsible for confirming the
loss of the current workspace.

### `resetWorkspace() → Workspace`

Returns a valid empty document (does **not** persist; the provider calls
`clearWorkspace`).

---

## Helpers

| Function | Purpose |
| --- | --- |
| `projectPath(projectId)` | `#/projects/<id>` — centralised so links never drift |
| `evidenceLabel(finding)` | Truncated selector/snippet for tables |

---

## Error behaviour

| Situation | Result |
| --- | --- |
| Validation failure | `{ workspace: unchanged, warnings: [message] }` |
| Persistence failure | `persistence: { ok:false, … }`, change kept in memory |
| Unknown id | No-op, still returns a workspace |
| Engine warning | Forwarded in `warnings` and stored on the scan |

## Performance

| Operation | Dominant cost |
| --- | --- |
| `createScan` | engine (7–60 ms typical) + serialising the workspace |
| `updateFinding` | mapping scans/findings (linear) + serialising |
| `deleteProject` | filtering + serialising |

All are well under a frame at realistic sizes; the whole-document write is the
part that scales with total workspace size (ADR-004).

## Modification risks

| Change | Risk |
| --- | --- |
| Returning a mutated input workspace | Breaks React's referential change detection and could corrupt a previous snapshot |
| Skipping `commit()`/`touch()` | Changes silently not persisted, or `updatedAt` goes stale |
| Removing the second validation inside `createScan` | A programmatic caller could store markup over the limit |
| Forgetting pruning | `localStorage` quota becomes the normal failure path |
