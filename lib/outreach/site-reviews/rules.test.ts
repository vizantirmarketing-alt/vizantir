// Run with: pnpm exec tsx --test lib/outreach/site-reviews/rules.test.ts
// Pure rules. No network or database. Fictional data only.
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  SITE_REVIEW_RULES_VERSION,
  decideSiteReview,
  judgeObservation,
  rederiveSiteReview,
  reviewSiteFor,
  unclearSiteReview,
  type ReviewSite,
} from './rules'
import { siteReviewLeadSchema, type SiteReviewLeadReport } from './schema'

const SITE: ReviewSite = reviewSiteFor('https://www.fictional-bakery.example/')!
const ID = '00000000-0000-4000-9000-000000000001'

const GOOD = {
  category: 'contact_path',
  text: 'The catering page has no form or booking link.',
  page_url: 'https://www.fictional-bakery.example/catering',
  excerpt: 'For catering orders please call us during opening hours.',
}

function report(observations: SiteReviewLeadReport['observations'], pages = ['https://www.fictional-bakery.example/']): SiteReviewLeadReport {
  return { id: ID, pages_read: pages, observations }
}

function judge(overrides: Partial<typeof GOOD>) {
  const o = { ...GOOD, ...overrides }
  return judgeObservation({ category: o.category, text: o.text, pageUrl: o.page_url, excerpt: o.excerpt }, SITE)
}

describe('site review rules: one observation', () => {
  it('accepts a factual observation on the stored host, with or without www', () => {
    assert.equal(judge({}).outcome, 'accepted')
    assert.equal(judge({ page_url: 'https://fictional-bakery.example/about' }).outcome, 'accepted')
  })

  it('rejects a page on another host, even one the runner claims belongs to the business', () => {
    for (const page of [
      'https://fictional-bakery-official.example/catering',
      'https://shop.fictional-bakery.example/catering',
      'https://facebook.com/fictional-bakery.example',
      'https://www.fictional-bakery.example.evil.test/catering',
    ]) {
      assert.deepEqual(judge({ page_url: page }), { outcome: 'rejected', reason: 'page_not_site' }, page)
    }
  })

  it('rejects a category outside the list', () => {
    for (const category of ['opinion', 'traffic', 'Contact_Path', 'business_age']) {
      assert.deepEqual(judge({ category }), { outcome: 'rejected', reason: 'category' }, category)
    }
  })

  it('rejects a missing or too long excerpt', () => {
    assert.deepEqual(judge({ excerpt: '   ' }), { outcome: 'rejected', reason: 'excerpt_missing' })
    const long = Array.from({ length: 26 }, (_, i) => `word${i}`).join(' ')
    assert.deepEqual(judge({ excerpt: long }), { outcome: 'rejected', reason: 'excerpt_too_long' })
    const exact = Array.from({ length: 25 }, (_, i) => `word${i}`).join(' ')
    assert.equal(judge({ excerpt: exact }).outcome, 'accepted')
  })

  it('caps the text length', () => {
    assert.deepEqual(judge({ text: 'a'.repeat(401) }), { outcome: 'rejected', reason: 'text_too_long' })
  })

  it('rejects an email address or a phone number in the text or the excerpt', () => {
    assert.deepEqual(judge({ text: 'The contact page lists orders@fictional-bakery.example only.' }), { outcome: 'rejected', reason: 'contact_detail' })
    assert.deepEqual(judge({ excerpt: 'Email hello@fictional-bakery.example for orders' }), { outcome: 'rejected', reason: 'contact_detail' })
    assert.deepEqual(judge({ text: 'The only contact is the number (555) 010-0199.' }), { outcome: 'rejected', reason: 'contact_detail' })
    assert.deepEqual(judge({ excerpt: 'Call 555.010.0199 today' }), { outcome: 'rejected', reason: 'contact_detail' })
  })

  it('rejects wording that calls the business new or newly licensed', () => {
    for (const text of [
      'The site of this new bakery has no menu page.',
      'As a newly licensed business, the site lacks a contact form.',
      'The business just opened and the about page is empty.',
      'The site mentions its license number in the footer.',
    ]) {
      assert.deepEqual(judge({ text }), { outcome: 'rejected', reason: 'new_business_wording' }, text)
    }
    assert.deepEqual(judge({ excerpt: 'Grand opening this spring' }), { outcome: 'rejected', reason: 'new_business_wording' })
  })
})

