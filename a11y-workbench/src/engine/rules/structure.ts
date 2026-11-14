import type { EngineFinding } from '@/types/domain';
import type { Rule } from '../types';
import { violation } from '../finding';
import { auditable } from './shared';
import { accessibleName } from '@/lib/dom';

/**
 * WCAG 2.4.1 (Bypass Blocks) / 1.3.1 — the page should offer a skip link or a
 * landmark region so keyboard users can jump past repeated navigation.
 *
 * The rule checks for *either* a skip link to a fragment or at least one
 * `<main>`/`role="main"` landmark, because both are valid ways to satisfy the
 * requirement. It only reports once per page (on `<body>`).
 */
export const bypassBlocksRule: Rule = {
  id: 'bypass-blocks',
  name: 'Page offers a way to skip navigation',
  description:
    'Long pages need a skip link or a main landmark so keyboard and screen reader users can bypass repeated navigation.',
  severity: 'moderate',
  wcagLevel: 'A',
  successCriteria: ['2.4.1'],
  remediation:
    'Add <a href="#main">Skip to content</a> as the first focusable element, or wrap page content in <main>.',
  evaluate({ document, body }) {
    const hasMainLandmark =
      document.querySelector('main, [role="main"]') !== null;

    const links = auditable({ body }, 'a[href^="#"]');
    const hasSkipLink = links.some((link) => {
      const href = link.getAttribute('href') ?? '';
      const name = accessibleName(link).toLowerCase();
      const isSkip = /skip|jump/.test(name);
      return isSkip && href.length > 1;
    });

    if (hasMainLandmark || hasSkipLink) return [];

    return [
      violation(bypassBlocksRule, {
        element: body,
        message: 'Page has neither a main landmark nor a skip link.',
      }),
    ];
  },
};

/** WCAG 1.3.6 / 4.1.2 — landmark roles must be unique and top-level. */
export const landmarkRule: Rule = {
  id: 'landmark-structure',
  name: 'Landmarks are used once each',
  description:
    'Multiple banners, mains, contentinfos or complementary landmarks without accessible names make the page map ambiguous.',
  severity: 'moderate',
  wcagLevel: 'AA',
  successCriteria: ['1.3.1', '2.4.1'],
  remediation:
    'Keep one <main> and one <header> per page; if repeats are required, give each landmark a distinct aria-label.',
  evaluate({ body }) {
    const findings: EngineFinding[] = [];
    const singular: Array<{ selector: string; label: string }> = [
      { selector: 'main, [role="main"]', label: 'main' },
      { selector: 'body > header, [role="banner"]', label: 'banner' },
      { selector: 'body > footer, [role="contentinfo"]', label: 'contentinfo' },
    ];
    const scoped = body.querySelectorAll.bind(body);

    for (const { selector, label } of singular) {
      const matches = Array.from(scoped(selector)).filter(
        (element) => {
          const style = element.getAttribute('style') ?? '';
          return element.getAttribute('aria-hidden') !== 'true' && !/display\s*:\s*none/i.test(style);
        },
      );
      if (matches.length <= 1) continue;
      const unnamed = matches.filter((element) => !element.hasAttribute('aria-label') && !element.hasAttribute('aria-labelledby'));
      if (unnamed.length <= 1) continue;
      findings.push(
        violation(landmarkRule, {
          element: unnamed[1]!,
          message: `Page has ${matches.length} ${label} landmarks and more than one is unnamed.`,
        }),
      );
    }
    return findings;
  },
};

/** WCAG 2.4.7 / 2.1.1 — click handlers must be reachable and operable by keyboard. */
export const interactiveSemanticsRule: Rule = {
  id: 'interactive-semantics',
  name: 'Interactive elements are keyboard operable',
  description:
    'Elements with click handlers must be natively focusable or carry role, tabindex and key handling; a bare <div onclick> is invisible to keyboards.',
  severity: 'critical',
  wcagLevel: 'A',
  successCriteria: ['2.1.1', '4.1.2'],
  remediation:
    'Use <button> or <a href> for actions. If a custom element is unavoidable, add role, tabindex="0" and Enter/Space key handlers.',
  evaluate({ body }) {
    const findings: EngineFinding[] = [];
    const clickable = auditable({ body }, '[onclick], [onkeydown], [onkeyup], [onmousedown]');
    const native = new Set(['a', 'button', 'input', 'select', 'textarea', 'summary', 'details', 'area']);

    for (const element of clickable) {
      const tag = element.tagName.toLowerCase();
      if (native.has(tag)) continue;
      const role = element.getAttribute('role');
      const tabindex = element.getAttribute('tabindex');
      const hasHandler = ['onkeydown', 'onkeyup', 'onkeypress'].some((name) => element.hasAttribute(name));
      if (role && tabindex !== null && Number.parseInt(tabindex, 10) >= 0 && hasHandler) continue;

      findings.push(
        violation(interactiveSemanticsRule, {
          element,
          message: `<${tag}> is click-only: it cannot be reached or activated with a keyboard.`,
        }),
      );
    }
    return findings;
  },
};

