// Run with: pnpm exec tsx --test lib/briefing/delivery-issues.test.ts
// Inquiry delivery issues in the briefing: scoped to the briefing's window,
// tied to their inquiries, and empty states. No network or database. Fictional data only.
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  assembleBriefingContent,
  contextRecordIds,
  isRecentInquiry,
  recordLink,
  type RawBriefingInputs,
  type RawDeliveryIssue,
} from './context'
import { readBriefingContent } from './content-schema'
import { FIXTURE_INQUIRY_ID, FIXTURE_NOW, FIXTURE_OLD_INQUIRY_ID, FIXTURE_WINDOWS, fixtureInputs, quietInputs } from './fixtures/briefing-inputs.fixture'
import { MemoryBriefingStore } from './fixtures/memory-stores'
import { generateBriefing } from './generate'
import { deliveryIssueView, inquirySummaryLine, legacyDeliveryIssueLine } from './inquiry-view'
import { BRIEFING_SYSTEM_PROMPT, buildUserMessage, narrativeInquiries } from './narrative'

// An old test inquiry from months earlier whose notification was never configured.
const OLD_ISSUE: RawDeliveryIssue = { id: FIXTURE_OLD_INQUIRY_ID, company: 'Fictional Stale Inquiry', created_at: '2026-07-01T18:00:00.000Z', notify_status: 'not_configured' }
// A recent inquiry that is not the newest one.
const RECENT_ID = '36363636-3636-4363-8363-363636363636'
const RECENT_ISSUE: RawDeliveryIssue = { id: RECENT_ID, company: 'Fictional Three', created_at: '2026-11-05T18:00:00.000Z', notify_status: 'failed' }

function assemble(inputs: RawBriefingInputs) {
  return assembleBriefingContent(inputs, { now: FIXTURE_NOW, windows: FIXTURE_WINDOWS })
}

function withIssues(issues: RawDeliveryIssue[], base: RawBriefingInputs = fixtureInputs()): RawBriefingInputs {
  // The dashboard's all-time count is still loaded; it must not reach the briefing.
  return { ...base, inquiryStats: { ok: true, value: { newCount: 8, deliveryIssues: 9 } }, deliveryIssues: { ok: true, value: issues } }
}

function sentInquiries(inputs: RawBriefingInputs) {
  return JSON.parse(buildUserMessage(assemble(inputs))).inquiries
}

describe('delivery issues: scope', () => {
  it('an old delivery issue outside the recent window is not counted as recent and not attached to a recent inquiry', () => {
    const content = assemble(withIssues([OLD_ISSUE]))
    assert.deepEqual(content.inquiries.recentDeliveryIssues, [])
    assert.equal(content.inquiries.deliveryIssues, 0)
    assert.equal(content.inquiries.olderDeliveryIssueCount, 1)
    // The newest inquiry carries no delivery information.
    assert.equal(content.inquiries.recent[0]!.id, FIXTURE_INQUIRY_ID)
    assert.deepEqual(Object.keys(content.inquiries.recent[0]!).sort(), ['ageDays', 'company', 'id', 'status'])
    // The model gets an empty list and no count, so it has nothing to attach.
    const sent = sentInquiries(withIssues([OLD_ISSUE]))
    assert.deepEqual(sent.deliveryIssues, [])
    assert.equal(JSON.stringify(sent).includes(FIXTURE_OLD_INQUIRY_ID), false)
    assert.equal(JSON.stringify(sent).includes('Not configured'), false)
    // The page shows it only as an older count.
    assert.deepEqual(deliveryIssueView(content.inquiries, new Set(content.unavailable)), { kind: 'listed', recent: [], olderCount: 1 })
  })

  it('a delivery issue inside the window is listed against the correct inquiry', () => {
    const content = assemble(withIssues([OLD_ISSUE, RECENT_ISSUE]))
    assert.deepEqual(content.inquiries.recentDeliveryIssues, [
      { id: RECENT_ID, company: 'Fictional Three', submittedAt: '2026-11-05T18:00:00.000Z', deliveryStatus: 'Failed' },
    ])
    assert.equal(content.inquiries.deliveryIssues, 1)
    assert.equal(content.inquiries.olderDeliveryIssueCount, 1)
    const sent = sentInquiries(withIssues([OLD_ISSUE, RECENT_ISSUE]))
    assert.deepEqual(sent.deliveryIssues, [{ id: RECENT_ID, submittedOn: '2026-11-05', company: 'Fictional Three', deliveryStatus: 'Failed' }])
    // An action about it links to that inquiry, never to the newest one.
    assert.ok(contextRecordIds(content).has(RECENT_ID))
    assert.deepEqual(recordLink(content, RECENT_ID), { href: `/intel/leads/${RECENT_ID}`, kind: 'Inquiry' })
  })

  it('the recent list and the delivery split use one window boundary', () => {
    const at = FIXTURE_WINDOWS.inquiriesSince
    const justBefore = new Date(Date.parse(at) - 1).toISOString()
    assert.equal(isRecentInquiry(at, FIXTURE_WINDOWS), true)
    assert.equal(isRecentInquiry(justBefore, FIXTURE_WINDOWS), false)
    const content = assemble(
      withIssues([
        { ...RECENT_ISSUE, id: 'edge-in', created_at: at },
        { ...RECENT_ISSUE, id: 'edge-out', created_at: justBefore },
      ]),
    )
    assert.deepEqual(content.inquiries.recentDeliveryIssues?.map((i) => i.id), ['edge-in'])
    assert.equal(content.inquiries.olderDeliveryIssueCount, 1)
  })

  it('a failed loader marks the section unavailable, and the model is told nothing about delivery', () => {
    const content = assemble({ ...fixtureInputs(), deliveryIssues: { ok: false } })
    assert.ok(content.unavailable.includes('deliveryIssues'))
    assert.equal(content.inquiries.deliveryIssues, null)
    assert.equal(content.inquiries.recentDeliveryIssues, undefined)
    assert.deepEqual(JSON.parse(buildUserMessage(content)).inquiries.deliveryIssues, [])
    assert.deepEqual(deliveryIssueView(content.inquiries, new Set(content.unavailable)), { kind: 'unavailable' })
  })

  it('the prompt forbids delivery claims beyond the list, and any mention at all when it is empty', () => {
    assert.match(BRIEFING_SYSTEM_PROMPT, /Never state or imply that a specific inquiry had a delivery problem unless it appears on that list/)
    assert.match(BRIEFING_SYSTEM_PROMPT, /When the list is empty, say nothing about delivery problems at all/)
  })
})

