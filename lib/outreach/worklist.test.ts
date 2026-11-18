// Run with: NODE_OPTIONS=--conditions=react-server pnpm exec tsx --test lib/outreach/worklist.test.ts
// The Outreach worklist, accepting a lead, the opt-out line and the settings page notices.
// Memory stores and fictional data only. No network or database.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'

import type { CallModel } from '@/lib/briefing/narrative'

import { reviewAndQueueContact } from './accept'
import { siteForBusiness, siteForProspect } from './contacts/rules'
import { MAX_WAITING_CONTACT_RUNS, queueLeadContactCheck, type ContactLead } from './contacts/runs'
import { writeDraft } from './draft'
import { MemoryContactStore } from './fixtures/memory-contact-store'
import { MemoryCallStore } from './fixtures/memory-call-store'
import { MemoryOutreachStore } from './fixtures/memory-store'
import { FIXTURE_SETTINGS, GOOD_PROSPECT_REPLY, prospectLead } from './fixtures/leads.fixture'
import { OUTREACH_SETTINGS_PATH, RESULT_COOKIE_PATH, RESULT_PARAM, settingsResultUrl } from './gmail/flash'
import type { ConnectionView } from './gmail/view'
import { OPT_OUT_LINE, type OutreachStatus } from './params'
import type { OutreachDraft, SubjectState } from './types'
import {
  ADD_ADDRESS_HINT,
  WAITING_TEXT,
  acceptedLeadRows,
  contactCounts,
  contactSummaryLine,
  foundAddressLabel,
  groupSent,
  setupNotice,
  type WorklistContactInput,
  type WorklistLeadInput,
} from './worklist'

const NOW = new Date('2026-11-14T18:00:00.000Z')

const PROSPECT: WorklistLeadInput = {
  subjectType: 'prospect',
  subjectRef: 'p-1',
  leadId: 'p-1',
  name: 'Fictional Firm',
  site: siteForProspect('fictionalfirm.example'),
  phone: null,
  hasFinding: true,
}
const BUSINESS: WorklistLeadInput = {
  subjectType: 'new_business',
  subjectRef: 'sample shop|las vegas',
  leadId: 'b-1',
  name: 'Sample Shop',
  site: siteForBusiness('has_website', 'https://sampleshop.example/'),
  phone: null,
  hasFinding: true,
}

function rows(
  contacts: WorklistContactInput[] | null,
  options: { leads?: WorklistLeadInput[]; states?: SubjectState[]; generalRunQueued?: boolean; suppressions?: { email: string; domain: string | null }[] } = {},
) {
  return acceptedLeadRows({
    leads: options.leads ?? [PROSPECT, BUSINESS],
    states: options.states ?? [],
    contacts,
    suppressions: options.suppressions ?? [],
    generalRunQueued: options.generalRunQueued ?? false,
  })
}

const contact = (lead: WorklistLeadInput, fields: Partial<WorklistContactInput>): WorklistContactInput => ({
  subjectType: lead.subjectType,
  subjectRef: lead.subjectRef,
  status: null,
  email: null,
  waiting: false,
  ...fields,
})