/** WCAG 1.3.1 / 3.3.2 — form controls grouped by fieldset must have a legend. */
export const fieldsetLegendRule: Rule = {
  id: 'fieldset-legend',
  name: 'Grouped controls have legends',
  description: 'A <fieldset> without a <legend> gives no group context to screen reader users.',
  severity: 'moderate',
  wcagLevel: 'A',
  successCriteria: ['1.3.1', '3.3.2'],
  remediation: 'Add a <legend> as the first child of each <fieldset> describing the group.',
  evaluate({ body }) {
    const findings: EngineFinding[] = [];
    for (const fieldset of auditable({ body }, 'fieldset')) {
      const legend = fieldset.querySelector('legend');
      const named = fieldset.hasAttribute('aria-label') || fieldset.hasAttribute('aria-labelledby');
      if (legend || named) continue;
      findings.push(
        violation(fieldsetLegendRule, { element: fieldset, message: 'Fieldset has no legend.' }),
      );
    }
    return findings;
  },
};

/** WCAG 4.1.2 — table headers must be marked up and scoped. */
export const tableHeadersRule: Rule = {
  id: 'table-header',
  name: 'Data tables have headers',
  description:
    'Layout tables are fine, but any table with data rows needs <th> cells; screen readers otherwise read cells without announcing their column.',
  severity: 'serious',
  wcagLevel: 'A',
  successCriteria: ['1.3.1'],
  remediation:
    'Use <th scope="col"> for column headers and scope="row" for row headers. Mark purely presentational tables with role="presentation".',
  evaluate({ body }) {
    const findings: EngineFinding[] = [];
    for (const table of auditable({ body }, 'table')) {
      if (table.getAttribute('role') === 'presentation' || table.getAttribute('role') === 'none') continue;
      const rows = Array.from(table.querySelectorAll('tr'));
      if (rows.length < 2) continue;
      const hasHeaders = table.querySelector('th') !== null;
      if (hasHeaders) continue;
      findings.push(
        violation(tableHeadersRule, {
          element: table,
          message: 'Data table has no header cells.',
        }),
      );
    }
    return findings;
  },
};

/** WCAG 2.4.3 / 1.3.2 — positive tabindex breaks expected focus order. */
export const tabindexRule: Rule = {
  id: 'tabindex-order',
  name: 'Focus order follows document order',
  description: 'Positive tabindex values pull focus out of reading order and are almost always a bug.',
  severity: 'moderate',
  wcagLevel: 'A',
  successCriteria: ['2.4.3'],
  remediation: 'Remove positive tabindex; keep the DOM in visual order instead.',
  evaluate({ body }) {
    const findings: EngineFinding[] = [];
    for (const element of auditable({ body }, '[tabindex]')) {
      const value = Number.parseInt(element.getAttribute('tabindex') ?? '', 10);
      if (!Number.isFinite(value) || value <= 0) continue;
      findings.push(
        violation(tabindexRule, {
          element,
          message: `tabindex="${value}" overrides the natural focus order.`,
        }),
      );
    }
    return findings;
  },
};

/** WCAG 1.1.1 — inline SVG needs a title/label or it is announced as "graphic". */
export const svgTitleRule: Rule = {
  id: 'svg-name',
  name: 'SVG graphics have names',
  description:
    'Inline <svg> should expose a <title> or aria-label; otherwise screen readers announce an unnamed graphic.',
  severity: 'serious',
  wcagLevel: 'A',
  successCriteria: ['1.1.1', '4.1.2'],
  remediation: 'Add <title> as the first child of the <svg>, or role="img" with aria-label; use aria-hidden="true" for decorative icons.',
  evaluate({ body }) {
    const findings: EngineFinding[] = [];
    for (const svg of auditable({ body }, 'svg')) {
      if (svg.getAttribute('aria-hidden') === 'true') continue;
      if (svg.hasAttribute('aria-label') || svg.hasAttribute('aria-labelledby')) continue;
      if (svg.querySelector('title') !== null) continue;
      const nested = svg.getAttribute('focusable');
      findings.push(
        violation(svgTitleRule, {
          element: svg,
          message: 'SVG has no accessible name.',
          ...(nested ? { detail: `focusable="${nested}"` } : {}),
        }),
      );
    }
    return findings;
  },
};
