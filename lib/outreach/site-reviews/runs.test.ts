// Run with: pnpm exec tsx --test lib/outreach/site-reviews/runs.test.ts
// Queueing, claiming, accepting and re-deriving over a memory store. No network or database. Fictional data only.
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { reviewAndQueueContact } from '../accept'
import { MemorySiteReviewStore } from '../fixtures/memory-site-review-store'
import { SITE_REVIEW_RULES_VERSION, decideSiteReview, reviewSiteFor } from './rules'
import {
  MAX_WAITING_SITE_REVIEW_RUNS,
  SITE_REVIEW_RUN_SIZE,
  buildSiteReviewClaimResponse,
  eligibleLeads,
  queueLeadSiteReview,
  queueSiteReviewRun,
  rederiveSiteReviews,
  type SiteReviewLead,
} from './runs'

const T0 = new Date('2026-11-16T15:00:00Z')

function lead(n: number, site: string | null = `https://www.fictional-${n}.example/`): SiteReviewLead {
  const id = `20000000-0000-4000-8000-${n.toString().padStart(12, '0')}`
  return { subjectType: 'new_business', subjectRef: `group-${n}`, leadId: id, name: `Fictional Business ${n.toString().padStart(2, '0')}`, site: site === null ? null : reviewSiteFor(site) }
}

describe('site review queue: eligibility', () => {
  it('takes only leads with an own site, no stored review and no hold', async () => {
    const store = new MemorySiteReviewStore([lead(1), lead(2, null), lead(3), lead(4)])
    // Lead 3 already has a review; lead 4 is held by an open run.
    await store.holdLeads('run-x', [store.leads[2]!])
    const reviewed = store.reviews[0]!
    reviewed.status = 'reviewed'
    reviewed.heldByRunId = null
    await store.holdLeads('run-y', [store.leads[3]!])
    const eligible = eligibleLeads(store.leads, await store.listReviews())
    assert.deepEqual(eligible.map((l) => l.subjectRef), ['group-1'])
  })

  it('the cron queues one run, and none while one is open or nothing is eligible', async () => {
    const store = new MemorySiteReviewStore([lead(1)])
    assert.equal((await queueSiteReviewRun(store, 'schedule', T0)).outcome, 'queued')
    assert.equal((await queueSiteReviewRun(store, 'schedule', T0)).outcome, 'run_open')
    const empty = new MemorySiteReviewStore([lead(1, null)])
    assert.equal((await queueSiteReviewRun(empty, 'schedule', T0)).outcome, 'nothing_to_review')
  })

  it('caps a run at ten leads and waiting runs at two', async () => {
    const store = new MemorySiteReviewStore(Array.from({ length: 14 }, (_, i) => lead(i + 1)))
    await queueSiteReviewRun(store, 'schedule', T0)
    const claim = await buildSiteReviewClaimResponse(store, T0)
    assert.ok(claim.run !== null)
    assert.equal(SITE_REVIEW_RUN_SIZE, 10)
    assert.equal('leads' in claim ? claim.leads.length : 0, 10)

    const waiting = new MemorySiteReviewStore([lead(1), lead(2), lead(3)])
    assert.equal(MAX_WAITING_SITE_REVIEW_RUNS, 2)
    assert.equal((await queueLeadSiteReview(waiting, { leadId: lead(1).leadId }, T0)).outcome, 'queued')
    assert.equal((await queueLeadSiteReview(waiting, { leadId: lead(2).leadId }, T0)).outcome, 'queued')
    assert.equal((await queueLeadSiteReview(waiting, { leadId: lead(3).leadId }, T0)).outcome, 'limit_reached')
  })

  it('the claim sends only id, name, own-site URL and categories per lead', async () => {
    const store = new MemorySiteReviewStore([lead(1)])
    await queueSiteReviewRun(store, 'schedule', T0)
    const claim = await buildSiteReviewClaimResponse(store, T0)
    assert.ok('leads' in claim)
    assert.deepEqual(Object.keys(claim.leads[0]!).sort(), ['categories', 'id', 'name', 'url'])
    assert.equal(claim.leads[0]!.url, 'https://www.fictional-1.example/')
    assert.ok(claim.leads[0]!.categories.includes('contact_path'))
  })

  it('a one-lead request finds the business by row id or group key, and refuses leads without an own site', async () => {
    const store = new MemorySiteReviewStore([lead(1), lead(2, null)])
    assert.equal((await queueLeadSiteReview(store, { leadId: 'group-1' }, T0)).outcome, 'queued')
    assert.equal((await queueLeadSiteReview(store, { leadId: 'group-1' }, T0)).outcome, 'already_waiting')
    assert.equal((await queueLeadSiteReview(store, { leadId: lead(2).leadId }, T0)).outcome, 'no_site')
    assert.equal((await queueLeadSiteReview(store, { leadId: 'unknown' }, T0)).outcome, 'not_accepted')
  })
})

