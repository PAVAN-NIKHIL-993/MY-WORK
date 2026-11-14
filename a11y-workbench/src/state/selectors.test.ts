import { describe, expect, it } from 'vitest';
import {
  aggregateByRule,
  allFindings,
  buildConformance,
  countBySeverity,
  countByStatus,
  getProject,
  getScan,
  isResolved,
  latestScanByProject,
  openFindings,
  projectScans,
  searchFindings,
  severityTrend,
  workspaceStats,
} from './selectors';
import { makeFinding, makeProject, makeScan, makeWorkspace } from '@/test/fixtures/workspace';

describe('countBySeverity', () => {
  it('counts each bucket and the total', () => {
    const counts = countBySeverity([
      makeFinding({ id: 'a', severity: 'critical' }),
      makeFinding({ id: 'b', severity: 'critical' }),
      makeFinding({ id: 'c', severity: 'minor' }),
    ]);
    expect(counts).toEqual({ critical: 2, serious: 0, moderate: 0, minor: 1, total: 3 });
  });

  it('returns zeroes for an empty list', () => {
    expect(countBySeverity([]).total).toBe(0);
  });
});

describe('countByStatus / isResolved', () => {
  it('treats fixed, accepted and ignored as resolved', () => {
    expect(isResolved(makeFinding({ status: 'fixed' }))).toBe(true);
    expect(isResolved(makeFinding({ status: 'accepted' }))).toBe(true);
    expect(isResolved(makeFinding({ status: 'ignored' }))).toBe(true);
    expect(isResolved(makeFinding({ status: 'in_progress' }))).toBe(false);
    expect(isResolved(makeFinding({ status: 'open' }))).toBe(false);
  });

  it('counts every status bucket', () => {
    const counts = countByStatus([
      makeFinding({ id: 'a', status: 'open' }),
      makeFinding({ id: 'b', status: 'fixed' }),
      makeFinding({ id: 'c', status: 'fixed' }),
    ]);
    expect(counts.open).toBe(1);
    expect(counts.fixed).toBe(2);
  });

  it('openFindings excludes resolved entries', () => {
    const base = makeWorkspace();
    const open = openFindings([...base.scans[0]!.findings, makeFinding({ id: 'x', status: 'fixed' })]);
    expect(open).toHaveLength(1);
  });
});

describe('workspaceStats', () => {
  it('summarises projects, scans, findings and progress', () => {
    const scan = makeScan({
      findings: [
        makeFinding({ id: 'a', severity: 'critical', status: 'open' }),
        makeFinding({ id: 'b', severity: 'minor', status: 'fixed' }),
      ],
    });
    const stats = workspaceStats(makeWorkspace({ scans: [scan] }));
    expect(stats.projects).toBe(1);
    expect(stats.scans).toBe(1);
    expect(stats.findings).toBe(2);
    expect(stats.open).toBe(1);
    expect(stats.resolved).toBe(1);
    expect(stats.resolutionPercent).toBe(50);
    expect(stats.bySeverity.critical).toBe(1);
    expect(stats.bySeverity.minor).toBe(0);
    expect(stats.auditedProjects).toBe(1);
    expect(stats.unauditedProjects).toBe(0);
  });

  it('reports a zero resolution percentage rather than NaN', () => {
    const stats = workspaceStats({ schemaVersion: 3, projects: [], scans: [], updatedAt: '' });
    expect(stats.resolutionPercent).toBe(0);
    expect(stats.latestActivity).toBeNull();
  });

  it('counts projects without scans', () => {
    const workspace = makeWorkspace({
      projects: [makeProject(), makeProject({ id: 'prj_2', name: 'Second' })],
    });
    const stats = workspaceStats(workspace);
    expect(stats.auditedProjects).toBe(1);
    expect(stats.unauditedProjects).toBe(1);
  });
});

describe('aggregateByRule', () => {
  it('groups by rule, most severe first then most frequent', () => {
    const rows = aggregateByRule([
      makeFinding({ id: 'a', ruleId: 'image-alt', ruleName: 'Images', severity: 'critical' }),
      makeFinding({ id: 'b', ruleId: 'image-alt', ruleName: 'Images', severity: 'critical' }),
      makeFinding({ id: 'c', ruleId: 'tabindex-order', ruleName: 'Tabindex', severity: 'moderate' }),
    ]);
    expect(rows[0]!.ruleId).toBe('image-alt');
    expect(rows[0]!.occurrences).toBe(2);
    expect(rows[1]!.ruleId).toBe('tabindex-order');
  });
});

