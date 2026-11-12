/**
 * Outreach enums, labels, limits and email helpers. Pure; safe to import from
 * client components.
 *
 * The owner approves a draft and sends it either from his own mail
 * application, or from the dashboard through his connected Google mailbox
 * (lib/outreach/gmail/), one email per click. Nothing is ever sent
 * automatically.
 */

export const OUTREACH_SUBJECT_TYPES = ['prospect', 'new_business'] as const
export type OutreachSubjectType = (typeof OUTREACH_SUBJECT_TYPES)[number]

/**
 * sending           claimed for one Gmail send; the request is in flight
 * send_unconfirmed  the Gmail request timed out or failed on Google's side, so
 *                   delivery is unknown; never retried automatically
 */
export const OUTREACH_STATUSES = ['draft', 'approved', 'sending', 'send_unconfirmed', 'sent', 'discarded'] as const
export type OutreachStatus = (typeof OUTREACH_STATUSES)[number]

/** A lead has at most one draft in these states (partial unique indexes in 0032 and 0033). */
export const ACTIVE_STATUSES: readonly OutreachStatus[] = ['draft', 'approved', 'sending', 'send_unconfirmed']

/** States a Gmail send may start from. A draft must also pass the hard voice rules. */
export const SENDABLE_STATUSES: readonly OutreachStatus[] = ['draft', 'approved', 'send_unconfirmed']

export const OUTREACH_STATUS_LABELS: Record<OutreachStatus, string> = {
  draft: 'Needs review',
  approved: 'Approved',
  sending: 'Sending',
  send_unconfirmed: 'Not confirmed',
  sent: 'Sent',
  discarded: 'Discarded',
}

export const SENT_VIA = ['gmail', 'mail_app'] as const
export type SentVia = (typeof SENT_VIA)[number]

export const SENT_VIA_LABELS: Record<SentVia, string> = {
  gmail: 'Sent from the dashboard',
  mail_app: 'Sent from your mail app',
}

/** Emails sent through Gmail per local day (America/Los_Angeles). Mail-app sends do not count. */
export const OUTREACH_DAILY_SEND_LIMIT = 20

/**
 * A row still 'sending' after this long belongs to a request that has ended
 * without recording its outcome, so it is treated as not confirmed.
 */
export const SENDING_STALE_MS = 3 * 60 * 1000

/** The short error stored on a draft when Google refuses a send. */
export const SEND_ERROR_MAX = 300

export const OUTREACH_SUBJECT_LABELS: Record<OutreachSubjectType, string> = {
  prospect: 'Prospect',
  new_business: 'New business',
}

export const SUPPRESSION_REASONS = ['do_not_contact', 'manual'] as const
export type SuppressionReason = (typeof SUPPRESSION_REASONS)[number]

export const SUPPRESSION_REASON_LABELS: Record<SuppressionReason, string> = {
  do_not_contact: 'Do not contact, from a draft',
  manual: 'Added by hand',
}

/** Drafts written per local day (America/Los_Angeles), replaced drafts included. */
export const DAILY_DRAFT_CAP = 30
/** Above this many emails marked sent in one local day, the page shows a quiet note. */
export const SENT_PER_DAY_NOTE = 20
/** A mailto: link longer than this is not offered; Copy email still is. */
export const MAILTO_MAX_LENGTH = 1800

/** Changing the prompt or a voice rule changes what a draft means: bump this. */
export const OUTREACH_PROMPT_VERSION = 'outreach-v4'

/**
 * How every draft describes the studio, word for word, after its name from
 * settings. The model is given this and may not describe the studio any
 * other way (lib/outreach/voice.ts checks it).
 */
export const STUDIO_DESCRIPTION = 'a custom web studio in Las Vegas'

/** The studio's own site: the only web address a draft may contain. */
export const STUDIO_SITE_HOST = 'vizantir.com'

export const OUTREACH_EMAIL_MAX = 254
export const OUTREACH_SUBJECT_MAX = 200
export const OUTREACH_BODY_MAX = 5000
export const SETTINGS_TEXT_MAX = 120
export const SETTINGS_ADDRESS_MAX = 400

/** The fixed last line of every footer. Appended by code, never by the model. */
export const OPT_OUT_LINE = "If you'd rather not hear from me again, reply and say so, and I won't write again."

// One address, no display name, no comments. Dots may not lead, trail or repeat.
const LOCAL_PART = /^[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+)*$/
const DOMAIN_LABEL = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?$/

/** Syntax only: one plain address such as name@example.com. */
export function isValidEmail(value: string): boolean {
  if (value.length === 0 || value.length > OUTREACH_EMAIL_MAX) return false
  const at = value.lastIndexOf('@')
  if (at <= 0 || at !== value.indexOf('@')) return false
  const local = value.slice(0, at)
  const domain = value.slice(at + 1)
  if (local.length > 64 || !LOCAL_PART.test(local)) return false
  const labels = domain.split('.')
  if (labels.length < 2) return false
  if (!labels.every((label) => DOMAIN_LABEL.test(label))) return false
  return /^[A-Za-z]{2,63}$/.test(labels[labels.length - 1]!)
}

/** Trimmed and lower-cased; the form stored in the suppression list. */
export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase()
}

export function emailDomain(email: string): string | null {
  const at = email.lastIndexOf('@')
  return at > 0 ? email.slice(at + 1).trim().toLowerCase() || null : null
}

/**
 * Shared mail providers. Suppressing one of these as a domain would block
 * every person who uses it, so a domain entry is refused for them.
 */
export const SHARED_MAIL_DOMAINS: ReadonlySet<string> = new Set([
  'gmail.com',
  'googlemail.com',
  'yahoo.com',
  'ymail.com',
  'hotmail.com',
  'outlook.com',
  'live.com',
  'msn.com',
  'icloud.com',
  'me.com',
  'mac.com',
  'aol.com',
  'proton.me',
  'protonmail.com',
  'gmx.com',
  'mail.com',
  'cox.net',
  'att.net',
  'sbcglobal.net',
  'comcast.net',
  'verizon.net',
])
