# API: audit engine

Module: `src/engine/audit.ts` (entry), `src/engine/types.ts` (contracts),
`src/engine/finding.ts` (construction), `src/engine/rules/index.ts` (registry).

---

## `runAudit(markup)`

**Purpose.** Audit one captured document.

| | |
| --- | --- |
| Signature | `runAudit(markup: string): EngineResult` |
| Parameters | `markup` — required. Any string, including invalid HTML. |
| Returns | `{ engineVersion, findings, summary, warnings }` |
| Throws | **Never.** |
| Side effects | None. Pure. |
| Performance | ~7–11 ms for 1–3 KB pages; ~60 ms for 23 KB; linear beyond (see [`../PERFORMANCE.md`](../PERFORMANCE.md)) |
| Determinism | Identical input ⇒ identical output, including array order |

**Example**

```ts
import { runAudit } from '@/engine/audit';

const result = runAudit('<!doctype html><html lang="en"><head><title>Docs</title></head><body><main><h1>Hi</h1><img src="a.jpg"></main></body></html>');
// result.findings[0] →
// {
//   ruleId: 'image-alt', ruleName: 'Images have text alternatives',
//   severity: 'critical', wcagLevel: 'A', successCriteria: ['1.1.1'],
//   message: 'Image is missing an alt attribute, so screen readers announce the file name or nothing.',
//   remediation: 'Add an alt attribute describing the image purpose, or alt="" if the image is purely decorative.',
//   selector: 'body > main > img',
//   snippet: '<img src="a.jpg">'
// }
```

**Behaviour matrix**

| Input | `findings` | `warnings` |
| --- | --- | --- |
| `''` / whitespace | `[]` | `['Captured markup is empty; every rule was skipped.']` |
| Valid clean page | `[]` | `[]` |
| Valid failing page | sorted findings | `[]` |
| Malformed HTML | findings on what the parser recovered | `[]` |
| > `maxFindingsPerScan` | capped, sorted | `['Only the first N of M findings were kept…']` |
| A rule throws | other rules' findings | `['Rule "x" failed and was skipped: …']` |

---

## `summarize(findings, rulesEvaluated)`

Counts findings per severity and rules with **no** findings per WCAG level.

| | |
| --- | --- |
| Signature | `(findings: EngineFinding[], rulesEvaluated: number) => ScanSummary` |
| Notes | `bySeverity` is instance counts; `passedByLevel` is rule counts |

---

## `Rule` interface

```ts
interface Rule extends RuleDescriptor {
  evaluate(context: RuleContext): EngineFinding[];
}

interface RuleContext {
  document: Document;  // inert parsed document
  body: Element;       // document.body (or documentElement fallback)
}
```

**Implementer contract**

| Obligation | Reason |
| --- | --- |
| Must not mutate `context.document` | `lib/dom` memo caches assume immutability |
| Must not throw | A throw is caught and turned into a warning, but it means the rule is skipped |
| Must return an array (possibly empty) | A non-array becomes a warning |
| Must not read the clock or randomness | Determinism |
| Must use a **permanent** id | Stored findings reference it |

---

## `violation(rule, input)`

```ts
violation(rule: RuleDescriptor, input: {
  element: Element;
  message: string;
  remediation?: string;                       // overrides rule.remediation
  detail?: string;                            // e.g. "foreground #9aa0a6 on background #ffffff"
  severity?: EngineFinding['severity'];       // overrides rule.severity
}): EngineFinding
```

Always use it instead of building an `EngineFinding` literal: it guarantees the
rule metadata (id, name, severity, WCAG level, success criteria) is present.

---

## `RULES` and `RULE_DESCRIPTORS`

| Export | Type | Notes |
| --- | --- | --- |
| `RULES` | `readonly Rule[]` (19) | Frozen; **order is part of the contract** |
| `RULE_DESCRIPTORS` | derived metadata | Used by the rule reference screen and Settings |

Order determines execution order only (output is sorted afterwards), but it is
kept stable so warnings are predictable.

---

## `ENGINE_VERSION`

Bump when rule behaviour changes in a way that could alter findings for the same
markup. Every scan stores the version that produced it, so an old scan remains
interpretable after an upgrade. Changing rule **metadata only** (wording) also
warrants a bump, because stored findings carry the old wording.

---

## Error responses

There is no status code; the "error response" is `warnings: string[]`. Each
warning is a complete sentence naming the rule and the cause, suitable for
showing to a user.

**Warnings are persisted.** `Scan.warnings` stores them (schema field added with
the `Scan` model, normalised in `storage/schema.ts`), and the scan detail screen
renders them in a "This result is incomplete" alert. Rationale: a truncation or a
skipped rule changes how much the report can be trusted, and a toast disappears on
reload. Only the 20 most recent strings are retained per scan.
