import 'server-only'

/**
 * Read-only loaders for what the pages show about contact addresses. Each
 * returns null when the tables cannot be read (for example before migration
 * 0034), so a page renders without the line rather than failing.
 */

import { isSuppressed } from '@/lib/outreach/lifecycle'
import { sortLeads, type StoredContact } from '@/lib/outreach/contacts/runs'
import { createContactStore, fetchContactRuns, type ContactRunRow } from '@/lib/outreach/contacts/store'
import { contactNote, type ContactNote } from '@/lib/outreach/contacts/view'
import { emailDomain, type OutreachSubjectType } from '@/lib/outreach/params'
import { createOutreachStore } from '@/lib/outreach/store'

async function noteFor(contact: StoredContact | undefined): Promise<ContactNote> {
  if (contact === undefined) return contactNote(null)
  let suppressed = false
  if (contact.status === 'found' && contact.email !== null) {
    const matches = await createOutreachStore().findSuppressions(contact.email, emailDomain(contact.email))
    suppressed = isSuppressed(contact.email, matches)
  }
  return contactNote(
    { status: contact.status, email: contact.email, sourceUrl: contact.sourceUrl, waiting: contact.heldByRunId !== null },
    suppressed,
  )
}

/** Notes keyed by subject ref. */
export async function loadContactNotes(subjectType: OutreachSubjectType, subjectRefs: readonly string[]): Promise<Map<string, ContactNote> | null> {
  try {
    const contacts = await createContactStore().contactsFor(subjectType, subjectRefs)
    const byRef = new Map(contacts.map((contact) => [contact.subjectRef, contact]))
    const notes = new Map<string, ContactNote>()
    for (const ref of subjectRefs) notes.set(ref, await noteFor(byRef.get(ref)))
    return notes
  } catch {
    return null
  }
}

export async function loadContactNote(subjectType: OutreachSubjectType, subjectRef: string): Promise<ContactNote | null> {
  return (await loadContactNotes(subjectType, [subjectRef]))?.get(subjectRef) ?? null
}

export type ContactSummary = { accepted: number; withAddress: number; waiting: number; latestRun: ContactRunRow | null }

/** The Outreach page's one line: accepted leads with an address, and how many wait to be checked. */
export async function loadContactSummary(): Promise<ContactSummary | null> {
  try {
    const store = createContactStore()
    const [leads, contacts, runs] = await Promise.all([store.listAcceptedLeads(), store.listContacts(), fetchContactRuns(1)])
    if (runs === null) return null
    const sorted = sortLeads(leads, contacts)
    return {
      accepted: sorted.accepted,
      withAddress: sorted.withAddress,
      waiting: sorted.eligible.length + sorted.held,
      latestRun: runs[0] ?? null,
    }
  } catch {
    return null
  }
}