describe('accepted leads', () => {
  it('lists both lead types, in the order given', () => {
    assert.deepEqual(rows([]).map((row) => [row.subjectType, row.name]), [
      ['prospect', 'Fictional Firm'],
      ['new_business', 'Sample Shop'],
    ])
  })

  it('not checked and no run queued: Find contact email', () => {
    const [row] = rows([], { leads: [PROSPECT] })
    assert.equal(row!.action, 'find_contact')
    assert.equal(row!.checkAgain, false)
  })

  it('waiting for the runner: no button, and the waiting text', () => {
    for (const result of [
      rows([contact(PROSPECT, { waiting: true })], { leads: [PROSPECT] }),
      // Unchecked with a page while a scheduled run waits: it is in that run.
      rows([], { leads: [PROSPECT], generalRunQueued: true }),
    ]) {
      assert.equal(result[0]!.action, 'none')
      assert.equal(result[0]!.statusText, WAITING_TEXT)
      assert.equal(result[0]!.checkAgain, false)
    }
    assert.equal(WAITING_TEXT, 'Looking for a contact address. Runs with the next scheduled research.')
  })

  it('found: Draft email, with the address shown', () => {
    const [row] = rows([contact(PROSPECT, { status: 'found', email: 'info@fictionalfirm.example' })], { leads: [PROSPECT] })
    assert.equal(row!.action, 'draft')
    assert.equal(row!.address, 'info@fictionalfirm.example')
    assert.equal(row!.addressHint, null)
    assert.equal(row!.checkAgain, false)
  })

  it('none_found, named_only, no_page and unclear: Draft email, the status in words, and the hint', () => {
    const expected = { none_found: true, named_only: true, no_page: false, unclear: true } as const
    for (const status of ['none_found', 'named_only', 'no_page', 'unclear'] as const) {
      const [row] = rows([contact(PROSPECT, { status })], { leads: [PROSPECT] })
      assert.equal(row!.action, 'draft', status)
      assert.equal(row!.address, null, status)
      assert.equal(row!.addressHint, ADD_ADDRESS_HINT, status)
      assert.ok(row!.statusText.length > 0, status)
      assert.equal(row!.checkAgain, expected[status], status)
    }
    assert.equal(ADD_ADDRESS_HINT, 'You will need to add an address yourself.')
  })

  it('every row has exactly one primary action', () => {
    const all = rows([
      contact(PROSPECT, { status: 'named_only' }),
      contact(BUSINESS, { waiting: true }),
    ])
    for (const row of all) assert.ok(['find_contact', 'draft', 'none'].includes(row.action))
  })

  it('a found address on the do-not-contact list is not shown as the address to use', () => {
    const [row] = rows([contact(PROSPECT, { status: 'found', email: 'info@fictionalfirm.example' })], {
      leads: [PROSPECT],
      suppressions: [{ email: 'someone@fictionalfirm.example', domain: 'fictionalfirm.example' }],
    })
    assert.equal(row!.action, 'draft')
    assert.equal(row!.address, null)
    assert.equal(row!.addressHint, ADD_ADDRESS_HINT)
    assert.match(row!.statusText, /do-not-contact/)
  })

  it('excludes leads with an open draft or a sent email, and keeps those whose drafts were all discarded', () => {
    for (const status of ['draft', 'approved', 'sending', 'send_unconfirmed', 'sent'] as OutreachStatus[]) {
      const result = rows([], { states: [{ subjectType: 'prospect', subjectRef: 'p-1', status }] })
      assert.deepEqual(result.map((row) => row.name), ['Sample Shop'], status)
    }
    const discarded = rows([], { states: [{ subjectType: 'prospect', subjectRef: 'p-1', status: 'discarded' }] })
    assert.equal(discarded.length, 2)
    // The same ref under the other type is another lead.
    const otherType = rows([], { states: [{ subjectType: 'new_business', subjectRef: 'p-1', status: 'sent' }] })
    assert.equal(otherType.length, 2)
  })

  it('without contact tables every lead offers Draft email; a pending website check offers Draft email too', () => {
    for (const row of rows(null)) {
      assert.equal(row.action, 'draft')
      assert.equal(row.addressHint, ADD_ADDRESS_HINT)
    }
    const pending: WorklistLeadInput = { ...BUSINESS, site: 'pending' }
    const [row] = rows([], { leads: [pending], generalRunQueued: true })
    assert.equal(row!.action, 'draft')
    assert.match(row!.statusText, /website check/)
  })
})

describe('accepting a lead queues its contact lookup', () => {
  const lead: ContactLead = { subjectType: 'prospect', subjectRef: 'p-1', leadId: 'p-1', name: 'Fictional Firm', site: siteForProspect('fictionalfirm.example') }

  it('queues exactly one one-lead lookup through the single-lead path', async () => {
    const contacts = new MemoryContactStore([])
    let writes = 0
    const outcome = await reviewAndQueueContact(
      'accepted',
      async () => {
        writes += 1
        contacts.leads = [lead]
        return { ok: true }
      },
      () => queueLeadContactCheck(contacts, { subjectType: 'prospect', leadId: 'p-1' }, NOW),
    )
    assert.deepEqual(outcome, { ok: true, contact: 'queued' })
    assert.equal(writes, 1)
    assert.equal(contacts.runs.length, 1)
    assert.equal((await contacts.getContact(lead))?.heldByRunId, contacts.runs[0]!.id)
  })

  it('a failing or refused queue never fails the accept', async () => {
    const failed = await reviewAndQueueContact('accepted', async () => ({ ok: true }), async () => {
      throw new Error('relation "outreach_contact_runs" does not exist')
    })
    assert.deepEqual(failed, { ok: true, contact: 'failed' })

    // The same caps as Find contact email: past them the accept still succeeds.
    const contacts = new MemoryContactStore([lead])
    for (let i = 0; i < MAX_WAITING_CONTACT_RUNS; i += 1) await contacts.requestRun('dashboard', null, NOW.toISOString())
    const capped = await reviewAndQueueContact('accepted', async () => ({ ok: true }), () =>
      queueLeadContactCheck(contacts, { subjectType: 'prospect', leadId: 'p-1' }, NOW),
    )
    assert.deepEqual(capped, { ok: true, contact: 'limit_reached' })
  })

  it('Reject, Archive and reset queue nothing, and a failed review write queues nothing', async () => {
    let queued = 0
    const queue = async () => {
      queued += 1
      return { outcome: 'queued' as const, runId: 'r' }
    }
    for (const status of ['rejected', 'archived', 'unreviewed']) {
      assert.deepEqual(await reviewAndQueueContact(status, async () => ({ ok: true }), queue), { ok: true, contact: 'skipped' })
    }
    assert.deepEqual(await reviewAndQueueContact('accepted', async () => ({ ok: false, error: 'Prospect not found.' }), queue), {
      ok: false,
      error: 'Prospect not found.',
      contact: 'skipped',
    })
    assert.equal(queued, 0)
  })
})

