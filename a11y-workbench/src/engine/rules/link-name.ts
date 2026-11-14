import type { EngineFinding } from '@/types/domain';
import type { Rule } from '../types';
import { violation } from '../finding';
import { auditable } from './shared';
import { accessibleName, visibleText } from '@/lib/dom';

const VAGUE_TEXT = new Set([
  'click here',
  'here',
  'read more',
  'more',
  'learn more',
  'this link',
  'link',
  'details',
]);

/** WCAG 2.4.4 (Link Purpose, In Context) and 4.1.2. */
export const linkNameRule: Rule = {
  id: 'link-name',
  name: 'Links are descriptive',
  description:
    'Links must have an accessible name. Names like "click here" or "read more" are flagged because they do not describe the destination out of context.',
  severity: 'serious',
  wcagLevel: 'A',
  successCriteria: ['2.4.4', '4.1.2'],
  remediation:
    'Use text that describes the destination, e.g. "View pricing plans". For icon links add aria-label. Add aria-label to disambiguate repeated "read more" links.',
  evaluate({ body }) {
    const findings: EngineFinding[] = [];
    for (const link of auditable({ body }, 'a[href]')) {
      const name = accessibleName(link);
      const text = visibleText(link).toLowerCase();

      if (name === '') {
        findings.push(
          violation(linkNameRule, {
            element: link,
            message: 'Link has no accessible name.',
          }),
        );
        continue;
      }

      if (VAGUE_TEXT.has(text) && !link.hasAttribute('aria-label') && !link.hasAttribute('aria-labelledby')) {
        findings.push(
          violation(linkNameRule, {
            element: link,
            message: `Link text “${text}” does not describe its destination.`,
            remediation:
              'Rewrite the link text to describe the destination, or add aria-label with a descriptive name.',
          }),
        );
      }
    }
    return findings;
  },
};
