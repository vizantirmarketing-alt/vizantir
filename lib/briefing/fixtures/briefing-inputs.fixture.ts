/**
 * TEST FIXTURE. Used by tests only; never import from application code.
 *
 * Fictional records on reserved example domains. One inquiry row deliberately
 * carries a name, email, phone and message so tests can prove none of them
 * survive into the briefing context.
 *
 * Reference time for these fixtures: NOW = 2026-11-10T16:00:00Z
 * (Nov 10, 8:00 AM PST), with no previous briefing, so the windows are:
 *   prospects since 2026-11-03T16:00Z (7 days)
 *   runs since      2026-11-09T16:00Z (24 hours)
 *   inquiries since 2026-10-11T16:00Z (30 days)
 */

import { briefingWindows, type RawBriefingInputs, type RawInquiry, type RawRun } from '@/lib/briefing/context'
import { measurementClaim } from '@/lib/prospects/measure'
import type { FactorRatings } from '@/lib/prospects/rubric'

export const FIXTURE_NOW = new Date('2026-11-10T16:00:00Z')
export const FIXTURE_WINDOWS = briefingWindows(FIXTURE_NOW, null)

export const FIXTURE_PROSPECT_ID = '11111111-1111-4111-8111-111111111111'
export const FIXTURE_TOP_PROSPECT_ID = '12121212-1212-4121-8121-121212121212'
export const FIXTURE_UNSCORED_PROSPECT_ID = '13131313-1313-4131-8131-131313131313'
export const FIXTURE_UNREVIEWED_ID = '22222222-2222-4222-8222-222222222222'
export const FIXTURE_INQUIRY_ID = '33333333-3333-4333-8333-333333333333'
export const FIXTURE_OLD_INQUIRY_ID = '34343434-3434-4343-8343-343434343434'
export const FIXTURE_RUN_ID = '44444444-4444-4444-8444-444444444444'
export const FIXTURE_SUPERSEDED_RUN_ID = '45454545-4545-4454-8454-454545454545'
export const FIXTURE_SUPERSEDING_RUN_ID = '46464646-4646-4464-8464-464646464646'
export const FIXTURE_STANDALONE_FAILED_RUN_ID = '47474747-4747-4474-8474-474747474747'
export const FIXTURE_OLD_RUN_ID = '48484848-4848-4484-8484-484848484848'
export const FIXTURE_UNFINISHED_RUN_ID = '49494949-4949-4494-8494-494949494949'
export const FIXTURE_FINDING_KEY = 'metadata-gap:/services'

export const FIXTURE_PERSONAL = {
  name: 'Fixture Person Name',
  email: 'fixture.person@example.com',
  phone: '702-555-0100',
  message: 'Fixture private message body about my divorce.',
}

const UNKNOWN: FactorRatings = {
  market_industry_match: 'unknown',
  business_complexity: 'unknown',
  custom_web_relevance: 'unknown',
  growth_signals: 'unknown',
  navigation_conversion_friction: 'unknown',
  performance_technical_issues: 'unknown',
  content_information_architecture: 'unknown',
  integration_cms_opportunity: 'unknown',
}

export const FIXTURE_MEASUREMENT_CLAIM = measurementClaim('https://example.com/', {
  performanceScore: 33,
  lcpMs: 16234,
  tbtMs: 610,
  cls: 0.123,
  fetchedAt: '2026-11-10T08:10:00.000Z',
})

function inquiry(id: string, createdAt: string, company: string, extra: Partial<RawInquiry> = {}): RawInquiry {
  return { id, company, service: 'web-design', status: 'new', created_at: createdAt, ...extra }
}

function run(overrides: Partial<RawRun> & { id: string }): RawRun {
  return {
    state: 'completed',
    market: 'Fixture City',
    industry: 'Fictional law firms',
    saved: 5,
    requested: 5,
    errors: [],
    notes: [],
    requestedAt: '2026-11-10T07:00:00.000Z',
    finishedAt: '2026-11-10T08:00:00.000Z',
    ...overrides,
  }
}

