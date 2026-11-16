// Run with: NODE_OPTIONS=--conditions=react-server pnpm exec tsx --test lib/outreach/honesty-and-calls.test.ts
// Drafts that claim only what is known, hand-written drafts, and the call log.
// Memory stores, a scripted model and fictional data only. No network or database.
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import type { CallModel } from '@/lib/briefing/narrative'
import { WEBSITE_STATUSES } from '@/lib/new-businesses/website-rules'

import { ASKED_NOT_TO_CONTACT_REFUSAL, askedNotToContact, logCall, summarizeCalls, type CallOutcome, type OutreachCall } from './calls'
import { siteForBusiness, siteForProspect } from './contacts/rules'
import { buildOutreachContext, hasSpecificFinding } from './context'
import { MANUAL_PROMPT_VERSION, writeDraft, writeManualDraft, type DraftDeps } from './draft'
import { MemoryCallStore } from './fixtures/memory-call-store'
import { MemoryGmailConnectionStore, MemoryOutreachStore } from './fixtures/memory-store'
import { FIXTURE_SETTINGS, GOOD_BUSINESS_REPLY, GOOD_PROSPECT_REPLY, businessLead, prospectLead } from './fixtures/leads.fixture'
import { NOW as SEND_NOW, TEST_CONFIG, connectionFor, scriptedFetch } from './fixtures/gmail.fixture'
import { approveAndSend } from './gmail/send'
import { approveDraft } from './lifecycle'
import { NO_FINDING_TEXT, OPT_OUT_LINE, type OutreachSubjectType } from './params'
import { outreachSystemPrompt } from './prompt'
import { checkVoice, refusalReasons, voiceContextFor } from './voice'
import { acceptedLeadRows, callLine, closedLeadRows, telHref, type WorklistContactInput, type WorklistLeadInput } from './worklist'

const NOW = new Date('2026-11-15T18:00:00.000Z')

function counting(reply: object): { model: CallModel; calls: () => number } {
  let n = 0
  return {
    model: async () => {
      n += 1
      return { ok: true, text: JSON.stringify(reply) }
    },
    calls: () => n,
  }
}

function deps(store: MemoryOutreachStore, model: CallModel | null, extra: Partial<DraftDeps> = {}): DraftDeps {
  return { store, callModel: model, modelName: 'test-model', now: () => NOW, ...extra }
}

const businessVoice = () => voiceContextFor(buildOutreachContext(businessLead()), FIXTURE_SETTINGS.studioName)
const prospectVoice = () => voiceContextFor(buildOutreachContext(prospectLead()), FIXTURE_SETTINGS.studioName)

