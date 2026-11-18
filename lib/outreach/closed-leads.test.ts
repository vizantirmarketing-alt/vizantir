// Run with: NODE_OPTIONS=--conditions=react-server pnpm exec tsx --test lib/outreach/closed-leads.test.ts
// A lead closed by a call shows under Closed only, with Discard as the one
// action on its unsent draft; approving and sending it are refused on the
// server; the briefing counts follow the page. No network or database.
// Fictional data only.
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { outreachBriefingCounts, type DraftCallFacts } from './briefing-counts'
import { ASKED_NOT_TO_CONTACT_REFUSAL, callHistoryUnreadable, closedByCalls, closedLeadRefusal, logCall, readClosedBy, summarizeCalls, type CallOutcome, type CallSummary, type OutreachCall } from './calls'
import { MemoryCallStore } from './fixtures/memory-call-store'
import { MemoryGmailConnectionStore, MemoryOutreachStore } from './fixtures/memory-store'
import { FIXTURE_SETTINGS } from './fixtures/leads.fixture'
import { NOW as SEND_NOW, TEST_CONFIG, connectionFor, scriptedFetch } from './fixtures/gmail.fixture'
import { GMAIL_SEND_URL } from './gmail/api'
import { GOOGLE_TOKEN_URL } from './gmail/oauth'
import { approveAndSend } from './gmail/send'
import type { CallModel } from '@/lib/briefing/narrative'

import { writeDraft, writeManualDraft } from './draft'
import { GOOD_BUSINESS_REPLY, businessLead } from './fixtures/leads.fixture'
import { approveDraft, discardDraft, editDraft } from './lifecycle'
import type { OutreachStatus } from './params'
import { acceptedLeadRows, closedLeadRows, draftCallPhone, draftsOutsideClosed, type WorklistLeadInput } from './worklist'

const NOW = '2026-11-16T18:00:00.000Z'
const SUBJECT = { subjectType: 'new_business' as const, subjectRef: 'fictional shop|henderson' }
const KEY = `${SUBJECT.subjectType}:${SUBJECT.subjectRef}`
const CLOSING: readonly CallOutcome[] = ['spoke_not_interested', 'wrong_number', 'asked_not_to_contact']
const OPEN_OUTCOMES: readonly CallOutcome[] = ['no_answer', 'left_message', 'spoke_interested']

function call(outcome: CallOutcome, createdAt = '2026-11-15T18:00:00.000Z'): OutreachCall {
  return { id: `c-${outcome}-${createdAt}`, ...SUBJECT, leadId: 'b-1', outcome, note: null, createdAt, createdBy: 'owner@vizantir.example' }
}

function summaries(...calls: OutreachCall[]): Map<string, CallSummary> {
  return new Map([[KEY, summarizeCalls(calls)!]])
}

const lead: WorklistLeadInput = { ...SUBJECT, leadId: 'b-1', name: 'Fictional Shop', site: null, phone: '702-555-0142', hasFinding: true }

function draftRow(status: OutreachStatus, toEmail: string | null = null) {
  return { id: `d-${status}`, status, ...SUBJECT, toEmail }
}

/** Every section the Outreach page builds, for one lead with one open draft. */
function sections(status: OutreachStatus, calls: Map<string, CallSummary>) {
  const drafts = [draftRow(status)]
  const states = [{ ...SUBJECT, status }]
  const accepted = acceptedLeadRows({ leads: [lead], states, contacts: [], suppressions: [], generalRunQueued: false, calls })
  const closed = closedLeadRows([lead], calls, drafts)
  const listed = draftsOutsideClosed(drafts, closed)
  return {
    accepted,
    needsReview: listed.filter((d) => d.status === 'draft'),
    approved: listed.filter((d) => d.status === 'approved'),
    closed,
  }
}

