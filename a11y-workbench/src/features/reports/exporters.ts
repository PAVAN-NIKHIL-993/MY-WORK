/**
 * Report exporters.
 *
 * Pure string builders — they take scans/projects and return text. No DOM, no
 * Blob, no download side effects, which is what makes them unit-testable and
 * safe to call from anywhere. `lib/download.ts` handles the actual file write.
 *
 * All interpolated user data is escaped where the target format requires it:
 *  - CSV: every field quoted, quotes doubled;
 *  - HTML: `escapeHtml` on every value;
 *  - Markdown: pipes and newlines escaped inside table cells.
 */

import type { Finding, Project, Scan } from '@/types/domain';
import { FINDING_STATUS_LABEL, SEVERITY_LABEL, SEVERITY_ORDER } from '@/types/domain';
import { escapeHtml } from '@/lib/dom';
import { formatDateTime, percent } from '@/lib/format';
import { buildConformance, countBySeverity, isResolved } from '@/state/selectors';
import { ENGINE_VERSION } from '@/engine/audit';
import { APP_NAME, APP_VERSION } from '@/config';

/**
 * Prepares one CSV cell.
 *
 * Two protections:
 *  1. RFC-4180 quoting for separators, quotes and newlines.
 *  2. Formula-injection neutralisation: a cell beginning with `= + - @`, tab or
 *     carriage return is prefixed with a single quote so a spreadsheet treats it
 *     as text. Captured markup is attacker-influenced input, and a finding
 *     selector or message could otherwise execute as a formula when the CSV is
 *     opened in Excel or Sheets.
 */
