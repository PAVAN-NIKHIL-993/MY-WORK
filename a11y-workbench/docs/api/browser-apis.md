# API: browser platform usage

This application uses a small, deliberate set of browser APIs. Each one is listed
with its requirement, fallback and failure behaviour — because a product that
runs entirely in the browser is only as reliable as its use of platform features.

| API | Used for | Requirement | Fallback / failure behaviour |
| --- | --- | --- | --- |
| `localStorage` | Persist the workspace, theme | Any modern browser (not necessarily enabled) | Availability probe; typed failures; app continues in memory |
| `DOMParser` | Parse captured markup inertly | Universal | If it throws, the audit returns a warning and empty findings |
| `Intl.DateTimeFormat` | Date formatting | Universal | — (en-US/en-GB data is in every engine) |
| `TextEncoder` | UTF-8 byte length for the capture limit | Universal; guarded | Falls back to `string.length` |
| `crypto.randomUUID` | Ids | Secure contexts | Timestamp + random suffix fallback (`lib/id.ts`) |
| `matchMedia` | `prefers-color-scheme` | Universal; guarded | Treated as light theme |
| `Blob` + `URL.createObjectURL` | File downloads | Universal; guarded | `downloadTextFile` returns without throwing |
| `FileReader` | Import markup / backup JSON | Universal | `onerror` shows an inline message |
| `navigator.clipboard` | Copy defect text, markup, backup | Secure context (HTTPS/localhost) | Optional chaining: silently does nothing |
| `window.print` | Print the report | Universal | Browser print dialog or no-op |
| `location.hash` + `hashchange` | Routing | Universal | — |
| `<details>`/`<summary>` | Finding evidence, technical error detail | Universal | Renders expanded if unsupported |

## Deliberately **not** used

| API | Why not |
| --- | --- |
| `fetch` / `XMLHttpRequest` | No network is allowed at runtime (ADR-001) |
| `indexedDB` | Not needed at this data size; would add async complexity to the store |
| Service worker | The static build is cached by the browser; offline works because nothing is fetched. A SW would add a cache-invalidation failure mode for no benefit |
| `localStorage` events (cross-tab sync) | Multi-tab editing is not supported and is documented as a limitation |
| `dialog.showModal()` | Not implemented in jsdom, so the behaviour could not be tested; custom modal is tested |
| `innerHTML` with user content | XSS; the only HTML string produced is the exported report, which is escaped and written to a file, never to the app document |
| Web Workers | Engine runs in 7–60 ms for realistic captures; a worker would add message-passing complexity for no perceived gain |
| `postMessage` / BroadcastChannel | No cross-context communication needed |
| Web Crypto encryption | Would give a false sense of security without key management UX |

## Secure-context note

`crypto.randomUUID` and `navigator.clipboard` require HTTPS or `localhost`. Both
are guarded, so serving the build over plain HTTP on a LAN IP (a plausible
internal deployment) degrades gracefully: ids still work, clipboard copy silently
does nothing, everything else is unaffected.

## Storage quota reality

| Browser | Typical `localStorage` budget |
| --- | --- |
| Chrome / Edge | ~5 MB per origin (10 MB in some builds) |
| Firefox | ~10 MB per origin |
| Safari | ~5 MB, and aggressively evicts for sites not visited in 7 days |

Safari's eviction is why the Settings screen states that data is stored in the
browser and recommends backups; a user who returns after two weeks may find an
empty workspace. This is a platform behaviour, not an app bug, and it is
documented in [`../OPERATIONS.md`](../OPERATIONS.md).

## Feature detection summary

Every guarded API follows the same pattern: **detect, then degrade to a
documented behaviour, never throw.** The three that can materially change the
experience (`localStorage`, downloads, clipboard) all report their state to the
user rather than failing silently.
