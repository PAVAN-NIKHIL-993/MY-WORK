/**
 * Project detail: scans, findings summary and project-level actions.
 *
 * This is the working surface for one audit engagement: capture new pages,
 * review each scan's result, edit project metadata, and jump to the report.
 * Destructive actions require a second confirming click (no modal for a
 * single-object delete, but never a one-click irreversible action).
 */

import { useMemo, useState } from 'react';
import { paths } from '@/state/router';
import { useWorkspace } from '@/state/workspace-context';
import { countBySeverity, countByStatus, getProject, openFindings, projectScans } from '@/state/selectors';
import { PageHeader, EmptyState, Alert } from '@/components/ui/Feedback';
import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Badge, SeverityBreakdown } from '@/components/ui/Badge';
import { NotFoundScreen } from '@/features/workspace/NotFoundScreen';
import { CaptureDialog } from '@/features/scans/CaptureDialog';
import { ProjectFormDialog } from './ProjectFormDialog';
import { formatDateTime, percent, pluralize } from '@/lib/format';

export function ProjectDetailScreen({ projectId }: { projectId: string }): JSX.Element {
  const { workspace, editProject, removeProject, removeScan, notify } = useWorkspace();
  const [capturing, setCapturing] = useState(false);
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [pendingScanDelete, setPendingScanDelete] = useState<string | null>(null);

  const project = getProject(workspace, projectId);
  const scans = useMemo(() => projectScans(workspace, projectId), [workspace, projectId]);

  if (!project) {
    return <NotFoundScreen message="This project no longer exists. It may have been deleted in another tab." />;
  }

  const findings = scans.flatMap((scan) => scan.findings);
  const open = openFindings(findings);
  const severity = countBySeverity(open);
  const statuses = countByStatus(findings);
  const resolvedPercent = percent(findings.length - open.length, findings.length);

  return (
    <>
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <a href={paths.projects}>Projects</a>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{project.name}</span>
      </nav>

      <PageHeader
        title={project.name}
        description={project.description || 'No scope described yet — edit the project to record what it covers.'}
        eyebrow={project.owner ? `Owner · ${project.owner}` : 'Project'}
        actions={
          <>
            <Button icon="settings" onClick={() => setEditing(true)}>
              Edit
            </Button>
            <Button
              variant="danger"
              icon="trash"
              onClick={() => {
                if (!confirmDelete) {
                  setConfirmDelete(true);
                  notify('warning', `Choose “Delete project” again to remove “${project.name}” and its ${scans.length} scan(s).`);
                  return;
                }
                removeProject(project.id);
                notify('success', `Project “${project.name}” deleted.`);
                globalThis.location.assign(paths.projects);
              }}
            >
              {confirmDelete ? 'Delete project' : 'Delete'}
            </Button>
            <Button variant="primary" icon="plus" onClick={() => setCapturing(true)}>
              Capture page
            </Button>
          </>
        }
      />

      {findings.length > 0 ? (
        <div className="stat-grid" style={{ marginBottom: 'var(--space-5)' }}>
          <div className="stat stat--critical">
            <span className="stat-label">Open findings</span>
            <span className="stat-value">{open.length}</span>
            <span className="stat-meta">across {pluralize(scans.length, 'scan')}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Resolved</span>
            <span className="stat-value">{resolvedPercent}%</span>
            <span className="stat-meta">
              {statuses.fixed} fixed · {statuses.accepted} accepted · {statuses.ignored} n/a
            </span>
          </div>
          <div className="stat">
            <span className="stat-label">By severity</span>
            <span className="stat-value" aria-hidden="true">
              {severity.critical}
            </span>
            <span className="stat-meta">
              <SeverityBreakdown counts={severity} />
            </span>
          </div>
        </div>
      ) : null}

      <Card flush ariaLabelledBy="project-scans-heading">
        <CardHeader
          title="Scans"
          titleId="project-scans-heading"
          subtitle={
            scans.length === 0
              ? 'No pages captured yet'
              : `${pluralize(scans.length, 'capture')} · newest first`
          }
          actions={
            <Button size="sm" icon="download" onClick={() => globalThis.location.assign(paths.report(project.id))}>
              Open report
            </Button>
          }
        />

        {scans.length === 0 ? (
          <EmptyState
            icon="sparkle"
            title="Capture the first page"
            body="Paste the rendered HTML of a page, or load a built-in sample to see how the audit works. Captures are parsed locally — nothing is uploaded."
            actions={
              <>
                <Button variant="primary" icon="plus" onClick={() => setCapturing(true)}>
                  Capture a page
                </Button>
              </>
            }
          />
        ) : (
          <ul className="scan-list">
            {scans.map((scan) => {
              const scanOpen = openFindings(scan.findings).length;
              const isPendingDelete = pendingScanDelete === scan.id;
              return (
                <li key={scan.id} style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)' }}>
                  <a className="scan-row" href={paths.scan(scan.id)} style={{ flex: 1, borderBottom: 0 }}>
                    <span className="scan-row-main">
                      <span className="scan-row-name">{scan.name}</span>
                      <span className="scan-row-meta">
                        <span>{formatDateTime(scan.createdAt)}</span>
                        {scan.template ? (
                          <>
                            <span aria-hidden="true">·</span>
                            <span>{scan.template}</span>
                          </>
                        ) : null}
                        {scan.url ? (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="mono">{scan.url}</span>
                          </>
                        ) : null}
                      </span>
                    </span>
                    {scanOpen > 0 ? (
                      <Badge tone={scan.summary.bySeverity.critical > 0 ? 'critical' : 'serious'}>
                        {scanOpen} open
                      </Badge>
                    ) : (
                      <Badge tone="success">Clear</Badge>
                    )}
                  </a>
                  <div className="row" style={{ paddingRight: 'var(--space-4)', gap: 'var(--space-1)' }}>
                    <Button
                      size="sm"
                      variant={isPendingDelete ? 'danger' : 'ghost'}
                      onClick={() => {
                        if (!isPendingDelete) {
                          setPendingScanDelete(scan.id);
                          notify('warning', 'Choose “Confirm” to delete this scan.');
                          return;
                        }
                        removeScan(scan.id);
                        setPendingScanDelete(null);
                        notify('success', `Scan “${scan.name}” deleted.`);
                      }}
                    >
                      {isPendingDelete ? 'Confirm' : 'Delete'}
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      {scans.length > 0 && findings.length === 0 ? (
        <div style={{ marginTop: 'var(--space-5)' }}>
          <Alert tone="success" title="No findings in this project">
            Every captured page passed all evaluated rules. Remember that external CSS and
            interaction states are outside the scope of a static capture — test those manually.
          </Alert>
        </div>
      ) : null}

      {capturing ? (
        <CaptureDialog
          projectId={project.id}
          onClose={() => setCapturing(false)}
          onCaptured={(scanId, warnings) => {
            notify(
              warnings.length > 0 ? 'warning' : 'success',
              warnings.length > 0
                ? `Scan saved with ${warnings.length} notice(s): ${warnings[0]}`
                : 'Scan saved. Opening the results…',
            );
            globalThis.location.assign(paths.scan(scanId));
          }}
        />
      ) : null}

      {editing ? (
        <ProjectFormDialog
          project={project}
          onClose={() => setEditing(false)}
          onSubmit={(values) => {
            const outcome = editProject(project.id, values);
            if (outcome.persistence && !outcome.persistence.ok) {
              notify('warning', 'Project changes are not saved yet — see the banner for details.');
              return null;
            }
            notify('success', 'Project updated.');
            return null;
          }}
        />
      ) : null}

      <Card className="settings-section" ariaLabel="Project metadata" as="section">
        <CardBody>
          <dl className="detail-grid">
            <dt>Created</dt>
            <dd>{formatDateTime(project.createdAt)}</dd>
            <dt>Last updated</dt>
            <dd>{formatDateTime(project.updatedAt)}</dd>
            <dt>Owner</dt>
            <dd>{project.owner || '—'}</dd>
            <dt>Scans</dt>
            <dd>{scans.length}</dd>
          </dl>
        </CardBody>
      </Card>
    </>
  );
}
