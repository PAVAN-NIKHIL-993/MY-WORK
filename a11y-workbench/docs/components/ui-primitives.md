# Components: UI primitives

Location: `src/components/ui/`. All primitives are presentational and behaviour
only; none import storage, engine or state (except `ToastRegion`, which reads the
toast queue from context — the single, deliberate exception).

---

## `Button`

**File.** `src/components/ui/Button.tsx`
**Purpose.** The only button in the product; enforces correct semantics.
**Props.**

| Prop | Type | Required | Default | Notes |
| --- | --- | --- | --- | --- |
| `variant` | `primary \| secondary \| ghost \| danger` | no | `secondary` | maps to a CSS modifier |
| `size` | `sm \| md` | no | `md` | `sm` = 30 px min height, `md` = 36 px |
| `icon` | `IconName` | no | — | leading glyph |
| `trailingIcon` | `IconName` | no | — | |
| `iconOnly` | `true` | no | — | **requires** `aria-label` (enforced by the union type) |
| `block` | `boolean` | no | `false` | full width |
| `type` | `button \| submit \| reset` | no | `button` | never an implicit submit |
| children | `ReactNode` | for labelled use | — | |

**Behaviour.** Renders a native `<button>`. Keyboard activation is native. When
disabled it does not fire `onClick`.
**Accessibility.** The type union makes an unlabelled icon button a compile error.
Icons are `aria-hidden`.
**Used by.** Every screen.
**Modification risk.** Changing the default `type` would reintroduce accidental
form submission from dialogs.

---

## `Icon`

**File.** `src/components/ui/Icon.tsx`
**Purpose.** Inline SVG glyph set (30 icons) behind a `IconName` union.
**Props.** `name` (required), `size` (default 18), `strokeWidth` (default 1.7),
plus any `SVGProps`.
**Accessibility.** Always `aria-hidden="true"` and `focusable="false"`. An icon
never carries meaning on its own — it is always next to a text label or inside a
labelled button.
**Modification risk.** Adding an icon means adding a path to the `PATHS` record;
the union type forces a matching entry, so a missing path cannot ship.

---

## `Badge`, `SeverityBadge`, `WcagBadge`, `StatusBadge`, `SeverityBreakdown`

**File.** `src/components/ui/Badge.tsx`
**Purpose.** Compact status indicators.
**Guarantee.** Every badge renders a **word**, not just a colour, plus an optional
decorative dot. Severity tone mapping is centralised so `critical` looks the same
everywhere.
**Data.** Severity/status labels come from `types/domain.ts`, so the badge, the
select options and the report all use identical wording.
**Modification risk.** Introducing a new status requires adding it to
`FINDING_STATUS_LABEL`, `STATUS_TONE` and the triage select — three places, all
type-checked.

---

## `Card` family

**File.** `src/components/ui/Card.tsx`
**Exports.** `Card`, `CardHeader`, `CardBody`, `CardFooter`.
**Props of `Card`.** `flush` (no inner padding, for tables/lists), `as`
(`section` \| `div` \| `article`), `ariaLabel` **or** `ariaLabelledBy`.
**Accessibility.** When a card is a `section` with `ariaLabelledBy`, it becomes a
named landmark region — used to make long screens navigable by screen reader.
`CardHeader` renders the title as a real heading (`h2` default, `h3`/`h4`
configurable) so the document outline stays correct.
**Modification risk.** Skipping `titleId`/`ariaLabelledBy` silently loses the
region's name.

---

## `Field`

**File.** `src/components/ui/Field.tsx`
**Purpose.** Own label/hint/error wiring so no screen has to remember it.
**Props.** `id` (required), `label` (required), `hint`, `error`, `required`,
`children` (render prop receiving `{ id, 'aria-describedby', 'aria-invalid',
required }`).
**Behaviour.**
* `<label htmlFor={id}>` always associated.
* `required` adds a visible `*` **and** a visually hidden "(required)".
* `error` sets `aria-invalid="true"`, adds the error text to
  `aria-describedby` and renders it with `role="alert"`.
**Modification risk.** Bypassing `Field` for a bespoke input is the fastest way to
ship an unlabelled control.

---

## `Modal`

**File.** `src/components/ui/Modal.tsx`
**Purpose.** The only dialog implementation.
**Props.** `title` (required, becomes the accessible name), `description`,
`children`, `footer`, `onClose`, `wide`, `icon`.
**Behaviour (each covered by a test).**

| Behaviour | Implementation |
| --- | --- |
| Dialog semantics | `role="dialog" aria-modal="true" aria-labelledby aria-describedby` |
| Focus on open | First focusable element (the close button) |
| Focus on close | Restored to the previously focused element |
| Escape | Closes |
| Backdrop click | Closes (mousedown on the backdrop itself) |
| Focus trap | `Tab`/`Shift+Tab` cycle within the dialog |
| Scroll lock | `body.style.overflow = 'hidden'`, restored on unmount |

**Not used:** native `<dialog>` — jsdom does not implement `showModal`, so the
behaviour could not be tested here.
**Modification risk.** Removing the focus restore or trap is an instant keyboard
accessibility regression; the tests exist to catch it.

---

## `Feedback` primitives

**File.** `src/components/ui/Feedback.tsx`

| Component | Purpose | Accessibility notes |
| --- | --- | --- |
| `PageHeader` | The single `h1` plus optional description, eyebrow and actions | One `h1` per screen |
| `EmptyState` | Explains *what* is missing and offers the next action | Body text is not just "No data" |
| `Alert` | Inline tone-coloured message | `role="alert"`/`aria-live` only when `live` |
| `Skeleton` | Loading placeholder | `role="status" aria-busy="true"` with a visually hidden label |

`Alert` tone → icon mapping is fixed (info, check, triangle, circle) so tone is
never conveyed by colour alone.

---

## `ToastRegion`

**File.** `src/components/ui/ToastRegion.tsx`
**Purpose.** Renders the toast queue from context.
**Accessibility.** Container is a labelled region; `aria-live` is `assertive`
when any toast is an error, otherwise `polite`. Each toast has a dismiss button
with an accessible name.
**Behaviour.** Max four visible; auto-dismiss timers live in the provider.
**Modification risk.** Making the region `aria-live="assertive"` unconditionally
would interrupt screen reader users for routine confirmations.
