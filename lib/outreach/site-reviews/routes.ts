/**
 * The runner's site-review claim and ingest, as plain functions over a
 * request's parts, so the routes stay thin and testable. Authorized exactly
 * like the other runner routes: PROSPECT_INGEST_TOKEN only, never CRON_SECRET.
 */

import { authorizeRunner, type RunnerAuthEnv } from '@/lib/prospects/runner-auth'
import { buildSiteReviewClaimResponse, ingestSiteReviewBatch, type SiteReviewStore } from '@/lib/outreach/site-reviews/runs'
import { SITE_REVIEW_INGEST_MAX_BODY_CHARS, parseSiteReviewBody } from '@/lib/outreach/site-reviews/schema'

export type RouteReply = { status: number; body: unknown }

export async function handleSiteReviewClaim(
  authorization: string | null,
  env: RunnerAuthEnv,
  store: () => SiteReviewStore,
  now: Date,
): Promise<RouteReply> {
  const auth = authorizeRunner(authorization, env)
  if (!auth.ok) return { status: auth.status, body: { error: auth.error } }
  try {
    return { status: 200, body: await buildSiteReviewClaimResponse(store(), now) }
  } catch {
    return { status: 500, body: { error: 'Claim failed' } }
  }
}

export async function handleSiteReviewIngest(
  request: { authorization: string | null; contentLength: string | null; text: () => Promise<string> },
  env: RunnerAuthEnv,
  store: () => SiteReviewStore,
  now: Date,
): Promise<RouteReply> {
  const auth = authorizeRunner(request.authorization, env)
  if (!auth.ok) return { status: auth.status, body: { error: auth.error } }

  const declared = Number(request.contentLength)
  if (request.contentLength !== null && Number.isFinite(declared) && declared > SITE_REVIEW_INGEST_MAX_BODY_CHARS) {
    return { status: 413, body: { error: 'Payload too large' } }
  }
  let raw: string
  try {
    raw = await request.text()
  } catch {
    return { status: 400, body: { error: 'Invalid request' } }
  }
  const parsed = parseSiteReviewBody(raw)
  if (!parsed.ok) return { status: parsed.status, body: { error: parsed.error, issues: parsed.issues ?? [] } }

  try {
    const result = await ingestSiteReviewBatch(store(), parsed.batch, now)
    if (!result.ok) return { status: result.status, body: { error: result.error, runState: result.runState ?? null } }
    return {
      status: 200,
      body: { runId: result.runId, runState: result.runState, reviewed: result.reviewed, rejected: result.rejected, counts: result.counts },
    }
  } catch (error) {
    const message = error instanceof Error && error.name === 'SiteReviewStoreError' ? error.message : 'Ingest failed'
    return { status: 500, body: { error: message } }
  }
}
