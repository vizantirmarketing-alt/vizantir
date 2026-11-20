import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

import { PhoneLink } from '@/app/intel/_components/outreach/AcceptedLeads'
import { ClosedDraftDiscard } from '@/app/intel/_components/outreach/ClosedDraftDiscard'
import { DraftCallAction } from '@/app/intel/_components/outreach/DraftCallAction'
import { closedByCalls, closedLeadRefusal } from '@/lib/outreach/calls'
import { callsReadableFor, createCallStore } from '@/lib/outreach/calls-store'
import { draftCallPhone } from '@/lib/outreach/worklist'
import { DraftEditorArea } from '@/app/intel/_components/outreach/DraftEditorArea'
import { loadLeadPhone } from '@/lib/outreach/lead-facts'
import { DraftWarnings } from '@/app/intel/_components/outreach/DraftWarnings'
import { WrittenFromPanel } from '@/app/intel/_components/outreach/WrittenFromPanel'
import { Panel } from '@/app/intel/_components/ui/Panel'
import { OutreachStatusChip } from '@/app/intel/_components/ui/StatusChip'
import { requireIntelUser } from '@/lib/auth/allowlist'
import { formatLocalTimestamp } from '@/lib/briefing/dates'
import { buildOutreachContext, outreachBasis, type BasisItem } from '@/lib/outreach/context'
import { localDayStartIso } from '@/lib/outreach/dates'
import { createOutreachStore } from '@/lib/outreach/deps'
import { createGmailConnectionStore, readGmailConfig } from '@/lib/outreach/gmail/deps'
import { draftFooter, footerOutdated } from '@/lib/outreach/settings'
import { connectionView } from '@/lib/outreach/gmail/view'
import { loadContactStatus, loadDraftContact } from '@/lib/outreach/contacts/load'
import { isStaleSending } from '@/lib/outreach/lifecycle'
import { loadBusinessLead, loadProspectLead } from '@/lib/outreach/leads'
import { SAVED_PARAM, leadHref } from '@/lib/outreach/links'
import { OUTREACH_DAILY_SEND_LIMIT, OUTREACH_SUBJECT_LABELS, normalizeEmail } from '@/lib/outreach/params'
import type { GmailConnection, OutreachDraft, OutreachSettings } from '@/lib/outreach/types'
import { writingRulesFinding, type RulesFinding } from '@/lib/outreach/rules-check'
import { checkVoice, refusalReasons, voiceWarnings, voiceContextFor } from '@/lib/outreach/voice'
import { formatShortDate, isUuid } from '@/lib/prospects/params'

export const dynamic = 'force-dynamic'
// Draft again makes the one model call through a server action on this
// route: a 45 second timeout with one SDK retry, and one rules retry.
// Approve and send makes one token request (15 seconds) and one Gmail
// request (20 seconds) through a server action on this route too.
export const maxDuration = 120

export const metadata: Metadata = {
  title: 'Outreach draft',
  robots: { index: false, follow: false },
}

type PageProps = { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }

function BackLink() {
  return (
    <Link
      href="/intel/outreach"
      className="inline-flex items-baseline gap-1 intel-body text-foreground transition-colors hover:text-cobalt-primary"
    >
      <ArrowLeft className="size-[1em]" aria-hidden />
      Outreach
    </Link>
  )
}

/**
 * From the lead as it is now: the basis, by the same selection the drafting
 * uses, the warnings for this draft's text against it, and what the hard
 * rules find in it (the same check approve and send run, against the lead
 * already loaded here, so no extra query). Nothing is stored. null when the
 * lead cannot be loaded.
 */
async function reviewFor(draft: OutreachDraft, studioName: string): Promise<{ basis: BasisItem[]; warnings: string[]; rules: RulesFinding } | null> {
  const loaded = draft.subjectType === 'prospect' ? await loadProspectLead(draft.leadId) : await loadBusinessLead(draft.leadId)
  if (!loaded.ok) return null
  const context = voiceContextFor(buildOutreachContext(loaded.lead), studioName)
  const text = { subject: draft.subject, body: draft.body }
  return {
    basis: outreachBasis(loaded.lead),
    warnings: voiceWarnings(text, context),
    rules: await writingRulesFinding(async () => refusalReasons(checkVoice(text, context)), draft),
  }
}

