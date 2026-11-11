// Run with: pnpm exec tsx --test lib/new-businesses/website-runs.test.ts
// No network or database: memory stores only. All businesses are fictional.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { MemoryNewBusinessStore } from './fixtures/memory-store';
import { MemoryWebsiteCheckStore } from './fixtures/memory-website-store';
import { rescoreStoredRows } from './import';
import { buildCheckClaimResponse, ingestCheckBatch, queueCheckRun, resolvedCheckRunIds, CHECK_RUN_SIZE, MAX_WAITING_CHECK_RUNS } from './website-runs';
import type { CheckBatch, CheckedBusiness } from './website-schema';

const OCT = { year: 2026, month: 10 };
const T0 = new Date('2026-11-10T15:00:00Z');
const RESTAURANT = 'Food Services - Restaurants & Other';

function license(name: string, category: string, address: string, phone: string | null = '(702) 555-0101') {
  return { index: 1, name, address, suite: null, city: 'Las Vegas', state: 'NV', zip: '89101', phone, category, dedupeKey: `${name}|${category}|${address}` };
}

/** Five businesses; the bakery holds two licenses. Scores: bakery 80, cafe 75, wholesaler 55, agent 30. */
async function setup() {
  const businesses = new MemoryNewBusinessStore();
  await businesses.storeRows('clark_county', OCT, [
    license('Fictional Bakery LLC', RESTAURANT, '100 Example St'),
    license('Fictional Bakery LLC', 'Retail - Group 1', '100 Example St'),
    license('Sample Cafe', RESTAURANT, '200 Demo Ave', '(702) 555-0102'),
    license('Example Wholesale Supply', 'Wholesale Trade', '300 Mock Rd', '(702) 555-0103'),
    license('Demo Realty Agent', 'Real Estate Salesperson', '400 Sample Blvd', '(702) 555-0104'),
    license('Rejected Example Shop', 'Retail - Group 2', '500 Test Way', '(702) 555-0105'),
  ]);
  await rescoreStoredRows(businesses, T0.toISOString());
  const rejected = businesses.byName('Rejected Example Shop')!;
  rejected.reviewStatus = 'rejected';
  const checks = new MemoryWebsiteCheckStore(businesses);
  return { businesses, checks };
}

function result(id: string, overrides: Partial<CheckedBusiness> = {}): CheckedBusiness {
  return { id, searches: ['"Name" Las Vegas', '"Name" 702-555-0101'], candidates: [], placeholder: false, outcome_claimed: 'none_found', ...overrides };
}

async function claimOne(checks: MemoryWebsiteCheckStore, now = T0) {
  await queueCheckRun(checks, 'dashboard', now);
  const claim = await buildCheckClaimResponse(checks, now);
  assert.ok(claim.run !== null);
  return claim;
}

