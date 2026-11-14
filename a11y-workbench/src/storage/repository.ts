/**
 * Workspace repository: the single write path for all persisted data.
 *
 * Components never mutate the workspace object. They call a repository function
 * with the current state and a mutation, and receive the next state plus an
 * optional persistence error. That keeps invariants (unique ids, pruned scans,
 * updated timestamps) in one place and makes every operation testable without a
 * React renderer.
 */

import type { Finding, FindingStatus, Project, Scan, Workspace } from '@/types/domain';
import { ENGINE_VERSION, runAudit } from '@/engine/audit';
import { LIMITS, ROUTES, SCHEMA_VERSION } from '@/config';
import { createId } from '@/lib/id';
import { byteLength, truncate } from '@/lib/format';
import { saveWorkspace, type SaveResult } from './local-store';

export interface MutationOutcome {
  workspace: Workspace;
  /** Set when the in-memory change succeeded but persistence failed. */
  persistence?: SaveResult;
}

const now = (): string => new Date().toISOString();

function touch(workspace: Workspace): Workspace {
  return { ...workspace, updatedAt: now() };
}

/** Persists and returns the outcome, keeping the change even if saving fails. */
function commit(workspace: Workspace): MutationOutcome {
  const persistence = saveWorkspace(workspace);
  return persistence.ok ? { workspace } : { workspace, persistence };
}

export interface CreateProjectInput {
  name: string;
  description?: string;
  owner?: string;
}

/** Validation shared by the UI and the repository so rules cannot diverge. */
export function validateProjectInput(input: CreateProjectInput): string | null {
  const name = input.name.trim();
  if (name === '') return 'Project name is required.';
  if (name.length > LIMITS.maxNameLength) return `Project name must be ${LIMITS.maxNameLength} characters or fewer.`;
  return null;
}

