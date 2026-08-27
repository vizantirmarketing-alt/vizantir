'use client'

import { useId } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Activity,
  ChartNoAxesColumn,
  Eye,
  Gauge,
  HeartPulse,
  MousePointerClick,
  Percent,
  Timer,
  UserPlus,
  UserRound,
  Users,
} from 'lucide-react'

import { MetricCard } from '@/app/intel/_components/ui/MetricCard'
import type { MetricDeltaDirection } from '@/app/intel/_components/ui/MetricCard'
import { Panel } from '@/app/intel/_components/ui/Panel'
import { PanelQueryError } from '@/app/intel/_components/ui/PanelRetry'
import { StatStrip } from '@/app/intel/_components/ui/StatStrip'
import type {
  ClientDashboard as DashboardResult,
  DashboardCruxResult,
  DashboardGa4Result,
  DashboardGscResult,
  DashboardUptimeResult,
  DashboardWindow,
} from '@/lib/clients/dashboard'
import type { ClientSources, IntelClient } from '@/lib/clients/load'
import { formatPercentAgainstMeaningfulBase } from '@/lib/intel/format-change'
import { formatSpanLabel } from '@/lib/intel/search-params'
import {
  displaySiteUrl,
  formatCls,
  formatCtr,
  formatDuration,
  formatInp,
  formatInteger,
  formatLcp,
  formatLongDate,
  formatPosition,
  formatUptime,
} from '@/lib/reports/format'
import { cn } from '@/lib/utils'

const SELECT_CLASS =
  'w-full rounded-lg border border-black/10 bg-white px-3 py-2.5 text-sm text-foreground transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-cobalt-focus sm:w-auto'

const SOURCE_LABELS = {
  ga4: 'GA4',
  gsc: 'Search Console',
  crux: 'CrUX',
  uptime: 'Uptime',
} as const

const SOURCE_SETUP = {
  ga4: 'a GA4 property ID',
  gsc: 'a Search Console site URL',
  crux: 'a CrUX origin',
  uptime: 'an UptimeRobot monitor ID',
} as const

const CARE_TIER_LABEL = {
  essential: 'Essential',
  care: 'Care',
} as const

type SourceKey = keyof typeof SOURCE_LABELS

type DeltaFields = {
  deltaLabel: string
  deltaDirection: MetricDeltaDirection
}

export function ClientsHeader() {
  return (
    <h1 className="text-base font-semibold tracking-tight text-foreground">
      Clients
    </h1>
  )
}

export function ClientPageHeader() {
  return (
    <h1 className="text-base font-semibold tracking-tight text-foreground">
      Client
    </h1>
  )
}

export function ClientsQueryError() {
  return (
    <PanelQueryError message="Unable to load clients. Data could not be loaded." />
  )
}

export function ClientQueryError() {
  return (
    <PanelQueryError message="Unable to load this client. Data could not be loaded." />
  )
}

export function ClientsEmptyState() {
  return (
    <div>
      <p className="text-sm font-medium text-foreground">No active clients</p>
      <p className="mt-2 text-sm leading-relaxed text-body">
        Active clients will appear here once they are added.
      </p>
    </div>
  )
}

export type ClientListItem = {
  id: string
  name: string
  siteUrl: string
  careTier: IntelClient['careTier']
  sources: ClientSources
}

