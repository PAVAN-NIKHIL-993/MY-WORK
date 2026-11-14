# Component: application shell

## `AppShell`

**File.** `src/components/layout/AppShell.tsx`
**Purpose.** Persistent chrome around every screen: brand, two navigation groups,
top bar, mobile off-canvas menu, skip link, and the toast region.

**Props.**

| Prop | Type | Required | Purpose |
| --- | --- | --- | --- |
| `route` | `{ name: string }` | yes | Current route name, used to set `aria-current` and to close the mobile menu on navigation |
| `title` | `string` | yes | Text in the top bar (not an `h1`; the screen owns its `h1`) |
| `actions` | `ReactNode` | no | Reserved slot for global actions |
| `children` | `ReactNode` | yes | The screen |

**Layout structure.**

```
.skip-link                        → first focusable element, targets #main-content
.app-shell (grid: 264px | 1fr)
├── .sidebar[data-open]           → aside, aria-label="Primary", id="primary-sidebar"
│   ├── .brand                    → link to #/, app name + version
│   ├── nav[aria-label="Workspace"] → Overview, Projects (count), Findings (open count), Reports
│   ├── nav[aria-label="Tools"]     → Contrast checker, Rule reference, Settings
│   └── .sidebar-footer           → project/scan totals, "Data stays in this browser."
└── .main-column
    ├── .topbar                   → menu toggle (mobile), title, actions
    └── main#main-content          → tabIndex=-1 (skip-link target), the screen
```

**Navigation behaviour.**

| Case | Behaviour |
| --- | --- |
| Desktop (≥ 960 px) | Sidebar always visible, sticky, scrollable independently |
| Mobile (< 960 px) | Sidebar translated off-canvas; toggle sets `aria-expanded`; scrim is a `<button aria-label="Close menu">` |
| Route change | Menu closes automatically (effect on `route.name`) |
| Escape | Closes the menu and returns focus to the toggle |
| Current item | Exactly one `aria-current="page"` (verified by tests, including on detail routes) |

**Counts.** `Projects` shows the project count; `Findings` shows the number of
**open** findings. Both come from `workspaceStats`, so they cannot disagree with
the overview.

**Accessibility notes.**
* Two separately labelled `<nav>` landmarks so a screen reader user can jump to
  either.
* The scrim is a real button (keyboard reachable would be wrong here — it is
  `tabIndex={-1}` because Escape and the toggle already provide keyboard paths).
* Icons are decorative; every item has text.
* The top bar title is a `<p>`, not a heading, to keep one `h1` per page.

**Responsive behaviour.** At ≤ 960 px the sidebar becomes an overlay with
`box-shadow` and a scrim; content keeps full width. Below 480 px the sidebar
width caps at `86vw`.

**Modification risks.**
* Removing `id="primary-sidebar"` breaks the `aria-controls` relationship.
* Changing the route `matches` arrays silently breaks highlighting.
* Making the skip link target anything other than `#main-content` breaks the
  first tab stop.

---

## `ErrorBoundary`

**File.** `src/components/layout/ErrorBoundary.tsx`
**Purpose.** Convert an unexpected render crash into a recoverable screen.
**Behaviour.**
* `getDerivedStateFromError` stores the error; `componentDidCatch` logs it with
  the component stack and stores the stack.
* Renders: a plain-language explanation, "your saved audits are still in this
  browser", the error name and message, a **Reload** button, a link to Settings,
  and a `<details>` disclosure containing the full stack for a bug report.
* Uses inline styles deliberately: it must render correctly even if a stylesheet
  failed to load.

**Modification risks.** Adding navigation that depends on context inside this
boundary could throw again inside the fallback; it only uses `location` and plain
elements by design.
