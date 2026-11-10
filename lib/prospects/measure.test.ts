// Run with: pnpm exec tsx --test lib/prospects/measure.test.ts
// No network or database: the store and the PageSpeed call are injected.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { FIXTURE_RUN_ID } from './fixtures/ingest-batch.fixture';
import {
  PERFORMANCE_FACTOR,
  measureProspect,
  measureProspectById,
  parseMeasureBody,
  ratingFromPerformanceScore,
  type FetchMeasurementResult,
  type MeasureDeps,
  type MeasureProspectRecord,
  type MeasurementWrite,
  type PerformanceMeasurement,
} from './measure';
import { RUBRIC_VERSION, scoreProspect, type FactorRatings } from './rubric';

const NOW = new Date('2026-11-10T08:30:00.000Z');

const BASE_RATINGS: FactorRatings = {
  market_industry_match: 'strong',
  business_complexity: 'strong',
  custom_web_relevance: 'weak',
  growth_signals: 'unknown',
  navigation_conversion_friction: 'none',
  performance_technical_issues: 'unknown',
  content_information_architecture: 'strong',
  integration_cms_opportunity: 'weak',
};

const PROSPECT: MeasureProspectRecord = {
  id: 'prospect-1',
  domain: 'example.com',
  factorRatings: BASE_RATINGS,
  latestRunId: FIXTURE_RUN_ID,
  // Researched under v1: measuring must not relabel it as re-researched.
  rubricVersion: 'prospect-rubric-v1',
};

function measurement(score: number): PerformanceMeasurement {
  return {
    performanceScore: score,
    lcpMs: 4812.4,
    tbtMs: 610,
    cls: 0.123,
    fetchedAt: '2026-11-10T08:29:41.000Z',
  };
}

function harness(options: {
  prospects?: MeasureProspectRecord[];
  configured?: boolean;
  result?: FetchMeasurementResult;
}) {
  const writes: MeasurementWrite[] = [];
  const fetched: string[] = [];
  const lookups: string[] = [];
  const deps: MeasureDeps = {
    store: {
      async findProspectByDomain(domain) {
        lookups.push(domain);
        return (options.prospects ?? [PROSPECT]).find((p) => p.domain === domain) ?? null;
      },
      async saveMeasurement(write) {
        writes.push(write);
      },
    },
    pageSpeedConfigured: options.configured ?? true,
    async fetchMeasurement(url) {
      fetched.push(url);
      return options.result ?? { ok: true, data: measurement(42) };
    },
    now: () => NOW,
  };
  return { deps, writes, fetched, lookups };
}

describe('ratingFromPerformanceScore', () => {
  it('rates below 50 as strong, 50 to 89 as weak, 90 and above as none', () => {
    assert.equal(ratingFromPerformanceScore(0), 'strong');
    assert.equal(ratingFromPerformanceScore(49), 'strong');
    assert.equal(ratingFromPerformanceScore(49.9), 'strong');
    assert.equal(ratingFromPerformanceScore(50), 'weak');
    assert.equal(ratingFromPerformanceScore(89), 'weak');
    assert.equal(ratingFromPerformanceScore(89.9), 'weak');
    assert.equal(ratingFromPerformanceScore(90), 'none');
    assert.equal(ratingFromPerformanceScore(100), 'none');
  });
});

