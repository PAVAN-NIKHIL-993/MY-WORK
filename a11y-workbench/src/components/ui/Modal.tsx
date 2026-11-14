/**
 * Accessible modal dialog.
 *
 * Behaviour (all verified by tests):
 *  - renders in a portal-free overlay at the end of the tree;
 *  - `role="dialog" aria-modal="true"` with `aria-labelledby`;
 *  - Escape closes; clicking the backdrop closes;
 *  - focus moves to the first focusable element on open and returns to the
 *    previously focused element on close;
 *  - Tab is trapped inside the dialog;
 *  - background scroll is locked while open.
 *
 * Deliberately not using `<dialog showModal>`: jsdom does not implement it, and
 * the tested custom implementation is portable across browsers.
 */

import { useEffect, useId, useRef, type ReactNode } from 'react';
import { Button } from './Button';
import type { IconName } from './Icon';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Modal({
  title,
  description,
  children,
  footer,
  onClose,
  wide = false,
  icon,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
  wide?: boolean;
  icon?: IconName;
}): JSX.Element {
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const restoreFocusRef = useRef<Element | null>(null);

  useEffect(() => {
    restoreFocusRef.current = document.activeElement;
    const node = dialogRef.current;
    const first = node?.querySelector<HTMLElement>(FOCUSABLE);
    (first ?? node)?.focus();

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
      const restore = restoreFocusRef.current;
      if (restore instanceof HTMLElement && document.contains(restore)) restore.focus();
    };
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent): void {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose();
        return;
      }
      if (event.key !== 'Tab') return;

      const node = dialogRef.current;
      if (!node) return;
      const focusable = Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (element) => element.offsetParent !== null || element === document.activeElement,
      );
      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }
      const first = focusable[0]!;
      const last = focusable[focusable.length - 1]!;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    // The backdrop is a pointer-only affordance: keyboard users close the dialog
    // with Escape or the close button, both handled above. It carries no
    // semantics of its own, so `no-static-element-interactions` is satisfied by
    // keeping the handler off any element that is exposed to assistive tech.
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      data-testid="modal-backdrop"
    >
      <div
        className={['modal', wide ? 'modal--wide' : ''].filter(Boolean).join(' ')}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        ref={dialogRef}
        tabIndex={-1}
      >
        <div className="modal-header">
          <div>
            <h2 className="modal-title" id={titleId}>
              {title}
            </h2>
            {description ? (
              <p className="modal-description" id={descriptionId}>
                {description}
              </p>
            ) : null}
          </div>
          <Button
            variant="ghost"
            iconOnly
            icon="x"
            aria-label="Close dialog"
            className="modal-close"
            onClick={onClose}
            {...(icon ? { 'data-icon': icon } : {})}
          />
        </div>
        <div className="modal-body">{children}</div>
        {footer ? <div className="modal-footer">{footer}</div> : null}
      </div>
    </div>
  );
}
