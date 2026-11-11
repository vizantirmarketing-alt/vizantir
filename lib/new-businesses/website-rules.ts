/**
 * Website-check status rules. Pure and versioned. The server decides every
 * status from the runner's observations; the runner never sends a status,
 * label, score or tier.
 *
 * Version 2 (this file) classifies each candidate from its host AND the
 * runner's kind_claimed. kind_claimed may only keep or lower a candidate's
 * class, never raise it: a listed social or directory host is a listing and a
 * listed builder host is a free builder whatever the runner says, and only an
 * unlisted host can be lowered, to a listing or a mention. Version 1 counted
 * every unlisted host as the business's own domain, which turned news
 * articles and unlisted directories into "has website".
 */

import { z } from 'zod'

import { classifyHost, type HostKind } from '@/lib/new-businesses/website-hosts'
import {
  CANDIDATE_KINDS,
  OUTCOMES_CLAIMED,
  type CheckCandidate,
  type CheckedBusiness,
  type IdentityMatch,
} from '@/lib/new-businesses/website-schema'

export const WEBSITE_RULES_VERSION = 'website-check-v2'

export const WEBSITE_STATUSES = ['no_website', 'social_only', 'placeholder', 'free_builder', 'has_website', 'unclear'] as const
export type WebsiteStatus = (typeof WEBSITE_STATUSES)[number]

export const WEBSITE_STATUS_LABELS: Record<WebsiteStatus, string> = {
  no_website: 'No website',
  social_only: 'Listing or social page only',
  placeholder: 'Placeholder',
  free_builder: 'Free builder page',
  has_website: 'Has website',
  unclear: 'Unclear',
}

/** Searches needed before "none found" counts as no website. */
export const NO_WEBSITE_MIN_SEARCHES = 2

/**
 * A candidate is this business only if the name matches and at least one of
 * street address, phone, or (city and business type) matches.
 */
export function identityAccepted(match: IdentityMatch): boolean {
  if (!match.name) return false
  return match.street_address || match.phone || (match.city && match.business_type)
}

/** Searches that differ only in case, spacing or punctuation are the same search. */
export function distinctSearchCount(searches: readonly string[]): number {
  return new Set(
    searches.map((search) =>
      search
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ' ')
        .trim(),
    ).filter((search) => search.length > 0),
  ).size
}

/**
 * What an accepted candidate is, strongest first:
 *   own_domain    the business's own website
 *   free_builder  a page on a free builder address
 *   listing       a social, directory or review listing
 *   mention       a page that mentions the business (news, article, other).
 *                 Not a web presence of the business.
 */
export type CandidateClass = 'own_domain' | 'free_builder' | 'listing' | 'mention'

export const CANDIDATE_CLASS_ORDER: Record<CandidateClass, number> = { own_domain: 3, free_builder: 2, listing: 1, mention: 0 }

/** The class from the host alone, as version 1 saw it. */
export function hostClass(hostKind: HostKind): CandidateClass {
  return hostKind === 'social_or_directory' ? 'listing' : hostKind === 'free_builder' ? 'free_builder' : 'own_domain'
}

/**
 * Host first, then kind_claimed, which can only keep or lower the class:
 *   listed social or directory host   listing
 *   listed free builder host          free_builder
 *   any other host, kind_claimed:
 *     own_site or builder_page        own_domain
 *     social or directory             listing
 *     other                           mention
 * Returns null for a URL that is not http or https.
 */
export function candidateClass(url: string, kindClaimed: CheckCandidate['kind_claimed']): CandidateClass | null {
  const hostKind = classifyHost(url)
  if (hostKind === null) return null
  const fromHost = hostClass(hostKind)
  if (fromHost !== 'own_domain') return fromHost
  if (kindClaimed === 'own_site' || kindClaimed === 'builder_page') return 'own_domain'
  if (kindClaimed === 'social' || kindClaimed === 'directory') return 'listing'
  return 'mention'
}

export type WebsiteEvidence = {
  searches: string[]
  candidates: {
    url: string
    kindClaimed: CheckCandidate['kind_claimed']
    hostKind: HostKind | null
    /** Version 2 and later. */
    class?: CandidateClass | null
    excerpt: string
    matched: (keyof IdentityMatch)[]
    accepted: boolean
  }[]
  placeholder: boolean
  outcomeClaimed: CheckedBusiness['outcome_claimed']
  note: string | null
}

export type WebsiteDecision = {
  status: WebsiteStatus
  /** The best own domain, free builder or listing URL; null for no_website and unclear. */
  url: string | null
  evidence: WebsiteEvidence
  rulesVersion: string
}

function matchedFields(match: IdentityMatch): (keyof IdentityMatch)[] {
  return (Object.keys(match) as (keyof IdentityMatch)[]).filter((key) => match[key])
}

