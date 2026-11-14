/**
 * Form field wrapper that owns label / hint / error wiring.
 *
 * Every input in the product goes through this component so that:
 *  - the label is always programmatically associated (a11y 1.3.1 / 3.3.2);
 *  - `aria-invalid` and `aria-describedby` are consistent;
 *  - the error message is exposed to screen readers via `role="alert"` when it
 *    appears after submission, not only visually.
 *
 * The child receives `id`, `aria-describedby` and `aria-invalid` through a render
 * prop, which keeps this primitive agnostic of input type.
 */

import type { ReactNode } from 'react';

export interface FieldRenderProps {
  id: string;
  'aria-describedby': string | undefined;
  'aria-invalid': boolean | undefined;
  required: boolean;
}

export function Field({
  id,
  label,
  hint,
  error,
  required = false,
  children,
  className,
}: {
  id: string;
  label: ReactNode;
  hint?: ReactNode;
  error?: string | null;
  required?: boolean;
  children: (props: FieldRenderProps) => ReactNode;
  className?: string;
}): JSX.Element {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={['field', className ?? ''].filter(Boolean).join(' ')}>
      <label className="field-label" htmlFor={id}>
        {label}
        {required ? (
          <span className="field-required" aria-hidden="true">
            *
          </span>
        ) : null}
        {required ? <span className="visually-hidden"> (required)</span> : null}
      </label>
      {children({
        id,
        'aria-describedby': describedBy,
        'aria-invalid': error ? true : undefined,
        required,
      })}
      {hint ? (
        <p className="field-hint" id={hintId}>
          {hint}
        </p>
      ) : null}
      {error ? (
        <p className="field-error" id={errorId} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
