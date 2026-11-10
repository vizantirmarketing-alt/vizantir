import 'server-only'

/** Production wiring for the briefing generator and campaign queue. */

import type { GenerateDeps } from '@/lib/briefing/generate'
import { createBriefingModel } from '@/lib/briefing/model'
import { briefingSources } from '@/lib/briefing/sources'
import { createBriefingStore, createCampaignStore } from '@/lib/briefing/store'

export function createGenerateDeps(): GenerateDeps {
  return {
    store: createBriefingStore(),
    sources: briefingSources,
    callModel: createBriefingModel(),
    now: () => new Date(),
  }
}

export { createCampaignStore }
