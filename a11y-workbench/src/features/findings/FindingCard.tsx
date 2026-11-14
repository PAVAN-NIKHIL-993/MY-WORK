/**
 * One finding, with triage controls and evidence.
 *
 * Design intent: the auditor reads rule → what is wrong → where → how to fix,
 * then records a decision without leaving the row. Evidence (selector + markup)
 * is collapsed by default so a list of 80 findings stays scannable, and each
 * row is a native `<details>` so keyboard and screen-reader behaviour is free.
 *
 * The status control is a labelled `<select>`; changing it persists immediately
 * (single-click triage) and shows a toast, while the note is saved on blur to
 * avoid a write per keystroke.
 */

import { useState } from 'react';
import type { Finding, FindingStatus } from '@/types/domain';
import { FINDING_STATUS_LABEL } from '@/types/domain';
import { SeverityBadge, WcagBadge, StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LIMITS } from '@/config';

const STATUS_ORDER: FindingStatus[] = ['open', 'in_progress', 'fixed', 'accepted', 'ignored'];

export function FindingCard({
  finding,
  onStatusChange,
  onNoteChange,
  compact = false,
}: {
  finding: Finding;
  onStatusChange: (status: FindingStatus) => void;
  onNoteChange: (note: string) => void;
  /** Hides the evidence block (used inside dense report tables). */
  compact?: boolean;
}): JSX.Element {
  const [note, setNote] = useState(finding.note);
  const [dirty, setDirty] = useState(false);

  return (
    <li className="finding">
      <div className="finding-summary">
        <div className="finding-main">
          <div className="finding-title">
            <SeverityBadge severity={finding.severity} />
            <span className="finding-rule">{finding.ruleName}</span>
            <WcagBadge level={finding.wcagLevel} />
            {finding.successCriteria.length > 0 ? (
              <span className="badge">SC {finding.successCriteria.join(', ')}</span>
            ) : null}
            {finding.status !== 'open' ? <StatusBadge status={finding.status} /> : null}
          </div>

          <p className="finding-message">{finding.message}</p>

          <div className="finding-meta">
            <code className="finding-selector">{finding.selector || 'document'}</code>
            {finding.detail ? <span>{finding.detail}</span> : null}
          </div>
        </div>

        <div className="finding-actions">
          <label className="visually-hidden" htmlFor={`status-${finding.id}`}>
            Triage status for {finding.ruleName}
          </label>
          <select
            id={`status-${finding.id}`}
            className="select status-select"
            value={finding.status}
            onChange={(event) => onStatusChange(event.target.value as FindingStatus)}
          >
            {STATUS_ORDER.map((status) => (
              <option key={status} value={status}>
                {FINDING_STATUS_LABEL[status]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {!compact ? (
        <div className="finding-evidence">
          <details>
            <summary className="text-xs text-secondary" style={{ cursor: 'pointer', fontWeight: 600 }}>
              Evidence and remediation
            </summary>
            <div className="stack" style={{ marginTop: 'var(--space-3)' }}>
              <div>
                <p className="eyebrow" style={{ marginBottom: 'var(--space-1)' }}>
                  Captured element
                </p>
                <pre className="code-block">{finding.snippet || 'No element markup captured.'}</pre>
              </div>
              <div>
                <p className="eyebrow" style={{ marginBottom: 'var(--space-1)' }}>
                  How to fix
                </p>
                <p className="text-sm text-secondary">{finding.remediation}</p>
              </div>
              <div className="field">
                <label className="field-label" htmlFor={`note-${finding.id}`}>
                  Auditor note
                </label>
                <textarea
                  id={`note-${finding.id}`}
                  className="textarea"
                  style={{ minHeight: 64, fontFamily: 'var(--font-sans)', fontSize: 'var(--text-sm)' }}
                  maxLength={LIMITS.maxNoteLength}
                  value={note}
                  placeholder="Why was this status chosen? Context for the next auditor."
                  onChange={(event) => {
                    setNote(event.target.value);
                    setDirty(true);
                  }}
                  onBlur={() => {
                    if (dirty && note !== finding.note) onNoteChange(note);
                    setDirty(false);
                  }}
                />
                <p className="field-hint">
                  {note.length}/{LIMITS.maxNoteLength} characters · saved when you leave the field
                </p>
              </div>
              <div className="finding-actions">
                <Button
                  size="sm"
                  icon="copy"
                  onClick={() => {
                    void navigator.clipboard?.writeText(
                      `${finding.ruleName} (${finding.ruleId}) — ${finding.selector}\n${finding.message}\nFix: ${finding.remediation}`,
                    );
                  }}
                >
                  Copy defect text
                </Button>
              </div>
            </div>
          </details>
        </div>
      ) : null}
    </li>
  );
}
