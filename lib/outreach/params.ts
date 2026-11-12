/**
 * Outreach enums, labels, limits and email helpers. Pure; safe to import from
 * client components.
 *
 * Nothing in Outreach sends email. The owner approves a draft and sends it
 * from his own mail application; the server only stores text.
 */

export const OUTREACH_SUBJECT_TYPES = ['prospect', 'new_business'] as const
export type OutreachSubjectType = (typeof OUTREACH_SUBJECT_TYPES)[number]

export const OUTREACH_STATUSES = ['draft', 'approved', 'sent', 'discarded'] as const
export type OutreachStatus = (typeof OUTREACH_STATUSES)[number]

/** A lead has at most one draft in these states (a partial unique index in 0032). */
export const ACTIVE_STATUSES: readonly OutreachStatus[] = ['draft', 'approved']

export const OUTREACH_STATUS_LABELS: Record<OutreachStatus, string> = {
  draft: 'Needs review',
  approved: 'Approved',
  sent: 'Sent',
  discarded: 'Discarded',
}

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
export const OUTREACH_PROMPT_VERSION = 'outreach-v3'

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