export function ClientsList({ clients }: { clients: readonly ClientListItem[] }) {
  return (
    <Panel title="Active">
      <ul className="divide-y divide-black/8 lg:hidden">
        {clients.map((client) => (
          <li key={client.id} className="py-3">
            <Link
              href={`/intel/clients/${client.id}`}
              className="text-sm font-medium text-foreground transition-colors hover:text-cobalt-primary"
            >
              {client.name}
            </Link>
            <p className="mt-1 break-all text-sm text-body">
              {displaySiteUrl(client.siteUrl)}
            </p>
            <div className="mt-2">
              <CareTierChip tier={client.careTier} />
            </div>
            <div className="mt-2">
              <SourceChips sources={client.sources} />
            </div>
          </li>
        ))}
      </ul>

      <div className="hidden lg:block">
        <table className="w-full border-collapse text-left text-sm">
          <caption className="sr-only">Active clients</caption>
          <thead>
            <tr className="border-b border-black/8">
              <th className="py-1.5 pr-4 text-[0.7rem] font-medium uppercase tracking-[0.18em] text-meta">
                Client
              </th>
              <th className="py-1.5 pr-4 text-[0.7rem] font-medium uppercase tracking-[0.18em] text-meta">
                Site
              </th>
              <th className="py-1.5 pr-4 text-[0.7rem] font-medium uppercase tracking-[0.18em] text-meta">
                Care
              </th>
              <th className="py-1.5 text-[0.7rem] font-medium uppercase tracking-[0.18em] text-meta">
                Sources
              </th>
            </tr>
          </thead>
          <tbody>
            {clients.map((client) => (
              <tr
                key={client.id}
                className="border-b border-black/8 last:border-b-0"
              >
                <td className="py-2.5 pr-4">
                  <Link
                    href={`/intel/clients/${client.id}`}
                    className="font-medium text-foreground transition-colors hover:text-cobalt-primary"
                  >
                    {client.name}
                  </Link>
                </td>
                <td className="py-2.5 pr-4 break-all text-body">
                  {displaySiteUrl(client.siteUrl)}
                </td>
                <td className="py-2.5 pr-4">
                  <CareTierChip tier={client.careTier} />
                </td>
                <td className="py-2.5">
                  <SourceChips sources={client.sources} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  )
}

export function ClientDashboard({
  client,
  clients,
  dashboard,
}: {
  client: IntelClient
  clients: readonly IntelClient[]
  dashboard: DashboardResult
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
        <ClientHeader client={client} dateWindow={dashboard.window} />
        <ClientSwitcher
          clients={clients}
          currentId={client.id}
          currentName={client.name}
        />
      </div>
      <Ga4Section result={dashboard.ga4} />
      <GscSection result={dashboard.gsc} />
      <CruxSection result={dashboard.crux} />
      <UptimeSection result={dashboard.uptime} />
    </div>
  )
}

function ClientHeader({
  client,
  dateWindow,
}: {
  client: IntelClient
  dateWindow: DashboardWindow
}) {
  return (
    <div>
      <h1 className="text-base font-semibold tracking-tight text-foreground">
        {client.name}
      </h1>
      <p className="mt-1 text-xs text-meta">
        {displaySiteUrl(client.siteUrl)}
        <span aria-hidden className="px-1.5">
          ·
        </span>
        {formatSpanLabel({ start: dateWindow.startDate, end: dateWindow.endDate })}
      </p>
    </div>
  )
}

function ClientSwitcher({
  clients,
  currentId,
  currentName,
}: {
  clients: readonly IntelClient[]
  currentId: string
  currentName: string
}) {
  const router = useRouter()
  const selectId = useId()
  const options = switcherOptions(clients, currentId, currentName)

  return (
    <div>
      <label htmlFor={selectId} className="sr-only">
        Client
      </label>
      <select
        id={selectId}
        value={currentId}
        className={SELECT_CLASS}
        onChange={(event) => {
          router.push(`/intel/clients/${event.target.value}`)
        }}
      >
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.name}
          </option>
        ))}
      </select>
    </div>
  )
}

