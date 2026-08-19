import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { LeadPipelineForms } from '@/app/intel/_components/LeadPipelineForms'
import { LeadStatusBadge } from '@/app/intel/_components/LeadStatusBadge'
import { Panel } from '@/app/intel/_components/ui/Panel'
import { requireIntelUser } from '@/lib/auth/allowlist'
import {
  centsToDollarInput,
  formatChannelLabel,
  formatFullTimestamp,
  formatStatusLabel,
  isLeadId,
  leadsListHref,
  parseLeadsListParams,
  type LeadsSearchParams,
} from '@/lib/intel/lead-params'
import {
  fetchLeadDetail,
  type LeadDetail,
  type LeadStatusHistoryRow,
} from '@/lib/intel/leads'

export const metadata: Metadata = {
  title: 'Inquiry',
  robots: { index: false, follow: false },
}

type LeadDetailPageProps = {
  params: Promise<{ id: string }>
  searchParams: Promise<LeadsSearchParams>
}

export default async function IntelLeadDetailPage({
  params,
  searchParams,
}: LeadDetailPageProps) {
  await requireIntelUser()

  const { id } = await params
  if (!isLeadId(id)) {
    notFound()
  }

  const listParams = parseLeadsListParams(await searchParams)
  const backHref = leadsListHref(listParams)
  const result = await fetchLeadDetail(id)

  if (!result.ok && result.reason === 'not_found') {
    notFound()
  }

  if (!result.ok) {
    return (
      <div className="flex flex-col gap-4">
        <BackLink href={backHref} />
        <h1 className="text-base font-semibold tracking-tight text-foreground">
          Inquiry
        </h1>
        <Panel>
          <p className="text-sm leading-relaxed text-body" role="alert">
            Unable to load this inquiry. Try again shortly.
          </p>
        </Panel>
      </div>
    )
  }

  const { lead, history } = result
  const deliveryWarning =
    lead.notify_status === 'failed' || lead.notify_status === 'not_configured'

  return (
    <div className="flex flex-col gap-4">
      <BackLink href={backHref} />

      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-base font-semibold tracking-tight text-foreground">
          {lead.name}
        </h1>
        <LeadStatusBadge status={lead.status} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <InquirySection lead={lead} />
        <AttributionSection lead={lead} />
      </div>

      <div className={deliveryWarning ? undefined : 'grid gap-4 lg:grid-cols-2'}>
        <DeliverySection lead={lead} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Pipeline">
          <LeadPipelineForms
            leadId={lead.id}
            status={lead.status}
            estimatedValueCents={lead.estimated_value_cents}
            estimatedValueDollars={centsToDollarInput(lead.estimated_value_cents)}
            notes={lead.notes}
          />
        </Panel>
        <HistorySection history={history} />
      </div>
    </div>
  )
}

function BackLink({ href }: { href: string }) {
  return (
    <Link
      href={href}
      className="text-sm text-meta transition-colors hover:text-foreground"
    >
      Leads
    </Link>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <div>
      <dt className="text-sm text-meta">{label}</dt>
      <dd className="mt-1 text-sm text-foreground">{children}</dd>
    </div>
  )
}

function dash(value: string | null): string {
  return value ?? '—'
}

function toTelHref(phone: string): string | null {
  const normalized = phone.replace(/[^\d+]/g, '')
  if (!/\d/.test(normalized)) {
    return null
  }
  return `tel:${normalized}`
}

function InquirySection({ lead }: { lead: LeadDetail }) {
  const telHref = lead.phone ? toTelHref(lead.phone) : null

  return (
    <Panel title="Inquiry">
      <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
        <Field label="Name">{lead.name}</Field>
        <Field label="Email">
          <a
            href={`mailto:${lead.email}`}
            className="transition-colors hover:text-cobalt-primary"
          >
            {lead.email}
          </a>
        </Field>
        <Field label="Phone">
          {lead.phone && telHref ? (
            <a
              href={telHref}
              className="transition-colors hover:text-cobalt-primary"
            >
              {lead.phone}
            </a>
          ) : (
            dash(lead.phone)
          )}
        </Field>
        <Field label="Company">{dash(lead.company)}</Field>
        <Field label="Service">{lead.service}</Field>
        <Field label="Budget">{dash(lead.budget)}</Field>
        <Field label="Submitted">
          <time dateTime={lead.created_at} className="tabular-nums">
            {formatFullTimestamp(lead.created_at)}
          </time>
        </Field>
      </dl>
      <div className="mt-6">
        <p className="text-sm text-meta">Message</p>
        <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
          {lead.message}
        </p>
      </div>
    </Panel>
  )
}

