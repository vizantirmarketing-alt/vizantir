// Run with: pnpm exec tsx --test lib/outreach/site-reviews-outreach.test.ts
// Site reviews in Outreach: the finding rule, the worklist, drafting and the
// call line on a draft with no recipient. No network or database. Fictional data only.
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import type { CallModel } from '@/lib/briefing/narrative'
import { WEBSITE_STATUSES } from '@/lib/new-businesses/website-rules'

import { siteForBusiness } from './contacts/rules'
import { buildOutreachContext, hasSpecificFinding, outreachBasis, type NewBusinessLead } from './context'
import { writeDraft, type DraftDeps } from './draft'
import { FIXTURE_SETTINGS, businessLead } from './fixtures/leads.fixture'
import { MemoryOutreachStore } from './fixtures/memory-store'
import { NO_FINDING_TEXT } from './params'
import { outreachSystemPrompt } from './prompt'
import { SITE_REVIEW_STATUSES, type StoredObservation } from './site-reviews/categories'
import { NOTHING_FOUND_TEXT, REVIEW_UNCLEAR_TEXT, REVIEW_WAITING_TEXT, siteReviewState, type SiteReviewState } from './site-reviews/view'
import { checkVoice, voiceContextFor, warningRules } from './voice'
import { acceptedLeadRows, draftCallPhone, findingStep, type WorklistContactInput, type WorklistLeadInput } from './worklist'

const NOW = new Date('2026-11-16T18:00:00.000Z')

const OBSERVATIONS: StoredObservation[] = [
  {
    category: 'contact_path',
    text: 'The contact page has no form or booking link and asks visitors to call during opening hours.',
    pageUrl: 'https://www.desertbloomtacos.example/contact',
    excerpt: 'Please call us during opening hours.',
  },
  {
    category: 'outdated_or_broken',
    text: 'The home page footer shows a copyright year of 2019.',
    pageUrl: 'https://www.desertbloomtacos.example/',
    excerpt: 'Copyright 2019 Desert Bloom Tacos',
  },
]

function reviewedLead(overrides: Partial<NewBusinessLead> = {}): NewBusinessLead {
  return businessLead({
    websiteStatus: 'has_website',
    websiteEvidenceUrl: 'https://www.desertbloomtacos.example/',
    siteReview: { status: 'reviewed', observations: OBSERVATIONS },
    ...overrides,
  })
}

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

function deps(store: MemoryOutreachStore, model: CallModel | null): DraftDeps {
  return { store, callModel: model, modelName: 'test-model', now: () => NOW }
}

const GOOD_REVIEWED_REPLY = {
  subject: 'Your contact page',
  body: `Hello,

I was looking at your site and noticed that the contact page has no form or booking link and asks visitors to call during opening hours. So someone who finds you after closing can't get in touch until the next day.

I'm James, and I run Vizantir Design Studio, a custom web studio in Las Vegas. Making that first step easier is the kind of thing I work on.

Would you be open to a short call, or a reply with a good time to talk?`,
}

describe('finding rule with site reviews', () => {
  it('a has_website business has a finding only when its review status is reviewed', () => {
    for (const status of [null, ...SITE_REVIEW_STATUSES]) {
      const lead = reviewedLead({ siteReview: { status, observations: status === 'reviewed' ? OBSERVATIONS : [] } })
      assert.equal(hasSpecificFinding(lead), status === 'reviewed', String(status))
    }
    assert.equal(hasSpecificFinding(reviewedLead({ siteReview: null })), false)
    assert.equal(hasSpecificFinding(reviewedLead({ siteReview: undefined })), false)
    // reviewed with nothing safe to say is not a finding
    assert.equal(hasSpecificFinding(reviewedLead({ siteReview: { status: 'reviewed', observations: [] } })), false)
  })

  it('a review never turns another website status into a finding, and never takes one away', () => {
    for (const websiteStatus of WEBSITE_STATUSES) {
      const lead = reviewedLead({ websiteStatus })
      const expected = websiteStatus === 'has_website' || ['no_website', 'social_only', 'placeholder', 'free_builder'].includes(websiteStatus)
      assert.equal(hasSpecificFinding(lead), expected, websiteStatus)
    }
  })
})

