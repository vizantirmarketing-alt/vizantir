import { Panel } from '@/app/intel/_components/ui/Panel'
import { PanelQueryError } from '@/app/intel/_components/ui/PanelRetry'
import { formatActivityRelative } from '@/lib/intel/activity'
import {
  isSyncRunStale,
  type SyncProviderHealth,
  type SyncRunStatus,
} from '@/lib/intel/sync-health'
import { cn } from '@/lib/utils'

type SyncHealthPanelProps =
  | { failed: true }
  | { failed?: false; providers: SyncProviderHealth[]; nowMs: number }

export function SyncHealthPanel(props: SyncHealthPanelProps) {
  if (props.failed) {
    return (
      <Panel title="Sync health">
        <PanelQueryError message="Unable to load sync health. Data could not be loaded." />
      </Panel>
    )
  }

  const { providers, nowMs } = props
  const empty = providers.every((provider) => provider.lastRun === null)
  if (empty) {
    return (
      <Panel title="Sync health">
        <p className="text-sm font-medium text-foreground">No syncs have run yet</p>
        <p className="mt-2 text-sm leading-relaxed text-body">
          Scheduled jobs write a row here after they finish. Health will appear
          once the first run completes.
        </p>
      </Panel>
    )
  }

  const attention = providers.filter((provider) =>
    needsAttention(provider, nowMs),
  )
  const healthy = providers.filter(
    (provider) => !needsAttention(provider, nowMs),
  )

  if (attention.length === 0) {
    const latestAt = latestStartedAt(healthy)
    return (
      <Panel title="Sync health">
        <p className="text-sm text-body">
          All syncs are healthy
          {latestAt ? ` · last run ${formatActivityRelative(latestAt, nowMs)}` : ''}
        </p>
      </Panel>
    )
  }

  const hasFailed = attention.some(
    (provider) => provider.lastRun?.status === 'failed',
  )

  return (
    <Panel title="Sync health" accent={hasFailed ? 'warning-severe' : undefined}>
      {healthy.length > 0 ? (
        <p className="text-sm text-body">
          {healthySummary(healthy, nowMs)}
        </p>
      ) : null}
      <ul
        className={cn(
          'divide-y divide-black/8',
          healthy.length > 0 && 'mt-2 border-t border-black/8',
        )}
      >
        {attention.map((provider) => (
          <li key={provider.provider}>
            <AttentionRow provider={provider} nowMs={nowMs} />
          </li>
        ))}
      </ul>
    </Panel>
  )
}

function AttentionRow({
  provider,
  nowMs,
}: {
  provider: SyncProviderHealth
  nowMs: number
}) {
  if (provider.lastRun === null) {
    return (
      <article className="flex flex-col gap-0.5 py-2.5">
        <p className="text-sm font-medium text-warning">{provider.label}</p>
        <p className="text-sm text-warning">No runs recorded</p>
      </article>
    )
  }

  const { lastRun } = provider
  const stale = isSyncRunStale(lastRun.startedAt, nowMs)
  const failed = lastRun.status === 'failed'
  const partial = lastRun.status === 'partial'
  const tone = failed ? 'text-warning-severe' : 'text-warning'
  const happened = happenedLabel(lastRun.status, stale)

  return (
    <article className="flex flex-col gap-0.5 py-2.5">
      <div className="flex items-baseline justify-between gap-3">
        <p className={cn('min-w-0 text-sm font-medium', tone)}>
          {provider.label}
        </p>
        <time
          dateTime={lastRun.startedAt}
          className="shrink-0 text-[0.7rem] tabular-nums text-meta"
        >
          {formatActivityRelative(lastRun.startedAt, nowMs)}
        </time>
      </div>
      <p className={cn('text-sm', tone)}>{happened}</p>
      {lastRun.consecutiveUnhealthy > 1 ? (
        <p className={cn('text-[0.7rem] leading-4', tone)}>
          {streakLabel(lastRun.status, lastRun.consecutiveUnhealthy)}
        </p>
      ) : null}
      {lastRun.administratorMessage && (failed || partial) ? (
        <p className="text-sm leading-relaxed break-words text-body">
          {lastRun.administratorMessage}
        </p>
      ) : null}
    </article>
  )
}

function needsAttention(
  provider: SyncProviderHealth,
  nowMs: number,
): boolean {
  if (provider.lastRun === null) {
    return true
  }
  if (provider.lastRun.status !== 'success') {
    return true
  }
  return isSyncRunStale(provider.lastRun.startedAt, nowMs)
}

function happenedLabel(status: SyncRunStatus, stale: boolean): string {
  if (status === 'failed') {
    return 'Failed'
  }
  if (status === 'partial') {
    return 'Partial'
  }
  if (stale) {
    return 'Stale — last run succeeded'
  }
  return 'Succeeded'
}

function streakLabel(status: SyncRunStatus, count: number): string {
  if (status === 'partial') {
    return `partial ${count} runs in a row`
  }
  return `failed ${count} runs in a row`
}

function healthySummary(
  providers: readonly SyncProviderHealth[],
  nowMs: number,
): string {
  const labels = providers.map((provider) => provider.label)
  const latestAt = latestStartedAt(providers)
  const when = latestAt
    ? ` · last run ${formatActivityRelative(latestAt, nowMs)}`
    : ''

  if (labels.length === 1) {
    return `${labels[0]} is healthy${when}`
  }
  return `${joinLabels(labels)} are healthy${when}`
}

function latestStartedAt(
  providers: readonly SyncProviderHealth[],
): string | null {
  let latest: string | null = null
  for (const provider of providers) {
    const startedAt = provider.lastRun?.startedAt
    if (startedAt === undefined) {
      continue
    }
    if (latest === null || startedAt > latest) {
      latest = startedAt
    }
  }
  return latest
}

function joinLabels(labels: readonly string[]): string {
  if (labels.length === 0) {
    return ''
  }
  if (labels.length === 1) {
    return labels[0] ?? ''
  }
  if (labels.length === 2) {
    return `${labels[0]} and ${labels[1]}`
  }
  const rest = labels.slice(0, -1).join(', ')
  return `${rest}, and ${labels[labels.length - 1]}`
}
