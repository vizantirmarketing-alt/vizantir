/** What the Outreach settings show about direct sending. Pure; safe for client components. */

import { addressFits } from '@/lib/outreach/gmail/account'
import type { GmailConfig } from '@/lib/outreach/gmail/config'
import { isValidEmail, normalizeEmail } from '@/lib/outreach/params'
import type { GmailConnection } from '@/lib/outreach/types'

export type ConnectionView =
  | { state: 'not_set_up' }
  | { state: 'not_connected' }
  | {
      state: 'connected' | 'needs_reconnect'
      /** The connected Google account. */
      email: string
      connectedAt: string
      /** The reply-to address emails go out as, when it differs from the connected account. */
      sendsAs: string | null
      /** False when the connected account can no longer send as the reply-to address in settings. */
      fits: boolean
    }

export function connectionView(config: GmailConfig | null, connection: GmailConnection | null, replyTo: string | null): ConnectionView {
  if (config === null) return { state: 'not_set_up' }
  if (connection === null) return { state: 'not_connected' }
  const sendAs = normalizeEmail(replyTo ?? '')
  const known = isValidEmail(sendAs)
  return {
    state: connection.needsReconnect ? 'needs_reconnect' : 'connected',
    email: connection.email,
    connectedAt: connection.connectedAt,
    sendsAs: known && sendAs !== connection.email ? sendAs : null,
    fits: known && addressFits(connection.email, sendAs).ok,
  }
}
