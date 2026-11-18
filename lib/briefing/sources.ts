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
 *   countNewBusinessesSince               lib/new-businesses/load.ts
 *   countUnreviewedNoWebsite              lib/new-businesses/website-store.ts
 *   loadOutreachBriefingCounts            lib/outreach/briefing-load.ts
 * plus one select-only count below (countNewInquiriesBefore) and one
 * select-only read of new inquiries with a delivery issue
 * (fetchNewInquiryDeliveryIssues), which returns no personal fields.
 * No sync function, detector, report generator or sender is called.
 *
 * Each section is loaded independently and reports its own failure, so one
 * broken source marks that section unavailable instead of failing the day.
 */

import {
  DELIVERY_ISSUE_STATUSES,
  NEW_PROSPECTS_LIMIT,
  type LoaderResult,
  type RawBriefingInputs,
  type RawDeliveryIssue,
} from '@/lib/briefing/context'
import { isNotifyStatus } from '@/lib/intel/lead-params'
import type { BriefingSources } from '@/lib/briefing/generate'
import { fetchDecisionFeed } from '@/lib/intel/decisions/feed'
import { fetchLeadDashboardStats, fetchLeads } from '@/lib/intel/leads'
import { fetchSyncHealth, isSyncRunStale } from '@/lib/intel/sync-health'
import { countNewBusinessesSince } from '@/lib/new-businesses/load'
import { countUnreviewedNoWebsite } from '@/lib/new-businesses/website-store'
import { loadOutreachBriefingCounts } from '@/lib/outreach/briefing-load'
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

/** Plenty for any realistic backlog; the briefing lists recent ones and counts the rest. */
const DELIVERY_ISSUES_LIMIT = 500

/**
 * New inquiries whose notification was not delivered, any age, newest first:
 * the same population as the inquiries the briefing reports on (status new).
 * Select-only. Reads id, company, created_at and notify_status only: no
 * name, email, phone or message. The briefing splits them by its window.
 */
async function fetchNewInquiryDeliveryIssues(): Promise<RawDeliveryIssue[] | null> {
  const { data, error } = await createSupabaseServiceRole()
    .from('contact_submissions')
    .select('id, company, created_at, notify_status')
    .eq('status', 'new')
    .in('notify_status', [...DELIVERY_ISSUE_STATUSES])
    .order('created_at', { ascending: false })
    .limit(DELIVERY_ISSUES_LIMIT)
  if (error || !Array.isArray(data)) return null
  const rows: RawDeliveryIssue[] = []
  for (const row of data as unknown[]) {
    if (typeof row !== 'object' || row === null) continue
    const id = Reflect.get(row, 'id')
    const company = Reflect.get(row, 'company')
    const createdAt = Reflect.get(row, 'created_at')
    const status = Reflect.get(row, 'notify_status')
    if (typeof id !== 'string' || typeof createdAt !== 'string' || !isNotifyStatus(status)) continue
    rows.push({ id, company: typeof company === 'string' && company.trim().length > 0 ? company : null, created_at: createdAt, notify_status: status })
  }
  return rows
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
    const [newProspects, topUnreviewed, inquiries, inquiryStats, findings, runs, sources, newBusinesses, newBusinessesNoWebsite, outreach, deliveryIssues] =
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
        attempt(() => countNewBusinessesSince(windows.prospectsSince)),
        attempt(() => countUnreviewedNoWebsite()),
        attempt(() => loadOutreachBriefingCounts(new Date())),
        attempt(() => fetchNewInquiryDeliveryIssues()),
      ])

    const inputs: RawBriefingInputs = {
      newProspects,
      topUnreviewed,
      inquiries,
      inquiryStats,
      deliveryIssues,
      findings,
      runs,
      sources,
      newBusinesses,
      newBusinessesNoWebsite,
      outreach,
    }
    return inputs
  },
}