describe('claim', () => {
  it('returns nothing when no run is queued', async () => {
    const { checks } = await setup();
    assert.deepEqual(await buildCheckClaimResponse(checks, T0), { run: null });
  });

  it('selects primary rows by lead score, then name, excluding rejected and archived businesses', async () => {
    const { checks } = await setup();
    const claim = await claimOne(checks);
    assert.ok(claim.run !== null);
    assert.deepEqual(claim.businesses.map((b) => b.name), ['Fictional Bakery LLC', 'Sample Cafe', 'Example Wholesale Supply', 'Demo Realty Agent']);
    assert.deepEqual(claim.businesses[0]!.licenses, [RESTAURANT, 'Retail - Group 1']);
    assert.ok(claim.businesses.length <= CHECK_RUN_SIZE);
    assert.equal(claim.rules.maxSearchesPerBusiness, 3);
  });

  it('sends only the business fields the runner needs', async () => {
    const { checks } = await setup();
    const claim = await claimOne(checks);
    assert.ok(claim.run !== null);
    assert.deepEqual(Object.keys(claim.businesses[0]!).sort(), ['address', 'city', 'id', 'licenses', 'name', 'phone', 'state', 'suite', 'zip']);
  });

  it('includes accepted businesses and checks low scores last rather than skipping them', async () => {
    const { businesses, checks } = await setup();
    businesses.byName('Demo Realty Agent')!.reviewStatus = 'accepted';
    const claim = await claimOne(checks);
    assert.ok(claim.run !== null);
    assert.equal(claim.businesses.at(-1)?.name, 'Demo Realty Agent');
  });

  it('links every license row of each business to the run, and a second run does not take them again', async () => {
    const { businesses, checks } = await setup();
    const first = await claimOne(checks);
    assert.ok(first.run !== null);
    const bakeryRows = [...businesses.rows.values()].filter((row) => row.name === 'Fictional Bakery LLC');
    assert.equal(bakeryRows.length, 2);
    assert.ok(bakeryRows.every((row) => row.websiteCheckRunId === first.run!.id));

    assert.deepEqual(await queueCheckRun(checks, 'dashboard', T0), { outcome: 'nothing_to_check' });
    // A run requested earlier, before the first one took every business:
    await checks.requestRun('schedule', T0.toISOString());
    const second = await buildCheckClaimResponse(checks, T0);
    assert.deepEqual(second, { run: null }, 'nothing is left: every eligible business is held by the first run');
    assert.match(checks.runs[1]!.errorSummary ?? '', /^Note: Nothing left to check/);
    assert.equal(checks.runs[1]!.state, 'completed');
  });

  it('fails a run claimed more than 2 hours ago and releases its businesses', async () => {
    const { businesses, checks } = await setup();
    const stale = await claimOne(checks, new Date('2026-11-10T10:00:00Z'));
    assert.ok(stale.run !== null);
    // Queued while the stale run still held every business, so request it directly.
    await checks.requestRun('dashboard', '2026-11-10T11:00:00.000Z');
    const fresh = await buildCheckClaimResponse(checks, new Date('2026-11-10T12:30:00Z'));
    assert.equal(checks.runs[0]!.state, 'failed');
    assert.match(checks.runs[0]!.errorSummary ?? '', /^System: Run abandoned: claimed at 2026-11-10T10:00:00.000Z/);
    assert.ok(fresh.run !== null, 'the released businesses are claimable again');
    assert.equal(fresh.businesses.length, 4);
    assert.ok([...businesses.rows.values()].filter((r) => r.reviewStatus !== 'rejected').every((r) => r.websiteCheckRunId === fresh.run!.id));
  });

  it('does not fail a run claimed under 2 hours ago', async () => {
    const { checks } = await setup();
    await claimOne(checks, new Date('2026-11-10T11:00:00Z'));
    await buildCheckClaimResponse(checks, new Date('2026-11-10T12:59:00Z'));
    assert.equal(checks.runs[0]!.state, 'claimed');
  });
});