/**
 * The final status (version 2):
 *   has_website   at least one accepted own-domain candidate, not a placeholder
 *   placeholder   an accepted own-domain candidate, and placeholder is true
 *   free_builder  no own domain; the best accepted candidate is a free builder address
 *   social_only   no own domain or free builder; at least one accepted listing
 *   no_website    no accepted own domain, free builder or listing, at least two
 *                 distinct searches, and either outcome none_found or the only
 *                 accepted candidates are mentions
 *   unclear       anything else
 * Mentions are kept in the evidence but are never the business's website.
 */
export function decideWebsiteStatus(report: CheckedBusiness): WebsiteDecision {
  const assessed = report.candidates.map((candidate) => {
    const hostKind = classifyHost(candidate.url)
    const cls = candidateClass(candidate.url, candidate.kind_claimed)
    return { candidate, hostKind, cls, accepted: cls !== null && identityAccepted(candidate.identity_match) }
  })
  const accepted = assessed.filter((item) => item.accepted)

  const evidence: WebsiteEvidence = {
    searches: report.searches.map((search) => search.trim()),
    candidates: assessed.map(({ candidate, hostKind, cls, accepted: ok }) => ({
      url: candidate.url.trim(),
      kindClaimed: candidate.kind_claimed,
      hostKind,
      class: cls,
      excerpt: candidate.excerpt.trim(),
      matched: matchedFields(candidate.identity_match),
      accepted: ok,
    })),
    placeholder: report.placeholder,
    outcomeClaimed: report.outcome_claimed,
    note: report.note?.trim() || null,
  }
  const decide = (status: WebsiteStatus, url: string | null): WebsiteDecision => ({
    status,
    url,
    evidence,
    rulesVersion: WEBSITE_RULES_VERSION,
  })
  const first = (cls: CandidateClass) => accepted.find((item) => item.cls === cls)?.candidate.url.trim()

  const own = first('own_domain')
  if (own !== undefined) return decide(report.placeholder ? 'placeholder' : 'has_website', own)
  const builder = first('free_builder')
  if (builder !== undefined) return decide('free_builder', builder)
  const listing = first('listing')
  if (listing !== undefined) return decide('social_only', listing)

  // Nothing accepted is a web presence of the business: no candidates, or mentions only.
  const enoughSearches = distinctSearchCount(report.searches) >= NO_WEBSITE_MIN_SEARCHES
  const mentionsOnly = accepted.length > 0 && accepted.every((item) => item.cls === 'mention')
  if (enoughSearches && (report.outcome_claimed === 'none_found' || mentionsOnly)) return decide('no_website', null)
  return decide('unclear', null)
}

// --- Re-deriving stored results under the current rules.

const IDENTITY_KEYS = ['name', 'street_address', 'phone', 'city', 'business_type'] as const

/**
 * Everything the rules read, as stored in website_evidence by every version:
 * the searches, and per candidate its url, kind_claimed and the identity
 * fields that matched (stored as the list of matched keys), plus placeholder
 * and outcome_claimed. Excerpts and notes are carried over unchanged.
 */
const storedEvidenceSchema = z.object({
  searches: z.array(z.string()),
  candidates: z.array(
    z.object({
      url: z.string(),
      kindClaimed: z.enum(CANDIDATE_KINDS),
      excerpt: z.string(),
      matched: z.array(z.enum(IDENTITY_KEYS)),
    }),
  ),
  placeholder: z.boolean(),
  outcomeClaimed: z.enum(OUTCOMES_CLAIMED),
  note: z.string().nullable().optional(),
})

/**
 * Rebuilds the runner's report from stored evidence, or null when a field
 * the rules need is missing or malformed. A null result means the stored
 * status must be left as it is: nothing is guessed.
 */
export function reportFromStoredEvidence(id: string, evidence: unknown): CheckedBusiness | null {
  const parsed = storedEvidenceSchema.safeParse(evidence)
  if (!parsed.success) return null
  const e = parsed.data
  return {
    id,
    searches: e.searches,
    candidates: e.candidates.map((c) => ({
      url: c.url,
      kind_claimed: c.kindClaimed,
      excerpt: c.excerpt,
      identity_match: Object.fromEntries(IDENTITY_KEYS.map((key) => [key, c.matched.includes(key)])) as IdentityMatch,
    })),
    placeholder: e.placeholder,
    outcome_claimed: e.outcomeClaimed,
    ...(e.note ? { note: e.note } : {}),
  }
}

/** Re-decides a stored result under the current rules; null when the evidence is incomplete. */
export function rederiveWebsiteDecision(id: string, evidence: unknown): WebsiteDecision | null {
  const report = reportFromStoredEvidence(id, evidence)
  return report === null ? null : decideWebsiteStatus(report)
}
