import { cn } from '@/lib/utils'
import {
  isClosedLeadStatus,
  LEAD_STATUS_LABELS,
  type LeadStatus,
} from '@/lib/intel/lead-params'

type LeadStatusBadgeProps = {
  status: LeadStatus
}

export function LeadStatusBadge({ status }: LeadStatusBadgeProps) {
  const closed = isClosedLeadStatus(status)
  const won = status === 'won'

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs tracking-wide',
        closed
          ? won
            ? 'bg-black/[0.04] text-foreground'
            : 'text-meta'
          : 'bg-cobalt-muted-subtle text-foreground',
      )}
    >
      {LEAD_STATUS_LABELS[status]}
    </span>
  )
}
