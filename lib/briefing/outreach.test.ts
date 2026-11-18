// Run with: pnpm exec tsx --test lib/briefing/outreach.test.ts
// The briefing's Outreach panel and the inquiry numbers the narrative sees. No network or database. Fictional data only.
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { outreachBriefingCounts, yesterdayWindow, type DraftCallFacts } from '../outreach/briefing-counts'
import type { CallSummary } from '../outreach/calls'
import type { ContactStatus } from '../outreach/contacts/rules'
import type { OutreachStatus } from '../outreach/params'
import { OUTREACH_RECORD_ID, assembleBriefingContent, contextRecordIds, recordLink, type BriefingOutreach } from './context'
import { readBriefingContent } from './content-schema'
import { FIXTURE_NOW, FIXTURE_WINDOWS, fixtureInputs, quietInputs } from './fixtures/briefing-inputs.fixture'
import { BRIEFING_SYSTEM_PROMPT, buildUserMessage, narrativeInquiries, validateNarrativeOutput } from './narrative'
import { outreachPanelLines } from './outreach-panel'

function draft(n: number, status: OutreachStatus, toEmail: string | null = null) {
  return { status, subjectType: 'prospect' as const, subjectRef: `ref-${n}`, toEmail }
}

const CALLABLE: { contactStatus: ContactStatus; phone: string } = { contactStatus: 'none_found', phone: '702-555-0142' }

/** Facts for refs 1..n: contact status and phone per ref, and the call log. */
function facts(byRef: Record<number, { contactStatus: ContactStatus | null; phone: string | null }>, calls: Record<number, CallSummary> | null = {}): DraftCallFacts {
  const entries = Object.entries(byRef).map(([n, fact]) => [`prospect:ref-${n}`, fact] as const)
  return {
    contactStatuses: new Map(entries.map(([key, fact]) => [key, fact.contactStatus])),
    phones: new Map(entries.map(([key, fact]) => [key, fact.phone])),
    calls: calls === null ? null : new Map(Object.entries(calls).map(([n, summary]) => [`prospect:ref-${n}`, summary])),
  }
}

const NOW = new Date('2026-11-16T15:30:00Z')

const COUNTS: BriefingOutreach = { acceptedWaiting: 4, needsReview: 2, approvedNotSent: 1, toCall: 3, sentYesterday: 5 }

function assemble(inputs: Parameters<typeof assembleBriefingContent>[0]) {
  return assembleBriefingContent(inputs, { now: FIXTURE_NOW, windows: FIXTURE_WINDOWS })
}