async function storeWithDraft(status: 'draft' | 'approved') {
  const store = new MemoryOutreachStore(FIXTURE_SETTINGS)
  const inserted = await store.insertDraft(
    { ...SUBJECT, leadId: 'b-1', leadName: 'Fictional Shop', toEmail: 'hello@fictional.example', subject: 'A website', body: 'Hello,', footer: 'f', model: 'm', promptVersion: 'outreach-v5' },
    null,
    NOW,
  )
  assert.ok(inserted.ok)
  if (status === 'approved') await store.updateDraft(inserted.id, ['draft'], { status: 'approved', approvedAt: NOW, updatedAt: NOW })
  return { store, id: inserted.id }
}

describe('a closed lead appears only under Closed', () => {
  for (const outcome of CLOSING) {
    for (const status of ['draft', 'approved'] as const) {
      it(`${outcome}, with a draft ${status === 'draft' ? 'in review' : 'approved'}`, () => {
        const { accepted, needsReview, approved, closed } = sections(status, summaries(call(outcome)))
        assert.deepEqual([accepted.length, needsReview.length, approved.length], [0, 0, 0])
        assert.equal(closed.length, 1)
        assert.deepEqual(closed[0]!.openDraft, { id: `d-${status}`, status })
      })
    }
  }

  it('a closed lead with no open draft has nothing to discard', () => {
    assert.equal(closedLeadRows([lead], summaries(call('wrong_number')), [draftRow('discarded')])[0]!.openDraft, null)
  })

  it('a send in flight or not confirmed stays in its own section', () => {
    const closed = closedLeadRows([lead], summaries(call('wrong_number')))
    for (const status of ['sending', 'send_unconfirmed', 'sent'] as const) assert.equal(draftsOutsideClosed([draftRow(status)], closed).length, 1, status)
  })

  it('a non-closing outcome leaves the draft in Needs review, with its call', () => {
    for (const outcome of OPEN_OUTCOMES) {
      const calls = summaries(call(outcome))
      const { needsReview, closed } = sections('draft', calls)
      assert.equal(needsReview.length, 1, outcome)
      assert.equal(closed.length, 0, outcome)
      assert.equal(draftCallPhone({ toEmail: null, contactStatus: 'none_found', phone: '702-555-0142', callsReadable: true, closed: Boolean(calls.get(KEY)?.closedBy) }), '702-555-0142')
    }
  })

  it('a later call reopens a not interested or wrong number lead, and the draft is back in Needs review', () => {
    for (const outcome of ['spoke_not_interested', 'wrong_number'] as const) {
      const { needsReview, closed } = sections('draft', summaries(call(outcome, '2026-11-14T18:00:00.000Z'), call('spoke_interested')))
      assert.deepEqual([needsReview.length, closed.length], [1, 0], outcome)
    }
    // Asked not to be contacted is never undone.
    const asked = sections('draft', summaries(call('asked_not_to_contact', '2026-11-14T18:00:00.000Z'), call('spoke_interested')))
    assert.deepEqual([asked.needsReview.length, asked.closed.length], [0, 1])
  })
})

describe('draftCallPhone for a closed lead', () => {
  it('returns nothing, whatever else would offer the call', () => {
    const base = { toEmail: null, contactStatus: 'none_found' as const, phone: '702-555-0142', callsReadable: true }
    assert.equal(draftCallPhone({ ...base, closed: false }), '702-555-0142')
    assert.equal(draftCallPhone({ ...base, closed: true }), null)
  })
})

