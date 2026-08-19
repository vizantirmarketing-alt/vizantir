import { LeadStatusChip } from '@/app/intel/_components/ui/StatusChip'
import type { LeadStatus } from '@/lib/intel/lead-params'

type LeadStatusBadgeProps = {
  status: LeadStatus
}

export function LeadStatusBadge({ status }: LeadStatusBadgeProps) {
  return <LeadStatusChip status={status} />
}
