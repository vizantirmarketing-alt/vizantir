/**
 * What the Outreach page lists, and the next step for each lead. Pure; safe
 * for client components. The loaders are in lib/outreach/contacts/load.ts and
 * the page; nothing here reads or writes.
 *
 *   Accepted leads  every accepted lead, of both types, with no open draft
 *                   and no sent email, each with exactly one primary action
 *   Sent            one line per business: its latest email, and how many
 *   Setup notice    one line when settings are missing or Google needs
 *                   reconnecting
 */

import { BRIEFING_TIME_ZONE } from '@/lib/briefing/dates'
import type { ContactStatus, LeadSite } from '@/lib/outreach/contacts/rules'
import { ACTIVE_STATUSES, emailDomain, normalizeEmail, type OutreachSubjectType } from '@/lib/outreach/params'
import type { ConnectionView } from '@/lib/outreach/gmail/view'
import { missingSettings, missingSettingsMessage } from '@/lib/outreach/settings'
import type { OutreachDraft, OutreachSettings, SubjectState, Suppression } from '@/lib/outreach/types'

// --- Accepted leads.

export type WorklistLeadInput = {
  subjectType: OutreachSubjectType
  subjectRef: string
  leadId: string
  name: string
  /** null: nothing to check. 'pending': the website check has not run yet. */
  site: LeadSite | null | 'pending'
}

export type WorklistContactInput = {
  subjectType: OutreachSubjectType
  subjectRef: string
  status: ContactStatus | null
  email: string | null
  /** Held by an open run. */
  waiting: boolean
}

export type WorklistAction = 'find_contact' | 'draft' | 'none'

export type WorklistRow = {
  subjectType: OutreachSubjectType
  subjectRef: string
  leadId: string
  name: string
  /** Exactly one primary action. 'none' only while the runner is looking. */
  action: WorklistAction
  /** The contact address status, in plain words. */
  statusText: string
  /** The found address, shown with Draft email. */
  address: string | null
  /** "You will need to add an address yourself." when drafting would start with To empty. */
  addressHint: string | null
  /** The secondary "Check again". */
  checkAgain: boolean
}

export const WAITING_TEXT = 'Looking for a contact address. Runs with the next scheduled research.'
export const ADD_ADDRESS_HINT = 'You will need to add an address yourself.'

const STATUS_TEXT: Record<Exclude<ContactStatus, 'found'>, string> = {
  none_found: "No contact address was found on the business's pages.",
  named_only: "Only a named person's address is published.",
  no_page: 'There is no website or listing page to check for a contact address.',
  unclear: 'The last contact address check did not finish cleanly.',
}

const subjectKey = (subject: { subjectType: OutreachSubjectType; subjectRef: string }) => `${subject.subjectType}:${subject.subjectRef}`

/**
 * Where a lead's contact lookup stands, as the Accepted leads list and the
 * summary line both read it:
 *   looking      a run holds the lead, or the waiting scheduled run will include it
 *   not_checked  no result and no run for it: Find contact email
 *   other        a result, or a website check that has not run yet
 */
export function lookupState(
  lead: Pick<WorklistLeadInput, 'site'>,
  contact: Pick<WorklistContactInput, 'status' | 'waiting'> | undefined,
  generalRunQueued: boolean,
): 'looking' | 'not_checked' | 'other' {
  const unchecked = contact === undefined || contact.status === null
  const hasPage = lead.site !== null && lead.site !== 'pending'
  if (contact?.waiting || (unchecked && hasPage && generalRunQueued)) return 'looking'
  if (unchecked && lead.site !== 'pending') return 'not_checked'
  return 'other'
}

/** Leads with an open draft or a sent email: they are in Needs review, Approved, Not confirmed or Sent instead. */
export function subjectsInOutreach(states: readonly SubjectState[]): Set<string> {
  return new Set(states.filter((state) => state.status === 'sent' || ACTIVE_STATUSES.includes(state.status)).map(subjectKey))
}