describe('never calling a business new', () => {
  const NEW_WORDING = [
    'Your new carpet cleaning business',
    'This looks like a good start for a newly licensed business.',
    'I saw that you recently opened in Henderson.',
    'Congratulations on opening your doors.',
    "I know you're just getting started.",
    'I noticed your new restaurant on Example Street.',
    'I saw the business license was listed last month.',
    'As a brand new shop, a site could help.',
    'Since you just launched, it may be early.',
    'It must be busy starting out.',
  ]

  it('refuses each phrasing in the body, in plain words', () => {
    for (const sentence of NEW_WORDING) {
      const body = GOOD_BUSINESS_REPLY.body.replace('I came across Desert Bloom Tacos in Henderson.', sentence)
      const violations = checkVoice({ subject: GOOD_BUSINESS_REPLY.subject, body }, businessVoice())
      assert.ok(violations.some((v) => v.rule === 'new_business'), sentence)
      assert.ok(refusalReasons(violations).some((reason) => reason.startsWith('It called the business new')), sentence)
    }
  })

  it('refuses it in the subject, and for a prospect too', () => {
    for (const subject of ['Your new carpet cleaning business', 'Your newly opened shop', 'A site for your new business']) {
      assert.ok(checkVoice({ subject, body: GOOD_BUSINESS_REPLY.body }, businessVoice()).some((v) => v.rule === 'new_business'), subject)
    }
    const body = GOOD_PROSPECT_REPLY.body.replace('I was looking at your site', 'I saw your newly opened firm')
    assert.ok(checkVoice({ subject: GOOD_PROSPECT_REPLY.subject, body }, prospectVoice()).some((v) => v.rule === 'new_business'))
  })

  it('a normal draft still passes, including an offer of a new website', () => {
    assert.deepEqual(checkVoice(GOOD_BUSINESS_REPLY, businessVoice()), [])
    assert.deepEqual(checkVoice(GOOD_PROSPECT_REPLY, prospectVoice()), [])
    const offer = GOOD_BUSINESS_REPLY.body.replace('A simple site with your menu', 'Your new website, with your menu')
    assert.ok(!checkVoice({ subject: GOOD_BUSINESS_REPLY.subject, body: offer }, businessVoice()).some((v) => v.rule === 'new_business'))
  })

  it('the context and the prompt never mention a license or call the business new', () => {
    const context = buildOutreachContext(businessLead())
    assert.ok(!('licensed' in context))
    assert.doesNotMatch(JSON.stringify(context), /licen[cs]|new business|newly/i)
    const prompt = outreachSystemPrompt(FIXTURE_SETTINGS, context)
    assert.doesNotMatch(prompt, /You may say that you saw the business is newly licensed|Your new restaurant/)
    assert.match(prompt, /Never describe the business as new, newly opened, newly licensed, recently started, just getting started/)
  })
})

describe('the finding rule', () => {
  it('a new business has a finding only for no_website, social_only, placeholder or free_builder', () => {
    const expected: Record<string, boolean> = { no_website: true, social_only: true, placeholder: true, free_builder: true, has_website: false, unclear: false }
    for (const status of WEBSITE_STATUSES) {
      assert.equal(hasSpecificFinding(businessLead({ websiteStatus: status })), expected[status], status)
    }
    assert.equal(hasSpecificFinding(businessLead({ websiteStatus: null })), false, 'not yet checked')
  })

  it('a prospect has a finding only with a stored observation', () => {
    assert.equal(hasSpecificFinding(prospectLead()), true)
    const lead = prospectLead()
    assert.equal(hasSpecificFinding({ ...lead, evidence: [] }), false)
    assert.equal(hasSpecificFinding({ ...lead, evidence: lead.evidence.filter((e) => e.kind === 'measurement') }), false, 'a measurement alone')
    assert.equal(
      hasSpecificFinding({ ...lead, evidence: [{ factorKey: 'navigation_conversion_friction', kind: 'inference', claim: 'Visitors probably leave.' }] }),
      false,
      'an inference alone',
    )
  })

  it('no model call for a lead without one; writeDraft refuses on the server', async () => {
    for (const lead of [businessLead({ websiteStatus: 'has_website' }), businessLead({ websiteStatus: 'unclear' }), businessLead({ websiteStatus: null }), { ...prospectLead(), evidence: [] }]) {
      const store = new MemoryOutreachStore(FIXTURE_SETTINGS)
      const { model, calls } = counting(GOOD_BUSINESS_REPLY)
      const result = await writeDraft(deps(store, model), lead)
      assert.deepEqual(result, { ok: false, reason: 'no_finding', message: NO_FINDING_TEXT })
      assert.equal(calls(), 0)
      assert.equal(store.drafts.length, 0)
    }
    assert.equal(NO_FINDING_TEXT, "Nothing specific is known about this business's site yet, so there is no email to draft.")
  })

  it('a lead with a finding is drafted as before, under the new prompt version', async () => {
    const store = new MemoryOutreachStore(FIXTURE_SETTINGS)
    const { model, calls } = counting(GOOD_BUSINESS_REPLY)
    assert.ok((await writeDraft(deps(store, model), businessLead())).ok)
    assert.equal(calls(), 1)
    assert.equal(store.drafts[0]!.promptVersion, 'outreach-v5')
  })
})

