/**
 * The minimal context a draft is written from. Pure; no I/O.
 *
 * This is the data minimisation boundary for outreach, in the same way
 * lib/briefing/context.ts is for the briefing. A lead object may carry more
 * (an owner note, a phone number, an address, review history); only the
 * fields named here are copied out, so nothing else can reach the model.
 *
 *   prospect      company name, domain, market, industry, up to three of its
 *                 strongest stored evidence claims with their factor labels,
 *                 and the measured mobile performance if present
 *   new business  business name, plain business type, city, license period,
 *                 and the website check status in words
 *   both          the fixed studio description (STUDIO_DESCRIPTION)
 *
 * outreachBasis() makes the same selection for the draft page's "Written
 * from" panel, adding each item's source link for the owner. Source links
 * are shown to the owner only; they are never part of the context.
 *
 * Evidence claims were written by the research runner from pages on the
 * open web. They are untrusted data: the prompt says so, and any claim that
 * carries an email address, a phone number or a web address other than the
 * company's own is dropped here rather than passed on.
 */

import { formatPeriod, type Period } from '@/lib/new-businesses/discovery'
import { categoryShortName } from '@/lib/new-businesses/category-tiers'
import { leadingCategory } from '@/lib/new-businesses/rank'
import type { WebsiteStatus } from '@/lib/new-businesses/website-rules'
import type { NewBusinessReviewStatus } from '@/lib/new-businesses/params'
import type { ProspectReviewStatus } from '@/lib/prospects/params'
import {
  PERFORMANCE_FACTOR,
  formatPerformanceSummary,
  parseMeasurementClaim,
} from '@/lib/prospects/measure'
import {
  FACTOR_DEFINITIONS,
  isProspectFactor,
  type FactorRatings,
} from '@/lib/prospects/rubric'
import { STUDIO_DESCRIPTION, type OutreachSubjectType } from '@/lib/outreach/params'

export const MAX_CONTEXT_CLAIMS = 3
const CLAIM_MAX_CHARS = 400
const FIELD_MAX_CHARS = 160

export type ProspectLead = {
  type: 'prospect'
  id: string
  name: string
  domain: string
  market: string | null
  industry: string | null
  reviewStatus: ProspectReviewStatus
  factorRatings: FactorRatings
  /** Most recently observed first. The source link is for the owner's view only. */
  evidence: readonly { factorKey: string; kind: string; claim: string; sourceUrl?: string | null }[]
  // Carried by the loader but never copied into the context:
  ownerNote?: string | null
}

export type NewBusinessLead = {
  type: 'new_business'
  /** The primary license row. */
  id: string
  /** Every license row of the business shares it; null before grouping. */
  groupKey: string | null
  name: string
  licenses: readonly string[]
  city: string | null
  latestPeriod: Period
  websiteStatus: WebsiteStatus | null
  /** The website found, or the first matching page the check found. For the owner's view only. */
  websiteEvidenceUrl?: string | null
  reviewStatus: NewBusinessReviewStatus
  // Carried by the loader but never copied into the context:
  address?: string | null
  suite?: string | null
  zip?: string | null
  phone?: string | null
  ownerNote?: string | null
}

export type OutreachLead = ProspectLead | NewBusinessLead

export type ProspectContext = {
  leadType: 'prospect'
  company: string
  domain: string
  market: string | null
  industry: string | null
  findings: { factor: string; claim: string }[]
  mobilePerformance: string | null
  studioDescription: string
}

export type NewBusinessContext = {
  leadType: 'new_business'
  business: string
  businessType: string
  city: string | null
  licensed: string
  websiteCheck: string
  studioDescription: string
}

export type OutreachContext = ProspectContext | NewBusinessContext

/** The subject a draft belongs to. For a business, its group, so every license row is covered. */
export function subjectOf(lead: OutreachLead): { subjectType: OutreachSubjectType; subjectRef: string } {
  return lead.type === 'prospect'
    ? { subjectType: 'prospect', subjectRef: lead.id }
    : { subjectType: 'new_business', subjectRef: lead.groupKey ?? lead.id }
}

/** Only an accepted lead can be drafted for. */
export function isDraftable(lead: OutreachLead): boolean {
  return lead.reviewStatus === 'accepted'
}

/** Control characters out, whitespace collapsed, length capped. */
function clean(value: string, max: number): string {
  const text = value.replace(/[\u0000-\u001F\u007F]+/g, ' ').replace(/\s+/g, ' ').trim()
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text
}

function cleanOrNull(value: string | null | undefined, max = FIELD_MAX_CHARS): string | null {
  if (value === null || value === undefined) return null
  const text = clean(value, max)
  return text.length > 0 ? text : null
}

const EMAIL_IN_TEXT = /[^\s@]+@[^\s@]+\.[^\s@]+/
// Seven or more digits once separators are ignored, as in any phone number.
const PHONE_IN_TEXT = /(?:\+?\d[\s().-]*){7,}/
const URL_IN_TEXT = /\bhttps?:\/\/\S+|\bwww\.\S+/i

