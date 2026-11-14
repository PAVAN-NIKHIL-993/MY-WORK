/**
 * Engine integration tests, one block per rule.
 *
 * Each rule is verified in both directions: it must fire on the violating
 * fixture and stay silent on the clean page. Assertions target a specific rule
 * id so an unrelated finding cannot make a test pass or fail by accident.
 */

import { describe, expect, it } from 'vitest';
import { runAudit, summarize, ENGINE_VERSION } from './audit';
import { RULES } from './rules';
import {
  ARIA_ISSUES,
  BAD_LANG,
  BUTTON_WITHOUT_NAME,
  CLEAN_PAGE,
  CLICK_ONLY,
  CONTRAST_ISSUE,
  DUPLICATE_LANDMARKS,
  FIELDSET_ISSUE,
  HEADING_ISSUES,
  HIDDEN_CONTENT,
  IMAGE_WITHOUT_ALT,
  LABEL_ISSUES,
  LINK_ISSUES,
  LIST_ISSUES,
  MALFORMED_MARKUP,
  NO_BYPASS,
  NO_H1,
  NO_LANG,
  NO_TITLE,
  SVG_ISSUE,
  TABLE_ISSUE,
  TABINDEX_ISSUE,
} from '@/test/fixtures/pages';

function ruleIds(markup: string): string[] {
  return runAudit(markup).findings.map((finding) => finding.ruleId);
}

describe('runAudit — contract', () => {
  it('returns the engine version and a summary for every scan', () => {
    const result = runAudit(CLEAN_PAGE);
    expect(result.engineVersion).toBe(ENGINE_VERSION);
    expect(result.summary.rulesEvaluated).toBe(RULES.length);
    expect(Array.isArray(result.warnings)).toBe(true);
  });

  it('produces no findings for a correctly built page', () => {
    const result = runAudit(CLEAN_PAGE);
    expect(result.findings).toEqual([]);
    expect(result.summary.total).toBe(0);
  });

  it('is deterministic: identical markup yields identical output', () => {
    const first = runAudit(IMAGE_WITHOUT_ALT);
    const second = runAudit(IMAGE_WITHOUT_ALT);
    expect(first.findings).toEqual(second.findings);
  });

  it('sorts findings by severity then rule id', () => {
    const result = runAudit(ARIA_ISSUES + IMAGE_WITHOUT_ALT);
    const rank = { critical: 0, serious: 1, moderate: 2, minor: 3 } as const;
    const ranks = result.findings.map((finding) => rank[finding.severity]);
    expect([...ranks].sort((a, b) => a - b)).toEqual(ranks);
  });

  it('handles empty markup without throwing', () => {
    const result = runAudit('');
    expect(result.findings).toEqual([]);
    expect(result.warnings[0]).toMatch(/empty/i);
  });

  it('recovers from malformed markup', () => {
    const result = runAudit(MALFORMED_MARKUP);
    expect(ruleIds(MALFORMED_MARKUP)).toContain('image-alt');
    expect(result.summary.rulesEvaluated).toBe(RULES.length);
  });

  it('never throws on pathological input', () => {
    expect(() => runAudit('<'.repeat(500))).not.toThrow();
    expect(() => runAudit('<div onclick="x()">'.repeat(50))).not.toThrow();
  });
});

describe('rule: document-lang', () => {
  it('flags a missing lang attribute', () => {
    expect(runAudit(NO_LANG).findings.filter((f) => f.ruleId === 'document-lang')).toHaveLength(1);
  });

  it('flags an invalid lang value', () => {
    const finding = runAudit(BAD_LANG).findings.find((f) => f.ruleId === 'document-lang');
    expect(finding?.message).toMatch(/BCP-47/);
  });

  it('accepts a regional lang tag', () => {
    const markup = CLEAN_PAGE.replace('lang="en"', 'lang="en-GB"');
    expect(ruleIds(markup)).not.toContain('document-lang');
  });
});

describe('rule: page-title', () => {
  it('flags a missing title', () => {
    expect(ruleIds(NO_TITLE)).toContain('page-title');
  });

  it('flags a generic title at minor severity', () => {
    const generic = CLEAN_PAGE.replace('<title>Checkout — Acme Store</title>', '<title>Home</title>');
    const finding = runAudit(generic).findings.find((f) => f.ruleId === 'page-title');
    expect(finding?.severity).toBe('minor');
    expect(finding?.message).toMatch(/does not describe/);
  });
});

describe('rule: image-alt', () => {
  it('flags only images without an alt attribute', () => {
    const findings = runAudit(IMAGE_WITHOUT_ALT).findings.filter((f) => f.ruleId === 'image-alt');
    expect(findings).toHaveLength(1);
    expect(findings[0]!.selector).toContain('img');
  });

  it('accepts decorative images with alt=""', () => {
    const markup = CLEAN_PAGE.replace('<h2>Contact</h2>', '<h2>Contact</h2><img src="x.jpg" alt="">');
    expect(ruleIds(markup)).not.toContain('image-alt');
  });

  it('ignores images inside aria-hidden regions', () => {
    expect(ruleIds(HIDDEN_CONTENT)).not.toContain('image-alt');
  });
});

describe('rule: button-name', () => {
  it('flags buttons with no accessible name', () => {
    const findings = runAudit(BUTTON_WITHOUT_NAME).findings.filter((f) => f.ruleId === 'button-name');
    expect(findings).toHaveLength(1);
  });
});