describe('approve and send are refused on the server for a closed lead', () => {
  for (const outcome of CLOSING) {
    it(`approve: ${outcome}`, async () => {
      const calls = new MemoryCallStore()
      calls.calls.push(call(outcome))
      const { store, id } = await storeWithDraft('draft')
      const result = await approveDraft(store, id, NOW, { closedBy: (d) => readClosedBy(calls, d) })
      assert.deepEqual(result, { ok: false, error: closedLeadRefusal(outcome) })
      assert.equal((await store.getDraft(id))!.status, 'draft')
    })

    it(`send: ${outcome}`, async () => {
      const calls = new MemoryCallStore()
      calls.calls.push(call(outcome))
      const { store, id } = await storeWithDraft('approved')
      const connections = new MemoryGmailConnectionStore()
      connections.connection = connectionFor('studio@vizantir.example')
      const { fetch, calls: requests } = scriptedFetch({})
      const result = await approveAndSend({ store, connections, config: TEST_CONFIG, fetch, now: () => SEND_NOW, checkRules: async () => [], calls }, id)
      assert.deepEqual(result, { ok: false, error: closedLeadRefusal(outcome), outcome: 'refused' })
      assert.equal(requests.length, 0)
      assert.equal((await store.getDraft(id))!.status, 'approved')
    })
  }

  it('the refusals say why, in plain words', () => {
    assert.equal(closedLeadRefusal('asked_not_to_contact'), ASKED_NOT_TO_CONTACT_REFUSAL)
    assert.equal(closedLeadRefusal('wrong_number'), 'This lead is closed: the latest call was logged as "Wrong number". No email can be drafted, approved or sent for it.')
    assert.match(closedLeadRefusal('spoke_not_interested'), /"Spoke: not interested"/)
  })

  it('an open lead is not refused, and an unreadable call log refuses nothing', async () => {
    const calls = new MemoryCallStore()
    calls.calls.push(call('spoke_not_interested', '2026-11-14T18:00:00.000Z'), call('left_message'))
    const { store, id } = await storeWithDraft('draft')
    assert.ok((await approveDraft(store, id, NOW, { closedBy: (d) => readClosedBy(calls, d) })).ok)
    const failing = new MemoryCallStore()
    failing.failing = true
    assert.equal(await closedByCalls(failing, SUBJECT), null)
  })

  it('discard still works for a closed lead, in review or approved', async () => {
    for (const status of ['draft', 'approved'] as const) {
      const { store, id } = await storeWithDraft(status)
      const result = await discardDraft(store, id, NOW)
      assert.ok(result.ok)
      assert.equal((await store.getDraft(id))!.status, 'discarded')
    }
  })
})

describe('the briefing counts a closed lead as the page shows it', () => {
  const facts = (calls: Map<string, CallSummary>): DraftCallFacts => ({
    contactStatuses: new Map([[KEY, 'none_found']]),
    phones: new Map([[KEY, '702-555-0142']]),
    calls,
  })

  it("a closed lead's unsent draft is not a draft to review, an approved email or a lead to call", () => {
    for (const outcome of CLOSING) {
      const calls = summaries(call(outcome))
      for (const status of ['draft', 'approved'] as const) {
        const counts = outreachBriefingCounts({ rows: [], drafts: [draftRow(status)], sent: [], now: new Date(NOW), draftCalls: facts(calls), closed: closedLeadRows([lead], calls) })
        assert.deepEqual([counts.needsReview, counts.approvedNotSent, counts.toCall], [0, 0, 0], `${outcome} ${status}`)
      }
    }
  })

  it('reopened, the same draft is a lead to call again', () => {
    const calls = summaries(call('wrong_number', '2026-11-14T18:00:00.000Z'), call('no_answer'))
    const counts = outreachBriefingCounts({ rows: [], drafts: [draftRow('draft')], sent: [], now: new Date(NOW), draftCalls: facts(calls), closed: closedLeadRows([lead], calls) })
    assert.deepEqual([counts.needsReview, counts.toCall], [0, 1])
  })
})

