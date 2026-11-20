import 'server-only'

/**
 * Production wiring for the command center: requireIntelUser, the contact
 * form's rate limit helper under its own key, the briefing's model client (no
 * tools) and the read-only sources.
 */

import { assistantRateLimit, type AssistantDeps } from '@/lib/assistant/run'
import { assistantSources } from '@/lib/assistant/sources'
import { requireIntelUser } from '@/lib/auth/allowlist'
import { createBriefingModel } from '@/lib/briefing/model'
import { checkRateLimit } from '@/lib/forms/rate-limit'

export function createAssistantDeps(): AssistantDeps {
  return {
    authorize: requireIntelUser,
    allow: assistantRateLimit(checkRateLimit),
    callModel: createBriefingModel(),
    sources: assistantSources,
    now: () => new Date(),
  }
}
