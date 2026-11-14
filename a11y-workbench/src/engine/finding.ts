/**
 * Finding construction helpers.
 *
 * Rules never hand-build an `EngineFinding`, they call `violation(rule, ...)`.
 * Keeping construction in one place guarantees every finding carries the rule's
 * metadata, which the report and triage UI rely on.
 */

import type { EngineFinding, RuleDescriptor } from '@/types/domain';
import { buildSelector, snippetOf } from '@/lib/dom';

export interface ViolationInput {
  element: Element;
  message: string;
  /** Optional override of the remediation for a specific element. */
  remediation?: string;
  /** Machine-readable measurement, e.g. `ratio 2.1:1 (needs 4.5:1)`. */
  detail?: string;
  /** Overrides the rule's default severity for a weaker instance of the issue. */
  severity?: EngineFinding['severity'];
}

/** Creates a finding for a single violating element. */
export function violation(rule: RuleDescriptor, input: ViolationInput): EngineFinding {
  const finding: EngineFinding = {
    ruleId: rule.id,
    ruleName: rule.name,
    severity: input.severity ?? rule.severity,
    wcagLevel: rule.wcagLevel,
    successCriteria: [...rule.successCriteria],
    message: input.message,
    remediation: input.remediation ?? rule.remediation,
    selector: buildSelector(input.element),
    snippet: snippetOf(input.element),
  };
  if (input.detail) finding.detail = input.detail;
  return finding;
}

/** Severity rank used for deterministic sorting (lower = more severe). */
const SEVERITY_RANK: Record<EngineFinding['severity'], number> = {
  critical: 0,
  serious: 1,
  moderate: 2,
  minor: 3,
};

/**
 * Sorts findings by severity, then rule id, then selector. Sorting here (not in
 * the UI) keeps engine output stable, which the tests and exports depend on.
 */
export function sortFindings(findings: EngineFinding[]): EngineFinding[] {
  return [...findings].sort((a, b) => {
    const severity = SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity];
    if (severity !== 0) return severity;
    if (a.ruleId !== b.ruleId) return a.ruleId.localeCompare(b.ruleId);
    return a.selector.localeCompare(b.selector);
  });
}
