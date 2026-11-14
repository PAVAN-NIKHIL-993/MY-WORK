/**
 * Top-level error boundary.
 *
 * A render crash must not leave the auditor staring at a white page: the
 * boundary shows what happened, keeps the technical message available for a bug
 * report, and offers a reload plus a link to export stored data first.
 */

import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from '@/components/ui/Button';
import { APP_NAME } from '@/config';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
  info: string;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null, info: '' };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    this.setState({ info: info.componentStack ?? '' });
    console.error(`${APP_NAME} render error`, error, info.componentStack);
  }

  render(): ReactNode {
    const { error, info } = this.state;

    if (!error) return this.props.children;

    return (
      <main style={{ padding: '48px 24px', maxWidth: 720, margin: '0 auto' }}>
        <h1 style={{ fontSize: '1.5rem', marginBottom: 12 }}>Something went wrong</h1>
        <p style={{ marginBottom: 16, color: 'var(--text-secondary)' }}>
          The interface hit an unexpected error. Your saved audits are still in this browser and
          are not affected.
        </p>
        <div className="alert alert--error" role="alert" style={{ marginBottom: 16 }}>
          <div>
            <p className="alert-title">{error.name}</p>
            <p>{error.message}</p>
          </div>
        </div>
        <div className="row" style={{ marginBottom: 24 }}>
          <Button variant="primary" onClick={() => globalThis.location.reload()}>
            Reload the app
          </Button>
          <Button onClick={() => globalThis.location.assign('#/settings')}>
            Go to settings
          </Button>
        </div>
        <details>
          <summary style={{ cursor: 'pointer', fontWeight: 600 }}>
            Technical details (for a bug report)
          </summary>
          <pre className="code-block" style={{ marginTop: 8 }}>
            {`${error.stack ?? error.message}\n\nComponent stack:${info}`}
          </pre>
        </details>
      </main>
    );
  }
}
