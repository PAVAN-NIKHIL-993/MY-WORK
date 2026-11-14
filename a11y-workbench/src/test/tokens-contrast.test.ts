/**
 * Design-token contrast guard.
 *
 * This test parses `src/styles/tokens.css` and verifies every text and control
 * colour pair used by the UI against WCAG 2.2 AA. It exists because contrast
 * regressions are invisible in code review and in screenshots, and because this
 * product must pass its own audit.
 *
 * Thresholds:
 *  - 4.5:1 for body text (SC 1.4.3), 3:1 for large text;
 *  - 3:1 for the boundary of interactive controls (SC 1.4.11).
 *
 * Decorative dividers (`--border-default`, `--border-subtle`) are intentionally
 * excluded: 1.4.11 applies to components required to identify a control, not to
 * every hairline.
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { contrastRatio, parseColor } from '@/lib/color';

// Vitest runs with the package root as cwd; `resolve` keeps this independent of
// how the module URL is rewritten by the bundler.
const tokensPath = resolve(process.cwd(), 'src/styles/tokens.css');

interface ThemeTokens {
  light: Record<string, string>;
  dark: Record<string, string>;
}

/** Extracts custom properties per theme block from the stylesheet. */
function readTokens(): ThemeTokens {
  const css = readFileSync(tokensPath, 'utf8');
  const themes: ThemeTokens = { light: {}, dark: {} };

  const blockPattern = /(:root(?:\[data-theme='(?:light|dark)'\])?[^{]*)\{([^}]*)\}/g;
  let match: RegExpExecArray | null;
  while ((match = blockPattern.exec(css)) !== null) {
    const selector = match[1] ?? '';
    const body = match[2] ?? '';
    const theme = selector.includes("data-theme='dark'") ? 'dark' : 'light';
    const declarations = /--([\w-]+):\s*([^;]+);/g;
    let declaration: RegExpExecArray | null;
    while ((declaration = declarations.exec(body)) !== null) {
      const name = declaration[1];
      const value = (declaration[2] ?? '').trim();
      if (!name || !value.startsWith('#')) continue;
      // Later blocks win, matching CSS cascade order.
      themes[theme][`--${name}`] = value;
    }
  }

  return themes;
}

const tokens = readTokens();

/** [foreground, background, minimum ratio, description] */
type Pair = [string, string, number, string];

const TEXT_PAIRS: Pair[] = [
  ['--text-primary', '--bg-surface', 4.5, 'body text on cards'],
  ['--text-primary', '--bg-canvas', 4.5, 'body text on page background'],
  ['--text-secondary', '--bg-surface', 4.5, 'secondary text on cards'],
  ['--text-secondary', '--bg-subtle', 4.5, 'secondary text on subtle fills'],
  ['--text-muted', '--bg-surface', 4.5, 'muted text on cards'],
  ['--text-muted', '--bg-canvas', 4.5, 'muted text on page background'],
  ['--accent', '--bg-surface', 4.5, 'links and active nav on cards'],
  ['--critical-fg', '--critical-bg', 4.5, 'critical badge'],
  ['--serious-fg', '--serious-bg', 4.5, 'serious badge'],
  ['--moderate-fg', '--moderate-bg', 4.5, 'moderate badge'],
  ['--minor-fg', '--minor-bg', 4.5, 'minor badge'],
  ['--success-fg', '--success-bg', 4.5, 'success badge'],
];

const CONTROL_PAIRS: Pair[] = [
  ['--border-control', '--bg-surface', 3, 'input and button boundary on cards'],
  ['--border-control', '--bg-canvas', 3, 'input and button boundary on page background'],
  ['--focus-ring', '--bg-canvas', 3, 'focus indicator on page background'],
  ['--focus-ring', '--bg-surface', 3, 'focus indicator on cards'],
];

function ratioFor(theme: keyof ThemeTokens, pair: Pair): number | null {
  const [fgName, bgName] = pair;
  const palette = tokens[theme];
  const fg = parseColor(palette[fgName]);
  const bg = parseColor(palette[bgName]);
  if (!fg || !bg) return null;
  return contrastRatio(fg, bg);
}

describe('design tokens — contrast', () => {
  it('parses the token palette for both themes', () => {
    // 36 colour tokens per theme at the time of writing; assert a floor so a
    // broken parser (or a truncated stylesheet) fails loudly.
    expect(Object.keys(tokens.light).length).toBeGreaterThanOrEqual(30);
    expect(Object.keys(tokens.dark).length).toBeGreaterThanOrEqual(30);
    expect(tokens.light['--bg-surface']).toBeDefined();
    expect(tokens.dark['--bg-surface']).toBeDefined();
  });

  for (const theme of ['light', 'dark'] as const) {
    describe(`${theme} theme`, () => {
      for (const pair of [...TEXT_PAIRS, ...CONTROL_PAIRS]) {
        const [fgName, bgName, minimum, description] = pair;
        it(`${description} (${fgName} on ${bgName}) meets ${minimum}:1`, () => {
          const ratio = ratioFor(theme, pair);
          expect(ratio).not.toBeNull();
          expect(ratio!).toBeGreaterThanOrEqual(minimum);
        });
      }

      it('primary button text is readable', () => {
        // `.button--primary` sets `--button-fg: var(--text-inverse)` in both
        // themes, so assert exactly that pairing rather than an approximation.
        const ratio = ratioFor(theme, ['--text-inverse', '--accent', 4.5, 'primary button']);
        expect(ratio).not.toBeNull();
        expect(ratio!).toBeGreaterThanOrEqual(4.5);
      });
    });
  }
});
