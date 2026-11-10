/**
 * Scheduled prospect research campaigns. No direct I/O: the store is
 * injected (lib/briefing/store.ts in production).
 *
 * A campaign is due when it is active, has no requested or claimed run of its
 * own, and at least cadenceDays local calendar days have passed since it was
 * last queued. Counting local days rather than elapsed hours keeps a daily
 * campaign daily even though the cron fires at slightly different UTC times
 * across daylight saving.
 */

import { localDateString, localDaysBetween } from '@/lib/briefing/dates'

export const SCHEDULE_REQUESTED_BY = 'schedule'
export const SCHEDULE_SOURCE = 'schedule'

export type Campaign = {
  id: string
  market: string
  industry: string
  targetCount: number
  exclusions: string[]
  cadenceDays: number
  active: boolean
  lastQueuedAt: string | null
}

export function isCampaignDue(campaign: Campaign, now: Date, hasOpenRun: boolean): boolean {
  if (!campaign.active || hasOpenRun) {
    return false
  }
  if (campaign.lastQueuedAt === null) {
    return true
  }
  const last = Date.parse(campaign.lastQueuedAt)
  if (Number.isNaN(last)) {
    return true
  }
  const elapsedDays = localDaysBetween(localDateString(new Date(last)), localDateString(now))
  return elapsedDays >= campaign.cadenceDays
}

/** The prospect_runs.config a scheduled run is queued with. */
export function scheduledRunConfig(campaign: Campaign): {
  market: string
  industry: string
  targetCount: number
  exclusions: string[]
  campaignId: string
} {
  return {
    market: campaign.market,
    industry: campaign.industry,
    targetCount: campaign.targetCount,
    exclusions: campaign.exclusions,
    campaignId: campaign.id,
  }
}

export interface CampaignStore {
  listActiveCampaigns(): Promise<Campaign[]>
  /** Campaign ids that already have a requested or claimed run. */
  campaignIdsWithOpenRuns(): Promise<Set<string>>
  /**
   * Inserts a requested prospect_runs row (requested_by and source
   * 'schedule', config from scheduledRunConfig) and sets the campaign's
   * last_queued_at. Returns the new run id.
   */
  queueRun(campaign: Campaign, nowIso: string): Promise<string>
}

export type QueueResult = {
  queued: { campaignId: string; runId: string }[]
  notDue: number
  failed: { campaignId: string }[]
}

export async function queueDueCampaigns(store: CampaignStore, now: Date): Promise<QueueResult> {
  const campaigns = await store.listActiveCampaigns()
  const open = await store.campaignIdsWithOpenRuns()
  const result: QueueResult = { queued: [], notDue: 0, failed: [] }

  for (const campaign of campaigns) {
    if (!isCampaignDue(campaign, now, open.has(campaign.id))) {
      result.notDue += 1
      continue
    }
    try {
      const runId = await store.queueRun(campaign, now.toISOString())
      result.queued.push({ campaignId: campaign.id, runId })
      open.add(campaign.id)
    } catch {
      result.failed.push({ campaignId: campaign.id })
    }
  }
  return result
}
