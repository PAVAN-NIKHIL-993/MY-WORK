/**
 * Card primitives.
 *
 * Composition over props: `Card`, `CardHeader`, `CardTitle`, `CardBody`,
 * `CardFooter`. Keeping the parts separate means a card can hold a table that
 * must sit flush against the edges without a modifier prop for every case.
 */

import type { ReactNode } from 'react';

export function Card({
  children,
  flush = false,
  className,
  as = 'section',
  ariaLabel,
  ariaLabelledBy,
}: {
  children: ReactNode;
  flush?: boolean;
  className?: string;
  as?: 'section' | 'div' | 'article';
  ariaLabel?: string;
  ariaLabelledBy?: string;
}): JSX.Element {
  const Element = as;
  return (
    <Element
      className={['card', flush ? 'card--flush' : '', className ?? ''].filter(Boolean).join(' ')}
      {...(ariaLabel ? { 'aria-label': ariaLabel } : {})}
      {...(ariaLabelledBy ? { 'aria-labelledby': ariaLabelledBy } : {})}
    >
      {children}
    </Element>
  );
}

export function CardHeader({
  title,
  subtitle,
  actions,
  titleId,
  headingLevel = 2,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  titleId?: string;
  headingLevel?: 2 | 3 | 4;
}): JSX.Element {
  const Heading = `h${headingLevel}` as 'h2' | 'h3' | 'h4';
  return (
    <div className="card-header">
      <div>
        <Heading className="card-title" {...(titleId ? { id: titleId } : {})}>
          {title}
        </Heading>
        {subtitle ? <p className="card-subtitle">{subtitle}</p> : null}
      </div>
      {actions ? <div className="row">{actions}</div> : null}
    </div>
  );
}

export function CardBody({ children, className }: { children: ReactNode; className?: string }): JSX.Element {
  return <div className={['card-body', className ?? ''].filter(Boolean).join(' ')}>{children}</div>;
}

export function CardFooter({ children }: { children: ReactNode }): JSX.Element {
  return <div className="card-footer">{children}</div>;
}
