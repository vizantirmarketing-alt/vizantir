'use server'

import { createAssistantDeps } from '@/lib/assistant/deps'
import { listResearchRequests, type ResearchRequestsResult } from '@/lib/assistant/research'
import { createResearchQueue } from '@/lib/assistant/research-store'
import { handleAssistantRequest, type AssistantReply } from '@/lib/assistant/run'
import { requireIntelUser } from '@/lib/auth/allowlist'

/**
 * The command center's action. handleAssistantRequest calls requireIntelUser
 * first, so a signed-out caller is redirected to the login page before
 * anything is read, counted, sent to the model or queued. Its only writes are
 * the rate limit row and, for a confirmed research request, one queued run.
 */
export async function askAssistant(request: unknown): Promise<AssistantReply> {
  return handleAssistantRequest(createAssistantDeps(), request)
}

/** The Research requests panel's manual refresh. Read-only. */
export async function refreshResearchRequests(): Promise<ResearchRequestsResult> {
  await requireIntelUser()
  return listResearchRequests(createResearchQueue())
}
