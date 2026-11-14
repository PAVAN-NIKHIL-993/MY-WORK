/**
 * Derived data selectors.
 *
 * All aggregation lives here, outside components, so:
 *  - numbers shown in the UI and numbers written into reports cannot disagree;
 *  - selectors are pure and cheap to unit test;
 *  - components stay declarative and re-render only on prop changes.
 *
 * Selectors take the workspace (or a scan) as input and never mutate it.
 */

import type {
  Finding,
  FindingStatus,
  Project,
  Scan,
  Severity,
  Workspace,
} from '@/types/domain';
import { RESOLVED_STATUSES, SEVERITY_ORDER } from '@/types/domain';
import { percent } from '@/lib/format';

export interface SeverityCounts {
  critical: number;
  serious: number;
  moderate: number;
  minor: number;
  total: number;
}

export function emptySeverityCounts(): SeverityCounts {
  return { critical: 0, serious: 0, moderate: 0, minor: 0, total: 0 };
}

export function countBySeverity(findings: readonly Finding[]): SeverityCounts {
  const counts = emptySeverityCounts();
  for (const finding of findings) {
    counts[finding.severity] += 1;
    counts.total += 1;
  }
  return counts;
}

export function countByStatus(findings: readonly Finding[]): Record<FindingStatus, number> {
  const counts: Record<FindingStatus, number> = {
    open: 0,
    in_progress: 0,
    fixed: 0,
    accepted: 0,
    ignored: 0,
  };
  for (const finding of findings) counts[finding.status] += 1;
  return counts;
}

export function isResolved(finding: Finding): boolean {
  return RESOLVED_STATUSES.includes(finding.status);
}

/** Findings that still need work (everything not resolved). */
export function openFindings(findings: readonly Finding[]): Finding[] {
  return findings.filter((finding) => !isResolved(finding));
}

