// Run with: pnpm exec tsx --test lib/prospects/claim.test.ts
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { buildClaimResponse, type ClaimedRun, type ProspectClaimStore } from './claim';
import { FIXTURE_RUN_CONFIG, FIXTURE_RUN_ID } from './fixtures/ingest-batch.fixture';
import { PROSPECT_FACTORS, RUBRIC_VERSION } from './rubric';

const NOW = new Date('2026-11-10T08:00:00.000Z');

const RUN: ClaimedRun = {
  id: FIXTURE_RUN_ID,
  config: FIXTURE_RUN_CONFIG,
  requestedAt: '2026-11-10T07:48:03.477Z',
  claimedAt: NOW.toISOString(),
};

function store(run: ClaimedRun | null, domains: string[] | Error): ProspectClaimStore & { claims: number } {
  const state = {
    claims: 0,
    async claimOldestRequestedRun() {
      state.claims += 1;
      return run;
    },
    async listKnownDomains() {
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
