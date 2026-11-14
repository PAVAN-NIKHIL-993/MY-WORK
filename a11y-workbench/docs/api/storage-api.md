# API: storage

Module: `src/storage/local-store.ts` (I/O), `src/storage/schema.ts` (validation),
`src/storage/backup.ts` (portability).

This is the seam to replace if the product ever moves to a server or IndexedDB.

---

## `loadWorkspace()`

| | |
| --- | --- |
| Signature | `() => LoadResult` |
| `LoadResult` | `{ workspace: Workspace; fresh: boolean; repairs: string[]; bytes: number }` |
| Throws | Never |
| Side effects | A probe write + read (availability check) |
| Performance | Linear in stored size; ~1–3 ms at realistic sizes |

`fresh` is `true` when nothing was stored (first run) **or** storage is
unavailable — the distinction is carried by `repairs`, not `fresh`.

`repairs` examples:

* `"Stored workspace is not valid JSON and was reset. Export a backup regularly."`
* `"Dropped 2 invalid finding(s) in scan “Home page”."`
* `"Workspace upgraded from schema 1 to 3."`
* `"Dropped scan “Gallery” because its project no longer exists."`
* `"Browser storage is unavailable; changes will not be saved after reload."`

---

## `saveWorkspace(workspace)`

| | |
| --- | --- |
| Signature | `(workspace: Workspace) => SaveResult` |
| `SaveResult` | `{ ok: true }` \| `{ ok: false; reason: SaveFailureReason; message: string }` |
| Throws | Never |
| Side effects | `localStorage.setItem(STORAGE_KEY, …)` with `updatedAt` stamped |

| `reason` | When | `message` (verbatim) |
| --- | --- | --- |
| `quota` | `QuotaExceededError`, `NS_ERROR_DOM_QUOTA_REACHED`, or `/quota/i` in the message | "Browser storage is full, so this change was not saved. Export a backup, then delete old scans or projects." |
| `unavailable` | Storage missing or the probe write throws | "Browser storage is unavailable, so this change was not saved. Keep this tab open or allow site data." |
| `unknown` | Serialisation failure or any other write error | prefixed with "Saving failed: " |

---

## `clearWorkspace()`

`() => SaveResult`. Removes the key. Used by `resetAll()` in the provider; the
provider then rebuilds an empty in-memory workspace.

## `measureStoredBytes()`

`() => number` — length of the stored string (fast approximation of bytes, not
UTF-8 exact). Returns `0` when storage is unavailable. Used by Settings and after
every mutation for the usage figure.

---

## `migrateWorkspace(raw)`

| | |
| --- | --- |
| Signature | `(raw: unknown) => { workspace: Workspace; repairs: string[]; reset: boolean }` |
| Throws | Never |
| `reset: true` | The document is unusable; caller should start empty |

See [`../database/schema.md`](../database/schema.md#migrations) for the algorithm
and per-field normalisation.

---

## Backup functions

| Function | Signature | Notes |
| --- | --- | --- |
| `createBackup` | `(Workspace) => BackupFile` | Adds `app` and `exportedAt` |
| `serializeBackup` | `(Workspace) => string` | Pretty JSON |
| `parseBackup` | `(string) => { ok, workspace?, message }` | 40 MB cap; accepts the envelope or a bare workspace |
| `downloadBackup` | `(Workspace) => void` | Browser download (Settings uses `lib/download` for symmetry) |

---

## Replacing the backend

To move to IndexedDB, a server API or an encrypted store, implement four
functions with the same contracts:

```ts
loadWorkspace(): LoadResult
saveWorkspace(ws: Workspace): SaveResult
clearWorkspace(): SaveResult
measureStoredBytes(): number
```

Everything above this layer (repository, provider, UI) is unchanged. Two caveats:

1. `WorkspaceProvider` reads synchronously on first render. An async backend
   requires a loading state — the provider already exposes `ready` for that.
2. `migrateWorkspace` must stay the validation entry point for whatever the
   backend returns, so corrupt or foreign data is still repaired rather than
   trusted.

---

## Testing notes

`src/storage/storage.test.ts` (35 tests) covers: fresh load, round-trip, corrupt
JSON, unavailable storage, quota typing (with the probe still working — a
detailed mock of the real failure), clear, backup round-trip, foreign file
rejection, and the full repository surface.

`src/test/setup.ts` clears `localStorage` after each test, so tests cannot leak
state into one another.
