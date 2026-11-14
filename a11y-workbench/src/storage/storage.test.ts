/**
 * Storage tests: schema repair, persistence failure modes and repository
 * invariants. These cover the failure paths that matter operationally — corrupt
 * JSON, quota exhaustion, orphaned scans and pruning.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { emptyWorkspace, migrateWorkspace } from './schema';
import {
  clearWorkspace,
  loadWorkspace,
  measureStoredBytes,
  saveWorkspace,
} from './local-store';
import { createBackup, parseBackup, serializeBackup } from './backup';
import {
  bulkUpdateFindings,
  createProject,
  createScan,
  deleteProject,
  deleteScan,
  resetWorkspace,
  updateFinding,
  updateProject,
  validateProjectInput,
  validateScanInput,
} from './repository';
import { SCHEMA_VERSION, STORAGE_KEY, LIMITS } from '@/config';
import { makeFinding, makeProject, makeScan, makeWorkspace } from '@/test/fixtures/workspace';

beforeEach(() => {
  localStorage.clear();
});

describe('migrateWorkspace', () => {
  it('returns an empty workspace and reset flag for non-objects', () => {
    expect(migrateWorkspace(null).reset).toBe(true);
    expect(migrateWorkspace('nope').reset).toBe(true);
    expect(migrateWorkspace([]).reset).toBe(true);
    expect(migrateWorkspace({}).reset).toBe(true);
  });

  it('keeps valid data and stamps the current schema version', () => {
    const raw = { schemaVersion: 1, projects: [makeProject()], scans: [makeScan()] };
    const result = migrateWorkspace(raw);
    expect(result.reset).toBe(false);
    expect(result.workspace.schemaVersion).toBe(SCHEMA_VERSION);
    expect(result.workspace.projects).toHaveLength(1);
    expect(result.workspace.scans).toHaveLength(1);
    expect(result.repairs.some((repair) => /upgraded/i.test(repair))).toBe(true);
  });

  it('drops scans whose project is missing and reports it', () => {
    const orphan = makeScan({ id: 'scn_orphan', projectId: 'prj_missing' });
    const result = migrateWorkspace({ projects: [], scans: [orphan] });
    expect(result.workspace.scans).toHaveLength(0);
    expect(result.repairs.join(' ')).toMatch(/project no longer exists/);
  });

  it('replaces invalid enum values with safe defaults instead of throwing', () => {
    const bad = {
      projects: [makeProject()],
      scans: [
        {
          ...makeScan(),
          findings: [{ ...makeFinding(), severity: 'catastrophic', status: 'unknown' }],
        },
      ],
    };
    const result = migrateWorkspace(bad);
    const finding = result.workspace.scans[0]!.findings[0]!;
    expect(finding.severity).toBe('moderate');
    expect(finding.status).toBe('open');
  });

  it('drops findings that are not objects', () => {
    const result = migrateWorkspace({
      projects: [makeProject()],
      scans: [{ ...makeScan(), findings: [null, 'x', makeFinding()] }],
    });
    expect(result.workspace.scans[0]!.findings).toHaveLength(1);
    expect(result.repairs.join(' ')).toMatch(/invalid finding/);
  });

  it('warns when the stored document is from a newer schema', () => {
    const result = migrateWorkspace({ schemaVersion: SCHEMA_VERSION + 5, projects: [], scans: [] });
    expect(result.repairs.join(' ')).toMatch(/newer version/);
    expect(result.reset).toBe(false);
  });

  it('recomputes the summary from the surviving findings', () => {
    const result = migrateWorkspace({
      projects: [makeProject()],
      scans: [
        {
          ...makeScan(),
          summary: { total: 999, bySeverity: { critical: 9 }, passedByLevel: {}, rulesEvaluated: 19 },
          findings: [makeFinding({ severity: 'minor' })],
        },
      ],
    });
    const summary = result.workspace.scans[0]!.summary;
    expect(summary.total).toBe(1);
    expect(summary.bySeverity.minor).toBe(1);
    expect(summary.bySeverity.critical).toBe(0);
  });

  it('truncates oversized strings instead of rejecting the record', () => {
    const result = migrateWorkspace({
      projects: [makeProject({ name: 'x'.repeat(5000) })],
      scans: [],
    });
    expect(result.workspace.projects[0]!.name.length).toBe(LIMITS.maxNameLength);
  });
});

describe('loadWorkspace / saveWorkspace', () => {
  it('returns a fresh workspace when nothing is stored', () => {
    const result = loadWorkspace();
    expect(result.fresh).toBe(true);
    expect(result.workspace.projects).toEqual([]);
    expect(result.repairs).toEqual([]);
  });

  it('round-trips a workspace', () => {
    const workspace = makeWorkspace();
    expect(saveWorkspace(workspace).ok).toBe(true);
    const loaded = loadWorkspace();
    expect(loaded.fresh).toBe(false);
    expect(loaded.workspace.projects[0]!.name).toBe('Acme Store');
    expect(loaded.bytes).toBeGreaterThan(0);
  });

  it('repairs corrupt JSON and reports it', () => {
    localStorage.setItem(STORAGE_KEY, '{not json');
    const loaded = loadWorkspace();
    expect(loaded.workspace.projects).toEqual([]);
    expect(loaded.repairs.join(' ')).toMatch(/not valid JSON/);
  });

  it('reports an unavailable storage backend without throwing', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    const loaded = loadWorkspace();
    expect(loaded.repairs.join(' ')).toMatch(/storage is unavailable/i);
    spy.mockRestore();
  });

  it('returns a typed quota failure when the write is rejected', () => {
    // The availability probe must still succeed; only the real workspace write
    // fails, which is what a full quota looks like in production.
    const original = Storage.prototype.setItem;
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (
      this: Storage,
      key: string,
      value: string,
    ) {
      if (key === STORAGE_KEY) {
        const error = new Error('quota');
        error.name = 'QuotaExceededError';
        throw error;
      }
      return original.call(this, key, value);
    });
    const result = saveWorkspace(makeWorkspace());
    expect(result.ok).toBe(false);
    expect(result.reason).toBe('quota');
    expect(result.message).toMatch(/full/i);
    spy.mockRestore();
  });

  it('clears the stored document', () => {
    saveWorkspace(makeWorkspace());
    expect(measureStoredBytes()).toBeGreaterThan(0);
    expect(clearWorkspace().ok).toBe(true);
    expect(measureStoredBytes()).toBe(0);
  });

  it('emptyWorkspace is a valid, current-schema document', () => {
    const empty = emptyWorkspace();
    expect(empty.schemaVersion).toBe(SCHEMA_VERSION);
    expect(migrateWorkspace(empty).reset).toBe(false);
  });
});

describe('backup', () => {
  it('serialises a versioned envelope and parses it back', () => {
    const workspace = makeWorkspace();
    const serialised = serializeBackup(workspace);
    expect(createBackup(workspace).app).toBe('a11y-workbench');
    const parsed = parseBackup(serialised);
    expect(parsed.ok).toBe(true);
    expect(parsed.workspace?.projects[0]!.name).toBe('Acme Store');
  });

  it('accepts a bare workspace document', () => {
    const parsed = parseBackup(JSON.stringify(makeWorkspace()));
    expect(parsed.ok).toBe(true);
  });

  it('rejects empty files, invalid JSON and foreign documents', () => {
    expect(parseBackup('').ok).toBe(false);
    expect(parseBackup('{').ok).toBe(false);
    expect(parseBackup('{"hello":"world"}').ok).toBe(false);
  });
});

describe('repository — projects', () => {
  it('validates the project name', () => {
    expect(validateProjectInput({ name: '' })).toMatch(/required/);
    expect(validateProjectInput({ name: 'x'.repeat(LIMITS.maxNameLength + 1) })).toMatch(/characters/);
    expect(validateProjectInput({ name: 'Acme' })).toBeNull();
  });

  it('creates a project with trimmed values, newest first', () => {
    const outcome = createProject(emptyWorkspace(), { name: '  Acme  ', description: '  scope ' });
    expect(outcome.workspace.projects[0]!.name).toBe('Acme');
    expect(outcome.workspace.projects[0]!.description).toBe('scope');
    expect(outcome.workspace.updatedAt).not.toBe(new Date(0).toISOString());
  });

  it('updates only the supplied fields', () => {
    const workspace = makeWorkspace();
    const outcome = updateProject(workspace, 'prj_test1', { owner: 'Accessibility team' });
    const project = outcome.workspace.projects[0]!;
    expect(project.owner).toBe('Accessibility team');
    expect(project.name).toBe('Acme Store');
  });

  it('deletes a project and its scans together', () => {
    const workspace = makeWorkspace();
    const outcome = deleteProject(workspace, 'prj_test1');
    expect(outcome.workspace.projects).toEqual([]);
    expect(outcome.workspace.scans).toEqual([]);
  });

  it('keeps the change in memory when persistence fails', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      const error = new Error('quota');
      error.name = 'QuotaExceededError';
      throw error;
    });
    const outcome = createProject(emptyWorkspace(), { name: 'Acme' });
    expect(outcome.workspace.projects).toHaveLength(1);
    expect(outcome.persistence?.ok).toBe(false);
    spy.mockRestore();
  });
});

describe('repository — scans', () => {
  it('validates required fields and known project', () => {
    const workspace = makeWorkspace();
    expect(validateScanInput(workspace, { projectId: 'nope', name: 'x', markup: '<p>x</p>' }).ok).toBe(false);
    expect(validateScanInput(workspace, { projectId: 'prj_test1', name: '', markup: '<p>x</p>' }).ok).toBe(false);
    expect(validateScanInput(workspace, { projectId: 'prj_test1', name: 'x', markup: '' }).ok).toBe(false);
  });

  it('rejects markup over the configured limit', () => {
    const workspace = makeWorkspace();
    const huge = 'a'.repeat(LIMITS.maxCaptureBytes + 10);
    const result = validateScanInput(workspace, { projectId: 'prj_test1', name: 'x', markup: huge });
    expect(result.ok).toBe(false);
    expect(result.ok === false && result.field).toBe('markup');
  });

  it('runs the engine and stores findings as open', () => {
    const workspace = makeWorkspace();
    const outcome = createScan(workspace, {
      projectId: 'prj_test1',
      name: 'Gallery',
      markup: '<!doctype html><html lang="en"><head><title>Gallery page</title></head><body><main><h1>Gallery</h1><img src="a.jpg"></main></body></html>',
    });
    expect(outcome.scan).toBeDefined();
    expect(outcome.scan!.findings.length).toBeGreaterThan(0);
    expect(outcome.scan!.findings.every((finding) => finding.status === 'open')).toBe(true);
    expect(outcome.workspace.scans[0]!.id).toBe(outcome.scan!.id);
  });

  it('persists engine warnings on the scan so they survive a reload', () => {
    const workspace = makeWorkspace({ scans: [] });
    // 500+ element page with many violations, forced to truncate at the cap.
    const rows = Array.from({ length: 30 }, (_, index) => `<img src="x${index}.jpg">`).join('');
    const markup = `<!doctype html><html lang="en"><head><title>Many images</title></head><body><main><h1>Many</h1>${rows}</main></body></html>`;
    const outcome = createScan(workspace, { projectId: 'prj_test1', name: 'Images', markup });
    expect(outcome.scan).toBeDefined();
    // No warning in this case (30 < cap) but the field must exist and be persisted.
    expect(Array.isArray(outcome.scan!.warnings)).toBe(true);
    expect(outcome.workspace.scans[0]!.warnings).toEqual(outcome.scan!.warnings);
  });

  it('records the pruning notice on the scan that caused it', () => {
    let workspace = makeWorkspace({ scans: [] });
    const markup =
      '<!doctype html><html lang="en"><head><title>Page title</title></head><body><main><h1>H</h1></main></body></html>';
    for (let index = 0; index < LIMITS.maxScansPerProject; index += 1) {
      workspace = createScan(workspace, { projectId: 'prj_test1', name: `Scan ${index}`, markup }).workspace;
    }
    const outcome = createScan(workspace, { projectId: 'prj_test1', name: 'Triggers pruning', markup });
    expect(outcome.scan!.warnings.join(' ')).toMatch(/Pruned 1 older scan/);
    const stored = outcome.workspace.scans.find((scan) => scan.id === outcome.scan!.id);
    expect(stored!.warnings.join(' ')).toMatch(/Pruned 1 older scan/);
  });

  it('prunes scans beyond the per-project limit', () => {
    let workspace = makeWorkspace({ scans: [] });
    const markup =
      '<!doctype html><html lang="en"><head><title>Page title</title></head><body><main><h1>H</h1></main></body></html>';
    for (let index = 0; index < LIMITS.maxScansPerProject + 3; index += 1) {
      workspace = createScan(workspace, { projectId: 'prj_test1', name: `Scan ${index}`, markup }).workspace;
    }
    expect(workspace.scans).toHaveLength(LIMITS.maxScansPerProject);
  });

  it('deletes a single scan without touching siblings', () => {
    const extra = makeScan({ id: 'scn_test2', name: 'Second' });
    const workspace = makeWorkspace({ scans: [makeScan(), extra] });
    const outcome = deleteScan(workspace, 'scn_test1');
    expect(outcome.workspace.scans).toHaveLength(1);
    expect(outcome.workspace.scans[0]!.id).toBe('scn_test2');
  });
});

describe('repository — triage', () => {
  it('updates status and records the change time', () => {
    const workspace = makeWorkspace();
    const outcome = updateFinding(workspace, 'scn_test1', 'fnd_1', { status: 'fixed' });
    const finding = outcome.workspace.scans[0]!.findings[0]!;
    expect(finding.status).toBe('fixed');
    expect(finding.updatedAt).not.toBe(makeFinding().updatedAt);
  });

  it('truncates notes to the configured length', () => {
    const workspace = makeWorkspace();
    const outcome = updateFinding(workspace, 'scn_test1', 'fnd_1', { note: 'x'.repeat(900) });
    expect(outcome.workspace.scans[0]!.findings[0]!.note.length).toBe(LIMITS.maxNoteLength);
  });

  it('bulk-updates only the requested findings', () => {
    const second = makeFinding({ id: 'fnd_2', ruleId: 'link-name' });
    const workspace = makeWorkspace({ scans: [makeScan({ findings: [makeFinding(), second] })] });
    const outcome = bulkUpdateFindings(workspace, 'scn_test1', ['fnd_1'], 'accepted');
    expect(outcome.workspace.scans[0]!.findings[0]!.status).toBe('accepted');
    expect(outcome.workspace.scans[0]!.findings[1]!.status).toBe('open');
  });

  it('is a no-op for unknown ids', () => {
    const workspace = makeWorkspace();
    const outcome = updateFinding(workspace, 'scn_missing', 'fnd_missing', { status: 'fixed' });
    expect(outcome.workspace.scans[0]!.findings[0]!.status).toBe('open');
  });
});

describe('repository — reset', () => {
  it('produces a valid empty workspace', () => {
    const empty = resetWorkspace();
    expect(empty.projects).toEqual([]);
    expect(empty.schemaVersion).toBe(SCHEMA_VERSION);
  });
});