describe('briefing Outreach counts', () => {
  it('counts the worklist rows, drafts and yesterday\'s sends', () => {
    const now = new Date('2026-11-16T15:30:00Z') // 7:30 local
    const { start, end } = yesterdayWindow(now)
    assert.equal(start, '2026-11-15T08:00:00.000Z')
    assert.equal(end, '2026-11-16T08:00:00.000Z')
    const counts = outreachBriefingCounts({
      rows: [{ action: 'draft' }, { action: 'log_call' }, { action: 'log_call' }, { action: 'find_contact' }, { action: 'review_site' }],
      drafts: [draft(1, 'draft'), draft(2, 'draft'), draft(3, 'approved'), draft(4, 'sending')],
      sent: [
        { status: 'sent', sentAt: '2026-11-15T08:00:00.000Z' },
        { status: 'sent', sentAt: '2026-11-16T07:59:59.000Z' },
        { status: 'sent', sentAt: '2026-11-16T08:00:00.000Z' }, // today
        { status: 'sent', sentAt: '2026-11-15T07:59:59.000Z' }, // the day before
        { status: 'sent', sentAt: null },
      ],
      now,
    })
    assert.deepEqual(counts, { acceptedWaiting: 5, needsReview: 2, approvedNotSent: 1, toCall: 2, sentYesterday: 2 })
  })

  it('the panel has one line per count, zeros included, each linking to Outreach', () => {
    const lines = outreachPanelLines({ ...COUNTS, approvedNotSent: 0, toCall: 1 })
    assert.deepEqual(
      lines.map((line) => line.text),
      ['4 accepted leads waiting for an email', '2 drafts need review', '0 approved emails not sent yet', '1 lead to call', '5 emails sent yesterday'],
    )
    assert.ok(lines.every((line) => line.href === '/intel/outreach'))
  })

  it('the content carries the counts, and an action may point to Outreach', () => {
    const content = assemble({ ...fixtureInputs(), outreach: { ok: true, value: COUNTS } })
    assert.deepEqual(content.outreach, COUNTS)
    assert.ok(contextRecordIds(content).has(OUTREACH_RECORD_ID))
    assert.deepEqual(recordLink(content, OUTREACH_RECORD_ID), { href: '/intel/outreach', kind: 'Outreach' })
    const reply = JSON.stringify({ narrative: 'Two drafts need review.', actions: [{ recordId: 'outreach', text: 'Review the two drafts in Outreach.' }] })
    assert.equal(validateNarrativeOutput(reply, content).ok, true)
    assert.deepEqual(JSON.parse(buildUserMessage(content)).outreach, COUNTS)
  })

  it('without the counts, "outreach" is not a record an action may use', () => {
    const content = assemble(fixtureInputs())
    assert.equal(content.outreach, undefined)
    assert.equal(recordLink(content, OUTREACH_RECORD_ID), null)
    const reply = JSON.stringify({ narrative: 'Fine.', actions: [{ recordId: 'outreach', text: 'Open Outreach.' }] })
    assert.equal(validateNarrativeOutput(reply, content).ok, false)
  })

  it('a failed load marks the section unavailable, and waiting work ends a quiet day', () => {
    const failed = assemble({ ...quietInputs(), outreach: { ok: false } })
    assert.ok(failed.unavailable.includes('outreach'))
    assert.equal(failed.outreach, undefined)
    assert.equal(assemble({ ...quietInputs(), outreach: { ok: true, value: { ...COUNTS, needsReview: 0, approvedNotSent: 0, toCall: 0 } } }).quiet, true)
    assert.equal(assemble({ ...quietInputs(), outreach: { ok: true, value: COUNTS } }).quiet, false)
  })
})

describe('briefing Outreach counts: drafts with no recipient', () => {
  it('a no-recipient draft for a callable lead is a lead to call, not a draft to review', () => {
    const counts = outreachBriefingCounts({ rows: [], drafts: [draft(1, 'draft')], sent: [], now: NOW, draftCalls: facts({ 1: CALLABLE }) })
    assert.equal(counts.toCall, 1)
    assert.equal(counts.needsReview, 0)
  })

  it('a draft with a recipient stays a draft to review', () => {
    const counts = outreachBriefingCounts({ rows: [], drafts: [draft(1, 'draft', 'hello@fictional.example')], sent: [], now: NOW, draftCalls: facts({ 1: CALLABLE }) })
    assert.deepEqual([counts.needsReview, counts.toCall], [1, 0])
  })

  it('follows the Needs review rule: no phone, an unclear or found status, or an unreadable call log leaves it in review', () => {
    const cases: DraftCallFacts[] = [
      facts({ 1: { ...CALLABLE, phone: null } }),
      facts({ 1: { ...CALLABLE, contactStatus: 'unclear' } }),
      facts({ 1: { ...CALLABLE, contactStatus: 'found' } }),
      facts({ 1: { ...CALLABLE, contactStatus: null } }),
      facts({ 1: CALLABLE }, null),
    ]
    for (const draftCalls of cases) {
      const counts = outreachBriefingCounts({ rows: [], drafts: [draft(1, 'draft')], sent: [], now: NOW, draftCalls })
      assert.deepEqual([counts.needsReview, counts.toCall], [1, 0])
    }
    // Without the facts at all, nothing moves.
    assert.deepEqual(outreachBriefingCounts({ rows: [], drafts: [draft(1, 'draft')], sent: [], now: NOW }).needsReview, 1)
  })

  it('an approved draft with no recipient is not counted as a call', () => {
    const counts = outreachBriefingCounts({ rows: [], drafts: [draft(1, 'approved')], sent: [], now: NOW, draftCalls: facts({ 1: CALLABLE }) })
    assert.deepEqual([counts.approvedNotSent, counts.toCall, counts.needsReview], [1, 0, 0])
  })

  it('a lead closed by a logged call is not a lead to call; a call that does not close it keeps it one', () => {
    const closed = (closedBy: CallSummary['closedBy']): CallSummary => ({ count: 1, latestOutcome: closedBy ?? 'left_message', latestAt: '2026-11-15T18:00:00.000Z', closedBy })
    for (const outcome of ['spoke_not_interested', 'wrong_number', 'asked_not_to_contact'] as const) {
      const counts = outreachBriefingCounts({ rows: [], drafts: [draft(1, 'draft')], sent: [], now: NOW, draftCalls: facts({ 1: CALLABLE }, { 1: closed(outcome) }) })
      assert.deepEqual([counts.toCall, counts.needsReview], [0, 1], outcome)
    }
    const open = outreachBriefingCounts({ rows: [], drafts: [draft(1, 'draft')], sent: [], now: NOW, draftCalls: facts({ 1: CALLABLE }, { 1: closed(null) }) })
    assert.deepEqual([open.toCall, open.needsReview], [1, 0])
  })

  it('no lead is counted twice, and the panel totals still add up', () => {
    const rows = [{ action: 'log_call' as const }, { action: 'draft' as const }]
    const drafts = [draft(1, 'draft'), draft(2, 'draft', 'owner@fictional.example'), draft(3, 'draft'), draft(4, 'approved')]
    const draftCalls = facts({ 1: CALLABLE, 2: CALLABLE, 3: { contactStatus: 'unclear', phone: '702-555-0100' }, 4: CALLABLE })
    const before = outreachBriefingCounts({ rows, drafts, sent: [], now: NOW })
    const after = outreachBriefingCounts({ rows, drafts, sent: [], now: NOW, draftCalls })
    // Only ref-1 moves: from drafts to review into leads to call.
    assert.deepEqual(after, { ...before, needsReview: before.needsReview - 1, toCall: before.toCall + 1 })
    assert.equal(after.needsReview + after.toCall, before.needsReview + before.toCall)
    // Every lead in one place: 2 accepted rows (1 to call), 3 drafts in review (1 to call), 1 approved.
    assert.equal(after.acceptedWaiting + after.needsReview + after.approvedNotSent + (after.toCall - rows.filter((r) => r.action === 'log_call').length), 6)
  })

  it('both panel lines still link to the Outreach page, which lists these leads', () => {
    const lines = outreachPanelLines(COUNTS)
    for (const key of ['needsReview', 'toCall'] as const) assert.equal(lines.find((line) => line.key === key)?.href, '/intel/outreach')
  })
})

