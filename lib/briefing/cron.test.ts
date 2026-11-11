// Run with: pnpm exec tsx --test lib/briefing/cron.test.ts
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { Campaign } from './campaigns';
import { runBriefingCron } from './cron';
import { fixtureInputs } from './fixtures/briefing-inputs.fixture';
import { MemoryBriefingStore, MemoryCampaignStore } from './fixtures/memory-stores';
import type { GenerateDeps } from './generate';

const CAMPAIGN: Campaign = {
  id: '66666666-6666-4666-8666-666666666666',
  market: 'Fixture City, NV',
  industry: 'Fictional law firms',
  targetCount: 10,
  exclusions: [],
  cadenceDays: 1,
  active: true,
  lastQueuedAt: null,
};

function briefingDeps(store: MemoryBriefingStore, now: string): GenerateDeps {
  return {
    store,
    sources: { load: async () => fixtureInputs() },
    callModel: null,
    now: () => new Date(now),
  };
}

describe('runBriefingCron', () => {
  it('is idempotent across the two daily ticks in standard time', async () => {
    const campaigns = new MemoryCampaignStore([{ ...CAMPAIGN }]);
    const briefings = new MemoryBriefingStore();

    // 14:00 UTC = 6:00 AM PST: queue the campaign, too early for the briefing.
    const first = await runBriefingCron({ campaigns, briefing: briefingDeps(briefings, '2026-12-15T14:00:00Z') });
    // 15:00 UTC = 7:00 AM PST: nothing new to queue, briefing generated.
    const second = await runBriefingCron({ campaigns, briefing: briefingDeps(briefings, '2026-12-15T15:00:00Z') });
    // A retry later the same day changes nothing.
    const third = await runBriefingCron({ campaigns, briefing: briefingDeps(briefings, '2026-12-15T15:05:00Z') });

    assert.equal('queued' in first.campaigns ? first.campaigns.queued.length : -1, 1);
    assert.deepEqual('action' in first.briefing ? first.briefing : null, { action: 'skipped', reason: 'before_local_hour', briefingDate: '2026-12-15' });
    assert.equal('queued' in second.campaigns ? second.campaigns.queued.length : -1, 0);
    assert.equal('action' in second.briefing ? second.briefing.action : null, 'generated');
    assert.equal('queued' in third.campaigns ? third.campaigns.queued.length : -1, 0);
    assert.equal('action' in third.briefing && third.briefing.action === 'skipped' ? third.briefing.reason : null, 'already_exists');
    assert.equal(campaigns.runs.length, 1);
    assert.equal(briefings.saves, 1);
  });

  it('generates on the first daylight-time tick and skips the second', async () => {
    const briefings = new MemoryBriefingStore();
    const campaigns = new MemoryCampaignStore([]);
    const first = await runBriefingCron({ campaigns, briefing: briefingDeps(briefings, '2026-07-15T14:00:00Z') });
    const second = await runBriefingCron({ campaigns, briefing: briefingDeps(briefings, '2026-07-15T15:00:00Z') });
    assert.equal('action' in first.briefing ? first.briefing.action : null, 'generated');
    assert.equal('action' in second.briefing ? second.briefing.action : null, 'skipped');
    assert.equal(briefings.saves, 1);
  });

  it('still generates the briefing when campaign queuing fails', async () => {
    const campaigns = new MemoryCampaignStore([]);
    campaigns.listActiveCampaigns = async () => {
      throw new Error('db down');
    };
    const result = await runBriefingCron({ campaigns, briefing: briefingDeps(new MemoryBriefingStore(), '2026-12-15T15:00:00Z') });
    assert.deepEqual(result.campaigns, { error: 'Campaign queuing failed' });
    assert.equal('action' in result.briefing ? result.briefing.action : null, 'generated');
  });
});

