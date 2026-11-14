/**
 * Colour parsing and WCAG contrast mathematics.
 *
 * Pure functions with no DOM dependency: usable in rules, the contrast checker
 * feature and unit tests. Invalid input returns `null` rather than throwing, and
 * callers must surface that as validation error.
 */

export interface Rgb {
  r: number;
  g: number;
  b: number;
}

const HEX_SHORT = /^#?([0-9a-f])([0-9a-f])([0-9a-f])$/i;
const HEX_LONG = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i;
const RGB_FUNC = /^rgba?\(\s*(-?[\d.]+)[\s,]+(-?[\d.]+)[\s,]+(-?[\d.]+)\s*(?:[,/]\s*([\d.]+%?)\s*)?\)$/i;

const NAMED: Record<string, string> = {
  black: '#000000',
  white: '#ffffff',
  red: '#ff0000',
  lime: '#00ff00',
  blue: '#0000ff',
  yellow: '#ffff00',
  cyan: '#00ffff',
  magenta: '#ff00ff',
  silver: '#c0c0c0',
  gray: '#808080',
  grey: '#808080',
  maroon: '#800000',
  olive: '#808000',
  green: '#008000',
  purple: '#800080',
  teal: '#008080',
  navy: '#000080',
  orange: '#ffa500',
  gold: '#ffd700',
  pink: '#ffc0cb',
  brown: '#a52a2a',
};

function clampChannel(value: number): number {
  return Math.min(255, Math.max(0, Math.round(value)));
}

/** Parses `#abc`, `#aabbcc`, `rgb()`/`rgba()` and common CSS names. */
export function parseColor(input: string | null | undefined): Rgb | null {
  if (!input) return null;
  const raw = input.trim().toLowerCase();
  if (raw === '' || raw === 'transparent' || raw === 'inherit' || raw === 'currentcolor') return null;

  const named = NAMED[raw];
  const candidate = named ?? raw;

  const short = HEX_SHORT.exec(candidate);
  if (short) {
    const [, r, g, b] = short;
    return {
      r: Number.parseInt(`${r}${r}`, 16),
      g: Number.parseInt(`${g}${g}`, 16),
      b: Number.parseInt(`${b}${b}`, 16),
    };
  }

  const long = HEX_LONG.exec(candidate);
  if (long) {
    const [, r, g, b] = long;
    return {
      r: Number.parseInt(r!, 16),
      g: Number.parseInt(g!, 16),
      b: Number.parseInt(b!, 16),
    };
  }

  const rgb = RGB_FUNC.exec(raw);
  if (rgb) {
    const [, r, g, b] = rgb;
    return { r: clampChannel(Number(r)), g: clampChannel(Number(g)), b: clampChannel(Number(b)) };
  }

  return null;
}

/** Serialises a colour to `#rrggbb` (used for swatches and report output). */
export function toHex({ r, g, b }: Rgb): string {
  const hex = (value: number) => clampChannel(value).toString(16).padStart(2, '0');
  return `#${hex(r)}${hex(g)}${hex(b)}`;
}

/** WCAG 2.x relative luminance. */
export function relativeLuminance({ r, g, b }: Rgb): number {
  const channel = (value: number) => {
    const c = value / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** WCAG 2.x contrast ratio, always >= 1, rounded to 2 decimals. */
export function contrastRatio(foreground: Rgb, background: Rgb): number {
  const l1 = relativeLuminance(foreground);
  const l2 = relativeLuminance(background);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return Math.round(((lighter + 0.05) / (darker + 0.05)) * 100) / 100;
}

export interface ContrastThresholds {
  normalText: number;
  largeText: number;
  uiComponent: number;
}

/** WCAG 2.2 AA thresholds (1.4.3 for text, 1.4.11 for non-text). */
export const AA_THRESHOLDS: ContrastThresholds = {
  normalText: 4.5,
  largeText: 3,
  uiComponent: 3,
};

/** WCAG 2.2 AAA thresholds, used by the contrast checker's level switch. */
export const AAA_THRESHOLDS: ContrastThresholds = {
  normalText: 7,
  largeText: 4.5,
  uiComponent: 4.5,
};

export type ContrastUse = 'normalText' | 'largeText' | 'uiComponent';

export interface ContrastAssessment {
  ratio: number;
  required: number;
  pass: boolean;
  /** Highest WCAG level satisfied for the chosen use case. */
  level: 'AAA' | 'AA' | 'fail';
}

/**
 * Evaluates a pair against the given thresholds.
 * Large text (>= 18.66px bold or >= 24px) passes at a lower ratio, so the
 * `use` parameter changes the required minimum.
 */
export function assessContrast(
  foreground: string,
  background: string,
  use: ContrastUse,
  thresholds: ContrastThresholds = AA_THRESHOLDS,
): ContrastAssessment | null {
  const fg = parseColor(foreground);
  const bg = parseColor(background);
  if (!fg || !bg) return null;

  const ratio = contrastRatio(fg, bg);
  const required = thresholds[use];
  const pass = ratio >= required;

  let level: ContrastAssessment['level'] = 'fail';
  if (pass) {
    const levelThreshold = use === 'normalText' ? AAA_THRESHOLDS.normalText : use === 'largeText' ? AAA_THRESHOLDS.largeText : AAA_THRESHOLDS.uiComponent;
    level = ratio >= levelThreshold ? 'AAA' : 'AA';
  }

  return { ratio, required, pass, level };
}

/**
 * Parses `color` out of an inline style declaration, e.g. `color: #333`.
 * `property` must be `color` or `background-color`.
 */
export function colorFromStyle(style: string, property: 'color' | 'background-color'): string | null {
  if (!style) return null;
  const declarations = style.split(';');
  for (const declaration of declarations) {
    const [rawName, ...rawValue] = declaration.split(':');
    if (!rawName || rawValue.length === 0) continue;
    if (rawName.trim().toLowerCase() !== property) continue;
    return rawValue.join(':').trim();
  }
  return null;
}
