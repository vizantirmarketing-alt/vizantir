/**
 * TEST FIXTURE. Used by tests only; never import from application code.
 *
 * Every company here is fictional and every domain is a reserved example
 * domain (RFC 2606: example.com, example.org, example.net and their
 * subdomains). Nothing in this file describes a real business.
 */

import type { IngestBatch, IngestProspect } from '@/lib/prospects/ingest-schema'
import type { RunConfig, StoredRun } from '@/lib/prospects/ingest'

export const FIXTURE_RUN_ID = '3f1c2a9e-5b7d-4c8e-9a1f-2b3c4d5e6f70'
export const FIXTURE_OBSERVED_AT = '2026-11-01T17:30:00.000Z'

export const FIXTURE_RUN_CONFIG: RunConfig = {
  market: 'Fixture City, NV',
  industry: 'Fictional law firms',
  targetCount: 3,
  exclusions: ['excluded-firm.example.net'],
}

export function fixtureClaimedRun(overrides: Partial<StoredRun> = {}): StoredRun {
  return {
    id: FIXTURE_RUN_ID,
    state: 'claimed',
    config: FIXTURE_RUN_CONFIG,
    recordOutcomes: {},
    errorSummary: null,
    ...overrides,
  }
}

function evidence(
  factor: IngestProspect['evidence'][number]['factor'],
  kind: IngestProspect['evidence'][number]['kind'],
  claim: string,
  sourceUrl: string,
): IngestProspect['evidence'][number] {
  return { factor, kind, claim, sourceUrl, observedAt: FIXTURE_OBSERVED_AT }
}

/** Fully researched: every factor rated, every rating backed by evidence. */
export const FIXTURE_FULLY_RATED: IngestProspect = {
  name: 'Fictional Harbor Legal Group',
  domain: 'https://www.Example.com/about?ref=fixture',
  ratings: {
    market_industry_match: 'strong',
    business_complexity: 'strong',
    custom_web_relevance: 'weak',
    growth_signals: 'none',
    navigation_conversion_friction: 'strong',
    performance_technical_issues: 'unknown',
    content_information_architecture: 'weak',
    integration_cms_opportunity: 'none',
  },
  evidence: [
    evidence('market_industry_match', 'observation', 'Fixture: office listed in Fixture City.', 'https://example.com/contact'),
    evidence('business_complexity', 'observation', 'Fixture: twelve practice areas listed.', 'https://example.com/practice-areas'),
    evidence('custom_web_relevance', 'inference', 'Fixture: template theme with stock imagery.', 'https://example.com/'),
    evidence('growth_signals', 'observation', 'Fixture: no hiring or expansion notices found.', 'https://example.com/news'),
    evidence('navigation_conversion_friction', 'observation', 'Fixture: contact form is four clicks deep.', 'https://example.com/'),
    evidence('navigation_conversion_friction', 'observation', 'Fixture: service page has no contact link.', 'https://example.com/services'),
    evidence('content_information_architecture', 'observation', 'Fixture: duplicate service pages.', 'https://example.com/services'),
    evidence('integration_cms_opportunity', 'inference', 'Fixture: no scheduling or intake integration needed.', 'https://example.com/'),
  ],
}

/** Mostly unknown: fit and opportunity are both null, confidence is low. */
export const FIXTURE_SPARSE: IngestProspect = {
  name: 'Fictional Desert Bloom Dental',
  domain: 'example.org',
  market: 'Fixture Valley, NV',
  ratings: {
    market_industry_match: 'strong',
    business_complexity: 'unknown',
    custom_web_relevance: 'unknown',
    growth_signals: 'unknown',
    navigation_conversion_friction: 'strong',
    performance_technical_issues: 'unknown',
    content_information_architecture: 'unknown',
    integration_cms_opportunity: 'unknown',
  },
  evidence: [
    evidence('market_industry_match', 'observation', 'Fixture: practice located in Fixture Valley.', 'https://example.org/'),
    evidence('navigation_conversion_friction', 'observation', 'Fixture: no booking path on mobile.', 'https://example.org/'),
    evidence('navigation_conversion_friction', 'observation', 'Fixture: practice page repeats a different phone number.', 'https://example.org/practice'),
  ],
}

/** Rated strong without evidence for growth_signals: must be rejected. */
export const FIXTURE_MISSING_EVIDENCE: IngestProspect = {
  name: 'Fictional Canyon Ridge Realty',
  domain: 'canyon-ridge.example.net',
  ratings: {
    market_industry_match: 'weak',
    business_complexity: 'unknown',
    custom_web_relevance: 'unknown',
    growth_signals: 'strong',
    navigation_conversion_friction: 'unknown',
    performance_technical_issues: 'unknown',
    content_information_architecture: 'unknown',
    integration_cms_opportunity: 'unknown',
  },
  evidence: [
    evidence('market_industry_match', 'observation', 'Fixture: listed in a neighbouring market.', 'https://canyon-ridge.example.net/'),
  ],
}

/** On the run's exclusion list: must be rejected. */
export const FIXTURE_EXCLUDED: IngestProspect = {
  name: 'Fictional Excluded Firm',
  domain: 'excluded-firm.example.net',
  ratings: {
    market_industry_match: 'unknown',
    business_complexity: 'unknown',
    custom_web_relevance: 'unknown',
    growth_signals: 'unknown',
    navigation_conversion_friction: 'unknown',
    performance_technical_issues: 'unknown',
    content_information_architecture: 'unknown',
    integration_cms_opportunity: 'unknown',
  },
  evidence: [],
}

export const FIXTURE_BATCH: IngestBatch = {
  runId: FIXTURE_RUN_ID,
  prospects: [
    FIXTURE_FULLY_RATED,
    FIXTURE_SPARSE,
    FIXTURE_MISSING_EVIDENCE,
    FIXTURE_EXCLUDED,
  ],
}