/** The business's sent emails. A failed read shows none, and the send itself checks again on the server. */
async function sentFor(draft: OutreachDraft): Promise<OutreachDraft[]> {
  try {
    return await createOutreachStore().sentFor(draft.subjectType, draft.subjectRef)
  } catch {
    return []
  }
}

function history(draft: OutreachDraft): string {
  const parts = [`Written ${formatLocalTimestamp(draft.createdAt)}`]
  if (draft.approvedAt !== null) parts.push(`approved ${formatLocalTimestamp(draft.approvedAt)}`)
  if (draft.sentAt !== null) parts.push(`sent ${formatLocalTimestamp(draft.sentAt)}`)
  return parts.join(' · ')
}

export default async function OutreachDraftPage({ params, searchParams }: PageProps) {
  await requireIntelUser()
  const { id } = await params
  // Set by the first save of a hand-written draft, which opens this page.
  const justSaved = (await searchParams)[SAVED_PARAM] === '1'
  if (!isUuid(id)) notFound()

  let draft: OutreachDraft | null
  let settings: OutreachSettings | null = null
  let connection: GmailConnection | null = null
  let gmailSentToday = 0
  try {
    const store = createOutreachStore()
    ;[draft, settings, connection, gmailSentToday] = await Promise.all([
      store.getDraft(id),
      store.getSettings(),
      createGmailConnectionStore().get(),
      store.countGmailSentSince(localDayStartIso(new Date())),
    ])
  } catch {
    console.error('Outreach draft load failed')
    return (
      <div className="flex min-w-0 flex-col gap-4">
        <BackLink />
        <Panel>
          <p className="intel-body leading-relaxed text-body" role="alert">
            Unable to load this draft. Try again shortly.
          </p>
        </Panel>
      </div>
    )
  }
  if (draft === null) notFound()
  const [review, contact, sentToBusiness, phone, contactStatus, callsReadable, closedBy] = await Promise.all([
    reviewFor(draft, settings?.studioName ?? ''),
    draft.status === 'discarded' ? Promise.resolve(null) : loadDraftContact(draft.subjectType, draft.subjectRef),
    sentFor(draft),
    loadLeadPhone(draft.subjectType, draft.subjectRef, draft.leadId),
    loadContactStatus(draft.subjectType, draft.subjectRef),
    draft.status === 'draft' ? callsReadableFor(draft) : Promise.resolve(false),
    draft.status === 'draft' || draft.status === 'approved' ? closedByCalls(createCallStore(), draft) : Promise.resolve(null),
  ])
  // A draft that needs review and has no recipient keeps Log a call when no address is published.
  const callPhone = draft.status === 'draft' ? draftCallPhone({ toEmail: draft.toEmail, contactStatus, phone, callsReadable, closed: closedBy !== null }) : null
  // Every other email sent to this business, newest first.
  const otherSent = sentToBusiness.filter((row) => row.id !== draft.id)
  const alreadyEmailedOn =
    otherSent.length > 0 && draft.status !== 'sent' && draft.status !== 'discarded' ? formatShortDate(otherSent[0]!.sentAt) : null
  const view = connectionView(readGmailConfig(), connection, settings?.replyToEmail ?? null)
  // Emails go out as the reply-to address, which may be an alias of the connected account.
  const sendAs = settings?.replyToEmail ? normalizeEmail(settings.replyToEmail) : view.state === 'connected' ? view.email : ''
  const sending =
    view.state === 'connected'
      ? { from: settings?.senderName ? `${settings.senderName} <${sendAs}>` : sendAs, sentToday: gmailSentToday, limit: OUTREACH_DAILY_SEND_LIMIT }
      : null
  // A send whose request ended without recording an outcome reads as not confirmed.
  const staleSending = isStaleSending(draft, new Date().toISOString())

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <BackLink />
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="intel-title text-foreground [overflow-wrap:anywhere]">{draft.leadName}</h1>
          <OutreachStatusChip status={staleSending ? 'send_unconfirmed' : draft.status} />
        </div>
        <p className="mt-1 intel-secondary text-meta">
          {OUTREACH_SUBJECT_LABELS[draft.subjectType]} ·{' '}
          <Link href={leadHref(draft)} className="text-cobalt-text underline-offset-2 hover:underline">
            Open the lead
          </Link>{' '}
          · {history(draft)}
        </p>
        {callPhone !== null ? (
          <div className="mt-1">
            <DraftCallAction lead={{ subjectType: draft.subjectType, subjectRef: draft.subjectRef, leadId: draft.leadId, name: draft.leadName }} phone={callPhone} />
          </div>
        ) : phone !== null ? (
          <p className="mt-0.5 intel-secondary text-meta">
            Phone: <PhoneLink phone={phone} />
          </p>
        ) : null}
      </div>

      {draft.status === 'discarded' ? (
        <p className="intel-body text-body">This draft was discarded. It is kept for the record and cannot be changed.</p>
      ) : null}

      <WrittenFromPanel items={review?.basis ?? null} />
      {review !== null && review.warnings.length > 0 && draft.status !== 'discarded' ? <DraftWarnings warnings={review.warnings} /> : null}

      {closedBy !== null && (draft.status === 'draft' || draft.status === 'approved') ? (
        // A closed lead's unsent draft: read only, with Discard draft as the one action.
        <Panel title="Email">
          <div className="flex min-w-0 flex-col gap-3">
            <p className="intel-body text-body" role="status">
              {closedLeadRefusal(closedBy)}
            </p>
            <div className="min-w-0">
              <p className="intel-secondary text-meta">To</p>
              <p className="mt-1 intel-body text-foreground [overflow-wrap:anywhere]">{draft.toEmail ?? 'No recipient'}</p>
            </div>
            <div className="min-w-0">
              <p className="intel-secondary text-meta">Subject</p>
              <p className="mt-1 intel-body text-foreground [overflow-wrap:anywhere]">{draft.subject}</p>
            </div>
            <div className="min-w-0">
              <p className="intel-secondary text-meta">Message</p>
              <p className="mt-1 whitespace-pre-wrap intel-body text-foreground [overflow-wrap:anywhere]">{draft.body}</p>
            </div>
            <ClosedDraftDiscard draftId={draft.id} status={draft.status} />
          </div>
        </Panel>
      ) : (
      <Panel title="Email">
        <DraftEditorArea
          key={draft.id}
          justSaved={justSaved}
          rules={draft.status !== 'draft' ? null : (review?.rules ?? { checked: false })}
          // A draft that needs review shows the footer built from the settings now, as it would be sent; any other status, the stored one.
          draft={{ ...draft, footer: draftFooter(draft, settings) }}
          footerOutdated={footerOutdated(draft, settings)}
          replyToEmail={settings?.replyToEmail || null}
          sending={sending}
          staleSending={staleSending}
          contactNote={contact?.note ?? null}
          foundEmail={contact?.foundEmail ?? null}
          alreadyEmailedOn={alreadyEmailedOn}
        />
      </Panel>
      )}

      {otherSent.length > 0 ? (
        <Panel title={`Other emails to this business · ${otherSent.length}`}>
          <ul className="divide-y divide-black/8">
            {otherSent.map((row) => (
              <li key={row.id} className="flex min-w-0 flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 py-2 first:pt-0 last:pb-0">
                <Link href={`/intel/outreach/${row.id}`} className="min-w-0 truncate intel-body text-cobalt-text underline-offset-2 hover:underline">
                  {row.subject}
                </Link>
                <span className="whitespace-nowrap intel-secondary text-meta">Sent {formatShortDate(row.sentAt)}</span>
              </li>
            ))}
          </ul>
        </Panel>
      ) : null}
    </div>
  )
}
