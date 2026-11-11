import type { ReactNode } from 'react'
import Link from 'next/link'

import { Panel } from '@/app/intel/_components/ui/Panel'
import {
  INQUIRY_RECENT_DAYS,
  NEW_PROSPECTS_SHOWN,
  recordLink,
  type BriefingContent,
  type BriefingProspect,
  type SourceFreshness,
} from '@/lib/briefing/context'
import { formatLocalTimestamp } from '@/lib/briefing/dates'
import type { BriefingRecord } from '@/lib/briefing/generate'
import { summaryUnavailableMessage } from '@/lib/briefing/messages'
import { LEAD_STATUS_LABELS, type LeadStatus } from '@/lib/intel/lead-params'
import { FACTOR_DEFINITIONS, isProspectFactor } from '@/lib/prospects/rubric'
import { formatScore, formatShortDate } from '@/lib/prospects/params'

const linkClass = 'text-foreground transition-colors hover:text-cobalt-primary'
const actionLinkClass = 'intel-body text-cobalt-primary transition-colors hover:text-[#1E85FF]'

function RecordAnchor({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className={linkClass}>
      {children}
    </Link>
  )
}

function Empty({ children }: { children: ReactNode }) {
  return <p className="intel-body leading-relaxed text-body">{children}</p>
}

function Unavailable() {
  return (
    <p className="intel-body text-warning-severe" role="alert">
      This section could not be loaded when the briefing was generated.
    </p>
  )
}

const SOURCE_STATE_LABELS: Record<SourceFreshness['state'], string> = {
  ok: 'Healthy',
  stale: 'Stale',
  failed: 'Failed',
  partial: 'Partial',
  never: 'Never run',
}

const RUN_STATE_LABELS: Record<string, string> = {
  completed: 'Completed',
  partial: 'Partial',
  failed: 'Failed',
  cancelled: 'Cancelled',
}

function leadStatusLabel(status: string): string {
  return status in LEAD_STATUS_LABELS ? LEAD_STATUS_LABELS[status as LeadStatus] : status
}

function factorLabel(key: string): string {
  return isProspectFactor(key) ? FACTOR_DEFINITIONS[key].label : key
}

function ProspectItem({ prospect }: { prospect: BriefingProspect }) {
  return (
    <li className="py-2.5 first:pt-0 last:pb-0">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 intel-body">
        <RecordAnchor href={`/intel/prospects/${prospect.id}`}>
          <span className="font-medium">{prospect.name}</span>{' '}
          <span className="text-meta">{prospect.domain}</span>
        </RecordAnchor>
        <span className="tabular-nums text-meta">
          Priority {formatScore(prospect.priority)} · Fit {formatScore(prospect.fitScore)} · Opportunity{' '}
          {formatScore(prospect.opportunityScore)}
        </span>
      </div>
      {prospect.performance !== null ? (
        <p className="mt-0.5 truncate intel-body text-body">{prospect.performance}</p>
      ) : null}
      {prospect.highlight !== null ? (
        <p className="mt-0.5 line-clamp-1 intel-body text-body">
          <span className="text-meta">{factorLabel(prospect.highlight.factorKey)}:</span>{' '}
          {prospect.highlight.claim}{' '}
          <a
            href={prospect.highlight.sourceUrl}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="text-cobalt-primary transition-colors hover:text-[#1E85FF]"
          >
            source
          </a>
        </p>
      ) : null}
    </li>
  )
}

function NewProspectsSection({ content }: { content: BriefingContent }) {
  const shown = content.newProspects.slice(0, NEW_PROSPECTS_SHOWN)
  const rest = content.newProspects.slice(NEW_PROSPECTS_SHOWN)
  const total = content.newProspectsTotal

  return (
    <>
      <p className="mb-2 intel-secondary text-meta">
        {shown.length} of {total} added since {formatShortDate(content.windows.prospectsSince)}, highest
        priority first.
      </p>
      <ul className="divide-y divide-black/8">
        {shown.map((p) => (
          <ProspectItem key={p.id} prospect={p} />
        ))}
      </ul>
      {rest.length > 0 ? (
        <details className="mt-2">
          <summary className={`cursor-pointer ${actionLinkClass}`}>
            Show all {content.newProspects.length}
          </summary>
          <ul className="mt-2 divide-y divide-black/8 border-t border-black/8 pt-2">
            {rest.map((p) => (
              <ProspectItem key={p.id} prospect={p} />
            ))}
          </ul>
        </details>
      ) : null}
      {total > content.newProspects.length ? (
        <Link href="/intel/prospects" className={`mt-2 inline-block ${actionLinkClass}`}>
          {total - content.newProspects.length} more on Prospect Research
        </Link>
      ) : null}
    </>
  )
}

