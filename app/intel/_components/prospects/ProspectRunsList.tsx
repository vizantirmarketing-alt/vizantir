import { ProspectRunCancelButton } from '@/app/intel/_components/prospects/ProspectRunCancelButton'
import { ProspectRunStateChip } from '@/app/intel/_components/ui/StatusChip'
import type { ProspectRunRow } from '@/lib/prospects/load'
import {
  CANCELLABLE_RUN_STATES,
  formatShortDate,
} from '@/lib/prospects/params'

function runTitle(run: ProspectRunRow): string {
  if (run.config === null) {
    return 'Unreadable run config'
  }
  return `${run.config.industry} · ${run.config.market} · ${run.config.targetCount} companies`
}

function runTiming(run: ProspectRunRow): string {
  const parts = [`Requested ${formatShortDate(run.requestedAt)}`]
  if (run.claimedAt !== null) {
    parts.push(`claimed ${formatShortDate(run.claimedAt)}`)
  }
  if (run.finishedAt !== null) {
    parts.push(`finished ${formatShortDate(run.finishedAt)}`)
  }
  return parts.join(', ')
}

export function ProspectRunsList({ runs }: { runs: ProspectRunRow[] }) {
  if (runs.length === 0) {
    return (
      <p className="text-sm leading-relaxed text-body">
        No research runs yet. Request one above.
      </p>
    )
  }

  return (
    <ul className="divide-y divide-black/8">
      {runs.map((run) => (
        <li key={run.id} className="py-3 first:pt-0 last:pb-0">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-medium text-foreground">{runTitle(run)}</p>
            <div className="flex items-center gap-3">
              <ProspectRunStateChip state={run.state} />
              {CANCELLABLE_RUN_STATES.includes(run.state) ? (
                <ProspectRunCancelButton runId={run.id} />
              ) : null}
            </div>
          </div>
          <p className="mt-1 text-sm text-meta">
            {runTiming(run)} · {run.counts.saved} saved, {run.counts.rejected}{' '}
            rejected
            {run.requestedBy !== null ? ` · ${run.requestedBy}` : ''}
          </p>
          {run.config !== null && run.config.exclusions.length > 0 ? (
            <p className="mt-1 text-sm text-meta">
              Excluding {run.config.exclusions.length} domain
              {run.config.exclusions.length === 1 ? '' : 's'}
            </p>
          ) : null}
          {run.errorSummary !== null ? (
            <p className="mt-2 whitespace-pre-wrap text-sm text-warning-severe">
              {run.errorSummary}
            </p>
          ) : null}
        </li>
      ))}
    </ul>
  )
}
