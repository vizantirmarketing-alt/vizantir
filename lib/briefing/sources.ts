import 'server-only'

/**
 * Production data sources for the daily briefing. Every function called here
 * is read-only (selects only; confirmed by reading each module for insert,
 * update, upsert, delete, rpc and fetch calls):
 *   fetchLeads, fetchLeadDashboardStats   lib/intel/leads.ts
 *   fetchDecisionFeed                     lib/intel/decisions/feed.ts
 *   fetchSyncHealth, isSyncRunStale       lib/intel/sync-health.ts
 *   fetchProspects, fetchRecentProspectRuns,
 *   fetchProspectsCreatedSince            lib/prospects/load.ts
 * plus one select-only count below (countNewInquiriesBefore).
 * No sync function, detector, report generator or sender is called.
 *
 * Each section is loaded independently and reports its own failure, so one
 * broken source marks that section unavailable instead of failing the day.
 */

import {
  NEW_PROSPECTS_LIMIT,
  type LoaderResult,
  type RawBriefingInputs,
} from '@/lib/briefing/context'
import type { BriefingSources } from '@/lib/briefing/generate'
import { fetchDecisionFeed } from '@/lib/intel/decisions/feed'
import { fetchLeadDashboardStats, fetchLeads } from '@/lib/intel/leads'
import { fetchSyncHealth, isSyncRunStale } from '@/lib/intel/sync-health'
import { splitRunSummary } from '@/lib/prospects/ingest'
import {
  fetchProspects,
  fetchProspectsCreatedSince,
  fetchRecentProspectRuns,
} from '@/lib/prospects/load'
import { createSupabaseServiceRole } from '@/lib/supabase/service'

/**
 * Count of inquiries still in status new that were created before the
 * cutoff. Select-only, head request: no rows, and no personal fields, come
 * back.
 */
async function countNewInquiriesBefore(cutoffIso: string): Promise<number | null> {
  const { count, error } = await createSupabaseServiceRole()
    .from('contact_submissions')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'new')
    .lt('created_at', cutoffIso)
  return error ? null : count ?? 0
}

async function attempt<T>(load: () => Promise<T | null>): Promise<LoaderResult<T>> {
  try {
    const value = await load()
    return value === null ? { ok: false } : { ok: true, value }
  } catch {
    return { ok: false }
  }
}

export const briefingSources: BriefingSources = {
  async load({ windows }) {
    const [newProspects, topUnreviewed, inquiries, inquiryStats, findings, runs, sources] =
      await Promise.all([
        attempt(() => fetchProspectsCreatedSince(windows.prospectsSince, NEW_PROSPECTS_LIMIT)),
        attempt(async () => {
          const result = await fetchProspects({
            review: 'unreviewed',
            industry: null,
            market: null,
            sort: 'priority',
            page: 1,
          })
          return result.ok ? result.rows : null
        }),
        attempt(async () => {
          const [result, olderCount] = await Promise.all([
            fetchLeads({ status: 'new', channel: 'all', q: '', sort: 'newest', page: 1 }),
            countNewInquiriesBefore(windows.inquiriesSince),
          ])
          return result.ok && olderCount !== null
            ? { rows: result.rows, total: result.total, olderCount }
            : null
        }),
        attempt(async () => {
          const stats = await fetchLeadDashboardStats()
          return { newCount: stats.newCount, deliveryIssues: stats.deliveryIssues }
        }),
        attempt(async () => {
          const feed = await fetchDecisionFeed()
          if (!feed.ok) return null
          const items = feed.sections.flatMap((section) => section.items)
          return {
            total: items.length,
            items: items.map((item) => ({
              findingKey: item.findingKey,
              title: item.title,
              category: item.category,
              confidence: item.confidence,
              status: item.status,
            })),
          }
        }),
        attempt(async () => {
          const result = await fetchRecentProspectRuns()
          if (!result.ok) return null
          return result.runs.map((run) => {
            const summary = splitRunSummary(run.errorSummary)
            return {
              id: run.id,
              state: run.state,
              market: run.config?.market ?? null,
              industry: run.config?.industry ?? null,
              saved: run.counts.saved,
              requested: run.config?.targetCount ?? null,
              errors: summary.errors,
              notes: summary.notes,
              requestedAt: run.requestedAt,
              finishedAt: run.finishedAt,
            }
          })
        }),
        attempt(async () => {
          const health = await fetchSyncHealth()
          if (!health.ok) return null
          return health.providers.map((provider) => ({
            provider: provider.provider,
            label: provider.label,
            lastRun:
              provider.lastRun === null
                ? null
                : {
                    status: provider.lastRun.status,
                    startedAt: provider.lastRun.startedAt,
                    administratorMessage: provider.lastRun.administratorMessage,
                  },
            stale:
              provider.lastRun !== null && isSyncRunStale(provider.lastRun.startedAt, health.nowMs),
          }))
        }),
      ])

    const inputs: RawBriefingInputs = {
      newProspects,
      topUnreviewed,
      inquiries,
      inquiryStats,
      findings,
      runs,
      sources,
    }
    return inputs
  },
}
