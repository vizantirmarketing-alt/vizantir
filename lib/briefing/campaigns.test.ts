// Run with: pnpm exec tsx --test lib/briefing/campaigns.test.ts
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  SCHEDULE_REQUESTED_BY,
  isCampaignDue,
  queueDueCampaigns,
  scheduledRunConfig,
  type Campaign,
} from './campaigns';
import { MemoryCampaignStore } from './fixtures/memory-stores';

const CAMPAIGN: Campaign = {
  id: '66666666-6666-4666-8666-666666666666',
  market: 'Fixture City, NV',
  industry: 'Fictional law firms',
  targetCount: 10,
  exclusions: ['excluded-firm.example.net'],
  cadenceDays: 7,
  active: true,
  lastQueuedAt: '2026-11-03T15:00:00.000Z', // Nov 3, 7:00 AM PST
};

describe('isCampaignDue', () => {
  it('is due when never queued', () => {
    assert.equal(isCampaignDue({ ...CAMPAIGN, lastQueuedAt: null }, new Date('2026-11-10T15:00:00Z'), false), true);
  });

  it('waits for the cadence in local calendar days', () => {
    assert.equal(isCampaignDue(CAMPAIGN, new Date('2026-11-09T23:00:00Z'), false), false); // Nov 9 local
    assert.equal(isCampaignDue(CAMPAIGN, new Date('2026-11-10T14:00:00Z'), false), true); // Nov 10, 6:00 AM PST
  });

  it('counts local days, not elapsed hours, across the daylight saving change', () => {
    const daily: Campaign = { ...CAMPAIGN, cadenceDays: 1, lastQueuedAt: '2026-10-31T14:00:00.000Z' }; // Oct 31, 7:00 AM PDT
    // Nov 1 at 6:00 AM PST is 23 elapsed hours later but the next local day.
    assert.equal(isCampaignDue(daily, new Date('2026-11-01T14:00:00Z'), false), true);
    // Later the same local day is not due again.
    const queuedNov1: Campaign = { ...daily, lastQueuedAt: '2026-11-01T14:00:00.000Z' };
    assert.equal(isCampaignDue(queuedNov1, new Date('2026-11-01T23:00:00Z'), false), false);
  });

  it('is never due while paused or while a run is open', () => {
    assert.equal(isCampaignDue({ ...CAMPAIGN, active: false, lastQueuedAt: null }, new Date('2026-11-10T15:00:00Z'), false), false);
    assert.equal(isCampaignDue({ ...CAMPAIGN, lastQueuedAt: null }, new Date('2026-11-10T15:00:00Z'), true), false);
  });

  it('puts the campaign id in the run config', () => {
    assert.deepEqual(scheduledRunConfig(CAMPAIGN), {
      market: 'Fixture City, NV',
      industry: 'Fictional law firms',
      targetCount: 10,
      exclusions: ['excluded-firm.example.net'],
      campaignId: CAMPAIGN.id,
    });
    assert.equal(SCHEDULE_REQUESTED_BY, 'schedule');
  });
});

describe('queueDueCampaigns', () => {
  it('queues due campaigns and skips the rest', async () => {
    const due = { ...CAMPAIGN, lastQueuedAt: null };
    const notDue = { ...CAMPAIGN, id: '77777777-7777-4777-8777-777777777777', lastQueuedAt: '2026-11-09T15:00:00.000Z' };
    const paused = { ...CAMPAIGN, id: '88888888-8888-4888-8888-888888888888', active: false, lastQueuedAt: null };
    const store = new MemoryCampaignStore([due, notDue, paused]);
    const result = await queueDueCampaigns(store, new Date('2026-11-10T15:00:00Z'));
    assert.deepEqual(result.queued, [{ campaignId: due.id, runId: 'run-1' }]);
    assert.equal(result.notDue, 1);
    assert.equal(store.runs[0]?.config.campaignId, due.id);
  });

  it('keeps going when one campaign fails', async () => {
    const a = { ...CAMPAIGN, lastQueuedAt: null };
    const b = { ...CAMPAIGN, id: '99999999-9999-4999-8999-999999999999', lastQueuedAt: null };
    const store = new MemoryCampaignStore([a, b]);
    store.failFor.add(a.id);
    const result = await queueDueCampaigns(store, new Date('2026-11-10T15:00:00Z'));
    assert.deepEqual(result.failed, [{ campaignId: a.id }]);
    assert.equal(result.queued[0]?.campaignId, b.id);
  });
});
