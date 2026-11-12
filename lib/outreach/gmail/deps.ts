import 'server-only'

/**
 * Production wiring for direct sending. The environment is read here, on the
 * server only, and never logged or passed to a page. The outbound requests
 * are Google's OAuth endpoints and Gmail messages.send, nothing else.
 */

import { buildOutreachContext } from '@/lib/outreach/context'
import { gmailConfigFrom, type GmailConfig } from '@/lib/outreach/gmail/config'
import type { ConnectDeps } from '@/lib/outreach/gmail/connect'
import type { SendDeps } from '@/lib/outreach/gmail/send'
import { loadBusinessLead, loadProspectLead } from '@/lib/outreach/leads'
import { createGmailConnectionStore, createOutreachStore } from '@/lib/outreach/store'
import type { OutreachDraft } from '@/lib/outreach/types'
import { checkVoice, refusalReasons, voiceContextFor } from '@/lib/outreach/voice'

/** null when any of the three variables is missing or malformed. */
export function readGmailConfig(): GmailConfig | null {
  return gmailConfigFrom({
    GMAIL_OAUTH_CLIENT_ID: process.env.GMAIL_OAUTH_CLIENT_ID,
    GMAIL_OAUTH_CLIENT_SECRET: process.env.GMAIL_OAUTH_CLIENT_SECRET,
    OUTREACH_TOKEN_KEY: process.env.OUTREACH_TOKEN_KEY,
  })
}

/** The hard voice rules against the lead as it is now, as drafting checks them. */
async function checkRules(draft: OutreachDraft, studioName: string): Promise<string[] | null> {
  const loaded = draft.subjectType === 'prospect' ? await loadProspectLead(draft.leadId) : await loadBusinessLead(draft.leadId)
  if (!loaded.ok) return null
  const context = voiceContextFor(buildOutreachContext(loaded.lead), studioName)
  return refusalReasons(checkVoice({ subject: draft.subject, body: draft.body }, context))
}

export function createSendDeps(): SendDeps {
  return {
    store: createOutreachStore(),
    connections: createGmailConnectionStore(),
    config: readGmailConfig(),
    fetch: (input, init) => fetch(input, init),
    now: () => new Date(),
    checkRules,
  }
}

export function createConnectDeps(config: GmailConfig): ConnectDeps {
  return { config, connections: createGmailConnectionStore(), fetch: (input, init) => fetch(input, init), now: () => new Date() }
}

export { createGmailConnectionStore }
