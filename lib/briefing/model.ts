import 'server-only'

/**
 * The briefing's single model call, through the Anthropic SDK the site chat
 * already uses (app/api/chat/route.ts): same SDK, same ANTHROPIC_API_KEY,
 * same model as the chat route and lib/reports/analysis.ts. No tools.
 */

import Anthropic from '@anthropic-ai/sdk'

import type { CallModel } from '@/lib/briefing/narrative'

/** Matches the model used by app/api/chat/route.ts and lib/reports/analysis.ts. */
export const BRIEFING_MODEL = 'claude-sonnet-4-6'
const MAX_TOKENS = 1024
const TIMEOUT_MS = 45_000

/** Null when ANTHROPIC_API_KEY is not set. */
export function createBriefingModel(): CallModel | null {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim()
  if (!apiKey) {
    return null
  }
  const client = new Anthropic({ apiKey, timeout: TIMEOUT_MS, maxRetries: 1 })

  return async ({ system, user }) => {
    try {
      const message = await client.messages.create({
        model: BRIEFING_MODEL,
        max_tokens: MAX_TOKENS,
        system,
        messages: [{ role: 'user', content: user }],
      })
      if (message.stop_reason === 'max_tokens') {
        return { ok: false, reason: 'model_output_truncated' }
      }
      const text = message.content
        .flatMap((block) => (block.type === 'text' ? [block.text] : []))
        .join('\n')
        .trim()
      return text.length > 0 ? { ok: true, text } : { ok: false, reason: 'model_output_empty' }
    } catch (error) {
      if (error instanceof Anthropic.APIError && typeof error.status === 'number') {
        return { ok: false, reason: `model_call_failed (HTTP ${error.status})` }
      }
      return { ok: false, reason: 'model_call_failed' }
    }
  }
}
