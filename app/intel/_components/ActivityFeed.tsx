import Link from 'next/link'
import {
  Eye,
  RefreshCw,
  ScanSearch,
  UserRound,
  type LucideIcon,
} from 'lucide-react'

import { Panel } from '@/app/intel/_components/ui/Panel'
import {
  formatActivityRelative,
  isActivityRecent,
  type ActivityCategory,
  type ActivityItem,
  type ActivityTone,
} from '@/lib/intel/activity'
import { cn } from '@/lib/utils'

const CATEGORY_ICON: Record<ActivityCategory, LucideIcon> = {
  lead: UserRound,
  finding: ScanSearch,
  sync: RefreshCw,
  visitors: Eye,
}

type ActivityFeedProps = {
  items: ActivityItem[]
  nowMs: number
}

export function ActivityFeed({ items, nowMs }: ActivityFeedProps) {
  return (
    <Panel title="Activity">
      {items.length === 0 ? (
        <p className="text-sm text-body">
          Activity will appear as things happen.
        </p>
      ) : (
        <ul className="divide-y divide-black/8">
          {items.map((item) => (
            <li key={item.id}>
              <ActivityRow item={item} nowMs={nowMs} />
            </li>
          ))}
        </ul>
      )}
    </Panel>
  )
}

function ActivityRow({
  item,
  nowMs,
}: {
  item: ActivityItem
  nowMs: number
}) {
  const recent = isActivityRecent(item.occurredAt, nowMs)
  const Icon = CATEGORY_ICON[item.category]

  return (
    <article className="flex h-10 items-center gap-2.5">
      <span
        className={cn(
          'flex size-6 shrink-0 items-center justify-center rounded-md',
          chipClass(item.category, item.tone),
        )}
        aria-hidden
      >
        <Icon className="size-3.5" />
      </span>
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            'truncate text-sm',
            recent ? 'text-foreground' : 'text-meta',
          )}
        >
          {item.title}
          {item.detail ? (
            <span className="text-meta">
              {' · '}
              {item.detail}
            </span>
          ) : null}
        </p>
      </div>
      <time
        dateTime={item.occurredAt}
        className={cn(
          'shrink-0 text-[0.7rem] tabular-nums',
          recent ? 'text-body' : 'text-meta',
        )}
      >
        {formatActivityRelative(item.occurredAt, nowMs)}
      </time>
      {item.href ? (
        <Link
          href={item.href}
          className="shrink-0 text-[0.7rem] text-cobalt-primary transition-colors hover:text-[#1E85FF]"
        >
          View
        </Link>
      ) : null}
    </article>
  )
}

function chipClass(category: ActivityCategory, tone: ActivityTone): string {
  if (tone === 'warning') {
    return 'bg-warning-soft text-warning'
  }
  if (category === 'lead' || category === 'finding') {
    return 'bg-cobalt-soft text-cobalt-primary'
  }
  return 'bg-black/[0.05] text-meta'
}