describe('saving an edit and creating a new draft are refused for a closed lead', () => {
  it('saving an edit to a draft in review', async () => {
    for (const outcome of CLOSING) {
      const calls = new MemoryCallStore()
      calls.calls.push(call(outcome))
      const { store, id } = await storeWithDraft('draft')
      const before = (await store.getDraft(id))!
      const result = await editDraft(store, id, { toEmail: '', subject: 'Changed', body: 'Changed.' }, NOW, { closedBy: (d) => readClosedBy(calls, d) })
      assert.deepEqual(result, { ok: false, error: closedLeadRefusal(outcome) }, outcome)
      assert.equal((await store.getDraft(id))!.subject, before.subject)
    }
    // Reopened by a later call, the edit saves.
    const calls = new MemoryCallStore()
    calls.calls.push(call('wrong_number', '2026-11-14T18:00:00.000Z'), call('no_answer'))
    const { store, id } = await storeWithDraft('draft')
    assert.ok((await editDraft(store, id, { toEmail: '', subject: 'Changed', body: 'Changed.' }, NOW, { closedBy: (d) => readClosedBy(calls, d) })).ok)
  })

  it('a new draft, by the model or by hand', async () => {
    const lead = businessLead()
    const leadSubject = { subjectType: 'new_business' as const, subjectRef: 'desert bloom tacos|henderson' }
    let modelCalls = 0
    const model: CallModel = async () => {
      modelCalls += 1
      return { ok: true, text: JSON.stringify(GOOD_BUSINESS_REPLY) }
    }
    for (const outcome of ['spoke_not_interested', 'wrong_number'] as const) {
      const calls = new MemoryCallStore()
      calls.calls.push({ ...call(outcome), ...leadSubject })
      const store = new MemoryOutreachStore(FIXTURE_SETTINGS)
      const deps = { store, callModel: model, modelName: 'test-model', now: () => new Date(NOW), calls }
      assert.deepEqual(await writeDraft(deps, lead), { ok: false, reason: 'closed', message: closedLeadRefusal(outcome) }, outcome)
      assert.deepEqual(await writeManualDraft(deps, lead, { toEmail: '', subject: 'Hi', body: 'Hello,' }), { ok: false, reason: 'closed', message: closedLeadRefusal(outcome) })
      assert.equal(store.drafts.length, 0)
    }
    assert.equal(modelCalls, 0)
    // Asked not to be contacted keeps its own refusal.
    const asked = new MemoryCallStore()
    asked.calls.push({ ...call('asked_not_to_contact'), ...leadSubject })
    const store = new MemoryOutreachStore(FIXTURE_SETTINGS)
    assert.deepEqual(await writeDraft({ store, callModel: model, modelName: 'm', now: () => new Date(NOW), calls: asked }, lead), {
      ok: false,
      reason: 'asked_not_to_contact',
      message: ASKED_NOT_TO_CONTACT_REFUSAL,
    })
  })
})