function suppressed(email: string, suppressions: readonly Pick<Suppression, 'email' | 'domain'>[]): boolean {
  const address = normalizeEmail(email)
  const domain = emailDomain(address)
  return suppressions.some((entry) => entry.email === address || (entry.domain !== null && entry.domain === domain))
}

/**
 * One row per accepted lead without an open draft or a sent email, in the
 * order given. contacts is null when contact addresses cannot be read (for
 * example before migration 0034): every row then offers Draft email.
 * generalRunQueued is true while a scheduled contact run waits to be claimed;
 * an unchecked lead with a page is then already waiting for it.
 */
export function acceptedLeadRows(input: {
  leads: readonly WorklistLeadInput[]
  states: readonly SubjectState[]
  contacts: readonly WorklistContactInput[] | null
  suppressions: readonly Pick<Suppression, 'email' | 'domain'>[]
  generalRunQueued: boolean
}): WorklistRow[] {
  const inOutreach = subjectsInOutreach(input.states)
  const contacts = new Map((input.contacts ?? []).map((contact) => [subjectKey(contact), contact]))
  const rows: WorklistRow[] = []
  for (const lead of input.leads) {
    if (inOutreach.has(subjectKey(lead))) continue
    const base = { subjectType: lead.subjectType, subjectRef: lead.subjectRef, leadId: lead.leadId, name: lead.name }
    const draft = (statusText: string, extra: Partial<WorklistRow> = {}): WorklistRow => ({
      ...base,
      action: 'draft',
      statusText,
      address: null,
      addressHint: ADD_ADDRESS_HINT,
      checkAgain: false,
      ...extra,
    })

    if (input.contacts === null) {
      rows.push(draft('Contact addresses are not available yet.'))
      continue
    }
    const contact = contacts.get(subjectKey(lead))
    const lookup = lookupState(lead, contact, input.generalRunQueued)

    if (lookup === 'looking') {
      rows.push({ ...base, action: 'none', statusText: WAITING_TEXT, address: null, addressHint: null, checkAgain: false })
      continue
    }
    if (lookup === 'not_checked') {
      rows.push({ ...base, action: 'find_contact', statusText: 'Not checked for a contact address yet.', address: null, addressHint: null, checkAgain: false })
      continue
    }
    if (contact === undefined || contact.status === null) {
      rows.push(draft('The contact address is looked for after the website check, which has not run for this business yet.'))
      continue
    }
    const status = contact.status!
    if (status === 'found' && contact.email !== null) {
      if (suppressed(contact.email, input.suppressions)) {
        rows.push(draft(`The address found, ${contact.email}, is on the do-not-contact list.`))
        continue
      }
      rows.push({ ...base, action: 'draft', statusText: 'Contact address found.', address: contact.email, addressHint: null, checkAgain: false })
      continue
    }
    if (status === 'found') {
      rows.push(draft(STATUS_TEXT.none_found, { checkAgain: true }))
      continue
    }
    // A re-check makes sense where the pages may say more next time; no_page is checked again by itself once a page exists.
    rows.push(draft(STATUS_TEXT[status], { checkAgain: status !== 'no_page' }))
  }
  return rows
}

// --- The summary line.

export type ContactCounts = { accepted: number; withAddress: number; lookingUp: number; notChecked: number }

/** Counts over every accepted lead, by the same states as the Accepted leads list. */
export function contactCounts(input: {
  leads: readonly WorklistLeadInput[]
  contacts: readonly WorklistContactInput[]
  generalRunQueued: boolean
}): ContactCounts {
  const contacts = new Map(input.contacts.map((contact) => [subjectKey(contact), contact]))
  const counts: ContactCounts = { accepted: input.leads.length, withAddress: 0, lookingUp: 0, notChecked: 0 }
  for (const lead of input.leads) {
    const contact = contacts.get(subjectKey(lead))
    if (contact?.status === 'found') counts.withAddress += 1
    const lookup = lookupState(lead, contact, input.generalRunQueued)
    if (lookup === 'looking') counts.lookingUp += 1
    else if (lookup === 'not_checked') counts.notChecked += 1
  }
  return counts
}

