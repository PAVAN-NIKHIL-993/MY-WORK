/**
 * Rule reference.
 *
 * Documents the engine inside the product: auditors need to know what a rule
 * checks and why a given severity was assigned before they can defend a report.
 * Content is generated from `RULE_DESCRIPTORS`, so it cannot drift from the engine.
 */

import { useMemo, useState } from 'react';
import { RULE_DESCRIPTORS } from '@/engine/rules';
import { ENGINE_VERSION } from '@/engine/audit';
import type { Severity } from '@/types/domain';
import { SEVERITY_LABEL, SEVERITY_ORDER } from '@/types/domain';
import { PageHeader } from '@/components/ui/Feedback';
import { Button } from '@/components/ui/Button';
import { SeverityBadge, WcagBadge } from '@/components/ui/Badge';
import { Icon } from '@/components/ui/Icon';
import { pluralize } from '@/lib/format';

export function RulesScreen(): JSX.Element {
  const [severityFilter, setSeverityFilter] = useState<'all' | Severity>('all');
  const [query, setQuery] = useState('');

  const rules = useMemo(() => {
    const term = query.trim().toLowerCase();
    return RULE_DESCRIPTORS.filter((rule) => {
      if (severityFilter !== 'all' && rule.severity !== severityFilter) return false;
      if (term === '') return true;
      return `${rule.id} ${rule.name} ${rule.description} ${rule.successCriteria.join(' ')}`
        .toLowerCase()
        .includes(term);
    });
  }, [severityFilter, query]);

  return (
    <>
      <PageHeader
        title="Rule reference"
        description={`${pluralize(RULE_DESCRIPTORS.length, 'rule')} evaluated by audit engine ${ENGINE_VERSION}. Severity reflects impact on a user completing a task, not implementation effort.`}
      />

      <div className="toolbar" role="search">
        <div className="search-field toolbar-field">
          <label htmlFor="rule-search">Search rules</label>
          <Icon name="search" size={15} />
          <input
            id="rule-search"
            className="input"
            type="search"
            value={query}
            placeholder="Name, id or success criterion"
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <div className="toolbar-field">
          <label htmlFor="rule-severity">Severity</label>
          <select
            id="rule-severity"
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
        <p className="text-xs text-muted" role="status" aria-live="polite" style={{ marginLeft: 'auto' }}>
          {pluralize(rules.length, 'rule')} shown
        </p>
      </div>

      {rules.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <p className="empty-state-title">No rules match</p>
            <p className="empty-state-body">Try a different search term or severity.</p>
            <div className="empty-state-actions">
              <Button
                onClick={() => {
                  setQuery('');
                  setSeverityFilter('all');
                }}
              >
                Clear filters
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="stack">
          {rules.map((rule) => (
            <article className="card" key={rule.id} aria-labelledby={`rule-${rule.id}`}>
              <div className="card-header">
                <div>
                  <h2 className="card-title" id={`rule-${rule.id}`}>
                    {rule.name}
                  </h2>
                  <p className="card-subtitle mono">{rule.id}</p>
                </div>
                <div className="row">
                  <SeverityBadge severity={rule.severity} />
                  <WcagBadge level={rule.wcagLevel} />
                </div>
              </div>
              <div className="card-body stack">
                <p className="text-sm text-secondary">{rule.description}</p>
                <dl className="detail-grid">
                  <dt>Success criteria</dt>
                  <dd>{rule.successCriteria.join(', ')}</dd>
                  <dt>How to fix</dt>
                  <dd>{rule.remediation}</dd>
                </dl>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