describe('Log a call under Closed', () => {
  /** Logs a call through the same function the server action uses, then reads the sections back. */
  async function logAndRead(calls: MemoryCallStore, outcome: CallOutcome, status: OutreachStatus | null) {
    const result = await logCall(
      { calls, foundEmail: async () => null, suppress: async () => undefined },
      { subject: SUBJECT, leadId: 'b-1', outcome, note: '', createdBy: 'owner@vizantir.example' },
      '2026-11-16T18:00:00.000Z',
    )
    assert.ok(result.ok)
    const read = summarizeCalls(calls.calls)!
    const map = new Map([[KEY, read]])
    if (status === null) {
      return {
        accepted: acceptedLeadRows({ leads: [lead], states: [], contacts: [], suppressions: [], generalRunQueued: false, calls: map }),
        closed: closedLeadRows([lead], map),
        needsReview: [],
        approved: [],
      }
    }
    return sections(status, map)
  }

  it('is offered for not interested and wrong number, and never for asked not to be contacted', () => {
    for (const outcome of ['spoke_not_interested', 'wrong_number'] as const) {
      assert.equal(closedLeadRows([lead], summaries(call(outcome)))[0]!.canLogCall, true, outcome)
    }
    assert.equal(closedLeadRows([lead], summaries(call('asked_not_to_contact')))[0]!.canLogCall, false)
    // Asked earlier, any later call: still closed by it, still no action.
    const later = closedLeadRows([lead], summaries(call('asked_not_to_contact', '2026-11-14T18:00:00.000Z'), call('wrong_number')))
    assert.deepEqual([later[0]!.reason, later[0]!.canLogCall], ['Asked not to be contacted', false])
  })

  it('a non-closing call reopens the lead and puts its draft back in its section', async () => {
    for (const closing of ['spoke_not_interested', 'wrong_number'] as const) {
      for (const outcome of OPEN_OUTCOMES) {
        const review = new MemoryCallStore()
        review.calls.push(call(closing))
        const inReview = await logAndRead(review, outcome, 'draft')
        assert.deepEqual([inReview.needsReview.length, inReview.closed.length], [1, 0], `${closing} then ${outcome}`)
        // The closing call stays in the history.
        assert.deepEqual(review.calls.map((c) => c.outcome).sort(), [closing, outcome].sort())

        const approvedStore = new MemoryCallStore()
        approvedStore.calls.push(call(closing))
        const approved = await logAndRead(approvedStore, outcome, 'approved')
        assert.deepEqual([approved.approved.length, approved.closed.length], [1, 0])

        const noDraft = new MemoryCallStore()
        noDraft.calls.push(call(closing))
        const accepted = await logAndRead(noDraft, outcome, null)
        assert.deepEqual([accepted.accepted.length, accepted.closed.length], [1, 0])
      }
    }
  })

  it('another closing call keeps the lead closed', async () => {
    for (const [first, second] of [['spoke_not_interested', 'wrong_number'], ['wrong_number', 'spoke_not_interested'], ['wrong_number', 'wrong_number']] as const) {
      const calls = new MemoryCallStore()
      calls.calls.push(call(first))
      const read = await logAndRead(calls, second, 'draft')
      assert.deepEqual([read.needsReview.length, read.closed.length], [0, 1])
      assert.equal(read.closed[0]!.reason, second === 'wrong_number' ? 'Wrong number' : 'Spoke: not interested')
    }
  })

  it('a call submitted for an asked-not-to-be-contacted lead does not reopen it or loosen the block', async () => {
    for (const outcome of [...OPEN_OUTCOMES, 'spoke_not_interested', 'wrong_number'] as const) {
      const calls = new MemoryCallStore()
      calls.calls.push(call('asked_not_to_contact', '2026-11-14T18:00:00.000Z'))
      const read = await logAndRead(calls, outcome, 'draft')
      assert.deepEqual([read.needsReview.length, read.closed.length], [0, 1], outcome)
      assert.equal(read.closed[0]!.reason, 'Asked not to be contacted')
      assert.equal(await closedByCalls(calls, SUBJECT), 'asked_not_to_contact')
      const { store, id } = await storeWithDraft('draft')
      assert.deepEqual(await approveDraft(store, id, NOW, { closedBy: (d) => readClosedBy(calls, d) }), { ok: false, error: ASKED_NOT_TO_CONTACT_REFUSAL })
    }
  })
})

