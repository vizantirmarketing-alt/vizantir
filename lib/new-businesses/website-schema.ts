/**
 * Wire format between the external research runner and the website-check
 * ingest route. Pure; no I/O. Every object is strict: unknown fields reject
 * the batch.
 *
 * Note what is absent: the runner cannot send a website status, a score, a
 * tier, or which rows to write. The server decides the status from these
 * observations (lib/new-businesses/website-rules.ts) and writes only the
 * license rows of businesses that belong to the claimed run.
 */

import { z } from 'zod'

import { parseHttpUrl } from '@/lib/new-businesses/website-hosts'

export const CHECK_INGEST_MAX_BUSINESSES = 40
export const CHECK_INGEST_MAX_CANDIDATES = 6
export const CHECK_INGEST_MAX_SEARCHES = 3
export const CHECK_INGEST_MAX_RUN_LINES = 50
/** Excerpts are verbatim text under 25 words. */
export const CHECK_EXCERPT_MAX_WORDS = 24
/** Request body cap, checked before JSON parsing. */
export const CHECK_INGEST_MAX_BODY_CHARS = 200_000

export const CANDIDATE_KINDS = ['own_site', 'social', 'directory', 'builder_page', 'other'] as const
export const OUTCOMES_CLAIMED = ['none_found', 'found', 'unclear'] as const

const httpUrlSchema = z
  .string()
  .trim()
  .min(1)
  .max(2048)
  .refine((value) => parseHttpUrl(value) !== null, { message: 'Must be an http or https URL.' })

const excerptSchema = z
  .string()
  .trim()
  .min(1)
  .max(300)
  .refine((value) => value.split(/\s+/).filter(Boolean).length <= CHECK_EXCERPT_MAX_WORDS, {
    message: `Excerpts must be under 25 words.`,
  })

export const identityMatchSchema = z.strictObject({
  name: z.boolean(),
  street_address: z.boolean(),
  phone: z.boolean(),
  city: z.boolean(),
  business_type: z.boolean(),
})

export const candidateSchema = z.strictObject({
  url: httpUrlSchema,
  kind_claimed: z.enum(CANDIDATE_KINDS),
  excerpt: excerptSchema,
  identity_match: identityMatchSchema,
})

export const checkedBusinessSchema = z.strictObject({
  /** The opaque business id from the claim response. */
  id: z.uuid(),
  searches: z.array(z.string().trim().min(1).max(300)).min(1).max(CHECK_INGEST_MAX_SEARCHES),
  candidates: z.array(candidateSchema).max(CHECK_INGEST_MAX_CANDIDATES),
  placeholder: z.boolean(),
  outcome_claimed: z.enum(OUTCOMES_CLAIMED),
  note: z.string().trim().max(300).optional(),
})

export const checkBatchSchema = z.strictObject({
  runId: z.uuid(),
  businesses: z.array(checkedBusinessSchema).max(CHECK_INGEST_MAX_BUSINESSES),
  /** Set on the last batch of a run. */
  finish: z.enum(['completed', 'failed']).optional(),
  /** Runner-side errors: something went wrong in the run itself. */
  runErrors: z.array(z.string().trim().min(1).max(500)).max(CHECK_INGEST_MAX_RUN_LINES).optional(),
  /** Runner notes: skipped businesses and similar. Never errors. */
  runNotes: z.array(z.string().trim().min(1).max(500)).max(CHECK_INGEST_MAX_RUN_LINES).optional(),
})

export type IdentityMatch = z.infer<typeof identityMatchSchema>
export type CheckCandidate = z.infer<typeof candidateSchema>
export type CheckedBusiness = z.infer<typeof checkedBusinessSchema>
export type CheckBatch = z.infer<typeof checkBatchSchema>

export type ParseCheckBodyResult =
  | { ok: true; batch: CheckBatch }
  | { ok: false; status: 400 | 413; error: string; issues?: string[] }

/** Parses a raw request body. Size is checked before JSON parsing. */
export function parseCheckBody(raw: string): ParseCheckBodyResult {
  if (raw.length > CHECK_INGEST_MAX_BODY_CHARS) {
    return { ok: false, status: 413, error: 'Payload too large' }
  }
  let json: unknown
  try {
    json = JSON.parse(raw)
  } catch {
    return { ok: false, status: 400, error: 'Invalid JSON' }
  }
  const parsed = checkBatchSchema.safeParse(json)
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
