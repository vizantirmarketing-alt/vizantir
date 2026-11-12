/**
 * Gmail messages.send for user "me". fetch is passed in. One request, never
 * retried here: a send whose outcome is unknown is left for the owner.
 */

import type { FetchFn } from '@/lib/outreach/gmail/oauth'
import { SEND_ERROR_MAX } from '@/lib/outreach/params'

export const GMAIL_SEND_URL = 'https://gmail.googleapis.com/gmail/v1/users/me/messages/send'
export const GMAIL_SEND_TIMEOUT_MS = 20_000

export type SendOutcome =
  | { kind: 'sent'; messageId: string | null; threadId: string | null }
  /** Google refused it: nothing was sent. */
  | { kind: 'rejected'; status: number; error: string }
  /** A timeout, a network failure or a server error: it may or may not have been sent. */
  | { kind: 'unknown' }

function shortReason(json: Record<string, unknown>): string | null {
  const error = json.error
  if (error === null || typeof error !== 'object') return null
  const message = (error as Record<string, unknown>).message
  if (typeof message !== 'string') return null
  const line = message.replace(/[\u0000-\u001F\u007F]+/g, ' ').replace(/\s+/g, ' ').trim()
  return line.length === 0 ? null : line.slice(0, 160)
}

export function rejectionMessage(status: number, reason: string | null): string {
  const text = `Google refused the email (HTTP ${status})${reason === null ? '.' : `: ${reason}`}`
  return text.slice(0, SEND_ERROR_MAX)
}

export async function sendGmailMessage(
  fetchFn: FetchFn,
  accessToken: string,
  raw: string,
  timeoutMs: number = GMAIL_SEND_TIMEOUT_MS,
): Promise<SendOutcome> {
  let response: Response
  try {
    response = await fetchFn(GMAIL_SEND_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ raw }),
      signal: AbortSignal.timeout(timeoutMs),
      cache: 'no-store',
    })
  } catch {
    return { kind: 'unknown' }
  }

  let json: Record<string, unknown> = {}
  try {
    const parsed: unknown = await response.json()
    if (parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed)) json = parsed as Record<string, unknown>
  } catch {
    // Read below by status alone.
  }

  if (response.status >= 200 && response.status < 300) {
    const id = typeof json.id === 'string' && json.id.length > 0 ? json.id : null
    const threadId = typeof json.threadId === 'string' && json.threadId.length > 0 ? json.threadId : null
    return { kind: 'sent', messageId: id, threadId }
  }
  // 408 is a timeout on Google's side: delivery is unknown, like a 5xx.
  if (response.status === 408 || response.status >= 500) return { kind: 'unknown' }
  return { kind: 'rejected', status: response.status, error: rejectionMessage(response.status, shortReason(json)) }
}
