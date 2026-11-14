/**
 * Internal engine contracts.
 *
 * A rule is a pure function of the parsed document: it may read the DOM but it
 * must not mutate it, must not touch storage, and must not depend on the current
 * time. That is what makes audit output reproducible.
 */

import type { EngineFinding, RuleDescriptor } from '@/types/domain';

/** Context handed to every rule. */
export interface RuleContext {
  /** Inert document parsed from captured markup. */
  document: Document;
  /** Convenience: `document.body`, never null after parsing. */
  body: Element;
}

/** A rule: metadata plus an evaluate function. */
export interface Rule extends RuleDescriptor {
  evaluate(context: RuleContext): EngineFinding[];
}

/** Helper type for building findings inside a rule. */
export type FindingFactory<TRule extends RuleDescriptor> = (
  rule: TRule,
  partial: Omit<EngineFinding, 'ruleId' | 'ruleName' | 'severity' | 'wcagLevel' | 'successCriteria' | 'remediation'>,
) => EngineFinding;
