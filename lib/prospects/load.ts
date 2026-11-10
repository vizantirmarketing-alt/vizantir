import 'server-only'

/**
 * Read-only loaders for the Prospect Research dashboard. Selects only.
 */

import { z } from 'zod'

import {
  comparePriority,
  EVIDENCE_KINDS,
  PROSPECT_REVIEW_STATUSES,
  PROSPECT_RUN_STATES,
  PROSPECTS_PAGE_SIZE,
  type EvidenceKind,
  type ProspectReviewStatus,
  type ProspectRunState,
  type ProspectsListParams,
} from '@/lib/prospects/params'
import {
  CONFIDENCE_LEVELS,
  readFactorRatings,
  type FactorRatings,
  type ProspectConfidence,
} from '@/lib/prospects/rubric'
import { readRunConfig } from '@/lib/prospects/run-config'
import type { RunConfig, RunCounts } from '@/lib/prospects/ingest'
import { createSupabaseServiceRole } from '@/lib/supabase/service'

const RECENT_RUNS_LIMIT = 10
/**
 * Priority is computed (60% fit + 40% opportunity), which PostgREST cannot
 * order by, so the priority sort reads the filtered rows and sorts in code.
 * Above this many matching prospects the list fails closed rather than sort
 * a silently truncated set.
 */
const PRIORITY_SORT_MAX_ROWS = 5000
const FILTER_OPTIONS_SCAN_LIMIT = 2000
const EVIDENCE_LIMIT = 500

const prospectRowSchema = z.object({
  id: z.string(),
  canonical_name: z.string(),
  domain: z.string(),
  market: z.string().nullable(),
  industry: z.string().nullable(),
  fit_score: z.number().nullable(),
  opportunity_score: z.number().nullable(),
  confidence: z.enum(CONFIDENCE_LEVELS),
  review_status: z.enum(PROSPECT_REVIEW_STATUSES),
  last_researched_at: z.string(),
})

const prospectDetailRowSchema = prospectRowSchema.extend({
  factor_ratings: z.unknown(),
  rubric_version: z.string(),
  owner_note: z.string().nullable(),
  latest_run_id: z.string().nullable(),
  reviewed_at: z.string().nullable(),
  created_at: z.string(),
})

const evidenceRowSchema = z.object({
  id: z.number(),
  run_id: z.string(),
  factor_key: z.string(),
  kind: z.enum(EVIDENCE_KINDS),
  claim: z.string(),
  source_url: z.string(),
  observed_at: z.string(),
})

const runRowSchema = z.object({
  id: z.string(),
  state: z.enum(PROSPECT_RUN_STATES),
  config: z.unknown(),
  requested_by: z.string().nullable(),
  counts: z.unknown(),
  error_summary: z.string().nullable(),
  requested_at: z.string(),
  claimed_at: z.string().nullable(),
  finished_at: z.string().nullable(),
})

const countsSchema = z.object({
  saved: z.number().int().default(0),
  rejected: z.number().int().default(0),
})

export type ProspectListRow = {
  id: string
  name: string
  domain: string
  market: string | null
  industry: string | null
  fitScore: number | null
  opportunityScore: number | null
  confidence: ProspectConfidence
  reviewStatus: ProspectReviewStatus
  lastResearchedAt: string
}

export type FetchProspectsResult =
  | {
      ok: true
      rows: ProspectListRow[]
      total: number
      page: number
      pageCount: number
    }
  | { ok: false }

export type ProspectFilterOptions = {
  industries: string[]
  markets: string[]
}

export type ProspectRunRow = {
  id: string
  state: ProspectRunState
  config: RunConfig | null
  requestedBy: string | null
  counts: RunCounts
  errorSummary: string | null
  requestedAt: string
  claimedAt: string | null
  finishedAt: string | null
}

export type ProspectEvidenceRow = {
  id: number
  runId: string
  factorKey: string
  kind: EvidenceKind
  claim: string
  sourceUrl: string
  observedAt: string
}

