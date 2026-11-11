/**
 * One briefing cron tick: queue due campaigns, then generate today's briefing
 * if it is 7:00 or later locally and none exists. Idempotent: a second tick
 * on the same day queues nothing new (open runs and cadence block it) and
 * skips the briefing (it already exists). No direct I/O; dependencies are
 * injected.
 */

import { queueDueCampaigns, type CampaignStore, type QueueResult } from '@/lib/briefing/campaigns'
import type { ImportResult } from '@/lib/new-businesses/import'
import type { QueueCheckResult } from '@/lib/new-businesses/website-runs'
import {
  generateScheduledBriefing,
  type GenerateDeps,
  type ScheduledBriefingResult,
} from '@/lib/briefing/generate'

export type BriefingCronResult = {
  campaigns: QueueResult | { error: string }
  newBusinesses?: ImportResult | { error: string }
  websiteChecks?: QueueCheckResult | { error: string }
  briefing: ScheduledBriefingResult | { error: string }
}

export async function runBriefingCron(deps: {
  campaigns: CampaignStore
  briefing: GenerateDeps
  /** At most one New Businesses import attempt per local day. */
  importNewBusinesses?: () => Promise<ImportResult>
  /**
   * Queues one New Businesses website-check run when unchecked businesses
   * remain and no check run is requested or claimed.
   */
  queueWebsiteChecks?: () => Promise<QueueCheckResult>
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

  // After the import, so newly imported businesses can be queued; before the
  // briefing. A failure never blocks the import or the briefing.
  let websiteChecks: BriefingCronResult['websiteChecks']
  if (deps.queueWebsiteChecks) {
    try {
      websiteChecks = await deps.queueWebsiteChecks()
    } catch {
      websiteChecks = { error: 'Website check queuing failed' }
    }
  }

  let briefing: BriefingCronResult['briefing']
  try {
    briefing = await generateScheduledBriefing(deps.briefing)
  } catch {
    briefing = { error: 'Briefing generation failed' }
  }

  return {
    campaigns,
    ...(newBusinesses === undefined ? {} : { newBusinesses }),
    ...(websiteChecks === undefined ? {} : { websiteChecks }),
    briefing,
  }
}