function csvCell(value: string | number): string {
  const text = String(value ?? '');
  const neutralised = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
  if (/[",\n\r]/.test(neutralised)) return `"${neutralised.replace(/"/g, '""')}"`;
  return neutralised;
}

/** Findings across the given scans as RFC 4180 CSV. */
export function findingsToCsv(scans: readonly Scan[]): string {
  const header = [
    'Project',
    'Scan',
    'URL',
    'Rule ID',
    'Rule',
    'Severity',
    'WCAG level',
    'Success criteria',
    'Status',
    'Selector',
    'Message',
    'Remediation',
    'Evidence',
    'Detail',
    'Note',
    'Captured',
  ];

  const lines = [header.map(csvCell).join(',')];

  for (const scan of scans) {
    for (const finding of scan.findings) {
      lines.push(
        [
          scan.projectId,
          scan.name,
          scan.url,
          finding.ruleId,
          finding.ruleName,
          SEVERITY_LABEL[finding.severity],
          finding.wcagLevel,
          finding.successCriteria.join(' '),
          FINDING_STATUS_LABEL[finding.status],
          finding.selector,
          finding.message,
          finding.remediation,
          finding.snippet,
          finding.detail ?? '',
          finding.note,
          scan.createdAt,
        ]
          .map(csvCell)
          .join(','),
      );
    }
  }

  return `${lines.join('\r\n')}\r\n`;
}

export interface ReportInput {
  project: Project;
  scans: readonly Scan[];
  /** ISO timestamp used in the header; injectable for deterministic tests. */
  generatedAt?: string;
}

function mdCell(value: string): string {
  return value.replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
}

/** Markdown report: summary tables + per-scan findings. */
export function buildMarkdownReport({ project, scans, generatedAt }: ReportInput): string {
  const allFindings = scans.flatMap((scan) => scan.findings);
  const counts = countBySeverity(allFindings);
  const resolved = allFindings.filter(isResolved).length;
  const stamp = generatedAt ?? new Date().toISOString();

  const lines: string[] = [];
  lines.push(`# Accessibility report — ${project.name}`);
  lines.push('');
  lines.push(`Generated ${formatDateTime(stamp)} by ${APP_NAME} ${APP_VERSION} (engine ${ENGINE_VERSION}).`);
  if (project.owner) lines.push('');
  if (project.owner) lines.push(`**Owner:** ${project.owner}`);
  if (project.description) lines.push('');
  if (project.description) lines.push(`**Scope:** ${project.description}`);
  lines.push('');

  lines.push('## Summary');
  lines.push('');
  lines.push('| Measure | Value |');
  lines.push('| --- | --- |');
  lines.push(`| Scans included | ${scans.length} |`);
  lines.push(`| Findings | ${allFindings.length} |`);
  lines.push(`| Resolved | ${resolved} (${percent(resolved, allFindings.length)}%) |`);
  for (const severity of SEVERITY_ORDER) {
    lines.push(`| ${SEVERITY_LABEL[severity]} | ${counts[severity]} |`);
  }
  lines.push('');

  lines.push('## Findings by rule');
  lines.push('');
  lines.push('| Rule | Severity | WCAG | Success criteria | Findings |');
  lines.push('| --- | --- | --- | --- | --- |');
  const byRule = new Map<string, Finding[]>();
  for (const finding of allFindings) {
    const list = byRule.get(finding.ruleId) ?? [];
    list.push(finding);
    byRule.set(finding.ruleId, list);
  }
  for (const [ruleId, findings] of [...byRule.entries()].sort((a, b) => b[1].length - a[1].length)) {
    const first = findings[0]!;
    lines.push(
      `| ${mdCell(first.ruleName)} (\`${ruleId}\`) | ${SEVERITY_LABEL[first.severity]} | ${first.wcagLevel} | ${mdCell(first.successCriteria.join(', ')) || '—'} | ${findings.length} |`,
    );
  }
  lines.push('');

  if (scans.length > 0) {
    const conformance = buildConformance(scans[0]!);
    if (conformance.length > 0) {
      lines.push('## Conformance (latest scan)');
      lines.push('');
      lines.push('| Rule | Level | Status | Open / total |');
      lines.push('| --- | --- | --- | --- |');
      for (const row of conformance) {
        lines.push(
          `| ${mdCell(row.ruleName)} | ${row.wcagLevel} | ${row.status} | ${row.openOccurrences} / ${row.occurrences} |`,
        );
      }
      lines.push('');
    }
  }

  for (const scan of scans) {
    lines.push(`## ${scan.name}`);
    lines.push('');
    lines.push(`- Captured: ${formatDateTime(scan.createdAt)}`);
    lines.push(`- URL: ${scan.url || '—'}`);
    lines.push(`- Template: ${scan.template || '—'}`);
    lines.push(`- Findings: ${scan.findings.length}`);
    lines.push('');
    if (scan.findings.length === 0) {
      lines.push('_No violations found in the captured markup._');
      lines.push('');
      continue;
    }
    lines.push('| Severity | Rule | Selector | Status | Message |');
    lines.push('| --- | --- | --- | --- | --- |');
    for (const finding of scan.findings) {
      lines.push(
        `| ${SEVERITY_LABEL[finding.severity]} | ${mdCell(finding.ruleName)} | \`${mdCell(finding.selector)}\` | ${FINDING_STATUS_LABEL[finding.status]} | ${mdCell(finding.message)} |`,
      );
    }
    lines.push('');
  }

  lines.push('---');
  lines.push('');
  lines.push(
    'This report was produced from static HTML captures. External stylesheets, JavaScript interaction states and media alternatives cannot be evaluated from a capture; treat the results as one evidence source, not a complete conformance claim.',
  );
  lines.push('');

  return lines.join('\n');
}

/** Standalone, printable HTML report (self-contained, no external assets). */
export function buildHtmlReport({ project, scans, generatedAt }: ReportInput): string {
  const allFindings = scans.flatMap((scan) => scan.findings);
  const counts = countBySeverity(allFindings);
  const resolved = allFindings.filter(isResolved).length;
  const stamp = generatedAt ?? new Date().toISOString();

  const severityRows = SEVERITY_ORDER.map(
    (severity) => `<tr><td>${SEVERITY_LABEL[severity]}</td><td>${counts[severity]}</td></tr>`,
  ).join('');

  const scanSections = scans
    .map((scan) => {
      const rows =
        scan.findings.length === 0
          ? '<tr><td colspan="5">No violations found in the captured markup.</td></tr>'
          : scan.findings
              .map(
                (finding) => `<tr>
            <td><span class="sev sev--${finding.severity}">${SEVERITY_LABEL[finding.severity]}</span></td>
            <td><strong>${escapeHtml(finding.ruleName)}</strong><br><span class="muted">${escapeHtml(finding.ruleId)} · WCAG ${escapeHtml(finding.wcagLevel)}</span></td>
            <td><code>${escapeHtml(finding.selector)}</code></td>
            <td>${escapeHtml(FINDING_STATUS_LABEL[finding.status])}</td>
            <td>${escapeHtml(finding.message)}<br><span class="muted">Fix: ${escapeHtml(finding.remediation)}</span></td>
          </tr>`,
              )
              .join('');

      return `<section class="scan">
        <h2>${escapeHtml(scan.name)}</h2>
        <p class="muted">Captured ${escapeHtml(formatDateTime(scan.createdAt))} · ${escapeHtml(scan.url || 'no URL')} · ${scan.findings.length} finding(s)</p>
        <table>
          <caption>Findings for ${escapeHtml(scan.name)}</caption>
          <thead><tr><th scope="col">Severity</th><th scope="col">Rule</th><th scope="col">Selector</th><th scope="col">Status</th><th scope="col">Issue and fix</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </section>`;
    })
    .join('\n');

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Accessibility report — ${escapeHtml(project.name)}</title>
<style>
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body { margin: 0; padding: 40px 24px; font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif; color: #16191f; background: #fff; line-height: 1.55; }
  main { max-width: 1000px; margin: 0 auto; }
  h1 { font-size: 1.6rem; margin: 0 0 4px; letter-spacing: -0.02em; }
  h2 { font-size: 1.15rem; margin: 32px 0 8px; }
  .muted { color: #5a6270; font-size: .82rem; }
  header { border-bottom: 2px solid #d7dce4; padding-bottom: 16px; margin-bottom: 24px; }
  table { width: 100%; border-collapse: collapse; font-size: .84rem; margin-top: 8px; }
  caption { text-align: left; color: #5a6270; font-size: .78rem; padding-bottom: 6px; }
  th, td { border: 1px solid #d7dce4; padding: 8px 10px; text-align: left; vertical-align: top; }
  th { background: #f0f2f5; font-size: .72rem; text-transform: uppercase; letter-spacing: .05em; }
  code { font-family: ui-monospace, Menlo, Consolas, monospace; font-size: .78rem; background: #f0f2f5; padding: 1px 4px; border-radius: 3px; overflow-wrap: anywhere; }
  .sev { display: inline-block; padding: 1px 8px; border-radius: 999px; font-size: .72rem; font-weight: 700; border: 1px solid; }
  .sev--critical { color: #8f1d1d; background: #fdecec; border-color: #f0c2c2; }
  .sev--serious { color: #8a4207; background: #fdf2e4; border-color: #f2d3ac; }
  .sev--moderate { color: #6a4c05; background: #fbf6e3; border-color: #e8dbaf; }
  .sev--minor { color: #3f4a5c; background: #eef1f5; border-color: #d8dee7; }
  .meta { display: grid; grid-template-columns: max-content 1fr; gap: 4px 16px; font-size: .86rem; }
  .meta dt { color: #5a6270; }
  .meta dd { margin: 0; }
  footer { margin-top: 40px; border-top: 1px solid #d7dce4; padding-top: 12px; }
  @media print { body { padding: 0; } section { break-inside: avoid; } }
</style>
</head>
<body>
<main>
  <header>
    <h1>Accessibility report — ${escapeHtml(project.name)}</h1>
    <p class="muted">Generated ${escapeHtml(formatDateTime(stamp))} · ${APP_NAME} ${APP_VERSION} · engine ${ENGINE_VERSION}</p>
  </header>

  <h2>Scope and summary</h2>
  <dl class="meta">
    ${project.owner ? `<dt>Owner</dt><dd>${escapeHtml(project.owner)}</dd>` : ''}
    ${project.description ? `<dt>Scope</dt><dd>${escapeHtml(project.description)}</dd>` : ''}
    <dt>Scans included</dt><dd>${scans.length}</dd>
    <dt>Findings</dt><dd>${allFindings.length}</dd>
    <dt>Resolved</dt><dd>${resolved} (${percent(resolved, allFindings.length)}%)</dd>
  </dl>

  <table>
    <caption>Findings by severity</caption>
    <thead><tr><th scope="col">Severity</th><th scope="col">Count</th></tr></thead>
    <tbody>${severityRows}</tbody>
  </table>

  ${scanSections}

  <footer>
    <p class="muted">
      Produced from static HTML captures. External stylesheets, interaction states and media
      alternatives are not evaluated from a capture. Use this document as one evidence source in an
      accessibility statement, not as a complete conformance claim.
    </p>
  </footer>
</main>
</body>
</html>`;
}
