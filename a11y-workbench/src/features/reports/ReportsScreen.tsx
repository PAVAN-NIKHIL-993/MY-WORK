/**
 * Reports index: one row per project with readiness signals.
 *
 * A report is only meaningful when a project has at least one scan, so projects
 * without scans are listed separately rather than showing an empty report.
 */

import { useMemo } from 'react';
import { paths } from '@/state/router';
import { useWorkspace } from '@/state/workspace-context';
import { countBySeverity, isResolved, projectScans } from '@/state/selectors';
import { PageHeader, EmptyState } from '@/components/ui/Feedback';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatDateTime, percent, pluralize } from '@/lib/format';

export function ReportsScreen(): JSX.Element {
  const { workspace } = useWorkspace();

  const rows = useMemo(
    () =>
      workspace.projects.map((project) => {
        const scans = projectScans(workspace, project.id);
        const findings = scans.flatMap((scan) => scan.findings);
        const resolved = findings.filter(isResolved).length;
        return {
          project,
          scans,
          findings: findings.length,
          resolved,
          percentResolved: percent(resolved, findings.length),
          severity: countBySeverity(findings.filter((finding) => !isResolved(finding))),
          latest: scans[0],
        };
      }),
    [workspace],
  );

  const ready = rows.filter((row) => row.scans.length > 0);
  const pending = rows.filter((row) => row.scans.length === 0);

  return (
    <>
      <PageHeader
        title="Reports"
        description="VPAT-style accessibility reports generated from the latest captures of each project. Export as a printable document, Markdown or CSV."
        actions={
          <Button icon="folder" onClick={() => globalThis.location.assign(paths.projects)}>
            Manage projects
          </Button>
        }
      />

      {workspace.projects.length === 0 ? (
        <div className="card">
          <EmptyState
            icon="file-text"
            title="No projects to report on"
            body="Create a project and capture at least one page. Reports are generated from captured scans, so there is nothing to summarise yet."
            actions={
              <Button variant="primary" icon="plus" onClick={() => globalThis.location.assign(paths.projects)}>
                Create a project
              </Button>
            }
          />
        </div>
      ) : (
        <>
          {ready.length > 0 ? (
            <div className="card card--flush" style={{ marginBottom: 'var(--space-5)' }}>
              <div className="table-wrap">
                <table className="table">
                  <caption>Projects with captured scans — open one to generate its report.</caption>
                  <thead>
                    <tr>
                      <th scope="col">Project</th>
                      <th scope="col">Scans</th>
                      <th scope="col">Findings</th>
                      <th scope="col">Resolved</th>
                      <th scope="col">Open by severity</th>
                      <th scope="col">Last capture</th>
                      <th scope="col"><span className="visually-hidden">Actions</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {ready.map((row) => (
                      <tr key={row.project.id}>
                        <td className="cell-primary">
                          <a href={paths.report(row.project.id)}>{row.project.name}</a>
                          {row.project.owner ? (
                            <span className="text-xs text-muted" style={{ display: 'block' }}>
                              {row.project.owner}
                            </span>
                          ) : null}
                        </td>
                        <td className="cell-nowrap">{row.scans.length}</td>
                        <td className="cell-nowrap">{row.findings}</td>
                        <td className="cell-nowrap">{row.percentResolved}%</td>
                        <td>
                          <span className="badge-group">
                            {row.severity.critical > 0 ? <Badge tone="critical">{row.severity.critical} critical</Badge> : null}
                            {row.severity.serious > 0 ? <Badge tone="serious">{row.severity.serious} serious</Badge> : null}
                            {row.severity.moderate > 0 ? <Badge tone="moderate">{row.severity.moderate} moderate</Badge> : null}
                            {row.severity.minor > 0 ? <Badge tone="minor">{row.severity.minor} minor</Badge> : null}
                            {row.severity.total === 0 ? <Badge tone="success">No open findings</Badge> : null}
                          </span>
                        </td>
                        <td className="cell-nowrap text-xs">{row.latest ? formatDateTime(row.latest.createdAt) : '—'}</td>
                        <td className="cell-nowrap">
                          <Button size="sm" onClick={() => globalThis.location.assign(paths.report(row.project.id))}>
                            Open report
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}

          {pending.length > 0 ? (
            <div className="card">
              <div className="card-header">
                <div>
                  <h2 className="card-title">Awaiting a first capture</h2>
                  <p className="card-subtitle">
                    {pluralize(pending.length, 'project')} without scans cannot produce a report yet.
                  </p>
                </div>
              </div>
              <ul className="scan-list">
                {pending.map((row) => (
                  <li key={row.project.id}>
                    <a className="scan-row" href={paths.project(row.project.id)}>
                      <span className="scan-row-main">
                        <span className="scan-row-name">{row.project.name}</span>
                        <span className="scan-row-meta">Capture a page to generate this report</span>
                      </span>
                      <Badge>No scans</Badge>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </>
      )}
    </>
  );
}