describe('stored briefings', () => {
  it('a briefing saved before the Outreach panel still reads', () => {
    const old = JSON.parse(JSON.stringify(assemble(fixtureInputs())))
    delete old.outreach
    const read = readBriefingContent(old)
    assert.ok(read !== null)
    assert.equal(read.outreach, undefined)
  })

  it('a briefing with the Outreach panel reads back with its counts', () => {
    const stored = JSON.parse(JSON.stringify(assemble({ ...fixtureInputs(), outreach: { ok: true, value: COUNTS } })))
    assert.deepEqual(readBriefingContent(stored)?.outreach, COUNTS)
  })
})

describe('narrative inquiries', () => {
  it('sends recent and older inquiries as two separate numbers, and never the all-ages total', () => {
    const content = assemble(fixtureInputs())
    const sent = JSON.parse(buildUserMessage(content)).inquiries
    assert.deepEqual(Object.keys(sent).sort(), ['deliveryIssues', 'listedCount', 'olderBacklog', 'recent', 'recentNew'])
    assert.equal(sent.recentNew, content.inquiries.recentTotal)
    assert.equal(sent.olderBacklog, content.inquiries.olderCount)
    assert.equal('newCount' in sent, false)
  })

  it('2 recent and 10 older are given as 2 new and a backlog of 10', () => {
    const inquiries = { newCount: 12, deliveryIssues: 0, recentTotal: 2, recent: [], olderCount: 10 }
    assert.deepEqual(narrativeInquiries(inquiries), { recentNew: 2, olderBacklog: 10, listedCount: 0, deliveryIssues: [], recent: [] })
  })

  it('tells the model to report only recent inquiries as new and older ones only as a backlog count', () => {
    assert.match(BRIEFING_SYSTEM_PROMPT, /inquiries\.recentNew is the true total of new inquiries from the last 30 days/)
    assert.match(BRIEFING_SYSTEM_PROMPT, /mention them only as a backlog count and never add them to the new ones/)
  })
})
