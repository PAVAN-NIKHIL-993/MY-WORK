import { describe, expect, it } from 'vitest';
import {
  accessibleName,
  buildSelector,
  escapeHtml,
  isHiddenFromAT,
  normalizeWhitespace,
  parseMarkup,
  snippetOf,
  visibleText,
} from './dom';

function doc(markup: string): Document {
  return parseMarkup(markup);
}

describe('parseMarkup', () => {
  it('parses markup into an inert document', () => {
    const document_ = doc('<!doctype html><html lang="en"><body><h1>Hi</h1></body></html>');
    expect(document_.documentElement.getAttribute('lang')).toBe('en');
    expect(document_.querySelector('h1')?.textContent).toBe('Hi');
  });

  it('keeps script tags inert (no event handlers attached)', () => {
    const document_ = doc('<body><script>window.__pwned = true</script><p>text</p></body>');
    expect((globalThis as Record<string, unknown>).__pwned).toBeUndefined();
    expect(document_.querySelector('p')?.textContent).toBe('text');
  });
});

describe('escapeHtml', () => {
  it('escapes all five dangerous characters', () => {
    expect(escapeHtml(`<a href="x">&'`)).toBe('&lt;a href=&quot;x&quot;&gt;&amp;&#39;');
  });
});

describe('normalizeWhitespace', () => {
  it('collapses runs of whitespace and trims', () => {
    expect(normalizeWhitespace('  a \n\t b  ')).toBe('a b');
  });
});

describe('isHiddenFromAT', () => {
  it('detects aria-hidden on the element and its ancestors', () => {
    const document_ = doc('<body><div aria-hidden="true"><img src="x.jpg"></div></body>');
    expect(isHiddenFromAT(document_.querySelector('img')!)).toBe(true);
  });

  it('detects hidden, display:none and visibility:hidden', () => {
    const document_ = doc(
      '<body><div hidden><span id="a">x</span></div><div style="display: none"><span id="b">y</span></div><div style="visibility:hidden"><span id="c">z</span></div></body>',
    );
    expect(isHiddenFromAT(document_.getElementById('a')!)).toBe(true);
    expect(isHiddenFromAT(document_.getElementById('b')!)).toBe(true);
    expect(isHiddenFromAT(document_.getElementById('c')!)).toBe(true);
  });

  it('returns false for visible content', () => {
    const document_ = doc('<body><main><p id="p">text</p></main></body>');
    expect(isHiddenFromAT(document_.getElementById('p')!)).toBe(false);
  });
});

describe('buildSelector', () => {
  it('short-circuits on a valid id', () => {
    const document_ = doc('<body><main><form><input id="email"></form></main></body>');
    expect(buildSelector(document_.getElementById('email')!)).toBe('input#email');
  });

  it('uses nth-of-type only when siblings share a tag', () => {
    const document_ = doc('<body><main><p>one</p><p>two</p></main></body>');
    const paragraphs = document_.querySelectorAll('p');
    expect(buildSelector(paragraphs[1]!)).toContain('p:nth-of-type(2)');
  });

  it('produces a path rooted at body', () => {
    const document_ = doc('<body><main><h1>Title</h1></main></body>');
    expect(buildSelector(document_.querySelector('h1')!)).toBe('body > main > h1');
  });
});

describe('snippetOf', () => {
  it('returns a whitespace-normalised, truncated outerHTML', () => {
    const document_ = doc('<body><div class="a"   id="b">\n  text\n</div></body>');
    expect(snippetOf(document_.querySelector('div')!)).toBe('<div class="a" id="b"> text </div>');
  });
});

describe('accessibleName', () => {
  it('prefers aria-labelledby, then aria-label', () => {
    const document_ = doc(
      '<body><span id="lbl">Delete row</span><button aria-labelledby="lbl" aria-label="Ignored">x</button></body>',
    );
    expect(accessibleName(document_.querySelector('button')!)).toBe('Delete row');
  });

  it('resolves a label element for a control', () => {
    const document_ = doc('<body><label for="e">Email address</label><input id="e"></body>');
    expect(accessibleName(document_.getElementById('e')!)).toBe('Email address');
  });

  it('resolves a wrapping label', () => {
    const document_ = doc('<body><label>Phone <input type="tel"></label></body>');
    expect(accessibleName(document_.querySelector('input')!)).toBe('Phone');
  });

  it('does not treat select option text as a label', () => {
    const document_ = doc('<body><select><option>Standard</option></select></body>');
    expect(accessibleName(document_.querySelector('select')!)).toBe('');
  });

  it('uses alt for images and falls back to title', () => {
    const document_ = doc('<body><img src="a" alt="Chart"><span title="Tooltip" id="s"></span></body>');
    expect(accessibleName(document_.querySelector('img')!)).toBe('Chart');
    expect(accessibleName(document_.getElementById('s')!)).toBe('Tooltip');
  });
});

describe('visibleText', () => {
  it('includes image alt text inside links', () => {
    const document_ = doc('<body><a href="/x"><img src="a" alt="Pricing"></a></body>');
    expect(visibleText(document_.querySelector('a')!)).toBe('Pricing');
  });

  it('includes svg title text', () => {
    const document_ = doc('<body><a href="/x"><svg><title>Home</title></svg></a></body>');
    expect(visibleText(document_.querySelector('a')!)).toBe('Home');
  });
});
