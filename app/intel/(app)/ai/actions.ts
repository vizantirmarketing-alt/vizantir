'use server'

import { createAssistantDeps } from '@/lib/assistant/deps'
import { handleAssistantRequest, type AssistantReply } from '@/lib/assistant/run'

/**
 * The command center's one action. handleAssistantRequest calls
 * requireIntelUser first, so a signed-out caller is redirected to the login
 * page before anything is read, counted or sent to the model. Read-only.
 */
export async function askAssistant(request: unknown): Promise<AssistantReply> {
  return handleAssistantRequest(createAssistantDeps(), request)
}
