import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

import { OutreachDraftEditor } from '@/app/intel/_components/outreach/OutreachDraftEditor'
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
import { connectionView } from '@/lib/outreach/gmail/view'
import { isStaleSending } from '@/lib/outreach/lifecycle'
import { loadBusinessLead, loadProspectLead } from '@/lib/outreach/leads'
import { leadHref } from '@/lib/outreach/links'
import { OUTREACH_DAILY_SEND_LIMIT, OUTREACH_SUBJECT_LABELS, normalizeEmail } from '@/lib/outreach/params'
import type { GmailConnection, OutreachDraft, OutreachSettings } from '@/lib/outreach/types'
import { voiceWarnings, voiceContextFor } from '@/lib/outreach/voice'
import { isUuid } from '@/lib/prospects/params'

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

type PageProps = { params: Promise<{ id: string }> }

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
 * uses, and the warnings for this draft's text against it. Nothing is stored.
 * null when the lead cannot be loaded.
 */
async function reviewFor(draft: OutreachDraft, studioName: string): Promise<{ basis: BasisItem[]; warnings: string[] } | null> {
  const loaded = draft.subjectType === 'prospect' ? await loadProspectLead(draft.leadId) : await loadBusinessLead(draft.leadId)
  if (!loaded.ok) return null
  const context = voiceContextFor(buildOutreachContext(loaded.lead), studioName)
  return { basis: outreachBasis(loaded.lead), warnings: voiceWarnings({ subject: draft.subject, body: draft.body }, context) }
}

function history(draft: OutreachDraft): string {
  const parts = [`Written ${formatLocalTimestamp(draft.createdAt)}`]
  if (draft.approvedAt !== null) parts.push(`approved ${formatLocalTimestamp(draft.approvedAt)}`)
  if (draft.sentAt !== null) parts.push(`sent ${formatLocalTimestamp(draft.sentAt)}`)
  return parts.join(' · ')
}

export default async function OutreachDraftPage({ params }: PageProps) {
  await requireIntelUser()
  const { id } = await params
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
  const review = await reviewFor(draft, settings?.studioName ?? '')
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
      </div>

      {draft.status === 'discarded' ? (
        <p className="intel-body text-body">This draft was discarded. It is kept for the record and cannot be changed.</p>
      ) : null}

      <WrittenFromPanel items={review?.basis ?? null} />
      {review !== null && review.warnings.length > 0 && draft.status !== 'discarded' ? <DraftWarnings warnings={review.warnings} /> : null}

      <Panel title="Email">
        <OutreachDraftEditor
          key={draft.updatedAt}
          draft={draft}
          replyToEmail={settings?.replyToEmail || null}
          sending={sending}
          staleSending={staleSending}
        />
      </Panel>
    </div>
  )
}
