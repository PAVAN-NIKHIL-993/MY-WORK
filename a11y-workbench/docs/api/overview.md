# API overview

**This product has no HTTP API.** There is no server, no endpoint, no
authentication and no network request at runtime. The "API" of this system is the
set of internal module contracts that other modules (and tests) rely on.

This directory documents those contracts precisely enough to use them without
reading the implementations:

| Document | Contracts |
| --- | --- |
| [`engine-api.md`](engine-api.md) | `runAudit`, the `Rule` interface, `violation`, rule registry |
| [`repository-api.md`](repository-api.md) | Every mutation function, validation contracts, outcomes |
| [`storage-api.md`](storage-api.md) | Load/save/clear, backup serialise/parse, migration |
| [`browser-apis.md`](browser-apis.md) | The browser features used, their requirements and fallbacks |

## Why no HTTP API, restated

| Requirement | Consequence |
| --- | --- |
| Confidential markup must not leave the machine | No upload path exists |
| The app must work offline | No runtime fetch |
| No operations burden | No server to run, patch or scale |
| No accounts | No auth surface to get wrong |

If a server is ever added, `storage/` is the seam: `local-store.ts` is four
functions behind a stable contract (see [`storage-api.md`](storage-api.md)).

## Versioning

| Version | Where | Meaning |
| --- | --- | --- |
| `APP_VERSION` (`1.0.0`) | `src/config.ts` | Product version, shown in Settings and stamped on exports |
| `SCHEMA_VERSION` (`3`) | `src/config.ts` | Persisted data shape; bump with a migration |
| `ENGINE_VERSION` (`1.0.0`) | `src/engine/audit.ts` | Rule behaviour; stamped on every scan |

A scan stores `engineVersion`, so an exported report can always be traced to the
rule set that produced it.

## Compatibility matrix

| Data written by | Read by `SCHEMA_VERSION` 3 | Behaviour |
| --- | --- | --- |
| schema 1 (pre-triage) | yes | Triage fields default to `open`/`''`; repair logged |
| schema 2 | yes | Additive defaults |
| schema 3 (current) | yes | No repairs |
| schema 4 (future) | yes, with warning | Unknown fields ignored, known fields read |

Anything unrecognisable at the top level (not an object, no `projects`/`scans`
arrays) yields `reset: true` and an empty workspace, never a crash.
