import type { Metadata } from 'next'
import Link from 'next/link'

import { BriefingView } from '@/app/intel/_components/briefing/BriefingView'
import { GenerateBriefingButton } from '@/app/intel/_components/briefing/GenerateBriefingButton'
import { Panel } from '@/app/intel/_components/ui/Panel'
import { requireIntelUser } from '@/lib/auth/allowlist'
import {
  formatBriefingDate,
  formatLocalTimestamp,
  isBriefingDate,
  localDateString,
} from '@/lib/briefing/dates'
import { briefingFailedMessage } from '@/lib/briefing/messages'
import { createBriefingStore } from '@/lib/briefing/store'

export const dynamic = 'force-dynamic'
// Generate now runs the briefing through a server action on this route: one
// model call with a 45 second timeout and one retry, plus the read-only
// loaders. This matches the briefing cron route.
export const maxDuration = 120

export const metadata: Metadata = {
  title: 'Briefing',
  robots: { index: false, follow: false },
}

const HISTORY_LIMIT = 14

const STATUS_LABELS: Record<string, string> = {
  complete: 'Complete',
  no_narrative: 'No summary',
  failed: 'Failed',
}

type BriefingPageProps = {
  searchParams: Promise<{ date?: string | string[] }>
}

export default async function IntelBriefingPage({ searchParams }: BriefingPageProps) {
  await requireIntelUser()

  const raw = (await searchParams).date
  const requested = typeof raw === 'string' && isBriefingDate(raw) ? raw : null
  const today = localDateString(new Date())

  const store = createBriefingStore()
  let loadFailed = false
  let briefing = null
  let history: Awaited<ReturnType<typeof store.listRecent>> = []
  try {
    ;[briefing, history] = await Promise.all([
      requested ? store.getByDate(requested) : store.getLatest(),
      store.listRecent(HISTORY_LIMIT),
    ])
  } catch {
    loadFailed = true
  }

  const hasToday = history.some((h) => h.briefingDate === today)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="intel-title text-foreground">Briefing</h1>
          <p className="mt-1 intel-secondary text-meta">
            {briefing
              ? `${formatBriefingDate(briefing.briefingDate)} · generated ${formatLocalTimestamp(briefing.generatedAt)}`
              : 'Daily at 7:00 AM Pacific.'}
          </p>
        </div>
        <GenerateBriefingButton hasToday={hasToday} />
      </div>

      {loadFailed ? (
        <Panel>
          <p className="intel-body leading-relaxed text-body" role="alert">
            Unable to load briefings. Try again shortly.
          </p>
        </Panel>
      ) : briefing === null ? (
        <Panel>
          <p className="intel-body leading-relaxed text-body">
            {requested
              ? `No briefing for ${formatBriefingDate(requested)}.`
              : 'No briefings yet. The first one is generated at 7:00 AM Pacific, or use Generate now.'}
          </p>
        </Panel>
      ) : (
        <>
          {briefing.status === 'failed' ? (
            <Panel accent="warning-severe">
              <p className="intel-body text-warning-severe" role="alert">
                {briefingFailedMessage(briefing.error)}
              </p>
            </Panel>
          ) : null}
          <BriefingView briefing={briefing} />
        </>
      )}

      <Panel title="History">
        {history.length === 0 ? (
          <p className="intel-body text-body">No briefings yet.</p>
        ) : (
          <ul className="divide-y divide-black/8 intel-body">
            {history.map((h) => {
              const current = briefing?.briefingDate === h.briefingDate
              return (
                <li key={h.briefingDate} className="flex flex-wrap items-baseline justify-between gap-2 py-2">
                  <Link
                    href={`/intel/briefing?date=${h.briefingDate}`}
                    aria-current={current ? 'page' : undefined}
                    className={
                      current
                        ? 'font-medium text-foreground'
                        : 'text-foreground transition-colors hover:text-cobalt-primary'
                    }
                  >
                    {formatBriefingDate(h.briefingDate)}
                  </Link>
                  <span className={h.status === 'failed' ? 'text-warning-severe' : 'text-meta'}>
                    {STATUS_LABELS[h.status] ?? h.status}
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </Panel>
    </div>
  )
}
