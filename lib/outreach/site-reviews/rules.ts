/**
 * Site review rules. Pure and versioned. The server decides every status and
 * which observations are kept; the runner only reports the pages it read and
 * what it saw on them.
 *
 * For each reported observation, in order:
 *   1. the category is one of SITE_REVIEW_CATEGORIES (the claim's list)
 *   2. the page is on the lead's stored own-site host, judged only from the
 *      host the server stored, never from anything the runner sent
 *   3. the excerpt is present and at most 25 words
 *   4. the text is at most SITE_REVIEW_TEXT_MAX_CHARS characters
 *   5. neither the text nor the excerpt carries an email address or a phone
 *      number, or calls the business new or newly licensed
 * The first SITE_REVIEW_MAX_OBSERVATIONS accepted observations are kept, in
 * the order reported, without repeating the same text.
 *
 * Statuses:
 *   reviewed         at least one observation accepted
 *   nothing_notable  at least one page on the site was read, none accepted
 *   unreadable       no page on the site could be read
 *   unclear          the lead entry could not be read (malformed)
 *
 * A rejected observation may carry contact details, so the evidence keeps
 * only its reason, never its text.
 */

import { z } from 'zod'

import { parseHttpUrl } from '@/lib/new-businesses/website-hosts'
import { normalizeHost } from '@/lib/outreach/contacts/hosts'
import {
  SITE_REVIEW_EXCERPT_MAX_WORDS,
  SITE_REVIEW_MAX_OBSERVATIONS,
  SITE_REVIEW_TEXT_MAX_CHARS,
  type SiteReviewLeadReport,
} from '@/lib/outreach/site-reviews/schema'
import { NEW_BUSINESS_WORDING } from '@/lib/outreach/voice'
import {
  SITE_REVIEW_CATEGORIES,
  SITE_REVIEW_CATEGORY_LABELS,
  SITE_REVIEW_STATUSES,
  type SiteReviewCategory,
  type SiteReviewStatus,
  type StoredObservation,
} from '@/lib/outreach/site-reviews/categories'

export const SITE_REVIEW_RULES_VERSION = 'site-review-rules-v1'

export { SITE_REVIEW_CATEGORIES, SITE_REVIEW_CATEGORY_LABELS, SITE_REVIEW_STATUSES }
export type { SiteReviewCategory, SiteReviewStatus, StoredObservation }

export const REJECT_REASONS = [
  'category',
  'page_not_site',
  'excerpt_missing',
  'excerpt_too_long',
  'text_too_long',
  'contact_detail',
  'new_business_wording',
  'duplicate',
  'over_cap',
] as const
export type ObservationRejectReason = (typeof REJECT_REASONS)[number]

/** The business's own website, as the server stored it. */
export type ReviewSite = { url: string; host: string }

/** The site for a stored own-site URL, or null when it cannot be read. */
export function reviewSiteFor(url: string): ReviewSite | null {
  const parsed = parseHttpUrl(url.trim())
  if (parsed === null) return null
  const host = normalizeHost(parsed.hostname)
  return host.length === 0 ? null : { url: parsed.toString(), host }
}

/** Whether a page is on the stored host. www. is ignored on both sides; nothing else is. */
export function pageOnSite(pageUrl: string, site: ReviewSite): boolean {
  const page = parseHttpUrl(pageUrl.trim())
  return page !== null && normalizeHost(page.hostname) === site.host
}

export function isSiteReviewCategory(value: string): value is SiteReviewCategory {
  return (SITE_REVIEW_CATEGORIES as readonly string[]).includes(value)
}

const EMAIL_IN_TEXT = /[^\s@]+@[^\s@]+\.[^\s@]+/
// Seven or more digits once separators are ignored, as in any phone number.
const PHONE_IN_TEXT = /(?:\+?\d[\s().-]*){7,}/

export function excerptWords(excerpt: string): number {
  const trimmed = excerpt.trim()
  return trimmed.length === 0 ? 0 : trimmed.split(/\s+/).length
}

export type ObservationJudgement = { outcome: 'accepted'; observation: StoredObservation } | { outcome: 'rejected'; reason: ObservationRejectReason }

export function judgeObservation(reported: { category: string; text: string; pageUrl: string; excerpt: string }, site: ReviewSite): ObservationJudgement {
  const category = reported.category.trim()
  if (!isSiteReviewCategory(category)) return { outcome: 'rejected', reason: 'category' }
  if (!pageOnSite(reported.pageUrl, site)) return { outcome: 'rejected', reason: 'page_not_site' }
  const excerpt = reported.excerpt.trim().replace(/\s+/g, ' ')
  if (excerpt.length === 0) return { outcome: 'rejected', reason: 'excerpt_missing' }
  if (excerptWords(excerpt) > SITE_REVIEW_EXCERPT_MAX_WORDS) return { outcome: 'rejected', reason: 'excerpt_too_long' }
  const text = reported.text.trim().replace(/\s+/g, ' ')
  if (text.length === 0 || text.length > SITE_REVIEW_TEXT_MAX_CHARS) return { outcome: 'rejected', reason: 'text_too_long' }
  for (const value of [text, excerpt]) {
    if (EMAIL_IN_TEXT.test(value) || PHONE_IN_TEXT.test(value)) return { outcome: 'rejected', reason: 'contact_detail' }
    if (NEW_BUSINESS_WORDING.test(value)) return { outcome: 'rejected', reason: 'new_business_wording' }
  }
  return { outcome: 'accepted', observation: { category, text, pageUrl: reported.pageUrl.trim(), excerpt } }
}

