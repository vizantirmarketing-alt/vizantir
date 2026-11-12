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
import {
  PROSPECT_REVIEW_LABELS,
  PROSPECT_RUN_STATE_LABELS,
  type ProspectReviewStatus,
  type ProspectRunState,
} from '@/lib/prospects/params'
import {
  CONFIDENCE_LABELS,
  type ProspectConfidence,
} from '@/lib/prospects/rubric'
import { cn } from '@/lib/utils'

type StatusTone = 'new' | 'active' | 'success' | 'muted' | 'warning'

const TONE_CLASS: Record<StatusTone, string> = {
  new: 'bg-cobalt-soft font-medium text-foreground',
  active: 'bg-black/[0.08] font-medium text-foreground',
  success: 'bg-positive-soft font-medium text-positive',
  muted: 'bg-black/[0.05] font-medium text-meta',
  warning: 'bg-warning-severe-soft font-medium text-warning-severe',
}

const DOT_CLASS: Record<StatusTone, string> = {
  new: 'bg-cobalt-primary',
  active: 'bg-meta',
  success: 'bg-positive',
  muted: 'bg-meta/40',
  warning: 'bg-warning-severe',
}

function StatusChip({ tone, label }: { tone: StatusTone; label: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 intel-label',
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
        'inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 intel-label',
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

function prospectReviewTone(status: ProspectReviewStatus): StatusTone {
  if (status === 'unreviewed') {
    return 'new'
  }
  if (status === 'accepted') {
    return 'success'
  }
  return 'muted'
}

function prospectRunTone(state: ProspectRunState): StatusTone {
  if (state === 'requested') {
    return 'new'
  }
  if (state === 'completed') {
    return 'success'
  }
  if (state === 'cancelled') {
    return 'muted'
  }
  if (state === 'failed') {
    return 'warning'
  }
  return 'active'
}

export function ProspectReviewChip({ status }: { status: ProspectReviewStatus }) {
  return (
    <StatusChip
      tone={prospectReviewTone(status)}
      label={PROSPECT_REVIEW_LABELS[status]}
    />
  )
}

export function ProspectRunStateChip({ state }: { state: ProspectRunState }) {
  return (
    <StatusChip
      tone={prospectRunTone(state)}
      label={PROSPECT_RUN_STATE_LABELS[state]}
    />
  )
}

export function ProspectConfidenceChip({
  confidence,
}: {
  confidence: ProspectConfidence
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 intel-label',
        confidence === 'high' &&
          'border border-cobalt-primary text-cobalt-primary',
        confidence === 'medium' && 'border border-black/15 text-meta',
        confidence === 'low' && 'border border-dashed border-black/20 text-meta',
      )}
    >
      {CONFIDENCE_LABELS[confidence]} confidence
    </span>
  )
}

const IMPORT_STATE_TONE: Record<'importing' | 'imported' | 'failed', StatusTone> = {
  importing: 'active',
  imported: 'success',
  failed: 'warning',
}

const IMPORT_STATE_LABEL: Record<'importing' | 'imported' | 'failed', string> = {
  importing: 'Importing',
  imported: 'Imported',
  failed: 'Failed',
}

export function NewBusinessImportChip({ state }: { state: 'importing' | 'imported' | 'failed' }) {
  return <StatusChip tone={IMPORT_STATE_TONE[state]} label={IMPORT_STATE_LABEL[state]} />
}

const LEAD_TIER_TONE: Record<'likely' | 'possible' | 'low', StatusTone> = {
  likely: 'success',
  possible: 'active',
  low: 'muted',
}

const LEAD_TIER_LABEL: Record<'likely' | 'possible' | 'low', string> = {
  likely: 'Likely',
  possible: 'Possible',
  low: 'Low',
}

export function NewBusinessLeadChip({ tier }: { tier: 'likely' | 'possible' | 'low' }) {
  return <StatusChip tone={LEAD_TIER_TONE[tier]} label={LEAD_TIER_LABEL[tier]} />
}

type WebsiteChipStatus = 'no_website' | 'social_only' | 'placeholder' | 'free_builder' | 'has_website' | 'unclear'

// The statuses that make a business a stronger lead stand out in cobalt.
const WEBSITE_STATUS_TONE: Record<WebsiteChipStatus, StatusTone> = {
  no_website: 'new',
  social_only: 'new',
  placeholder: 'new',
  free_builder: 'active',
  has_website: 'muted',
  unclear: 'muted',
}

const WEBSITE_STATUS_LABEL: Record<WebsiteChipStatus, string> = {
  no_website: 'No website',
  social_only: 'Listing or social page only',
  placeholder: 'Placeholder',
  free_builder: 'Free builder page',
  has_website: 'Has website',
  unclear: 'Unclear',
}

export function WebsiteStatusChip({ status }: { status: WebsiteChipStatus }) {
  return <StatusChip tone={WEBSITE_STATUS_TONE[status]} label={WEBSITE_STATUS_LABEL[status]} />
}

type CheckRunChipState = 'requested' | 'claimed' | 'completed' | 'failed' | 'cancelled'

const CHECK_RUN_TONE: Record<CheckRunChipState, StatusTone> = {
  requested: 'new',
  claimed: 'active',
  completed: 'success',
  failed: 'warning',
  cancelled: 'muted',
}

const CHECK_RUN_LABEL: Record<CheckRunChipState, string> = {
  requested: 'Waiting',
  claimed: 'In progress',
  completed: 'Completed',
  failed: 'Failed',
  cancelled: 'Cancelled',
}

export function WebsiteCheckRunChip({ state }: { state: CheckRunChipState }) {
  return <StatusChip tone={CHECK_RUN_TONE[state]} label={CHECK_RUN_LABEL[state]} />
}

type OutreachChipStatus = 'draft' | 'approved' | 'sending' | 'send_unconfirmed' | 'sent' | 'discarded'

const OUTREACH_TONE: Record<OutreachChipStatus, StatusTone> = {
  draft: 'new',
  approved: 'active',
  sending: 'active',
  send_unconfirmed: 'warning',
  sent: 'success',
  discarded: 'muted',
}

const OUTREACH_LABEL: Record<OutreachChipStatus, string> = {
  draft: 'Needs review',
  approved: 'Approved',
  sending: 'Sending',
  send_unconfirmed: 'Not confirmed',
  sent: 'Sent',
  discarded: 'Discarded',
}

export function OutreachStatusChip({ status }: { status: OutreachChipStatus }) {
  return <StatusChip tone={OUTREACH_TONE[status]} label={OUTREACH_LABEL[status]} />
}
