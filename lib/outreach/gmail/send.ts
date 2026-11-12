/**
 * Approve and send: one approved draft, one email, through the owner's
 * connected Google mailbox. Pure: stores, fetch, clock and the voice check are
 * passed in. Called only from the approveAndSend server action, one click at a
 * time; nothing schedules or repeats it.
 *
 * Checks, in order, each refusing in plain words before anything changes:
 *   1. the connection exists, Google still accepts it, and the connected
 *      account may still send as the reply-to address in settings now
 *   2. the draft is sendable: approved, not confirmed, or a draft that passes
 *      the hard voice rules
 *   3. the recipient address is present and valid
 *   4. the recipient is not on the do-not-contact list, re-checked now
 *   5. fewer than OUTREACH_DAILY_SEND_LIMIT Gmail sends today
 * Then the draft is claimed with a conditional update to 'sending', so a
 * second click finds nothing to claim, and exactly the locked subject and body
 * plus the footer are sent, From the sender name and the reply-to address. Nothing is written again by a model here.
 */

import { addressFits } from '@/lib/outreach/gmail/account'
import type { SendOutcome } from '@/lib/outreach/gmail/api'
import { sendGmailMessage } from '@/lib/outreach/gmail/api'
import type { GmailConfig } from '@/lib/outreach/gmail/config'
import { NOT_SET_UP } from '@/lib/outreach/gmail/connect'
import { decryptToken } from '@/lib/outreach/gmail/crypto'
import { buildRawMessage } from '@/lib/outreach/gmail/message'
import { refreshAccessToken, type FetchFn } from '@/lib/outreach/gmail/oauth'
import { localDayStartIso } from '@/lib/outreach/dates'
import { isStaleSending, isSuppressed } from '@/lib/outreach/lifecycle'
import { messageText } from '@/lib/outreach/mailto'
import { OUTREACH_DAILY_SEND_LIMIT, SENDABLE_STATUSES, emailDomain, isValidEmail, normalizeEmail } from '@/lib/outreach/params'
import { missingSettings, missingSettingsMessage } from '@/lib/outreach/settings'
import type { GmailConnection, GmailConnectionStore, OutreachDraft, OutreachStore } from '@/lib/outreach/types'

export type SendDeps = {
  store: OutreachStore
  connections: GmailConnectionStore
  config: GmailConfig | null
  fetch: FetchFn
  now: () => Date
  /**
   * The hard voice rules a draft's text breaks, in plain words; empty when it
   * passes. null when the lead can no longer be loaded to check against.
   */
  checkRules: (draft: OutreachDraft, studioName: string) => Promise<string[] | null>
}

export type SendResult =
  | { ok: true; draft: OutreachDraft }
  | { ok: false; error: string; outcome: 'refused' | 'rejected' | 'unconfirmed' }

export const NOT_CONFIRMED = 'Not confirmed. Check your Sent folder before trying again.'
const RECONNECT = 'Google no longer accepts the connection, so nothing was sent. Reconnect Google in Outreach settings.'

const refuse = (error: string): SendResult => ({ ok: false, error, outcome: 'refused' })

/** Why a draft cannot be sent now, judged by its status alone; null when it can. */
export function statusRefusal(draft: OutreachDraft, nowIso: string): string | null {
  if (SENDABLE_STATUSES.includes(draft.status) || isStaleSending(draft, nowIso)) return null
  if (draft.status === 'sending') return 'This email is already being sent.'
  if (draft.status === 'sent') return 'This email was already sent.'
  return 'This draft was discarded.'
}

async function accessToken(deps: SendDeps & { config: GmailConfig }, connection: GmailConnection): Promise<{ token: string } | { error: string }> {
  const refreshToken = decryptToken(
    { ciphertext: connection.tokenCiphertext, iv: connection.tokenIv, tag: connection.tokenTag },
    deps.config.tokenKey,
  )
  if (refreshToken === null) {
    await deps.connections.markNeedsReconnect()
    return { error: 'The saved Google connection could not be read, so nothing was sent. Reconnect Google in Outreach settings.' }
  }
  const result = await refreshAccessToken(deps.fetch, deps.config, refreshToken)
  if (result.ok) return { token: result.accessToken }
  if (result.reason === 'invalid_grant') {
    await deps.connections.markNeedsReconnect()
    return { error: RECONNECT }
  }
  return { error: 'Google could not be reached, so nothing was sent. Try again shortly.' }
}

