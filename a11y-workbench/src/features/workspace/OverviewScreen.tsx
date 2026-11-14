/**
 * Overview screen — the workspace home.
 *
 * Answers three questions in order of importance:
 *  1. What still needs work? (open findings by severity, resolution progress)
 *  2. Where is it? (per-project breakdown, newest scans)
 *  3. What do I do next? (onboarding steps when the workspace is empty/dormant)
 */

import { useMemo } from 'react';
import { paths } from '@/state/router';
import { useWorkspace } from '@/state/workspace-context';
import {
  aggregateByRule,
  allFindings,
  countBySeverity,
  latestScanByProject,
  openFindings,
  projectScans,
  workspaceStats,
} from '@/state/selectors';
import { SEVERITY_ORDER, SEVERITY_LABEL } from '@/types/domain';
import { PageHeader, EmptyState } from '@/components/ui/Feedback';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge, SeverityBadge } from '@/components/ui/Badge';
import { Icon } from '@/components/ui/Icon';
import { formatDateTime, pluralize } from '@/lib/format';
import { SeverityBar } from './SeverityBar';

export function OverviewScreen(): JSX.Element {
  const { workspace } = useWorkspace();
  const stats = useMemo(() => workspaceStats(workspace), [workspace]);
  const findings = useMemo(() => allFindings(workspace), [workspace]);
  const open = useMemo(() => openFindings(findings), [findings]);
  const severity = useMemo(() => countBySeverity(open), [open]);
  const topRules = useMemo(() => aggregateByRule(findings).slice(0, 5), [findings]);
  const latest = useMemo(() => latestScanByProject(workspace), [workspace]);
  const projectRows = useMemo(
    () =>
      workspace.projects.slice(0, 6).map((project) => {
        const scans = projectScans(workspace, project.id);
        const projectFindings = scans.flatMap((scan) => scan.findings);
        const openCount = projectFindings.filter(
          (finding) => !['fixed', 'accepted', 'ignored'].includes(finding.status),
        ).length;
        return { project, scans, openCount, latest: latest.get(project.id) };
      }),
    [workspace, latest],
  );

  const isBrandNew = stats.projects === 0;

  return (
    <>
      <PageHeader
        eyebrow="Workspace"
        title={isBrandNew ? 'Start your first accessibility audit' : 'Audit overview'}
        description={
          isBrandNew
            ? 'Create a project for the product you are auditing, then capture a page and run the audit. Everything stays in this browser.'
            : `${pluralize(stats.projects, 'project')} · ${pluralize(stats.scans, 'scan')} · ${pluralize(stats.open, 'open finding')}`
        }
        actions={
          <>
            <Button icon="folder" onClick={() => globalThis.location.assign(paths.projects)}>
              All projects
            </Button>
            <Button variant="primary" icon="plus" onClick={() => globalThis.location.assign(paths.projects)}>
              New project
            </Button>
          </>
        }
      />

      {isBrandNew ? <Onboarding /> : null}

      <div className="stat-grid" style={{ marginBottom: 'var(--space-5)' }}>
        <Stat label="Open findings" value={stats.open} meta={`${pluralize(stats.resolved, 'resolved finding')}`} tone="critical" />
        <Stat label="Critical" value={severity.critical} meta="Blocks task completion" />
        <Stat label="Serious" value={severity.serious} meta="Major barrier for AT users" />
        <Stat label="Resolution" value={`${stats.resolutionPercent}%`} meta={`${stats.resolved} of ${stats.findings} findings`} tone="accent" />
      </div>

      <div style={{ display: 'grid', gap: 'var(--space-5)' }}>
        {stats.findings > 0 ? (
          <Card ariaLabelledBy="overview-severity-heading">
            <CardHeader
              title="Open findings by severity"
              titleId="overview-severity-heading"
              subtitle="Resolved findings are excluded; see Findings for full triage."
            />
            <CardBody>
              <SeverityBar counts={severity} />
              <div className="legend" style={{ marginTop: 'var(--space-3)' }}>
                {SEVERITY_ORDER.map((level) => (
                  <span className="legend-item" key={level}>
                    <span className={`legend-swatch severity-bar-segment--${level}`} aria-hidden="true" />
                    {SEVERITY_LABEL[level]} · {severity[level]}
                  </span>
                ))}
              </div>
            </CardBody>
          </Card>
        ) : null}

        <div style={{ display: 'grid', gap: 'var(--space-5)', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
          <Card flush ariaLabelledBy="overview-projects-heading">
            <CardHeader
              title="Projects"
              titleId="overview-projects-heading"
              subtitle={stats.projects === 0 ? 'No projects yet' : `${stats.auditedProjects} audited · ${stats.unauditedProjects} awaiting first scan`}
              actions={
                <Button size="sm" onClick={() => globalThis.location.assign(paths.projects)}>
                  Manage
                </Button>
              }
            />
            {projectRows.length === 0 ? (
              <EmptyState
                icon="folder"
                title="No projects yet"
                body="Projects group the pages of one product, so findings and reports stay scoped to the right thing."
                actions={<Button variant="primary" icon="plus" onClick={() => globalThis.location.assign(paths.projects)}>Create a project</Button>}
              />
            ) : (
              <ul className="scan-list">
                {projectRows.map(({ project, openCount, latest: latestScan }) => (
                  <li key={project.id}>
                    <a className="scan-row" href={paths.project(project.id)}>
                      <span className="scan-row-main">
                        <span className="scan-row-name">{project.name}</span>
                        <span className="scan-row-meta">
                          {latestScan ? (
                            <>
                              <span>Last scan {formatDateTime(latestScan.createdAt)}</span>
                              <span aria-hidden="true">·</span>
                              <span>{pluralize(openCount, 'open finding')}</span>
                            </>
                          ) : (
                            <span>Not yet scanned</span>
                          )}
                        </span>
                      </span>
                      {openCount > 0 ? (
                        <Badge tone="critical">{openCount}</Badge>
                      ) : latestScan ? (
                        <Badge tone="success">Clear</Badge>
                      ) : (
                        <Badge>New</Badge>
                      )}
                      <Icon name="chevron-right" size={16} />
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card flush ariaLabelledBy="overview-rules-heading">
            <CardHeader
              title="Most frequent failures"
              titleId="overview-rules-heading"
              subtitle="Across all scans, including resolved findings."
            />
            {topRules.length === 0 ? (
              <EmptyState
                icon="list-checks"
                title="Nothing captured yet"
                body="Run a scan to see which rules fail most often across your projects."
              />
            ) : (
              <div className="table-wrap">
                <table className="table">
                  <caption className="visually-hidden">Rules with the most findings</caption>
                  <thead>
                    <tr>
                      <th scope="col">Rule</th>
                      <th scope="col">Severity</th>
                      <th scope="col">Occurrences</th>
                      <th scope="col">Open</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topRules.map((rule) => (
                      <tr key={rule.ruleId}>
                        <td className="cell-primary">{rule.ruleName}</td>
                        <td>
                          <SeverityBadge severity={rule.severity} />
                        </td>
                        <td>{rule.occurrences}</td>
                        <td>{rule.openOccurrences}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        {stats.latestActivity ? (
          <p className="text-xs text-muted">Last capture {formatDateTime(stats.latestActivity)}.</p>
        ) : null}
      </div>
    </>
  );
}

function Stat({
  label,
  value,
  meta,
  tone,
}: {
  label: string;
  value: number | string;
  meta: string;
  tone?: 'critical' | 'accent';
}): JSX.Element {
  const toneClass = tone ? `stat--${tone}` : '';
  return (
    <div className={`stat ${toneClass}`.trim()}>
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value}</span>
      <span className="stat-meta">{meta}</span>
    </div>
  );
}

function Onboarding(): JSX.Element {
  return (
    <Card className="settings-section" ariaLabel="Getting started">
      <CardBody>
        <ol className="steps">
          <li className="step">
            <span className="step-index">1</span>
            <p className="step-title">Create a project</p>
            <p className="step-body">
              Name the product or site you are auditing. One project per product keeps findings and
              reports focused on a single scope.
            </p>
          </li>
          <li className="step">
            <span className="step-index">2</span>
            <p className="step-title">Capture a page</p>
            <p className="step-body">
              Paste the rendered HTML (browser View Source, or a server-rendered template) or load
              one of the built-in samples to try the workflow.
            </p>
          </li>
          <li className="step">
            <span className="step-index">3</span>
            <p className="step-title">Triage the findings</p>
            <p className="step-body">
              Mark each finding fixed, accepted or not applicable and add a note, so the audit trail
              survives handover.
            </p>
          </li>
          <li className="step">
            <span className="step-index">4</span>
            <p className="step-title">Publish the report</p>
            <p className="step-body">
              Export a VPAT-style HTML document, Markdown or CSV for the defect tracker and the
              accessibility statement.
            </p>
          </li>
        </ol>
      </CardBody>
    </Card>
  );
}
