import 'server-only'

import { createSupabaseServiceRole } from '@/lib/supabase/service'

export const SYNC_PROVIDERS = ['gsc', 'ga4', 'clarity', 'decisions'] as const

export type SyncProvider = (typeof SYNC_PROVIDERS)[number]

export type SyncRunStatus = 'success' | 'partial' | 'failed'

export const SYNC_PROVIDER_LABELS: Record<SyncProvider, string> = {
  gsc: 'GSC',
  ga4: 'GA4',
  clarity: 'Clarity',
  decisions: 'Decisions',
}

export const SYNC_STALE_AFTER_MS = 48 * 60 * 60 * 1000

const STREAK_LOOKBACK = 30

const RUN_COLUMNS =
  'provider, status, administrator_message, started_at'

export type SyncProviderHealth =
  | {
      provider: SyncProvider
      label: string
      lastRun: null
    }
  | {
      provider: SyncProvider
      label: string
      lastRun: {
        status: SyncRunStatus
        startedAt: string
        administratorMessage: string | null
        consecutiveUnhealthy: number
      }
    }

export type FetchSyncHealthResult =
  | { ok: false }
  | { ok: true; providers: SyncProviderHealth[]; nowMs: number }

type ParsedRun = {
  status: SyncRunStatus
  startedAt: string
  administratorMessage: string | null
}

/**
 * Latest completed run per provider, plus a consecutive partial/failed streak.
 * A provider with no runs is returned as lastRun: null — not as a failed run.
 */
export async function fetchSyncHealth(): Promise<FetchSyncHealthResult> {
  const nowMs = Date.now()

  try {
    const supabase = createSupabaseServiceRole()
    const results = await Promise.all(
      SYNC_PROVIDERS.map((provider) =>
        supabase
          .from('sync_runs')
          .select(RUN_COLUMNS)
          .eq('provider', provider)
          .in('status', ['success', 'partial', 'failed'])
          .order('started_at', { ascending: false })
          .limit(STREAK_LOOKBACK),
      ),
    )

    const providers: SyncProviderHealth[] = []

    for (let i = 0; i < SYNC_PROVIDERS.length; i += 1) {
      const provider = SYNC_PROVIDERS[i]
      const result = results[i]
      if (provider === undefined || result === undefined) {
        console.error('Intel sync health query failed')
        return { ok: false }
      }
      if (result.error || !Array.isArray(result.data)) {
        console.error('Intel sync health query failed')
        return { ok: false }
      }

      const runs: ParsedRun[] = []
      for (const row of result.data) {
        const parsed = toParsedRun(row)
        if (parsed) {
          runs.push(parsed)
        }
      }

      const latest = runs[0]
      if (latest === undefined) {
        providers.push({
          provider,
          label: SYNC_PROVIDER_LABELS[provider],
          lastRun: null,
        })
        continue
      }

      providers.push({
        provider,
        label: SYNC_PROVIDER_LABELS[provider],
        lastRun: {
          status: latest.status,
          startedAt: latest.startedAt,
          administratorMessage: latest.administratorMessage,
          consecutiveUnhealthy: consecutiveUnhealthyStreak(runs),
        },
      })
    }

    return { ok: true, providers, nowMs }
  } catch {
    console.error('Intel sync health query failed')
    return { ok: false }
  }
}

export function isSyncRunStale(startedAt: string, nowMs: number): boolean {
  const then = Date.parse(startedAt)
  if (Number.isNaN(then)) {
    return false
  }
  return nowMs - then > SYNC_STALE_AFTER_MS
}

function consecutiveUnhealthyStreak(runs: readonly ParsedRun[]): number {
  let count = 0
  for (const run of runs) {
    if (run.status === 'success') {
      break
    }
    count += 1
  }
  return count
}

function toParsedRun(value: unknown): ParsedRun | null {
  if (typeof value !== 'object' || value === null) {
    return null
  }

  const statusRaw = readField(value, 'status')
  const startedAt = asIsoTimestamp(readField(value, 'started_at'))
  if (typeof statusRaw !== 'string' || !isSyncRunStatus(statusRaw)) {
    return null
  }
  if (startedAt === null) {
    return null
  }

  return {
    status: statusRaw,
    startedAt,
    administratorMessage: asMessage(readField(value, 'administrator_message')),
  }
}

function isSyncRunStatus(value: string): value is SyncRunStatus {
  return value === 'success' || value === 'partial' || value === 'failed'
}

function asMessage(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null
  }
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function asIsoTimestamp(value: unknown): string | null {
  if (typeof value !== 'string' || Number.isNaN(Date.parse(value))) {
    return null
  }
  return value
}

function readField(value: object, key: string): unknown {
  return Reflect.get(value, key)
}
