import type { EngineFinding } from '@/types/domain';
import type { Rule } from '../types';
import { violation } from '../finding';
import { auditable, isAuditable } from './shared';

/**
 * ARIA validity rules.
 *
 * These catch the two most common ARIA mistakes in real codebases: a role that
 * is not in the ARIA vocabulary, and `aria-*` attributes that reference a role
 * or value which does not exist / is not allowed. Both are silent failures —
 * invalid ARIA is ignored by every browser, so the developer believes they have
 * fixed the problem when they have not.
 */

const VALID_ROLES = new Set([
  'alert', 'alertdialog', 'application', 'article', 'banner', 'button', 'cell', 'checkbox',
  'columnheader', 'combobox', 'complementary', 'contentinfo', 'definition', 'dialog',
  'directory', 'document', 'feed', 'figure', 'form', 'grid', 'gridcell', 'group',
  'heading', 'img', 'link', 'list', 'listbox', 'listitem', 'log', 'main', 'marquee',
  'math', 'menu', 'menubar', 'menuitem', 'menuitemcheckbox', 'menuitemradio',
  'navigation', 'none', 'note', 'option', 'presentation', 'progressbar', 'radio',
  'radiogroup', 'region', 'row', 'rowgroup', 'rowheader', 'scrollbar', 'search',
  'searchbox', 'separator', 'slider', 'spinbutton', 'status', 'switch', 'tab', 'table',
  'tablist', 'tabpanel', 'term', 'textbox', 'timer', 'toolbar', 'tooltip', 'tree',
  'treegrid', 'treeitem',
]);

/** `role` values defined for the current document — one violation per element. */
export const ariaRoleRule: Rule = {
  id: 'aria-role-valid',
  name: 'ARIA roles are valid',
  description:
    'role="…" must use a defined ARIA role. Invalid roles are ignored by browsers, so the intended semantics never reach assistive technology.',
  severity: 'serious',
  wcagLevel: 'A',
  successCriteria: ['4.1.2'],
  remediation: 'Replace the role with a valid ARIA role, or use the native element that already has that semantics.',
  evaluate({ body }) {
    const findings: EngineFinding[] = [];
    for (const element of auditable({ body }, '[role]')) {
      const roleAttr = (element.getAttribute('role') ?? '').trim();
      if (roleAttr === '') continue;
      const roles = roleAttr.toLowerCase().split(/\s+/);
      const invalid = roles.filter((role) => !VALID_ROLES.has(role));
      if (invalid.length === 0) continue;
      findings.push(
        violation(ariaRoleRule, {
          element,
          message: `role="${invalid.join(' ')}" is not a valid ARIA role.`,
        }),
      );
    }
    return findings;
  },
};

/**
 * Required attributes for roles whose contract demands them. `aria-required` is
 * here rather than in a separate rule because it is a single deterministic
 * mapping — one finding per element keeps the report actionable.
 */
const REQUIRED_ATTRIBUTES: Record<string, string[]> = {
  checkbox: ['aria-checked'],
  combobox: ['aria-expanded'],
  heading: ['aria-level'],
  radio: ['aria-checked'],
  scrollbar: ['aria-controls', 'aria-valuenow'],
  slider: ['aria-valuenow'],
  switch: ['aria-checked'],
  tab: ['aria-selected'],
  tablist: [],
};

export const ariaRequiredAttributesRule: Rule = {
  id: 'aria-required-attributes',
  name: 'ARIA roles have required attributes',
  description:
    'Roles such as checkbox, slider and tab require specific states (aria-checked, aria-valuenow, aria-selected) to convey anything to assistive technology.',
  severity: 'serious',
  wcagLevel: 'A',
  successCriteria: ['4.1.2'],
  remediation: 'Add the required state attributes listed in the finding and keep them in sync with the visual state.',
  evaluate({ body }) {
    const findings: EngineFinding[] = [];
    for (const element of auditable({ body }, '[role]')) {
      const roles = (element.getAttribute('role') ?? '').toLowerCase().split(/\s+/);
      for (const role of roles) {
        const required = REQUIRED_ATTRIBUTES[role];
        if (!required || required.length === 0) continue;
        const missing = required.filter((name) => !element.hasAttribute(name));
        if (missing.length === 0) continue;
        findings.push(
          violation(ariaRequiredAttributesRule, {
            element,
            message: `role="${role}" is missing ${missing.join(', ')}.`,
          }),
        );
      }
    }
    return findings;
  },
};

/** `aria-*` attribute names must exist in the ARIA specification. */
const VALID_ARIA_ATTRIBUTES = new Set([
  'aria-activedescendant', 'aria-atomic', 'aria-autocomplete', 'aria-braillelabel',
  'aria-brailleroledescription', 'aria-busy', 'aria-checked', 'aria-colcount',
  'aria-colindex', 'aria-colspan', 'aria-controls', 'aria-current', 'aria-describedby',
  'aria-description', 'aria-details', 'aria-disabled', 'aria-dropeffect', 'aria-errormessage',
  'aria-expanded', 'aria-flowto', 'aria-grabbed', 'aria-haspopup', 'aria-hidden',
  'aria-invalid', 'aria-keyshortcuts', 'aria-label', 'aria-labelledby', 'aria-level',
  'aria-live', 'aria-modal', 'aria-multiline', 'aria-multiselectable', 'aria-orientation',
  'aria-owns', 'aria-placeholder', 'aria-posinset', 'aria-pressed', 'aria-readonly',
  'aria-relevant', 'aria-required', 'aria-roledescription', 'aria-rowcount',
  'aria-rowindex', 'aria-rowspan', 'aria-selected', 'aria-setsize', 'aria-sort',
  'aria-valuemax', 'aria-valuemin', 'aria-valuenow', 'aria-valuetext',
]);

export const ariaAttributeRule: Rule = {
  id: 'aria-attribute-valid',
  name: 'ARIA attributes are valid',
  description: 'Every aria-* attribute must be in the ARIA specification; typos are silently ignored by browsers.',
  severity: 'serious',
  wcagLevel: 'A',
  successCriteria: ['4.1.2'],
  remediation: 'Remove or correct the unknown aria-* attribute. Check the spelling against the ARIA 1.2 attribute list.',
  evaluate({ body }) {
    const findings: EngineFinding[] = [];
    // Deliberately not using `auditable(..., '*')`: validating an attribute name
    // is O(attributes) and needs no visibility walk over every element in the
    // document. The hidden check runs only for the (rare) offending element, so
    // the common case stays linear in the number of elements.
    for (const element of Array.from(body.querySelectorAll('*'))) {
      let invalid: string | null = null;
      for (const attribute of Array.from(element.attributes)) {
        const name = attribute.name.toLowerCase();
        if (!name.startsWith('aria-')) continue;
        if (VALID_ARIA_ATTRIBUTES.has(name)) continue;
        invalid = name;
        break;
      }
      if (!invalid) continue;
      if (!isAuditable(element)) continue;
      findings.push(
        violation(ariaAttributeRule, {
          element,
          message: `"${invalid}" is not a defined aria-* attribute.`,
        }),
      );
      if (findings.length >= 100) return findings; // Bounded to keep reports readable.
    }
    return findings;
  },
};
