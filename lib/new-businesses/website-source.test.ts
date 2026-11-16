// Run with: pnpm exec tsx --test lib/new-businesses/website-source.test.ts
// Where a website-check excerpt came from (website-check-v3). Fictional businesses only.
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { rederiveStoredWebsiteResults, type RankableRow } from './import'
import { WEBSITE_RULES_VERSION, decideWebsiteStatus, rederiveWebsiteDecision } from './website-rules'
import { candidateSchema, parseCheckBody, type CheckCandidate, type CheckedBusiness, type ExcerptSource, type IdentityMatch } from './website-schema'

const MATCH: IdentityMatch = { name: true, street_address: true, phone: false, city: false, business_type: false }
const RUN = '00000000-0000-4000-8000-0000000000aa'

function candidate(url: string, kind: CheckCandidate['kind_claimed'], source: ExcerptSource): CheckCandidate {
  return { url, kind_claimed: kind, excerpt: 'Sample Shop, 100 Example St, Las Vegas.', excerpt_source: source, identity_match: MATCH }
}

function report(candidates: CheckCandidate[], overrides: Partial<CheckedBusiness> = {}): CheckedBusiness {
  return {
    id: '00000000-0000-4000-8000-000000000001',
    searches: ['"Sample Shop" Las Vegas', '"Sample Shop" 100 Example St'],
    candidates,
    placeholder: false,
    outcome_claimed: 'found',
    ...overrides,
  }
}

// One candidate per positive status, as a page the runner read would decide it.
const POSITIVE: { status: string; candidate: (source: ExcerptSource) => CheckCandidate; placeholder?: boolean }[] = [
  { status: 'has_website', candidate: (s) => candidate('https://www.sampleshop.example/', 'own_site', s) },
  { status: 'placeholder', candidate: (s) => candidate('https://www.sampleshop.example/', 'own_site', s), placeholder: true },
  { status: 'free_builder', candidate: (s) => candidate('https://sampleshop.wixsite.com/home', 'builder_page', s) },
  { status: 'social_only', candidate: (s) => candidate('https://www.facebook.com/sampleshoplv', 'social', s) },
]

describe('website-check-v3: summary-only evidence', () => {
  it('the rules version is website-check-v3', () => {
    assert.equal(WEBSITE_RULES_VERSION, 'website-check-v3')
  })

  it('a candidate known only from a search-result summary is capped at unclear, for each positive status', () => {
    for (const { status, candidate: make, placeholder } of POSITIVE) {
      const decision = decideWebsiteStatus(report([make('search_summary')], { placeholder: placeholder ?? false }))
      assert.equal(decision.status, 'unclear', status)
      assert.equal(decision.url, null, status)
      assert.equal(decision.evidence.candidates[0]!.excerptSource, 'search_summary', status)
    }
  })

  it('page evidence decides exactly as before', () => {
    for (const { status, candidate: make, placeholder } of POSITIVE) {
      assert.equal(decideWebsiteStatus(report([make('page')], { placeholder: placeholder ?? false })).status, status, status)
    }
  })

  it('a read page still decides when a summary-only candidate sits beside it', () => {
    const decision = decideWebsiteStatus(
      report([candidate('https://www.sampleshop.example/', 'own_site', 'search_summary'), candidate('https://www.facebook.com/sampleshoplv', 'social', 'page')]),
    )
    assert.equal(decision.status, 'social_only')
    assert.equal(decision.url, 'https://www.facebook.com/sampleshoplv')
  })

  it('no_website is unaffected', () => {
    assert.equal(decideWebsiteStatus(report([], { outcome_claimed: 'none_found' })).status, 'no_website')
    // A summary that only mentions the business (a news story) is still a mention.
    const mention = candidate('https://news.example/story', 'other', 'search_summary')
    assert.equal(decideWebsiteStatus(report([mention], { outcome_claimed: 'none_found' })).status, 'no_website')
  })
})

describe('website-check-v3: stored results', () => {
  const v2Evidence = {
    searches: ['"Sample Shop" Las Vegas', '"Sample Shop" 100 Example St'],
    candidates: [
      { url: 'https://www.facebook.com/sampleshoplv', kindClaimed: 'social', hostKind: 'social_or_directory', class: 'listing', excerpt: 'Sample Shop on Example St.', matched: ['name', 'street_address'], accepted: true },
    ],
    placeholder: false,
    outcomeClaimed: 'found',
    note: null,
  }

  it('a result stored before the field existed is read as page evidence, unchanged', () => {
    const decision = rederiveWebsiteDecision('row-1', v2Evidence)
    assert.ok(decision !== null)
    assert.equal(decision.status, 'social_only')
    assert.equal(decision.evidence.candidates[0]!.excerptSource, 'page')
    assert.equal(decision.rulesVersion, 'website-check-v3')
  })

  it('stored summary-only evidence re-derives to unclear', () => {
    const summary = { ...v2Evidence, candidates: [{ ...v2Evidence.candidates[0]!, excerptSource: 'search_summary' }] }
    assert.equal(rederiveWebsiteDecision('row-1', summary)?.status, 'unclear')
  })

  it('re-derives results from an older version and leaves current ones alone', () => {
    const rows = [
      { id: 'old', websiteStatus: 'social_only', websiteRulesVersion: 'website-check-v2', websiteEvidence: v2Evidence },
      { id: 'current', websiteStatus: 'social_only', websiteRulesVersion: 'website-check-v3', websiteEvidence: v2Evidence },
    ] as unknown as RankableRow[]
    const result = rederiveStoredWebsiteResults(rows)
    assert.deepEqual(result.updates.map((u) => u.rowIds), [['old']])
    assert.equal(result.updates[0]!.decision.status, 'social_only')
    assert.equal(result.updates[0]!.decision.rulesVersion, 'website-check-v3')
    assert.equal(result.statusById.has('current'), false)
  })
})

describe('website-check-v3: schema', () => {
  const base = candidate('https://www.sampleshop.example/', 'own_site', 'page')

  it('excerpt_source is required and takes only page or search_summary', () => {
    const { excerpt_source: _omit, ...missing } = base
    void _omit
    assert.equal(candidateSchema.safeParse(missing).success, false)
    assert.equal(candidateSchema.safeParse({ ...base, excerpt_source: 'snippet' }).success, false)
    assert.equal(candidateSchema.safeParse({ ...base, excerpt_source: 'search_summary' }).success, true)
    assert.equal(candidateSchema.safeParse(base).success, true)
  })

  it('stays strict: an unknown field rejects the batch', () => {
    const body = (c: unknown) =>
      JSON.stringify({ runId: RUN, businesses: [{ id: '00000000-0000-4000-8000-000000000001', searches: ['a', 'b'], candidates: [c], placeholder: false, outcome_claimed: 'found' }] })
    assert.equal(parseCheckBody(body(base)).ok, true)
    assert.equal(parseCheckBody(body({ ...base, excerpt_from: 'page' })).ok, false)
    const { excerpt_source: _drop, ...noSource } = base
    void _drop
    assert.equal(parseCheckBody(body(noSource)).ok, false)
  })
})
