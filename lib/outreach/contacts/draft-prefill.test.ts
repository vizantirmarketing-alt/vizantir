// Run with: pnpm exec tsx --test lib/outreach/contacts/draft-prefill.test.ts
// Drafting with a found contact address. Memory stores and a scripted model only. Fictional data.
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import type { CallModel } from '@/lib/briefing/narrative'

import { writeDraft, type DraftDeps } from '../draft'
import { MemoryContactStore } from '../fixtures/memory-contact-store'
import { MemoryOutreachStore } from '../fixtures/memory-store'
import { FIXTURE_SETTINGS, GOOD_PROSPECT_REPLY, prospectLead } from '../fixtures/leads.fixture'
import { editDraft } from '../lifecycle'
import { decideContact, siteForProspect } from './rules'
import type { ContactLead } from './runs'
import { contactNote } from './view'

const NOW = new Date('2026-11-13T18:00:00.000Z')
const LEAD = prospectLead()
const CONTACT_LEAD: ContactLead = { subjectType: 'prospect', subjectRef: LEAD.id, leadId: LEAD.id, name: LEAD.name, site: siteForProspect(LEAD.domain) }
const PAGE = `https://${LEAD.domain}/contact`

const model: CallModel = async () => ({ ok: true, text: JSON.stringify(GOOD_PROSPECT_REPLY) })

async function contactsWith(email: string): Promise<MemoryContactStore> {
  const contacts = new MemoryContactStore([CONTACT_LEAD])
  const site = siteForProspect(LEAD.domain)!
  const decision = decideContact(
    { name: LEAD.name, site },
    { id: '00000000-0000-4000-8000-000000000001', pages_read: [PAGE], addresses: [{ email, page_url: PAGE, context: `Email ${email}` }] },
  )
  await contacts.saveLeadResult(CONTACT_LEAD, decision, NOW.toISOString())
  return contacts
}

function deps(store: MemoryOutreachStore, contacts?: MemoryContactStore): DraftDeps {
  return { store, callModel: model, modelName: 'test-model', now: () => NOW, ...(contacts ? { contacts } : {}) }
}

describe('drafting with a found contact address', () => {
  it('starts To as the found address', async () => {
    const store = new MemoryOutreachStore(FIXTURE_SETTINGS)
    const result = await writeDraft(deps(store, await contactsWith(`info@${LEAD.domain}`)), LEAD)
    assert.ok(result.ok)
    assert.equal(store.drafts[0]!.toEmail, `info@${LEAD.domain}`)
  })

  it('leaves To empty when the address is suppressed, by address or by domain, and says why', async () => {
    for (const entry of [
      { email: `info@${LEAD.domain}`, domain: null },
      { email: `someone@${LEAD.domain}`, domain: LEAD.domain },
    ]) {
      const store = new MemoryOutreachStore(FIXTURE_SETTINGS)
      await store.addSuppression({ ...entry, reason: 'manual' }, NOW.toISOString())
      const result = await writeDraft(deps(store, await contactsWith(`info@${LEAD.domain}`)), LEAD)
      assert.ok(result.ok)
      assert.equal(store.drafts[0]!.toEmail, null)
    }
    const note = contactNote({ status: 'found', email: `info@${LEAD.domain}`, sourceUrl: PAGE, waiting: false }, true)
    assert.equal(note.tone, 'warning')
    assert.match(note.text, /is on the do-not-contact list, so To was left empty\.$/)
  })

  it('leaves To empty with no contact store, no found address, or a failing read', async () => {
    const plain = new MemoryOutreachStore(FIXTURE_SETTINGS)
    assert.ok((await writeDraft(deps(plain), LEAD)).ok)
    assert.equal(plain.drafts[0]!.toEmail, null)

    const named = new MemoryOutreachStore(FIXTURE_SETTINGS)
    assert.ok((await writeDraft(deps(named, await contactsWith(`jordan@${LEAD.domain}`)), LEAD)).ok)
    assert.equal(named.drafts[0]!.toEmail, null)

    const failing = new MemoryOutreachStore(FIXTURE_SETTINGS)
    const broken = {
      getContact: async () => {
        throw new Error('relation does not exist')
      },
    }
    assert.ok((await writeDraft({ ...deps(failing), contacts: broken }, LEAD)).ok)
    assert.equal(failing.drafts[0]!.toEmail, null)
  })

  it('an owner edit to To leaves the stored result alone', async () => {
    const store = new MemoryOutreachStore(FIXTURE_SETTINGS)
    const contacts = await contactsWith(`info@${LEAD.domain}`)
    const before = JSON.stringify(contacts.contacts)
    const result = await writeDraft(deps(store, contacts), LEAD)
    assert.ok(result.ok)
    const edited = await editDraft(store, result.draftId, { toEmail: 'owner.choice@another.example', subject: 'Your contact page', body: GOOD_PROSPECT_REPLY.body }, NOW.toISOString())
    assert.ok(edited.ok)
    assert.equal(store.drafts[0]!.toEmail, 'owner.choice@another.example')
    assert.equal(JSON.stringify(contacts.contacts), before)
  })

  it('shows where the address was found, or the status in words', () => {
    const found = contactNote({ status: 'found', email: `info@${LEAD.domain}`, sourceUrl: PAGE, waiting: false })
    assert.deepEqual(found, { text: 'Found on', link: { href: PAGE, label: LEAD.domain }, tone: 'normal' })
    assert.equal(
      contactNote({ status: 'named_only', email: null, sourceUrl: null, waiting: false }).text,
      "Only a named person's address is published. Add an address yourself if you want to write to them.",
    )
    assert.equal(contactNote(null).text, 'Not checked for a contact address yet.')
    assert.match(contactNote({ status: null, email: null, sourceUrl: null, waiting: true }).text, /^Waiting for the research runner/)
  })
})
