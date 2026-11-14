/**
 * Runtime validation and normalisation of persisted data.
 *
 * `localStorage` is untrusted input: it may be edited by the user, written by an
 * older build, or truncated by a quota error. Everything read from it passes
 * through `migrateWorkspace`, which validates shapes, replaces invalid values
 * with safe defaults and reports what it repaired.
 *
 * Design rule: **never throw on bad data.** A corrupt workspace must degrade to
 * a partially usable one, with a warning the UI surface, rather than a white
 * screen.
 */

import type {
  EngineFinding,
  Finding,
  FindingStatus,
  Project,
  Scan,
  ScanSummary,
  Severity,
  Workspace,
  WcagLevel,
} from '@/types/domain';
import { SCHEMA_VERSION, LIMITS } from '@/config';

export interface MigrationResult {
  workspace: Workspace;
  /** Human-readable repairs applied, surfaced in the UI as a warning. */
  repairs: string[];
  /** True when the stored document could not be used at all. */
  reset: boolean;
}

export function emptyWorkspace(): Workspace {
  return { schemaVersion: SCHEMA_VERSION, projects: [], scans: [], updatedAt: new Date(0).toISOString() };
}

const SEVERITIES: readonly Severity[] = ['critical', 'serious', 'moderate', 'minor'];
const LEVELS: readonly WcagLevel[] = ['A', 'AA', 'AAA'];
const STATUSES: readonly FindingStatus[] = ['open', 'in_progress', 'fixed', 'accepted', 'ignored'];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function str(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function boundedStr(value: unknown, max: number, fallback = ''): string {
  return str(value, fallback).slice(0, max);
}

function iso(value: unknown, fallback: string): string {
  const raw = str(value, '');
  if (raw === '') return fallback;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? fallback : date.toISOString();
}

function pick<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value) ? (value as T) : fallback;
}

function normalizeSummary(value: unknown, findings: Finding[]): ScanSummary {
  const counts: Record<Severity, number> = { critical: 0, serious: 0, moderate: 0, minor: 0 };
  for (const finding of findings) counts[finding.severity] += 1;

  const passedByLevel: Record<WcagLevel, number> = { A: 0, AA: 0, AAA: 0 };
  if (isRecord(value) && isRecord(value.passedByLevel)) {
    for (const level of LEVELS) {
      const count = Number(value.passedByLevel[level]);
      passedByLevel[level] = Number.isFinite(count) && count >= 0 ? Math.floor(count) : 0;
    }
  }

  return {
    total: findings.length,
    bySeverity: counts,
    passedByLevel,
    rulesEvaluated:
      isRecord(value) && Number.isFinite(Number(value.rulesEvaluated)) && Number(value.rulesEvaluated) >= 0
        ? Math.floor(Number(value.rulesEvaluated))
        : 0,
  };
}

function normalizeFinding(value: unknown, scanId: string, index: number): Finding | null {
  if (!isRecord(value)) return null;
  const ruleId = boundedStr(value.ruleId, 80);
  if (ruleId === '') return null;

  return {
    id: boundedStr(value.id, 80) || `${scanId}_f${index}`,
    scanId,
    ruleId,
    ruleName: boundedStr(value.ruleName, 120, ruleId),
    severity: pick(value.severity, SEVERITIES, 'moderate'),
    wcagLevel: pick(value.wcagLevel, LEVELS, 'A'),
    successCriteria: Array.isArray(value.successCriteria)
      ? value.successCriteria.filter((item): item is string => typeof item === 'string').slice(0, 6)
      : [],
    message: boundedStr(value.message, 500),
    remediation: boundedStr(value.remediation, 800),
    selector: boundedStr(value.selector, 300),
    snippet: boundedStr(value.snippet, 400),
    ...(typeof value.detail === 'string' ? { detail: boundedStr(value.detail, 300) } : {}),
    status: pick(value.status, STATUSES, 'open'),
    note: boundedStr(value.note, LIMITS.maxNoteLength),
    updatedAt: iso(value.updatedAt, new Date(0).toISOString()),
  };
}

