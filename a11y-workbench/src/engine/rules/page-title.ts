import type { Rule } from '../types';
import { violation } from '../finding';

/**
 * WCAG 2.4.2 (Page Titled).
 *
 * An empty title is a failure; a title shorter than 4 characters or a generic
 * title ("Untitled", "Home") is a minor finding because it does not distinguish
 * the page in a browser tab or screen reader's window list.
 */
const GENERIC_TITLES = new Set(['untitled', 'home', 'page', 'document', 'index', 'new page']);

export const pageTitleRule: Rule = {
  id: 'page-title',
  name: 'Page has a descriptive title',
  description: 'Every page needs a unique <title> that describes the page content.',
  severity: 'serious',
  wcagLevel: 'A',
  successCriteria: ['2.4.2'],
  remediation: 'Add a descriptive <title> such as "Checkout — Acme Store".',
  evaluate({ document }) {
    const title = (document.title ?? '').trim();
    const html = document.documentElement;

    if (title === '') {
      return [
        violation(pageTitleRule, {
          element: html ?? document.body,
          message: 'Page has no <title>.',
        }),
      ];
    }

    if (GENERIC_TITLES.has(title.toLowerCase()) || title.length < 4) {
      return [
        violation(pageTitleRule, {
          element: html ?? document.body,
          message: `Title “${title}” does not describe the page.`,
          severity: 'minor',
        }),
      ];
    }
    return [];
  },
};
