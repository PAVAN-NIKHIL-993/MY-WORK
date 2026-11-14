/**
 * 404 / missing-entity screen.
 *
 * Used both for unknown routes and for deleted entities (deep link to a project
 * that no longer exists). The distinction matters: a deleted entity is not a
 * navigation error, so the message and actions differ.
 */

import { paths } from '@/state/router';
import { EmptyState, PageHeader } from '@/components/ui/Feedback';
import { Button } from '@/components/ui/Button';

export function NotFoundScreen({ message }: { message?: string }): JSX.Element {
  return (
    <>
      <PageHeader
        title={message ? 'Not available' : 'Page not found'}
        description={message ?? 'The address does not match any screen in the workbench.'}
      />
      <div className="card">
        <EmptyState
          icon="alert-circle"
          title={message ? 'This item is gone' : 'That link does not exist'}
          body={
            message ??
            'Check the address, or go back to a known screen. Deep links to deleted projects and scans land here as well.'
          }
          actions={
            <>
              <Button variant="primary" onClick={() => globalThis.location.assign(paths.overview)}>
                Go to overview
              </Button>
              <Button onClick={() => globalThis.location.assign(paths.projects)}>Browse projects</Button>
            </>
          }
        />
      </div>
    </>
  );
}
