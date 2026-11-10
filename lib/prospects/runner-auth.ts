/**
 * Bearer authentication for the external prospect research runner.
 *
 * PROSPECT_INGEST_TOKEN authorizes the two prospect runner routes and nothing
 * else. It is deliberately not CRON_SECRET: if the two are configured to the
 * same value the routes refuse to serve, so one leaked secret cannot reach
 * both the crons and prospect ingest.
 */

import { createHash, timingSafeEqual } from 'node:crypto'

export const PROSPECT_INGEST_TOKEN_ENV = 'PROSPECT_INGEST_TOKEN'

export type RunnerAuthEnv = {
  token: string | undefined
  cronSecret: string | undefined
}

export type RunnerAuthResult =
  | { ok: true }
  | { ok: false; status: 401 | 503; error: string }

export function readRunnerAuthEnv(): RunnerAuthEnv {
  return {
    token: process.env.PROSPECT_INGEST_TOKEN,
    cronSecret: process.env.CRON_SECRET,
  }
}

/** Constant-time comparison of the Authorization header against `Bearer <token>`. */
export function bearerMatches(header: string | null, token: string): boolean {
  const provided = createHash('sha256').update(header ?? '').digest()
  const expected = createHash('sha256').update(`Bearer ${token}`).digest()
  return timingSafeEqual(provided, expected)
}

export function authorizeRunner(
  header: string | null,
  env: RunnerAuthEnv,
): RunnerAuthResult {
  const token = env.token?.trim() ?? ''
  if (token.length === 0) {
    return { ok: false, status: 503, error: 'Prospect ingest is not configured' }
  }

  const cronSecret = env.cronSecret?.trim() ?? ''
  if (cronSecret.length > 0 && cronSecret === token) {
    return { ok: false, status: 503, error: 'Prospect ingest is not configured' }
  }

  if (!bearerMatches(header, token)) {
    return { ok: false, status: 401, error: 'Unauthorized' }
  }

  return { ok: true }
}
