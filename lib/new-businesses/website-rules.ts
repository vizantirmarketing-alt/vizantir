/**
 * Website-check status rules. Pure and versioned. The server decides every
 * status from the runner's observations; the runner never sends a status,
 * label, score or tier.
 */

import { classifyHost, type HostKind } from '@/lib/new-businesses/website-hosts'
import type { CheckCandidate, CheckedBusiness, IdentityMatch } from '@/lib/new-businesses/website-schema'

export const WEBSITE_RULES_VERSION = 'website-check-v1'

export const WEBSITE_STATUSES = ['no_website', 'social_only', 'placeholder', 'free_builder', 'has_website', 'unclear'] as const
export type WebsiteStatus = (typeof WEBSITE_STATUSES)[number]

export const WEBSITE_STATUS_LABELS: Record<WebsiteStatus, string> = {
  no_website: 'No website',
  social_only: 'Social page only',
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

export type AcceptedCandidate = CheckCandidate & { hostKind: HostKind }

export type WebsiteEvidence = {
  searches: string[]
  candidates: {
    url: string
    kindClaimed: CheckCandidate['kind_claimed']
    hostKind: HostKind | null
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
  /** The best accepted URL, or null when none was accepted. */
  url: string | null
  evidence: WebsiteEvidence
  rulesVersion: string
}

function matchedFields(match: IdentityMatch): (keyof IdentityMatch)[] {
  return (Object.keys(match) as (keyof IdentityMatch)[]).filter((key) => match[key])
}

/**
 * The final status:
 *   no_website    outcome none_found, at least two distinct searches, no accepted candidate
 *   social_only   accepted candidates exist and every one is social or a directory
 *   placeholder   an accepted own-domain site, and the runner saw it parked or "coming soon"
 *   free_builder  the best accepted candidate is a free builder address
 *   has_website   an accepted own-domain site that is not a placeholder
 *   unclear       anything else, including none_found after fewer than two searches
 * Best candidate order: own domain, then free builder, then social or directory.
 */
export function decideWebsiteStatus(report: CheckedBusiness): WebsiteDecision {
  const assessed = report.candidates.map((candidate) => {
    const hostKind = classifyHost(candidate.url)
    return { candidate, hostKind, accepted: hostKind !== null && identityAccepted(candidate.identity_match) }
  })
  const accepted: AcceptedCandidate[] = assessed
    .filter((item) => item.accepted)
    .map((item) => ({ ...item.candidate, hostKind: item.hostKind! }))

  const evidence: WebsiteEvidence = {
    searches: report.searches.map((search) => search.trim()),
    candidates: assessed.map(({ candidate, hostKind, accepted: ok }) => ({
      url: candidate.url.trim(),
      kindClaimed: candidate.kind_claimed,
      hostKind,
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

  if (accepted.length === 0) {
    const enoughSearches = distinctSearchCount(report.searches) >= NO_WEBSITE_MIN_SEARCHES
    return report.outcome_claimed === 'none_found' && enoughSearches ? decide('no_website', null) : decide('unclear', null)
  }

  const own = accepted.find((c) => c.hostKind === 'own_domain')
  if (own !== undefined) {
    return decide(report.placeholder ? 'placeholder' : 'has_website', own.url.trim())
  }
  const builder = accepted.find((c) => c.hostKind === 'free_builder')
  if (builder !== undefined) {
    return decide('free_builder', builder.url.trim())
  }
  return decide('social_only', accepted[0]!.url.trim())
}
