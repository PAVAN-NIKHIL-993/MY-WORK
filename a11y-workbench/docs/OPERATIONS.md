# Operations

This product has no servers to operate. "Operations" therefore means: supporting
people who use it, keeping deployments healthy, and protecting their data.

## Operating model

| Aspect | Reality |
| --- | --- |
| Hosting | Static files (CDN/Pages/any web server) |
| Backend | None |
| Database | None (browser `localStorage` per user) |
| Secrets | None at runtime |
| Availability | The host's availability; the app itself cannot "go down" |
| Scaling | CDN scaling of static assets; per-user data never reaches the server |
| Monitoring | No telemetry, no analytics, no logging endpoint — by design |
| On-call | Not applicable; failures are client-side and visible to the user |

## What "incident" means here

| Signal | Meaning | Response |
| --- | --- | --- |
| Site returns 404 for `/assets/…` | Wrong `base` for the host path | Rebuild with `VITE_BASE_PATH` |
| Blank page after deploy | Unmatched asset hashes or a syntax error in a legacy browser | Check console; verify target browsers |
| Users report "storage is full" | Real quota exhaustion | Guide: delete old scans, export+reset, restore subset |
| Users report "changes not saved" | Quota or private mode | Same as above; check browser settings |
| Users report lost data | Site data cleared (Safari), profile reset, or another tab overwrote | Restore backup; if none, not recoverable — be direct about this |

## Routine maintenance

| Cadence | Task |
| --- | --- |
| Each release | `npm run verify`, demo path on preview, version bump + CHANGELOG |
| Monthly | `npm audit`, `npm outdated`; evaluate `vite`/`react` patch upgrades |
| Quarterly | Review the rule set against WCAG 2.2 changes; re-read the known gaps list |
| On demand | Restore a user's backup into a test profile to reproduce a report |

## Data retention and privacy

| Item | Facts |
| --- | --- |
| Where data lives | The user's browser profile, unencrypted |
| Who can read it | Anyone with access to that profile; any script on the same origin |
| Retention | Until the user clears it, deletes it, or the browser evicts it |
| Backups | JSON files the user stores themselves — our tooling cannot reach them |
| PII in captures | Possible (the user chooses what markup to paste) — documented as the user's responsibility |
| Telemetry | None |

**Recommendation for teams:** treat a workspace backup as a confidential document
(it contains captured pages and audit notes), and avoid pasting markup from pages
containing personal data unless the auditor is permitted to retain it.

## Support playbook

### "My data disappeared"

1. Ask which browser and whether it was Safari (7-day eviction) or a private window.
2. `Settings → Workspace data` shows counts and stored bytes — if counts are zero
   but a backup exists, restore it.
3. Check `localStorage` in DevTools for `a11y-workbench:workspace`.
4. Check whether the URL/host changed (storage is per origin).
5. If nothing exists, the data cannot be recovered. Say so plainly.

### "It says the browser storage is full"

1. `Settings → Workspace data` shows stored bytes.
2. Export a backup.
3. Delete the largest/oldest projects (findings and captured markup dominate size).
4. Restore only what is needed, or start a fresh workspace.

The captured markup is usually the largest field; a 500 KB page is 500 KB per scan,
and 25 scans is 12 MB — more than most browsers allow.

### "The audit missed something"

1. Confirm the element is in the **captured HTML**. The engine only sees markup it
   was given; it does not load stylesheets, scripts or the live DOM.
2. Check the rule list (`#/rules`) for whether a rule exists for that criterion.
3. If it is a rule gap, that is expected coverage, not a bug — see the coverage
   table in [`modules/audit-engine.md`](modules/audit-engine.md).

### "The report says conformant"

The report never claims conformance. If it appears to, check that the caveat
paragraph is present in the export — its absence is a bug.

## Capacity planning

| Resource | Guidance |
| --- | --- |
| Workspace size | Add ~1 MB per 2 captured pages of typical size; cap is the browser's quota |
| Scans per project | 25 default; pruning is automatic and announced |
| Findings per scan | 400 default; above that the result is truncated and flagged |
| Sessions | Any number of users; each is independent (no shared state) |

## Backup guidance given to users

> **Export a backup at the end of each audit session.**
> Settings → Workspace data → Export backup. The file contains everything,
> including captured markup — store it somewhere access-controlled.

## Disaster recovery

| Loss | Recovery |
| --- | --- |
| Browser data cleared, backup exists | Settings → Restore backup |
| Backup exists, new machine | Open the app, restore the backup |
| No backup | Not recoverable; re-capture and re-triage |
| Corrupt stored document | The app resets in memory with a banner; a backup can be restored *before* the next write |

## Change management

| Change type | Extra steps |
| --- | --- |
| Rule added/changed | Bump `ENGINE_VERSION`; note that old scans keep old results (by design) |
| Schema change | Bump `SCHEMA_VERSION`; test migration from the previous version explicitly |
| Storage key change | **Avoid** — orphans every user's data |
| Hosting move | Warn users to export a backup first (storage is per origin) |
