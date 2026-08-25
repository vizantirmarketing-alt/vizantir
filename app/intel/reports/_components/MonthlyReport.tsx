import type { ReactNode } from 'react'

import {
  displaySiteUrl,
  formatCls,
  formatCtr,
  formatDuration,
  formatInp,
  formatInteger,
  formatLcp,
  formatLongDate,
  formatMonth,
  formatPosition,
  formatSignedCtr,
  formatSignedInteger,
  formatUptime,
  humanizeEventName,
} from '@/lib/reports/format'
import type { ReportClient, ReportDocument } from '@/lib/reports/load'
import type { CruxMetric } from '@/lib/reports/crux'
import type { GscMovedRow } from '@/lib/reports/gsc'
import { buildReportSummary } from '@/lib/reports/summary'
import { cn } from '@/lib/utils'

type MonthlyReportProps = {
  document: ReportDocument
}

export function MonthlyReport({ document }: MonthlyReportProps) {
  const { snapshot, client, status } = document
  const month = formatMonth(snapshot.period.start)
  const summary = buildReportSummary(snapshot)
  const showSearch = snapshot.gsc.ok && !snapshot.gsc.skipped
  const showSpeed =
    snapshot.crux.ok && snapshot.crux.kind === 'metrics'
  const showHealth = snapshot.uptime.ok

  return (
    <article className="report-document mx-auto w-full min-w-0 max-w-[40rem] px-5 py-10 sm:px-8 sm:py-14">
      {status !== 'sent' ? (
        <p className="report-preview-only print:hidden mb-8 text-[0.7rem] uppercase tracking-[0.18em] text-meta">
          {status === 'failed'
            ? 'Internal preview · not sendable'
            : 'Internal preview'}
        </p>
      ) : null}

      <ReportHeader client={client} month={month} />

      <ReportSection title="Summary">
        <div className="space-y-4">
          {summary.map((sentence) => (
            <p
              key={sentence}
              className="text-[0.95rem] leading-[1.65] text-body"
            >
              {sentence}
            </p>
          ))}
        </div>
      </ReportSection>

      {showHealth ? (
        <SiteHealthSection snapshot={snapshot} month={month} />
      ) : null}

      {showSpeed && snapshot.crux.ok && snapshot.crux.kind === 'metrics' ? (
        <SpeedSection data={snapshot.crux.data} month={month} />
      ) : null}

      <TrafficSection snapshot={snapshot} />

      {showSearch && snapshot.gsc.ok && !snapshot.gsc.skipped ? (
        <SearchSection data={snapshot.gsc.data} />
      ) : null}

      <InquiriesSection snapshot={snapshot} />
    </article>
  )
}

function ReportHeader({
  client,
  month,
}: {
  client: ReportClient
  month: string
}) {
  const siteUrl = displaySiteUrl(client.siteUrl)

  return (
    <header className="report-section border-b border-black/10 pb-8">
      <p className="text-[0.7rem] font-medium uppercase tracking-[0.22em] text-cobalt-primary">
        Vizantir
      </p>
      <p className="mt-2 text-[0.7rem] uppercase tracking-[0.18em] text-meta">
        Monthly website report
      </p>
      <h1 className="mt-6 text-[1.65rem] font-medium leading-tight tracking-tight text-foreground sm:text-3xl">
        {client.name}
      </h1>
      <p className="mt-2 text-[0.95rem] text-body">{month}</p>
      <p className="mt-1 break-all text-sm text-meta">{siteUrl}</p>
    </header>
  )
}

