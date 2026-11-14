/**
 * Toast region.
 *
 * Rendered once in the app shell. Errors and warnings are announced assertively
 * because they usually follow a failed save; everything else is polite so it
 * does not interrupt the user's current task.
 */

import { useWorkspace } from '@/state/workspace-context';
import { Button } from './Button';
import { Icon } from './Icon';

export function ToastRegion(): JSX.Element {
  const { toasts, dismissToast } = useWorkspace();
  const hasError = toasts.some((toast) => toast.tone === 'error');

  return (
    <div
      className="toast-region"
      role="region"
      aria-label="Notifications"
      aria-live={hasError ? 'assertive' : 'polite'}
      aria-atomic="false"
    >
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast toast--${toast.tone}`}>
          <Icon
            name={
              toast.tone === 'success'
                ? 'check-circle'
                : toast.tone === 'error'
                  ? 'alert-circle'
                  : toast.tone === 'warning'
                    ? 'alert-triangle'
                    : 'info'
            }
            size={17}
          />
          <p className="toast-message">{toast.message}</p>
          {toast.action ? (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                toast.action?.run();
                dismissToast(toast.id);
              }}
            >
              {toast.action.label}
            </Button>
          ) : null}
          <Button
            size="sm"
            variant="ghost"
            iconOnly
            icon="x"
            aria-label="Dismiss notification"
            onClick={() => dismissToast(toast.id)}
          />
        </div>
      ))}
    </div>
  );
}
