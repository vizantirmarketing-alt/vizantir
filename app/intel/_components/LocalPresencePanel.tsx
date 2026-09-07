import { Panel } from '@/app/intel/_components/ui/Panel'
import { PanelQueryError } from '@/app/intel/_components/ui/PanelRetry'
import type { LocalPresencePlace } from '@/lib/intel/local-presence'
import { cn } from '@/lib/utils'

type LocalPresencePanelProps =
  | { failed: true }
  | { failed?: false; places: LocalPresencePlace[] }

export function LocalPresencePanel(props: LocalPresencePanelProps) {
  return (
    <Panel title="Local presence">
      {props.failed ? (
        <PanelQueryError message="Unable to load local presence. Data could not be loaded." />
      ) : (
        <>
          <p className="mb-3 text-[0.7rem] leading-4 text-meta">
            Google Business Profile reviews vs local competitors.
          </p>
          {props.places.length === 0 ? (
            <p className="text-sm text-body">
              No snapshots yet. Data appears after the first daily sync.
            </p>
          ) : (
            <ul className="divide-y divide-black/8">
              {props.places.map((place) => (
                <li key={place.id}>
                  {place.isSelf && !place.found ? (
                    <SelfMissing />
                  ) : (
                    <PlaceRow place={place} />
                  )}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </Panel>
  )
}

function SelfMissing() {
  return (
    <article className="flex flex-col gap-0.5 py-2.5">
      <p className="text-sm font-medium text-warning">
        Not visible in Places search
      </p>
      <p className="text-sm leading-relaxed text-body">
        The profile exists but does not surface in Google&apos;s Places search.
        Improving prominence — reviews, posts, categories — is the fix.
      </p>
    </article>
  )
}

function PlaceRow({ place }: { place: LocalPresencePlace }) {
  const metrics = metricsLabel(place)
  const delta = formatDelta(place.reviewDelta)

  return (
    <article className="flex h-12 items-center justify-between gap-4">
      <div className="min-w-0">
        <p
          className={cn(
            'truncate text-sm text-foreground',
            place.isSelf && 'font-medium',
          )}
        >
          {place.displayName}
        </p>
        {metrics !== null ? (
          <p className="truncate text-[0.7rem] leading-4 text-meta">{metrics}</p>
        ) : null}
      </div>
      {delta !== null ? (
        <p className={cn('shrink-0 text-sm tabular-nums', deltaClass(place.reviewDelta))}>
          {delta}
        </p>
      ) : null}
    </article>
  )
}

function metricsLabel(place: LocalPresencePlace): string | null {
  if (!place.found) {
    return 'Not found'
  }

  const parts: string[] = []
  if (place.rating !== null) {
    parts.push(place.rating.toFixed(1))
  }
  if (place.reviewCount !== null) {
    parts.push(reviewCountLabel(place.reviewCount))
  }
  return parts.length > 0 ? parts.join(' · ') : null
}

function reviewCountLabel(count: number): string {
  const formatted = formatCount(count)
  return count === 1 ? `${formatted} review` : `${formatted} reviews`
}

function deltaClass(delta: number | null): string {
  if (delta === null || delta === 0) {
    return 'text-meta'
  }
  if (delta > 0) {
    return 'text-positive'
  }
  return 'text-warning'
}

function formatDelta(delta: number | null): string | null {
  if (delta === null || delta === 0) {
    return null
  }
  if (delta > 0) {
    return `+${formatCount(delta)}`
  }
  return `−${formatCount(Math.abs(delta))}`
}

function formatCount(value: number): string {
  return new Intl.NumberFormat('en-US').format(value)
}
