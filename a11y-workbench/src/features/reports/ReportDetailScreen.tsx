/**
 * Project report detail.
 *
 * Presents the conformance summary, per-rule table and per-scan findings, and
 * offers three exports. All export content is generated on demand from the
 * current workspace, so a report always reflects the latest triage state.
 */

import { useMemo, useState } from 'react';
import { paths } from '@/state/router';
import { useWorkspace } from '@/state/workspace-context';
import { buildConformance, countBySeverity, getProject, isResolved, projectScans } from '@/state/selectors';
import { SEVERITY_LABEL, SEVERITY_ORDER, type Scan } from '@/types/domain';
import { EmptyState, PageHeader, Alert } from '@/components/ui/Feedback';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { NotFoundScreen } from '@/features/workspace/NotFoundScreen';
import { downloadTextFile, fileSlug } from '@/lib/download';
import { formatDateTime, percent, pluralize } from '@/lib/format';
import { buildHtmlReport, buildMarkdownReport } from './exporters';

const CONFORMANCE_LABEL: Record<string, string> = {
  supports: 'Supports',
  'partially-supports': 'Partially supports',
  'does-not-support': 'Does not support',
  'not-applicable': 'Not applicable',
};

export function ReportDetailScreen({ projectId }: { projectId: string }): JSX.Element {
  const { workspace, notify } = useWorkspace();
  const project = getProject(workspace, projectId);
  const scans = useMemo(() => (project ? projectScans(workspace, project.id) : []), [workspace, project]);
  const [includeAllScans, setIncludeAllScans] = useState(false);

  if (!project) {
    return <NotFoundScreen message="This project no longer exists, so its report cannot be generated." />;
  }

  const included: Scan[] = includeAllScans ? scans : scans.slice(0, 1);
  const findings = included.flatMap((scan) => scan.findings);
  const resolved = findings.filter(isResolved).length;
  const severity = countBySeverity(findings.filter((finding) => !isResolved(finding)));
  const latest = scans[0];
  const conformance = latest ? buildConformance(latest) : [];
  const reportInput = { project, scans: included };

  return (
    <>
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <a href={paths.reports}>Reports</a>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{project.name}</span>
      </nav>

      <PageHeader
        title={`Accessibility report — ${project.name}`}
        eyebrow={interestingMeta(project.owner, latest?.createdAt)}
        description="Conformance summary built from captured scans, with the evidence behind every finding."
        actions={
          <>
            <Button
              icon="printer"
              onClick={() => globalThis.print()}
              disabled={included.length === 0}
            >
              Print
            </Button>
            <Button
              icon="download"
              onClick={() => {
                downloadTextFile(
                  `${fileSlug(project.name)}-accessibility-report.md`,
                  buildMarkdownReport(reportInput),
                  'text/markdown',
                );
                notify('success', 'Markdown report downloaded.');
              }}
              disabled={included.length === 0}
            >
              Markdown
            </Button>
            <Button
              variant="primary"
              icon="download"
              onClick={() => {
                downloadTextFile(
                  `${fileSlug(project.name)}-accessibility-report.html`,
                  buildHtmlReport(reportInput),
                  'text/html',
                );
                notify('success', 'HTML report downloaded.');
              }}
              disabled={included.length === 0}
            >
              Download HTML
            </Button>
          </>
        }
      />

      {scans.length === 0 ? (
        <div className="card">
          <EmptyState
            icon="file-text"
            title="This project has no scans"
            body="A report is generated from captured pages. Capture a page in this project first, then return here."
            actions={
              <Button variant="primary" onClick={() => globalThis.location.assign(paths.project(project.id))}>
                Go to project
              </Button>
            }
          />
        </div>
      ) : (
        <>
          <Alert tone="info" title="What this report can and cannot claim">
            Results come from static HTML captures. External stylesheets, JavaScript interaction
            states, PDFs and media alternatives are not evaluated. Use it as evidence in an
            accessibility statement, not as a full conformance certification.
          </Alert>

          <div className="row" style={{ margin: 'var(--space-4) 0' }}>
            <label className="checkbox">
              <input
                type="checkbox"
                checked={includeAllScans}
                onChange={(event) => setIncludeAllScans(event.target.checked)}
              />
              <span>
                Include all {scans.length} scans
                <span className="text-xs text-muted" style={{ display: 'block' }}>
                  Default is the latest capture only; all scans show history and can inflate counts
                  with findings that were already fixed.
                </span>
              </span>
            </label>
          </div>

          <div className="stat-grid" style={{ marginBottom: 'var(--space-5)' }}>
            <div className="stat">
              <span className="stat-label">Scans included</span>
              <span className="stat-value">{included.length}</span>
              <span className="stat-meta">of {scans.length} captured</span>
            </div>
            <div className="stat">
              <span className="stat-label">Findings</span>
              <span className="stat-value">{findings.length}</span>
              <span className="stat-meta">{pluralize(resolved, 'resolved')}</span>
            </div>
            <div className="stat stat--accent">
              <span className="stat-label">Resolved</span>
              <span className="stat-value">{percent(resolved, findings.length)}%</span>
              <span className="stat-meta">triage progress</span>
            </div>
            <div className={`stat ${severity.critical > 0 ? 'stat--critical' : ''}`.trim()}>
              <span className="stat-label">Open critical</span>
              <span className="stat-value">{severity.critical}</span>
              <span className="stat-meta">{severity.serious + severity.moderate + severity.minor} other open</span>
            </div>
          </div>

          <section className="report-preview" aria-labelledby="report-conformance-heading">
            <div className="report-header">
              <div>
                <h2 className="report-section-title" id="report-conformance-heading" style={{ marginBottom: 2 }}>
                  Conformance summary
                </h2>
                <p className="text-xs text-muted">
                  Derived from {latest ? `the latest scan, “${latest.name}”` : 'the latest scan'}.
                </p>
              </div>
              <Badge tone="accent">WCAG 2.2 A / AA</Badge>
            </div>

            {conformance.length === 0 ? (
              <p className="text-sm text-secondary" style={{ marginTop: 'var(--space-4)' }}>
                The latest scan produced no findings, so every evaluated success criterion is
                reported as supported for the captured markup.
              </p>
            ) : (
              <div className="table-wrap" style={{ marginTop: 'var(--space-4)' }}>
                <table className="table">
                  <caption>Conformance by rule for the latest capture. “Does not support” means at least one unresolved instance.</caption>
                  <thead>
                    <tr>
                      <th scope="col">Rule</th>
                      <th scope="col">Level</th>
                      <th scope="col">Success criteria</th>
                      <th scope="col">Status</th>
                      <th scope="col">Open / total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {conformance.map((row) => (
                      <tr key={row.ruleId}>
                        <td className="cell-primary">{row.ruleName}</td>
                        <td className="cell-nowrap">{row.wcagLevel}</td>
                        <td className="cell-nowrap">{row.successCriteria.join(', ') || '—'}</td>
                        <td className="cell-nowrap">{CONFORMANCE_LABEL[row.status] ?? row.status}</td>
                        <td className="cell-nowrap">
                          {row.openOccurrences} / {row.occurrences}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="report-section">
              <h3 className="report-section-title">Open findings by severity</h3>
              <span className="badge-group">
                {SEVERITY_ORDER.map((level) => (
                  <Badge key={level} tone={level}>
                    {SEVERITY_LABEL[level]}: {severity[level]}
                  </Badge>
                ))}
              </span>
            </div>

            <div className="report-section">
              <h3 className="report-section-title">Scans in this report</h3>
              <ul className="scan-list">
                {included.map((scan) => (
                  <li key={scan.id}>
                    <a className="scan-row" style={{ padding: 'var(--space-2) 0' }} href={paths.scan(scan.id)}>
                      <span className="scan-row-main">
                        <span className="scan-row-name">{scan.name}</span>
                        <span className="scan-row-meta">
                          {formatDateTime(scan.createdAt)} · {pluralize(scan.findings.length, 'finding')}
                          {scan.template ? ` · ${scan.template}` : ''}
                        </span>
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <p className="text-xs text-muted" style={{ marginTop: 'var(--space-4)' }}>
              Generated by a11y-workbench. Severity is assigned per rule, not per instance; see the
              rule reference for the mapping.
            </p>
          </section>
        </>
      )}
    </>
  );
}

function interestingMeta(owner: string, createdAt: string | undefined): string {
  const parts: string[] = [];
  if (owner) parts.push(owner);
  if (createdAt) parts.push(`Latest capture ${formatDateTime(createdAt)}`);
  return parts.length > 0 ? parts.join(' · ') : 'Report';
}
