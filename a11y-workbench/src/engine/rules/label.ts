import type { EngineFinding } from '@/types/domain';
import type { Rule } from '../types';
import { violation } from '../finding';
import { auditable, LABELABLE_INPUT_TYPES, FORM_CONTROL_SELECTOR } from './shared';
import { accessibleName } from '@/lib/dom';

/** WCAG 1.3.1 (Info and Relationships), 3.3.2 (Labels or Instructions), 4.1.2. */
export const labelRule: Rule = {
  id: 'form-label',
  name: 'Form controls have labels',
  description:
    'Text inputs, selects and textareas need a programmatically associated <label>, aria-label or aria-labelledby, and a placeholder is not a substitute.',
  severity: 'critical',
  wcagLevel: 'A',
  successCriteria: ['1.3.1', '3.3.2', '4.1.2'],
  remediation:
    'Associate a <label for="…"> with the control id, or provide aria-label / aria-labelledby. Keep the placeholder as a hint, not a label.',
  evaluate({ body }) {
    const findings: EngineFinding[] = [];
    for (const control of auditable({ body }, FORM_CONTROL_SELECTOR)) {
      const tag = control.tagName.toLowerCase();
      const type = (control.getAttribute('type') ?? 'text').toLowerCase();
      if (tag === 'input' && !LABELABLE_INPUT_TYPES.has(type)) continue;
      if (accessibleName(control) !== '') continue;

      const hasPlaceholder = (control.getAttribute('placeholder') ?? '').trim() !== '';
      findings.push(
        violation(labelRule, {
          element: control,
          message: hasPlaceholder
            ? 'Control relies on placeholder text as its only label; the label disappears once the user types.'
            : 'Form control has no associated label.',
        }),
      );
    }
    return findings;
  },
};