export type ProspectDetail = ProspectListRow & {
  factorRatings: FactorRatings
  rubricVersion: string
  ownerNote: string | null
  latestRunId: string | null
  reviewedAt: string | null
  createdAt: string
}

export type FetchProspectDetailResult =
  | { ok: true; prospect: ProspectDetail; evidence: ProspectEvidenceRow[] }
  | { ok: false; reason: 'not_found' | 'error' }

function toListRow(row: z.infer<typeof prospectRowSchema>): ProspectListRow {
  return {
    id: row.id,
    name: row.canonical_name,
    domain: row.domain,
    market: row.market,
    industry: row.industry,
    fitScore: row.fit_score,
    opportunityScore: row.opportunity_score,
    confidence: row.confidence,
    reviewStatus: row.review_status,
    lastResearchedAt: row.last_researched_at,
  }
}

const LIST_COLUMNS =
  'id, canonical_name, domain, market, industry, fit_score, opportunity_score, confidence, review_status, last_researched_at'

export async function fetchProspects(
  params: ProspectsListParams,
): Promise<FetchProspectsResult> {
  try {
    const supabase = createSupabaseServiceRole()
    let query = supabase
      .from('prospects')
      .select(LIST_COLUMNS, { count: 'exact' })

    if (params.review !== 'all') {
      query = query.eq('review_status', params.review)
    }
    if (params.industry !== null) {
      query = query.eq('industry', params.industry)
    }
    if (params.market !== null) {
      query = query.eq('market', params.market)
    }

    if (params.sort === 'opportunity') {
      query = query.order('opportunity_score', { ascending: false, nullsFirst: false })
    } else if (params.sort === 'researched') {
      query = query.order('last_researched_at', { ascending: false })
    } else if (params.sort === 'fit') {
      query = query.order('fit_score', { ascending: false, nullsFirst: false })
    }
    query = query.order('canonical_name', { ascending: true })

    const from = (params.page - 1) * PROSPECTS_PAGE_SIZE
    const { data, error, count } =
      params.sort === 'priority'
        ? await query.range(0, PRIORITY_SORT_MAX_ROWS - 1)
        : await query.range(from, from + PROSPECTS_PAGE_SIZE - 1)

    if (error) {
      console.error('Prospect list query failed')
      return { ok: false }
    }

    const parsed = z.array(prospectRowSchema).safeParse(data ?? [])
    if (!parsed.success) {
      console.error('Prospect list parse failed')
      return { ok: false }
    }

    const total = count ?? 0
    let rows = parsed.data.map(toListRow)
    if (params.sort === 'priority') {
      if (total > PRIORITY_SORT_MAX_ROWS) {
        console.error('Prospect priority sort exceeds row limit')
        return { ok: false }
      }
      rows = [...rows].sort(comparePriority).slice(from, from + PROSPECTS_PAGE_SIZE)
    }

    return {
      ok: true,
      rows,
      total,
      page: params.page,
      pageCount: Math.max(1, Math.ceil(total / PROSPECTS_PAGE_SIZE)),
    }
  } catch {
    console.error('Prospect list query failed')
    return { ok: false }
  }
}

function distinctSorted(values: (string | null)[]): string[] {
  const set = new Set<string>()
  for (const value of values) {
    if (value !== null && value.trim().length > 0) {
      set.add(value)
    }
  }
  return [...set].sort((a, b) => a.localeCompare(b))
}

export async function fetchProspectFilterOptions(): Promise<ProspectFilterOptions> {
  try {
    const supabase = createSupabaseServiceRole()
    const { data, error } = await supabase
      .from('prospects')
      .select('industry, market')
      .limit(FILTER_OPTIONS_SCAN_LIMIT)

    if (error) {
      return { industries: [], markets: [] }
    }
    const parsed = z
      .array(z.object({ industry: z.string().nullable(), market: z.string().nullable() }))
      .safeParse(data ?? [])
    if (!parsed.success) {
      return { industries: [], markets: [] }
    }
    return {
      industries: distinctSorted(parsed.data.map((row) => row.industry)),
      markets: distinctSorted(parsed.data.map((row) => row.market)),
    }
  } catch {
    return { industries: [], markets: [] }
  }
}

