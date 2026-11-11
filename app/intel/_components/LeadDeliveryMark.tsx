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
      <span className="inline-flex items-center whitespace-nowrap rounded-full bg-black/[0.03] px-2.5 py-0.5 intel-label text-meta">
        Sent
      </span>
    )
  }

  if (status === 'failed') {
    return (
      <span className="inline-flex items-center whitespace-nowrap rounded-full bg-warning-severe-soft px-2.5 py-0.5 intel-label font-medium text-warning-severe">
        Delivery failed
      </span>
    )
  }

  return (
    <span className="inline-flex items-center whitespace-nowrap rounded-full bg-warning-soft px-2.5 py-0.5 intel-label font-medium text-warning">
      Not configured
    </span>
  )
}
