# Extension guide

Three worked extensions, in increasing order of size, written so the contracts they
touch are explicit.

---

## Extension 1 — Add a rule (≈30 lines + tests)

**Scenario:** detect `aria-required-children` violations (WCAG 1.3.1 / 4.1.2).

### 1. Create the rule file

`src/engine/rules/aria-required-children.ts`

```ts
import type { Rule } from '../types';
import { violation } from '../finding';

const REQUIRED: Record<string, string[]> = {
  listbox: ['option'],
  menu: ['menuitem', 'menuitemcheckbox', 'menuitemradio'],
  tablist: ['tab'],
  radiogroup: ['radio'],
};

export const ariaRequiredChildren: Rule = {
  id: 'aria-required-children',
  name: 'Composite widgets contain their required children',
  description:
    'A widget role such as listbox or tablist must contain elements with the roles it expects; otherwise assistive technology announces an empty widget.',
  severity: 'serious',
  wcagLevel: 'A',
  successCriteria: ['1.3.1', '4.1.2'],
  remediation:
    'Add the required child roles, or remove the composite role if the element is not a real widget.',
  evaluate({ body }) {
    const findings = [];
    for (const element of Array.from(body.querySelectorAll('[role]'))) {
      const role = (element.getAttribute('role') ?? '').trim().toLowerCase();
      const required = REQUIRED[role];
      if (!required) continue;
      const children = Array.from(element.children).map((child) =>
        (child.getAttribute('role') ?? child.tagName.toLowerCase()).toLowerCase(),
      );
      if (children.some((childRole) => required.includes(childRole))) continue;
      findings.push(
        violation(ariaRequiredChildren, {
          element,
          message: `"${role}" is missing a required child (${required.join(' or ')}), so screen readers announce an empty widget.`,
        }),
      );
    }
    return findings;
  },
};
```

Note `violation(descriptor, …)` takes the descriptor object — passing the rule
itself is fine because it extends `RuleDescriptor`.

### 2. Register it

`src/engine/rules/index.ts` — **append** to `RULES`:

```ts
import { ariaRequiredChildren } from './aria-required-children';
export const RULES = [ /* …19 existing… */ ariaRequiredChildren ] as const;
```

### 3. Fixtures

`src/test/fixtures/pages.ts`: add `ariaRequiredChildrenViolation` (a
`role="tablist"` containing only `div`s) and a passing case
(`role="tablist"` with `role="tab"` children).

### 4. Tests

```ts
it('rule: aria-required-children flags a widget without its children', () => {
  const { findings } = runAudit(pages.ariaRequiredChildrenViolation);
  expect(findings.some((f) => f.ruleId === 'aria-required-children')).toBe(true);
});
it('rule: aria-required-children accepts a valid tablist', () => {
  const { findings } = runAudit(pages.ariaRequiredChildrenPassing);
  expect(findings).toEqual([]);
});
```

Then update every assertion that hard-codes `19` (search for `19` in `audit.test.ts`
and `rulesEvaluated`).

### 5. Version and docs

* Bump `ENGINE_VERSION` in `src/engine/audit.ts`.
* Add a row to the catalogue in [`../modules/audit-engine.md`](../modules/audit-engine.md).
* Add a CHANGELOG line.

### 6. Verify

```bash
npx vitest run src/engine && npx tsc --noEmit && npx eslint .
```

---

## Extension 2 — Add an export format (≈80 lines)

**Scenario:** a JSON export for downstream tooling.

### 1. Add the builder

`src/features/reports/exporters.ts`

```ts
export function buildJsonReport(input: ReportInput): string {
  return JSON.stringify(
    {
      app: 'a11y-workbench',
      generatedAt: input.generatedAt ?? new Date().toISOString(),
      project: input.project,
      scans: input.scans.map((scan) => ({
        id: scan.id,
        name: scan.name,
        capturedAt: scan.createdAt,
        engineVersion: scan.engineVersion,
        conformance: buildConformance(scan),
        findings: scan.findings,
      })),
    },
    null,
    2,
  );
}
```

Requirements for any new format:

| Requirement | Why |
| --- | --- |
| Pure function of `ReportInput` | Testability |
| Injectable `generatedAt` | Deterministic tests |
| Never throws on valid input | A report button must not crash |
| Escaping appropriate to the format | JSON needs none, but do not build it by string concatenation |

### 2. Wire the button

`ReportDetailScreen.tsx` — follow the existing Markdown button:

```tsx
<Button
  icon="download"
  onClick={() => downloadTextFile(buildJsonReport({ project, scans: included }), filename('json'))}
>
  JSON
</Button>
```

### 3. Test it

```ts
it('builds a JSON report with conformance rows', () => {
  const json = JSON.parse(buildJsonReport({ project, scans: [scan], generatedAt: '2026-01-01T00:00:00.000Z' }));
  expect(json.project.name).toBe(project.name);
  expect(json.scans[0].conformance.length).toBeGreaterThan(0);
});
```

Also assert that a finding message containing `"` and `\n` round-trips.

### 4. Document it

`docs/modules/exporters.md` table + `README.md` capability list + CHANGELOG.

---

## Extension 3 — Replace the storage backend (≈1 file + 1 seam)

**Scenario:** move to IndexedDB for a larger quota.

Implement the four-function contract from
[`../api/storage-api.md`](../api/storage-api.md#replacing-the-backend):

```ts
export async function loadWorkspace(): Promise<LoadResult> { /* … */ }
```

Two structural changes are then required:

1. **Provider loading state.** `WorkspaceProvider` currently reads synchronously in
   `useState`. Change to:

```tsx
const [workspace, setWorkspace] = useState<Workspace | null>(null);
useEffect(() => { void loadWorkspace().then((result) => { setWorkspace(result.workspace); … }); }, []);
if (!workspace) return <AppShellSkeleton />;
```

`ready` already exists for this purpose; the app shell has a `Skeleton` primitive.

2. **Keep `migrateWorkspace` as the trust boundary.** Whatever the backend returns
   must pass through it — a backend is not a validation layer.

**Test accordingly:** a fake async store with a slow write, an unavailable store, a
quota failure, and a corrupt document. The existing storage tests describe the
contract; port them rather than starting from scratch.

---

## What *not* to extend

| Tempting extension | Why not |
| --- | --- |
| Fetching a URL to audit it | Breaks the no-network guarantee and adds CORS/proxy/host-permission complexity. If required, make it an explicit, separate tool |
| Running a real browser to get computed styles | Would make the product a server-side tool and break the single-file deployment model |
| Accounts/sharing | Requires a backend, auth, authorisation and a retention policy — a different product |
| Auto-fixing markup | Generating patches without a human review is how accessibility regressions ship |
| A charting library for the trend selector | `severityTrend` already returns the points; a 40-line SVG would do it without a dependency |