describe('site review queue on accept', () => {
  const accepted = async () => ({ ok: true as const })

  it('accepting queues the review of an unreviewed business with its own site', async () => {
    const store = new MemorySiteReviewStore([lead(1)])
    const outcome = await reviewAndQueueContact(
      'accepted',
      accepted,
      async () => ({ outcome: 'no_page' }),
      () => queueLeadSiteReview(store, { leadId: lead(1).leadId }, T0, { onlyIfUnreviewed: true }),
    )
    assert.deepEqual(outcome, { ok: true, contact: 'no_page', siteReview: 'queued' })
    assert.equal(store.runs.length, 1)
  })

  it('leaves a reviewed business alone on accept', async () => {
    const store = new MemorySiteReviewStore([lead(1)])
    await store.holdLeads('r', [store.leads[0]!])
    store.reviews[0]!.status = 'nothing_notable'
    store.reviews[0]!.heldByRunId = null
    const result = await queueLeadSiteReview(store, { leadId: lead(1).leadId }, T0, { onlyIfUnreviewed: true })
    assert.equal(result.outcome, 'already_reviewed')
  })

  it('a failure to queue never fails the accept, and never stops the contact queue', async () => {
    const store = new MemorySiteReviewStore([lead(1)])
    store.failing = true
    const outcome = await reviewAndQueueContact(
      'accepted',
      accepted,
      async () => ({ outcome: 'queued', runId: 'contact-run' }),
      () => queueLeadSiteReview(store, { leadId: lead(1).leadId }, T0, { onlyIfUnreviewed: true }),
    )
    assert.deepEqual(outcome, { ok: true, contact: 'queued', siteReview: 'failed' })

    const contactFails = await reviewAndQueueContact(
      'accepted',
      accepted,
      async () => {
        throw new Error('contact tables missing')
      },
      async () => ({ outcome: 'queued', runId: 'site-run' }),
    )
    assert.deepEqual(contactFails, { ok: true, contact: 'failed', siteReview: 'queued' })
  })

  it('nothing is queued when the status is not accepted', async () => {
    let queued = false
    const outcome = await reviewAndQueueContact('rejected', accepted, async () => ({ outcome: 'no_page' }), async () => {
      queued = true
      return { outcome: 'queued', runId: 'x' }
    })
    assert.equal(queued, false)
    assert.equal(outcome.siteReview, 'skipped')
  })
})

describe('site review re-derivation', () => {
  it('re-decides results stored under an older version on the scheduled run', async () => {
    const store = new MemorySiteReviewStore([lead(1)])
    const [row] = await store.holdLeads('r', [store.leads[0]!])
    const decision = decideSiteReview(store.leads[0]!.site!, {
      id: row!.id,
      pages_read: ['https://www.fictional-1.example/'],
      observations: [{ category: 'clarity', text: 'The home page does not say what the business offers.', page_url: 'https://www.fictional-1.example/', excerpt: 'Welcome to our website' }],
    })
    await store.saveResult(row!.id, 'r', { ...decision, rulesVersion: 'site-review-rules-v0' }, T0.toISOString())
    assert.equal(await rederiveSiteReviews(store, T0.toISOString()), 1)
    assert.equal(store.reviews[0]!.rulesVersion, SITE_REVIEW_RULES_VERSION)
    assert.equal(store.reviews[0]!.status, 'reviewed')
    // Current-version rows are left as they are.
    assert.equal(await rederiveSiteReviews(store, T0.toISOString()), 0)
  })
})

describe('site review queue: missing tables', () => {
  it('throws from the store, and the cron step records an error instead of failing', async () => {
    const { runBriefingCron } = await import('../../briefing/cron')
    const store = new MemorySiteReviewStore([lead(1)])
    store.failing = true
    await assert.rejects(queueSiteReviewRun(store, 'schedule', T0))
    const result = await runBriefingCron({
      campaigns: { listDue: async () => [], queue: async () => ({ ok: true }) } as never,
      briefing: { now: () => T0 } as never,
      queueSiteReviews: () => queueSiteReviewRun(store, 'schedule', T0),
    })
    assert.deepEqual(result.siteReviews, { error: 'Site review queuing failed' })
  })
})