describe('runBriefingCron with the New Businesses import', () => {
  it('imports before generating the briefing', async () => {
    const order: string[] = [];
    const briefings = new MemoryBriefingStore();
    const deps = briefingDeps(briefings, '2026-12-15T15:00:00Z');
    const loadSources = deps.sources.load;
    deps.sources = { load: async (opts) => { order.push('briefing'); return loadSources(opts); } };
    const result = await runBriefingCron({
      campaigns: new MemoryCampaignStore([]),
      briefing: deps,
      importNewBusinesses: async () => {
        order.push('import');
        return { outcome: 'up_to_date', period: { year: 2026, month: 11 } };
      },
    });
    assert.deepEqual(order, ['import', 'briefing']);
    assert.deepEqual(result.newBusinesses, { outcome: 'up_to_date', period: { year: 2026, month: 11 } });
  });

  it('never lets an import failure break the briefing', async () => {
    const result = await runBriefingCron({
      campaigns: new MemoryCampaignStore([]),
      briefing: briefingDeps(new MemoryBriefingStore(), '2026-12-15T15:00:00Z'),
      importNewBusinesses: async () => {
        throw new Error('boom');
      },
    });
    assert.deepEqual(result.newBusinesses, { error: 'New business import failed' });
    assert.equal('action' in result.briefing ? result.briefing.action : null, 'generated');
  });
});

describe('runBriefingCron with website check queuing', () => {
  it('queues after the import and before the briefing', async () => {
    const order: string[] = [];
    const briefings = new MemoryBriefingStore();
    const deps = briefingDeps(briefings, '2026-12-15T15:00:00Z');
    const loadSources = deps.sources.load;
    deps.sources = { load: async (opts) => { order.push('briefing'); return loadSources(opts); } };
    const result = await runBriefingCron({
      campaigns: new MemoryCampaignStore([]),
      briefing: deps,
      importNewBusinesses: async () => {
        order.push('import');
        return { outcome: 'up_to_date', period: { year: 2026, month: 11 } };
      },
      queueWebsiteChecks: async () => {
        order.push('queue');
        return { outcome: 'queued', runId: 'run-1' };
      },
    });
    assert.deepEqual(order, ['import', 'queue', 'briefing']);
    assert.deepEqual(result.websiteChecks, { outcome: 'queued', runId: 'run-1' });
  });

  it('a queuing failure blocks neither the import nor the briefing', async () => {
    let imported = false;
    const result = await runBriefingCron({
      campaigns: new MemoryCampaignStore([]),
      briefing: briefingDeps(new MemoryBriefingStore(), '2026-12-15T15:00:00Z'),
      importNewBusinesses: async () => {
        imported = true;
        return { outcome: 'up_to_date', period: { year: 2026, month: 11 } };
      },
      queueWebsiteChecks: async () => {
        throw new Error('boom');
      },
    });
    assert.equal(imported, true);
    assert.deepEqual(result.websiteChecks, { error: 'Website check queuing failed' });
    assert.equal('action' in result.briefing ? result.briefing.action : null, 'generated');
  });

  it('queues at most one run per tick when wired to the real queue rule', async () => {
    const { MemoryNewBusinessStore } = await import('@/lib/new-businesses/fixtures/memory-store');
    const { MemoryWebsiteCheckStore } = await import('@/lib/new-businesses/fixtures/memory-website-store');
    const { rescoreStoredRows } = await import('@/lib/new-businesses/import');
    const { queueCheckRun } = await import('@/lib/new-businesses/website-runs');
    const businesses = new MemoryNewBusinessStore();
    await businesses.storeRows('clark_county', { year: 2026, month: 10 }, [
      { index: 1, name: 'Fictional Bakery LLC', address: '100 Example St', suite: null, city: 'Las Vegas', state: 'NV', zip: '89101', phone: '(702) 555-0101', category: 'Food Services - Restaurants & Other', dedupeKey: 'a' },
    ]);
    await rescoreStoredRows(businesses, '2026-12-15T15:00:00.000Z');
    const checks = new MemoryWebsiteCheckStore(businesses);
    for (let tick = 0; tick < 3; tick += 1) {
      await runBriefingCron({
        campaigns: new MemoryCampaignStore([]),
        briefing: briefingDeps(new MemoryBriefingStore(), '2026-12-15T15:00:00Z'),
        queueWebsiteChecks: () => queueCheckRun(checks, 'schedule', new Date('2026-12-15T15:00:00Z')),
      });
    }
    assert.equal(checks.runs.length, 1);
  });
});
