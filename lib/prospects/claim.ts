/**
 * Builds the claim response for the external runner. No direct I/O: the
 * store is injected (lib/prospects/claim.test.ts).
 *
 * Order matters:
 *   1. Abandoned runs (claimed more than ABANDONED_RUN_HOURS ago, never
 *      finished) are marked failed with a System line, so they stop showing
 *      as in progress and the queue moves on.
 *   2. Known domains are listed before the run is claimed, so a failure to
 *      list them never leaves a run claimed with no response.
 *   3. The oldest requested run is claimed.
 *
 * A targeted run (run.config.targetDomain set) also gets a top-level
 * targetDomain, and that one domain is left out of knownDomains so the
 * runner may research it again. Every other saved domain is still listed.
 * An ordinary run's response is exactly as before.
 */

import { SYSTEM_LINE_PREFIX, type RunConfig } from '@/lib/prospects/ingest'
import {
  FACTOR_DEFINITIONS,
  PROSPECT_FACTORS,
  PROSPECT_RATINGS,
  RUBRIC_VERSION,
} from '@/lib/prospects/rubric'

export type ClaimedRun = {
  id: string
  config: RunConfig
  requestedAt: string
  claimedAt: string
}

export const ABANDONED_RUN_HOURS = 2

export function abandonedCutoff(now: Date): Date {
  return new Date(now.getTime() - ABANDONED_RUN_HOURS * 60 * 60 * 1000)
}

export function abandonedReasonLine(claimedAt: string): string {
  return (
    `${SYSTEM_LINE_PREFIX}Run abandoned: claimed at ${claimedAt} and not finished ` +
    `within ${ABANDONED_RUN_HOURS} hours. Marked failed when the next run was claimed.`
  )
}

export interface ProspectClaimStore {
  /**
   * Marks every run still claimed with claimed_at before the cutoff as
   * failed, appending abandonedReasonLine(claimedAt) to its summary.
   * Returns how many runs were failed.
   */
  failAbandonedRuns(cutoffIso: string, nowIso: string): Promise<number>
  claimOldestRequestedRun(nowIso: string): Promise<ClaimedRun | null>
  /** Every normalized domain already in the prospects table. */
  listKnownDomains(): Promise<string[]>
}

export type ClaimResponse =
  | { run: null }
  | {
      run: ClaimedRun
      rubric: {
        version: string
        ratings: readonly string[]
        factors: { key: string; score: string; label: string; description: string }[]
      }
      knownDomains: string[]
      /** Targeted runs only: the one saved domain to research again. */
      targetDomain?: string
    }

export async function buildClaimResponse(
  store: ProspectClaimStore,
  now: Date,
): Promise<ClaimResponse> {
  await store.failAbandonedRuns(abandonedCutoff(now).toISOString(), now.toISOString())
  const knownDomains = await store.listKnownDomains()
  const run = await store.claimOldestRequestedRun(now.toISOString())
  if (run === null) {
    return { run: null }
  }

  const targetDomain = run.config.targetDomain
  const listed = [...new Set(knownDomains)].sort()
  return {
    run,
    rubric: {
      version: RUBRIC_VERSION,
      ratings: PROSPECT_RATINGS,
      factors: PROSPECT_FACTORS.map((key) => ({
        key,
        score: FACTOR_DEFINITIONS[key].score,
        label: FACTOR_DEFINITIONS[key].label,
        description: FACTOR_DEFINITIONS[key].description,
      })),
    },
    knownDomains: targetDomain === undefined ? listed : listed.filter((domain) => domain !== targetDomain),
    ...(targetDomain === undefined ? {} : { targetDomain }),
  }
}
