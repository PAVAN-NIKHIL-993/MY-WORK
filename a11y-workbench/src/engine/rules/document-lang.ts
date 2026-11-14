import type { Rule } from '../types';
import { violation } from '../finding';

/**
 * WCAG 3.1.1 (Language of Page).
 *
 * A missing or malformed `lang` makes screen readers read the page with the
 * wrong voice and pronunciation rules.
 */
export const documentLangRule: Rule = {
  id: 'document-lang',
  name: 'Page declares its language',
  description: 'The <html> element needs a valid BCP-47 lang attribute, e.g. lang="en".',
  severity: 'serious',
  wcagLevel: 'A',
  successCriteria: ['3.1.1'],
  remediation: 'Set <html lang="en"> (or the correct BCP-47 tag) on every page.',
  evaluate({ document }) {
    const html = document.documentElement;
    if (!html) return [];
    const lang = (html.getAttribute('lang') ?? '').trim();

    if (lang === '') {
      return [
        violation(documentLangRule, {
          element: html,
          message: 'The html element has no lang attribute.',
        }),
      ];
    }

    const isValid = /^[a-zA-Z]{2,3}(-[a-zA-Z0-9]{2,8})*$/.test(lang);
    if (!isValid) {
      return [
        violation(documentLangRule, {
          element: html,
          message: `lang="${lang}" is not a valid BCP-47 language tag.`,
        }),
      ];
    }
    return [];
  },
};