function Ga4Section({ result }: { result: DashboardGa4Result }) {
  if (!result.ok) {
    return <SourceStatePanel source="ga4" reason={result.reason} />
  }

  const current = result.current
  const prior = result.prior
  const sessionsDelta = countDelta(current.sessions, prior?.sessions)
  const usersDelta = countDelta(current.totalUsers, prior?.totalUsers)
  const newUsersDelta = countDelta(current.newUsers, prior?.newUsers)
  const returningDelta = countDelta(current.returningUsers, prior?.returningUsers)

  return (
    <Panel title="GA4">
      <StatStrip>
        <MetricCard
          label="Sessions"
          value={formatInteger(current.sessions)}
          icon={<Activity className="size-3" />}
          accent="cobalt-tint"
          deltaLabel={sessionsDelta?.deltaLabel}
          deltaDirection={sessionsDelta?.deltaDirection}
        />
        <MetricCard
          label="Users"
          value={formatInteger(current.totalUsers)}
          icon={<Users className="size-3" />}
          accent="cobalt-tint"
          deltaLabel={usersDelta?.deltaLabel}
          deltaDirection={usersDelta?.deltaDirection}
        />
        <MetricCard
          label="New users"
          value={formatInteger(current.newUsers)}
          icon={<UserPlus className="size-3" />}
          accent="cobalt-tint"
          deltaLabel={newUsersDelta?.deltaLabel}
          deltaDirection={newUsersDelta?.deltaDirection}
        />
        <MetricCard
          label="Returning users"
          value={formatInteger(current.returningUsers)}
          icon={<UserRound className="size-3" />}
          accent="cobalt-tint"
          deltaLabel={returningDelta?.deltaLabel}
          deltaDirection={returningDelta?.deltaDirection}
        />
      </StatStrip>
      <p className="text-sm leading-relaxed text-body">
        Users counts each person once for the window. New and returning can both include
        the same person, so they do not add up to Users.
      </p>
    </Panel>
  )
}

function GscSection({ result }: { result: DashboardGscResult }) {
  if (!result.ok) {
    return <SourceStatePanel source="gsc" reason={result.reason} />
  }

  if (result.current.emptyRows) {
    return (
      <Panel title="Search Console">
        <p className="text-sm leading-relaxed text-body">
          Search Console has no data for this property yet. New properties usually take a
          few days to report.
        </p>
      </Panel>
    )
  }

  const current = result.current.current
  const prior = result.prior
  const clickDelta = countDelta(current.clicks, prior?.clicks)
  const impressionDelta = countDelta(current.impressions, prior?.impressions)
  const ctrChange = ratioPointDelta(current.ctr, prior?.ctr)
  const positionChange = unitDelta(current.position, prior?.position)

  return (
    <Panel title="Search Console">
      <StatStrip>
        <MetricCard
          label="Clicks"
          value={formatInteger(current.clicks)}
          icon={<MousePointerClick className="size-3" />}
          accent="cobalt-tint"
          deltaLabel={clickDelta?.deltaLabel}
          deltaDirection={clickDelta?.deltaDirection}
        />
        <MetricCard
          label="Impressions"
          value={formatInteger(current.impressions)}
          icon={<Eye className="size-3" />}
          accent="cobalt-tint"
          deltaLabel={impressionDelta?.deltaLabel}
          deltaDirection={impressionDelta?.deltaDirection}
        />
        <MetricCard
          label="CTR"
          value={formatCtr(current.ctr)}
          icon={<Percent className="size-3" />}
          accent="cobalt-tint"
          deltaLabel={ctrChange?.deltaLabel}
          deltaDirection={ctrChange?.deltaDirection}
        />
        <MetricCard
          label="Average position"
          value={formatPosition(current.position)}
          icon={<ChartNoAxesColumn className="size-3" />}
          accent="cobalt-tint"
          deltaLabel={positionChange?.deltaLabel}
          deltaDirection={positionChange?.deltaDirection}
          lowerIsBetter
        />
      </StatStrip>
    </Panel>
  )
}