describe('drafting from a site review', () => {
  it('the context gets the observations in the prospect findings shape, and nothing else from the review', () => {
    const context = buildOutreachContext(reviewedLead())
    assert.equal(context.leadType, 'new_business')
    if (context.leadType !== 'new_business') return
    assert.deepEqual(context.findings, [
      { factor: 'Path to contact or book', claim: OBSERVATIONS[0]!.text },
      { factor: 'Outdated or broken element', claim: OBSERVATIONS[1]!.text },
    ])
    const sent = JSON.stringify(context)
    assert.equal(sent.includes('desertbloomtacos.example'), false, 'page links are for the owner only')
    assert.equal(sent.includes(OBSERVATIONS[0]!.excerpt), false, 'excerpts are not sent')
  })

  it('an unreviewed business has empty findings', () => {
    const context = buildOutreachContext(reviewedLead({ siteReview: null }))
    assert.ok(context.leadType === 'new_business' && context.findings.length === 0)
  })

  it('the prompt asks for exactly one of the findings', () => {
    const prompt = outreachSystemPrompt(FIXTURE_SETTINGS, buildOutreachContext(reviewedLead()))
    assert.match(prompt, /findings about pages of its own website/)
    assert.match(prompt, /Choose exactly one finding/)
  })

  it('the "Written from" panel lists the observations with their page links', () => {
    const basis = outreachBasis(reviewedLead())
    assert.deepEqual(
      basis.slice(2).map((item) => [item.label, item.sourceUrl]),
      [
        ['Path to contact or book', 'https://www.desertbloomtacos.example/contact'],
        ['Outdated or broken element', 'https://www.desertbloomtacos.example/'],
      ],
    )
  })

  it('the model is never called before a review exists', async () => {
    for (const siteReview of [null, { status: 'nothing_notable' as const, observations: [] }, { status: 'unreadable' as const, observations: [] }]) {
      const store = new MemoryOutreachStore(FIXTURE_SETTINGS)
      const model = counting(GOOD_REVIEWED_REPLY)
      const result = await writeDraft(deps(store, model.model), reviewedLead({ siteReview }))
      assert.equal(result.ok, false)
      assert.equal(!result.ok && result.reason, 'no_finding')
      assert.equal(model.calls(), 0)
    }
  })

  it('a reviewed business is drafted from one finding, and the voice checks still apply', async () => {
    const voice = voiceContextFor(buildOutreachContext(reviewedLead()), FIXTURE_SETTINGS.studioName)
    assert.deepEqual(checkVoice(GOOD_REVIEWED_REPLY, voice), [])
    // Both findings in one email trip the existing one-finding warning, as for a prospect.
    const both = {
      ...GOOD_REVIEWED_REPLY,
      body: GOOD_REVIEWED_REPLY.body.replace("can't get in touch until the next day.", "can't get in touch until the next day. The home page footer also shows a copyright year of 2019."),
    }
    assert.ok(warningRules(both, voice).includes('one_finding'))
    assert.equal(warningRules(GOOD_REVIEWED_REPLY, voice).includes('one_finding'), false)

    const store = new MemoryOutreachStore(FIXTURE_SETTINGS)
    const model = counting(GOOD_REVIEWED_REPLY)
    const result = await writeDraft(deps(store, model.model), reviewedLead())
    assert.equal(result.ok, true)
    assert.equal(model.calls(), 1)
  })
})

function worklistLead(siteReview: SiteReviewState | null, overrides: Partial<WorklistLeadInput> = {}): WorklistLeadInput {
  return {
    subjectType: 'new_business',
    subjectRef: 'desert bloom tacos|henderson',
    leadId: 'b-1',
    name: 'Desert Bloom Tacos',
    site: siteForBusiness('has_website', 'https://www.desertbloomtacos.example/'),
    phone: null,
    hasFinding: siteReview === 'reviewed',
    siteReview,
    ...overrides,
  }
}

function contactRow(lead: WorklistLeadInput, status: WorklistContactInput['status']): WorklistContactInput {
  return { subjectType: lead.subjectType, subjectRef: lead.subjectRef, status, email: null, waiting: false }
}

