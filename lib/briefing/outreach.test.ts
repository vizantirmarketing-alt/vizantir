// Run with: pnpm exec tsx --test lib/briefing/outreach.test.ts
// The briefing's Outreach panel and the inquiry numbers the narrative sees. No network or database. Fictional data only.
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { outreachBriefingCounts, yesterdayWindow } from '../outreach/briefing-counts'
import { OUTREACH_RECORD_ID, assembleBriefingContent, contextRecordIds, recordLink, type BriefingOutreach } from './context'
import { readBriefingContent } from './content-schema'
import { FIXTURE_NOW, FIXTURE_WINDOWS, fixtureInputs, quietInputs } from './fixtures/briefing-inputs.fixture'
import { BRIEFING_SYSTEM_PROMPT, buildUserMessage, narrativeInquiries, validateNarrativeOutput } from './narrative'
import { outreachPanelLines } from './outreach-panel'

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
      drafts: [{ status: 'draft' }, { status: 'draft' }, { status: 'approved' }, { status: 'sending' }],
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
