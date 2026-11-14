/**
 * Minimal hash router.
 *
 * Hash routing keeps the build deployable as static files anywhere (including
 * GitHub Pages project paths and `file://`) with no server rewrite rules. The
 * whole router is ~60 lines, so it replaces a routing dependency rather than
 * reimplementing one.
 *
 * Route grammar:
 *   #/                       overview
 *   #/projects               project list
 *   #/projects/:projectId    project detail (scans + findings)
 *   #/findings               global findings inbox
 *   #/findings/:scanId       scan detail
 *   #/reports                reports & conformance
 *   #/reports/:projectId     project report
 *   #/contrast               contrast checker
 *   #/rules                  rule reference
 *   #/settings               settings, backup, restore
 */

import { useCallback, useEffect, useMemo, useState } from 'react';

export interface Route {
  name:
    | 'overview'
    | 'projects'
    | 'project'
    | 'findings'
    | 'scan'
    | 'reports'
    | 'report'
    | 'contrast'
    | 'rules'
    | 'settings'
    | 'not-found';
  /** Path segments after the leading `#`, e.g. `['projects', 'prj_1']`. */
  segments: string[];
  raw: string;
}

export function parseHash(hash: string): Route {
  const raw = hash.replace(/^#/, '') || '/';
  const segments = raw.split('/').filter((segment) => segment !== '');
  const [first, second] = segments;

  if (!first) return { name: 'overview', segments, raw };
  switch (first) {
    case 'projects':
      return { name: second ? 'project' : 'projects', segments, raw };
    case 'findings':
      return { name: second ? 'scan' : 'findings', segments, raw };
    case 'reports':
      return { name: second ? 'report' : 'reports', segments, raw };
    case 'contrast':
      return { name: 'contrast', segments, raw };
    case 'rules':
      return { name: 'rules', segments, raw };
    case 'settings':
      return { name: 'settings', segments, raw };
    default:
      return { name: 'not-found', segments, raw };
  }
}

export function navigate(path: string): void {
  const target = path.startsWith('#') ? path : `#${path.startsWith('/') ? '' : '/'}${path}`;
  if (globalThis.location.hash === target) return;
  globalThis.location.hash = target;
}

/** Current route plus a `navigate` helper. Re-renders on hashchange only. */
export function useRoute(): { route: Route; navigate: typeof navigate } {
  const [hash, setHash] = useState<string>(() => globalThis.location?.hash ?? '#/');

  useEffect(() => {
    const onChange = () => setHash(globalThis.location.hash || '#/');
    globalThis.addEventListener('hashchange', onChange);
    // Normalise an empty hash so back/forward and deep links behave predictably.
    if (!globalThis.location.hash) globalThis.location.replace(`${globalThis.location.pathname}#/`);
    return () => globalThis.removeEventListener('hashchange', onChange);
  }, []);

  const route = useMemo(() => parseHash(hash), [hash]);
  const go = useCallback((path: string) => navigate(path), []);
  return { route, navigate: go };
}

/** Builds a path for a named entity, keeping link construction in one place. */
export const paths = {
  overview: '#/',
  projects: '#/projects',
  project: (id: string) => `#/projects/${id}`,
  findings: '#/findings',
  scan: (id: string) => `#/findings/${id}`,
  reports: '#/reports',
  report: (projectId: string) => `#/reports/${projectId}`,
  contrast: '#/contrast',
  rules: '#/rules',
  settings: '#/settings',
} as const;
