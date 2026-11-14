/**
 * The runner's contact-address claim and ingest, as plain functions over a
 * request's parts, so the routes stay thin and testable. Authorized exactly
 * like the other runner routes: PROSPECT_INGEST_TOKEN only, never CRON_SECRET.
 */

import { authorizeRunner, type RunnerAuthEnv } from '@/lib/prospects/runner-auth'
import { buildContactClaimResponse, ingestContactBatch, type ContactStore } from '@/lib/outreach/contacts/runs'
import { CONTACT_INGEST_MAX_BODY_CHARS, parseContactBody } from '@/lib/outreach/contacts/schema'

export type RouteReply = { status: number; body: unknown }

export async function handleContactClaim(
  authorization: string | null,
  env: RunnerAuthEnv,
  store: () => ContactStore,
  now: Date,
): Promise<RouteReply> {
  const auth = authorizeRunner(authorization, env)
  if (!auth.ok) return { status: auth.status, body: { error: auth.error } }
  try {
    return { status: 200, body: await buildContactClaimResponse(store(), now) }
  } catch {
    return { status: 500, body: { error: 'Claim failed' } }
  }
}

export async function handleContactIngest(
  request: { authorization: string | null; contentLength: string | null; text: () => Promise<string> },
  env: RunnerAuthEnv,
  store: () => ContactStore,
  now: Date,
): Promise<RouteReply> {
  const auth = authorizeRunner(request.authorization, env)
  if (!auth.ok) return { status: auth.status, body: { error: auth.error } }

  const declared = Number(request.contentLength)
  if (request.contentLength !== null && Number.isFinite(declared) && declared > CONTACT_INGEST_MAX_BODY_CHARS) {
    return { status: 413, body: { error: 'Payload too large' } }
  }
  let raw: string
  try {
    raw = await request.text()
  } catch {
    return { status: 400, body: { error: 'Invalid request' } }
  }
  const parsed = parseContactBody(raw)
  if (!parsed.ok) return { status: parsed.status, body: { error: parsed.error, issues: parsed.issues ?? [] } }

  try {
    const result = await ingestContactBatch(store(), parsed.batch, now)
    if (!result.ok) return { status: result.status, body: { error: result.error, runState: result.runState ?? null } }
    return {
      status: 200,
      body: { runId: result.runId, runState: result.runState, checked: result.checked, rejected: result.rejected, counts: result.counts },
    }
  } catch (error) {
    const message = error instanceof Error && error.name === 'ContactStoreError' ? error.message : 'Ingest failed'
    return { status: 500, body: { error: message } }
  }
}