/** "4 of 12 accepted leads have a contact address · 3 being looked up · 2 not checked yet"; the last two only when above zero. */
export function contactSummaryLine(counts: ContactCounts): string {
  const leads = counts.accepted === 1 ? 'accepted lead has' : 'accepted leads have'
  const parts = [`${counts.withAddress.toLocaleString('en-US')} of ${counts.accepted.toLocaleString('en-US')} ${leads} a contact address`]
  if (counts.lookingUp > 0) parts.push(`${counts.lookingUp.toLocaleString('en-US')} being looked up`)
  if (counts.notChecked > 0) parts.push(`${counts.notChecked.toLocaleString('en-US')} not checked yet`)
  return parts.join(' · ')
}

// --- Sent.

export type SentGroup = {
  subjectType: OutreachSubjectType
  subjectRef: string
  leadId: string
  leadName: string
  latestId: string
  latestSubject: string
  latestSentAt: string | null
  count: number
}

/** One line per business, newest send first. Takes sent rows in any order. */
export function groupSent(drafts: readonly OutreachDraft[]): SentGroup[] {
  const groups = new Map<string, SentGroup>()
  const newer = (a: string | null, b: string | null) => (a ?? '') > (b ?? '')
  for (const draft of drafts) {
    if (draft.status !== 'sent') continue
    const key = subjectKey(draft)
    const group = groups.get(key)
    if (group === undefined) {
      groups.set(key, {
        subjectType: draft.subjectType,
        subjectRef: draft.subjectRef,
        leadId: draft.leadId,
        leadName: draft.leadName,
        latestId: draft.id,
        latestSubject: draft.subject,
        latestSentAt: draft.sentAt,
        count: 1,
      })
      continue
    }
    group.count += 1
    if (newer(draft.sentAt, group.latestSentAt)) {
      Object.assign(group, { leadId: draft.leadId, leadName: draft.leadName, latestId: draft.id, latestSubject: draft.subject, latestSentAt: draft.sentAt })
    }
  }
  return [...groups.values()].sort((a, b) => (b.latestSentAt ?? '').localeCompare(a.latestSentAt ?? ''))
}

// --- Setup notice.

/** One line for the top of the Outreach page, or null when drafting and sending are set up. */
export function setupNotice(settings: OutreachSettings | null, connection: ConnectionView): string | null {
  const missing = missingSettings(settings)
  if (missing.length > 0) return missingSettingsMessage(missing)
  if (connection.state === 'needs_reconnect') return 'Google needs to be reconnected before emails can be sent from the dashboard.'
  if (connection.state === 'connected' && !connection.fits) {
    return 'Google needs to be reconnected: the connected account cannot send as the reply-to address in Outreach settings.'
  }
  return null
}

// --- The note under To.

export type FoundAddressLabel =
  /** To is the found address: show "Found on {host}". */
  | { kind: 'found' }
  /** To differs from the found address. text is the line; the action puts the found address back. */
  | { kind: 'changed'; text: string; address: string }
  /** No found address: show the contact note as it is. */
  | { kind: 'none' }

export function foundAddressLabel(foundEmail: string | null, to: string): FoundAddressLabel {
  if (foundEmail === null) return { kind: 'none' }
  const found = normalizeEmail(foundEmail)
  const current = normalizeEmail(to)
  if (current === found) return { kind: 'found' }
  // An empty To was never the found address: the draft was written before it was found, or it was cleared.
  return { kind: 'changed', text: current.length === 0 ? `Found address: ${found}` : `Changed by you. Found address: ${found}`, address: found }
}

/** "Nov 14": a short date for status lines. */
export function shortDay(iso: string | null): string | null {
  if (iso === null) return null
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return null
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: BRIEFING_TIME_ZONE }).format(date)
}