describe('buildConformance', () => {
  it('marks a rule with no resolved findings as does-not-support', () => {
    const rows = buildConformance(makeScan({ findings: [makeFinding({ status: 'open' })] }));
    expect(rows[0]!.status).toBe('does-not-support');
  });

  it('marks a fully resolved rule as partially-supports (documented exception)', () => {
    const rows = buildConformance(makeScan({ findings: [makeFinding({ status: 'ignored' })] }));
    expect(rows[0]!.status).toBe('partially-supports');
  });

  it('counts open against total per rule', () => {
    const rows = buildConformance(
      makeScan({
        findings: [
          makeFinding({ id: 'a', status: 'open' }),
          makeFinding({ id: 'b', status: 'fixed' }),
        ],
      }),
    );
    expect(rows[0]!.occurrences).toBe(2);
    expect(rows[0]!.openOccurrences).toBe(1);
  });

  it('returns an empty list for a clean scan', () => {
    expect(buildConformance(makeScan({ findings: [] }))).toEqual([]);
  });
});

describe('lookups and ordering', () => {
  it('projectScans returns newest first', () => {
    const older = makeScan({ id: 'scn_old', createdAt: '2026-01-01T00:00:00.000Z' });
    const newer = makeScan({ id: 'scn_new', createdAt: '2026-02-01T00:00:00.000Z' });
    const scans = projectScans(makeWorkspace({ scans: [older, newer] }), 'prj_test1');
    expect(scans.map((scan) => scan.id)).toEqual(['scn_new', 'scn_old']);
  });

  it('latestScanByProject picks the newest per project', () => {
    const older = makeScan({ id: 'scn_old', createdAt: '2026-01-01T00:00:00.000Z' });
    const newer = makeScan({ id: 'scn_new', createdAt: '2026-02-01T00:00:00.000Z' });
    const map = latestScanByProject(makeWorkspace({ scans: [older, newer] }));
    expect(map.get('prj_test1')?.id).toBe('scn_new');
  });

  it('getProject and getScan return undefined for unknown ids', () => {
    const workspace = makeWorkspace();
    expect(getProject(workspace, 'nope')).toBeUndefined();
    expect(getScan(workspace, 'nope')).toBeUndefined();
    expect(getProject(workspace, 'prj_test1')?.name).toBe('Acme Store');
  });

  it('allFindings flattens every scan', () => {
    const workspace = makeWorkspace({
      scans: [makeScan(), makeScan({ id: 'scn_2', findings: [makeFinding({ id: 'f2' })] })],
    });
    expect(allFindings(workspace)).toHaveLength(2);
  });
});

describe('severityTrend', () => {
  it('returns scans chronologically with open counts only', () => {
    const first = makeScan({
      id: 'a',
      createdAt: '2026-01-01T00:00:00.000Z',
      findings: [makeFinding({ id: 'f1', status: 'open' })],
    });
    const second = makeScan({
      id: 'b',
      createdAt: '2026-02-01T00:00:00.000Z',
      findings: [makeFinding({ id: 'f2', status: 'fixed' })],
    });
    const trend = severityTrend([second, first]);
    expect(trend.map((point) => point.scanId)).toEqual(['a', 'b']);
    expect(trend[0]!.bySeverity.total).toBe(1);
    expect(trend[1]!.bySeverity.total).toBe(0);
  });
});

describe('searchFindings', () => {
  const findings = [
    makeFinding({
      id: 'a',
      message: 'Image is missing an alt attribute',
      selector: 'img#hero',
      snippet: '<img id="hero" src="h.jpg">',
    }),
    makeFinding({
      id: 'b',
      ruleId: 'link-name',
      ruleName: 'Links',
      message: 'Click here is vague',
      selector: 'a:nth-of-type(2)',
      snippet: '<a href="/catalogue">Click here</a>',
    }),
  ];

  it('returns everything for an empty query', () => {
    expect(searchFindings(findings, '   ')).toHaveLength(2);
  });

  it('matches across rule, message and selector', () => {
    expect(searchFindings(findings, 'hero').map((f) => f.id)).toEqual(['a']);
    expect(searchFindings(findings, 'vague').map((f) => f.id)).toEqual(['b']);
    expect(searchFindings(findings, 'link-name').map((f) => f.id)).toEqual(['b']);
  });

  it('searches captured evidence snippets too', () => {
    expect(searchFindings(findings, 'catalogue').map((f) => f.id)).toEqual(['b']);
  });

  it('is case-insensitive', () => {
    expect(searchFindings(findings, 'IMAGE')).toHaveLength(1);
  });
});
