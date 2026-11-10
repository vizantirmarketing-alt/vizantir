import 'server-only'

/**
 * Supabase adapter for prospect runs and ingest. Thin on purpose: the rules
 * live in lib/prospects/ingest.ts. Writes only to prospect_runs, prospects and
 * prospect_evidence.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'

import type { ProspectClaimStore } from '@/lib/prospects/claim'
import type {
  EvidenceWrite,
  ProspectIngestStore,
  ProspectWrite,
  RecordOutcomes,
  RunUpdate,
  StoredRun,
} from '@/lib/prospects/ingest'
import type {
  MeasurementWrite,
  ProspectMeasureStore,
} from '@/lib/prospects/measure'
import { PROSPECT_RUN_STATES } from '@/lib/prospects/params'
import { readFactorRatings } from '@/lib/prospects/rubric'
import { readRunConfig } from '@/lib/prospects/run-config'
import { createSupabaseServiceRole } from '@/lib/supabase/service'

const RUN_COLUMNS =
  'id, state, config, record_outcomes, error_summary, requested_at, claimed_at'

const outcomeSchema = z.object({
  status: z.enum(['saved', 'rejected']),
  reasons: z.array(z.string()),
})

const runRowSchema = z.object({
  id: z.string(),
  state: z.enum(PROSPECT_RUN_STATES),
  config: z.unknown(),
  record_outcomes: z.unknown(),
  error_summary: z.string().nullable(),
  requested_at: z.string(),
  claimed_at: z.string().nullable(),
})

type RunRow = z.infer<typeof runRowSchema>

export class ProspectStoreError extends Error {
  constructor(operation: string) {
    super(`Prospect store ${operation} failed`)
    this.name = 'ProspectStoreError'
  }
}

function readOutcomes(value: unknown): RecordOutcomes {
  const outcomes: RecordOutcomes = {}
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return outcomes
  }
  for (const [key, raw] of Object.entries(value)) {
    const parsed = outcomeSchema.safeParse(raw)
    if (parsed.success) {
      outcomes[key] = parsed.data
    }
  }
  return outcomes
}

function toStoredRun(row: RunRow): StoredRun | null {
  const config = readRunConfig(row.config)
  if (config === null) {
    return null
  }
  return {
    id: row.id,
    state: row.state,
    config,
    recordOutcomes: readOutcomes(row.record_outcomes),
    errorSummary: row.error_summary,
  }
}

const CLAIM_ATTEMPTS = 3
const KNOWN_DOMAINS_PAGE = 1000
const KNOWN_DOMAINS_MAX_PAGES = 50

export function createProspectStore(
  client: SupabaseClient = createSupabaseServiceRole(),
): ProspectIngestStore & ProspectClaimStore & ProspectMeasureStore {
  return {
    async listKnownDomains() {
      const domains: string[] = []
      for (let page = 0; page < KNOWN_DOMAINS_MAX_PAGES; page += 1) {
        const from = page * KNOWN_DOMAINS_PAGE
        const { data, error } = await client
          .from('prospects')
          .select('domain')
          .order('domain', { ascending: true })
          .range(from, from + KNOWN_DOMAINS_PAGE - 1)

        if (error) {
          throw new ProspectStoreError('known domains read')
        }
        const rows = z.array(z.object({ domain: z.string() })).safeParse(data ?? [])
        if (!rows.success) {
          throw new ProspectStoreError('known domains parse')
        }
        domains.push(...rows.data.map((row) => row.domain))
        if (rows.data.length < KNOWN_DOMAINS_PAGE) {
          return domains
        }
      }
      // Fail closed rather than hand the runner a silently truncated list.
      throw new ProspectStoreError('known domains limit')
    },

    async findProspectByDomain(domain: string) {
      const { data, error } = await client
        .from('prospects')
        .select('id, domain, factor_ratings, latest_run_id')
        .eq('domain', domain)
        .maybeSingle()

      if (error) {
        throw new ProspectStoreError('prospect read')
      }
      if (data === null) {
        return null
      }
      const row = z
        .object({
          id: z.string(),
          domain: z.string(),
          factor_ratings: z.unknown(),
          latest_run_id: z.string().nullable(),
        })
        .safeParse(data)
      if (!row.success) {
        throw new ProspectStoreError('prospect parse')
      }
      return {
        id: row.data.id,
        domain: row.data.domain,
        factorRatings: readFactorRatings(row.data.factor_ratings),
        latestRunId: row.data.latest_run_id,
      }
    },

    async saveMeasurement(write: MeasurementWrite) {
      const { error: deleteError } = await client
        .from('prospect_evidence')
        .delete()
        .eq('prospect_id', write.prospectId)
        .eq('run_id', write.runId)
        .eq('factor_key', write.evidence.factorKey)
        .eq('kind', 'measurement')

      if (deleteError) {
        throw new ProspectStoreError('measurement evidence delete')
      }

      const { error: insertError } = await client.from('prospect_evidence').insert({
        prospect_id: write.prospectId,
        run_id: write.runId,
        factor_key: write.evidence.factorKey,
        kind: write.evidence.kind,
        claim: write.evidence.claim,
        source_url: write.evidence.sourceUrl,
        observed_at: write.evidence.observedAt,
      })

      if (insertError) {
        throw new ProspectStoreError('measurement evidence insert')
      }

      const { error: updateError } = await client
        .from('prospects')
        .update({
          factor_ratings: write.factorRatings,
          fit_score: write.fitScore,
          opportunity_score: write.opportunityScore,
          confidence: write.confidence,
          rubric_version: write.rubricVersion,
          updated_at: write.updatedAt,
        })
        .eq('id', write.prospectId)

      if (updateError) {
        throw new ProspectStoreError('prospect score update')
      }
    },

    async claimOldestRequestedRun(nowIso) {
      for (let attempt = 0; attempt < CLAIM_ATTEMPTS; attempt += 1) {
        const { data: candidate, error: readError } = await client
          .from('prospect_runs')
          .select('id')
          .eq('state', 'requested')
          .order('requested_at', { ascending: true })
          .limit(1)
          .maybeSingle()

        if (readError) {
          throw new ProspectStoreError('claim read')
        }
        const candidateId = z.object({ id: z.string() }).safeParse(candidate)
        if (!candidateId.success) {
          return null
        }

        // Conditional on state so two concurrent claims cannot both win.
        const { data: claimed, error: claimError } = await client
          .from('prospect_runs')
          .update({ state: 'claimed', claimed_at: nowIso, updated_at: nowIso })
          .eq('id', candidateId.data.id)
          .eq('state', 'requested')
          .select(RUN_COLUMNS)
          .maybeSingle()

        if (claimError) {
          throw new ProspectStoreError('claim update')
        }
        if (claimed === null) {
          continue
        }

        const row = runRowSchema.safeParse(claimed)
        if (!row.success) {
          throw new ProspectStoreError('claim parse')
        }
        const config = readRunConfig(row.data.config)
        if (config === null) {
          // A run whose config cannot be read cannot be researched. Fail it
          // visibly instead of handing the runner garbage.
          await client
            .from('prospect_runs')
            .update({
              state: 'failed',
              error_summary: 'Run config could not be read.',
              finished_at: nowIso,
              updated_at: nowIso,
            })
            .eq('id', row.data.id)
          continue
        }

        return {
          id: row.data.id,
          config,
          requestedAt: row.data.requested_at,
          claimedAt: row.data.claimed_at ?? nowIso,
        }
      }
      return null
    },

    async getRun(runId) {
      const { data, error } = await client
        .from('prospect_runs')
        .select(RUN_COLUMNS)
        .eq('id', runId)
        .maybeSingle()

      if (error) {
        throw new ProspectStoreError('run read')
      }
      if (data === null) {
        return null
      }
      const row = runRowSchema.safeParse(data)
      if (!row.success) {
        throw new ProspectStoreError('run parse')
      }
      return toStoredRun(row.data)
    },

    async saveProspect(write: ProspectWrite) {
      // review_status, owner_note, reviewed_at and created_at are omitted so a
      // re-research never overwrites the owner's review.
      const { data, error } = await client
        .from('prospects')
        .upsert(
          {
            domain: write.domain,
            canonical_name: write.canonicalName,
            market: write.market,
            industry: write.industry,
            factor_ratings: write.factorRatings,
            fit_score: write.fitScore,
            opportunity_score: write.opportunityScore,
            confidence: write.confidence,
            rubric_version: write.rubricVersion,
            latest_run_id: write.latestRunId,
            last_researched_at: write.lastResearchedAt,
            updated_at: write.lastResearchedAt,
          },
          { onConflict: 'domain' },
        )
        .select('id')
        .single()

      if (error) {
        throw new ProspectStoreError('prospect upsert')
      }
      const parsed = z.object({ id: z.string() }).safeParse(data)
      if (!parsed.success) {
        throw new ProspectStoreError('prospect upsert parse')
      }
      return { id: parsed.data.id }
    },

    async replaceRunEvidence(prospectId: string, runId: string, evidence: EvidenceWrite[]) {
      const { error: deleteError } = await client
        .from('prospect_evidence')
        .delete()
        .eq('prospect_id', prospectId)
        .eq('run_id', runId)

      if (deleteError) {
        throw new ProspectStoreError('evidence delete')
      }
      if (evidence.length === 0) {
        return
      }

      const { error: insertError } = await client.from('prospect_evidence').insert(
        evidence.map((item) => ({
          prospect_id: prospectId,
          run_id: runId,
          factor_key: item.factorKey,
          kind: item.kind,
          claim: item.claim,
          source_url: item.sourceUrl,
          observed_at: item.observedAt,
        })),
      )

      if (insertError) {
        throw new ProspectStoreError('evidence insert')
      }
    },

    async updateRun(runId: string, update: RunUpdate) {
      const patch: Record<string, unknown> = {
        record_outcomes: update.recordOutcomes,
        counts: update.counts,
        error_summary: update.errorSummary,
        updated_at: update.updatedAt,
      }
      if (update.finish !== undefined) {
        patch.state = update.finish.state
        patch.finished_at = update.finish.finishedAt
      }

      const { data, error } = await client
        .from('prospect_runs')
        .update(patch)
        .eq('id', runId)
        .eq('state', 'claimed')
        .select('id')
        .maybeSingle()

      if (error) {
        throw new ProspectStoreError('run update')
      }
      return data !== null
    },
  }
}

