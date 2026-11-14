/**
 * Browser entry point.
 *
 * Order matters: theme is applied before React renders (no flash), then the
 * workspace provider mounts, then `<App/>` resolves the route. A top-level error
 * boundary turns an unexpected render crash into a recoverable screen instead of
 * a blank page.
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@/lib/theme-init';
import '@/styles/tokens.css';
import '@/styles/base.css';
import '@/styles/components.css';
import { App } from './App';
import { WorkspaceProvider } from '@/state/workspace-context';
import { ErrorBoundary } from '@/components/layout/ErrorBoundary';

const container = document.getElementById('root');

if (!container) {
  throw new Error('Root element #root was not found in index.html.');
}

createRoot(container, {
  onUncaughtError: (error) => {
    // Surface render errors in the console for debugging; the ErrorBoundary
    // shows the user-facing message.
    console.error('Uncaught render error', error);
  },
}).render(
  <StrictMode>
    <ErrorBoundary>
      <WorkspaceProvider>
        <App />
      </WorkspaceProvider>
    </ErrorBoundary>
  </StrictMode>,
);
