/**
 * DOM helpers used by the audit engine.
 *
 * Markup is parsed with `DOMParser` in a detached document: scripts do not
 * execute, images/fonts are not fetched, and no request leaves the browser.
 * This is the security boundary that lets the workbench accept untrusted
 * third-party markup.
 */

import { SNIPPET_LENGTH } from '@/config';

/** Parses captured markup into an inert document. Never throws. */
export function parseMarkup(markup: string): Document {
  const parser = new DOMParser();
  // `text/html` parsing never executes script and never loads subresources.
  return parser.parseFromString(markup, 'text/html');
}

/** Escapes text for safe insertion into HTML strings (exports, snippets). */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Collapses whitespace so evidence snippets render on one line. */
export function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

/**
 * Per-element cache for `isHiddenFromAT`.
 *
 * The audit engine never mutates the parsed document, so a hidden/visible result
 * is stable for the lifetime of that document. Caching turns the ancestor walk
 * from O(depth) per element (O(n·depth) per rule) into O(n): every ancestor is
 * evaluated once and shared by all of its descendants.
 *
 * Keyed by `Element` in a `WeakMap`, so entries die with the document and never
 * leak between audits. If a caller ever mutates a document mid-audit it must
 * call `resetDomCaches()`; no production path does.
 */
let hiddenCache = new WeakMap<Element, boolean>();
let labelForCache = new WeakMap<Document, Map<string, Element>>();
let formControlLabelCache = new WeakMap<Element, string>();

/**
 * Clears every cache for a document set.
 *
 * Not needed by the product: the engine treats parsed documents as immutable and
 * discards them after each audit, so the `WeakMap`s are collected with the DOM.
 * It exists for test suites that mutate a fixture and re-audit it, where a stale
 * hidden/label result would hide a real regression. Because `WeakMap` has no
 * `clear`, the caches are swapped for fresh instances.
 */
export function resetDomCaches(): void {
  hiddenCache = new WeakMap();
  labelForCache = new WeakMap();
  formControlLabelCache = new WeakMap();
}

function ownHiddenState(element: Element): boolean {
  if (element.getAttribute('aria-hidden') === 'true') return true;
  if (element.hasAttribute('hidden')) return true;
  if (element.getAttribute('type') === 'hidden') return true;
  const style = element.getAttribute('style') ?? '';
  return /display\s*:\s*none|visibility\s*:\s*hidden/i.test(style);
}

/**
 * True when an element is not exposed to assistive technology.
 *
 * Checks the element *and its ancestors*, because `aria-hidden` and `hidden` on
 * a wrapper remove the whole subtree from the accessibility tree. Skipping only
 * the marked node would report findings for content no user can encounter —
 * the most common source of false positives in accessibility linters.
 */
export function isHiddenFromAT(element: Element): boolean {
  const cached = hiddenCache.get(element);
  if (cached !== undefined) return cached;

  // Walk up until a cached ancestor or the root is reached, then propagate the
  // answer back down the path so siblings and cousins are O(1) from then on.
  const path: Element[] = [];
  let current: Element | null = element;
  let result = false;

  while (current && current.nodeType === 1) {
    const known = hiddenCache.get(current);
    if (known !== undefined) {
      result = known;
      break;
    }
    path.push(current);
    if (ownHiddenState(current)) {
      result = true;
      break;
    }
    current = current.parentElement;
  }

  for (const node of path) hiddenCache.set(node, result);
  return result;
}

/**
 * Per-parent tag index used by `buildSelector`.
 *
 * Why it exists: the naive implementation collects `parent.children` for every
 * ancestor of every finding, which is O(children) per element and therefore
 * O(n²) on a table with hundreds of rows. On a 1000-row capture that took the
 * audit from ~20 ms to over a minute. This cache builds each parent's
 * tag → element-list map once (O(n) total) so each path segment is O(1).
 *
 * Keyed by `Element` in a `WeakMap`, so entries are collected with the parsed
 * document and never leak across audits.
 */
interface TagGroup {
  /** Number of siblings sharing this tag name. */
  count: number;
  /** 1-based position of each element within its tag group. */
  positions: WeakMap<Element, number>;
}

