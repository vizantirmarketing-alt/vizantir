import { Panel } from '@/app/intel/_components/ui/Panel'
import { PanelQueryError } from '@/app/intel/_components/ui/PanelRetry'
import { formatActivityRelative } from '@/lib/intel/activity'
import type { CrawlerPlatformRow } from '@/lib/intel/crawlers'
import { cn } from '@/lib/utils'

type AiPlatformsPanelProps =
  | { failed: true }
  | { failed?: false; rows: CrawlerPlatformRow[]; nowMs: number }

export function AiPlatformsPanel(props: AiPlatformsPanelProps) {
  return (
    <Panel title="AI platforms">
      {props.failed ? (
        <PanelQueryError message="Unable to load AI platform data. Data could not be loaded." />
      ) : (
        <>
          <p className="mb-3 text-[0.7rem] leading-4 text-meta">
            Crawler visits to robots.txt in the last 30 days. A proxy for AI
            platform awareness of the site.
          </p>
          <ul className="divide-y divide-black/8">
            {props.rows.map((row) => (
              <li key={row.id}>
                <PlatformRow row={row} nowMs={props.nowMs} />
              </li>
            ))}
          </ul>
        </>
      )}
    </Panel>
  )
}

function PlatformRow({
  row,
  nowMs,
}: {
  row: CrawlerPlatformRow
  nowMs: number
}) {
  const unseen = row.hits30d === 0
  const lastSeen =
    !unseen && row.lastSeenAt !== null
      ? `last seen ${formatActivityRelative(row.lastSeenAt, nowMs)}`
      : 'Not yet seen'

  return (
    <article className="flex h-12 items-center justify-between gap-4">
      <div className="min-w-0">
        <p
          className={cn(
            'truncate text-sm',
            unseen ? 'text-meta' : 'text-foreground',
          )}
        >
          {row.label}
        </p>
        <p className="truncate text-[0.7rem] leading-4 text-meta">{lastSeen}</p>
      </div>
      <p
        className={cn(
          'shrink-0 text-sm tabular-nums',
          unseen ? 'text-meta' : 'text-foreground',
        )}
      >
        {formatCount(row.hits30d)}
      </p>
    </article>
  )
}

function formatCount(value: number): string {
  return new Intl.NumberFormat('en-US').format(value)
}