describe('Write it yourself', () => {
  const lead = businessLead({ websiteStatus: 'has_website' })

  it('creates a manual draft with no model call, the normal footer, and model and prompt version "manual"', async () => {
    const store = new MemoryOutreachStore(FIXTURE_SETTINGS)
    const result = await writeManualDraft(deps(store, null), lead, { toEmail: 'Info@DesertBloom.example', subject: 'Your listing page', body: 'Hello,\n\nA note.' })
    assert.ok(result.ok)
    const draft = store.drafts[0]!
    assert.equal(draft.model, MANUAL_PROMPT_VERSION)
    assert.equal(draft.promptVersion, 'manual')
    assert.equal(draft.toEmail, 'info@desertbloom.example')
    assert.equal(draft.status, 'draft')
    assert.ok(draft.footer.endsWith(OPT_OUT_LINE))
    assert.equal(draft.subjectRef, 'desert bloom tacos|henderson')
  })

  it('starts To empty when there is no address, and refuses an empty subject or message', async () => {
    const store = new MemoryOutreachStore(FIXTURE_SETTINGS)
    assert.ok((await writeManualDraft(deps(store, null), lead, { toEmail: '', subject: 'Hello', body: 'Hello,' })).ok)
    assert.equal(store.drafts[0]!.toEmail, null)
    const empty = new MemoryOutreachStore(FIXTURE_SETTINGS)
    assert.equal((await writeManualDraft(deps(empty, null), lead, { toEmail: '', subject: ' ', body: 'x' })).ok, false)
    assert.equal((await writeManualDraft(deps(empty, null), lead, { toEmail: '', subject: 'x', body: '  ' })).ok, false)
    assert.equal(empty.drafts.length, 0)
  })

  it('does not start a second draft for a lead that has one', async () => {
    const store = new MemoryOutreachStore(FIXTURE_SETTINGS)
    await writeManualDraft(deps(store, null), lead, { toEmail: '', subject: 'One', body: 'Hello,' })
    const second = await writeManualDraft(deps(store, null), lead, { toEmail: '', subject: 'Two', body: 'Hello,' })
    assert.equal(second.ok, false)
    if (!second.ok) assert.equal(second.reason, 'draft_exists')
  })

  it('the hard writing rules apply when it is approved', async () => {
    const store = new MemoryOutreachStore(FIXTURE_SETTINGS)
    const created = await writeManualDraft(deps(store, null), lead, { toEmail: 'info@desertbloom.example', subject: 'Your new shop', body: 'Hello,\n\nShort.' })
    assert.ok(created.ok)
    const check = async () => ['It called the business new, newly opened or recently started, or mentioned a license.']
    const refused = await approveDraft(store, created.draftId, NOW.toISOString(), { checkRules: check })
    assert.equal(refused.ok, false)
    if (!refused.ok) assert.match(refused.error, /does not meet the writing rules: It called the business new/)
    const passing = await approveDraft(store, created.draftId, NOW.toISOString(), { checkRules: async () => [] })
    assert.ok(passing.ok)
  })
})

function call(subjectRef: string, outcome: CallOutcome, createdAt: string, subjectType: OutreachSubjectType = 'new_business'): OutreachCall {
  return { id: `${subjectRef}-${createdAt}`, subjectType, subjectRef, leadId: subjectRef, outcome, note: null, createdAt, createdBy: 'owner@vizantir.example' }
}

