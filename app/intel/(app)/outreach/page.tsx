import type { Metadata } from 'next'
import Link from 'next/link'

import { AcceptedLeads } from '@/app/intel/_components/outreach/AcceptedLeads'
import { Panel } from '@/app/intel/_components/ui/Panel'
import { WebsiteCheckRunChip } from '@/app/intel/_components/ui/StatusChip'
import { requireIntelUser } from '@/lib/auth/allowlist'
import { loadLatestContactRun, loadWorklistContacts } from '@/lib/outreach/contacts/load'
import type { ContactRunRow } from '@/lib/outreach/contacts/store'
import { localDayStartIso } from '@/lib/outreach/dates'
import { createOutreachStore } from '@/lib/outreach/deps'
import { createGmailConnectionStore, readGmailConfig } from '@/lib/outreach/gmail/deps'
import { OUTREACH_SETTINGS_PATH } from '@/lib/outreach/gmail/flash'
import { connectionView, type ConnectionView } from '@/lib/outreach/gmail/view'
import { leadHref } from '@/lib/outreach/links'
import { OUTREACH_DAILY_SEND_LIMIT, OUTREACH_SUBJECT_LABELS, SENT_PER_DAY_NOTE, type OutreachStatus } from '@/lib/outreach/params'
import type { OutreachDraft, OutreachSettings, SubjectState, Suppression } from '@/lib/outreach/types'
import { CollapsedSection } from '@/app/intel/_components/ui/CollapsedSection'
import { loadCallSummaries } from '@/lib/outreach/calls-store'
import { loadLeadFacts } from '@/lib/outreach/lead-facts'
import {
  acceptedLeadRows,
  closedLeadRows,
  type ClosedRow,
  type WorklistLeadInput,
  contactCounts,
  contactSummaryLine,
  groupSent,
  setupNotice,
  type ContactCounts,
  type SentGroup,
  type WorklistContactInput,
  type WorklistRow,
} from '@/lib/outreach/worklist'
import { formatShortDate } from '@/lib/prospects/params'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Outreach',
  robots: { index: false, follow: false },
}

const DRAFTS_LIMIT = 300
const SENT_LIMIT = 2000

type Loaded =
  | {
      ok: true
      settings: OutreachSettings | null
      drafts: OutreachDraft[]
      sent: OutreachDraft[]
      states: SubjectState[]
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
    const [settings, drafts, sent, states, suppressions, sentToday, gmailSentToday, connection] = await Promise.all([
      store.getSettings(),
      store.listDrafts(DRAFTS_LIMIT),
      store.listSent(SENT_LIMIT),
      store.listSubjectStates(),
      store.listSuppressions(),
      store.countSentSince(dayStart),
      store.countGmailSentSince(dayStart),
      createGmailConnectionStore().get(),
    ])
    return { ok: true, settings, drafts, sent, states, suppressions, sentToday, gmailSentToday, connection: connectionView(readGmailConfig(), connection, settings?.replyToEmail ?? null) }
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
]

