import type { EngineFinding } from '@/types/domain';
import type { Rule } from '../types';
import { violation } from '../finding';
import { auditable } from './shared';
import { textOf } from '@/lib/dom';

const HEADING_LEVEL: Record<string, number> = { h1: 1, h2: 2, h3: 3, h4: 4, h5: 5, h6: 6 };

/**
 * WCAG 1.3.1 (Info and Relationships) and 2.4.6 (Headings and Labels).
 *
 * Two independent checks:
 * 1. exactly one `<h1>` (a page must declare its main heading);
 * 2. no skipped levels (an `<h4>` directly after `<h2>` breaks the outline for
 *    screen reader users who navigate by heading level).
 */
export const headingOrderRule: Rule = {
  id: 'heading-order',
  name: 'Heading structure is sequential',
  description: 'Pages need a single h1 and must not skip heading levels (h2 → h4).',
  severity: 'moderate',
  wcagLevel: 'AA',
  successCriteria: ['1.3.1', '2.4.6'],
  remediation: 'Use one h1 per page and increase heading depth one level at a time.',
  evaluate({ body }) {
    const findings: EngineFinding[] = [];
    const headings = auditable({ body }, 'h1, h2, h3, h4, h5, h6');

    const h1s = headings.filter((heading) => heading.tagName.toLowerCase() === 'h1');
    if (h1s.length === 0) {
      findings.push(
        violation(headingOrderRule, {
          element: body,
          message: 'Page has no h1, so it does not declare its main heading.',
          remediation: 'Add a single h1 that names the page purpose.',
        }),
      );
    } else if (h1s.length > 1) {
      for (const extra of h1s.slice(1)) {
        findings.push(
          violation(headingOrderRule, {
            element: extra,
            message: `Page has ${h1s.length} h1 elements; only one is expected.`,
          }),
        );
      }
    }

    let previous = 0;
    for (const heading of headings) {
      const level = HEADING_LEVEL[heading.tagName.toLowerCase()] ?? 0;
      if (level === 0) continue;
      if (previous > 0 && level > previous + 1) {
        findings.push(
          violation(headingOrderRule, {
            element: heading,
            message: `Heading level jumps from h${previous} to h${level}.`,
            detail: `“${textOf(heading).slice(0, 80)}”`,
          }),
        );
      }
      previous = level;
    }
    return findings;
  },
};
