/**
 * TEST FIXTURE. In-memory briefing and campaign stores used by tests only;
 * never import from application code. They mirror the contracts of
 * lib/briefing/store.ts.
 */

import { scheduledRunConfig, type Campaign, type CampaignStore } from '@/lib/briefing/campaigns'
import type { BriefingRecord, BriefingStore } from '@/lib/briefing/generate'

export class MemoryBriefingStore implements BriefingStore {
  rows = new Map<string, BriefingRecord>();
  saves = 0;
  async getByDate(date: string) {
    return this.rows.get(date) ?? null;
  }
  async getLatestBefore(date: string) {
    const earlier = [...this.rows.keys()].filter((d) => d < date).sort();
    const last = earlier[earlier.length - 1];
    return last === undefined ? null : this.rows.get(last) ?? null;
  }
  async save(record: BriefingRecord, { overwrite }: { overwrite: boolean }) {
    if (!overwrite && this.rows.has(record.briefingDate)) return 'exists' as const;
    this.rows.set(record.briefingDate, record);
    this.saves += 1;
    return 'saved' as const;
  }
}

export class MemoryCampaignStore implements CampaignStore {
  runs: { id: string; campaignId: string; state: 'requested' | 'claimed' | 'completed'; config: ReturnType<typeof scheduledRunConfig> }[] = [];
  failFor = new Set<string>();
  constructor(public campaigns: Campaign[]) {}
  async listActiveCampaigns() {
    return this.campaigns.filter((c) => c.active);
  }
  async campaignIdsWithOpenRuns() {
    return new Set(this.runs.filter((r) => r.state !== 'completed').map((r) => r.campaignId));
  }
  async queueRun(campaign: Campaign, nowIso: string) {
    if (this.failFor.has(campaign.id)) throw new Error('insert failed');
    const id = `run-${this.runs.length + 1}`;
    this.runs.push({ id, campaignId: campaign.id, state: 'requested', config: scheduledRunConfig(campaign) });
    const stored = this.campaigns.find((c) => c.id === campaign.id);
    if (stored) stored.lastQueuedAt = nowIso;
    return id;
  }
}

