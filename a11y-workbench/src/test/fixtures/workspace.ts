/**
 * Workspace fixtures for state/storage/component tests.
 *
 * Built by hand (not by the engine) so tests assert on known data rather than
 * on whatever the current rules happen to produce: a rule change must not break
 * an unrelated state test.
 */

import type { Finding, Project, Scan, Workspace } from '@/types/domain';
import { SCHEMA_VERSION } from '@/config';

export function makeProject(overrides: Partial<Project> = {}): Project {
  return {
    id: 'prj_test1',
    name: 'Acme Store',
    description: 'Marketing site and checkout',
    owner: 'QA team',
    createdAt: '2026-01-05T09:00:00.000Z',
    updatedAt: '2026-01-05T09:00:00.000Z',
    ...overrides,
  };
}

export function makeFinding(overrides: Partial<Finding> = {}): Finding {
  return {
    id: 'fnd_1',
    scanId: 'scn_test1',
    ruleId: 'image-alt',
    ruleName: 'Images have text alternatives',
    severity: 'critical',
    wcagLevel: 'A',
    successCriteria: ['1.1.1'],
    message: 'Image is missing an alt attribute.',
    remediation: 'Add an alt attribute.',
    selector: 'body > main > img',
    snippet: '<img src="hero.jpg">',
    status: 'open',
    note: '',
    updatedAt: '2026-01-05T09:05:00.000Z',
    ...overrides,
  };
}

export function makeScan(overrides: Partial<Scan> = {}): Scan {
  const findings = overrides.findings ?? [makeFinding()];
  return {
    id: 'scn_test1',
    projectId: 'prj_test1',
    name: 'Home page',
    url: 'https://example.com/',
    template: 'Landing',
    markup: '<!doctype html><html lang="en"><head><title>Home</title></head><body><main><h1>Home</h1><img src="hero.jpg"></main></body></html>',
    engineVersion: '1.0.0',
    createdAt: '2026-01-05T09:05:00.000Z',
    summary: {
      total: findings.length,
      bySeverity: { critical: 1, serious: 0, moderate: 0, minor: 0 },
      passedByLevel: { A: 5, AA: 3, AAA: 0 },
      rulesEvaluated: 19,
    },
    findings,
    warnings: [],
    ...overrides,
  };
}

export function makeWorkspace(overrides: Partial<Workspace> = {}): Workspace {
  const project = overrides.projects?.[0] ?? makeProject();
  const scan = overrides.scans?.[0] ?? makeScan({ projectId: project.id });
  return {
    schemaVersion: SCHEMA_VERSION,
    projects: [project],
    scans: [scan],
    updatedAt: '2026-01-05T09:05:00.000Z',
    ...overrides,
  };
}