/** A claim is passed on only if it carries no contact detail and no foreign link. */
export function claimIsSafe(claim: string, domain: string): boolean {
  if (EMAIL_IN_TEXT.test(claim) || PHONE_IN_TEXT.test(claim)) return false
  const urls = claim.match(new RegExp(URL_IN_TEXT.source, 'gi')) ?? []
  const own = domain.replace(/^www\./, '').toLowerCase()
  return urls.every((url) => url.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').startsWith(own))
}

/**
 * Up to three of the strongest evidence claims, ranked as the briefing ranks
 * its highlight: opportunity factors rated strong, then opportunity weak,
 * fit strong, fit weak, anything else; higher weight first; then most
 * recently observed. One claim per factor, so the three say different things.
 */
type Evidence = ProspectLead['evidence'][number]
type SelectedClaim = { factor: string; claim: string; item: Evidence }

function selectClaims(
  ratings: FactorRatings,
  evidence: ProspectLead['evidence'],
  domain: string,
  limit: number,
): SelectedClaim[] {
  const ranked = evidence
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => item.factorKey !== PERFORMANCE_FACTOR && isProspectFactor(item.factorKey))
    .filter(({ item }) => claimIsSafe(item.claim, domain))
    .map(({ item, index }) => {
      const key = item.factorKey as keyof typeof FACTOR_DEFINITIONS
      const definition = FACTOR_DEFINITIONS[key]
      const rating = ratings[key]
      const base = definition.score === 'opportunity' ? 0 : 2
      const tier = rating === 'strong' ? base : rating === 'weak' ? base + 1 : 4
      return { item, index, tier, weight: definition.weight, label: definition.label }
    })
    .sort((a, b) => a.tier - b.tier || b.weight - a.weight || a.index - b.index)

  const seen = new Set<string>()
  const out: SelectedClaim[] = []
  for (const entry of ranked) {
    if (seen.has(entry.item.factorKey)) continue
    seen.add(entry.item.factorKey)
    out.push({ factor: entry.label, claim: clean(entry.item.claim, CLAIM_MAX_CHARS), item: entry.item })
    if (out.length >= limit) break
  }
  return out
}

export function strongestClaims(
  ratings: FactorRatings,
  evidence: ProspectLead['evidence'],
  domain: string,
  limit = MAX_CONTEXT_CLAIMS,
): { factor: string; claim: string }[] {
  return selectClaims(ratings, evidence, domain, limit).map(({ factor, claim }) => ({ factor, claim }))
}

/** The latest parseable mobile measurement, summarised as the model sees it. */
function mobileMeasurement(evidence: ProspectLead['evidence']): { summary: string; item: Evidence } | null {
  for (const item of evidence) {
    if (item.factorKey !== PERFORMANCE_FACTOR || item.kind !== 'measurement') continue
    const parsed = parseMeasurementClaim(item.claim)
    if (parsed !== null) return { summary: formatPerformanceSummary(parsed), item }
  }
  return null
}

/** What the website check found, in words that never overstate it. */
export const WEBSITE_CHECK_WORDS: Record<WebsiteStatus | 'unchecked', string> = {
  no_website: 'A search found no website for this business. That does not prove none exists.',
  social_only: 'A search found only a listing or social media page for this business, no website of its own.',
  placeholder: 'A search found only a placeholder page for this business.',
  free_builder: 'A search found only a free website builder page for this business.',
  has_website: 'A search found a website for this business.',
  unclear: 'A search for a website for this business was inconclusive.',
  unchecked: 'No website check has been made for this business.',
}

export function buildOutreachContext(lead: OutreachLead): OutreachContext {
  if (lead.type === 'prospect') {
    const domain = clean(lead.domain, FIELD_MAX_CHARS)
    return {
      leadType: 'prospect',
      company: clean(lead.name, FIELD_MAX_CHARS),
      domain,
      market: cleanOrNull(lead.market),
      industry: cleanOrNull(lead.industry),
      findings: strongestClaims(lead.factorRatings, lead.evidence, domain),
      mobilePerformance: mobileMeasurement(lead.evidence)?.summary ?? null,
      studioDescription: STUDIO_DESCRIPTION,
    }
  }
  return {
    leadType: 'new_business',
    business: clean(lead.name, FIELD_MAX_CHARS),
    businessType: categoryShortName(leadingCategory(lead.licenses.length > 0 ? lead.licenses : ['Business'])),
    city: cleanOrNull(lead.city),
    licensed: `New business license listed in ${formatPeriod(lead.latestPeriod)}`,
    websiteCheck: WEBSITE_CHECK_WORDS[lead.websiteStatus ?? 'unchecked'],
    studioDescription: STUDIO_DESCRIPTION,
  }
}

/** One line of the "Written from" panel. sourceUrl is unchecked here; the page renders http and https only. */
export type BasisItem = { label: string; text: string; sourceUrl: string | null }

/**
 * What the draft was written from, for the owner to check the email
 * against: the same selection buildOutreachContext() makes, in the same
 * words, with the source link of each item where one is stored.
 */
export function outreachBasis(lead: OutreachLead): BasisItem[] {
  if (lead.type === 'prospect') {
    const domain = clean(lead.domain, FIELD_MAX_CHARS)
    const items: BasisItem[] = selectClaims(lead.factorRatings, lead.evidence, domain, MAX_CONTEXT_CLAIMS).map(
      ({ factor, claim, item }) => ({ label: factor, text: claim, sourceUrl: item.sourceUrl ?? null }),
    )
    const measured = mobileMeasurement(lead.evidence)
    if (measured !== null) {
      items.push({ label: FACTOR_DEFINITIONS[PERFORMANCE_FACTOR].label, text: measured.summary, sourceUrl: measured.item.sourceUrl ?? null })
    }
    return items
  }
  const context = buildOutreachContext(lead)
  if (context.leadType !== 'new_business') return []
  return [
    { label: 'Business type', text: context.businessType, sourceUrl: null },
    { label: 'License', text: context.licensed, sourceUrl: null },
    { label: 'Website check', text: context.websiteCheck, sourceUrl: lead.websiteEvidenceUrl ?? null },
  ]
}