describe('worklist: site review states', () => {
  it('maps a stored review to a state', () => {
    assert.equal(siteReviewState(false, undefined, false), null)
    assert.equal(siteReviewState(true, undefined, false), 'not_reviewed')
    assert.equal(siteReviewState(true, undefined, true), 'queued')
    assert.equal(siteReviewState(true, { status: null, waiting: true }, false), 'queued')
    assert.equal(siteReviewState(true, { status: 'reviewed', waiting: false }, false), 'reviewed')
    assert.equal(siteReviewState(true, { status: 'nothing_notable', waiting: false }, false), 'nothing_found')
    assert.equal(siteReviewState(true, { status: 'unreadable', waiting: false }, false), 'nothing_found')
    assert.equal(siteReviewState(true, { status: 'unclear', waiting: false }, false), 'unclear')
    // Review again holds the lead: it reads as queued even with an older result.
    assert.equal(siteReviewState(true, { status: 'nothing_notable', waiting: true }, false), 'queued')
  })

  it('the action for each state, once the contact step is done', () => {
    const cases: [SiteReviewState | null, { action: string; secondary: string | null; noFindingText: string | null; reviewAction: string | null }][] = [
      ['queued', { action: 'none', secondary: null, noFindingText: REVIEW_WAITING_TEXT, reviewAction: null }],
      ['not_reviewed', { action: 'review_site', secondary: 'write', noFindingText: NO_FINDING_TEXT, reviewAction: null }],
      ['reviewed', { action: 'draft', secondary: null, noFindingText: null, reviewAction: null }],
      ['nothing_found', { action: 'none', secondary: 'write', noFindingText: NOTHING_FOUND_TEXT, reviewAction: 'again' }],
      ['unclear', { action: 'none', secondary: 'write', noFindingText: REVIEW_UNCLEAR_TEXT, reviewAction: 'again' }],
      [null, { action: 'none', secondary: 'write', noFindingText: NO_FINDING_TEXT, reviewAction: null }],
    ]
    for (const [state, expected] of cases) {
      const lead = worklistLead(state)
      const [row] = acceptedLeadRows({ leads: [lead], states: [], contacts: [contactRow(lead, 'none_found')], suppressions: [], generalRunQueued: false, calls: new Map() })
      assert.deepEqual(
        { action: row!.action, secondary: row!.secondary, noFindingText: row!.noFindingText, reviewAction: row!.reviewAction },
        expected,
        String(state),
      )
    }
  })

  it('beside Log a call, Review this site is a text action', () => {
    const lead = worklistLead('not_reviewed', { phone: '702-555-0142' })
    const [row] = acceptedLeadRows({ leads: [lead], states: [], contacts: [contactRow(lead, 'none_found')], suppressions: [], generalRunQueued: false, calls: new Map() })
    assert.equal(row!.action, 'log_call')
    assert.equal(row!.reviewAction, 'review')
    assert.equal(row!.secondary, 'write')
  })

  it('findingStep matches the plain no-finding step when site reviews cannot be read', () => {
    assert.deepEqual(findingStep({ hasFinding: false, siteReview: undefined }), { primary: 'none', secondary: 'write', noFindingText: NO_FINDING_TEXT, reviewAction: null })
  })
})

describe('Needs review: a draft with no recipient keeps the call', () => {
  const base = { toEmail: null, contactStatus: 'none_found' as const, phone: '702-555-0142', callsReadable: true }

  it('shows the phone for no_page, none_found and named_only', () => {
    for (const contactStatus of ['no_page', 'none_found', 'named_only'] as const) {
      assert.equal(draftCallPhone({ ...base, contactStatus }), '702-555-0142', contactStatus)
    }
  })

  it('shows nothing with a recipient, another status, no phone, or no call log', () => {
    assert.equal(draftCallPhone({ ...base, toEmail: 'hello@desertbloomtacos.example' }), null)
    assert.equal(draftCallPhone({ ...base, toEmail: '   ' }), '702-555-0142')
    for (const contactStatus of ['found', 'unclear', null] as const) assert.equal(draftCallPhone({ ...base, contactStatus }), null, String(contactStatus))
    assert.equal(draftCallPhone({ ...base, phone: null }), null)
    assert.equal(draftCallPhone({ ...base, callsReadable: false }), null)
  })
})
