/**
 * Feedback primitives: empty states, alerts, skeletons and section headings.
 * Centralised so every screen uses the same visual and semantic vocabulary.
 */

import type { ReactNode } from 'react';
import { Icon, type IconName } from './Icon';

export function EmptyState({
  icon = 'sparkle',
  title,
  body,
  actions,
}: {
  icon?: IconName;
  title: string;
  body: ReactNode;
  actions?: ReactNode;
}): JSX.Element {
  return (
    <div className="empty-state">
      <span className="empty-state-icon">
        <Icon name={icon} size={22} />
      </span>
      <p className="empty-state-title">{title}</p>
      <div className="empty-state-body">{body}</div>
      {actions ? <div className="empty-state-actions">{actions}</div> : null}
    </div>
  );
}

const ALERT_ICON: Record<AlertTone, IconName> = {
  info: 'info',
  success: 'check-circle',
  warning: 'alert-triangle',
  error: 'alert-circle',
};

export type AlertTone = 'info' | 'success' | 'warning' | 'error';

/**
 * Inline alert. `role="alert"` is only used for errors that appear *after* an
 * action (so it is announced); passive information uses `role="status"` with
 * `aria-live="polite"` and never steals focus.
 */
export function Alert({
  tone = 'info',
  title,
  children,
  actions,
  live = false,
}: {
  tone?: AlertTone;
  title?: string;
  children: ReactNode;
  actions?: ReactNode;
  live?: boolean;
}): JSX.Element {
  return (
    <div
      className={`alert alert--${tone}`}
      {...(live ? { role: tone === 'error' ? 'alert' : 'status', 'aria-live': tone === 'error' ? 'assertive' : 'polite' } : {})}
    >
      <Icon name={ALERT_ICON[tone]} size={17} />
      <div>
        {title ? <p className="alert-title">{title}</p> : null}
        <div>{children}</div>
        {actions ? <div className="alert-actions">{actions}</div> : null}
      </div>
    </div>
  );
}

/** Accessible loading placeholder; announces its state to assistive technology. */
export function Skeleton({
  lines = 3,
  label = 'Loading',
}: {
  lines?: number;
  label?: string;
}): JSX.Element {
  return (
    <div role="status" aria-busy="true" aria-live="polite" className="stack-sm">
      <span className="visually-hidden">{label}</span>
      {Array.from({ length: lines }).map((_, index) => (
        <span
          key={index}
          className="skeleton skeleton-line"
          style={{ width: `${100 - index * 12}%` }}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}

/** H1 + description + actions, used by every page. */
export function PageHeader({
  title,
  description,
  actions,
  eyebrow,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  eyebrow?: ReactNode;
}): JSX.Element {
  return (
    <header className="page-header">
      <div className="page-header-text">
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h1 className="page-title">{title}</h1>
        {description ? <p className="page-description">{description}</p> : null}
      </div>
      {actions ? <div className="page-actions">{actions}</div> : null}
    </header>
  );
}
