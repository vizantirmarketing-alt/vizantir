'use client'

import { useState, useTransition, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { TextAction } from '@/app/intel/_components/ui/TextAction'
import { buildMailto, messageText } from '@/lib/outreach/mailto'
import { OUTREACH_BODY_MAX, OUTREACH_SUBJECT_MAX } from '@/lib/outreach/params'
import type { OutreachDraft } from '@/lib/outreach/types'

import {
  approveOutreachDraft,
  discardOutreachDraft,
  doNotContactOutreachDraft,
  editOutreachDraftAgain,
  markOutreachDraftSent,
  saveOutreachDraft,
  writeOutreachDraftAgain,
  type OutreachActionResult,
} from '@/app/intel/(app)/outreach/actions'

const fieldClassName =
  'w-full rounded-lg border border-black/10 bg-white px-3 py-2.5 intel-body text-foreground transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-cobalt-focus'

const linkActionClassName =
  '-mx-1 inline-flex items-center rounded px-1 intel-body font-medium text-cobalt-text underline-offset-2 transition-colors hover:bg-cobalt-soft hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt-focus'

function ReadField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="intel-secondary text-meta">{label}</p>
      <div className="mt-1 intel-body text-foreground [overflow-wrap:anywhere]">{children}</div>
    </div>
  )
}

/** The footer every email ends with. Built from the settings when the draft was written; not editable. */
function Footer({ footer }: { footer: string }) {
  return (
    <div className="min-w-0 rounded-lg border border-dashed border-black/15 px-3 py-2.5">
      <p className="intel-secondary text-meta">Footer, added to every email and not editable</p>
      <p className="mt-1 whitespace-pre-wrap intel-body text-body [overflow-wrap:anywhere]">{footer}</p>
    </div>
  )
}