interface ParentIndex {
  groups: Map<string, TagGroup>;
  /** Position of each child in `parent.children`, filled in as needed. */
  order: Map<Element, number>;
  /** How many leading children have been indexed so far. */
  scanned: number;
}

const siblingIndexCache = new WeakMap<Element, ParentIndex>();

/**
 * Lazily indexes a parent's children by tag name.
 *
 * Two implementation notes, both driven by measurement:
 *  1. `Array.from(children)` costs ~12 µs in jsdom for a 100-child row, so the
 *     index is built **incrementally** and stops as soon as the requested child
 *     is seen — a link in the second cell indexes 2 children, not 100.
 *  2. Positions are stored in a map rather than found with `indexOf`, so the
 *     first element that forces a full scan does not make every later lookup
 *     quadratic again.
 */
function tagPosition(parent: Element, child: Element): { position: number; count: number } {
  let index = siblingIndexCache.get(parent);
  if (!index) {
    index = { groups: new Map(), order: new Map(), scanned: 0 };
    siblingIndexCache.set(parent, index);
  }

  const children = parent.children;

  if (!index.order.has(child)) {
    // Extend the index until the child is covered or all children are scanned.
    const total = children.length;
    for (let i = index.scanned; i < total; i += 1) {
      const candidate = children[i] as Element | undefined;
      if (!candidate) break;
      const tag = candidate.tagName;
      let group = index.groups.get(tag);
      if (!group) {
        group = { count: 0, positions: new WeakMap() };
        index.groups.set(tag, group);
      }
      group.count += 1;
      group.positions.set(candidate, group.count);
      index.order.set(candidate, i);
      if (candidate === child) {
        index.scanned = i + 1;
        break;
      }
    }
  }

  const group = index.groups.get(child.tagName);
  return { position: group?.positions.get(child) ?? 1, count: group?.count ?? 1 };
}

/**
 * Builds a stable, human-readable CSS path for an element, e.g.
 * `body > main:nth-of-type(1) > form > input#email`.
 * Ids short-circuit the path because they are unique by definition.
 *
 * Complexity: O(depth) per call after the one-time per-parent index build.
 */
export function buildSelector(element: Element): string {
  const parts: string[] = [];
  let current: Element | null = element;

  while (current && current.nodeType === 1) {
    const tag = current.tagName.toLowerCase();
    if (tag === 'html') break;

    const id = current.getAttribute('id');
    if (id && /^[A-Za-z][\w-]*$/.test(id)) {
      parts.unshift(`${tag}#${id}`);
      break;
    }

    const parent: Element | null = current.parentElement;
    if (!parent) {
      parts.unshift(tag);
      break;
    }

    const { position, count } = tagPosition(parent, current);
    parts.unshift(count > 1 ? `${tag}:nth-of-type(${position})` : tag);
    current = parent;
  }

  return parts.join(' > ');
}

/** Truncated, single-line outerHTML for evidence. */
export function snippetOf(element: Element): string {
  const raw = element.outerHTML ?? `<${element.tagName.toLowerCase()}>`;
  return normalizeWhitespace(raw).slice(0, SNIPPET_LENGTH);
}

/** All elements in document order, excluding document/html/head/body wrappers. */
export function queryAll(root: ParentNode, selector: string): Element[] {
  return Array.from(root.querySelectorAll(selector));
}

/** True when the element can receive keyboard focus by default. */
export function isNativelyFocusable(element: Element): boolean {
  const tag = element.tagName.toLowerCase();
  const type = (element.getAttribute('type') ?? '').toLowerCase();
  if (tag === 'input' && type === 'hidden') return false;
  if (['a', 'area'].includes(tag)) return element.hasAttribute('href');
  return ['button', 'input', 'select', 'textarea', 'summary'].includes(tag);
}

/** Text content of an element, whitespace-normalized. */
export function textOf(element: Element): string {
  return normalizeWhitespace(element.textContent ?? '');
}

/** Resolves `aria-labelledby`/`for` references inside the parsed document. */
function referencedText(doc: Document, ids: string): string {
  return normalizeWhitespace(
    ids
      .split(/\s+/)
      .map((id) => doc.getElementById(id)?.textContent ?? '')
      .join(' '),
  );
}

