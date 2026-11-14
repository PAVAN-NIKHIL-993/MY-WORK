/**
 * Badge primitives: severity, WCAG level, triage status and finding counts.
 *
 * Severity badges always carry a text label (never colour alone) and a dot for
 * quick scanning. The dot is decorative; the word is the accessible signal.
 */

import type { ReactNode } from 'react';
import type { FindingStatus, Severity } from '@/types/domain';
import { FINDING_STATUS_LABEL, SEVERITY_LABEL } from '@/types/domain';

export function Badge({
  tone = 'neutral',
  children,
  withDot = false,
  title,
}: {
  tone?: 'neutral' | 'critical' | 'serious' | 'moderate' | 'minor' | 'success' | 'accent';
  children: ReactNode;
  withDot?: boolean;
  title?: string;
}): JSX.Element {
  const toneClass = tone === 'neutral' ? '' : `badge--${tone}`;
  return (
    <span className={`badge ${toneClass}`.trim()} {...(title ? { title } : {})}>
      {withDot ? <span className="badge-dot" aria-hidden="true" /> : null}
      {children}
    </span>
  );
}

const SEVERITY_TONE: Record<Severity, 'critical' | 'serious' | 'moderate' | 'minor'> = {
  critical: 'critical',
  serious: 'serious',
  moderate: 'moderate',
  minor: 'minor',
};

export function SeverityBadge({ severity }: { severity: Severity }): JSX.Element {
  return (
    <Badge tone={SEVERITY_TONE[severity]} withDot>
      {SEVERITY_LABEL[severity]}
    </Badge>
  );
}

export function WcagBadge({ level }: { level: string }): JSX.Element {
  return <Badge tone="neutral">WCAG {level}</Badge>;
}

const STATUS_TONE: Record<FindingStatus, 'critical' | 'serious' | 'moderate' | 'success' | 'neutral'> = {
  open: 'critical',
  in_progress: 'moderate',
  fixed: 'success',
  accepted: 'neutral',
  ignored: 'neutral',
};

export function StatusBadge({ status }: { status: FindingStatus }): JSX.Element {
  return <Badge tone={STATUS_TONE[status]}>{FINDING_STATUS_LABEL[status]}</Badge>;
}

/** Compact "critical · serious · moderate · minor" inline summary. */
export function SeverityBreakdown({
  counts,
}: {
  counts: { critical: number; serious: number; moderate: number; minor: number };
}): JSX.Element {
  const items: Array<{ severity: Severity; count: number }> = [
    { severity: 'critical', count: counts.critical },
    { severity: 'serious', count: counts.serious },
    { severity: 'moderate', count: counts.moderate },
    { severity: 'minor', count: counts.minor },
  ];
  return (
    <span className="badge-group">
      {items.map(({ severity, count }) => (
        <Badge key={severity} tone={SEVERITY_TONE[severity]}>
          {count} {SEVERITY_LABEL[severity].toLowerCase()}
        </Badge>
      ))}
    </span>
  );
}