function CruxSection({ result }: { result: DashboardCruxResult }) {
  if (!result.ok) {
    return <SourceStatePanel source="crux" reason={result.reason} />
  }

  if (result.kind === 'no_data') {
    return (
      <Panel title="CrUX">
        <p className="text-sm leading-relaxed text-body">
          Chrome has no field data for this origin yet.
        </p>
      </Panel>
    )
  }

  const { current } = result
  const period = current.collectionPeriod

  return (
    <Panel title="CrUX">
      <p className="mb-2.5 text-xs text-meta">
        {period
          ? `Phones, ${formatSpanLabel({ start: period.firstDate, end: period.lastDate })}`
          : 'Phones, rolling 28-day field window'}
      </p>
      <StatStrip>
        <MetricCard
          label="Largest contentful paint"
          value={formatLcp(current.lcp.p75)}
          icon={<Timer className="size-3" />}
          accent={current.lcp.passed ? 'cobalt-tint' : 'warning'}
          context={`${current.lcp.passed ? 'Met' : 'Missed'} the ${formatLcp(current.lcp.threshold)} threshold`}
          contextTone={current.lcp.passed ? 'meta' : 'warning'}
        />
        <MetricCard
          label="Interaction to next paint"
          value={formatInp(current.inp.p75)}
          icon={<Gauge className="size-3" />}
          accent={current.inp.passed ? 'cobalt-tint' : 'warning'}
          context={`${current.inp.passed ? 'Met' : 'Missed'} the ${formatInp(current.inp.threshold)} threshold`}
          contextTone={current.inp.passed ? 'meta' : 'warning'}
        />
        <MetricCard
          label="Cumulative layout shift"
          value={formatCls(current.cls.p75)}
          icon={<ChartNoAxesColumn className="size-3" />}
          accent={current.cls.passed ? 'cobalt-tint' : 'warning'}
          context={`${current.cls.passed ? 'Met' : 'Missed'} the ${formatCls(current.cls.threshold)} threshold`}
          contextTone={current.cls.passed ? 'meta' : 'warning'}
        />
      </StatStrip>
    </Panel>
  )
}

function UptimeSection({ result }: { result: DashboardUptimeResult }) {
  if (!result.ok) {
    return <SourceStatePanel source="uptime" reason={result.reason} />
  }

  const data = result.current

  return (
    <Panel title="Uptime">
      {data.uptimePercentage === null ? (
        <p className="text-sm leading-relaxed text-body">
          {data.coverage === 'none'
            ? 'Uptime monitoring had not started in this window.'
            : `The monitor started mid-window on ${formatLongDate(data.monitorCreatedAt)}, so a full uptime percentage is not available.`}
        </p>
      ) : (
        <StatStrip>
          <MetricCard
            label="Uptime"
            value={formatUptime(data.uptimePercentage)}
            icon={<HeartPulse className="size-3" />}
            accent="cobalt-tint"
            context={
              data.coverage === 'partial'
                ? `Partial coverage. Monitor started ${formatLongDate(data.monitorCreatedAt)}.`
                : undefined
            }
          />
        </StatStrip>
      )}

      <div className="mt-4">
        <h3 className="text-[0.7rem] font-medium uppercase tracking-[0.18em] text-meta">
          Incidents
        </h3>
        {data.incidents.length === 0 ? (
          <p className="mt-2 text-sm leading-relaxed text-body">
            No downtime was recorded
            {data.coverage === 'partial' ? ' after monitoring started' : ''}.
          </p>
        ) : (
          <ul className="mt-2 divide-y divide-black/8">
            {data.incidents.map((incident) => (
              <li key={incident.startedAt} className="py-2 first:pt-0">
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
    </Panel>
  )
}

function SourceStatePanel({
  source,
  reason,
}: {
  source: SourceKey
  reason: string
}) {
  const title = SOURCE_LABELS[source]

  if (reason === 'not_configured') {
    return (
      <Panel title={title}>
        <p className="text-sm leading-relaxed text-body">
          {title} is not connected yet. This client needs {SOURCE_SETUP[source]}.
        </p>
      </Panel>
    )
  }

  return (
    <Panel title={title}>
      <PanelQueryError message={`${title} could not be loaded.`} />
    </Panel>
  )
}

function SourceChips({ sources }: { sources: ClientSources }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      <SourceChip label={SOURCE_LABELS.ga4} connected={sources.ga4} />
      <SourceChip label={SOURCE_LABELS.gsc} connected={sources.gsc} />
      <SourceChip label={SOURCE_LABELS.crux} connected={sources.crux} />
      <SourceChip label={SOURCE_LABELS.uptime} connected={sources.uptime} />
    </div>
  )
}

function SourceChip({
  label,
  connected,
}: {
  label: string
  connected: boolean
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-[0.65rem] tracking-wide',
        connected
          ? 'bg-positive-soft font-medium text-positive'
          : 'bg-black/[0.05] font-medium text-meta',
      )}
    >
      <span
        className={cn(
          'size-1.5 shrink-0 rounded-full',
          connected ? 'bg-positive' : 'bg-meta/40',
        )}
        aria-hidden
      />
      {connected ? label : `${label} not set`}
    </span>
  )
}

function CareTierChip({ tier }: { tier: IntelClient['careTier'] }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-[0.65rem] tracking-wide',
        tier === 'care'
          ? 'bg-cobalt-soft font-medium text-foreground'
          : 'bg-black/[0.05] font-medium text-meta',
      )}
    >
      <span
        className={cn(
          'size-1.5 shrink-0 rounded-full',
          tier === 'care' ? 'bg-cobalt-primary' : 'bg-meta/40',
        )}
        aria-hidden
      />
      {CARE_TIER_LABEL[tier]}
    </span>
  )
}

