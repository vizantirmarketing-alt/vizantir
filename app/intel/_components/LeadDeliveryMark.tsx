import type { NotifyStatus } from '@/lib/intel/lead-params'

type LeadDeliveryMarkProps = {
  status: NotifyStatus | null
}

export function LeadDeliveryMark({ status }: LeadDeliveryMarkProps) {
  if (status === null) {
    return null
  }

  if (status === 'sent') {
    return <span className="text-xs text-meta/70">Sent</span>
  }

  if (status === 'failed') {
    return (
      <span className="text-xs font-medium text-warning-severe">
        Delivery failed
      </span>
    )
  }

  return (
    <span className="text-xs font-medium text-warning">Not configured</span>
  )
}
