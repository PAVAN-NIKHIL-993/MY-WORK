/**
 * Proportional severity bar.
 *
 * Purely presentational (marked `aria-hidden`) because every number it encodes is
 * also printed in the adjacent legend/table. Colour is therefore never the only
 * carrier of meaning.
 */

import { SEVERITY_ORDER } from '@/types/domain';
import type { SeverityCounts } from '@/state/selectors';

export function SeverityBar({ counts }: { counts: SeverityCounts }): JSX.Element {
  const total = Math.max(1, counts.total);
  return (
    <div className="severity-bar" aria-hidden="true">
      {SEVERITY_ORDER.map((severity) =>
        counts[severity] > 0 ? (
          <span
            key={severity}
            className={`severity-bar-segment severity-bar-segment--${severity}`}
            style={{ width: `${(counts[severity] / total) * 100}%` }}
          />
        ) : null,
      )}
      {counts.total === 0 ? <span className="severity-bar-segment severity-bar-segment--resolved" style={{ width: '100%' }} /> : null}
    </div>
  );
}
