import type { EngineFinding } from '@/types/domain';
import type { Rule } from '../types';
import { violation } from '../finding';
import { auditable } from './shared';
import { assessContrast, colorFromStyle, toHex, parseColor } from '@/lib/color';

/**
 * WCAG 1.4.3 (Contrast — Minimum), evaluated for **inline styles only**.
 *
 * Captured markup does not include the external stylesheet, so the engine can
 * only evaluate colours declared in a `style` attribute. This limitation is
 * explicit and documented; the contrast checker feature exists for computed
 * colours. Elements with no inline colour are skipped rather than guessed.
 */
export const contrastStyleRule: Rule = {
  id: 'contrast-inline',
  name: 'Inline text meets contrast minimums',
  description:
    'When foreground and background colours are both declared inline, the ratio must reach 4.5:1 (3:1 for large text). External CSS cannot be evaluated from captured markup.',
  severity: 'serious',
  wcagLevel: 'AA',
  successCriteria: ['1.4.3'],
  remediation: 'Darken the text colour or lighten the background until the ratio is at least 4.5:1.',
  evaluate({ body }) {
    const findings: EngineFinding[] = [];

    for (const element of auditable({ body }, '[style]')) {
      const style = element.getAttribute('style') ?? '';
      const foreground = colorFromStyle(style, 'color');
      const background = colorFromStyle(style, 'background-color');
      if (!foreground || !background) continue;

      const text = (element.textContent ?? '').trim();
      if (text === '') continue;

      const fontSize = /font-size\s*:\s*([\d.]+)px/i.exec(style);
      const fontWeight = /font-weight\s*:\s*(bold|[7-9]00)/i.test(style);
      const size = fontSize ? Number.parseFloat(fontSize[1]!) : 16;
      const isLarge = size >= 24 || (size >= 18.66 && fontWeight);

      const assessment = assessContrast(foreground, background, isLarge ? 'largeText' : 'normalText');
      const fg = parseColor(foreground);
      const bg = parseColor(background);
      if (!assessment || !fg || !bg) continue;
      if (assessment.pass) continue;

      findings.push(
        violation(contrastStyleRule, {
          element,
          message: `Text contrast is ${assessment.ratio}:1, below the ${assessment.required}:1 minimum.`,
          detail: `foreground ${toHex(fg)} on background ${toHex(bg)}; ${isLarge ? 'large' : 'normal'} text`,
        }),
      );
      if (findings.length >= 50) break; // Bounded per rule to keep reports readable.
    }

    return findings;
  },
};
