import { describe, expect, it } from 'vitest';
import { buildHtmlReport, buildMarkdownReport, findingsToCsv } from './exporters';
import { makeFinding, makeProject, makeScan } from '@/test/fixtures/workspace';

const project = makeProject({ name: 'Acme "Store"', owner: 'QA <team>', description: 'Checkout & cart' });
const generatedAt = '2026-03-01T10:00:00.000Z';

describe('findingsToCsv', () => {
  it('emits a header even with no findings', () => {
    const csv = findingsToCsv([makeScan({ findings: [] })]);
    expect(csv.split('\r\n')[0]).toContain('Rule ID');
    expect(csv.trim().split('\r\n')).toHaveLength(1);
  });

  it('quotes fields containing commas or quotes', () => {
    const scan = makeScan({
      findings: [makeFinding({ message: 'Has a comma, and "quotes"' })],
    });
    const csv = findingsToCsv([scan]);
    expect(csv).toContain('"Has a comma, and ""quotes"""');
  });

  it('produces one row per finding plus the header', () => {
    const scan = makeScan({
      findings: [makeFinding({ id: 'a' }), makeFinding({ id: 'b' })],
    });
    expect(findingsToCsv([scan]).trim().split('\r\n')).toHaveLength(3);
  });

  it('neutralises spreadsheet formula injection', () => {
    const csv = findingsToCsv([
      makeScan({
        findings: [makeFinding({ message: '=HYPERLINK("http://evil","click")' })],
      }),
    ]);
    // Prefixed with an apostrophe so the spreadsheet treats it as text.
    expect(csv).toContain(`'=HYPERLINK`);
    expect(csv).not.toMatch(/,=HYPERLINK/);
  });

  it('neutralises leading + - and @', () => {
    const csv = findingsToCsv([
      makeScan({
        findings: [
          makeFinding({ id: 'a', message: '+1+1' }),
          makeFinding({ id: 'b', message: '-2-2' }),
          makeFinding({ id: 'c', message: '@SUM(A1)' }),
        ],
      }),
    ]);
    expect(csv).toContain(`'+1+1`);
    expect(csv).toContain(`'-2-2`);
    expect(csv).toContain(`'@SUM(A1)`);
  });

  it('uses CRLF line endings (RFC 4180)', () => {
    expect(findingsToCsv([makeScan()])).toContain('\r\n');
  });
});

describe('buildMarkdownReport', () => {
  const scan = makeScan({
    findings: [
      makeFinding({ id: 'a', status: 'open', message: 'Missing alt | with a pipe' }),
      makeFinding({ id: 'b', status: 'fixed' }),
    ],
  });

  it('includes the project name, scope and owner', () => {
    const markdown = buildMarkdownReport({ project, scans: [scan], generatedAt });
    expect(markdown).toContain('# Accessibility report — Acme "Store"');
    expect(markdown).toContain('**Owner:** QA <team>');
    expect(markdown).toContain('**Scope:** Checkout & cart');
  });

  it('reports totals and severity rows', () => {
    const markdown = buildMarkdownReport({ project, scans: [scan], generatedAt });
    expect(markdown).toContain('| Findings | 2 |');
    expect(markdown).toContain('| Resolved | 1 (50%) |');
    expect(markdown).toContain('| Critical | 2 |');
  });

  it('escapes pipes inside table cells so the table does not break', () => {
    const markdown = buildMarkdownReport({ project, scans: [scan], generatedAt });
    expect(markdown).toContain('Missing alt \\| with a pipe');
  });

  it('documents the static-capture limitation', () => {
    const markdown = buildMarkdownReport({ project, scans: [scan], generatedAt });
    expect(markdown).toMatch(/static HTML captures/i);
  });

  it('handles a clean scan with an explicit statement', () => {
    const markdown = buildMarkdownReport({ project, scans: [makeScan({ findings: [] })], generatedAt });
    expect(markdown).toContain('_No violations found in the captured markup._');
  });

  it('handles zero scans without throwing', () => {
    const markdown = buildMarkdownReport({ project, scans: [], generatedAt });
    expect(markdown).toContain('| Scans included | 0 |');
  });
});

describe('buildHtmlReport', () => {
  const scan = makeScan({
    findings: [makeFinding({ message: '<script>alert(1)</script>', selector: 'body > img' })],
  });

  it('escapes user-controlled content to prevent injection', () => {
    const html = buildHtmlReport({ project, scans: [scan], generatedAt });
    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
  });

  it('escapes project metadata', () => {
    const html = buildHtmlReport({ project, scans: [scan], generatedAt });
    expect(html).toContain('Acme &quot;Store&quot;');
    expect(html).toContain('QA &lt;team&gt;');
    expect(html).toContain('Checkout &amp; cart');
  });

  it('is a standalone document with inline styles and a language', () => {
    const html = buildHtmlReport({ project, scans: [scan], generatedAt });
    expect(html.startsWith('<!doctype html>')).toBe(true);
    expect(html).toContain('<html lang="en">');
    expect(html).toContain('<style>');
    expect(html).not.toContain('<link rel="stylesheet"');
  });

  it('includes table captions and scoped headers for accessibility', () => {
    const html = buildHtmlReport({ project, scans: [scan], generatedAt });
    expect(html).toContain('<caption>');
    expect(html).toContain('scope="col"');
  });

  it('renders an explicit row for a clean scan', () => {
    const html = buildHtmlReport({ project, scans: [makeScan({ findings: [] })], generatedAt });
    expect(html).toContain('No violations found in the captured markup.');
  });
});
