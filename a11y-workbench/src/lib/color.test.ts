import { describe, expect, it } from 'vitest';
import {
  AA_THRESHOLDS,
  AAA_THRESHOLDS,
  assessContrast,
  colorFromStyle,
  contrastRatio,
  parseColor,
  relativeLuminance,
  toHex,
} from './color';

describe('parseColor', () => {
  it('parses 3- and 6-digit hex', () => {
    expect(parseColor('#fff')).toEqual({ r: 255, g: 255, b: 255 });
    expect(parseColor('1c4b8f')).toEqual({ r: 28, g: 75, b: 143 });
  });

  it('parses rgb() and rgba()', () => {
    expect(parseColor('rgb(22, 25, 31)')).toEqual({ r: 22, g: 25, b: 31 });
    expect(parseColor('rgba(22,25,31,0.5)')).toEqual({ r: 22, g: 25, b: 31 });
  });

  it('parses common named colours case-insensitively', () => {
    expect(parseColor('WHITE')).toEqual({ r: 255, g: 255, b: 255 });
    expect(parseColor('navy')).toEqual({ r: 0, g: 0, b: 128 });
  });

  it('returns null for unparsable or non-colour values', () => {
    expect(parseColor('')).toBeNull();
    expect(parseColor('transparent')).toBeNull();
    expect(parseColor('var(--brand)')).toBeNull();
    expect(parseColor('rebeccapurple')).toBeNull();
    expect(parseColor(null)).toBeNull();
  });

  it('clamps out-of-range channels', () => {
    expect(parseColor('rgb(300, -4, 20)')).toEqual({ r: 255, g: 0, b: 20 });
  });
});

describe('toHex', () => {
  it('round-trips a colour', () => {
    const parsed = parseColor('#1c4b8f');
    expect(parsed && toHex(parsed)).toBe('#1c4b8f');
  });

  it('pads single-digit channels', () => {
    expect(toHex({ r: 1, g: 2, b: 3 })).toBe('#010203');
  });
});

describe('relativeLuminance', () => {
  it('is 0 for black and 1 for white', () => {
    expect(relativeLuminance({ r: 0, g: 0, b: 0 })).toBe(0);
    expect(relativeLuminance({ r: 255, g: 255, b: 255 })).toBeCloseTo(1, 5);
  });
});

describe('contrastRatio', () => {
  it('returns 21 for black on white', () => {
    expect(contrastRatio({ r: 0, g: 0, b: 0 }, { r: 255, g: 255, b: 255 })).toBe(21);
  });

  it('returns 1 for identical colours', () => {
    expect(contrastRatio({ r: 90, g: 90, b: 90 }, { r: 90, g: 90, b: 90 })).toBe(1);
  });

  it('is symmetric', () => {
    const a = { r: 28, g: 75, b: 143 };
    const b = { r: 245, g: 246, b: 248 };
    expect(contrastRatio(a, b)).toBe(contrastRatio(b, a));
  });
});

describe('assessContrast', () => {
  it('passes AA and AAA for black on white at normal text size', () => {
    const result = assessContrast('#000000', '#ffffff', 'normalText');
    expect(result).toEqual({ ratio: 21, required: 4.5, pass: true, level: 'AAA' });
  });

  it('reports fail with the required ratio attached', () => {
    const result = assessContrast('#9aa0a6', '#ffffff', 'normalText');
    expect(result?.pass).toBe(false);
    expect(result?.required).toBe(AA_THRESHOLDS.normalText);
    expect(result?.level).toBe('fail');
  });

  it('uses the relaxed large-text threshold', () => {
    // #8a8a8a on white is ~3.45:1 — fails AA normal text, passes large text.
    const pair = assessContrast('#8a8a8a', '#ffffff', 'normalText');
    const large = assessContrast('#8a8a8a', '#ffffff', 'largeText');
    expect(pair?.pass).toBe(false);
    expect(large?.pass).toBe(true);
  });

  it('honours explicit thresholds (AAA mode)', () => {
    const aa = assessContrast('#8a8a8a', '#ffffff', 'normalText', AA_THRESHOLDS);
    const aaa = assessContrast('#8a8a8a', '#ffffff', 'normalText', AAA_THRESHOLDS);
    expect(aa?.required).toBe(4.5);
    expect(aaa?.required).toBe(7);
  });

  it('returns null when a colour cannot be parsed', () => {
    expect(assessContrast('not-a-colour', '#ffffff', 'normalText')).toBeNull();
  });
});

describe('colorFromStyle', () => {
  it('extracts a declaration regardless of order and spacing', () => {
    expect(colorFromStyle('background-color:#ffffff; color: #333', 'color')).toBe('#333');
    expect(colorFromStyle('background-color:#ffffff; color: #333', 'background-color')).toBe('#ffffff');
  });

  it('does not confuse color with background-color', () => {
    expect(colorFromStyle('background-color: #eee', 'color')).toBeNull();
  });

  it('returns null for an absent property', () => {
    expect(colorFromStyle('font-weight: bold', 'color')).toBeNull();
    expect(colorFromStyle('', 'color')).toBeNull();
  });
});
