import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import Link from 'next/link'

import { GoogleConnection } from '@/app/intel/_components/outreach/GoogleConnection'
import { OutreachSettingsForm } from '@/app/intel/_components/outreach/OutreachSettingsForm'
import { SuppressionList } from '@/app/intel/_components/outreach/SuppressionList'
import { Panel } from '@/app/intel/_components/ui/Panel'
import { WebsiteCheckRunChip } from '@/app/intel/_components/ui/StatusChip'
import { requireIntelUser } from '@/lib/auth/allowlist'
import { loadContactSummary, type ContactSummary } from '@/lib/outreach/contacts/load'
import { contactSummaryLine } from '@/lib/outreach/contacts/view'
import { localDayStartIso } from '@/lib/outreach/dates'
import { createOutreachStore } from '@/lib/outreach/deps'
import { createGmailConnectionStore, readGmailConfig } from '@/lib/outreach/gmail/deps'
import { RESULT_COOKIE, RESULT_PARAM, decodeNotice, type ConnectionNotice } from '@/lib/outreach/gmail/flash'
import { connectionView, type ConnectionView } from '@/lib/outreach/gmail/view'
import { leadHref } from '@/lib/outreach/links'
import { OUTREACH_DAILY_SEND_LIMIT, OUTREACH_SUBJECT_LABELS, SENT_PER_DAY_NOTE, type OutreachStatus } from '@/lib/outreach/params'
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
  | {
      ok: true
      settings: OutreachSettings | null
      drafts: OutreachDraft[]
      suppressions: Suppression[]
      sentToday: number
      gmailSentToday: number
      connection: ConnectionView
    }
  | { ok: false }

async function load(): Promise<Loaded> {
  try {
    const store = createOutreachStore()
    const dayStart = localDayStartIso(new Date())
    const [settings, drafts, suppressions, sentToday, gmailSentToday, connection] = await Promise.all([
      store.getSettings(),
      store.listDrafts(DRAFTS_LIMIT),
      store.listSuppressions(),
      store.countSentSince(dayStart),
      store.countGmailSentSince(dayStart),
      createGmailConnectionStore().get(),
    ])
    return { ok: true, settings, drafts, suppressions, sentToday, gmailSentToday, connection: connectionView(readGmailConfig(), connection, settings?.replyToEmail ?? null) }
  } catch {
    console.error('Outreach page load failed')
    return { ok: false }
  }
}

type Group = { statuses: OutreachStatus[]; title: string; empty: string; dateLabel: string; hideWhenEmpty?: boolean }

const GROUPS: Group[] = [
  { statuses: ['draft'], title: 'Needs review', empty: 'No drafts need review.', dateLabel: 'Updated' },
  { statuses: ['approved'], title: 'Approved', empty: 'No approved emails waiting to be sent.', dateLabel: 'Approved' },
  // A send in flight, or one whose delivery Google did not confirm.
  { statuses: ['sending', 'send_unconfirmed'], title: 'Not confirmed', empty: '', dateLabel: 'Updated', hideWhenEmpty: true },
  { statuses: ['sent'], title: 'Sent', empty: 'No emails sent yet.', dateLabel: 'Sent' },
]

/** The connection result, shown once after Google sends the owner back. */
async function connectionNotice(searchParams: Promise<Record<string, string | string[] | undefined>>): Promise<ConnectionNotice | null> {
  if ((await searchParams)[RESULT_PARAM] !== '1') return null
  return decodeNotice((await cookies()).get(RESULT_COOKIE)?.value)
}

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

/** Accepted leads with a contact address, how many wait to be checked, and the latest contact run. */
function ContactLine({ summary }: { summary: ContactSummary | null }) {
  if (summary === null) {
    return <p className="mt-1 intel-secondary text-meta">Contact addresses are not available yet. Migration 0034 may not be applied.</p>
  }
  return (
    <div className="mt-1 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
      <p className="intel-secondary text-meta">{contactSummaryLine(summary)}</p>
      {summary.latestRun !== null ? <WebsiteCheckRunChip state={summary.latestRun.state} /> : null}
    </div>
  )
}

export default async function OutreachPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireIntelUser()
  const [data, notice, contacts] = await Promise.all([load(), connectionNotice(searchParams), loadContactSummary()])

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div className="min-w-0">
        <h1 className="intel-title text-foreground">Outreach</h1>
        <p className="mt-1 intel-secondary text-meta">
          First-contact emails for accepted leads. Approve a draft, then send it from the dashboard when Google is connected,
          or from your own mail app and mark it as sent. Nothing is sent without your click.
        </p>
      </div>

      {!data.ok ? (
        <Panel>
          <p className="intel-body leading-relaxed text-body" role="alert">
            Unable to load Outreach. Try again shortly. If this is the first visit since the update, migration 0033 may not
            be applied yet.
          </p>
        </Panel>
      ) : (
        <>
          <Panel title="Today">
            <p className="intel-body text-body">
              {data.sentToday === 1 ? '1 email' : `${data.sentToday.toLocaleString('en-US')} emails`} sent today.
            </p>
            {data.connection.state === 'connected' || data.gmailSentToday > 0 ? (
              <p className="mt-1 intel-secondary text-meta">
                {data.gmailSentToday} of {OUTREACH_DAILY_SEND_LIMIT} sent from the dashboard today.
              </p>
            ) : null}
            {data.sentToday > SENT_PER_DAY_NOTE ? (
              <p className="mt-1 intel-secondary text-meta">
                That is more than {SENT_PER_DAY_NOTE} in one day. Many first-contact emails from one mailbox in a day can get it
                flagged as spam, so it may be worth spreading the rest over the week.
              </p>
            ) : null}
            <ContactLine summary={contacts} />
            {missingSettings(data.settings).length > 0 ? (
              <p className="mt-1 intel-secondary text-warning-severe">{missingSettingsMessage(missingSettings(data.settings))}</p>
            ) : null}
          </Panel>

          {GROUPS.map((group) => {
            const drafts = data.drafts.filter((draft) => group.statuses.includes(draft.status))
            if (drafts.length === 0 && group.hideWhenEmpty) return null
            return (
              <Panel key={group.title} title={`${group.title} · ${drafts.length}`}>
                <div className="@container">
                  <DraftList drafts={drafts} status={group.statuses[0]!} empty={group.empty} dateLabel={group.dateLabel} />
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
            <Panel title="Direct sending">
              <GoogleConnection view={data.connection} notice={notice} />
            </Panel>
          </div>
        </>
      )}
    </div>
  )
}
