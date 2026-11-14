import type { EngineFinding } from '@/types/domain';
import type { Rule } from '../types';
import { violation } from '../finding';
import { auditable } from './shared';
import { accessibleName } from '@/lib/dom';

/** WCAG 4.1.2 (Name, Role, Value) — buttons must have an accessible name. */
export const buttonNameRule: Rule = {
  id: 'button-name',
  name: 'Buttons have accessible names',
  description: 'A <button> whose content is empty or an unlabelled icon gives no clue to screen reader users.',
  severity: 'critical',
  wcagLevel: 'A',
  successCriteria: ['4.1.2', '2.4.6'],
  remediation:
    'Add visible text inside the button, or provide aria-label / aria-labelledby naming the action.',
  evaluate({ body }) {
    const findings: EngineFinding[] = [];
    for (const button of auditable({ body }, 'button, [role="button"]')) {
      if (accessibleName(button) !== '') continue;
      findings.push(
        violation(buttonNameRule, {
          element: button,
          message: 'Button has no accessible name.',
        }),
      );
    }
    return findings;
  },
};