describe('measureProspect', () => {
  it('sets the performance rating from the score and recomputes scores with the rubric', async () => {
    const { deps, writes, fetched } = harness({});
    const result = await measureProspect('https://www.Example.com/about', deps);

    assert.equal(fetched.length, 1);
    assert.equal(fetched[0], 'https://example.com/');
    assert.equal(result.ok, true);
    if (!result.ok) return;

    const expectedRatings = { ...BASE_RATINGS, performance_technical_issues: 'strong' as const };
    const expected = scoreProspect(expectedRatings);
    assert.equal(result.rating, 'strong');
    assert.equal(result.performanceScore, 42);
    assert.equal(result.fitScore, expected.fit.score);
    assert.equal(result.opportunityScore, expected.opportunity.score);
    assert.equal(result.confidence, expected.confidence);

    // Before: opportunity 0 + 0 + 20 + 7.5 = 28 (27.5 rounded). After: + 30.
    assert.equal(scoreProspect(BASE_RATINGS).opportunity.score, 28);
    assert.equal(result.opportunityScore, 58);

    assert.equal(writes.length, 1);
    const write = writes[0];
    assert.ok(write);
    assert.deepEqual(write.factorRatings, expectedRatings);
    assert.equal(write.rubricVersion, 'prospect-rubric-v1');
    assert.notEqual(write.rubricVersion, RUBRIC_VERSION);
    assert.equal(write.runId, FIXTURE_RUN_ID);
    assert.equal(write.evidence.factorKey, PERFORMANCE_FACTOR);
    assert.equal(write.evidence.kind, 'measurement');
    assert.equal(write.evidence.sourceUrl, 'https://example.com/');
    assert.equal(write.evidence.observedAt, '2026-11-10T08:29:41.000Z');
    assert.match(write.evidence.claim, /performance score 42\/100/);
    assert.match(write.evidence.claim, /LCP 4,812 ms/);
    assert.match(write.evidence.claim, /TBT 610 ms/);
    assert.match(write.evidence.claim, /CLS 0\.12/);
    assert.match(write.evidence.claim, /Lab data/);
  });

  it('turns a null opportunity score into a real one once the factor is known', async () => {
    const sparse: MeasureProspectRecord = {
      ...PROSPECT,
      factorRatings: {
        ...BASE_RATINGS,
        navigation_conversion_friction: 'unknown',
        integration_cms_opportunity: 'unknown',
      },
    };
    // Unknown opportunity weight before: 35 + 30 + 15 = 80, so the score is null.
    assert.equal(scoreProspect(sparse.factorRatings).opportunity.score, null);

    const { deps } = harness({ prospects: [sparse], result: { ok: true, data: measurement(95) } });
    const result = await measureProspect('example.com', deps);
    assert.equal(result.ok, true);
    if (!result.ok) return;
    // Unknown weight after: 35 + 15 = 50, which is not more than half.
    assert.equal(result.rating, 'none');
    assert.equal(result.opportunityScore, 20);
  });

  it('refuses a domain that is not already a prospect, without measuring', async () => {
    const { deps, writes, fetched } = harness({});
    const result = await measureProspect('not-a-prospect.example.org', deps);
    assert.deepEqual(result, { ok: false, status: 404, error: 'No prospect with this domain' });
    assert.equal(fetched.length, 0);
    assert.equal(writes.length, 0);
  });

  it('refuses invalid domains and IP addresses before any lookup', async () => {
    for (const raw of ['http://10.0.0.1', 'localhost', 'ftp://example.com', '']) {
      const { deps, lookups, fetched } = harness({});
      const result = await measureProspect(raw, deps);
      assert.equal(result.ok ? null : result.status, 400);
      assert.equal(lookups.length, 0);
      assert.equal(fetched.length, 0);
    }
  });

  it('returns 503 and leaves the factor unknown when PageSpeed is not configured', async () => {
    const { deps, writes, fetched } = harness({ configured: false });
    const result = await measureProspect('example.com', deps);
    assert.equal(result.ok, false);
    assert.equal(result.ok ? null : result.status, 503);
    assert.equal(result.ok ? null : result.reason, 'not_configured');
    assert.equal(fetched.length, 0);
    assert.equal(writes.length, 0);
  });

  it('returns a clear error and writes nothing when the measurement fails', async () => {
    const { deps, writes } = harness({ result: { ok: false, reason: 'rate_limited', status: 429 } });
    const result = await measureProspect('example.com', deps);
    assert.equal(result.ok ? null : result.status, 502);
    assert.equal(result.ok ? null : result.reason, 'rate_limited (HTTP 429)');
    assert.equal(writes.length, 0);
  });

  it('treats a not_configured result from the fetcher as 503', async () => {
    const { deps, writes } = harness({ result: { ok: false, reason: 'not_configured' } });
    const result = await measureProspect('example.com', deps);
    assert.equal(result.ok ? null : result.status, 503);
    assert.equal(writes.length, 0);
  });

  it('refuses a prospect with no run to attach evidence to', async () => {
    const orphan = { ...PROSPECT, latestRunId: null };
    const { deps, fetched } = harness({ prospects: [orphan] });
    const result = await measureProspect('example.com', deps);
    assert.equal(result.ok ? null : result.status, 409);
    assert.equal(fetched.length, 0);
  });
});

describe('parseMeasureBody', () => {
  it('accepts only a domain', () => {
    assert.deepEqual(parseMeasureBody('{"domain":"example.com"}'), { ok: true, domain: 'example.com' });
  });

  it('rejects caller-supplied ratings, scores, URLs and other fields', () => {
    for (const body of [
      { domain: 'example.com', rating: 'strong' },
      { domain: 'example.com', performanceScore: 12 },
      { domain: 'example.com', url: 'https://other.example.net/' },
      { url: 'https://example.com/' },
      {},
    ]) {
      const result = parseMeasureBody(JSON.stringify(body));
      assert.equal(result.ok ? null : result.status, 400, JSON.stringify(body));
    }
  });

  it('rejects malformed and oversized bodies', () => {
    assert.equal(parseMeasureBody('{').ok, false);
    const big = parseMeasureBody(JSON.stringify({ domain: 'x'.repeat(5000) }));
    assert.equal(big.ok ? null : big.status, 413);
  });
});

describe('measureProspectById (owner Measure performance action)', () => {
  function byIdDeps(domains: Record<string, string>) {
    const { deps, writes, fetched } = harness({});
    const lookups: string[] = [];
    return {
      deps: {
        ...deps,
        async findDomainById(id: string) {
          lookups.push(id);
          return domains[id] ?? null;
        },
      },
      writes,
      fetched,
      lookups,
    };
  }

  const ID = '7c9e6679-7425-40de-944b-e07fc1f90ae7';

  it('measures the prospect behind the id', async () => {
    const { deps, writes, fetched } = byIdDeps({ [ID]: 'example.com' });
    const result = await measureProspectById(ID, deps);
    assert.equal(result.ok, true);
    assert.deepEqual(fetched, ['https://example.com/']);
    assert.equal(writes.length, 1);
  });

  it('rejects a malformed id without a lookup', async () => {
    const { deps, lookups } = byIdDeps({});
    const result = await measureProspectById('not-a-uuid', deps);
    assert.equal(result.ok ? null : result.status, 400);
    assert.equal(lookups.length, 0);
  });

  it('returns 404 for an unknown id without measuring', async () => {
    const { deps, fetched } = byIdDeps({});
    const result = await measureProspectById(ID, deps);
    assert.equal(result.ok ? null : result.status, 404);
    assert.equal(fetched.length, 0);
  });

  it('passes through the unconfigured key error', async () => {
    const base = byIdDeps({ [ID]: 'example.com' });
    const result = await measureProspectById(ID, { ...base.deps, pageSpeedConfigured: false });
    assert.equal(result.ok ? null : result.status, 503);
    assert.equal(base.writes.length, 0);
  });
});
