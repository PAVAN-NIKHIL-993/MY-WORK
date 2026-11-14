import type { Rule } from '../types';
import { imageAltRule } from './image-alt';
import { buttonNameRule } from './button-name';
import { linkNameRule } from './link-name';
import { labelRule } from './label';
import { headingOrderRule } from './heading-order';
import { documentLangRule } from './document-lang';
import { pageTitleRule } from './page-title';
import { listStructureRule } from './list-structure';
import { contrastStyleRule } from './contrast-style';
import {
  bypassBlocksRule,
  landmarkRule,
  interactiveSemanticsRule,
  fieldsetLegendRule,
  tableHeadersRule,
  tabindexRule,
  svgTitleRule,
} from './structure';
import { ariaRoleRule, ariaRequiredAttributesRule, ariaAttributeRule } from './aria';

/**
 * The rule registry.
 *
 * Order is stable and is part of the product contract: findings are sorted by
 * severity and rule id afterwards, but the registry order determines execution
 * order and therefore the order of any warnings in `EngineResult.warnings`.
 * Adding a rule only adds findings; it never changes the semantics of existing
 * rules. Removing or renaming a rule id breaks the historical evidence stored in
 * existing scans, so rule ids must be treated as permanent.
 */
export const RULES: readonly Rule[] = Object.freeze([
  documentLangRule,
  pageTitleRule,
  imageAltRule,
  buttonNameRule,
  linkNameRule,
  labelRule,
  headingOrderRule,
  listStructureRule,
  tableHeadersRule,
  fieldsetLegendRule,
  bypassBlocksRule,
  landmarkRule,
  interactiveSemanticsRule,
  tabindexRule,
  svgTitleRule,
  ariaRoleRule,
  ariaRequiredAttributesRule,
  ariaAttributeRule,
  contrastStyleRule,
]);

/** Rule metadata without the evaluate function, for UI listing. */
export const RULE_DESCRIPTORS = RULES.map((rule) => ({
  id: rule.id,
  name: rule.name,
  description: rule.description,
  severity: rule.severity,
  wcagLevel: rule.wcagLevel,
  successCriteria: rule.successCriteria,
  remediation: rule.remediation,
}));
