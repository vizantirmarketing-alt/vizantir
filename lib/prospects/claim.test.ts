// Run with: pnpm exec tsx --test lib/prospects/claim.test.ts
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  ABANDONED_RUN_HOURS,
  abandonedCutoff,
  abandonedReasonLine,
  buildClaimResponse,
  type ClaimedRun,
  type ProspectClaimStore,
} from './claim';
import { splitRunSummary } from './ingest';
import { FIXTURE_RUN_CONFIG, FIXTURE_RUN_ID } from './fixtures/ingest-batch.fixture';
import { PROSPECT_FACTORS, RUBRIC_VERSION } from './rubric';

const NOW = new Date('2026-11-10T08:00:00.000Z');

const RUN: ClaimedRun = {
  id: FIXTURE_RUN_ID,
  config: FIXTURE_RUN_CONFIG,
  requestedAt: '2026-11-10T07:48:03.477Z',
  claimedAt: NOW.toISOString(),
};

type FakeClaimStore = ProspectClaimStore & {
  claims: number;
  calls: string[];
  abandonedCutoffs: string[];
};

function store(run: ClaimedRun | null, domains: string[] | Error): FakeClaimStore {
  const state: FakeClaimStore = {
    claims: 0,
    calls: [],
    abandonedCutoffs: [],
    async failAbandonedRuns(cutoffIso) {
      state.calls.push('failAbandoned');
      state.abandonedCutoffs.push(cutoffIso);
      return 0;
    },
    async claimOldestRequestedRun() {
      state.calls.push('claim');
      state.claims += 1;
      return run;
    },
    async listKnownDomains() {
      state.calls.push('listKnown');
      if (domains instanceof Error) throw domains;
      return domains;
    },
  };
  return state;
}

describe('buildClaimResponse', () => {
  it('includes the known prospect domains, sorted and de-duplicated', async () => {
    const response = await buildClaimResponse(
      store(RUN, ['example.org', 'example.com', 'shop.example.net', 'example.com']),
      NOW,
    );
    assert.ok(response.run !== null && 'knownDomains' in response);
    assert.deepEqual(response.knownDomains, ['example.com', 'example.org', 'shop.example.net']);
  });

  it('keeps the rest of the response unchanged', async () => {
    const response = await buildClaimResponse(store(RUN, []), NOW);
    assert.ok(response.run !== null && 'rubric' in response);
    assert.deepEqual(response.run, RUN);
    assert.equal(response.rubric.version, RUBRIC_VERSION);
    assert.deepEqual(response.rubric.ratings, ['unknown', 'none', 'weak', 'strong']);
    assert.deepEqual(response.rubric.factors.map((factor) => factor.key), [...PROSPECT_FACTORS]);
    assert.deepEqual(Object.keys(response).sort(), ['knownDomains', 'rubric', 'run']);
    assert.deepEqual(response.knownDomains, []);
  });

  it('returns run null when nothing is queued', async () => {
    assert.deepEqual(await buildClaimResponse(store(null, ['example.com']), NOW), { run: null });
  });

  it('does not claim a run if the known domains cannot be listed', async () => {
    const failing = store(RUN, new Error('db down'));
    await assert.rejects(buildClaimResponse(failing, NOW));
    assert.equal(failing.claims, 0);
  });
});

describe('rubric v2 in claim', () => {
  it('returns a description for every factor', async () => {
    const response = await buildClaimResponse(store(RUN, []), NOW);
    assert.ok(response.run !== null && 'rubric' in response);
    assert.equal(response.rubric.version, 'prospect-rubric-v2');
    for (const factor of response.rubric.factors) {
      assert.ok(factor.description.length > 20, factor.key);
    }
    const navigation = response.rubric.factors.find((f) => f.key === 'navigation_conversion_friction');
    assert.match(navigation?.description ?? '', /two distinct pages/);
    const performance = response.rubric.factors.find((f) => f.key === 'performance_technical_issues');
    assert.match(performance?.description ?? '', /Set only by the server/);
  });
});

describe('abandoned runs', () => {
  it('fails runs claimed more than two hours ago before claiming the next run', async () => {
    const fake = store(RUN, []);
    await buildClaimResponse(fake, NOW);
    assert.deepEqual(fake.calls, ['failAbandoned', 'listKnown', 'claim']);
    assert.deepEqual(fake.abandonedCutoffs, ['2026-11-10T06:00:00.000Z']);
  });

  it('also clears abandoned runs when nothing is queued', async () => {
    const fake = store(null, []);
    assert.deepEqual(await buildClaimResponse(fake, NOW), { run: null });
    assert.equal(fake.calls[0], 'failAbandoned');
  });

  it('computes the cutoff and a clear reason line', () => {
    assert.equal(ABANDONED_RUN_HOURS, 2);
    assert.equal(abandonedCutoff(NOW).toISOString(), '2026-11-10T06:00:00.000Z');
    const line = abandonedReasonLine('2026-11-10T05:12:00.000Z');
    assert.match(line, /^System: Run abandoned: claimed at 2026-11-10T05:12:00\.000Z/);
    assert.match(line, /within 2 hours/);
    assert.deepEqual(splitRunSummary(line).errors.length, 1);
  });
});
