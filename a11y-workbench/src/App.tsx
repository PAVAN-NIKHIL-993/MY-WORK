/**
 * Route table.
 *
 * Every route maps to one feature screen. Screens receive only ids from the URL
 * and read the rest from the workspace context, so deep links work after a
 * reload with no data passed through React state.
 */

import { useRoute, paths } from '@/state/router';
import { useWorkspace } from '@/state/workspace-context';

import { AppShell } from '@/components/layout/AppShell';
import { OverviewScreen } from '@/features/workspace/OverviewScreen';
import { ProjectsScreen } from '@/features/projects/ProjectsScreen';
import { ProjectDetailScreen } from '@/features/projects/ProjectDetailScreen';
import { FindingsScreen } from '@/features/findings/FindingsScreen';
import { ScanDetailScreen } from '@/features/findings/ScanDetailScreen';
import { ReportsScreen } from '@/features/reports/ReportsScreen';
import { ReportDetailScreen } from '@/features/reports/ReportDetailScreen';
import { ContrastScreen } from '@/features/contrast/ContrastScreen';
import { RulesScreen } from '@/features/workspace/RulesScreen';
import { SettingsScreen } from '@/features/workspace/SettingsScreen';
import { NotFoundScreen } from '@/features/workspace/NotFoundScreen';
import { Alert } from '@/components/ui/Feedback';
import { Button } from '@/components/ui/Button';

const ROUTE_TITLES: Record<string, string> = {
  overview: 'Overview',
  projects: 'Projects',
  project: 'Project',
  findings: 'Findings',
  scan: 'Scan result',
  reports: 'Reports',
  report: 'Accessibility report',
  contrast: 'Contrast checker',
  rules: 'Rule reference',
  settings: 'Settings',
  'not-found': 'Page not found',
};

export function App(): JSX.Element {
  const { route } = useRoute();
  const { loadWarnings, persistenceError } = useWorkspace();
  const title = ROUTE_TITLES[route.name] ?? 'Not found';
  const entityId = route.segments[1];

  function renderScreen(): JSX.Element {
    switch (route.name) {
      case 'overview':
        return <OverviewScreen />;
      case 'projects':
        return <ProjectsScreen />;
      case 'project':
        return entityId ? <ProjectDetailScreen projectId={entityId} /> : <NotFoundScreen />;
      case 'findings':
        return <FindingsScreen />;
      case 'scan':
        return entityId ? <ScanDetailScreen scanId={entityId} /> : <NotFoundScreen />;
      case 'reports':
        return <ReportsScreen />;
      case 'report':
        return entityId ? <ReportDetailScreen projectId={entityId} /> : <NotFoundScreen />;
      case 'contrast':
        return <ContrastScreen />;
      case 'rules':
        return <RulesScreen />;
      case 'settings':
        return <SettingsScreen />;
      default:
        return <NotFoundScreen />;
    }
  }

  return (
    <AppShell route={route} title={title}>
      <BannerStack loadWarnings={loadWarnings} persistenceError={persistenceError} />
      {renderScreen()}
    </AppShell>
  );
}

/**
 * Persistent, actionable banners.
 *
 * Load repairs are reported once per session (dismissed via a toast-backed
 * button) and a failed save stays visible until a write succeeds — a lost
 * "saved" state is never silent.
 */
function BannerStack({
  loadWarnings,
  persistenceError,
}: {
  loadWarnings: string[];
  persistenceError: string | null;
}): JSX.Element {
  if (!persistenceError && loadWarnings.length === 0) return <></>;

  return (
    <div className="stack" style={{ marginBottom: 'var(--space-5)' }}>
      {persistenceError ? (
        <Alert
          tone="error"
          title="Changes are not being saved"
          live
          actions={
            <Button size="sm" onClick={() => globalThis.location.assign(paths.settings)}>
              Review storage settings
            </Button>
          }
        >
          {persistenceError}
        </Alert>
      ) : null}
      {loadWarnings.length > 0 ? (
        <Alert tone="warning" title="Stored data was repaired on load">
          <ul className="stack-sm" style={{ listStyle: 'disc', paddingLeft: 'var(--space-4)' }}>
            {loadWarnings.map((warning) => (
              <li key={warning} className="text-sm">
                {warning}
              </li>
            ))}
          </ul>
        </Alert>
      ) : null}
    </div>
  );
}