describe('ingest', () => {
  async function claimed() {
    const ctx = await setup();
    const claim = await claimOne(ctx.checks);
    assert.ok(claim.run !== null);
    let rescores = 0;
    const deps = {
      store: ctx.checks,
      rescore: async () => {
        rescores += 1;
        await rescoreStoredRows(ctx.businesses, T0.toISOString());
      },
    };
    return { ...ctx, claim, deps, rescores: () => rescores };
  }

  it('rejects businesses outside the claimed run and writes nothing for them', async () => {
    const { businesses, claim, deps } = await claimed();
    assert.ok(claim.run !== null);
    const outsider = businesses.byName('Rejected Example Shop')!;
    const batch: CheckBatch = { runId: claim.run.id, businesses: [result(outsider.id)] };
    const out = await ingestCheckBatch(deps, batch, T0);
    assert.ok(out.ok);
    assert.deepEqual(out.rejected, [{ id: outsider.id, reasons: ['not_in_run'] }]);
    assert.equal(outsider.website, null);
  });

  it('writes the server-decided result to every license row, never review status or notes', async () => {
    const { businesses, claim, deps } = await claimed();
    assert.ok(claim.run !== null);
    const bakery = claim.businesses.find((b) => b.name === 'Fictional Bakery LLC')!;
    for (const row of [...businesses.rows.values()].filter((r) => r.name === 'Fictional Bakery LLC')) {
      row.reviewStatus = 'accepted';
      row.ownerNote = 'Call next week';
    }
    const out = await ingestCheckBatch(deps, { runId: claim.run.id, businesses: [result(bakery.id)] }, T0);
    assert.ok(out.ok);
    assert.deepEqual(out.checked, [{ id: bakery.id, websiteStatus: 'no_website' }]);
    const rows = [...businesses.rows.values()].filter((r) => r.name === 'Fictional Bakery LLC');
    assert.equal(rows.length, 2);
    for (const row of rows) {
      assert.equal(row.website?.status, 'no_website');
      assert.equal(row.reviewStatus, 'accepted');
      assert.equal(row.ownerNote, 'Call next week');
    }
  });

  it('rescores after results arrive: no website lifts the business by 20', async () => {
    const { businesses, claim, deps, rescores } = await claimed();
    assert.ok(claim.run !== null);
    const cafe = businesses.byName('Sample Cafe')!;
    assert.equal(cafe.rank?.score, 75);
    await ingestCheckBatch(deps, { runId: claim.run.id, businesses: [result(cafe.id)] }, T0);
    assert.equal(rescores(), 1);
    assert.equal(businesses.byName('Sample Cafe')!.rank?.score, 95);
    assert.equal(businesses.byName('Sample Cafe')!.rank?.version, 'new-business-rank-v3');
  });

  it('records a rescore failure on the run without failing the ingest', async () => {
    const { claim, checks } = await claimed();
    assert.ok(claim.run !== null);
    const out = await ingestCheckBatch(
      { store: checks, rescore: async () => { throw new Error('database timeout'); } },
      { runId: claim.run.id, businesses: [result(claim.businesses[0]!.id)] },
      T0,
    );
    assert.ok(out.ok);
    assert.match(checks.runs[0]!.errorSummary ?? '', /System: Lead scores were not updated after this batch: database timeout/);
  });

  it('rejects a duplicate inside one batch, counts results, and keeps notes and errors as typed lines', async () => {
    const { checks, claim, deps } = await claimed();
    assert.ok(claim.run !== null);
    const id = claim.businesses[1]!.id;
    const out = await ingestCheckBatch(deps, { runId: claim.run.id, businesses: [result(id), result(id)], runNotes: ['Skipped one: blocked'], runErrors: ['A helper call failed once'] }, T0);
    assert.ok(out.ok);
    assert.deepEqual(out.counts, { checked: 1, rejected: 0 });
    assert.deepEqual(out.rejected, [{ id, reasons: ['duplicate_in_batch'] }]);
    assert.match(checks.runs[0]!.errorSummary ?? '', /Runner: A helper call failed once/);
    assert.match(checks.runs[0]!.errorSummary ?? '', /Note: Skipped one: blocked/);
  });

  it('finishing a run releases the businesses that got no result', async () => {
    const { businesses, checks, claim, deps } = await claimed();
    assert.ok(claim.run !== null);
    const done = claim.businesses[0]!.id;
    const out = await ingestCheckBatch(deps, { runId: claim.run.id, businesses: [result(done)], finish: 'completed' }, T0);
    assert.ok(out.ok && out.runState === 'completed');
    assert.equal(checks.runs[0]!.state, 'completed');
    const unchecked = [...businesses.rows.values()].filter((r) => r.website === null);
    assert.ok(unchecked.every((r) => r.websiteCheckRunId === null));
    assert.equal(await checks.countUncheckedBusinesses(), 3);
  });

  it('returns 404 for an unknown run and 409 for a run that is not claimed', async () => {
    const { checks, claim, deps } = await claimed();
    assert.ok(claim.run !== null);
    const missing = await ingestCheckBatch(deps, { runId: '00000000-0000-4000-8000-0000000000ff', businesses: [] }, T0);
    assert.deepEqual(missing, { ok: false, status: 404, error: 'Run not found' });
    checks.runs[0]!.state = 'completed';
    const closed = await ingestCheckBatch(deps, { runId: claim.run.id, businesses: [] }, T0);
    assert.ok(!closed.ok && closed.status === 409);
  });
});

describe('queueing', () => {
  it('the cron queues at most one run while one is requested or claimed', async () => {
    const { checks } = await setup();
    assert.equal((await queueCheckRun(checks, 'schedule', T0)).outcome, 'queued');
    assert.deepEqual(await queueCheckRun(checks, 'schedule', T0), { outcome: 'run_open' });
    await buildCheckClaimResponse(checks, T0);
    assert.deepEqual(await queueCheckRun(checks, 'schedule', T0), { outcome: 'run_open' }, 'a claimed run also blocks the cron');
    assert.equal(checks.runs.length, 1);
  });

  it('the cron queues nothing when every eligible business is checked or held', async () => {
    const { checks } = await setup();
    await claimOne(checks);
    checks.runs[0]!.state = 'completed';
    assert.deepEqual(await queueCheckRun(checks, 'schedule', T0), { outcome: 'nothing_to_check' });
  });

  it('the page may queue up to three waiting runs', async () => {
    const { checks } = await setup();
    for (let i = 0; i < MAX_WAITING_CHECK_RUNS; i += 1) assert.equal((await queueCheckRun(checks, 'dashboard', T0)).outcome, 'queued');
    assert.deepEqual(await queueCheckRun(checks, 'dashboard', T0), { outcome: 'limit_reached' });
  });
});