describe('rule: link-name', () => {
  it('flags vague link text', () => {
    const findings = runAudit(LINK_ISSUES).findings.filter((f) => f.ruleId === 'link-name');
    // "Click here" and the empty link; aria-label and descriptive text pass.
    expect(findings).toHaveLength(2);
  });
});

describe('rule: form-label', () => {
  it('flags unlabelled controls and placeholder-only labels', () => {
    const findings = runAudit(LABEL_ISSUES).findings.filter((f) => f.ruleId === 'form-label');
    expect(findings).toHaveLength(3);
    expect(findings.some((f) => /placeholder/.test(f.message))).toBe(true);
  });
});

describe('rule: heading-order', () => {
  it('flags skipped heading levels', () => {
    const findings = runAudit(HEADING_ISSUES).findings.filter((f) => f.ruleId === 'heading-order');
    expect(findings.some((f) => /jumps from h2 to h4/.test(f.message))).toBe(true);
  });

  it('flags a page with no h1', () => {
    const findings = runAudit(NO_H1).findings.filter((f) => f.ruleId === 'heading-order');
    expect(findings.some((f) => /no h1/.test(f.message))).toBe(true);
  });
});

describe('rule: list-structure', () => {
  it('flags non-li children and empty lists', () => {
    const findings = runAudit(LIST_ISSUES).findings.filter((f) => f.ruleId === 'list-structure');
    expect(findings.length).toBeGreaterThanOrEqual(2);
  });
});

describe('rule: contrast-inline', () => {
  it('evaluates inline colours and skips undeclared backgrounds', () => {
    const findings = runAudit(CONTRAST_ISSUE).findings.filter((f) => f.ruleId === 'contrast-inline');
    expect(findings).toHaveLength(1);
    expect(findings[0]!.message).toMatch(/contrast is/i);
    expect(findings[0]!.detail).toMatch(/#ffffff/);
  });
});

describe('rule: bypass-blocks', () => {
  it('flags a page with no landmark and no skip link', () => {
    expect(ruleIds(NO_BYPASS)).toContain('bypass-blocks');
  });

  it('accepts a main landmark without a skip link', () => {
    const markup = NO_BYPASS.replace('<div>', '<main>').replace('</div>', '</main>');
    expect(ruleIds(markup)).not.toContain('bypass-blocks');
  });
});

describe('rule: landmark-structure', () => {
  it('flags duplicate unnamed landmarks', () => {
    expect(ruleIds(DUPLICATE_LANDMARKS)).toContain('landmark-structure');
  });
});

describe('rule: interactive-semantics', () => {
  it('flags click-only non-native elements', () => {
    const findings = runAudit(CLICK_ONLY).findings.filter((f) => f.ruleId === 'interactive-semantics');
    expect(findings).toHaveLength(1);
  });
});

describe('rule: tabindex-order', () => {
  it('flags positive tabindex only', () => {
    const findings = runAudit(TABINDEX_ISSUE).findings.filter((f) => f.ruleId === 'tabindex-order');
    expect(findings).toHaveLength(1);
  });
});

describe('rule: svg-name', () => {
  it('flags unnamed SVGs and ignores aria-hidden ones', () => {
    const findings = runAudit(SVG_ISSUE).findings.filter((f) => f.ruleId === 'svg-name');
    expect(findings).toHaveLength(1);
  });
});

describe('rule: table-header', () => {
  it('flags data tables without headers and skips presentation tables', () => {
    const findings = runAudit(TABLE_ISSUE).findings.filter((f) => f.ruleId === 'table-header');
    expect(findings).toHaveLength(1);
  });
});

describe('rule: fieldset-legend', () => {
  it('flags fieldsets without a legend', () => {
    const findings = runAudit(FIELDSET_ISSUE).findings.filter((f) => f.ruleId === 'fieldset-legend');
    expect(findings).toHaveLength(1);
  });
});

describe('rules: ARIA', () => {
  it('flags an invalid role', () => {
    const findings = runAudit(ARIA_ISSUES).findings.filter((f) => f.ruleId === 'aria-role-valid');
    expect(findings).toHaveLength(1);
  });

  it('flags a missing required state attribute', () => {
    const findings = runAudit(ARIA_ISSUES).findings.filter((f) => f.ruleId === 'aria-required-attributes');
    expect(findings).toHaveLength(1);
    expect(findings[0]!.message).toContain('aria-checked');
  });

  it('flags a misspelled aria attribute', () => {
    const findings = runAudit(ARIA_ISSUES).findings.filter((f) => f.ruleId === 'aria-attribute-valid');
    expect(findings.some((f) => f.message.includes('aria-labeledby'))).toBe(true);
  });
});

describe('summarize', () => {
  it('counts passes per WCAG level for rules that produced no findings', () => {
    const result = runAudit(CLEAN_PAGE);
    const summary = summarize(result.findings, RULES.length);
    expect(summary.passedByLevel.A).toBeGreaterThan(0);
    expect(summary.total).toBe(0);
  });

  it('counts findings per severity', () => {
    const result = runAudit(IMAGE_WITHOUT_ALT + BUTTON_WITHOUT_NAME);
    expect(result.summary.bySeverity.critical).toBeGreaterThanOrEqual(2);
    expect(result.summary.total).toBe(result.findings.length);
  });
});