function switcherOptions(
  clients: readonly IntelClient[],
  currentId: string,
  currentName: string,
): Array<{ id: string; name: string }> {
  const options = clients.map((client) => ({
    id: client.id,
    name: client.name,
  }))
  if (options.some((option) => option.id === currentId)) {
    return options
  }
  return [{ id: currentId, name: currentName }, ...options]
}

function countDelta(
  current: number,
  previous: number | null | undefined,
): DeltaFields | undefined {
  if (previous === null || previous === undefined || previous <= 0) {
    return undefined
  }

  const relative = formatPercentAgainstMeaningfulBase(current, previous)
  return {
    deltaLabel:
      current === previous ? '0%' : (relative ?? formatSignedCount(current - previous)),
    deltaDirection: numericDirection(current, previous),
  }
}

function ratioPointDelta(
  current: number,
  previous: number | null | undefined,
): DeltaFields | undefined {
  if (previous === null || previous === undefined || previous <= 0) {
    return undefined
  }

  const deltaPoints = (current - previous) * 100
  return {
    deltaLabel:
      deltaPoints === 0 ? '0' : `${formatSignedNumber(deltaPoints, 1)} pt`,
    deltaDirection: numericDirection(current, previous),
  }
}

function unitDelta(
  current: number,
  previous: number | null | undefined,
): DeltaFields | undefined {
  if (previous === null || previous === undefined || previous <= 0) {
    return undefined
  }

  const delta = current - previous
  return {
    deltaLabel: delta === 0 ? '0' : formatSignedNumber(delta, 1),
    deltaDirection: numericDirection(current, previous),
  }
}

function numericDirection(
  current: number,
  previous: number,
): MetricDeltaDirection {
  if (current > previous) {
    return 'up'
  }
  if (current < previous) {
    return 'down'
  }
  return 'flat'
}

function formatSignedCount(value: number): string {
  const abs = formatInteger(Math.abs(value))
  if (value > 0) {
    return `+${abs}`
  }
  if (value < 0) {
    return `−${abs}`
  }
  return '0'
}

function formatSignedNumber(value: number, digits: number): string {
  const abs = Math.abs(value).toFixed(digits)
  if (value > 0) {
    return `+${abs}`
  }
  if (value < 0) {
    return `−${abs}`
  }
  return (0).toFixed(digits)
}
