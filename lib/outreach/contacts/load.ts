import 'server-only'

/**
 * Read-only loaders for what the pages show about contact addresses. Each
 * returns null when the tables cannot be read (for example before migration
 * 0034), so a page renders without the line rather than failing.
 */

import { isSuppressed } from '@/lib/outreach/lifecycle'
import type { ContactLead, StoredContact } from '@/lib/outreach/contacts/runs'
import { createContactStore, fetchContactRuns, hasRequestedGeneralRun, type ContactRunRow } from '@/lib/outreach/contacts/store'
import { contactNote, type ContactNote } from '@/lib/outreach/contacts/view'
import { emailDomain, type OutreachSubjectType } from '@/lib/outreach/params'
import { createOutreachStore } from '@/lib/outreach/store'

async function foundAndSuppressed(contact: StoredContact): Promise<boolean> {
  if (contact.status !== 'found' || contact.email === null) return false
  const matches = await createOutreachStore().findSuppressions(contact.email, emailDomain(contact.email))
  return isSuppressed(contact.email, matches)
}

async function noteFor(contact: StoredContact | undefined): Promise<ContactNote> {
  if (contact === undefined) return contactNote(null)
  return contactNote(
    { status: contact.status, email: contact.email, sourceUrl: contact.sourceUrl, waiting: contact.heldByRunId !== null },
    await foundAndSuppressed(contact),
  )
}

/**
 * The draft page's contact line and the found address, for "Changed by you".
 * foundEmail is null when nothing was found or the address is on the
 * do-not-contact list, so it is never offered back. null when contacts
 * cannot be read.
 */
export async function loadDraftContact(
  subjectType: OutreachSubjectType,
  subjectRef: string,
): Promise<{ note: ContactNote; foundEmail: string | null } | null> {
  try {
    const contact = (await createContactStore().contactsFor(subjectType, [subjectRef]))[0]
    const note = await noteFor(contact)
    const usable = contact !== undefined && contact.status === 'found' && contact.email !== null && !(await foundAndSuppressed(contact))
    return { note, foundEmail: usable ? contact.email : null }
  } catch {
    return null
  }
}

/** A lead's contact status, for the call line on a draft. null when there is none or contacts cannot be read. */
export async function loadContactStatus(subjectType: OutreachSubjectType, subjectRef: string): Promise<StoredContact['status']> {
  try {
    return (await createContactStore().contactsFor(subjectType, [subjectRef]))[0]?.status ?? null
  } catch {
    return null
  }
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

/** The latest contact run, for "Last check:". null when runs cannot be read (for example before migration 0034). */
export async function loadLatestContactRun(): Promise<{ latestRun: ContactRunRow | null } | null> {
  const runs = await fetchContactRuns(1)
  return runs === null ? null : { latestRun: runs[0] ?? null }
}

export type WorklistContacts = {
  leads: ContactLead[]
  /** null when the contact tables cannot be read (for example before migration 0034). */
  contacts: StoredContact[] | null
  generalRunQueued: boolean
}

/**
 * Accepted leads for the Outreach page's list, with their contact rows.
 * Accepted leads come from the prospects and New Businesses tables, so they
 * load even when the contact tables do not exist yet. null when the leads
 * themselves cannot be read.
 */
export async function loadWorklistContacts(): Promise<WorklistContacts | null> {
  const store = createContactStore()
  let leads: ContactLead[]
  try {
    leads = await store.listAcceptedLeads()
  } catch {
    return null
  }
  try {
    const [contacts, generalRunQueued] = await Promise.all([store.listContacts(), hasRequestedGeneralRun()])
    return { leads, contacts, generalRunQueued }
  } catch {
    return { leads, contacts: null, generalRunQueued: false }
  }
}
