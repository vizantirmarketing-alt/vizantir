/**
 * One briefing cron tick: queue due campaigns, then generate today's briefing
 * if it is 7:00 or later locally and none exists. Idempotent: a second tick
 * on the same day queues nothing new (open runs and cadence block it) and
 * skips the briefing (it already exists). No direct I/O; dependencies are
 * injected.
 */

import { queueDueCampaigns, type CampaignStore, type QueueResult } from '@/lib/briefing/campaigns'
import type { ImportResult } from '@/lib/new-businesses/import'
import {
  generateScheduledBriefing,
  type GenerateDeps,
  type ScheduledBriefingResult,
} from '@/lib/briefing/generate'

export type BriefingCronResult = {
  campaigns: QueueResult | { error: string }
  newBusinesses?: ImportResult | { error: string }
  briefing: ScheduledBriefingResult | { error: string }
}

export async function runBriefingCron(deps: {
  campaigns: CampaignStore
  briefing: GenerateDeps
  /** At most one New Businesses import attempt per local day. */
  importNewBusinesses?: () => Promise<ImportResult>
}): Promise<BriefingCronResult> {
  // A campaign failure must not block the briefing, and vice versa.
  let campaigns: BriefingCronResult['campaigns']
  try {
    campaigns = await queueDueCampaigns(deps.campaigns, deps.briefing.now())
  } catch {
    campaigns = { error: 'Campaign queuing failed' }
  }

  // Runs before the briefing so today's import is counted. A failure is
  // recorded on the import row and never blocks the briefing.
  let newBusinesses: BriefingCronResult['newBusinesses']
  if (deps.importNewBusinesses) {
    try {
      newBusinesses = await deps.importNewBusinesses()
    } catch {
      newBusinesses = { error: 'New business import failed' }
    }
  }

  let briefing: BriefingCronResult['briefing']
  try {
    briefing = await generateScheduledBriefing(deps.briefing)
  } catch {
    briefing = { error: 'Briefing generation failed' }
  }

  return newBusinesses === undefined ? { campaigns, briefing } : { campaigns, newBusinesses, briefing }
}
