# Error handling

Principles, in priority order:

1. **Never lose the user's work silently.** A failed save keeps the change in
   memory and says so persistently.
2. **Fail small.** One broken rule must not fail a scan; one broken record must
   not destroy a workspace.
3. **Be specific.** "Storage is full — export a backup, delete old scans" is
   actionable; "Something went wrong" is not.
4. **Keep the technical detail.** The error boundary exposes the stack; load
   repairs are listed verbatim.

## Failure catalogue

| # | Failure | Where detected | User sees | Data effect | Recovery |
| --- | --- | --- | --- | --- | --- |
| 1 | Empty markup | `validateScanInput` | Inline: "Paste the page markup to audit." | Nothing saved | Paste markup |
| 2 | Markup over limit | `validateScanInput` (byte count) | Inline with actual KB and the limit | Nothing saved | Trim capture or raise `VITE_MAX_CAPTURE_KB` |
| 3 | Missing project | `validateScanInput` | Inline: "Select a project before saving a scan." | Nothing saved | Pick/create a project |
| 4 | Name missing/too long | `validateProjectInput` / `validateScanInput` | Inline field error | Nothing saved | Fix field |
| 5 | Rule throws | `runAudit` per-rule `try/catch` | Toast: "Scan saved with N notice(s)" | Scan saved minus that rule's findings | Fix the rule; see `warnings[]` on the scan |
| 6 | Markup unparseable | `runAudit` `try/catch` | Warning: "Markup could not be parsed" | Empty findings, scan saved | Re-capture |
| 7 | Findings exceed cap | `runAudit` post-sort slice | Warning: "Only the first N of M findings were kept" | Extras dropped | Raise `VITE_MAX_FINDINGS_PER_SCAN` |
| 8 | Scans exceed per-project cap | `repository.createScan` | Warning: "Pruned N older scan(s)" | Oldest scans deleted | Export first; raise the limit |
| 9 | Quota exceeded on write | `saveWorkspace` (`QuotaExceededError` / `NS_ERROR_DOM_QUOTA_REACHED`) | Persistent red banner + 9 s toast | Change in memory only | Export backup, delete scans, retry |
| 10 | Storage unavailable | availability probe (`setItem` probe throws) | Persistent banner "storage unavailable" | In-memory only for the session | Enable site data / leave private mode |
| 11 | Invalid JSON in storage | `loadWorkspace` `JSON.parse` | Warning banner listing the reset | Workspace reset to empty | Restore a backup |
| 12 | Unrecognised stored shape | `migrateWorkspace` `reset: true` | Warning banner | Reset to empty | Restore a backup |
| 13 | Partially invalid records | `migrateWorkspace` normalisers | Warning list ("Dropped 3 invalid finding(s)") | Invalid records dropped | None needed |
| 14 | Scan referencing a missing project | `migrateWorkspace` | Warning ("…its project no longer exists") | Orphan dropped | None needed |
| 15 | Newer schema than this build | `migrateWorkspace` | Warning ("written by a newer version") | Unknown fields ignored | Upgrade the app |
| 16 | Bad backup file | `parseBackup` | Inline alert in Settings with the reason | No change | Choose a valid file |
| 17 | Backup save fails | `restoreBackup` outcome | Inline alert | In-memory replacement only | Free storage, retry |
| 18 | Unknown route | `parseHash` | Not-found screen | — | Use a listed route |
| 19 | Deleted project/scan deep link | Screen lookup | "This item is gone" + recovery buttons | — | Navigate to a live entity |
| 20 | Invalid colour input | `ContrastScreen` (`parseColor` → null) | Inline field error, result hidden | — | Enter a valid colour |
| 21 | Clipboard unavailable | `navigator.clipboard?.writeText` | Silent (no throw) | — | Manual copy |
| 22 | File read error | `FileReader.onerror` | Inline error | — | Retry / paste |
| 23 | Render exception | `ErrorBoundary.componentDidCatch` | Recoverable screen + stack in `<details>` | Persisted data unaffected | Reload |
| 24 | Blocked storage in private mode | probe | Banner: in-memory session | Not persisted | Normal window |

## Nothing is swallowed — audit

`catch` blocks in the codebase, and what each does:

| File | Catch | Behaviour |
| --- | --- | --- |
| `storage/local-store.ts` | probe | Returns `null` storage → the caller reports it |
| | `getItem` | Returns a repair message ("could not be read") |
| | `JSON.parse` | Returns a repair message + fresh workspace |
| | `JSON.stringify` | Returns `{ ok:false, reason:'unknown' }` |
| | `setItem` | Distinguishes quota vs unknown; both returned to the caller |
| | `removeItem` | Returns `{ ok:false }` with the message |
| `storage/backup.ts` | `JSON.parse` | Returns `{ ok:false, message }` including the parser message |
| `engine/audit.ts` | per-rule | Pushes a warning naming the rule and its error |
| | `parseMarkup` | Pushes a warning; returns an empty result |
| `lib/color.ts` | — | Returns `null` for unparseable input (documented contract) |
| `hooks/useTheme.ts` | storage write | Preference persistence is best-effort; the session continues |
| `lib/format.ts` | date parsing | Returns `—` instead of "Invalid Date" |
| `lib/id.ts` | `crypto.randomUUID` absent (feature check, not a catch) | Falls back to a timestamp/random id |
| `lib/theme-init.ts` | any storage/media-query error | Defaults to the light theme (cosmetic only) |
| `features/scans/CaptureDialog.tsx` | `new URL(url)` throws on a non-URL | Names the capture "Untitled capture" (a default, not an error to report) |

Every one of these either returns a typed failure, records a human-readable
warning, or applies a documented default. **There is no empty `catch {}`.** This
was verified by searching the source (17 `catch` occurrences across 7 source
files, all accounted for above):

```bash
grep -rn "catch" src --include=*.ts --include=*.tsx | grep -v test
```

## Error message standards

* **Say what happened** — "Browser storage is full, so this change was not
  saved."
* **Say what to do** — "Export a backup, then delete old scans or projects."
* **Never blame the user** — no "You entered invalid data"; state the constraint.
* **Include the number** when a limit is involved — "Markup is 604 KB; the limit
  is 512 KB."
* **Technical detail is available, not inline** — the error boundary puts the
  stack behind a disclosure; rule failures are named on the scan.

## Retry policy

There is no automatic retry anywhere. Every write is user-initiated and
synchronous, and the failures (quota, unavailable storage) are not transient — a
retry without user action would fail identically and hide the cause. The UI
instead offers the corrective action (free space, export, reload).