function groupDate(draft: OutreachDraft, status: OutreachStatus): string {
  const iso = status === 'approved' ? draft.approvedAt : draft.updatedAt
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

/** One line per business: its latest email, the date it went out, and how many there are. */
function SentList({ groups }: { groups: SentGroup[] }) {
  if (groups.length === 0) return <p className="intel-body text-body">No emails sent yet.</p>
  return (
    <ul className="divide-y divide-black/8">
      {groups.map((group) => (
        <li
          key={`${group.subjectType}:${group.subjectRef}`}
          className="grid min-w-0 gap-x-4 gap-y-0.5 py-2.5 first:pt-0 last:pb-0 @min-[44rem]:grid-cols-[minmax(0,14rem)_minmax(0,1fr)_auto]"
        >
          <div className="min-w-0">
            <Link
              href={leadHref(group)}
              className="intel-body font-medium text-foreground transition-colors hover:text-cobalt-primary [overflow-wrap:anywhere]"
            >
              {group.leadName}
            </Link>
            <p className="intel-secondary text-meta">{OUTREACH_SUBJECT_LABELS[group.subjectType]}</p>
          </div>
          <div className="min-w-0">
            <Link
              href={`/intel/outreach/${group.latestId}`}
              className="block truncate intel-body text-cobalt-text underline-offset-2 hover:underline"
            >
              {group.latestSubject}
            </Link>
            {group.count > 1 ? <p className="intel-secondary text-meta">{group.count} emails</p> : null}
          </div>
          <p className="whitespace-nowrap intel-secondary text-meta">Sent {formatShortDate(group.latestSentAt)}</p>
        </li>
      ))}
    </ul>
  )
}

/** Accepted leads with a contact address, how many wait to be checked, and the latest contact run. */
function ContactLine({ counts, latestRun }: { counts: ContactCounts | null; latestRun: ContactRunRow | null }) {
  if (counts === null) {
    return <p className="mt-1 intel-secondary text-meta">Contact addresses are not available yet. Migration 0034 may not be applied.</p>
  }
  return (
    <div className="mt-1 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
      <p className="intel-secondary text-meta">{contactSummaryLine(counts)}</p>
      {latestRun !== null ? (
        <span className="inline-flex items-center gap-2">
          <span className="intel-secondary text-meta">Last check:</span>
          <WebsiteCheckRunChip state={latestRun.state} />
        </span>
      ) : null}
    </div>
  )
}

export default async function OutreachPage() {
  await requireIntelUser()
  const [data, latest, worklist, facts, calls] = await Promise.all([
    load(),
    loadLatestContactRun(),
    loadWorklistContacts(),
    loadLeadFacts(),
    loadCallSummaries(),
  ])
  // Each accepted lead with its phone and whether it has a specific finding.
  const leads: WorklistLeadInput[] | null =
    worklist !== null && facts !== null
      ? worklist.leads.map((lead) => {
          const fact = facts.get(`${lead.subjectType}:${lead.subjectRef}`)
          return { ...lead, phone: fact?.phone ?? null, hasFinding: fact?.hasFinding ?? false }
        })
      : null

  const notice = data.ok ? setupNotice(data.settings, data.connection) : null
  const contactInputs: WorklistContactInput[] | null =
    worklist?.contacts?.map((contact) => ({
      subjectType: contact.subjectType,
      subjectRef: contact.subjectRef,
      status: contact.status,
      email: contact.email,
      waiting: contact.heldByRunId !== null,
    })) ?? null
  const leadRows: WorklistRow[] | null =
    data.ok && worklist !== null && leads !== null
      ? acceptedLeadRows({
          leads,
          states: data.states,
          contacts: contactInputs,
          suppressions: data.suppressions,
          generalRunQueued: worklist.generalRunQueued,
          calls,
        })
      : null
  const closedRows = leads !== null ? closedLeadRows(leads, calls) : []
  // The same states as the list, over every accepted lead. null when contact addresses cannot be read.
  const counts =
    worklist !== null && contactInputs !== null && latest !== null
      ? contactCounts({ leads: worklist.leads, contacts: contactInputs, generalRunQueued: worklist.generalRunQueued })
      : null

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div className="flex min-w-0 flex-wrap items-start justify-between gap-x-6 gap-y-2">
        <div className="min-w-0">
          <h1 className="intel-title text-foreground">Outreach</h1>
          <p className="mt-1 intel-secondary text-meta">
            First-contact emails for accepted leads. Draft one, approve it, then send it from the dashboard when Google is
            connected, or from your own mail app and mark it as sent. Nothing is sent without your click.
          </p>
        </div>
        <Link
          href={OUTREACH_SETTINGS_PATH}
          className="-mx-1 shrink-0 rounded px-1 intel-body font-medium text-cobalt-text underline-offset-2 transition-colors hover:bg-cobalt-soft hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt-focus"
        >
          Outreach settings
        </Link>
      </div>

      {notice !== null ? (
        <p className="intel-body text-warning-severe" role="status">
          {notice}{' '}
          <Link href={OUTREACH_SETTINGS_PATH} className="font-medium underline underline-offset-2">
            Open Outreach settings
          </Link>
        </p>
      ) : null}

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
            <ContactLine counts={counts} latestRun={latest?.latestRun ?? null} />
          </Panel>

          <Panel title={leadRows === null ? 'Accepted leads' : `Accepted leads · ${leadRows.length}`}>
            {leadRows === null ? (
              <p className="intel-body text-body" role="alert">
                Unable to load accepted leads. Try again shortly.
              </p>
            ) : (
              <AcceptedLeads rows={leadRows} />
            )}
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

          <SentPanel sent={data.sent} />

          {closedRows.length > 0 ? (
            <CollapsedSection title="Closed" status={closedRows.length === 1 ? '1 lead closed after a call' : `${closedRows.length} leads closed after a call`}>
              <ClosedList rows={closedRows} />
            </CollapsedSection>
          ) : null}
        </>
      )}
    </div>
  )
}

/** Leads a call closed, with the reason. */
function ClosedList({ rows }: { rows: ClosedRow[] }) {
  return (
    <ul className="divide-y divide-black/8">
      {rows.map((row) => (
        <li key={`${row.subjectType}:${row.subjectRef}`} className="flex min-w-0 flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 py-2 first:pt-0 last:pb-0">
          <div className="min-w-0">
            <Link href={leadHref(row)} className="intel-body font-medium text-foreground transition-colors hover:text-cobalt-primary [overflow-wrap:anywhere]">
              {row.name}
            </Link>
            <p className="intel-secondary text-meta">{OUTREACH_SUBJECT_LABELS[row.subjectType]}</p>
          </div>
          <p className="intel-secondary text-meta">
            {row.reason}, {formatShortDate(row.closedAt)}
          </p>
        </li>
      ))}
    </ul>
  )
}

function SentPanel({ sent }: { sent: OutreachDraft[] }) {
  const groups = groupSent(sent)
  return (
    <Panel title={`Sent · ${groups.length}`}>
      <div className="@container">
        <SentList groups={groups} />
      </div>
    </Panel>
  )
}