describe('a call history that cannot be read', () => {
  const failing = () => {
    const calls = new MemoryCallStore()
    calls.failing = true
    return calls
  }
  const sendDeps = (store: MemoryOutreachStore, calls: MemoryCallStore, fetch: ReturnType<typeof scriptedFetch>['fetch']) => {
    const connections = new MemoryGmailConnectionStore()
    connections.connection = connectionFor('studio@vizantir.example')
    return { store, connections, config: TEST_CONFIG, fetch, now: () => SEND_NOW, checkRules: async () => [], calls }
  }

  it('is reported as not readable, never as an open lead', async () => {
    assert.deepEqual(await readClosedBy(failing(), SUBJECT), { readable: false })
    assert.deepEqual(await readClosedBy(new MemoryCallStore(), SUBJECT), { readable: true, closedBy: null })
  })

  it('refuses approving and sending', async () => {
    const calls = failing()
    const forApprove = await storeWithDraft('draft')
    assert.deepEqual(await approveDraft(forApprove.store, forApprove.id, NOW, { closedBy: (d) => readClosedBy(calls, d) }), { ok: false, error: callHistoryUnreadable('approved') })
    assert.equal((await forApprove.store.getDraft(forApprove.id))!.status, 'draft')

    for (const status of ['draft', 'approved'] as const) {
      const { store, id } = await storeWithDraft(status)
      const { fetch, calls: requests } = scriptedFetch({})
      const result = await approveAndSend(sendDeps(store, calls, fetch), id)
      assert.deepEqual(result, { ok: false, error: "This lead's call history could not be checked, so nothing was sent. Try again.", outcome: 'refused' })
      assert.equal(requests.length, 0)
      assert.equal((await store.getDraft(id))!.status, status)
    }
  })

  it('refuses drafting, by the model or by hand, and saving an edit', async () => {
    const calls = failing()
    let modelCalls = 0
    const model: CallModel = async () => {
      modelCalls += 1
      return { ok: true, text: JSON.stringify(GOOD_BUSINESS_REPLY) }
    }
    const store = new MemoryOutreachStore(FIXTURE_SETTINGS)
    const deps = { store, callModel: model, modelName: 'test-model', now: () => new Date(NOW), calls }
    const refused = { ok: false, reason: 'calls_unreadable', message: callHistoryUnreadable('drafted') }
    assert.deepEqual(await writeDraft(deps, businessLead()), refused)
    assert.deepEqual(await writeManualDraft(deps, businessLead(), { toEmail: '', subject: 'Hi', body: 'Hello,' }), refused)
    assert.equal(store.drafts.length, 0)
    assert.equal(modelCalls, 0)

    const saved = await storeWithDraft('draft')
    const before = (await saved.store.getDraft(saved.id))!
    assert.deepEqual(await editDraft(saved.store, saved.id, { toEmail: '', subject: 'Changed', body: 'Changed.' }, NOW, { closedBy: (d) => readClosedBy(calls, d) }), {
      ok: false,
      error: callHistoryUnreadable('saved'),
    })
    assert.equal((await saved.store.getDraft(saved.id))!.subject, before.subject)
  })

  it('the worklist, the Closed list and the briefing counts still load, as before', async () => {
    // The page and the briefing load the call log with loadCallSummaries, which gives null when it cannot be read.
    const rows = acceptedLeadRows({ leads: [lead], states: [], contacts: [], suppressions: [], generalRunQueued: false, calls: null })
    assert.equal(rows.length, 1)
    const closed = closedLeadRows([lead], null, [draftRow('draft')])
    assert.deepEqual(closed, [])
    assert.equal(draftsOutsideClosed([draftRow('draft')], closed).length, 1)
    const counts = outreachBriefingCounts({
      rows: [],
      drafts: [draftRow('draft')],
      sent: [],
      now: new Date(NOW),
      draftCalls: { contactStatuses: new Map([[KEY, 'none_found']]), phones: new Map([[KEY, '702-555-0142']]), calls: null },
      closed,
    })
    assert.deepEqual([counts.needsReview, counts.toCall], [1, 0])
    // The draft page and the write page read it for display only, and still render.
    assert.equal(await closedByCalls(failing(), SUBJECT), null)
  })

  it('an open lead with a readable history still approves and sends', async () => {
    const calls = new MemoryCallStore()
    calls.calls.push(call('left_message'))
    const forApprove = await storeWithDraft('draft')
    assert.ok((await approveDraft(forApprove.store, forApprove.id, NOW, { closedBy: (d) => readClosedBy(calls, d) })).ok)

    const { store, id } = await storeWithDraft('approved')
    const { fetch, calls: requests } = scriptedFetch({
      [GOOGLE_TOKEN_URL]: [{ status: 200, json: { access_token: 'access-fictional', expires_in: 3599 } }],
      [GMAIL_SEND_URL]: [{ status: 200, json: { id: 'msg-1', threadId: 'thread-1', labelIds: ['SENT'] } }],
    })
    const result = await approveAndSend(sendDeps(store, calls, fetch), id)
    assert.ok(result.ok)
    assert.equal(requests.filter((r) => r.url === GMAIL_SEND_URL).length, 1)
    assert.equal((await store.getDraft(id))!.status, 'sent')
  })
})