// --- Evidence, as stored.

const storedReportSchema = z.union([
  z.object({ category: z.string(), text: z.string(), pageUrl: z.string(), excerpt: z.string() }),
  z.object({ redacted: z.literal(true), reason: z.enum(REJECT_REASONS) }),
])

const evidenceSchema = z.object({
  site: z.object({ url: z.string(), host: z.string() }),
  pagesRead: z.array(z.string()),
  observations: z.array(storedReportSchema),
  note: z.string().nullable(),
})
export type SiteReviewEvidence = z.infer<typeof evidenceSchema>

export type SiteReviewDecision = {
  status: SiteReviewStatus
  /** Accepted, at most SITE_REVIEW_MAX_OBSERVATIONS, in the order reported. */
  observations: StoredObservation[]
  /** Pages on the site that were read. */
  pagesRead: string[]
  acceptedCount: number
  rejectedCount: number
  /** { malformed: true } for an unclear entry that could not be read. */
  evidence: SiteReviewEvidence | { malformed: true }
  rulesVersion: string
}

function decideFromEvidence(evidence: SiteReviewEvidence): SiteReviewDecision {
  const site: ReviewSite = evidence.site
  const kept: StoredObservation[] = []
  const seen = new Set<string>()
  let rejectedCount = 0
  for (const item of evidence.observations) {
    if ('redacted' in item) {
      rejectedCount += 1
      continue
    }
    const judged = judgeObservation(item, site)
    if (judged.outcome === 'rejected') {
      rejectedCount += 1
      continue
    }
    const key = judged.observation.text.toLowerCase()
    if (seen.has(key) || kept.length >= SITE_REVIEW_MAX_OBSERVATIONS) {
      rejectedCount += 1
      continue
    }
    seen.add(key)
    kept.push(judged.observation)
  }
  const pagesRead = evidence.pagesRead.filter((page) => pageOnSite(page, site))
  // An accepted observation proves its page was read, even if pages_read left it out.
  const read = pagesRead.length > 0 || kept.length > 0
  const status: SiteReviewStatus = kept.length > 0 ? 'reviewed' : read ? 'nothing_notable' : 'unreadable'
  return { status, observations: kept, pagesRead, acceptedCount: kept.length, rejectedCount, evidence, rulesVersion: SITE_REVIEW_RULES_VERSION }
}

/** Decides one lead from the runner's report and the site as the server stored it. */
export function decideSiteReview(site: ReviewSite, report: SiteReviewLeadReport): SiteReviewDecision {
  const evidence: SiteReviewEvidence = {
    site,
    pagesRead: report.pages_read.map((page) => page.trim()),
    observations: report.observations.map((item) => {
      const judged = judgeObservation({ category: item.category, text: item.text, pageUrl: item.page_url, excerpt: item.excerpt }, site)
      // Kept whole only when accepted now; a rejected one may carry contact details.
      return judged.outcome === 'accepted' ? judged.observation : { redacted: true as const, reason: judged.reason }
    }),
    note: report.note?.trim() || null,
  }
  return decideFromEvidence(evidence)
}

/** A lead entry the server could not read. Nothing from it is kept. */
export function unclearSiteReview(): SiteReviewDecision {
  return {
    status: 'unclear',
    observations: [],
    pagesRead: [],
    acceptedCount: 0,
    rejectedCount: 0,
    evidence: { malformed: true },
    rulesVersion: SITE_REVIEW_RULES_VERSION,
  }
}

/**
 * Re-decides a stored result under the current rules, from its stored
 * evidence. null when the evidence is missing or malformed: the stored result
 * is then left as it is and nothing is guessed.
 */
export function rederiveSiteReview(evidence: unknown): SiteReviewDecision | null {
  const parsed = evidenceSchema.safeParse(evidence)
  return parsed.success ? decideFromEvidence(parsed.data) : null
}

/** Stored observations as read back from the database; anything malformed is dropped. */
export function readStoredObservations(value: unknown): StoredObservation[] {
  const parsed = z
    .array(z.object({ category: z.enum(SITE_REVIEW_CATEGORIES), text: z.string(), pageUrl: z.string(), excerpt: z.string() }))
    .safeParse(value)
  return parsed.success ? parsed.data.slice(0, SITE_REVIEW_MAX_OBSERVATIONS) : []
}