export function fixtureInputs(overrides: Partial<RawBriefingInputs> = {}): RawBriefingInputs {
  return {
    newProspects: {
      ok: true,
      value: {
        total: 14,
        rows: [
          {
            id: FIXTURE_PROSPECT_ID,
            name: 'Fictional Harbor Legal Group',
            domain: 'example.com',
            fitScore: 73,
            opportunityScore: 45,
            confidence: 'high',
            factorRatings: {
              ...UNKNOWN,
              market_industry_match: 'strong',
              navigation_conversion_friction: 'strong',
              performance_technical_issues: 'strong',
              content_information_architecture: 'weak',
            },
            createdAt: '2026-11-10T08:05:00.000Z',
            evidence: [
              { factorKey: 'performance_technical_issues', kind: 'measurement', claim: FIXTURE_MEASUREMENT_CLAIM, sourceUrl: 'https://example.com/' },
              { factorKey: 'market_industry_match', kind: 'observation', claim: 'Fixture: office in Fixture City.', sourceUrl: 'https://example.com/contact' },
              { factorKey: 'content_information_architecture', kind: 'observation', claim: 'Fixture: duplicated service copy.', sourceUrl: 'https://example.com/services' },
              { factorKey: 'navigation_conversion_friction', kind: 'observation', claim: 'Fixture: service pages have no contact link.', sourceUrl: 'https://example.com/services/probate' },
            ],
          },
          {
            id: FIXTURE_UNSCORED_PROSPECT_ID,
            name: 'Fictional Null Score Partners',
            domain: 'null-score.example.net',
            fitScore: null,
            opportunityScore: 40,
            confidence: 'low',
            factorRatings: { ...UNKNOWN, growth_signals: 'weak' },
            createdAt: '2026-11-09T08:05:00.000Z',
            evidence: [
              { factorKey: 'growth_signals', kind: 'observation', claim: 'Fixture: says it is growing.', sourceUrl: 'https://null-score.example.net/about' },
            ],
          },
          {
            id: FIXTURE_TOP_PROSPECT_ID,
            name: 'Fictional Mesa Dental',
            domain: 'example.org',
            fitScore: 90,
            opportunityScore: 60,
            confidence: 'high',
            factorRatings: {
              ...UNKNOWN,
              market_industry_match: 'strong',
              navigation_conversion_friction: 'weak',
              content_information_architecture: 'strong',
            },
            createdAt: '2026-11-08T08:05:00.000Z',
            evidence: [
              { factorKey: 'market_industry_match', kind: 'observation', claim: 'Fixture: headquartered in Fixture City.', sourceUrl: 'https://example.org/about' },
              { factorKey: 'navigation_conversion_friction', kind: 'observation', claim: 'Fixture: inconsistent calls to action.', sourceUrl: 'https://example.org/' },
              { factorKey: 'content_information_architecture', kind: 'observation', claim: 'Fixture: service pages repeat the same text.', sourceUrl: 'https://example.org/services' },
            ],
          },
        ],
      },
    },
    topUnreviewed: {
      ok: true,
      value: [
        { id: FIXTURE_UNREVIEWED_ID, name: 'Fictional Desert Bloom Dental', domain: 'bloom.example.org', fitScore: 80, opportunityScore: 50 },
      ],
    },
    inquiries: {
      ok: true,
      value: {
        // Eight new inquiries in total: six recent, two older than 30 days.
        total: 8,
        olderCount: 2,
        rows: [
          inquiry(FIXTURE_INQUIRY_ID, '2026-11-09T18:00:00.000Z', 'Fictional Canyon Ridge Realty', {
            name: FIXTURE_PERSONAL.name,
            email: FIXTURE_PERSONAL.email,
            phone: FIXTURE_PERSONAL.phone,
            message: FIXTURE_PERSONAL.message,
          }),
          inquiry('35353535-3535-4353-8353-353535353535', '2026-11-08T18:00:00.000Z', 'Fictional Two'),
          inquiry('36363636-3636-4363-8363-363636363636', '2026-11-05T18:00:00.000Z', 'Fictional Three'),
          inquiry('37373737-3737-4373-8373-373737373737', '2026-10-30T18:00:00.000Z', 'Fictional Four'),
          inquiry('38383838-3838-4383-8383-383838383838', '2026-10-20T18:00:00.000Z', 'Fictional Five'),
          inquiry('39393939-3939-4393-8393-393939393939', '2026-10-12T18:00:00.000Z', 'Fictional Six'),
          inquiry(FIXTURE_OLD_INQUIRY_ID, '2026-09-01T18:00:00.000Z', 'Fictional Stale Inquiry'),
        ],
      },
    },
    inquiryStats: { ok: true, value: { newCount: 8, deliveryIssues: 0 } },
    findings: {
      ok: true,
      value: {
        total: 7,
        items: [
          { findingKey: FIXTURE_FINDING_KEY, title: 'Fixture: missing meta description', category: 'search_intelligence', confidence: 'high', status: 'new' },
          ...Array.from({ length: 6 }, (_, i) => ({
            findingKey: `thin-page:/fixture-${i}`,
            title: `Fixture: thin page ${i}`,
            category: 'search_intelligence',
            confidence: 'exploratory',
            status: 'new',
          })),
        ],
      },
    },
    runs: {
      ok: true,
      value: [
        run({ id: FIXTURE_RUN_ID, saved: 7, requested: 10, finishedAt: '2026-11-10T15:00:00.000Z', notes: ['Skipped excluded-firm.example.net: HTTP 403'] }),
        run({ id: FIXTURE_SUPERSEDED_RUN_ID, state: 'failed', industry: 'Fictional dentists', saved: 0, finishedAt: '2026-11-10T09:00:00.000Z', errors: ['Search provider timed out'] }),
        run({ id: FIXTURE_SUPERSEDING_RUN_ID, state: 'completed', industry: 'fictional dentists ', finishedAt: '2026-11-10T12:00:00.000Z' }),
        // No run that saved prospects finished after it, so it stays unresolved.
        run({ id: FIXTURE_STANDALONE_FAILED_RUN_ID, state: 'failed', industry: 'Fictional accountants', saved: 0, finishedAt: '2026-11-10T16:00:00.000Z', errors: ['Runner crashed'] }),
        run({ id: FIXTURE_OLD_RUN_ID, finishedAt: '2026-11-08T15:00:00.000Z', notes: ['Fixture: old note'] }),
        run({ id: FIXTURE_UNFINISHED_RUN_ID, state: 'claimed', finishedAt: null }),
      ],
    },
    sources: {
      ok: true,
      value: [
        { provider: 'gsc', label: 'GSC', lastRun: { status: 'success', startedAt: '2026-11-10T09:30:00.000Z', administratorMessage: null }, stale: false },
        { provider: 'clarity', label: 'Clarity', lastRun: { status: 'failed', startedAt: '2026-11-10T09:00:00.000Z', administratorMessage: 'Fixture: rate limited' }, stale: false },
        { provider: 'gbp', label: 'Business Profile', lastRun: null, stale: false },
      ],
    },
    newBusinesses: { ok: true, value: 4 },
    ...overrides,
  }
}

export function quietInputs(): RawBriefingInputs {
  return fixtureInputs({
    newProspects: { ok: true, value: { rows: [], total: 0 } },
    inquiries: { ok: true, value: { rows: [], total: 0, olderCount: 0 } },
    findings: { ok: true, value: { items: [], total: 0 } },
    runs: { ok: true, value: [] },
    newBusinesses: { ok: true, value: 0 },
    sources: {
      ok: true,
      value: [{ provider: 'gsc', label: 'GSC', lastRun: { status: 'success', startedAt: '2026-11-10T09:30:00.000Z', administratorMessage: null }, stale: false }],
    },
  })
}