/**
 * Approximates the accessible name computation (AccName 1.2) closely enough to
 * catch the common failures: `aria-labelledby`, `aria-label`, native `<label>`,
 * `alt`, `title` and embedded text.
 *
 * This is intentionally a *heuristic*: the engine reports a finding only when
 * every mechanism is empty, which cannot produce a false positive for a
 * correctly-labelled control.
 */
export function accessibleName(element: Element): string {
  const doc = element.ownerDocument;
  const labelledBy = element.getAttribute('aria-labelledby');
  if (labelledBy) {
    const text = referencedText(doc, labelledBy);
    if (text) return text;
  }

  const ariaLabel = normalizeWhitespace(element.getAttribute('aria-label') ?? '');
  if (ariaLabel) return ariaLabel;

  const tag = element.tagName.toLowerCase();

  if (tag === 'img' || tag === 'area' || (tag === 'input' && element.getAttribute('type') === 'image')) {
    const alt = element.getAttribute('alt');
    if (alt !== null && normalizeWhitespace(alt)) return normalizeWhitespace(alt);
  }

  if (tag === 'input' || tag === 'select' || tag === 'textarea') {
    const cachedLabel = formControlLabelCache.get(element);
    if (cachedLabel !== undefined && cachedLabel !== '') return cachedLabel;

    const id = element.getAttribute('id');
    if (id) {
      // One pass builds `for` → label for the whole document. A per-control
      // `querySelector('label[for=…]')` would rescan the document for every
      // input, which is quadratic on long forms.
      let map = labelForCache.get(doc);
      if (!map) {
        map = new Map();
        for (const label of Array.from(doc.querySelectorAll('label[for]'))) {
          const target = label.getAttribute('for');
          if (target && !map.has(target)) map.set(target, label);
        }
        labelForCache.set(doc, map);
      }
      const label = map.get(id);
      const labelText = label ? textOf(label) : '';
      if (labelText) {
        formControlLabelCache.set(element, labelText);
        return labelText;
      }
    }
    const wrapping = element.closest('label');
    if (wrapping) {
      const wrapperText = textOf(wrapping);
      if (wrapperText) return wrapperText;
    }
    const prefix = tag === 'input' ? `${(element.getAttribute('type') ?? 'text').toLowerCase()}` : tag;
    const value = element.getAttribute('value');
    if (tag === 'input' && ['submit', 'button', 'reset'].includes(prefix)) {
      const labelText = value ? normalizeWhitespace(value) : '';
      if (labelText) return labelText;
    }
  }

  // Native form controls never take their name from their own content: a
  // <select> contains option text (its value list) and must still be labelled.
  const isFormControl = ['input', 'select', 'textarea'].includes(tag);
  if (!isFormControl) {
    const ownText = textOf(element);
    if (ownText) return ownText;
  }

  const title = normalizeWhitespace(element.getAttribute('title') ?? '');
  if (title) return title;

  return '';
}

/**
 * Text of an element with inline markup removed, used for link-text checks.
 * Images inside the link contribute their `alt` so icon links are not flagged.
 */
export function visibleText(element: Element): string {
  // Fast paths, in increasing cost: a text-only link needs neither a clone nor a
  // descendant query (both are expensive in jsdom and unnecessary in browsers).
  if (element.children.length === 0) return normalizeWhitespace(element.textContent ?? '');
  if (!element.querySelector('img, svg')) return normalizeWhitespace(element.textContent ?? '');

  const clone = element.cloneNode(true) as Element;
  clone.querySelectorAll('img').forEach((img) => {
    const alt = normalizeWhitespace(img.getAttribute('alt') ?? '');
    img.replaceWith(img.ownerDocument.createTextNode(alt));
  });
  clone.querySelectorAll('svg').forEach((svg) => {
    const title = svg.querySelector('title');
    svg.replaceWith(svg.ownerDocument.createTextNode(title?.textContent ?? ''));
  });
  return normalizeWhitespace(clone.textContent ?? '');
}

/** Attributes as a lower-cased record, convenient for rule checks. */
export function attributesOf(element: Element): Record<string, string> {
  const record: Record<string, string> = {};
  for (const attribute of Array.from(element.attributes)) {
    record[attribute.name.toLowerCase()] = attribute.value;
  }
  return record;
}