export function createProject(workspace: Workspace, input: CreateProjectInput): MutationOutcome {
  const timestamp = now();
  const project: Project = {
    id: createId('prj'),
    name: input.name.trim().slice(0, LIMITS.maxNameLength),
    description: (input.description ?? '').trim().slice(0, 1000),
    owner: (input.owner ?? '').trim().slice(0, 120),
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  const projects = [project, ...workspace.projects].slice(0, LIMITS.maxProjects);
  return commit(touch({ ...workspace, projects }));
}

export function updateProject(
  workspace: Workspace,
  projectId: string,
  patch: Partial<Pick<Project, 'name' | 'description' | 'owner'>>,
): MutationOutcome {
  const projects = workspace.projects.map((project) =>
    project.id === projectId
      ? {
          ...project,
          ...(patch.name !== undefined ? { name: patch.name.trim().slice(0, LIMITS.maxNameLength) } : {}),
          ...(patch.description !== undefined ? { description: patch.description.trim().slice(0, 1000) } : {}),
          ...(patch.owner !== undefined ? { owner: patch.owner.trim().slice(0, 120) } : {}),
          updatedAt: now(),
        }
      : project,
  );
  return commit(touch({ ...workspace, projects }));
}

/** Deletes a project and every scan belonging to it. */
export function deleteProject(workspace: Workspace, projectId: string): MutationOutcome {
  return commit(
    touch({
      ...workspace,
      projects: workspace.projects.filter((project) => project.id !== projectId),
      scans: workspace.scans.filter((scan) => scan.projectId !== projectId),
    }),
  );
}

export interface CreateScanInput {
  projectId: string;
  name: string;
  url?: string;
  template?: string;
  markup: string;
}

export type ScanValidation =
  | { ok: true }
  | { ok: false; field?: 'name' | 'markup' | 'url' | 'project'; message: string };

export function validateScanInput(workspace: Workspace, input: CreateScanInput): ScanValidation {
  if (!workspace.projects.some((project) => project.id === input.projectId)) {
    return { ok: false, field: 'project', message: 'Select a project before saving a scan.' };
  }
  if (input.name.trim() === '') return { ok: false, field: 'name', message: 'Scan name is required.' };
  if (input.name.length > LIMITS.maxNameLength) {
    return { ok: false, field: 'name', message: `Scan name must be ${LIMITS.maxNameLength} characters or fewer.` };
  }
  if ((input.url ?? '').length > LIMITS.maxUrlLength) {
    return { ok: false, field: 'url', message: `URL must be ${LIMITS.maxUrlLength} characters or fewer.` };
  }
  if (input.markup.trim() === '') {
    return { ok: false, field: 'markup', message: 'Paste the page markup to audit.' };
  }
  const bytes = byteLength(input.markup);
  if (bytes > LIMITS.maxCaptureBytes) {
    return {
      ok: false,
      field: 'markup',
      message: `Markup is ${(bytes / 1024).toFixed(0)} KB; the limit is ${Math.round(LIMITS.maxCaptureBytes / 1024)} KB. Trim the capture or raise VITE_MAX_CAPTURE_KB.`,
    };
  }
  return { ok: true };
}

/**
 * Runs the engine on captured markup and stores the scan.
 *
 * A scan is only created when the input is valid; findings are copied into
 * `Finding` records with `status: 'open'`, so later triage never mutates engine
 * output (evidence stays reproducible).
 */
export function createScan(workspace: Workspace, input: CreateScanInput): MutationOutcome & { scan?: Scan; warnings?: string[] } {
  const validation = validateScanInput(workspace, input);
  if (!validation.ok) return { workspace, warnings: [validation.message] };

  const result = runAudit(input.markup);
  const scanId = createId('scn');
  const timestamp = now();

  const findings: Finding[] = result.findings.map((finding, index) => ({
    ...finding,
    id: `${scanId}_f${index}`,
    scanId,
    status: 'open',
    note: '',
    updatedAt: timestamp,
  }));

  const scan: Scan = {
    id: scanId,
    projectId: input.projectId,
    name: input.name.trim().slice(0, LIMITS.maxNameLength),
    url: (input.url ?? '').trim().slice(0, LIMITS.maxUrlLength),
    template: (input.template ?? '').trim().slice(0, 120),
    markup: input.markup,
    engineVersion: result.engineVersion || ENGINE_VERSION,
    createdAt: timestamp,
    summary: { ...result.summary, total: findings.length },
    findings,
    warnings: result.warnings,
  };

  // Prune oldest scans per project before storing the new one.
  const projectScans = [scan, ...workspace.scans.filter((item) => item.projectId === input.projectId)];
  const kept = projectScans.slice(0, LIMITS.maxScansPerProject);
  const pruned = projectScans.length - kept.length;
  const otherScans = workspace.scans.filter((item) => item.projectId !== input.projectId);

  const warnings = [...result.warnings];
  if (pruned > 0) {
    warnings.push(`Pruned ${pruned} older scan(s); each project keeps the latest ${LIMITS.maxScansPerProject}.`);
  }
  // Persist every warning on the scan: a toast is lost on reload, but a review of
  // an incomplete result must remain visible.
  scan.warnings = warnings;

  const outcome = commit(touch({ ...workspace, scans: [...kept, ...otherScans] }));
  return { ...outcome, scan, warnings };
}

export function deleteScan(workspace: Workspace, scanId: string): MutationOutcome {
  return commit(touch({ ...workspace, scans: workspace.scans.filter((scan) => scan.id !== scanId) }));
}

/** Updates triage state for one finding, with an audit note. */
export function updateFinding(
  workspace: Workspace,
  scanId: string,
  findingId: string,
  patch: { status?: FindingStatus; note?: string },
): MutationOutcome {
  const scans = workspace.scans.map((scan) => {
    if (scan.id !== scanId) return scan;
    const findings = scan.findings.map((finding) =>
      finding.id === findingId
        ? {
            ...finding,
            ...(patch.status ? { status: patch.status } : {}),
            ...(patch.note !== undefined ? { note: patch.note.trim().slice(0, LIMITS.maxNoteLength) } : {}),
            updatedAt: now(),
          }
        : finding,
    );
    return { ...scan, findings };
  });
  return commit(touch({ ...workspace, scans }));
}

/** Bulk triage used by "mark all visible as fixed". */
export function bulkUpdateFindings(
  workspace: Workspace,
  scanId: string,
  findingIds: readonly string[],
  status: FindingStatus,
): MutationOutcome {
  const target = new Set(findingIds);
  const scans = workspace.scans.map((scan) => {
    if (scan.id !== scanId) return scan;
    const timestamp = now();
    return {
      ...scan,
      findings: scan.findings.map((finding) =>
        target.has(finding.id) ? { ...finding, status, updatedAt: timestamp } : finding,
      ),
    };
  });
  return commit(touch({ ...workspace, scans }));
}

/** Replaces the whole workspace (restore from backup). */
export function replaceWorkspace(workspace: Workspace): MutationOutcome {
  return commit(touch(workspace));
}

/** Deletes everything. Caller is responsible for confirmation. */
export function resetWorkspace(): Workspace {
  return { schemaVersion: SCHEMA_VERSION, projects: [], scans: [], updatedAt: now() };
}

/** Route for a project's scan list — centralised so links never drift. */
export function projectPath(projectId: string): string {
  return `${ROUTES.projects}/${projectId}`;
}

/** Short evidence label used in exports and tables. */
export function evidenceLabel(finding: Finding): string {
  return truncate(finding.selector || finding.snippet, 120);
}
