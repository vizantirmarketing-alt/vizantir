import type { NotifyStatus } from '@/lib/intel/lead-params'

type LeadDeliveryMarkProps = {
  status: NotifyStatus | null
}

export function LeadDeliveryMark({ status }: LeadDeliveryMarkProps) {
  if (status === null) {
    return null
  }

  if (status === 'sent') {
    return (
      <span className="inline-flex items-center rounded-full bg-black/[0.03] px-2 py-0.5 text-[0.65rem] text-meta/70">
        Sent
      </span>
    )
  }

  if (status === 'failed') {
    return (
      <span className="inline-flex items-center rounded-full bg-warning-severe-soft px-2 py-0.5 text-[0.65rem] font-medium text-warning-severe">
        Delivery failed
      </span>
    )
  }

  return (
    <span className="inline-flex items-center rounded-full bg-warning-soft px-2 py-0.5 text-[0.65rem] font-medium text-warning">
      Not configured
    </span>
  )
}
