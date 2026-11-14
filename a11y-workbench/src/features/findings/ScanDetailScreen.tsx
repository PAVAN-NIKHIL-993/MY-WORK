/**
 * Scan detail: the evidence view for one captured page.
 *
 * Shows the capture metadata, the engine summary, the full findings list and the
 * captured markup (escaped, in a `<pre>` — never injected as HTML). Triage works
 * in place, and "mark all visible" is available for bulk cleanup after a fix
 * round.
 */

import { useMemo, useState } from 'react';
import { paths } from '@/state/router';
import { useWorkspace } from '@/state/workspace-context';
import { getProject, getScan, countByStatus, openFindings } from '@/state/selectors';
import { SeverityBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Alert, EmptyState, PageHeader } from '@/components/ui/Feedback';
import { NotFoundScreen } from '@/features/workspace/NotFoundScreen';
import { formatBytes, formatDateTime, pluralize } from '@/lib/format';
import { downloadTextFile, fileSlug } from '@/lib/download';
import { findingsToCsv } from '@/features/reports/exporters';
import type { Severity } from '@/types/domain';
import { SEVERITY_LABEL, SEVERITY_ORDER } from '@/types/domain';
import { FindingCard } from './FindingCard';

export function ScanDetailScreen({ scanId }: { scanId: string }): JSX.Element {
  const { workspace, setFindingStatus, setFindingNote, bulkSetFindings, removeScan, notify } = useWorkspace();
  const scan = getScan(workspace, scanId);
  const [severityFilter, setSeverityFilter] = useState<'all' | Severity>('all');
  const [showMarkup, setShowMarkup] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const findings = useMemo(() => scan?.findings ?? [], [scan]);
  const visible = useMemo(
    () => (severityFilter === 'all' ? findings : findings.filter((finding) => finding.severity === severityFilter)),
    [findings, severityFilter],
  );

  if (!scan) return <NotFoundScreen message="This scan no longer exists. It may have been deleted or pruned." />;

  const project = getProject(workspace, scan.projectId);
  const statuses = countByStatus(findings);
  const open = openFindings(findings);

  return (
    <>
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <a href={paths.projects}>Projects</a>
        <span aria-hidden="true">/</span>
        <a href={paths.project(scan.projectId)}>{project?.name ?? 'Project'}</a>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{scan.name}</span>
      </nav>

      <PageHeader
        title={scan.name}
        eyebrow={`Captured ${formatDateTime(scan.createdAt)}`}
        description={
          <>
            {pluralize(findings.length, 'finding')} from {scan.summary.rulesEvaluated} rules · engine{' '}
            {scan.engineVersion}
            {scan.url ? (
              <>
                {' '}
                · <span className="mono">{scan.url}</span>
              </>
            ) : null}
          </>
        }
        actions={
          <>
            <Button
              icon="download"
              onClick={() =>
                downloadTextFile(
                  `${fileSlug(scan.name)}-findings.csv`,
                  findingsToCsv([scan]),
                  'text/csv',
                )
              }
            >
              Export CSV
            </Button>
            <Button
              variant="danger"
              icon="trash"
              onClick={() => {
                if (!confirmDelete) {
                  setConfirmDelete(true);
                  notify('warning', 'Choose “Delete scan” again to confirm.');
                  return;
                }
                removeScan(scan.id);
                notify('success', `Scan “${scan.name}” deleted.`);
                globalThis.location.assign(paths.findings);
              }}
            >
              {confirmDelete ? 'Delete scan' : 'Delete'}
            </Button>
          </>
        }
      />

      {(scan.warnings ?? []).length > 0 ? (
        <div style={{ marginBottom: 'var(--space-5)' }}>
          <Alert tone="warning" title="This result is incomplete">
            <ul className="stack-sm" style={{ listStyle: 'disc', paddingLeft: 'var(--space-4)' }}>
              {scan.warnings.map((warning) => (
                <li key={warning} className="text-sm">
                  {warning}
                </li>
              ))}
            </ul>
          </Alert>
        </div>
      ) : null}

      <div className="stat-grid" style={{ marginBottom: 'var(--space-5)' }}>
        <div className="stat">
          <span className="stat-label">Total findings</span>
          <span className="stat-value">{findings.length}</span>
          <span className="stat-meta">{pluralize(open.length, 'still needing work')}</span>
        </div>
        {SEVERITY_ORDER.slice(0, 3).map((severity) => (
          <div className="stat" key={severity}>
            <span className="stat-label">{SEVERITY_LABEL[severity]}</span>
            <span className="stat-value">{scan.summary.bySeverity[severity]}</span>
            <span className="stat-meta">
              {severity === 'critical' ? 'Blocks task completion' : severity === 'serious' ? 'Major barrier' : 'Moderate impact'}
            </span>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginBottom: 'var(--space-5)' }}>
        <div className="card-body">
          <dl className="detail-grid">
            <dt>Project</dt>
            <dd>
              <a href={paths.project(scan.projectId)}>{project?.name ?? 'Unknown'}</a>
            </dd>
            <dt>Template</dt>
            <dd>{scan.template || '—'}</dd>
            <dt>URL</dt>
            <dd>{scan.url || '—'}</dd>
            <dt>Captured</dt>
            <dd>{formatDateTime(scan.createdAt)}</dd>
            <dt>Markup size</dt>
            <dd>{formatBytes(new Blob([scan.markup]).size)}</dd>
            <dt>Triage</dt>
            <dd className="row" style={{ gap: 'var(--space-3)' }}>
              <span>{statuses.open} open</span>
              <span>{statuses.in_progress} in progress</span>
              <span>{statuses.fixed} fixed</span>
              <span>{statuses.accepted} accepted</span>
              <span>{statuses.ignored} not applicable</span>
            </dd>
          </dl>
        </div>
      </div>

      <div className="toolbar">
        <div className="toolbar-field">
          <label htmlFor="scan-severity">Severity filter</label>
          <select
            id="scan-severity"
            className="select"
            value={severityFilter}
            onChange={(event) => setSeverityFilter(event.target.value as 'all' | Severity)}
          >
            <option value="all">All severities</option>
            {SEVERITY_ORDER.map((severity) => (
              <option key={severity} value={severity}>
                {SEVERITY_LABEL[severity]} ({scan.summary.bySeverity[severity]})
              </option>
            ))}
          </select>
        </div>
        <div className="row" style={{ marginLeft: 'auto' }}>
          <Button
            size="sm"
            icon="check"
            disabled={visible.length === 0}
            onClick={() => {
              bulkSetFindings(
                scan.id,
                visible.map((finding) => finding.id),
                'fixed',
              );
              notify('success', `Marked ${visible.length} finding(s) as fixed.`);
            }}
          >
            Mark filtered as fixed
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setShowMarkup((current) => !current)}>
            {showMarkup ? 'Hide captured markup' : 'Show captured markup'}
          </Button>
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={findings.length === 0 ? 'check-circle' : 'search'}
            title={findings.length === 0 ? 'No findings — this page passed every rule' : 'No findings in this severity'}
            body={
              findings.length === 0
                ? 'The engine found no violations in the captured markup. Remember that external CSS and interaction states cannot be evaluated from a static capture.'
                : 'Choose a different severity filter to see the remaining findings.'
            }
            actions={
              findings.length > 0 ? (
                <Button onClick={() => setSeverityFilter('all')}>Show all severities</Button>
              ) : null
            }
          />
        </div>
      ) : (
        <div className="card card--flush">
          <ul className="finding-list">
            {visible.map((finding) => (
              <FindingCard
                key={finding.id}
                finding={finding}
                onStatusChange={(status) => setFindingStatus(scan.id, finding.id, status)}
                onNoteChange={(note) => setFindingNote(scan.id, finding.id, note)}
              />
            ))}
          </ul>
        </div>
      )}

      {showMarkup ? (
        <section className="card" style={{ marginTop: 'var(--space-5)' }} aria-label="Captured markup">
          <div className="card-header">
            <div>
              <h2 className="card-title">Captured markup</h2>
              <p className="card-subtitle">
                Stored exactly as captured and displayed as text, never rendered.
              </p>
            </div>
            <Button
              size="sm"
              icon="copy"
              onClick={() => {
                void navigator.clipboard?.writeText(scan.markup);
                notify('info', 'Markup copied to the clipboard.');
              }}
            >
              Copy markup
            </Button>
          </div>
          <pre className="code-block" style={{ maxHeight: 420, margin: 'var(--space-4)' }}>
            {scan.markup}
          </pre>
        </section>
      ) : null}

      <p className="text-xs text-muted" style={{ marginTop: 'var(--space-5)' }}>
        Rule severities in this scan:{' '}
        {scan.findings.length === 0
          ? 'none — all evaluated rules passed.'
          : scan.findings
              .map((finding) => finding.ruleId)
              .filter((id, index, list) => list.indexOf(id) === index)
              .slice(0, 6)
              .join(', ')}
        .
      </p>
      <div className="row" style={{ marginTop: 'var(--space-2)' }}>
        <SeverityBadge severity="critical" />
        <span className="text-xs text-muted">
          Severity ordering in reports: critical → serious → moderate → minor.
        </span>
      </div>
    </>
  );
}