function hasAttribution(lead: LeadDetail): boolean {
  return (
    lead.landing_page !== null ||
    lead.referrer !== null ||
    lead.utm_source !== null ||
    lead.utm_medium !== null ||
    lead.utm_campaign !== null ||
    lead.initial_channel !== null
  )
}

function AttributionSection({ lead }: { lead: LeadDetail }) {
  return (
    <Panel title="Attribution">
      {hasAttribution(lead) ? (
        <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
          <Field label="Landing page">{dash(lead.landing_page)}</Field>
          <Field label="Referrer">{dash(lead.referrer)}</Field>
          <Field label="UTM source">{dash(lead.utm_source)}</Field>
          <Field label="UTM medium">{dash(lead.utm_medium)}</Field>
          <Field label="UTM campaign">{dash(lead.utm_campaign)}</Field>
          <Field label="Initial channel">
            {formatChannelLabel(lead.initial_channel)}
          </Field>
        </dl>
      ) : (
        <p className="text-sm leading-relaxed text-body">
          This inquiry predates attribution capture.
        </p>
      )}
    </Panel>
  )
}

function notifyStatusLabel(
  status: LeadDetail['notify_status'],
): string {
  if (status === 'sent') {
    return 'Sent'
  }
  if (status === 'failed') {
    return 'Failed'
  }
  if (status === 'not_configured') {
    return 'Not configured'
  }
  return 'No record'
}

function DeliverySection({ lead }: { lead: LeadDetail }) {
  const needsReply =
    lead.notify_status === 'failed' || lead.notify_status === 'not_configured'
  const warningClass =
    lead.notify_status === 'failed' ? 'text-warning-severe' : 'text-warning'

  return (
    <Panel title="Delivery" className={needsReply ? 'border-warning' : undefined}>
      <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
        <Field label="Notification">
          <span className={needsReply ? warningClass : undefined}>
            {notifyStatusLabel(lead.notify_status)}
          </span>
        </Field>
        <Field label="Notified">
          {lead.notified_at ? (
            <time dateTime={lead.notified_at} className="tabular-nums">
              {formatFullTimestamp(lead.notified_at)}
            </time>
          ) : (
            '—'
          )}
        </Field>
      </dl>
      {lead.notify_error ? (
        <p className="mt-5 text-sm leading-relaxed text-body">
          {lead.notify_error}
        </p>
      ) : null}
      {needsReply ? (
        <p className={`mt-5 text-sm leading-relaxed ${warningClass}`}>
          The notification email may not have been received. This inquiry still
          needs a reply.
        </p>
      ) : null}
    </Panel>
  )
}

function HistorySection({ history }: { history: LeadStatusHistoryRow[] }) {
  return (
    <Panel title="History">
      {history.length === 0 ? (
        <p className="text-sm leading-relaxed text-body">
          No status changes have been recorded.
        </p>
      ) : (
        <ol className="divide-y divide-black/8">
          {history.map((entry) => (
            <li key={entry.id} className="py-2 first:pt-0">
              <p className="text-sm text-foreground">
                {entry.previous_status
                  ? `${formatStatusLabel(entry.previous_status)} → ${formatStatusLabel(entry.new_status)}`
                  : `Set to ${formatStatusLabel(entry.new_status)}`}
              </p>
              <p className="mt-1 text-sm text-body">
                {entry.changed_by ? `${entry.changed_by} · ` : null}
                <time dateTime={entry.changed_at} className="tabular-nums">
                  {formatFullTimestamp(entry.changed_at)}
                </time>
              </p>
            </li>
          ))}
        </ol>
      )}
    </Panel>
  )
}
