/**
 * Audit engine entry point.
 *
 * `runAudit(markup)` is the only function the rest of the app needs. It is
 * synchronous and pure with respect to application state: the same markup and
 * the same engine version always produce the same result.
 *
 * Failure behaviour:
 *  - Invalid/partial markup is repaired by the HTML parser and still audited.
 *  - A rule that throws is isolated: its error becomes a warning, the remaining
 *    rules still run, and the scan is still saved. This avoids the total-failure
 *    mode where one bad rule hides every other finding.
 *  - Findings beyond `LIMITS.maxFindingsPerScan` are dropped and reported in
 *    `warnings`, so the UI can tell the auditor the list was truncated.
 */

import type { EngineFinding, EngineResult, ScanSummary, Severity, WcagLevel } from '@/types/domain';
import { LIMITS } from '@/config';
import { parseMarkup } from '@/lib/dom';
import { sortFindings } from './finding';
import { RULES } from './rules';

/** Bumped whenever rule behaviour changes; stored on every scan. */
export const ENGINE_VERSION = '1.0.0';

function emptySeverityCounts(): Record<Severity, number> {
  return { critical: 0, serious: 0, moderate: 0, minor: 0 };
}

/** Counts findings and rule passes into the compact summary stored on a scan. */
export function summarize(findings: EngineFinding[], rulesEvaluated: number): ScanSummary {
  const bySeverity = emptySeverityCounts();
  const passedByLevel: Record<WcagLevel, number> = { A: 0, AA: 0, AAA: 0 };

  for (const finding of findings) {
    bySeverity[finding.severity] += 1;
  }

  const violatedRuleIds = new Set(findings.map((finding) => finding.ruleId));
  for (const rule of RULES) {
    if (violatedRuleIds.has(rule.id)) continue;
    passedByLevel[rule.wcagLevel] += 1;
  }

  return {
    total: findings.length,
    bySeverity,
    passedByLevel,
    rulesEvaluated,
  };
}

/** Audits one captured document. Never throws. */
export function runAudit(markup: string): EngineResult {
  const warnings: string[] = [];

  if (typeof markup !== 'string' || markup.trim() === '') {
    warnings.push('Captured markup is empty; every rule was skipped.');
    return {
      engineVersion: ENGINE_VERSION,
      findings: [],
      summary: { total: 0, bySeverity: emptySeverityCounts(), passedByLevel: { A: 0, AA: 0, AAA: 0 }, rulesEvaluated: 0 },
      warnings,
    };
  }

  let document: Document;
  try {
    document = parseMarkup(markup);
  } catch (error) {
    warnings.push(`Markup could not be parsed: ${error instanceof Error ? error.message : String(error)}`);
    return {
      engineVersion: ENGINE_VERSION,
      findings: [],
      summary: { total: 0, bySeverity: emptySeverityCounts(), passedByLevel: { A: 0, AA: 0, AAA: 0 }, rulesEvaluated: 0 },
      warnings,
    };
  }

  const context = { document, body: document.body ?? document.documentElement };
  const findings: EngineFinding[] = [];
  let rulesEvaluated = 0;

  for (const rule of RULES) {
    rulesEvaluated += 1;
    try {
      const produced = rule.evaluate(context);
      if (!Array.isArray(produced)) {
        warnings.push(`Rule "${rule.id}" returned no result and was ignored.`);
        continue;
      }
      findings.push(...produced);
    } catch (error) {
      warnings.push(
        `Rule "${rule.id}" failed and was skipped: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  const sorted = sortFindings(findings);
  const capped = sorted.slice(0, LIMITS.maxFindingsPerScan);
  if (sorted.length > capped.length) {
    warnings.push(
      `Only the first ${capped.length} of ${sorted.length} findings were kept (limit VITE_MAX_FINDINGS_PER_SCAN).`,
    );
  }

  return {
    engineVersion: ENGINE_VERSION,
    findings: capped,
    summary: summarize(capped, rulesEvaluated),
    warnings,
  };
}
