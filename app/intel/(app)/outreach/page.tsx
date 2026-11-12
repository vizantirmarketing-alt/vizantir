import type { Metadata } from 'next'
import Link from 'next/link'

import { OutreachSettingsForm } from '@/app/intel/_components/outreach/OutreachSettingsForm'
import { SuppressionList } from '@/app/intel/_components/outreach/SuppressionList'
import { Panel } from '@/app/intel/_components/ui/Panel'
import { requireIntelUser } from '@/lib/auth/allowlist'
import { localDayStartIso } from '@/lib/outreach/dates'
import { createOutreachStore } from '@/lib/outreach/deps'
import { leadHref } from '@/lib/outreach/links'
import { OUTREACH_SUBJECT_LABELS, SENT_PER_DAY_NOTE, type OutreachStatus } from '@/lib/outreach/params'
import { missingSettings, missingSettingsMessage } from '@/lib/outreach/settings'
import type { OutreachDraft, OutreachSettings, Suppression } from '@/lib/outreach/types'
import { formatShortDate } from '@/lib/prospects/params'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Outreach',
  robots: { index: false, follow: false },
}

const DRAFTS_LIMIT = 300

type Loaded =
  | { ok: true; settings: OutreachSettings | null; drafts: OutreachDraft[]; suppressions: Suppression[]; sentToday: number }
  | { ok: false }

async function load(): Promise<Loaded> {
  try {
    const store = createOutreachStore()
    const [settings, drafts, suppressions, sentToday] = await Promise.all([
      store.getSettings(),
      store.listDrafts(DRAFTS_LIMIT),
      store.listSuppressions(),
      store.countSentSince(localDayStartIso(new Date())),
    ])
    return { ok: true, settings, drafts, suppressions, sentToday }
  } catch {
    console.error('Outreach page load failed')
    return { ok: false }
  }
}

const GROUPS: { status: Exclude<OutreachStatus, 'discarded'>; title: string; empty: string; dateLabel: string }[] = [
  { status: 'draft', title: 'Needs review', empty: 'No drafts need review.', dateLabel: 'Updated' },
  { status: 'approved', title: 'Approved', empty: 'No approved emails waiting to be sent.', dateLabel: 'Approved' },
  { status: 'sent', title: 'Sent', empty: 'No emails marked as sent yet.', dateLabel: 'Sent' },
]

function groupDate(draft: OutreachDraft, status: OutreachStatus): string {
  const iso = status === 'approved' ? draft.approvedAt : status === 'sent' ? draft.sentAt : draft.updatedAt
  return formatShortDate(iso)
}

/** One status group. Stacks into lines on narrow panels, so nothing scrolls sideways at 1024px. */
function DraftList({ drafts, status, empty, dateLabel }: { drafts: OutreachDraft[]; status: OutreachStatus; empty: string; dateLabel: string }) {
  if (drafts.length === 0) return <p className="intel-body text-body">{empty}</p>
  return (
    <ul className="divide-y divide-black/8">
      {drafts.map((draft) => (
        <li key={draft.id} className="grid min-w-0 gap-x-4 gap-y-0.5 py-2.5 first:pt-0 last:pb-0 @min-[44rem]:grid-cols-[minmax(0,14rem)_minmax(0,1fr)_auto]">
          <div className="min-w-0">
            <Link
              href={leadHref(draft)}
              className="intel-body font-medium text-foreground transition-colors hover:text-cobalt-primary [overflow-wrap:anywhere]"
            >
              {draft.leadName}
            </Link>
            <p className="intel-secondary text-meta">{OUTREACH_SUBJECT_LABELS[draft.subjectType]}</p>
          </div>
          <div className="min-w-0">
            <Link
              href={`/intel/outreach/${draft.id}`}
              className="block truncate intel-body text-cobalt-text underline-offset-2 hover:underline"
            >
              {draft.subject}
            </Link>
            <p className="truncate intel-secondary text-meta">{draft.toEmail ?? 'No recipient yet'}</p>
          </div>
          <p className="whitespace-nowrap intel-secondary text-meta">
            {dateLabel} {groupDate(draft, status)}
          </p>
        </li>
      ))}
    </ul>
  )
}

export default async function OutreachPage() {
  await requireIntelUser()
  const data = await load()

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div className="min-w-0">
        <h1 className="intel-title text-foreground">Outreach</h1>
        <p className="mt-1 intel-secondary text-meta">
          First-contact emails for accepted leads. Nothing is sent from here: approve a draft, then send it from your own
          mail app and mark it as sent.
        </p>
      </div>

      {!data.ok ? (
        <Panel>
          <p className="intel-body leading-relaxed text-body" role="alert">
            Unable to load Outreach. Try again shortly. If this is the first visit since the update, migration 0032 may not
            be applied yet.
          </p>
        </Panel>
      ) : (
        <>
          <Panel title="Today">
            <p className="intel-body text-body">
              {data.sentToday === 1 ? '1 email' : `${data.sentToday.toLocaleString('en-US')} emails`} marked as sent today.
            </p>
            {data.sentToday > SENT_PER_DAY_NOTE ? (
              <p className="mt-1 intel-secondary text-meta">
                That is more than {SENT_PER_DAY_NOTE} in one day. Many first-contact emails from one mailbox in a day can get it
                flagged as spam, so it may be worth spreading the rest over the week.
              </p>
            ) : null}
            {missingSettings(data.settings).length > 0 ? (
              <p className="mt-1 intel-secondary text-warning-severe">{missingSettingsMessage(missingSettings(data.settings))}</p>
            ) : null}
          </Panel>

          {GROUPS.map((group) => {
            const drafts = data.drafts.filter((draft) => draft.status === group.status)
            return (
              <Panel key={group.status} title={`${group.title} · ${drafts.length}`}>
                <div className="@container">
                  <DraftList drafts={drafts} status={group.status} empty={group.empty} dateLabel={group.dateLabel} />
                </div>
              </Panel>
            )
          })}

          <div className="grid min-w-0 gap-4 xl:grid-cols-2 [&>*]:min-w-0">
            <Panel title="Settings">
              <div className="@container">
                <OutreachSettingsForm settings={data.settings} />
              </div>
            </Panel>
            <Panel title="Do not contact">
              <SuppressionList entries={data.suppressions} />
            </Panel>
          </div>
        </>
      )}
    </div>
  )
}
