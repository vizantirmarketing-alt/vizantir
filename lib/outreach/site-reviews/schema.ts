/**
 * Wire format between the research runner and the site-review ingest route.
 * Pure; no I/O.
 *
 * The batch itself is strict: an unknown top-level field rejects it. Each
 * lead entry is parsed on its own, also strictly, so one malformed entry does
 * not throw away the rest: the server records that lead as unclear.
 *
 * Note what is absent: the runner never sends a status or a count. It
 * reports the pages it read and what it saw on them; the server decides
 * everything (lib/outreach/site-reviews/rules.ts). The category is a plain
 * string here so that a category outside the claim's list is judged and
 * counted by the rules rather than rejecting the whole lead.
 */

import { z } from 'zod'

import { parseHttpUrl } from '@/lib/new-businesses/website-hosts'

export const SITE_REVIEW_INGEST_MAX_LEADS = 10
/** The given URL plus at most three further pages on the same site. */
export const SITE_REVIEW_MAX_PAGE_READS = 4
/** What the runner is asked to report, and what the server keeps. */
export const SITE_REVIEW_MAX_OBSERVATIONS = 6
/** What the schema lets through, so extra observations are dropped by the rules rather than voiding the lead. */
export const SITE_REVIEW_WIRE_MAX_OBSERVATIONS = 12
export const SITE_REVIEW_TEXT_MAX_CHARS = 400
export const SITE_REVIEW_EXCERPT_MAX_WORDS = 25
export const SITE_REVIEW_INGEST_MAX_RUN_LINES = 50
/** Request body cap, checked before JSON parsing. */
export const SITE_REVIEW_INGEST_MAX_BODY_CHARS = 200_000

const httpUrlSchema = z
  .string()
  .trim()
  .min(1)
  .max(2048)
  .refine((value) => parseHttpUrl(value) !== null, { message: 'Must be an http or https URL.' })

export const reportedObservationSchema = z.strictObject({
  /** One of the claim's categories. Judged by the server. */
  category: z.string().trim().min(1).max(60),
  /** One or two plain factual sentences about what the page does or lacks. Length judged by the server. */
  text: z.string().trim().min(1).max(1000),
  page_url: httpUrlSchema,
  /** Copied verbatim from that page, at most 25 words. Judged by the server. */
  excerpt: z.string().trim().max(1000),
})

export const siteReviewLeadSchema = z.strictObject({
  /** The opaque lead id from the claim response. */
  id: z.uuid(),
  /** The pages actually read, at most four. */
  pages_read: z.array(httpUrlSchema).max(SITE_REVIEW_MAX_PAGE_READS),
  observations: z.array(reportedObservationSchema).max(SITE_REVIEW_WIRE_MAX_OBSERVATIONS),
  note: z.string().trim().max(300).optional(),
})

export const siteReviewBatchSchema = z.strictObject({
  runId: z.uuid(),
  /** Each entry is checked separately; see parseSiteReviewLead. */
  leads: z.array(z.unknown()).max(SITE_REVIEW_INGEST_MAX_LEADS),
  /** Set on the last batch of a run. */
  finish: z.enum(['completed', 'failed']).optional(),
  runErrors: z.array(z.string().trim().min(1).max(500)).max(SITE_REVIEW_INGEST_MAX_RUN_LINES).optional(),
  runNotes: z.array(z.string().trim().min(1).max(500)).max(SITE_REVIEW_INGEST_MAX_RUN_LINES).optional(),
})

export type ReportedObservation = z.infer<typeof reportedObservationSchema>
export type SiteReviewLeadReport = z.infer<typeof siteReviewLeadSchema>
export type SiteReviewBatch = z.infer<typeof siteReviewBatchSchema>

export type ParsedSiteReviewLead =
  | { ok: true; report: SiteReviewLeadReport }
  /** id is set when the entry carried a usable lead id, so the lead can be recorded as unclear. */
  | { ok: false; id: string | null }

export function parseSiteReviewLead(entry: unknown): ParsedSiteReviewLead {
  const parsed = siteReviewLeadSchema.safeParse(entry)
  if (parsed.success) return { ok: true, report: parsed.data }
  const id = z.object({ id: z.uuid() }).safeParse(entry)
  return { ok: false, id: id.success ? id.data.id.toLowerCase() : null }
}

export type ParseSiteReviewBodyResult =
  | { ok: true; batch: SiteReviewBatch }
  | { ok: false; status: 400 | 413; error: string; issues?: string[] }

/** Parses a raw request body. Size is checked before JSON parsing. */
export function parseSiteReviewBody(raw: string): ParseSiteReviewBodyResult {
  if (raw.length > SITE_REVIEW_INGEST_MAX_BODY_CHARS) return { ok: false, status: 413, error: 'Payload too large' }
  let json: unknown
  try {
    json = JSON.parse(raw)
  } catch {
    return { ok: false, status: 400, error: 'Invalid JSON' }
  }
  const parsed = siteReviewBatchSchema.safeParse(json)
  if (!parsed.success) {
    return {
      ok: false,
      status: 400,
      error: 'Invalid payload',
      issues: parsed.error.issues.slice(0, 20).map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`),
    }
  }
  return { ok: true, batch: parsed.data }
}

/** Every lead entry checked locally, for the runner helper: the same parse the server makes. */
export function siteReviewLeadIssues(batch: SiteReviewBatch): string[] {
  const issues: string[] = []
  batch.leads.forEach((entry, index) => {
    const parsed = siteReviewLeadSchema.safeParse(entry)
    if (!parsed.success) {
      for (const issue of parsed.error.issues.slice(0, 5)) issues.push(`leads.${index}.${issue.path.join('.') || '(entry)'}: ${issue.message}`)
    }
  })
  return issues
}
