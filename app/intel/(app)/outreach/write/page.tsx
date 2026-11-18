import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

import { ManualDraftForm } from '@/app/intel/_components/outreach/ManualDraftForm'
import { Panel } from '@/app/intel/_components/ui/Panel'
import { requireIntelUser } from '@/lib/auth/allowlist'
import { closedByCalls, closedLeadRefusal } from '@/lib/outreach/calls'
import { createCallStore } from '@/lib/outreach/calls-store'
import { createContactStore } from '@/lib/outreach/contacts/store'
import { isDraftable, subjectOf } from '@/lib/outreach/context'
import { createOutreachStore } from '@/lib/outreach/deps'
import { prefillRecipient } from '@/lib/outreach/draft'
import { OUTREACH_SETTINGS_PATH } from '@/lib/outreach/gmail/flash'
import { loadBusinessLead, loadProspectLead } from '@/lib/outreach/leads'
import { leadHref } from '@/lib/outreach/links'
import { OUTREACH_SUBJECT_LABELS, OUTREACH_SUBJECT_TYPES, type OutreachSubjectType } from '@/lib/outreach/params'
import { buildFooter, missingSettings, missingSettingsMessage } from '@/lib/outreach/settings'
import { isUuid } from '@/lib/prospects/params'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Write an email',
  robots: { index: false, follow: false },
}

type PageProps = { searchParams: Promise<Record<string, string | string[] | undefined>> }

function BackLink() {
  return (
    <Link href="/intel/outreach" className="inline-flex items-baseline gap-1 intel-body text-foreground transition-colors hover:text-cobalt-primary">
      <ArrowLeft className="size-[1em]" aria-hidden />
      Outreach
    </Link>
  )
}

function Refusal({ text, settingsLink = false }: { text: string; settingsLink?: boolean }) {
  return (
    <div className="flex min-w-0 flex-col gap-4">
      <BackLink />
      <Panel>
        <p className="intel-body leading-relaxed text-body" role="alert">
          {text}
          {settingsLink ? (
            <>
              {' '}
              <Link href={OUTREACH_SETTINGS_PATH} className="font-medium text-cobalt-text underline underline-offset-2">
                Open Outreach settings
              </Link>
            </>
          ) : null}
        </p>
      </Panel>
    </div>
  )
}

/**
 * "Write it yourself": the owner writes the email by hand. No model is
 * called. The draft is created when it is first saved, with the normal
 * footer and To filled in as for a drafted email.
 */
export default async function WriteEmailPage({ searchParams }: PageProps) {
  await requireIntelUser()
  const params = await searchParams
  const type = typeof params.type === 'string' ? params.type : ''
  const leadId = typeof params.lead === 'string' ? params.lead : ''
  if (!(OUTREACH_SUBJECT_TYPES as readonly string[]).includes(type) || !isUuid(leadId)) return <Refusal text="Lead not found." />
  const subjectType = type as OutreachSubjectType

  const loaded = subjectType === 'prospect' ? await loadProspectLead(leadId) : await loadBusinessLead(leadId)
  if (!loaded.ok) return <Refusal text={loaded.reason === 'not_found' ? 'Lead not found.' : 'Unable to load this lead. Try again shortly.'} />
  const lead = loaded.lead
  if (!isDraftable(lead)) return <Refusal text="Accept this lead before writing an email." />
  const subject = subjectOf(lead)

  let loadedPage:
    | { kind: 'ready'; footer: string; toEmail: string | null }
    | { kind: 'active'; draftId: string }
    | { kind: 'refused'; text: string; settingsLink?: boolean }
  try {
    const store = createOutreachStore()
    const active = await store.findActiveDraft(subject.subjectType, subject.subjectRef)
    const settings = active === null ? await store.getSettings() : null
    const missing = missingSettings(settings)
    // Closed by a call: asked not to be contacted, or a latest call of not interested or wrong number.
    const closedBy = active === null ? await closedByCalls(createCallStore(), subject) : null
    if (active !== null) loadedPage = { kind: 'active', draftId: active.id }
    else if (closedBy !== null) loadedPage = { kind: 'refused', text: closedLeadRefusal(closedBy) }
    else if (settings === null || missing.length > 0) loadedPage = { kind: 'refused', text: missingSettingsMessage(missing), settingsLink: true }
    else loadedPage = { kind: 'ready', footer: buildFooter(settings), toEmail: await prefillRecipient(store, createContactStore(), subject) }
  } catch {
    console.error('Outreach write page load failed')
    return <Refusal text="Unable to load this page. Try again shortly." />
  }
  // The lead already has a draft: open it instead of starting another.
  if (loadedPage.kind === 'active') redirect(`/intel/outreach/${loadedPage.draftId}`)
  if (loadedPage.kind === 'refused') return <Refusal text={loadedPage.text} settingsLink={loadedPage.settingsLink} />
  const { footer, toEmail } = loadedPage

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <BackLink />
      <div className="min-w-0">
        <h1 className="intel-title text-foreground [overflow-wrap:anywhere]">{lead.name}</h1>
        <p className="mt-1 intel-secondary text-meta">
          {OUTREACH_SUBJECT_LABELS[subjectType]} ·{' '}
          <Link href={leadHref({ subjectType, leadId: lead.id })} className="text-cobalt-text underline-offset-2 hover:underline">
            Open the lead
          </Link>
        </p>
      </div>
      <Panel title="Write it yourself">
        <ManualDraftForm subjectType={subjectType} leadId={lead.id} initialTo={toEmail ?? ''} footer={footer} />
      </Panel>
    </div>
  )
}
