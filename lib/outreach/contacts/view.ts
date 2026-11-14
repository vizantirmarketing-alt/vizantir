/**
 * What the pages say about a lead's contact address. Pure; safe for client
 * components. The address itself is only ever shown as the draft's To, never
 * here, except when it is on the do-not-contact list and To was left empty.
 */

import { parseHttpUrl } from '@/lib/new-businesses/website-hosts'
import type { ContactStatus } from '@/lib/outreach/contacts/rules'

export type ContactNote = {
  text: string
  /** The page the address was found on, linked as its host. */
  link: { href: string; label: string } | null
  tone: 'normal' | 'warning'
}

export type ContactSnapshot = {
  status: ContactStatus | null
  email: string | null
  sourceUrl: string | null
  /** Held by an open run. */
  waiting: boolean
}

export const CONTACT_STATUS_TEXT: Record<Exclude<ContactStatus, 'found'>, string> = {
  none_found: "No contact address was found on the business's pages.",
  named_only: "Only a named person's address is published. Add an address yourself if you want to write to them.",
  no_page: 'There is no website or listing page to check for a contact address.',
  unclear: 'The contact address check did not finish cleanly. Find contact email on the lead tries again.',
}

function hostOf(url: string): string | null {
  const parsed = parseHttpUrl(url)
  return parsed === null ? null : parsed.hostname.toLowerCase().replace(/^www\./, '')
}

/**
 * One line for a lead's contact address. suppressed is true when the found
 * address is on the do-not-contact list now.
 */
export function contactNote(contact: ContactSnapshot | null, suppressed = false): ContactNote {
  if (contact === null || (contact.status === null && !contact.waiting)) {
    return { text: 'Not checked for a contact address yet.', link: null, tone: 'normal' }
  }
  if (contact.waiting) return { text: 'Waiting for the research runner to look for a contact address.', link: null, tone: 'normal' }
  if (contact.status === 'found' && contact.email !== null && contact.sourceUrl !== null) {
    const host = hostOf(contact.sourceUrl)
    const href = parseHttpUrl(contact.sourceUrl)?.toString() ?? null
    if (suppressed) {
      return {
        text: `The address found${host ? ` on ${host}` : ''}, ${contact.email}, is on the do-not-contact list, so To was left empty.`,
        link: null,
        tone: 'warning',
      }
    }
    return { text: 'Found on', link: href !== null && host !== null ? { href, label: host } : null, tone: 'normal' }
  }
  if (contact.status === null || contact.status === 'found') return { text: 'Not checked for a contact address yet.', link: null, tone: 'normal' }
  return { text: CONTACT_STATUS_TEXT[contact.status], link: null, tone: 'normal' }
}

/** "4 of 12 accepted leads have a contact address · 3 waiting to be checked". */
export function contactSummaryLine(summary: { accepted: number; withAddress: number; waiting: number }): string {
  const leads = summary.accepted === 1 ? 'accepted lead has' : 'accepted leads have'
  return `${summary.withAddress} of ${summary.accepted} ${leads} a contact address · ${summary.waiting} waiting to be checked`
}
