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
