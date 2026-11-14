import 'server-only'

/**
 * Production wiring for outreach drafting. The one outbound request is the
 * model call, made through the briefing's model factory: same SDK, same key,
 * same model constant, same timeout and error handling. Nothing here sends
 * email; direct sending is wired separately in lib/outreach/gmail/deps.ts.
 */

import { BRIEFING_MODEL, createBriefingModel } from '@/lib/briefing/model'
import type { DraftDeps } from '@/lib/outreach/draft'
import { createContactStore } from '@/lib/outreach/contacts/store'
import { createOutreachStore } from '@/lib/outreach/store'

export function createDraftDeps(): DraftDeps {
  return {
    store: createOutreachStore(),
    callModel: createBriefingModel(),
    modelName: BRIEFING_MODEL,
    now: () => new Date(),
    contacts: createContactStore(),
  }
}

export { createOutreachStore }