describe('site review rules: statuses', () => {
  it('reviewed with at least one accepted observation', () => {
    const decision = decideSiteReview(SITE, report([GOOD, { ...GOOD, category: 'opinion' }]))
    assert.equal(decision.status, 'reviewed')
    assert.equal(decision.acceptedCount, 1)
    assert.equal(decision.rejectedCount, 1)
    assert.equal(decision.rulesVersion, SITE_REVIEW_RULES_VERSION)
  })

  it('nothing_notable when pages were read and nothing was accepted', () => {
    const decision = decideSiteReview(SITE, report([{ ...GOOD, page_url: 'https://elsewhere.example/' }]))
    assert.equal(decision.status, 'nothing_notable')
    assert.deepEqual(decision.observations, [])
    assert.equal(decideSiteReview(SITE, report([])).status, 'nothing_notable')
  })

  it('unreadable when no page on the site was read', () => {
    assert.equal(decideSiteReview(SITE, report([], [])).status, 'unreadable')
    assert.equal(decideSiteReview(SITE, report([], ['https://elsewhere.example/'])).status, 'unreadable')
  })

  it('unclear for a malformed entry, with nothing kept', () => {
    const decision = unclearSiteReview()
    assert.equal(decision.status, 'unclear')
    assert.deepEqual(decision.evidence, { malformed: true })
  })

  it('keeps at most six, in order, without repeating the same text', () => {
    const many = Array.from({ length: 9 }, (_, i) => ({ ...GOOD, text: `The page lacks feature number ${i + 1}.` }))
    const decision = decideSiteReview(SITE, report([GOOD, GOOD, ...many]))
    assert.equal(decision.observations.length, 6)
    assert.equal(decision.observations[0]!.text, GOOD.text)
    assert.equal(decision.observations[1]!.text, 'The page lacks feature number 1.')
    assert.equal(decision.acceptedCount, 6)
    assert.equal(decision.rejectedCount, 5)
  })

  it('never stores a rejected observation\'s text', () => {
    const decision = decideSiteReview(SITE, report([{ ...GOOD, text: 'Write to owner@fictional-bakery.example for help.' }]))
    assert.equal(JSON.stringify(decision.evidence).includes('owner@'), false)
  })
})

describe('site review rules: re-derivation', () => {
  it('re-decides stored evidence under the current version', () => {
    const original = decideSiteReview(SITE, report([GOOD, { ...GOOD, category: 'opinion' }]))
    const again = rederiveSiteReview(JSON.parse(JSON.stringify(original.evidence)))
    assert.ok(again !== null)
    assert.equal(again.status, 'reviewed')
    assert.deepEqual(again.observations, original.observations)
    assert.equal(again.rejectedCount, 1)
    assert.equal(again.rulesVersion, SITE_REVIEW_RULES_VERSION)
  })

  it('leaves missing or malformed evidence alone', () => {
    assert.equal(rederiveSiteReview(null), null)
    assert.equal(rederiveSiteReview({ malformed: true }), null)
  })
})

describe('site review schema', () => {
  it('is strict: a status or count from the runner rejects the lead entry', () => {
    assert.equal(siteReviewLeadSchema.safeParse(report([GOOD])).success, true)
    assert.equal(siteReviewLeadSchema.safeParse({ ...report([GOOD]), status: 'reviewed' }).success, false)
    assert.equal(siteReviewLeadSchema.safeParse({ ...report([{ ...GOOD, accepted: true } as never]) }).success, false)
    assert.equal(siteReviewLeadSchema.safeParse(report([], Array.from({ length: 5 }, (_, i) => `https://www.fictional-bakery.example/p${i}`))).success, false)
  })
})