describe('rules version 2 on stored results', () => {
  it('a stored version 1 has_website from a news article is re-derived to no_website on the next rescore', async () => {
    const { businesses } = await setup();
    const cafe = businesses.byName('Sample Cafe')!;
    // As version 1 stored it: an unlisted news host counted as the own domain.
    cafe.website = {
      status: 'has_website',
      url: 'https://www.example-news.test/story',
      rulesVersion: 'website-check-v1',
      checkedAt: T0.toISOString(),
      evidence: {
        searches: ['"Sample Cafe" Las Vegas', '"Sample Cafe" 702-555-0102'],
        candidates: [{ url: 'https://www.example-news.test/story', kindClaimed: 'other', hostKind: 'own_domain', excerpt: 'Sample Cafe has no online presence yet.', matched: ['name', 'street_address'], accepted: true }],
        placeholder: false,
        outcomeClaimed: 'found',
        note: null,
      },
    };
    await rescoreStoredRows(businesses, T0.toISOString());
    const after = businesses.byName('Sample Cafe')!;
    assert.equal(after.website?.status, 'no_website');
    assert.equal(after.website?.url, null);
    assert.equal(after.website?.rulesVersion, 'website-check-v2');
    assert.equal(after.rank?.score, 95, 'ranked with the re-derived status (+20, not -30)');
  });

  it('leaves a stored result unchanged when its evidence is incomplete', async () => {
    const { businesses } = await setup();
    const { rederiveStoredWebsiteResults } = await import('./import');
    const cafe = businesses.byName('Sample Cafe')!;
    cafe.website = { status: 'has_website', url: 'https://x.test/', rulesVersion: 'website-check-v1', checkedAt: T0.toISOString(), evidence: { searches: ['a', 'b'] } };
    const listed = await businesses.listRankableRows();
    assert.deepEqual(rederiveStoredWebsiteResults(listed).incomplete, [cafe.id]);
    await rescoreStoredRows(businesses, T0.toISOString());
    assert.equal(businesses.byName('Sample Cafe')!.website?.status, 'has_website');
    assert.equal(businesses.byName('Sample Cafe')!.website?.rulesVersion, 'website-check-v1');
  });

  it('a business submitted unsearched is stored as unclear with its note and not offered again', async () => {
    const { businesses, checks } = await setup();
    const claim = await claimOne(checks);
    assert.ok(claim.run !== null);
    const agent = claim.businesses.find((b) => b.name === 'Demo Realty Agent')!;
    const out = await ingestCheckBatch(
      { store: checks, rescore: async () => {} },
      { runId: claim.run.id, businesses: [{ id: agent.id, searches: [], candidates: [], placeholder: false, outcome_claimed: 'unclear', note: "Licensed under a person's name; not searched." }], finish: 'completed' },
      T0,
    );
    assert.ok(out.ok);
    const row = businesses.byName('Demo Realty Agent')!;
    assert.equal(row.website?.status, 'unclear');
    assert.equal((row.website?.evidence as { note: string }).note, "Licensed under a person's name; not searched.");
    await queueCheckRun(checks, 'dashboard', T0);
    const next = await buildCheckClaimResponse(checks, T0);
    assert.ok(next.run !== null);
    assert.ok(!next.businesses.some((b) => b.name === 'Demo Realty Agent'));
  });
});

describe('resolved website-check failures', () => {
  const failed = { id: 'f', state: 'failed' as const, checked: 0, finishedAt: '2026-11-10T20:00:00Z' };
  it('a failed check run is resolved by a later completed run with at least one business checked', () => {
    assert.deepEqual(resolvedCheckRunIds([failed, { id: 'c', state: 'completed', checked: 3, finishedAt: '2026-11-10T22:00:00Z' }]), new Set(['f']));
    assert.equal(resolvedCheckRunIds([failed, { id: 'c', state: 'completed', checked: 0, finishedAt: '2026-11-10T22:00:00Z' }]).size, 0);
    assert.equal(resolvedCheckRunIds([failed, { id: 'c', state: 'completed', checked: 3, finishedAt: '2026-11-10T19:00:00Z' }]).size, 0);
    assert.equal(resolvedCheckRunIds([failed, { id: 'c', state: 'claimed', checked: 3, finishedAt: null }]).size, 0);
    assert.equal(resolvedCheckRunIds([failed]).size, 0);
  });
});