export async function approveAndSend(deps: SendDeps, draftId: string): Promise<SendResult> {
  const nowIso = deps.now().toISOString()

  // 1. The connection.
  if (deps.config === null) return refuse(NOT_SET_UP)
  const config = deps.config
  const connection = await deps.connections.get()
  if (connection === null) return refuse('Connect Google in Outreach settings before sending from the dashboard.')
  if (connection.needsReconnect) return refuse(RECONNECT)

  // 2. The draft and its state.
  const draft = await deps.store.getDraft(draftId)
  if (draft === null) return refuse('Draft not found.')
  const byStatus = statusRefusal(draft, nowIso)
  if (byStatus !== null) return refuse(byStatus)

  const settings = await deps.store.getSettings()
  const missing = missingSettings(settings)
  if (settings === null || missing.length > 0) return refuse(missingSettingsMessage(missing).replace('before drafting', 'before sending'))
  const sendAs = normalizeEmail(settings.replyToEmail)
  if (!addressFits(connection.email, sendAs).ok) {
    return refuse(
      `The connected Google account, ${connection.email}, cannot send as ${sendAs}, the reply-to address in Outreach settings. Nothing was sent. Reconnect Google with an account that can, or correct the reply-to address.`,
    )
  }

  if (draft.status === 'draft') {
    const reasons = await deps.checkRules(draft, settings.studioName)
    if (reasons === null) {
      return refuse('This lead can no longer be loaded, so the draft cannot be checked against the writing rules. Approve it first, then send.')
    }
    if (reasons.length > 0) return refuse(`This draft does not meet the writing rules: ${reasons.join(' ')} Edit it before sending.`)
  }

  // 3. The recipient.
  const to = draft.toEmail === null ? '' : normalizeEmail(draft.toEmail)
  if (!isValidEmail(to)) return refuse('Add a valid recipient email before sending.')

  // 4. The do-not-contact list, now.
  const matches = await deps.store.findSuppressions(to, emailDomain(to))
  if (isSuppressed(to, matches)) {
    return refuse('This address is on the do-not-contact list, by address or by domain. It was not sent.')
  }

  // 5. The daily limit.
  const sentToday = await deps.store.countGmailSentSince(localDayStartIso(deps.now()))
  if (sentToday >= OUTREACH_DAILY_SEND_LIMIT) {
    return refuse(
      `${OUTREACH_DAILY_SEND_LIMIT} of ${OUTREACH_DAILY_SEND_LIMIT} emails have been sent from the dashboard today. Send the rest tomorrow, or from your mail app.`,
    )
  }

  // The message, built before anything changes so a bad header refuses cleanly.
  const message = buildRawMessage({
    fromName: settings.senderName,
    // The reply-to address, which may be an alias of the connected account.
    fromEmail: sendAs,
    to,
    replyTo: sendAs,
    subject: draft.subject,
    text: messageText(draft.body, draft.footer),
  })
  if (!message.ok) return refuse(message.error)

  const token = await accessToken({ ...deps, config }, connection)
  if ('error' in token) return refuse(token.error)

  // Claim it. Only one request can move it out of the state it was read in.
  const claimed = await deps.store.updateDraft(draft.id, [draft.status], {
    status: 'sending',
    approvedAt: draft.approvedAt ?? nowIso,
    sendError: null,
    updatedAt: nowIso,
  })
  if (claimed === null) return refuse('This email is already being sent, or was sent.')
  if (claimed.toEmail !== draft.toEmail || claimed.subject !== draft.subject || claimed.body !== draft.body) {
    await deps.store.updateDraft(draft.id, ['sending'], { status: draft.status, approvedAt: draft.approvedAt, updatedAt: nowIso })
    return refuse('This draft changed while it was being sent. Nothing was sent. Reload and try again.')
  }

  const outcome: SendOutcome = await sendGmailMessage(deps.fetch, token.token, message.raw)
  const doneIso = deps.now().toISOString()

  if (outcome.kind === 'sent') {
    try {
      const sent = await deps.store.updateDraft(draft.id, ['sending'], {
        status: 'sent',
        sentAt: doneIso,
        sentVia: 'gmail',
        gmailMessageId: outcome.messageId,
        gmailThreadId: outcome.threadId,
        sendError: null,
        updatedAt: doneIso,
      })
      if (sent !== null) return { ok: true, draft: sent }
    } catch {
      // Falls through: Google accepted it, the record did not update.
    }
    return {
      ok: false,
      outcome: 'unconfirmed',
      error: 'Google accepted the email, but the dashboard could not record it. Check your Sent folder, then choose Mark as sent.',
    }
  }

  if (outcome.kind === 'rejected') {
    await deps.store.updateDraft(draft.id, ['sending'], { status: 'approved', sendError: outcome.error, updatedAt: doneIso })
    return { ok: false, outcome: 'rejected', error: `${outcome.error} Nothing was sent.` }
  }

  await deps.store.updateDraft(draft.id, ['sending'], { status: 'send_unconfirmed', sendError: null, updatedAt: doneIso })
  return { ok: false, outcome: 'unconfirmed', error: NOT_CONFIRMED }
}