describe('asked not to be contacted', () => {
  const lead = businessLead()
  const subject = { subjectType: 'new_business' as const, subjectRef: 'desert bloom tacos|henderson' }

  it('blocks drafting, writing by hand and approving', async () => {
    const calls = new MemoryCallStore()
    calls.calls.push(call(subject.subjectRef, 'asked_not_to_contact', '2026-11-14T18:00:00Z'))
    const store = new MemoryOutreachStore(FIXTURE_SETTINGS)
    const { model, calls: modelCalls } = counting(GOOD_BUSINESS_REPLY)
    assert.deepEqual(await writeDraft(deps(store, model, { calls }), lead), { ok: false, reason: 'asked_not_to_contact', message: ASKED_NOT_TO_CONTACT_REFUSAL })
    assert.equal(modelCalls(), 0)
    const manual = await writeManualDraft(deps(store, null, { calls }), lead, { toEmail: '', subject: 'Hi', body: 'Hello,' })
    assert.equal(manual.ok, false)

    // A draft written before the call cannot be approved after it.
    const earlier = new MemoryOutreachStore(FIXTURE_SETTINGS)
    const written = await writeDraft(deps(earlier, model), lead)
    assert.ok(written.ok)
    await earlier.updateDraft(written.draftId, ['draft'], { toEmail: 'info@desertbloom.example', updatedAt: NOW.toISOString() })
    const approved = await approveDraft(earlier, written.draftId, NOW.toISOString(), { askedNotToContact: (d) => askedNotToContact(calls, d) })
    assert.equal(approved.ok, false)
    if (!approved.ok) assert.match(approved.error, /asked not to be contacted/)
  })

  it('blocks sending, and a later call does not undo it', async () => {
    const calls = new MemoryCallStore()
    calls.calls.push(call(subject.subjectRef, 'asked_not_to_contact', '2026-11-14T18:00:00Z'), call(subject.subjectRef, 'no_answer', '2026-11-15T17:00:00Z'))
    const store = new MemoryOutreachStore(FIXTURE_SETTINGS)
    const inserted = await store.insertDraft(
      { ...subject, leadId: lead.id, leadName: lead.name, toEmail: 'info@desertbloom.example', subject: 'A website', body: 'Hello,', footer: 'f', model: 'm', promptVersion: 'outreach-v5' },
      null,
      NOW.toISOString(),
    )
    assert.ok(inserted.ok)
    await store.updateDraft(inserted.id, ['draft'], { status: 'approved', approvedAt: NOW.toISOString(), updatedAt: NOW.toISOString() })
    const connections = new MemoryGmailConnectionStore()
    connections.connection = connectionFor('studio@vizantir.example')
    const { fetch, calls: requests } = scriptedFetch({})
    const result = await approveAndSend(
      { store, connections, config: TEST_CONFIG, fetch, now: () => SEND_NOW, checkRules: async () => [], calls },
      inserted.id,
    )
    assert.deepEqual(result, { ok: false, error: ASKED_NOT_TO_CONTACT_REFUSAL, outcome: 'refused' })
    assert.equal(requests.length, 0)
    assert.equal(summarizeCalls(calls.calls)?.closedBy, 'asked_not_to_contact')
  })

  it('logging it puts the found address on the do-not-contact list', async () => {
    const calls = new MemoryCallStore()
    const store = new MemoryOutreachStore(FIXTURE_SETTINGS)
    const result = await logCall(
      {
        calls,
        foundEmail: async () => 'info@desertbloom.example',
        suppress: async (email) => {
          await store.addSuppression({ email, domain: null, reason: 'do_not_contact' }, NOW.toISOString())
        },
      },
      { subject, leadId: lead.id, outcome: 'asked_not_to_contact', note: '  Said please stop.  ', createdBy: 'owner@vizantir.example' },
      NOW.toISOString(),
    )
    assert.deepEqual(result, { ok: true, suppressed: true })
    assert.deepEqual(store.suppressions.map((s) => [s.email, s.reason]), [['info@desertbloom.example', 'do_not_contact']])
    assert.equal(calls.calls[0]!.note, 'Said please stop.')
    // Other outcomes suppress nothing; no found address suppresses nothing.
    const other = await logCall({ calls, foundEmail: async () => 'info@desertbloom.example', suppress: async () => assert.fail('not suppressed') }, { subject, leadId: lead.id, outcome: 'left_message', note: '', createdBy: 'o' }, NOW.toISOString())
    assert.deepEqual(other, { ok: true, suppressed: false })
    const none = await logCall({ calls, foundEmail: async () => null, suppress: async () => assert.fail('not suppressed') }, { subject, leadId: lead.id, outcome: 'asked_not_to_contact', note: '', createdBy: 'o' }, NOW.toISOString())
    assert.deepEqual(none, { ok: true, suppressed: false })
  })
})