export type FetchRecentRunsResult =
  | { ok: true; runs: ProspectRunRow[] }
  | { ok: false }

export async function fetchRecentProspectRuns(): Promise<FetchRecentRunsResult> {
  try {
    const supabase = createSupabaseServiceRole()
    const { data, error } = await supabase
      .from('prospect_runs')
      .select(
        'id, state, config, requested_by, counts, error_summary, requested_at, claimed_at, finished_at',
      )
      .order('requested_at', { ascending: false })
      .limit(RECENT_RUNS_LIMIT)

    if (error) {
      console.error('Prospect runs query failed')
      return { ok: false }
    }

    const parsed = z.array(runRowSchema).safeParse(data ?? [])
    if (!parsed.success) {
      console.error('Prospect runs parse failed')
      return { ok: false }
    }

    return {
      ok: true,
      runs: parsed.data.map((row) => {
        const counts = countsSchema.safeParse(row.counts)
        return {
          id: row.id,
          state: row.state,
          config: readRunConfig(row.config),
          requestedBy: row.requested_by,
          counts: counts.success ? counts.data : { saved: 0, rejected: 0 },
          errorSummary: row.error_summary,
          requestedAt: row.requested_at,
          claimedAt: row.claimed_at,
          finishedAt: row.finished_at,
        }
      }),
    }
  } catch {
    console.error('Prospect runs query failed')
    return { ok: false }
  }
}

export async function fetchProspectDetail(
  id: string,
): Promise<FetchProspectDetailResult> {
  try {
    const supabase = createSupabaseServiceRole()
    const { data, error } = await supabase
      .from('prospects')
      .select(
        `${LIST_COLUMNS}, factor_ratings, rubric_version, owner_note, latest_run_id, reviewed_at, created_at`,
      )
      .eq('id', id)
      .maybeSingle()

    if (error) {
      console.error('Prospect detail query failed')
      return { ok: false, reason: 'error' }
    }
    if (data === null) {
      return { ok: false, reason: 'not_found' }
    }

    const row = prospectDetailRowSchema.safeParse(data)
    if (!row.success) {
      console.error('Prospect detail parse failed')
      return { ok: false, reason: 'error' }
    }

    const { data: evidenceData, error: evidenceError } = await supabase
      .from('prospect_evidence')
      .select('id, run_id, factor_key, kind, claim, source_url, observed_at')
      .eq('prospect_id', id)
      .order('observed_at', { ascending: false })
      .limit(EVIDENCE_LIMIT)

    if (evidenceError) {
      console.error('Prospect evidence query failed')
      return { ok: false, reason: 'error' }
    }

    const evidence = z.array(evidenceRowSchema).safeParse(evidenceData ?? [])
    if (!evidence.success) {
      console.error('Prospect evidence parse failed')
      return { ok: false, reason: 'error' }
    }

    return {
      ok: true,
      prospect: {
        ...toListRow(row.data),
        factorRatings: readFactorRatings(row.data.factor_ratings),
        rubricVersion: row.data.rubric_version,
        ownerNote: row.data.owner_note,
        latestRunId: row.data.latest_run_id,
        reviewedAt: row.data.reviewed_at,
        createdAt: row.data.created_at,
      },
      evidence: evidence.data.map((item) => ({
        id: item.id,
        runId: item.run_id,
        factorKey: item.factor_key,
        kind: item.kind,
        claim: item.claim,
        sourceUrl: item.source_url,
        observedAt: item.observed_at,
      })),
    }
  } catch {
    console.error('Prospect detail query failed')
    return { ok: false, reason: 'error' }
  }
}
