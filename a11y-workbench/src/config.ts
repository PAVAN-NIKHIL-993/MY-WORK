/**
 * Application-wide configuration.
 *
 * All values here are compile-time constants or build-time environment values
 * prefixed with `VITE_` (which means they are public — never put secrets here).
 * Runtime-tunable limits are read from the environment with safe defaults and
 * clamped to sane bounds so a bad deployment variable cannot disable the app.
 */

export const APP_NAME = 'a11y-workbench';
export const APP_VERSION = '1.0.0';
export const APP_TAGLINE = 'Accessibility audit workbench';

/** Version of the persisted workspace schema. Bump with a migration. */
export const SCHEMA_VERSION = 3;

/** localStorage key holding the whole workspace document. */
export const STORAGE_KEY = 'a11y-workbench:workspace';

/** Theme preference key (separate so it survives a workspace reset). */
export const THEME_KEY = 'a11y-workbench:theme';

function readInt(raw: unknown, fallback: number, min: number, max: number): number {
  const parsed = typeof raw === 'string' && raw.trim() !== '' ? Number.parseInt(raw, 10) : Number.NaN;
  if (Number.isNaN(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

const env = import.meta.env as Record<string, string | undefined>;

/** Operational limits. Clamped so misconfiguration degrades gracefully. */
export const LIMITS = {
  /** Findings kept per scan; extra findings are dropped and reported. */
  maxFindingsPerScan: readInt(env.VITE_MAX_FINDINGS_PER_SCAN, 400, 20, 5000),
  /** Maximum markup size for a single capture, in bytes. */
  maxCaptureBytes: readInt(env.VITE_MAX_CAPTURE_KB, 512, 8, 8192) * 1024,
  /** Scans retained per project; the oldest are pruned on save. */
  maxScansPerProject: readInt(env.VITE_MAX_SCANS_PER_PROJECT, 25, 1, 500),
  /** Hard cap on projects to keep the workspace usable. */
  maxProjects: 100,
  /** Maximum length of an auditor note. */
  maxNoteLength: 500,
  /** Maximum length of a project or scan name. */
  maxNameLength: 120,
  /** Maximum length of a captured URL field. */
  maxUrlLength: 2048,
} as const;

/** Truncation length for stored element evidence. */
export const SNIPPET_LENGTH = 240;

export const ROUTES = {
  overview: '#/',
  projects: '#/projects',
  findings: '#/findings',
  reports: '#/reports',
  contrast: '#/contrast',
  settings: '#/settings',
} as const;

export type RouteName = keyof typeof ROUTES;