export function BriefingView({ briefing }: { briefing: BriefingRecord }) {
  const content: BriefingContent = briefing.content
  const unavailable = new Set(content.unavailable)
  const unhealthy = content.sources.filter((s) => s.state !== 'ok')

  return (
    <div className="flex flex-col gap-4">
      {content.quiet ? (
        <Panel title="Today" accent="positive">
          <p className="intel-body leading-relaxed text-body">
            Nothing new since the last briefing. No new prospects, no recent inquiries waiting, no open
            findings, no finished research runs, and every data source is healthy.
          </p>
        </Panel>
      ) : null}

      {briefing.narrative !== null ? (
        <Panel title="Summary" accent="cobalt">
          <p className="whitespace-pre-wrap intel-body leading-relaxed text-body">{briefing.narrative}</p>
          {content.suggestedActions !== null && content.suggestedActions.length > 0 ? (
            <ul className="mt-3 space-y-1.5 intel-body">
              {content.suggestedActions.map((action) => {
                const link = recordLink(content, action.recordId)
                return (
                  <li key={`${action.recordId}-${action.text}`} className="text-body">
                    {link ? <RecordAnchor href={link.href}>{action.text}</RecordAnchor> : action.text}
                    {link ? <span className="text-meta"> · {link.kind}</span> : null}
                  </li>
                )
              })}
            </ul>
          ) : null}
        </Panel>
      ) : briefing.error !== null && !content.quiet ? (
        <Panel title="Summary">
          <p className="intel-secondary text-meta">{summaryUnavailableMessage(briefing.error)}</p>
        </Panel>
      ) : null}

      <Panel title="New prospects">
        {unavailable.has('newProspects') ? (
          <Unavailable />
        ) : content.newProspects.length === 0 ? (
          <Empty>No prospects added since {formatShortDate(content.windows.prospectsSince)}.</Empty>
        ) : (
          <NewProspectsSection content={content} />
        )}
      </Panel>

      {unavailable.has('topUnreviewed') ? (
        <Panel title="Highest priority unreviewed prospects">
          <Unavailable />
        </Panel>
      ) : content.topUnreviewed.length === 0 ? null : (
        <Panel title="Highest priority unreviewed prospects">
          <ul className="divide-y divide-black/8 intel-body">
            {content.topUnreviewed.map((p) => (
              <li key={p.id} className="flex flex-wrap items-baseline justify-between gap-2 py-2 first:pt-0 last:pb-0">
                <RecordAnchor href={`/intel/prospects/${p.id}`}>
                  {p.name} <span className="text-meta">{p.domain}</span>
                </RecordAnchor>
                <span className="tabular-nums text-meta">
                  Priority {formatScore(p.priority)} · Fit {formatScore(p.fitScore)} · Opportunity{' '}
                  {formatScore(p.opportunityScore)}
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      )}

      <Panel title="Inbound inquiries">
        {unavailable.has('inquiries') ? (
          <Unavailable />
        ) : (
          <>
            <p className="intel-body text-body">
              {content.inquiries.recentTotal} new{' '}
              {content.inquiries.recentTotal === 1 ? 'inquiry' : 'inquiries'} in the last{' '}
              {INQUIRY_RECENT_DAYS} days
              {content.inquiries.recent.length < content.inquiries.recentTotal
                ? `, newest ${content.inquiries.recent.length} shown`
                : ''}
              {content.inquiries.deliveryIssues !== null && content.inquiries.deliveryIssues > 0
                ? ` · ${content.inquiries.deliveryIssues} with notification delivery issues`
                : ''}
              .
            </p>
            {content.inquiries.recent.length > 0 ? (
              <ul className="mt-2 divide-y divide-black/8 intel-body">
                {content.inquiries.recent.map((i) => (
                  <li key={i.id} className="flex flex-wrap items-baseline justify-between gap-2 py-2">
                    <RecordAnchor href={`/intel/leads/${i.id}`}>{i.company ?? 'No company given'}</RecordAnchor>
                    <span className="text-meta">
                      {leadStatusLabel(i.status)}
                      {i.ageDays !== null ? ` · ${i.ageDays} ${i.ageDays === 1 ? 'day' : 'days'} old` : ''}
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}
            {content.inquiries.olderCount > 0 ? (
              <p className="mt-2 intel-secondary text-meta">
                {content.inquiries.olderCount} older new{' '}
                {content.inquiries.olderCount === 1 ? 'inquiry' : 'inquiries'} from before the last{' '}
                {INQUIRY_RECENT_DAYS} days.{' '}
                <Link href="/intel/leads?status=new&sort=oldest" className={actionLinkClass}>
                  Open in Leads
                </Link>
              </p>
            ) : null}
          </>
        )}
      </Panel>

      {unavailable.has('newBusinesses') ? (
        <Panel title="New businesses">
          <Unavailable />
        </Panel>
      ) : content.newBusinesses !== undefined ? (
        <Panel title="New businesses">
          <p className="intel-body text-body">
            {content.newBusinesses.count} new{' '}
            {content.newBusinesses.count === 1 ? 'business' : 'businesses'} in enabled categories since{' '}
            {formatShortDate(content.newBusinesses.since)}.{' '}
            {content.newBusinesses.noWebsite !== undefined && content.newBusinesses.noWebsite > 0
              ? `${content.newBusinesses.noWebsite} unreviewed ${content.newBusinesses.noWebsite === 1 ? 'business has' : 'businesses have'} no website found. `
              : null}
            <Link href="/intel/new-businesses" className={actionLinkClass}>
              Open New Businesses
            </Link>
          </p>
        </Panel>
      ) : null}

      <Panel title="Open Intel findings">
        {unavailable.has('findings') ? (
          <Unavailable />
        ) : content.findings.items.length === 0 ? (
          <Empty>No open findings.</Empty>
        ) : (
          <>
            <p className="intel-secondary text-meta">
              {content.findings.items.length} of {content.findings.openCount} open.
            </p>
            <ul className="mt-2 divide-y divide-black/8 intel-body">
              {content.findings.items.map((f) => (
                <li key={f.findingKey} className="flex flex-wrap items-baseline justify-between gap-2 py-2">
                  <RecordAnchor href="/intel">{f.title}</RecordAnchor>
                  <span className="text-meta">
                    {f.category.replace(/_/g, ' ')} · {f.confidence} · {f.status.replace(/_/g, ' ')}
                  </span>
                </li>
              ))}
            </ul>
            <Link href="/intel" className={`mt-2 inline-block ${actionLinkClass}`}>
              View the full findings feed
            </Link>
          </>
        )}
      </Panel>

      <Panel title="Research runs">
        {unavailable.has('runs') ? (
          <Unavailable />
        ) : content.runs.length === 0 ? (
          <Empty>No research runs finished since {formatShortDate(content.windows.runsSince)}.</Empty>
        ) : (
          <ul className="divide-y divide-black/8 intel-body">
            {content.runs.map((r) => (
              <li key={r.id} className="py-2.5 first:pt-0 last:pb-0">
                <RecordAnchor href="/intel/prospects">
                  {[r.industry, r.market].filter(Boolean).join(' · ') || 'Research run'}
                </RecordAnchor>
                <span className={r.state === 'failed' ? 'text-warning-severe' : 'text-meta'}>
                  {' '}
                  · {RUN_STATE_LABELS[r.state] ?? r.state} ·{' '}
                  {r.requested === null ? r.saved : `${r.saved} of ${r.requested}`} saved
                </span>
                {r.errors.length > 0 ? (
                  <ul className="mt-1 space-y-0.5 text-warning-severe" aria-label="Errors">
                    {r.errors.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                ) : null}
                {r.notes.length > 0 ? (
                  <ul className="mt-1 space-y-0.5 text-meta" aria-label="Notes">
                    {r.notes.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel title="Source freshness" accent={unhealthy.length > 0 ? 'warning-severe' : undefined}>
        {unavailable.has('sources') ? (
          <Unavailable />
        ) : briefing.sourceFreshness.length === 0 ? (
          <Empty>No data sources reported.</Empty>
        ) : (
          <ul className="divide-y divide-black/8 intel-body">
            {briefing.sourceFreshness.map((s) => (
              <li key={s.provider} className="flex flex-wrap items-baseline justify-between gap-2 py-2">
                <RecordAnchor href="/intel">{s.label}</RecordAnchor>
                <span className={s.state === 'ok' ? 'text-meta' : 'text-warning-severe'}>
                  {SOURCE_STATE_LABELS[s.state]}
                  {s.lastRunAt ? ` · last run ${formatLocalTimestamp(s.lastRunAt)}` : ''}
                  {s.message && s.state !== 'ok' ? ` · ${s.message}` : ''}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  )
}
