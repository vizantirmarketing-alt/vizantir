import {
  DECISION_CONFIDENCE_LABELS,
  DECISION_STATUS_LABELS,
  type DecisionConfidence,
  type DecisionStatus,
} from '@/lib/intel/decision-params'
import {
  LEAD_STATUS_LABELS,
  type LeadStatus,
} from '@/lib/intel/lead-params'
import { cn } from '@/lib/utils'

type StatusTone = 'new' | 'active' | 'success' | 'muted'

const TONE_CLASS: Record<StatusTone, string> = {
  new: 'bg-cobalt-soft font-medium text-foreground',
  active: 'bg-black/[0.08] font-medium text-foreground',
  success: 'bg-positive-soft font-medium text-positive',
  muted: 'bg-black/[0.05] font-medium text-meta',
}

const DOT_CLASS: Record<StatusTone, string> = {
  new: 'bg-cobalt-primary',
  active: 'bg-meta',
  success: 'bg-positive',
  muted: 'bg-meta/40',
}

function StatusChip({ tone, label }: { tone: StatusTone; label: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-[0.65rem] tracking-wide',
        TONE_CLASS[tone],
      )}
    >
      <span
        className={cn('size-1.5 shrink-0 rounded-full', DOT_CLASS[tone])}
        aria-hidden
      />
      {label}
    </span>
  )
}

function decisionTone(status: DecisionStatus): StatusTone {
  if (status === 'new') {
    return 'new'
  }
  if (status === 'completed') {
    return 'success'
  }
  if (status === 'dismissed') {
    return 'muted'
  }
  return 'active'
}

function leadTone(status: LeadStatus): StatusTone {
  if (status === 'new') {
    return 'new'
  }
  if (status === 'won') {
    return 'success'
  }
  if (
    status === 'lost' ||
    status === 'not_qualified' ||
    status === 'spam'
  ) {
    return 'muted'
  }
  return 'active'
}

export function DecisionStatusChip({ status }: { status: DecisionStatus }) {
  return (
    <StatusChip tone={decisionTone(status)} label={DECISION_STATUS_LABELS[status]} />
  )
}

export function LeadStatusChip({ status }: { status: LeadStatus }) {
  return <StatusChip tone={leadTone(status)} label={LEAD_STATUS_LABELS[status]} />
}

export function ConfidenceChip({
  confidence,
}: {
  confidence: DecisionConfidence
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-[0.65rem] tracking-wide',
        confidence === 'high' &&
          'border border-cobalt-primary text-cobalt-primary',
        confidence === 'medium' && 'border border-black/15 text-meta',
        confidence === 'exploratory' &&
          'border border-dashed border-black/20 text-meta',
      )}
    >
      {DECISION_CONFIDENCE_LABELS[confidence]}
    </span>
  )
}
