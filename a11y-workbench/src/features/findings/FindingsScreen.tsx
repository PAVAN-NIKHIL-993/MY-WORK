/**
 * Global findings inbox.
 *
 * One list across every scan, because fix work is organised by issue not by
 * page. Filters (project, severity, status, search) are applied in a single
 * memoised pass; the result count is announced politely so filtering by keyboard
 * gives feedback without moving focus.
 */

import { useMemo, useState } from 'react';
import type { FindingStatus, Severity } from '@/types/domain';
import { FINDING_STATUS_LABEL, SEVERITY_LABEL, SEVERITY_ORDER } from '@/types/domain';
import { paths } from '@/state/router';
import { useWorkspace } from '@/state/workspace-context';
import { searchFindings } from '@/state/selectors';
import { PageHeader, EmptyState } from '@/components/ui/Feedback';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { pluralize } from '@/lib/format';
import { FindingCard } from './FindingCard';

interface Row {
  finding: import('@/types/domain').Finding;
  scanName: string;
  projectName: string;
  scanId: string;
}

export function FindingsScreen(): JSX.Element {
  const { workspace, setFindingStatus, setFindingNote } = useWorkspace();
  const [query, setQuery] = useState('');
  const [projectFilter, setProjectFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState<'all' | Severity>('all');
  const [statusFilter, setStatusFilter] = useState<'open' | 'all' | FindingStatus>('open');
  const [limit, setLimit] = useState(25);

  const rows = useMemo<Row[]>(() => {
    const projectNames = new Map(workspace.projects.map((project) => [project.id, project.name]));
    return workspace.scans.flatMap((scan) =>
      scan.findings.map((finding) => ({
        finding,
        scanId: scan.id,
        scanName: scan.name,
        projectName: projectNames.get(scan.projectId) ?? 'Unknown project',
      })),
    );
  }, [workspace]);

  const filtered = useMemo(() => {
    const base = rows.filter(({ finding, scanId }) => {
      if (projectFilter !== 'all') {
        const projectId = workspace.scans.find((scan) => scan.id === scanId)?.projectId;
        if (projectId !== projectFilter) return false;
      }
      if (severityFilter !== 'all' && finding.severity !== severityFilter) return false;
      if (statusFilter === 'open') {
        if (['fixed', 'accepted', 'ignored'].includes(finding.status)) return false;
      } else if (statusFilter !== 'all' && finding.status !== statusFilter) {
        return false;
      }
      return true;
    });

    const term = query.trim();
    if (term === '') return base;
    const matchingIds = new Set(searchFindings(base.map((row) => row.finding), term).map((finding) => finding.id));
    return base.filter((row) => matchingIds.has(row.finding.id));
  }, [rows, workspace.scans, projectFilter, severityFilter, statusFilter, query]);

  const visible = filtered.slice(0, limit);
  const activeFilters =
    projectFilter !== 'all' || severityFilter !== 'all' || statusFilter !== 'open' || query.trim() !== '';

  return (
    <>
      <PageHeader
        title="Findings"
        description="Every finding from every scan. Triage here, or open a scan to see the page context."
        actions={
          <Button icon="folder" onClick={() => globalThis.location.assign(paths.projects)}>
            Go to projects
          </Button>
        }
      />

      {workspace.scans.length === 0 ? (
        <div className="card">
          <EmptyState
            icon="list-checks"
            title="No findings yet"
            body="Findings appear here after you capture a page and run an audit. Start from a project."
            actions={
              <Button variant="primary" icon="plus" onClick={() => globalThis.location.assign(paths.projects)}>
                Capture a page
              </Button>
            }
          />
        </div>
      ) : (
        <>
          <div className="toolbar" role="search" aria-label="Filter findings">
            <div className="search-field toolbar-field">
              <label htmlFor="finding-search">Search findings</label>
              <Icon name="search" size={15} />
              <input
                id="finding-search"
                className="input"
                type="search"
                value={query}
                placeholder="Rule, message, selector, note"
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>

            <div className="toolbar-field">
              <label htmlFor="filter-project">Project</label>
              <select
                id="filter-project"
                className="select"
                value={projectFilter}
                onChange={(event) => setProjectFilter(event.target.value)}
              >
                <option value="all">All projects</option>
                {workspace.projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="toolbar-field">
              <label htmlFor="filter-severity">Severity</label>
              <select
                id="filter-severity"
                className="select"
                value={severityFilter}
                onChange={(event) => setSeverityFilter(event.target.value as 'all' | Severity)}
              >
                <option value="all">All severities</option>
                {SEVERITY_ORDER.map((severity) => (
                  <option key={severity} value={severity}>
                    {SEVERITY_LABEL[severity]}
                  </option>
                ))}
              </select>
            </div>

            <div className="toolbar-field">
              <label htmlFor="filter-status">Status</label>
              <select
                id="filter-status"
                className="select"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}
              >
                <option value="open">Needs work</option>
                <option value="all">All statuses</option>
                {(['in_progress', 'fixed', 'accepted', 'ignored'] as FindingStatus[]).map((status) => (
                  <option key={status} value={status}>
                    {FINDING_STATUS_LABEL[status]}
                  </option>
                ))}
              </select>
            </div>

            {activeFilters ? (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setQuery('');
                  setProjectFilter('all');
                  setSeverityFilter('all');
                  setStatusFilter('open');
                }}
              >
                Reset filters
              </Button>
            ) : null}
          </div>

          <p className="text-xs text-muted" role="status" aria-live="polite" style={{ marginBottom: 'var(--space-3)' }}>
            {pluralize(filtered.length, 'finding')} match the current filters
            {filtered.length > visible.length ? ` — showing the first ${visible.length}` : ''}.
          </p>

          {filtered.length === 0 ? (
            <div className="card">
              <EmptyState
                icon="check-circle"
                title={activeFilters ? 'No findings match these filters' : 'Nothing needs work'}
                body={
                  activeFilters
                    ? 'Broaden the filters to see more findings, or clear them to return to the default view.'
                    : 'Every finding has been triaged. Re-run a scan after fixes to confirm.'
                }
                actions={
                  activeFilters ? (
                    <Button
                      onClick={() => {
                        setQuery('');
                        setProjectFilter('all');
                        setSeverityFilter('all');
                        setStatusFilter('open');
                      }}
                    >
                      Reset filters
                    </Button>
                  ) : null
                }
              />
            </div>
          ) : (
            <>
              <div className="card card--flush">
                <ul className="finding-list">
                  {visible.map((row) => (
                    <FindingCard
                      key={row.finding.id}
                      finding={row.finding}
                      onStatusChange={(status) => setFindingStatus(row.scanId, row.finding.id, status)}
                      onNoteChange={(note) => setFindingNote(row.scanId, row.finding.id, note)}
                    />
                  ))}
                </ul>
              </div>

              <div className="row" style={{ marginTop: 'var(--space-4)', justifyContent: 'center' }}>
                {filtered.length > visible.length ? (
                  <Button onClick={() => setLimit((current) => current + 25)}>
                    Show {Math.min(25, filtered.length - visible.length)} more
                  </Button>
                ) : null}
              </div>

              <p className="text-xs text-muted" style={{ marginTop: 'var(--space-3)' }}>
                Tip: open a finding’s source scan for page-level context —{' '}
                <a href={paths.scan(visible[0]!.scanId)}>view the first scan in this list</a>.
              </p>
            </>
          )}
        </>
      )}
    </>
  );
}
