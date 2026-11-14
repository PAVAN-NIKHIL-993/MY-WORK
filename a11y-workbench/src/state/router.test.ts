import { describe, expect, it } from 'vitest';
import { parseHash, paths } from './router';

describe('parseHash', () => {
  it('treats empty and root hashes as the overview', () => {
    expect(parseHash('').name).toBe('overview');
    expect(parseHash('#').name).toBe('overview');
    expect(parseHash('#/').name).toBe('overview');
  });

  it('maps list routes', () => {
    expect(parseHash('#/projects').name).toBe('projects');
    expect(parseHash('#/findings').name).toBe('findings');
    expect(parseHash('#/reports').name).toBe('reports');
  });

  it('maps detail routes and keeps the id segment', () => {
    const project = parseHash('#/projects/prj_123');
    expect(project.name).toBe('project');
    expect(project.segments).toEqual(['projects', 'prj_123']);

    expect(parseHash('#/findings/scn_9').name).toBe('scan');
    expect(parseHash('#/reports/prj_9').name).toBe('report');
  });

  it('maps tool routes', () => {
    expect(parseHash('#/contrast').name).toBe('contrast');
    expect(parseHash('#/rules').name).toBe('rules');
    expect(parseHash('#/settings').name).toBe('settings');
  });

  it('returns not-found for unknown paths and ignores trailing slashes', () => {
    expect(parseHash('#/nope').name).toBe('not-found');
    expect(parseHash('#/projects/').name).toBe('projects');
  });

  it('does not crash on unexpected characters and reports not-found', () => {
    // Query strings are not part of the route grammar; treat them as unknown
    // rather than silently mapping to an arbitrary screen.
    expect(parseHash('#/projects?x=1').name).toBe('not-found');
    expect(parseHash('#/%zz').name).toBe('not-found');
  });
});

describe('paths', () => {
  it('produces hash URLs that parse back to the same route', () => {
    expect(parseHash(paths.projects).name).toBe('projects');
    expect(parseHash(paths.project('prj_1')).name).toBe('project');
    expect(parseHash(paths.scan('scn_1')).name).toBe('scan');
    expect(parseHash(paths.report('prj_1')).name).toBe('report');
    expect(parseHash(paths.contrast).name).toBe('contrast');
  });

  it('embeds ids verbatim', () => {
    expect(paths.project('prj_abc')).toBe('#/projects/prj_abc');
  });
});
