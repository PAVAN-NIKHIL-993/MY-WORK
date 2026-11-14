# Troubleshooting

Symptom → cause → fix. Every entry corresponds to a real failure mode in the code.
Use the browser console and `Settings → Workspace data` first; both answer most
questions.

## Development

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| `Cannot find module '@/…'` | Alias missing in `tsconfig.json` `paths` (Vite resolves it separately) | Add it to **both** configs |
| `EADDRINUSE :5173` | Another dev server is running | `npm run dev -- --port 5174` or stop the other process |
| Blank page, no console error | `#/` hash lost after a manual edit | Navigate to `http://localhost:5173/#/` |
| HMR does not reflect storage changes | The provider reads storage once at boot | Full reload |
| `vitest` fails with `document is not defined` | Test lives outside the jsdom environment | Put it under `src/`, or set the environment per file |
| `matchMedia is not a function` | A new test imports something before `setup.ts` runs | Keep platform mocks in `src/test/setup.ts` |
| `expect(...).toBeInTheDocument is not a function` | Missing jest-dom import | `src/test/setup.ts` imports `@testing-library/jest-dom/vitest` |
| ESLint complains about a type-only import | `import type` required by `consistent-type-imports` | Use `import type { X } from '…'` |
| `TS2345` on `serializeBackup` | Passing a partial fixture | Build a full `Workspace` (use `makeWorkspace`) |

## Runtime

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| Banner: "Browser storage is unavailable" | Private mode / blocked site data | Allow site data, or accept in-memory session |
| Banner: "Browser storage is full" | Quota exceeded | Export backup, delete old scans/projects |
| Banner: "Stored workspace is not valid JSON" | Corrupted document | Restore a backup; the corrupt copy is replaced on the next write |
| Banner: "Dropped N invalid finding(s)" | Records failed validation | Expected repair; the rest of the workspace is intact |
| Reload loses the last change | The write failed (banner may have been dismissed by navigation) | Re-do the action after freeing space; the app never claims a save succeeded |
| Data present in dev but not in preview | Different origins (`:5173` vs `:4173`) | Export/import a backup |
| Data vanished after two weeks | Safari evicted site data | Restore from backup — this cannot be prevented client-side |
| Two tabs fight | Last-write-wins by design | Use one tab |

## Auditing

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| Zero findings on a page you know is broken | You captured a fragment without the offending element, or the problem is stylesheet-driven | Capture the full `<!doctype html>` document; check the rule list |
| Contrast not detected | The engine reads **inline** `style` attributes only | Verify the failing colours are inline; otherwise use the Contrast checker screen |
| "Image is missing an alt" but there is one | The `alt` is on a parent, or the image is `aria-hidden` | That is by design for hidden images; check the captured snippet |
| Findings capped | Scan exceeded `maxFindingsPerScan` | The scan shows a "This result is incomplete" alert; raise the env var or split the capture |
| A rule missing from results | No matching rule exists for that criterion | See the coverage table in `modules/audit-engine.md` |
| Capture rejected as too large | Above `maxCaptureBytes` (512 KB default) | Capture a smaller template, or raise `VITE_MAX_CAPTURE_KB` |
| Old scan shows different results than a new one on the same markup | Rule set changed (engine version differs) | Expected; scans snapshot their engine version |

## Reports and exports

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| Download does nothing | `URL.createObjectURL` blocked, or a popup/extension blocker | Try another browser; check console |
| CSV opens with an apostrophe prefix | Formula-injection protection | Expected and intentional |
| HTML report has no styling | Opened from a place that blocks inline CSS (rare) | Open in a normal browser tab |
| Markdown table breaks | Content contained a pipe or newline — escaped by the exporter | If it still breaks, report it as a bug: escaping must handle all cases |
| Print is clipped | Page margins / browser scale | Use the print preview; sections avoid breaking |

## Accessibility of the app itself

| Symptom | Cause | Note |
| --- | --- | --- |
| No focus ring on mouse click | `:focus-visible` only | Keyboard focus always draws a 2 px ring |
| Sidebar missing on a narrow screen | Off-canvas below 960 px | Use the menu button in the top bar |
| Toast disappears before reading | 6 s auto-dismiss | Errors last 9 s; the same message is in the banner/alert where persistent |
| Screen reader reads "dialog" but nothing else | Ensure the app is not inside a `display:none` ancestor | Modals set `aria-modal` + labelled title |

## Build and deployment

| Symptom | Cause | Fix |
| --- | --- | --- |
| Assets 404 after deploy | Wrong `base` | Rebuild with `VITE_BASE_PATH=/<sub-path>/` |
| Deep link 404s | Host strips the fragment (rare) | Fragments never reach the server; check the host is not rewriting |
| Old version still served | HTML cached | Set `no-cache` on `index.html` (see DEPLOYMENT.md) |
| `file://` shows "storage unavailable" | Opaque origin | Serve over HTTP |

## Getting diagnostic information

```js
// Console on the app origin
const raw = localStorage.getItem('a11y-workbench:workspace');
raw ? JSON.parse(raw).schemaVersion : 'no document';
raw ? raw.length : 0;                        // approximate stored bytes
navigator.userAgent;
```

`Settings → Workspace data → Copy backup` gives a redactable JSON snapshot for a
bug report. Captured markup may contain confidential content — review before
sharing.

## Escalation

This is a static client app: there is no server log to check. When reporting a
problem, include browser + version, the banner text, whether storage was
available, and (if reproducible) the exact captured markup that produced a wrong or
missing finding.
