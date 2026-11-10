/**
 * Builds the claim response for the external runner. No direct I/O: the
 * store is injected (lib/prospects/claim.test.ts).
 *
 * Known domains are listed before the run is claimed, so a failure to list
 * them never leaves a run claimed with no response.
 */

import type { RunConfig } from '@/lib/prospects/ingest'
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

export interface ProspectClaimStore {
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
        factors: { key: string; score: string; label: string }[]
      }
      knownDomains: string[]
    }

export async function buildClaimResponse(
  store: ProspectClaimStore,
  now: Date,
): Promise<ClaimResponse> {
  const knownDomains = await store.listKnownDomains()
  const run = await store.claimOldestRequestedRun(now.toISOString())
  if (run === null) {
    return { run: null }
  }

  return {
    run,
    rubric: {
      version: RUBRIC_VERSION,
      ratings: PROSPECT_RATINGS,
      factors: PROSPECT_FACTORS.map((key) => ({
        key,
        score: FACTOR_DEFINITIONS[key].score,
        label: FACTOR_DEFINITIONS[key].label,
      })),
    },
    knownDomains: [...new Set(knownDomains)].sort(),
  }
}
