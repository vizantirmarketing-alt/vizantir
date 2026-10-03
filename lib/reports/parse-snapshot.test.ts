// Run with: NODE_OPTIONS=--conditions=react-server pnpm exec tsx --test lib/reports/parse-snapshot.test.ts
// The react-server condition lets `server-only` load outside Next.js.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { parseReportSnapshot } from './parse-snapshot';
import { buildReportSummary } from './summary';

const ga4Data = {
  sessions: 1200,
  totalUsers: 900,
  newUsers: 500,
  returningUsers: 400,
  newUserSessions: 600,
  returningUserSessions: 600,
  channelGroups: [{ channel: 'Organic Search', sessions: 400 }],
  topPages: [{ pagePath: '/', screenPageViews: 900, averageSessionDuration: 42 }],
  conversions: [{ eventName: 'form_submit', keyEvents: 4 }],
};

function baseSnapshot(version: number): Record<string, unknown> {
  return {
    version,
    generatedAt: '2026-10-04T11:00:00.000Z',
    period: {
      start: '2026-09-01',
      end: '2026-09-30',
      priorStart: '2026-08-01',
      priorEnd: '2026-08-31',
    },
    client: {
      id: 'c1',
      name: 'Acme',
      slug: 'acme',
      siteUrl: 'https://acme.example',
      careTier: 'care',
    },
    ga4: { ok: true, data: ga4Data },
    gsc: { ok: true, skipped: true },
    crux: { ok: true, kind: 'no_data' },
    uptime: { ok: false, reason: 'not_configured' },
    blockers: [],
    warnings: [],
  };
}

const newFields = {
  ga4Prior: { ok: true, data: { ...ga4Data, sessions: 1000, totalUsers: 800 } },
  audience: {
    ok: true,
    data: {
      countries: [{ label: 'United States', sessions: 1000 }],
      devices: [
        { label: 'mobile', sessions: 800 },
        { label: 'desktop', sessions: 400 },
      ],
      browsers: [{ label: 'Chrome', sessions: 900 }],
    },
  },
  psi: {
    ok: true,
    data: {
      strategy: 'mobile',
      fetchedAt: '2026-10-03T09:45:00.000Z',
      performanceScore: 87,
      lcp: { value: 2100, threshold: 2500, passed: true },
      tbt: { value: 310, threshold: 200, passed: false },
      cls: { value: 0.02, threshold: 0.1, passed: true },
    },
  },
};

describe('parseReportSnapshot versions', () => {
  it('parses a v3 snapshot unchanged, with no new fields', () => {
    const parsed = parseReportSnapshot(baseSnapshot(3));
    assert.notEqual(parsed, null);
    assert.equal(parsed?.version, 3);
    assert.equal('ga4Prior' in (parsed ?? {}), false);
    assert.equal('audience' in (parsed ?? {}), false);
    assert.equal('psi' in (parsed ?? {}), false);
  });

  it('ignores v4 fields on a v3 snapshot', () => {
    const parsed = parseReportSnapshot({ ...baseSnapshot(3), ...newFields });
    assert.notEqual(parsed, null);
    assert.equal(parsed?.ga4Prior, undefined);
    assert.equal(parsed?.audience, undefined);
    assert.equal(parsed?.psi, undefined);
  });

  it('parses a v4 snapshot with all new fields', () => {
    const parsed = parseReportSnapshot({ ...baseSnapshot(4), ...newFields });
    assert.notEqual(parsed, null);
    assert.equal(parsed?.version, 4);
    assert.equal(parsed?.ga4Prior?.ok, true);
    assert.equal(parsed?.audience?.ok, true);
    assert.equal(parsed?.psi?.ok, true);
    if (parsed?.psi?.ok) {
      assert.equal(parsed.psi.data.fetchedAt, '2026-10-03T09:45:00.000Z');
      assert.equal(parsed.psi.data.performanceScore, 87);
    }
  });

  it('parses a v4 snapshot with none of the new fields', () => {
    const parsed = parseReportSnapshot(baseSnapshot(4));
    assert.notEqual(parsed, null);
    assert.equal(parsed?.ga4Prior, undefined);
    assert.equal(parsed?.audience, undefined);
    assert.equal(parsed?.psi, undefined);
  });

  it('parses new-field failures as results, not as errors', () => {
    const parsed = parseReportSnapshot({
      ...baseSnapshot(4),
      ga4Prior: { ok: false, reason: 'http_error' },
      audience: { ok: false, reason: 'not_configured' },
      psi: { ok: false, reason: 'not_configured' },
      warnings: ['ga4_prior_failed', 'audience_failed', 'psi_unavailable'],
    });
    assert.notEqual(parsed, null);
    assert.equal(parsed?.ga4Prior?.ok, false);
    assert.deepEqual(parsed?.warnings, [
      'ga4_prior_failed',
      'audience_failed',
      'psi_unavailable',
    ]);
  });

  it('drops one malformed new field and keeps the rest', () => {
    const parsed = parseReportSnapshot({
      ...baseSnapshot(4),
      ...newFields,
      psi: {
        ok: true,
        data: { ...newFields.psi.data, performanceScore: 'high' },
      },
    });
    assert.notEqual(parsed, null);
    assert.equal(parsed?.psi, undefined);
    assert.equal(parsed?.ga4Prior?.ok, true);
    assert.equal(parsed?.audience?.ok, true);
  });

  it('still rejects unknown versions', () => {
    assert.equal(parseReportSnapshot(baseSnapshot(5)), null);
    assert.equal(parseReportSnapshot(baseSnapshot(1)), null);
  });
});

describe('buildReportSummary traffic sentence', () => {
  it('is identical to the prior output when there is no prior data', () => {
    const v3 = parseReportSnapshot(baseSnapshot(3));
    const v4NoPrior = parseReportSnapshot(baseSnapshot(4));
    assert.notEqual(v3, null);
    assert.notEqual(v4NoPrior, null);
    if (v3 === null || v4NoPrior === null) {
      return;
    }
    assert.deepEqual(buildReportSummary(v4NoPrior), buildReportSummary(v3));
    assert.equal(
      buildReportSummary(v3)[0],
      'Acme recorded 1,200 sessions from 900 people in September 2026.',
    );
  });

  it('adds the session change versus the prior month', () => {
    const parsed = parseReportSnapshot({ ...baseSnapshot(4), ...newFields });
    assert.notEqual(parsed, null);
    if (parsed === null) {
      return;
    }
    assert.equal(
      buildReportSummary(parsed)[0],
      'Acme recorded 1,200 sessions from 900 people in September 2026, up 20% from August 2026.',
    );
  });

  it('adds nothing when the prior value is zero or failed', () => {
    const zero = parseReportSnapshot({
      ...baseSnapshot(4),
      ga4Prior: { ok: true, data: { ...ga4Data, sessions: 0 } },
    });
    const failed = parseReportSnapshot({
      ...baseSnapshot(4),
      ga4Prior: { ok: false, reason: 'http_error' },
    });
    assert.notEqual(zero, null);
    assert.notEqual(failed, null);
    if (zero === null || failed === null) {
      return;
    }
    const expected =
      'Acme recorded 1,200 sessions from 900 people in September 2026.';
    assert.equal(buildReportSummary(zero)[0], expected);
    assert.equal(buildReportSummary(failed)[0], expected);
  });
});