function sent(id: string, subjectRef: string, sentAt: string, subject = `Email ${id}`): OutreachDraft {
  return {
    id,
    subjectType: 'prospect',
    subjectRef,
    leadId: subjectRef,
    leadName: `Firm ${subjectRef}`,
    toEmail: 'info@firm.example',
    subject,
    body: 'Hello,',
    footer: '',
    status: 'sent',
    model: 'test-model',
    promptVersion: 'v',
    createdAt: sentAt,
    updatedAt: sentAt,
    approvedAt: sentAt,
    sentAt,
    sentVia: 'gmail',
    gmailMessageId: null,
    gmailThreadId: null,
    sendError: null,
  }
}

describe('sent, grouped by business', () => {
  it('one line per business, newest first, with the count and the latest email', () => {
    const groups = groupSent([
      sent('a1', 'a', '2026-11-01T17:00:00Z', 'First to A'),
      sent('b1', 'b', '2026-11-05T17:00:00Z', 'Only to B'),
      sent('a3', 'a', '2026-11-09T17:00:00Z', 'Third to A'),
      sent('a2', 'a', '2026-11-03T17:00:00Z', 'Second to A'),
    ])
    assert.deepEqual(
      groups.map((group) => [group.subjectRef, group.count, group.latestId, group.latestSubject, group.latestSentAt]),
      [
        ['a', 3, 'a3', 'Third to A', '2026-11-09T17:00:00Z'],
        ['b', 1, 'b1', 'Only to B', '2026-11-05T17:00:00Z'],
      ],
    )
  })

  it('ignores rows that are not sent', () => {
    assert.deepEqual(groupSent([{ ...sent('x', 'a', '2026-11-01T17:00:00Z'), status: 'approved' }]), [])
  })
})

describe('the opt-out line', () => {
  const model: CallModel = async () => ({ ok: true, text: JSON.stringify(GOOD_PROSPECT_REPLY) })

  it('is exactly the new sentence', () => {
    assert.equal(OPT_OUT_LINE, "If you'd rather not hear from me again, just reply and let me know. I won't write again.")
  })

  it('ends the footer of a newly written draft', async () => {
    const store = new MemoryOutreachStore(FIXTURE_SETTINGS)
    const result = await writeDraft({ store, callModel: model, modelName: 'test-model', now: () => NOW, calls: new MemoryCallStore() }, prospectLead())
    assert.ok(result.ok)
    assert.ok(store.drafts[0]!.footer.endsWith("\n\nIf you'd rather not hear from me again, just reply and let me know. I won't write again."))
  })
})

describe('the note under To', () => {
  it('"Found on" only while To is the found address, ignoring case and spaces', () => {
    assert.deepEqual(foundAddressLabel('info@firm.example', 'info@firm.example'), { kind: 'found' })
    assert.deepEqual(foundAddressLabel('info@firm.example', '  INFO@Firm.example '), { kind: 'found' })
  })

  it('a changed To shows the found address with a way back', () => {
    assert.deepEqual(foundAddressLabel('info@firm.example', 'owner@elsewhere.example'), {
      kind: 'changed',
      text: 'Changed by you. Found address: info@firm.example',
      address: 'info@firm.example',
    })
    assert.equal((foundAddressLabel('info@firm.example', '') as { text: string }).text, 'Found address: info@firm.example')
  })

  it('with no found address the contact note shows as it is', () => {
    assert.deepEqual(foundAddressLabel(null, 'owner@elsewhere.example'), { kind: 'none' })
  })
})