describe('a missing call table', () => {
  it('blocks nothing and hides the call features, without throwing', async () => {
    const calls = new MemoryCallStore()
    calls.failing = true
    assert.equal(await askedNotToContact(calls, { subjectType: 'prospect', subjectRef: 'p-1' }), false)
    const store = new MemoryOutreachStore(FIXTURE_SETTINGS)
    const { model } = counting(GOOD_PROSPECT_REPLY)
    assert.ok((await writeDraft(deps(store, model, { calls }), prospectLead())).ok)

    const lead = worklistLead({ phone: '702-555-0142' })
    const [row] = acceptedLeadRows({ leads: [lead], states: [], contacts: [contactRow(lead, 'none_found')], suppressions: [], generalRunQueued: false, calls: null })
    assert.notEqual(row!.action, 'log_call')
    assert.deepEqual(closedLeadRows([lead], null), [])
  })
})

function worklistLead(overrides: Partial<WorklistLeadInput> = {}): WorklistLeadInput {
  return {
    subjectType: 'new_business',
    subjectRef: 'sample shop|las vegas',
    leadId: 'b-1',
    name: 'Sample Shop',
    site: siteForBusiness('social_only', 'https://www.facebook.com/sampleshoplv'),
    phone: null,
    hasFinding: true,
    ...overrides,
  }
}

function contactRow(lead: WorklistLeadInput, status: WorklistContactInput['status'], email: string | null = null): WorklistContactInput {
  return { subjectType: lead.subjectType, subjectRef: lead.subjectRef, status, email, waiting: false }
}

