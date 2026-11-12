/**
 * Which Google account may send as the reply-to address. Pure; safe for
 * client components.
 *
 * On a shared mail provider (gmail.com and similar) the connected account
 * must be the reply-to address itself. On a Workspace domain it may be any
 * account on that domain, so the owner can sign in as the primary user and
 * send as an alias listed under Send mail as in Gmail.
 */

import { SHARED_MAIL_DOMAINS, emailDomain, normalizeEmail } from '@/lib/outreach/params'

export type AccountFit = { ok: true } | { ok: false; reason: 'exact' | 'domain' }

/** The Workspace domain of a reply-to address, or null for a shared mail provider or an invalid address. */
export function workspaceDomain(replyTo: string): string | null {
  const domain = emailDomain(normalizeEmail(replyTo))
  return domain === null || SHARED_MAIL_DOMAINS.has(domain) ? null : domain
}

/**
 * Whether a connected address may send as the reply-to address, by address
 * alone. The connection also checks Google's hd claim; the send re-checks only
 * this, against the stored address and the reply-to in settings now.
 */
export function addressFits(connected: string, replyTo: string): AccountFit {
  const account = normalizeEmail(connected)
  const sendAs = normalizeEmail(replyTo)
  const domain = workspaceDomain(sendAs)
  if (domain === null) return account === sendAs ? { ok: true } : { ok: false, reason: 'exact' }
  return emailDomain(account) === domain ? { ok: true } : { ok: false, reason: 'domain' }
}
