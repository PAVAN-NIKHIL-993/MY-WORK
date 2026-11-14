/**
 * Projects list.
 *
 * One card per project with the numbers that matter (open findings, last scan)
 * and a single primary action. Search is client-side over the already-loaded
 * workspace, so it is instant and works offline.
 */

import { useMemo, useState } from 'react';
import { paths } from '@/state/router';
import { useWorkspace } from '@/state/workspace-context';
import { countBySeverity, openFindings, projectScans } from '@/state/selectors';
import { PageHeader, EmptyState } from '@/components/ui/Feedback';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Badge, SeverityBadge } from '@/components/ui/Badge';
import { formatDateTime, pluralize } from '@/lib/format';
import { ProjectFormDialog } from './ProjectFormDialog';

export function ProjectsScreen(): JSX.Element {
  const { workspace, addProject, notify } = useWorkspace();
  const [creating, setCreating] = useState(false);
  const [query, setQuery] = useState('');

  const rows = useMemo(() => {
    const term = query.trim().toLowerCase();
    return workspace.projects
      .filter((project) =>
        term === ''
          ? true
          : `${project.name} ${project.description} ${project.owner}`.toLowerCase().includes(term),
      )
      .map((project) => {
        const scans = projectScans(workspace, project.id);
        const open = openFindings(scans.flatMap((scan) => scan.findings));
        return {
          project,
          scanCount: scans.length,
          openCount: open.length,
          severity: countBySeverity(open),
          latest: scans[0],
        };
      });
  }, [workspace, query]);

  return (
    <>
      <PageHeader
        title="Projects"
        description="Group the pages of one product or site. Each project holds its scans, findings and accessibility report."
        actions={
          <Button variant="primary" icon="plus" onClick={() => setCreating(true)}>
            New project
          </Button>
        }
      />

      {workspace.projects.length > 0 ? (
        <div className="toolbar" role="search">
          <div className="search-field toolbar-field">
            <label htmlFor="project-search">Search projects</label>
            <Icon name="search" size={15} />
            <input
              id="project-search"
              className="input"
              type="search"
              placeholder="Name, scope or owner"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <p className="text-xs text-muted" role="status" aria-live="polite" style={{ marginLeft: 'auto' }}>
            {pluralize(rows.length, 'project')}
            {query.trim() ? ` matching “${query.trim()}”` : ''}
          </p>
        </div>
      ) : null}

      {workspace.projects.length === 0 ? (
        <div className="card">
          <EmptyState
            icon="folder"
            title="No projects yet"
            body="Create a project for the product you are auditing. You can then capture pages and run audits against them."
            actions={
              <Button variant="primary" icon="plus" onClick={() => setCreating(true)}>
                Create your first project
              </Button>
            }
          />
        </div>
      ) : rows.length === 0 ? (
        <div className="card">
          <EmptyState
            icon="search"
            title="No matching projects"
            body={`Nothing matches “${query.trim()}”. Try a different name, scope or owner.`}
            actions={<Button onClick={() => setQuery('')}>Clear search</Button>}
          />
        </div>
      ) : (
        <div className="project-grid">
          {rows.map(({ project, scanCount, openCount, severity, latest }) => (
            <a key={project.id} className="project-card" href={paths.project(project.id)}>
              <div className="project-card-top">
                <span className="project-card-name">{project.name}</span>
                {openCount === 0 ? (
                  <Badge tone={scanCount > 0 ? 'success' : 'neutral'}>
                    {scanCount > 0 ? 'No open findings' : 'No scans'}
                  </Badge>
                ) : (
                  <Badge tone="critical" withDot>
                    {openCount} open
                  </Badge>
                )}
              </div>

              {project.description ? (
                <p className="project-card-desc">{project.description}</p>
              ) : (
                <p className="project-card-desc text-muted">No scope described.</p>
              )}

              {openCount > 0 ? (
                <span className="badge-group">
                  {severity.critical > 0 ? <SeverityBadge severity="critical" /> : null}
                  {severity.serious > 0 ? <SeverityBadge severity="serious" /> : null}
                  {severity.moderate > 0 ? <SeverityBadge severity="moderate" /> : null}
                  {severity.minor > 0 ? <SeverityBadge severity="minor" /> : null}
                </span>
              ) : null}

              <div className="project-card-stats">
                <span className="project-card-stat">
                  <strong>{scanCount}</strong>
                  {scanCount === 1 ? 'scan' : 'scans'}
                </span>
                <span className="project-card-stat">
                  <strong>{openCount}</strong>
                  open
                </span>
                <span className="project-card-stat" style={{ marginLeft: 'auto', textAlign: 'right' }}>
                  <strong className="text-xs" style={{ fontWeight: 500 }}>
                    {latest ? formatDateTime(latest.createdAt) : '—'}
                  </strong>
                  last scan
                </span>
              </div>
            </a>
          ))}
        </div>
      )}

      {creating ? (
        <ProjectFormDialog
          onClose={() => setCreating(false)}
          onSubmit={(values) => {
            const outcome = addProject(values);
            // A persistence failure is reported once by the app-wide banner (it
            // stays until a write succeeds), so the dialog closes and the work
            // stays on screen instead of restating the same error twice.
            if (outcome.persistence && !outcome.persistence.ok) {
              notify('warning', `Project “${values.name}” is not saved yet — see the banner for details.`);
              return null;
            }
            notify('success', `Project “${values.name}” created.`);
            return null;
          }}
        />
      ) : null}
    </>
  );
}