describe('worklist: the next step by contact status, phone and finding', () => {
  const NO_CALLS = new Map()

  it('every combination of contact status, phone and finding', () => {
    type Expect = { action: string; secondary: string | null }
    const expected = (status: string, phone: boolean, finding: boolean): Expect => {
      const draftStep: Expect = finding ? { action: 'draft', secondary: null } : { action: 'none', secondary: 'write' }
      if (phone && ['none_found', 'named_only', 'no_page'].includes(status)) return { action: 'log_call', secondary: finding ? 'draft' : 'write' }
      return draftStep
    }
    for (const status of ['found', 'none_found', 'named_only', 'no_page', 'unclear'] as const) {
      for (const phone of [true, false]) {
        for (const finding of [true, false]) {
          const lead = worklistLead({ phone: phone ? '(702) 555-0142' : null, hasFinding: finding })
          const contact = contactRow(lead, status, status === 'found' ? 'info@sampleshop.example' : null)
          const [row] = acceptedLeadRows({ leads: [lead], states: [], contacts: [contact], suppressions: [], generalRunQueued: false, calls: NO_CALLS })
          const label = `${status}, phone ${phone}, finding ${finding}`
          assert.deepEqual({ action: row!.action, secondary: row!.secondary }, expected(status, phone, finding), label)
          assert.equal(row!.noFindingText, finding ? null : NO_FINDING_TEXT, label)
          assert.equal(row!.phone, phone ? '(702) 555-0142' : null, label)
          if (row!.action === 'log_call') assert.equal(row!.statusText, 'No email address is published. Call (702) 555-0142.', label)
        }
      }
    }
  })

  it('not checked and waiting keep their steps, whatever the phone', () => {
    const lead = worklistLead({ phone: '702-555-0142', hasFinding: false })
    assert.equal(acceptedLeadRows({ leads: [lead], states: [], contacts: [], suppressions: [], generalRunQueued: false, calls: NO_CALLS })[0]!.action, 'find_contact')
    const waiting = { ...contactRow(lead, null), waiting: true }
    assert.equal(acceptedLeadRows({ leads: [lead], states: [], contacts: [waiting], suppressions: [], generalRunQueued: false, calls: NO_CALLS })[0]!.action, 'none')
  })

  it('a closing call takes the lead out of the list and into Closed, with the reason', () => {
    const leads = [worklistLead(), worklistLead({ subjectRef: 'b2', leadId: 'b-2', name: 'Second Shop' }), worklistLead({ subjectRef: 'b3', leadId: 'b-3', name: 'Third Shop' }), worklistLead({ subjectRef: 'b4', leadId: 'b-4', name: 'Fourth Shop' })]
    const calls = new Map([
      ['new_business:sample shop|las vegas', summarizeCalls([call('x', 'spoke_not_interested', '2026-11-14T18:00:00Z')])!],
      ['new_business:b2', summarizeCalls([call('x', 'wrong_number', '2026-11-13T18:00:00Z')])!],
      ['new_business:b3', summarizeCalls([call('x', 'asked_not_to_contact', '2026-11-12T18:00:00Z'), call('x', 'spoke_interested', '2026-11-15T18:00:00Z')])!],
      ['new_business:b4', summarizeCalls([call('x', 'spoke_not_interested', '2026-11-10T18:00:00Z'), call('x', 'left_message', '2026-11-12T18:00:00Z')])!],
    ])
    const rows = acceptedLeadRows({ leads, states: [], contacts: leads.map((l) => contactRow(l, 'no_page')), suppressions: [], generalRunQueued: false, calls })
    assert.deepEqual(rows.map((r) => r.name), ['Fourth Shop'], 'a later call reopens a lead that was not interested; a request not to be contacted never reopens')
    assert.deepEqual(closedLeadRows(leads, calls).map((r) => [r.name, r.reason]), [
      ['Third Shop', 'Asked not to be contacted'],
      ['Sample Shop', 'Spoke: not interested'],
      ['Second Shop', 'Wrong number'],
    ])
  })

  it('the call line shows the latest outcome, its date and the count', () => {
    const one = summarizeCalls([call('x', 'no_answer', '2026-11-14T18:00:00Z')])!
    assert.equal(callLine(one), 'Last call: No answer, Nov 14 · 1 call')
    const several = summarizeCalls([
      call('x', 'no_answer', '2026-11-12T18:00:00Z'),
      call('x', 'left_message', '2026-11-14T18:00:00Z'),
      call('x', 'no_answer', '2026-11-13T18:00:00Z'),
    ])!
    assert.equal(several.latestOutcome, 'left_message')
    assert.equal(callLine(several), 'Last call: Left a message, Nov 14 · 3 calls')
    assert.equal(summarizeCalls([]), null)
  })

  it('the phone is shown as stored and dialled only through a tel: link', () => {
    assert.equal(telHref('(702) 555-0142'), 'tel:7025550142')
    assert.equal(telHref('+1 702 555 0142'), 'tel:+17025550142')
    assert.equal(telHref('none'), null)
  })

  it('a prospect has no license phone, so it never gets Log a call', () => {
    const lead: WorklistLeadInput = { subjectType: 'prospect', subjectRef: 'p-1', leadId: 'p-1', name: 'Fictional Firm', site: siteForProspect('fictionalfirm.example'), phone: null, hasFinding: true }
    const [row] = acceptedLeadRows({ leads: [lead], states: [], contacts: [contactRow(lead, 'none_found')], suppressions: [], generalRunQueued: false, calls: NO_CALLS })
    assert.equal(row!.action, 'draft')
  })
})
