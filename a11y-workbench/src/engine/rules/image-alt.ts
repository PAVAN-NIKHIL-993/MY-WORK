import type { EngineFinding } from '@/types/domain';
import type { Rule } from '../types';
import { violation } from '../finding';
import { auditable } from './shared';

/**
 * WCAG 1.1.1 (Non-text Content) — 15 of 15 informational images need a text
 * alternative. Decorative images are valid when `alt=""` or `role="presentation"`.
 */
export const imageAltRule: Rule = {
  id: 'image-alt',
  name: 'Images have text alternatives',
  description:
    'Every <img> must carry an alt attribute. Decorative images use alt="" so assistive technology skips them.',
  severity: 'critical',
  wcagLevel: 'A',
  successCriteria: ['1.1.1'],
  remediation:
    'Add an alt attribute describing the image purpose, or alt="" if the image is purely decorative.',
  evaluate({ body }) {
    const findings: EngineFinding[] = [];
    for (const img of auditable({ body }, 'img')) {
      if (img.hasAttribute('alt')) continue;
      if (img.getAttribute('role') === 'presentation' || img.getAttribute('role') === 'none') continue;
      findings.push(
        violation(imageAltRule, {
          element: img,
          message: 'Image is missing an alt attribute, so screen readers announce the file name or nothing.',
        }),
      );
    }
    return findings;
  },
};
