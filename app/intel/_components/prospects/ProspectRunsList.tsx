import { ProspectRunCancelButton } from '@/app/intel/_components/prospects/ProspectRunCancelButton'
import { ProspectRunStateChip } from '@/app/intel/_components/ui/StatusChip'
import { splitRunSummary } from '@/lib/prospects/ingest'
import type { ProspectRunRow } from '@/lib/prospects/load'
import {
  CANCELLABLE_RUN_STATES,
  formatSavedOfRequested,
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
      <p className="intel-body leading-relaxed text-body">
        No research runs yet. Request one above.
      </p>
    )
  }

  return (
    <ul className="divide-y divide-black/8">
      {runs.map((run) => {
        const summary = splitRunSummary(run.errorSummary)
        return (
        <li key={run.id} className="py-3 first:pt-0 last:pb-0">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="intel-body font-medium text-foreground">{runTitle(run)}</p>
            <div className="flex items-center gap-3">
              <ProspectRunStateChip state={run.state} />
              {CANCELLABLE_RUN_STATES.includes(run.state) ? (
                <ProspectRunCancelButton runId={run.id} />
              ) : null}
            </div>
          </div>
          <p className="mt-1 intel-secondary text-meta">
            {runTiming(run)} ·{' '}
            {formatSavedOfRequested(run.counts.saved, run.config?.targetCount ?? null)} saved
            {run.counts.rejected > 0 ? `, ${run.counts.rejected} rejected` : ''}
            {run.requestedBy !== null ? ` · ${run.requestedBy}` : ''}
          </p>
          {run.config !== null && run.config.exclusions.length > 0 ? (
            <p className="mt-1 intel-secondary text-meta">
              Excluding {run.config.exclusions.length} domain
              {run.config.exclusions.length === 1 ? '' : 's'}
            </p>
          ) : null}
          {summary.errors.length > 0 ? (
            <ul className="mt-2 space-y-1 intel-body text-warning-severe" aria-label="Errors">
              {summary.errors.map((line) => (
                <li key={line} className="whitespace-pre-wrap">
                  {line}
                </li>
              ))}
            </ul>
          ) : null}
          {summary.notes.length > 0 ? (
            <ul className="mt-2 space-y-1 intel-secondary text-meta" aria-label="Notes">
              {summary.notes.map((line) => (
                <li key={line} className="whitespace-pre-wrap">
                  {line}
                </li>
              ))}
            </ul>
          ) : null}
        </li>
        )
      })}
    </ul>
  )
}
