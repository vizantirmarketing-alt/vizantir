import 'server-only'

/**
 * Production wiring for the command center: requireIntelUser, the contact
 * form's rate limit helper under its own key, the briefing's model client (no
 * tools), the read-only sources, the research queue (its one write is a
 * confirmed prospect run) with the confirmation signer, and one log line per
 * failure (reason code and command only).
 */

import { assistantRateLimit, formatAssistantLog, type AssistantDeps } from '@/lib/assistant/run'
import { createConfirmationSigner, createResearchQueue } from '@/lib/assistant/research-store'
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
    research: createResearchQueue(),
    signer: createConfirmationSigner(),
    now: () => new Date(),
    log: (entry) => console.warn(formatAssistantLog(entry)),
  }
}
