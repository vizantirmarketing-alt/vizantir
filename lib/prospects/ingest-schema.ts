/**
 * Wire format between the external research runner and the ingest route.
 * Pure; no I/O. Every object is strict: unknown fields reject the batch.
 *
 * Note what is absent: the runner cannot send scores, confidence, review
 * status, or contact details. Scores are computed from ratings in
 * lib/prospects/rubric.ts.
 */

import { z } from 'zod'

import { EVIDENCE_KINDS } from '@/lib/prospects/params'
import { PROSPECT_FACTORS, PROSPECT_RATINGS } from '@/lib/prospects/rubric'

export const INGEST_MAX_PROSPECTS = 25
export const INGEST_MAX_EVIDENCE_PER_PROSPECT = 40
export const INGEST_MAX_RUN_ERRORS = 50
export const INGEST_MAX_RUN_NOTES = 50
/** Request body cap, checked before JSON parsing. */
export const INGEST_MAX_BODY_CHARS = 1_000_000

const ratingSchema = z.enum(PROSPECT_RATINGS)

const ratingsShape = Object.fromEntries(
  PROSPECT_FACTORS.map((factor) => [factor, ratingSchema]),
) as Record<(typeof PROSPECT_FACTORS)[number], typeof ratingSchema>

export const factorRatingsSchema = z.strictObject(ratingsShape)

const httpUrlSchema = z
  .string()
  .trim()
  .max(2048)
  .refine(
    (value) => {
      try {
        const url = new URL(value)
        return url.protocol === 'http:' || url.protocol === 'https:'
      } catch {
        return false
      }
    },
    { message: 'Must be an http or https URL.' },
  )

export const evidenceSchema = z.strictObject({
  factor: z.enum(PROSPECT_FACTORS),
  kind: z.enum(EVIDENCE_KINDS),
  claim: z.string().trim().min(1).max(1000),
  sourceUrl: httpUrlSchema,
  observedAt: z.iso.datetime({ offset: true }),
})

export const ingestProspectSchema = z.strictObject({
  name: z.string().trim().min(1).max(200),
  domain: z.string().trim().min(1).max(2048),
  market: z.string().trim().min(1).max(120).optional(),
  industry: z.string().trim().min(1).max(120).optional(),
  ratings: factorRatingsSchema,
  evidence: z.array(evidenceSchema).max(INGEST_MAX_EVIDENCE_PER_PROSPECT),
})

export const ingestBatchSchema = z.strictObject({
  runId: z.uuid(),
  prospects: z.array(ingestProspectSchema).max(INGEST_MAX_PROSPECTS),
  /** Set on the last batch of a run. */
  finish: z.enum(['completed', 'failed']).optional(),
  /** Runner-side errors: something went wrong. Counts toward a partial result. */
  runErrors: z.array(z.string().trim().min(1).max(500)).max(INGEST_MAX_RUN_ERRORS).optional(),
  /**
   * Runner notes: skipped sites, shortfall reasons and similar. Shown to the
   * owner in neutral styling. Never affects the run's final state.
   */
  runNotes: z.array(z.string().trim().min(1).max(500)).max(INGEST_MAX_RUN_NOTES).optional(),
})

export type IngestEvidence = z.infer<typeof evidenceSchema>
export type IngestProspect = z.infer<typeof ingestProspectSchema>
export type IngestBatch = z.infer<typeof ingestBatchSchema>

export type ParseIngestBodyResult =
  | { ok: true; batch: IngestBatch }
  | { ok: false; status: 400 | 413; error: string; issues?: string[] }

/** Parses a raw request body. Size is checked before JSON parsing. */
export function parseIngestBody(raw: string): ParseIngestBodyResult {
  if (raw.length > INGEST_MAX_BODY_CHARS) {
    return { ok: false, status: 413, error: 'Payload too large' }
  }

  let json: unknown
  try {
    json = JSON.parse(raw)
  } catch {
    return { ok: false, status: 400, error: 'Invalid JSON' }
  }

  const parsed = ingestBatchSchema.safeParse(json)
  if (!parsed.success) {
    return {
      ok: false,
      status: 400,
      error: 'Invalid payload',
      issues: parsed.error.issues
        .slice(0, 20)
        .map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`),
    }
  }

  return { ok: true, batch: parsed.data }
}
