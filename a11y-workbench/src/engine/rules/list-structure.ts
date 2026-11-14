import type { EngineFinding } from '@/types/domain';
import type { Rule } from '../types';
import { violation } from '../finding';
import { auditable } from './shared';

/**
 * WCAG 1.3.1 (Info and Relationships) — list markup must be well formed.
 *
 * Assistive technology announces "list with 4 items"; a `ul` whose direct
 * children are not `li` (or a `dl` without `dt`/`dd`) breaks that announcement
 * and usually indicates a div-soup refactor that lost semantics.
 */
export const listStructureRule: Rule = {
  id: 'list-structure',
  name: 'Lists use correct markup',
  description:
    'ul/ol must contain only li elements (plus script/template), and dl must contain dt/dd. Text or divs directly inside a list are not announced as list items.',
  severity: 'moderate',
  wcagLevel: 'A',
  successCriteria: ['1.3.1'],
  remediation: 'Wrap each item in an <li>, or use role="list"/"listitem" when custom markup is unavoidable.',
  evaluate({ body }) {
    const findings: EngineFinding[] = [];
    const allowedListChildren = new Set(['li', 'script', 'template', 'ol', 'ul']);
    const allowedDlChildren = new Set(['dt', 'dd', 'div', 'script', 'template']);

    for (const list of auditable({ body }, 'ul, ol, dl')) {
      const isDescriptionList = list.tagName.toLowerCase() === 'dl';
      const allowed = isDescriptionList ? allowedDlChildren : allowedListChildren;

      const invalid = Array.from(list.children).filter(
        (child) => !allowed.has(child.tagName.toLowerCase()),
      );

      if (!isDescriptionList && list.children.length === 0) {
        findings.push(
          violation(listStructureRule, {
            element: list,
            message: 'List is empty, so it conveys no structure.',
            remediation: 'Populate the list or remove it.',
          }),
        );
        continue;
      }

      if (invalid.length > 0) {
        findings.push(
          violation(listStructureRule, {
            element: invalid[0]!,
            message: isDescriptionList
              ? 'Description list contains an element that is not dt, dd or div.'
              : `${list.tagName.toLowerCase()} contains <${invalid[0]!.tagName.toLowerCase()}> where only <li> is allowed.`,
          }),
        );
      }
    }
    return findings;
  },
};