export function projectScans(workspace: Workspace, projectId: string): Scan[] {
  return workspace.scans
    .filter((scan) => scan.projectId === projectId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function allFindings(workspace: Workspace): Finding[] {
  return workspace.scans.flatMap((scan) => scan.findings);
}

export function findingsForScan(scan: Scan | undefined): Finding[] {
  return scan ? scan.findings : [];
}

/**
 * The latest scan per project. The overview and reports use this so a project
 * is represented by its most recent evidence rather than by history.
 */
export function latestScanByProject(workspace: Workspace): Map<string, Scan> {
  const map = new Map<string, Scan>();
  for (const scan of workspace.scans) {
    const current = map.get(scan.projectId);
    if (!current || scan.createdAt > current.createdAt) map.set(scan.projectId, scan);
  }
  return map;
}

export interface WorkspaceStats {
  projects: number;
  scans: number;
  findings: number;
  open: number;
  resolved: number;
  resolutionPercent: number;
  bySeverity: SeverityCounts;
  /** Projects that have at least one scan. */
  auditedProjects: number;
  /** Projects with no scan yet — drives the empty state and onboarding. */
  unauditedProjects: number;
  latestActivity: string | null;
}

export function workspaceStats(workspace: Workspace): WorkspaceStats {
  const findings = allFindings(workspace);
  const resolved = findings.filter(isResolved).length;
  const auditedProjects = new Set(workspace.scans.map((scan) => scan.projectId)).size;
  const timestamps = workspace.scans.map((scan) => scan.createdAt).sort();

  return {
    projects: workspace.projects.length,
    scans: workspace.scans.length,
    findings: findings.length,
    open: findings.length - resolved,
    resolved,
    resolutionPercent: percent(resolved, findings.length),
    bySeverity: countBySeverity(openFindings(findings)),
    auditedProjects,
    unauditedProjects: workspace.projects.length - auditedProjects,
    latestActivity: timestamps.length > 0 ? timestamps[timestamps.length - 1]! : null,
  };
}

export interface RuleAggregate {
  ruleId: string;
  ruleName: string;
  severity: Severity;
  wcagLevel: string;
  successCriteria: string[];
  occurrences: number;
  openOccurrences: number;
}

/** Groups findings by rule across scans — the "most common failures" table. */
export function aggregateByRule(findings: readonly Finding[]): RuleAggregate[] {
  const map = new Map<string, RuleAggregate>();
  for (const finding of findings) {
    const existing = map.get(finding.ruleId);
    if (existing) {
      existing.occurrences += 1;
      if (!isResolved(finding)) existing.openOccurrences += 1;
      continue;
    }
    map.set(finding.ruleId, {
      ruleId: finding.ruleId,
      ruleName: finding.ruleName,
      severity: finding.severity,
      wcagLevel: finding.wcagLevel,
      successCriteria: finding.successCriteria,
      occurrences: 1,
      openOccurrences: isResolved(finding) ? 0 : 1,
    });
  }
  return [...map.values()].sort(
    (a, b) =>
      SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity) ||
      b.occurrences - a.occurrences ||
      a.ruleId.localeCompare(b.ruleId),
  );
}

export interface ConformanceRow {
  ruleId: string;
  ruleName: string;
  wcagLevel: string;
  successCriteria: string[];
  severity: Severity;
  status: 'supports' | 'partially-supports' | 'does-not-support' | 'not-applicable';
  occurrences: number;
  openOccurrences: number;
}

/**
 * Builds the VPAT-style conformance table.
 *
 * Mapping used in reports (documented in docs/architecture/data-flow.md):
 *  - no finding for a rule     → Supports
 *  - all findings accepted/ignored → Partially Supports (documented exception)
 *  - some findings resolved    → Partially Supports
 *  - no findings resolved      → Does Not Support
 *
 * Rules that produced no findings because they are not applicable to the page
 * are indistinguishable from passes without a per-rule "applicable" signal, so
 * the report states this assumption explicitly instead of over-claiming.
 */
export function buildConformance(scan: Scan): ConformanceRow[] {
  const byRule = new Map<string, Finding[]>();
  for (const finding of scan.findings) {
    const list = byRule.get(finding.ruleId) ?? [];
    list.push(finding);
    byRule.set(finding.ruleId, list);
  }

  const rows: ConformanceRow[] = [];
  for (const [ruleId, findings] of byRule) {
    const first = findings[0]!;
    const resolved = findings.filter(isResolved).length;
    const status: ConformanceRow['status'] =
      resolved === 0
        ? 'does-not-support'
        : resolved === findings.length
          ? 'partially-supports'
          : 'partially-supports';
    rows.push({
      ruleId,
      ruleName: first.ruleName,
      wcagLevel: first.wcagLevel,
      successCriteria: first.successCriteria,
      severity: first.severity,
      status,
      occurrences: findings.length,
      openOccurrences: findings.length - resolved,
    });
  }

  return rows.sort(
    (a, b) =>
      SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity) ||
      a.ruleId.localeCompare(b.ruleId),
  );
}

export interface SeverityTrendPoint {
  scanId: string;
  label: string;
  createdAt: string;
  bySeverity: SeverityCounts;
}

/** Chronological open-finding counts per scan, used by the trend list. */
export function severityTrend(scans: readonly Scan[]): SeverityTrendPoint[] {
  return [...scans]
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .map((scan) => ({
      scanId: scan.id,
      label: scan.name,
      createdAt: scan.createdAt,
      bySeverity: countBySeverity(openFindings(scan.findings)),
    }));
}

export function getProject(workspace: Workspace, projectId: string): Project | undefined {
  return workspace.projects.find((project) => project.id === projectId);
}

export function getScan(workspace: Workspace, scanId: string): Scan | undefined {
  return workspace.scans.find((scan) => scan.id === scanId);
}

/** Free-text search across findings (rule, message, selector, note). */
export function searchFindings(findings: readonly Finding[], query: string): Finding[] {
  const term = query.trim().toLowerCase();
  if (term === '') return [...findings];
  return findings.filter((finding) =>
    [finding.ruleId, finding.ruleName, finding.message, finding.selector, finding.note, finding.snippet]
      .join(' ')
      .toLowerCase()
      .includes(term),
  );
}