describe('delivery issues: empty states', () => {
  it('zero inquiries: loads, renders and narrates with no counts to invent from', async () => {
    const inputs = withIssues([], quietInputs())
    const content = assemble(inputs)
    assert.equal(content.inquiries.recentTotal, 0)
    assert.equal(content.inquiries.olderCount, 0)
    assert.equal(inquirySummaryLine(content.inquiries), 'No new inquiries in the last 30 days.')
    assert.deepEqual(deliveryIssueView(content.inquiries, new Set(content.unavailable)), { kind: 'none' })
    assert.deepEqual(narrativeInquiries(content.inquiries), { recentNew: 0, olderBacklog: 0, listedCount: 0, recent: [], deliveryIssues: [] })
    assert.match(BRIEFING_SYSTEM_PROMPT, /there are no inquiries: say nothing about inquiries/)

    // The whole day: a quiet briefing, saved without a model call, that reads back.
    let modelCalls = 0
    const store = new MemoryBriefingStore()
    const result = await generateBriefing(
      {
        store,
        sources: { load: async () => inputs },
        callModel: async () => {
          modelCalls += 1
          return { ok: true, text: '{}' }
        },
        now: () => new Date('2026-11-10T15:30:00Z'),
      },
      { overwrite: false },
    )
    assert.equal(result.outcome, 'saved')
    assert.equal(modelCalls, 0)
    const saved = store.rows.get('2026-11-10')!
    assert.equal(saved.content.quiet, true)
    assert.ok(readBriefingContent(JSON.parse(JSON.stringify(saved.content))) !== null)
  })

  it('inquiries present with zero delivery issues', () => {
    const content = assemble(withIssues([]))
    assert.equal(content.inquiries.recentTotal, 6)
    assert.equal(inquirySummaryLine(content.inquiries), '6 new inquiries in the last 30 days, newest 5 shown.')
    assert.deepEqual(content.inquiries.recentDeliveryIssues, [])
    assert.equal(content.inquiries.deliveryIssues, 0)
    assert.equal(content.inquiries.olderDeliveryIssueCount, 0)
    assert.deepEqual(deliveryIssueView(content.inquiries, new Set(content.unavailable)), { kind: 'none' })
    assert.deepEqual(sentInquiries(withIssues([])).deliveryIssues, [])
  })

  it('one inquiry reads naturally', () => {
    assert.equal(inquirySummaryLine({ recentTotal: 1, recent: [{ id: 'a', status: 'new', company: null, ageDays: 0 }] }), '1 new inquiry in the last 30 days.')
  })

  it('every core source failing still fails the day when the optional sections fail too', async () => {
    const failed: RawBriefingInputs = {
      newProspects: { ok: false },
      topUnreviewed: { ok: false },
      inquiries: { ok: false },
      inquiryStats: { ok: false },
      findings: { ok: false },
      runs: { ok: false },
      sources: { ok: false },
      newBusinesses: { ok: false },
      deliveryIssues: { ok: false },
      outreach: { ok: false },
    }
    const store = new MemoryBriefingStore()
    const result = await generateBriefing({ store, sources: { load: async () => failed }, callModel: null, now: () => new Date('2026-11-10T15:30:00Z') }, { overwrite: false })
    assert.equal(result.outcome === 'saved' && result.status, 'failed')
  })
})

describe('delivery issues: stored briefings', () => {
  it('an old stored briefing without the new fields still parses, and its count is tied to no inquiry', () => {
    const old = JSON.parse(JSON.stringify(assemble(fixtureInputs())))
    delete old.inquiries.recentDeliveryIssues
    delete old.inquiries.olderDeliveryIssueCount
    old.inquiries.deliveryIssues = 3
    const read = readBriefingContent(old)
    assert.ok(read !== null)
    assert.equal(read.inquiries.recentDeliveryIssues, undefined)
    const view = deliveryIssueView(read.inquiries, new Set(read.unavailable))
    assert.deepEqual(view, { kind: 'legacy', count: 3 })
    assert.equal(legacyDeliveryIssueLine(3), 'When this briefing was made, 3 inquiries of any age had notification delivery issues.')
  })

  it('a new briefing reads back with its delivery list', () => {
    const stored = JSON.parse(JSON.stringify(assemble(withIssues([OLD_ISSUE, RECENT_ISSUE]))))
    const read = readBriefingContent(stored)
    assert.equal(read?.inquiries.recentDeliveryIssues?.[0]?.id, RECENT_ID)
    assert.equal(read?.inquiries.olderDeliveryIssueCount, 1)
  })
})
