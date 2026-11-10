/**
 * One briefing cron tick: queue due campaigns, then generate today's briefing
 * if it is 7:00 or later locally and none exists. Idempotent: a second tick
 * on the same day queues nothing new (open runs and cadence block it) and
 * skips the briefing (it already exists). No direct I/O; dependencies are
 * injected.
 */

import { queueDueCampaigns, type CampaignStore, type QueueResult } from '@/lib/briefing/campaigns'
import {
  generateScheduledBriefing,
  type GenerateDeps,
  type ScheduledBriefingResult,
} from '@/lib/briefing/generate'

export type BriefingCronResult = {
  campaigns: QueueResult | { error: string }
  briefing: ScheduledBriefingResult | { error: string }
}

export async function runBriefingCron(deps: {
  campaigns: CampaignStore
  briefing: GenerateDeps
}): Promise<BriefingCronResult> {
  // A campaign failure must not block the briefing, and vice versa.
  let campaigns: BriefingCronResult['campaigns']
  try {
    campaigns = await queueDueCampaigns(deps.campaigns, deps.briefing.now())
  } catch {
    campaigns = { error: 'Campaign queuing failed' }
  }

  let briefing: BriefingCronResult['briefing']
  try {
    briefing = await generateScheduledBriefing(deps.briefing)
  } catch {
    briefing = { error: 'Briefing generation failed' }
  }

  return { campaigns, briefing }
}
