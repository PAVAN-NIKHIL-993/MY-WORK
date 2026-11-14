/**
 * Shared selectors and predicates for rules.
 *
 * Centralising these avoids the classic rule-drift problem where each rule has
 * a slightly different idea of what "interactive" or "hidden" means.
 */

import { isHiddenFromAT, queryAll } from '@/lib/dom';

/** Elements that are hidden from assistive technology and must be skipped. */
export function isAuditable(element: Element): boolean {
  return !isHiddenFromAT(element);
}

/** All auditable elements matching `selector`, in document order. */
export function auditable(context: { body: Element }, selector: string): Element[] {
  return queryAll(context.body, selector).filter(isAuditable);
}

export const INTERACTIVE_SELECTOR =
  'a[href], area[href], button, input:not([type="hidden"]), select, textarea, summary, [tabindex]';

export const FORM_CONTROL_SELECTOR = 'input:not([type="hidden"]), select, textarea';

/** Input types whose value is entered by the user and needs a label. */
export const LABELABLE_INPUT_TYPES = new Set([
  'text',
  'email',
  'password',
  'search',
  'tel',
  'url',
  'number',
  'date',
  'datetime-local',
  'month',
  'week',
  'time',
  'color',
  'file',
  'range',
]);

/** Input types where a visible label is not required by WCAG 1.3.1/3.3.2. */
export const NON_LABEL_INPUT_TYPES = new Set(['hidden', 'submit', 'button', 'reset', 'image']);

export function isVisible(element: Element): boolean {
  return isAuditable(element);
}