describe('settings page', () => {
  const connected: ConnectionView = { state: 'connected', email: 'studio@vizantir.example', connectedAt: NOW.toISOString(), sendsAs: null, fits: true }

  it('says when required settings are missing', () => {
    const notice = setupNotice({ ...FIXTURE_SETTINGS, postalAddress: '' }, connected)
    assert.match(notice ?? '', /^Add the postal mailing address in Outreach settings/)
    assert.match(setupNotice(null, connected) ?? '', /sender name, studio name, reply-to email and postal mailing address/)
  })

  it('says when Google needs reconnecting, and nothing when all is set up', () => {
    assert.match(setupNotice(FIXTURE_SETTINGS, { ...connected, state: 'needs_reconnect' }) ?? '', /Google needs to be reconnected/)
    assert.match(setupNotice(FIXTURE_SETTINGS, { ...connected, fits: false }) ?? '', /cannot send as the reply-to address/)
    assert.equal(setupNotice(FIXTURE_SETTINGS, connected), null)
    // Not connecting Google at all is a choice: emails can still go from the mail app.
    assert.equal(setupNotice(FIXTURE_SETTINGS, { state: 'not_connected' }), null)
  })

  it('the Google start and callback routes return to the settings page, where the result cookie is readable', () => {
    const url = settingsResultUrl('https://vizantir.example')
    assert.equal(url.pathname, '/intel/outreach/settings')
    assert.equal(url.pathname, OUTREACH_SETTINGS_PATH)
    assert.equal(url.searchParams.get(RESULT_PARAM), '1')
    assert.equal(url.origin, 'https://vizantir.example')
    assert.ok(OUTREACH_SETTINGS_PATH.startsWith(`${RESULT_COOKIE_PATH}/`), 'the cookie path covers the settings page')
    // Both routes answer through the one helper that builds this URL.
    const source = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8')
    assert.match(source('../../app/api/outreach/google/redirect.ts'), /NextResponse\.redirect\(settingsResultUrl\(origin\), 303\)/)
    for (const route of ['start', 'callback']) {
      const text = source(`../../app/api/outreach/google/${route}/route.ts`)
      assert.match(text, /backToSettings\(/, route)
      assert.doesNotMatch(text, /new URL\('\/intel\/outreach'/, route)
    }
  })
})

describe('the summary line', () => {
  const line = (accepted: number, withAddress: number, lookingUp: number, notChecked: number) =>
    contactSummaryLine({ accepted, withAddress, lookingUp, notChecked })

  it('names the accepted leads with a contact address, singular and plural', () => {
    assert.equal(line(0, 0, 0, 0), '0 of 0 accepted leads have a contact address')
    assert.equal(line(1, 1, 0, 0), '1 of 1 accepted lead has a contact address')
    assert.equal(line(1, 0, 0, 0), '0 of 1 accepted lead has a contact address')
    assert.equal(line(12, 4, 0, 0), '4 of 12 accepted leads have a contact address')
    assert.equal(line(1200, 40, 0, 0), '40 of 1,200 accepted leads have a contact address')
  })

  it('"being looked up" only when above zero', () => {
    assert.ok(!line(3, 1, 0, 0).includes('looked up'))
    assert.equal(line(3, 1, 1, 0), '1 of 3 accepted leads have a contact address · 1 being looked up')
    assert.equal(line(5, 1, 3, 0), '1 of 5 accepted leads have a contact address · 3 being looked up')
  })

  it('"not checked yet" only when above zero, after "being looked up"', () => {
    assert.ok(!line(3, 1, 0, 0).includes('not checked'))
    assert.equal(line(3, 1, 0, 1), '1 of 3 accepted leads have a contact address · 1 not checked yet')
    assert.equal(line(6, 0, 0, 4), '0 of 6 accepted leads have a contact address · 4 not checked yet')
    assert.equal(line(9, 2, 3, 4), '2 of 9 accepted leads have a contact address · 3 being looked up · 4 not checked yet')
  })

  it('counts by the same states as the Accepted leads list', () => {
    const third: WorklistLeadInput = { ...PROSPECT, subjectRef: 'p-3', leadId: 'p-3', name: 'Third Firm' }
    const pending: WorklistLeadInput = { ...BUSINESS, subjectRef: 'pending shop|las vegas', leadId: 'b-2', site: 'pending' }
    const leads = [PROSPECT, BUSINESS, third, pending]
    const contacts = [contact(PROSPECT, { status: 'found', email: 'info@fictionalfirm.example' }), contact(BUSINESS, { waiting: true })]
    const counts = contactCounts({ leads, contacts, generalRunQueued: false })
    assert.deepEqual(counts, { accepted: 4, withAddress: 1, lookingUp: 1, notChecked: 1 })
    const listed = rows(contacts, { leads })
    assert.equal(listed.filter((row) => row.action === 'none').length, counts.lookingUp)
    assert.equal(listed.filter((row) => row.action === 'find_contact').length, counts.notChecked)

    // A waiting scheduled run will include the unchecked lead with a page: it is being looked up.
    assert.deepEqual(contactCounts({ leads, contacts, generalRunQueued: true }), { accepted: 4, withAddress: 1, lookingUp: 2, notChecked: 0 })
  })
})
