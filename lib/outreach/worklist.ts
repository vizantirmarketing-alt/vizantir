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
import { CALL_OUTCOME_LABELS, type CallSummary } from '@/lib/outreach/calls'
import type { ContactStatus, LeadSite } from '@/lib/outreach/contacts/rules'
import { ACTIVE_STATUSES, NO_FINDING_TEXT, emailDomain, normalizeEmail, type OutreachSubjectType } from '@/lib/outreach/params'
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
  /** The phone number on the business's license record, as stored. */
  phone: string | null
  /** hasSpecificFinding() for the lead: whether there is anything specific to write about. */
  hasFinding: boolean
}

export type WorklistContactInput = {
  subjectType: OutreachSubjectType
  subjectRef: string
  status: ContactStatus | null
  email: string | null
  /** Held by an open run. */
  waiting: boolean
}

export type WorklistAction = 'find_contact' | 'draft' | 'log_call' | 'none'

export type WorklistRow = {
  subjectType: OutreachSubjectType
  subjectRef: string
  leadId: string
  name: string
  /**
   * At most one primary action: 'none' while the runner is looking, or when
   * there is nothing specific to write about and no call to log.
   */
  action: WorklistAction
  /** The secondary drafting action: Draft email beside Log a call, or Write it yourself when there is no finding. */
  secondary: 'draft' | 'write' | null
  /** NO_FINDING_TEXT where Draft email would otherwise be. */
  noFindingText: string | null
  /** The license record's phone number, as stored. */
  phone: string | null
  /** The call log for the lead; null when there are no calls or the log cannot be read. */
  calls: CallSummary | null
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
  /**
   * Call summaries by "subjectType:subjectRef"; null when the call log cannot
   * be read (before migration 0035): Log a call is then never offered and no
   * lead is closed.
   */
  calls?: ReadonlyMap<string, CallSummary> | null
}): WorklistRow[] {
  const inOutreach = subjectsInOutreach(input.states)
  const contacts = new Map((input.contacts ?? []).map((contact) => [subjectKey(contact), contact]))
  const callsReadable = input.calls !== undefined && input.calls !== null
  const rows: WorklistRow[] = []
  for (const lead of input.leads) {
    if (inOutreach.has(subjectKey(lead))) continue
    const calls = input.calls?.get(subjectKey(lead)) ?? null
    if (calls?.closedBy) continue
    const base = {
      subjectType: lead.subjectType,
      subjectRef: lead.subjectRef,
      leadId: lead.leadId,
      name: lead.name,
      phone: lead.phone,
      calls,
      secondary: null,
      noFindingText: null,
    }
    // The drafting step, by the finding rule: Draft email, or "Write it yourself" beside the no-finding text.
    const draftStep = (extra: Partial<WorklistRow>): Pick<WorklistRow, 'action' | 'secondary' | 'noFindingText'> & Partial<WorklistRow> =>
      lead.hasFinding ? { action: 'draft', secondary: null, noFindingText: null, ...extra } : { action: 'none', secondary: 'write', noFindingText: NO_FINDING_TEXT, ...extra }
    const draft = (statusText: string, extra: Partial<WorklistRow> = {}): WorklistRow => ({
      ...base,
      statusText,
      address: null,
      addressHint: ADD_ADDRESS_HINT,
      checkAgain: false,
      ...draftStep(extra),
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
      rows.push({ ...draft('Contact address found.'), address: contact.email, addressHint: null })
      continue
    }
    const effective: Exclude<ContactStatus, 'found'> = status === 'found' ? 'none_found' : status
    // A re-check makes sense where the pages may say more next time; no_page is checked again by itself once a page exists.
    const checkAgain = effective !== 'no_page'
    if (effective !== 'unclear' && lead.phone !== null && callsReadable) {
      // No email to find, but the license record has a phone number: the next step is a call.
      rows.push({
        ...base,
        action: 'log_call',
        secondary: lead.hasFinding ? 'draft' : 'write',
        noFindingText: lead.hasFinding ? null : NO_FINDING_TEXT,
        statusText: `No email address is published. Call ${lead.phone}.`,
        address: null,
        addressHint: null,
        checkAgain,
      })
      continue
    }
    rows.push(draft(STATUS_TEXT[effective], { checkAgain }))
  }
  return rows
}

// --- Closed.

export type ClosedRow = {
  subjectType: OutreachSubjectType
  subjectRef: string
  leadId: string
  name: string
  /** The outcome that closed it, in words, e.g. "Spoke: not interested". */
  reason: string
  /** The latest call. */
  closedAt: string
}

/** Accepted leads closed by a call, newest first. Empty when the call log cannot be read. */
export function closedLeadRows(leads: readonly Pick<WorklistLeadInput, 'subjectType' | 'subjectRef' | 'leadId' | 'name'>[], calls: ReadonlyMap<string, CallSummary> | null): ClosedRow[] {
  if (calls === null) return []
  const rows: ClosedRow[] = []
  for (const lead of leads) {
    const summary = calls.get(subjectKey(lead))
    if (!summary?.closedBy) continue
    rows.push({
      subjectType: lead.subjectType,
      subjectRef: lead.subjectRef,
      leadId: lead.leadId,
      name: lead.name,
      reason: CALL_OUTCOME_LABELS[summary.closedBy],
      closedAt: summary.latestAt,
    })
  }
  return rows.sort((a, b) => b.closedAt.localeCompare(a.closedAt))
}

/** "Last call: Left a message, Nov 14 · 2 calls". */
export function callLine(summary: CallSummary): string {
  const day = shortDay(summary.latestAt)
  const calls = summary.count === 1 ? '1 call' : `${summary.count.toLocaleString('en-US')} calls`
  return `Last call: ${CALL_OUTCOME_LABELS[summary.latestOutcome]}${day === null ? '' : `, ${day}`} · ${calls}`
}

/** The tel: link for a stored phone number: digits, and a leading plus. null when it has no digits. */
export function telHref(phone: string): string | null {
  const trimmed = phone.trim()
  const digits = trimmed.replace(/\D/g, '')
  if (digits.length === 0) return null
  return `tel:${trimmed.startsWith('+') ? '+' : ''}${digits}`
}

// --- The summary line.

export type ContactCounts = { accepted: number; withAddress: number; lookingUp: number; notChecked: number }

/** Counts over every accepted lead, by the same states as the Accepted leads list. */
export function contactCounts(input: {
  leads: readonly Pick<WorklistLeadInput, 'subjectType' | 'subjectRef' | 'site'>[]
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