function SiteHealthSection({
  snapshot,
  month,
}: {
  snapshot: ReportDocument['snapshot']
  month: string
}) {
  if (!snapshot.uptime.ok) {
    return null
  }

  const data = snapshot.uptime.data

  return (
    <ReportSection title="Site health">
      {data.coverage === 'none' ? (
        <p className="text-[0.95rem] leading-[1.65] text-body">
          Uptime monitoring had not started during {month}.
        </p>
      ) : data.uptimePercentage === null ? (
        <p className="text-[0.95rem] leading-[1.65] text-body">
          The monitor started mid-period on{' '}
          {formatLongDate(data.monitorCreatedAt)}, so a full-month uptime
          percentage is not available.
        </p>
      ) : (
        <MetricGrid>
          <Metric label="Uptime" value={formatUptime(data.uptimePercentage)} />
        </MetricGrid>
      )}

      <div className="mt-6">
        <h3 className="text-[0.7rem] font-medium uppercase tracking-[0.18em] text-meta">
          Incidents
        </h3>
        {data.incidents.length === 0 ? (
          <p className="mt-3 text-[0.95rem] leading-[1.65] text-body">
            No downtime was recorded
            {data.coverage === 'partial'
              ? ' after monitoring started'
              : ''}
            .
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-black/8">
            {data.incidents.map((incident) => (
              <li
                key={incident.startedAt}
                className="break-inside-avoid py-3 first:pt-0"
              >
                <p className="text-sm text-foreground">
                  {formatLongDate(incident.startedAt)}
                </p>
                <p className="mt-1 text-sm text-body">
                  {formatDuration(incident.durationSeconds)}
                  {incident.reason ? ` · ${incident.reason}` : ''}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </ReportSection>
  )
}

function SpeedSection({
  data,
  month,
}: {
  data: Extract<
    ReportDocument['snapshot']['crux'],
    { ok: true; kind: 'metrics' }
  >['data']
  month: string
}) {
  const period = data.collectionPeriod

  return (
    <ReportSection title="Speed">
      <p className="text-[0.95rem] leading-[1.65] text-body">
        Chrome User Experience Report, phones. These figures are from a rolling
        28-day field window
        {period
          ? ` (${formatLongDate(period.firstDate)} – ${formatLongDate(period.lastDate)})`
          : ''}
        , not from {month}.
      </p>
      <MetricGrid className="mt-6">
        <CruxMetricBlock
          label="Largest contentful paint"
          metric={data.lcp}
          formatValue={formatLcp}
          formatThreshold={formatLcp}
        />
        <CruxMetricBlock
          label="Interaction to next paint"
          metric={data.inp}
          formatValue={formatInp}
          formatThreshold={formatInp}
        />
        <CruxMetricBlock
          label="Cumulative layout shift"
          metric={data.cls}
          formatValue={formatCls}
          formatThreshold={formatCls}
        />
      </MetricGrid>
    </ReportSection>
  )
}

function CruxMetricBlock({
  label,
  metric,
  formatValue,
  formatThreshold,
}: {
  label: string
  metric: CruxMetric
  formatValue: (value: number) => string
  formatThreshold: (value: number) => string
}) {
  return (
    <Metric
      label={label}
      value={formatValue(metric.p75)}
      detail={`${metric.passed ? 'Met' : 'Missed'} the ${formatThreshold(metric.threshold)} threshold`}
      detailClassName={metric.passed ? 'text-meta' : 'text-warning'}
    />
  )
}

function TrafficSection({
  snapshot,
}: {
  snapshot: ReportDocument['snapshot']
}) {
  if (!snapshot.ga4.ok) {
    return (
      <ReportSection title="Traffic">
        <p className="text-[0.95rem] leading-[1.65] text-body">
          Traffic data was not available for this period.
        </p>
      </ReportSection>
    )
  }

  const data = snapshot.ga4.data

  return (
    <ReportSection title="Traffic">
      <MetricGrid>
        <Metric label="Sessions" value={formatInteger(data.sessions)} />
        <Metric label="Users" value={formatInteger(data.totalUsers)} />
        <Metric
          label="New / returning"
          value={`${formatInteger(data.newUsers)} / ${formatInteger(data.returningUsers)}`}
          detail={`${formatInteger(data.newUserSessions)} / ${formatInteger(data.returningUserSessions)} sessions`}
        />
      </MetricGrid>

      <div className="mt-8">
        <h3 className="text-[0.7rem] font-medium uppercase tracking-[0.18em] text-meta">
          Sessions by channel
        </h3>
        {data.channelGroups.length === 0 ? (
          <p className="mt-3 text-[0.95rem] leading-[1.65] text-body">
            No channel breakdown was recorded.
          </p>
        ) : (
          <SimpleTable
            caption="Sessions by channel"
            columns={['Channel', 'Sessions']}
            rows={data.channelGroups.map((row) => [
              row.channel,
              formatInteger(row.sessions),
            ])}
          />
        )}
      </div>

      <div className="mt-8">
        <h3 className="text-[0.7rem] font-medium uppercase tracking-[0.18em] text-meta">
          Top pages
        </h3>
        {data.topPages.length === 0 ? (
          <p className="mt-3 text-[0.95rem] leading-[1.65] text-body">
            No pages were recorded.
          </p>
        ) : (
          <SimpleTable
            caption="Top pages by views"
            columns={['Page', 'Views', 'Avg. duration']}
            rows={data.topPages.map((row) => [
              row.pagePath.length === 0 ? '/' : row.pagePath,
              formatInteger(row.screenPageViews),
              formatDuration(row.averageSessionDuration),
            ])}
            wrapFirst
          />
        )}
      </div>
    </ReportSection>
  )
}

function SearchSection({
  data,
}: {
  data: Extract<
    ReportDocument['snapshot']['gsc'],
    { ok: true; skipped: false }
  >['data']
}) {
  const impressionsFalling =
    data.impressionsChange !== null && data.impressionsChange < 0

  return (
    <ReportSection title="Search performance">
      {data.emptyRows ? (
        <p className="text-[0.95rem] leading-[1.65] text-body">
          Search Console returned no queries for this month.
        </p>
      ) : (
        <>
          <p className="text-sm leading-relaxed text-meta">
            Average position is lower-is-better. A higher number means the site
            appeared further from the top, which is not by itself a failure —
            especially when impressions are up.
          </p>
          <MetricGrid className="mt-6">
            <Metric
              label="Clicks"
              value={formatInteger(data.current.clicks)}
              detail={higherBetterDetail(data.clicksChange, formatSignedInteger)}
              detailClassName={higherBetterClass(data.clicksChange)}
            />
            <Metric
              label="Impressions"
              value={formatInteger(data.current.impressions)}
              detail={higherBetterDetail(
                data.impressionsChange,
                formatSignedInteger,
              )}
              detailClassName={higherBetterClass(data.impressionsChange)}
            />
            <Metric
              label="CTR"
              value={formatCtr(data.current.ctr)}
              detail={higherBetterDetail(data.ctrChange, formatSignedCtr)}
              detailClassName={higherBetterClass(data.ctrChange)}
            />
            <Metric
              label="Average position"
              value={formatPosition(data.current.position)}
              detail={positionDetail(data.positionChange)}
              detailClassName={positionClass(
                data.positionChange,
                impressionsFalling,
              )}
            />
          </MetricGrid>

          <div className="mt-8">
            <h3 className="text-[0.7rem] font-medium uppercase tracking-[0.18em] text-meta">
              Top queries
            </h3>
            <MovedTable
              caption="Top search queries"
              rows={data.topQueries}
              kind="query"
            />
          </div>

          <div className="mt-8">
            <h3 className="text-[0.7rem] font-medium uppercase tracking-[0.18em] text-meta">
              Top pages
            </h3>
            <MovedTable
              caption="Top search pages"
              rows={data.topPages}
              kind="page"
            />
          </div>
        </>
      )}
    </ReportSection>
  )
}

function InquiriesSection({
  snapshot,
}: {
  snapshot: ReportDocument['snapshot']
}) {
  if (!snapshot.ga4.ok) {
    return (
      <ReportSection title="Inquiries">
        <p className="text-[0.95rem] leading-[1.65] text-body">
          Conversion data was not available for this period.
        </p>
      </ReportSection>
    )
  }

  const conversions = snapshot.ga4.data.conversions

  return (
    <ReportSection title="Inquiries">
      {conversions.length === 0 ? (
        <p className="text-[0.95rem] leading-[1.65] text-body">
          No inquiries were recorded as conversions this month.
        </p>
      ) : (
        <SimpleTable
          caption="Conversions"
          columns={['Event', 'Count']}
          rows={conversions.map((row) => [
            humanizeEventName(row.eventName),
            formatInteger(row.keyEvents),
          ])}
        />
      )}
    </ReportSection>
  )
}

function ReportSection({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <section className="report-section border-b border-black/10 py-8 last:border-b-0 last:pb-0">
      <h2 className="mb-5 text-[0.7rem] font-medium uppercase tracking-[0.18em] text-meta">
        {title}
      </h2>
      {children}
    </section>
  )
}

function MetricGrid({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <dl
      className={cn(
        'grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4',
        className,
      )}
    >
      {children}
    </dl>
  )
}

function Metric({
  label,
  value,
  detail,
  detailClassName,
}: {
  label: string
  value: string
  detail?: string
  detailClassName?: string
}) {
  return (
    <div className="report-metric min-w-0">
      <dt className="text-[0.7rem] uppercase tracking-[0.14em] text-meta">
        {label}
      </dt>
      <dd className="mt-1.5 text-xl font-medium tabular-nums tracking-tight text-foreground">
        {value}
      </dd>
      {detail !== undefined ? (
        <p
          className={cn(
            'mt-1 text-sm leading-snug',
            detailClassName ?? 'text-meta',
          )}
        >
          {detail}
        </p>
      ) : null}
    </div>
  )
}

function SimpleTable({
  caption,
  columns,
  rows,
  wrapFirst = false,
}: {
  caption: string
  columns: string[]
  rows: string[][]
  wrapFirst?: boolean
}) {
  return (
    <>
      <ul className="mt-3 divide-y divide-black/8 md:hidden print:hidden">
        {rows.map((row) => (
          <li key={row.join('|')} className="break-inside-avoid py-3">
            <p
              className={cn(
                'text-sm text-foreground',
                wrapFirst && 'break-all',
              )}
            >
              {row[0]}
            </p>
            <p className="mt-1 text-sm tabular-nums text-body">
              {row.slice(1).join(' · ')}
            </p>
          </li>
        ))}
      </ul>
      <div className="mt-3 hidden md:block print:block">
        <table className="w-full min-w-0 border-collapse text-left text-sm">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr className="border-b border-black/10">
              {columns.map((column, index) => (
                <th
                  key={column}
                  className={cn(
                    'py-2 text-[0.7rem] font-medium uppercase tracking-[0.14em] text-meta',
                    index === 0 ? 'pr-3' : 'px-3 text-right last:pr-0',
                  )}
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.join('|')} className="border-b border-black/8">
                {row.map((cell, index) => (
                  <td
                    key={`${cell}-${index}`}
                    className={cn(
                      'py-2.5',
                      index === 0
                        ? cn(
                            'pr-3 text-foreground',
                            wrapFirst && 'break-all',
                          )
                        : 'px-3 text-right tabular-nums text-body last:pr-0',
                    )}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

function MovedTable({
  caption,
  rows,
  kind,
}: {
  caption: string
  rows: GscMovedRow[]
  kind: 'query' | 'page'
}) {
  if (rows.length === 0) {
    return (
      <p className="mt-3 text-[0.95rem] leading-[1.65] text-body">
        None recorded.
      </p>
    )
  }

  return (
    <>
      <ul className="mt-3 divide-y divide-black/8 md:hidden print:hidden">
        {rows.map((row) => (
          <li key={row.key} className="break-inside-avoid py-3">
            <p
              className={cn(
                'text-sm text-foreground',
                kind === 'page' && 'break-all',
              )}
            >
              {row.key}
            </p>
            <p className="mt-1 text-sm tabular-nums text-body">
              {formatInteger(row.clicks)} clicks · {formatInteger(row.impressions)}{' '}
              impressions
            </p>
            <p className="mt-1 text-sm tabular-nums text-meta">
              {formatCtr(row.ctr)} CTR · position {formatPosition(row.position)}
              {row.prior === null ? (
                <>
                  {' · '}
                  <span className="text-meta">New</span>
                </>
              ) : (
                <>
                  {' · '}
                  <span
                    className={positionClass(
                      row.positionChange,
                      row.impressionsChange !== null &&
                        row.impressionsChange < 0,
                    )}
                  >
                    {positionDetail(row.positionChange)}
                  </span>
                </>
              )}
            </p>
          </li>
        ))}
      </ul>
      <div className="mt-3 hidden overflow-hidden md:block print:block">
        <table className="w-full min-w-0 border-collapse text-left text-sm">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr className="border-b border-black/10">
              <th className="py-2 pr-3 text-[0.7rem] font-medium uppercase tracking-[0.14em] text-meta">
                {kind === 'page' ? 'Page' : 'Query'}
              </th>
              <th className="px-2 py-2 text-right text-[0.7rem] font-medium uppercase tracking-[0.14em] text-meta">
                Clicks
              </th>
              <th className="px-2 py-2 text-right text-[0.7rem] font-medium uppercase tracking-[0.14em] text-meta">
                Impr.
              </th>
              <th className="px-2 py-2 text-right text-[0.7rem] font-medium uppercase tracking-[0.14em] text-meta">
                CTR
              </th>
              <th className="py-2 pl-2 text-right text-[0.7rem] font-medium uppercase tracking-[0.14em] text-meta">
                Pos.
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const impressionsFalling =
                row.impressionsChange !== null && row.impressionsChange < 0
              return (
                <tr key={row.key} className="border-b border-black/8">
                  <td
                    className={cn(
                      'max-w-[14rem] py-2.5 pr-3 text-foreground',
                      kind === 'page' ? 'break-all' : 'break-words',
                    )}
                  >
                    {row.key}
                    {row.prior === null ? (
                      <span className="mt-0.5 block text-xs text-meta">
                        New
                      </span>
                    ) : null}
                  </td>
                  <td className="px-2 py-2.5 text-right tabular-nums text-body">
                    {formatInteger(row.clicks)}
                    <ChangeLine
                      change={row.clicksChange}
                      format={formatSignedInteger}
                    />
                  </td>
                  <td className="px-2 py-2.5 text-right tabular-nums text-body">
                    {formatInteger(row.impressions)}
                    <ChangeLine
                      change={row.impressionsChange}
                      format={formatSignedInteger}
                    />
                  </td>
                  <td className="px-2 py-2.5 text-right tabular-nums text-body">
                    {formatCtr(row.ctr)}
                    <ChangeLine
                      change={row.ctrChange}
                      format={formatSignedCtr}
                    />
                  </td>
                  <td className="py-2.5 pl-2 text-right tabular-nums text-body">
                    {formatPosition(row.position)}
                    {row.prior === null ? null : (
                      <span
                        className={cn(
                          'mt-0.5 block text-xs leading-snug',
                          positionClass(row.positionChange, impressionsFalling),
                        )}
                      >
                        {positionDetail(row.positionChange)}
                      </span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  )
}

function ChangeLine({
  change,
  format,
}: {
  change: number | null
  format: (value: number) => string
}) {
  if (change === null) {
    return null
  }
  return (
    <span className={cn('mt-0.5 block text-xs', higherBetterClass(change))}>
      {format(change)}
    </span>
  )
}

function higherBetterDetail(
  change: number | null,
  format: (value: number) => string,
): string {
  if (change === null) {
    return 'New'
  }
  return format(change)
}

function higherBetterClass(change: number | null): string {
  if (change === null || change === 0) {
    return 'text-meta'
  }
  return change > 0 ? 'text-positive' : 'text-warning'
}

function positionDetail(change: number | null): string {
  if (change === null) {
    return 'New'
  }
  if (change === 0) {
    return 'Unchanged'
  }
  const abs = Math.abs(change).toFixed(1)
  return change > 0
    ? `${abs} further from the top`
    : `${abs} closer to the top`
}

function positionClass(
  change: number | null,
  impressionsFalling: boolean,
): string {
  if (change === null || change === 0) {
    return 'text-meta'
  }
  if (change < 0) {
    return 'text-positive'
  }
  return impressionsFalling ? 'text-warning' : 'text-meta'
}