export function OutreachDraftEditor({ draft, replyToEmail }: { draft: OutreachDraft; replyToEmail: string | null }) {
  const router = useRouter()
  const [toEmail, setToEmail] = useState(draft.toEmail ?? '')
  const [subject, setSubject] = useState(draft.subject)
  const [body, setBody] = useState(draft.body)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<string | null>(null)
  const [confirmDoNotContact, setConfirmDoNotContact] = useState(false)
  const [pending, startTransition] = useTransition()

  const dirty = toEmail !== (draft.toEmail ?? '') || subject !== draft.subject || body !== draft.body
  const editable = draft.status === 'draft'

  function run(action: () => Promise<OutreachActionResult>, done?: string) {
    setError(null)
    setStatus(null)
    startTransition(async () => {
      const result = await action()
      if (!result.ok) {
        setError(result.error)
        return
      }
      if (done) setStatus(done)
      router.refresh()
    })
  }

  const save = () => saveOutreachDraft(draft.id, { toEmail, subject, body })

  async function copy(text: string, label: string) {
    setError(null)
    try {
      await navigator.clipboard.writeText(text)
      setStatus(`${label} copied.`)
    } catch {
      setError('Copying is blocked in this browser. Select the text and copy it instead.')
    }
  }

  const fullText = messageText(draft.body, draft.footer)
  const mailto = draft.status === 'approved' ? buildMailto({ to: draft.toEmail ?? '', subject: draft.subject, text: fullText }) : null

  return (
    <div className="space-y-4" aria-busy={pending}>
      {editable ? (
        <div className="space-y-3">
          <div>
            <label htmlFor="outreach-to" className="mb-2 block intel-body font-medium text-body">
              To
            </label>
            <input
              id="outreach-to"
              type="email"
              inputMode="email"
              autoComplete="off"
              value={toEmail}
              maxLength={254}
              placeholder="name@business.com"
              onChange={(event) => setToEmail(event.target.value)}
              className={fieldClassName}
            />
          </div>
          <div>
            <label htmlFor="outreach-subject" className="mb-2 block intel-body font-medium text-body">
              Subject
            </label>
            <input
              id="outreach-subject"
              type="text"
              value={subject}
              maxLength={OUTREACH_SUBJECT_MAX}
              onChange={(event) => setSubject(event.target.value)}
              className={fieldClassName}
            />
          </div>
          <div>
            <label htmlFor="outreach-body" className="mb-2 block intel-body font-medium text-body">
              Message
            </label>
            <textarea
              id="outreach-body"
              value={body}
              rows={12}
              maxLength={OUTREACH_BODY_MAX}
              onChange={(event) => setBody(event.target.value)}
              className={`${fieldClassName} leading-relaxed`}
            />
          </div>
          <Footer footer={draft.footer} />
        </div>
      ) : (
        <div className="space-y-3">
          <ReadField label="To">{draft.toEmail ?? '—'}</ReadField>
          <ReadField label="Subject">{draft.subject}</ReadField>
          <ReadField label="Message">
            <p className="whitespace-pre-wrap leading-relaxed">{draft.body}</p>
          </ReadField>
          <Footer footer={draft.footer} />
        </div>
      )}

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-black/8 pt-3">
        {editable ? (
          <>
            <Button
              type="button"
              size="sm"
              disabled={pending || !dirty}
              onClick={() => run(save, 'Saved.')}
              className="bg-cobalt-primary intel-secondary text-white hover:bg-[#1E85FF]"
            >
              {pending ? 'Saving…' : 'Save'}
            </Button>
            <TextAction
              disabled={pending}
              onClick={() =>
                run(async () => {
                  if (dirty) {
                    const saved = await save()
                    if (!saved.ok) return saved
                  }
                  return approveOutreachDraft(draft.id)
                })
              }
            >
              Approve
            </TextAction>
            <TextAction
              disabled={pending}
              onClick={() => {
                setError(null)
                startTransition(async () => {
                  const result = await writeOutreachDraftAgain(draft.id)
                  if (result.ok) router.push(`/intel/outreach/${result.draftId}`)
                  else setError(result.error)
                })
              }}
            >
              Draft again
            </TextAction>
          </>
        ) : null}

        {draft.status === 'approved' && mailto !== null ? (
          <>
            {mailto.kind === 'link' ? (
              <a href={mailto.href} className={linkActionClassName}>
                Open in mail app
              </a>
            ) : null}
            <TextAction disabled={pending} onClick={() => copy(fullText, 'Email')}>
              Copy email
            </TextAction>
            <TextAction disabled={pending} onClick={() => copy(draft.subject, 'Subject')}>
              Copy subject
            </TextAction>
            <TextAction disabled={pending} onClick={() => run(() => markOutreachDraftSent(draft.id))}>
              Mark as sent
            </TextAction>
            <TextAction disabled={pending} onClick={() => run(() => editOutreachDraftAgain(draft.id))}>
              Edit again
            </TextAction>
          </>
        ) : null}

        {draft.status === 'draft' || draft.status === 'approved' ? (
          <TextAction tone="destructive" disabled={pending} onClick={() => run(() => discardOutreachDraft(draft.id))}>
            Discard
          </TextAction>
        ) : null}

        {draft.status !== 'discarded' && !confirmDoNotContact ? (
          <TextAction tone="destructive" disabled={pending} onClick={() => setConfirmDoNotContact(true)}>
            Do not contact
          </TextAction>
        ) : null}
      </div>

      {confirmDoNotContact ? (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2" role="group" aria-label="Confirm do not contact">
          <p className="intel-body text-body">
            {draft.status === 'sent'
              ? 'Add this recipient to the do-not-contact list? The email stays recorded as sent.'
              : 'Add this recipient to the do-not-contact list and discard the draft?'}
          </p>
          <TextAction
            tone="destructive"
            disabled={pending}
            onClick={() => {
              setConfirmDoNotContact(false)
              run(() => doNotContactOutreachDraft(draft.id), 'Added to the do-not-contact list.')
            }}
          >
            Confirm
          </TextAction>
          <TextAction disabled={pending} onClick={() => setConfirmDoNotContact(false)}>
            Cancel
          </TextAction>
        </div>
      ) : null}

      {mailto !== null && mailto.kind === 'copy_only' ? (
        <p className="intel-secondary text-meta">
          {mailto.reason === 'too_long'
            ? 'This email is too long to open reliably as a mail link. Copy it and paste it into a new message instead.'
            : 'The recipient cannot be opened as a mail link. Choose Edit again and check the address.'}
        </p>
      ) : null}
      {draft.status === 'approved' && replyToEmail ? (
        <p className="intel-secondary text-meta">Send it from {replyToEmail}, so replies come back to that mailbox.</p>
      ) : null}
      {status !== null ? (
        <p className="intel-body text-body" role="status">
          {status}
        </p>
      ) : null}
      {error !== null ? (
        <p className="intel-body text-warning-severe" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
