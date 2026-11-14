/**
 * Domain types for a11y-workbench.
 *
 * This module is the single source of truth for the persisted data model.
 * It has **no imports** by design: every other layer (storage, engine, state,
 * UI) depends on these types, and nothing in the domain model may depend on a
 * framework. Changing a field here is a breaking change for persisted data and
 * must be accompanied by a schema migration in `src/storage/migrations.ts`.
 */

/** Severity bucket reported by the audit engine, ordered most severe first. */
export type Severity = 'critical' | 'serious' | 'moderate' | 'minor';

/** WCAG conformance level targeted by a rule. */
export type WcagLevel = 'A' | 'AA' | 'AAA';

/** Lifecycle status of a single finding, set by the auditor during triage. */
export type FindingStatus = 'open' | 'in_progress' | 'fixed' | 'accepted' | 'ignored';

/** A project groups all audits for one product or website. */
export interface Project {
  id: string;
  name: string;
  /** Free-form description of scope, e.g. "Marketing site, template B". */
  description: string;
  /** Owning team or auditor, used as report metadata. */
  owner: string;
  createdAt: string;
  updatedAt: string;
}

/** A finding as produced by the engine, before triage state is applied. */
export interface EngineFinding {
  /** Stable id of the rule that produced this finding, e.g. `image-alt`. */
  ruleId: string;
  ruleName: string;
  severity: Severity;
  wcagLevel: WcagLevel;
  /** WCAG success criteria identifiers, e.g. `["1.1.1"]`. */
  successCriteria: string[];
  /** One-sentence explanation of what is wrong, shown to the auditor. */
  message: string;
  /** How to fix the issue, written for a developer. */
  remediation: string;
  /** Stable, human-readable location of the offending element in the page. */
  selector: string;
  /** Truncated, escaped markup of the offending element for evidence. */
  snippet: string;
  /** Extra machine-readable detail, e.g. measured contrast ratio. */
  detail?: string;
}

/** A finding persisted with triage state and identity. */
export interface Finding extends EngineFinding {
  id: string;
  scanId: string;
  status: FindingStatus;
  /** Auditor note explaining a status change. */
  note: string;
  updatedAt: string;
}

/** Aggregate counts for a scan, derived once at scan time for cheap rendering. */
export interface ScanSummary {
  total: number;
  bySeverity: Record<Severity, number>;
  /** Counts of *rule passes* by WCAG level — used for coverage reporting. */
  passedByLevel: Record<WcagLevel, number>;
  /** Number of rules evaluated for the page. */
  rulesEvaluated: number;
}

/** A single audit run of one captured page. */
export interface Scan {
  id: string;
  projectId: string;
  /** Human label, e.g. "Checkout — payment step". */
  name: string;
  /** Page URL or environment note captured with the markup. */
  url: string;
  /** Optional CMS/page template grouping used in reports. */
  template: string;
  /** Raw captured markup (already size-limited at capture time). */
  markup: string;
  /** Engine version that produced this scan, for evidence traceability. */
  engineVersion: string;
  createdAt: string;
  summary: ScanSummary;
  findings: Finding[];
  /**
   * Non-fatal problems recorded at scan time (truncation, a rule that failed,
   * a pruned older scan). Persisted so an auditor reviewing the scan later still
   * knows the result was incomplete — a toast alone would be lost on reload.
   */
  warnings: string[];
}

/** Root persisted object. `schemaVersion` drives migrations. */
export interface Workspace {
  schemaVersion: number;
  projects: Project[];
  scans: Scan[];
  /** ISO timestamp of the last successful write. */
  updatedAt: string;
}

/** Non-persisted, product-facing description of a rule (used by the UI). */
export interface RuleDescriptor {
  id: string;
  name: string;
  description: string;
  severity: Severity;
  wcagLevel: WcagLevel;
  successCriteria: string[];
  remediation: string;
}

/** Result of running the engine against one document. */
export interface EngineResult {
  engineVersion: string;
  findings: EngineFinding[];
  summary: ScanSummary;
  /** Non-fatal problems encountered while auditing (e.g. rule crash). */
  warnings: string[];
}

export const SEVERITY_ORDER: readonly Severity[] = ['critical', 'serious', 'moderate', 'minor'];

export const SEVERITY_LABEL: Record<Severity, string> = {
  critical: 'Critical',
  serious: 'Serious',
  moderate: 'Moderate',
  minor: 'Minor',
};

export const FINDING_STATUS_LABEL: Record<FindingStatus, string> = {
  open: 'Open',
  in_progress: 'In progress',
  fixed: 'Fixed',
  accepted: 'Accepted risk',
  ignored: 'Not applicable',
};

/** Statuses that count as "resolved" in progress reporting. */
export const RESOLVED_STATUSES: readonly FindingStatus[] = ['fixed', 'accepted', 'ignored'];