function normalizeScan(value: unknown, repairs: string[]): Scan | null {
  if (!isRecord(value)) return null;
  const id = boundedStr(value.id, 80);
  const projectId = boundedStr(value.projectId, 80);
  if (id === '' || projectId === '') return null;

  const rawFindings = Array.isArray(value.findings) ? value.findings : [];
  const findings: Finding[] = [];
  rawFindings.forEach((raw, index) => {
    const finding = normalizeFinding(raw, id, index);
    if (finding) findings.push(finding);
  });
  if (findings.length !== rawFindings.length) {
    repairs.push(`Dropped ${rawFindings.length - findings.length} invalid finding(s) in scan “${boundedStr(value.name, 120, id)}”.`);
  }

  return {
    id,
    projectId,
    name: boundedStr(value.name, LIMITS.maxNameLength, 'Untitled scan'),
    url: boundedStr(value.url, LIMITS.maxUrlLength),
    template: boundedStr(value.template, 120),
    markup: boundedStr(value.markup, LIMITS.maxCaptureBytes),
    engineVersion: boundedStr(value.engineVersion, 32, 'unknown'),
    createdAt: iso(value.createdAt, new Date(0).toISOString()),
    summary: normalizeSummary(value.summary, findings),
    findings,
    warnings: Array.isArray(value.warnings)
      ? value.warnings.filter((item): item is string => typeof item === 'string').slice(0, 20)
      : [],
  };
}

function normalizeProject(value: unknown): Project | null {
  if (!isRecord(value)) return null;
  const id = boundedStr(value.id, 80);
  if (id === '') return null;
  const now = new Date(0).toISOString();
  return {
    id,
    name: boundedStr(value.name, LIMITS.maxNameLength, 'Untitled project'),
    description: boundedStr(value.description, 1000),
    owner: boundedStr(value.owner, 120),
    createdAt: iso(value.createdAt, now),
    updatedAt: iso(value.updatedAt, now),
  };
}

/**
 * Validates, repairs and migrates an unknown parsed document into a Workspace.
 *
 * Migration strategy: additive defaults are applied field-by-field, so a v1
 * document (no triage fields) becomes a valid v3 document without a per-version
 * step function. Only structural changes that cannot be defaulted need an
 * explicit upgrade branch — none exist yet; `SCHEMA_VERSION` is recorded so a
 * future breaking change can branch on the stored value.
 */
export function migrateWorkspace(raw: unknown): MigrationResult {
  const repairs: string[] = [];

  if (!isRecord(raw)) {
    return { workspace: emptyWorkspace(), repairs, reset: true };
  }

  if (!Array.isArray(raw.projects) && !Array.isArray(raw.scans)) {
    return { workspace: emptyWorkspace(), repairs, reset: true };
  }

  const storedVersion = Number.isFinite(Number(raw.schemaVersion)) ? Number(raw.schemaVersion) : 1;
  if (storedVersion > SCHEMA_VERSION) {
    repairs.push(
      `Workspace was written by a newer version (schema ${storedVersion}); unknown fields were ignored.`,
    );
  } else if (storedVersion < SCHEMA_VERSION) {
    repairs.push(`Workspace upgraded from schema ${storedVersion} to ${SCHEMA_VERSION}.`);
  }

  const projects: Project[] = [];
  const rawProjects = Array.isArray(raw.projects) ? raw.projects : [];
  rawProjects.forEach((candidate) => {
    const project = normalizeProject(candidate);
    if (project) projects.push(project);
  });
  if (projects.length !== rawProjects.length) {
    repairs.push(`Dropped ${rawProjects.length - projects.length} invalid project(s).`);
  }
  if (projects.length > LIMITS.maxProjects) {
    repairs.push(`Kept the first ${LIMITS.maxProjects} projects; older ones were dropped.`);
    projects.length = LIMITS.maxProjects;
  }

  const projectIds = new Set(projects.map((project) => project.id));
  const scans: Scan[] = [];
  const rawScans = Array.isArray(raw.scans) ? raw.scans : [];
  rawScans.forEach((candidate) => {
    const scan = normalizeScan(candidate, repairs);
    if (!scan) return;
    if (!projectIds.has(scan.projectId)) {
      repairs.push(`Dropped scan “${scan.name}” because its project no longer exists.`);
      return;
    }
    scans.push(scan);
  });

  return {
    workspace: {
      schemaVersion: SCHEMA_VERSION,
      projects,
      scans,
      updatedAt: iso(raw.updatedAt, new Date(0).toISOString()),
    },
    repairs,
    reset: false,
  };
}

/** True when the object is a usable EngineFinding (used when importing JSON). */
export function isEngineFinding(value: unknown): value is EngineFinding {
  return isRecord(value) && typeof value.ruleId === 'string' && typeof value.message === 'string';
}
