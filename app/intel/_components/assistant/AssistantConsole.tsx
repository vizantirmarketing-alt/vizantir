'use client'

import { useRef, useState, useTransition } from 'react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Panel } from '@/app/intel/_components/ui/Panel'
import { TextAction } from '@/app/intel/_components/ui/TextAction'
import { EXAMPLES, INSTRUCTION_MAX } from '@/lib/assistant/catalog'
import type { RecordLink } from '@/lib/assistant/context'
import { PICKUP_NOTE, type ResearchRequestsResult } from '@/lib/assistant/research'
import type { ProspectCandidate } from '@/lib/assistant/resolve'
import type { AssistantReply, PendingCommand } from '@/lib/assistant/run'

import { askAssistant, refreshResearchRequests } from '@/app/intel/(app)/ai/actions'

const fieldClassName =
  'w-full rounded-lg border border-black/10 bg-white px-3 py-2.5 intel-body text-foreground transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-cobalt-focus'

const primaryButtonClassName = 'bg-cobalt-primary intel-secondary text-white hover:bg-[#1E85FF]'

/** chosen: the picked candidate's label. decision: what the owner did with a confirmation. */
type Entry = { id: number; asked: string; reply: AssistantReply; chosen: string | null; decision: 'confirmed' | 'cancelled' | null }

const UNREACHABLE = 'The assistant could not be reached, so nothing was answered. Try again shortly.'
const REQUESTS_UNREADABLE = 'Research requests could not be loaded just now. Try Refresh shortly.'

function candidateLabel(candidate: ProspectCandidate): string {
  return [candidate.name, candidate.domain, candidate.market, candidate.industry].filter(Boolean).join(' · ')
}

function RecordLinks({ links }: { links: RecordLink[] }) {
  if (links.length === 0) return null
  return (
    <div className="border-t border-black/8 pt-2">
      <p className="intel-secondary text-meta">Records</p>
      <ul className="mt-1 flex flex-col gap-1">
        {links.map((link) => (
          <li key={`${link.href}|${link.label}`}>
            <Link href={link.href} className="intel-body text-cobalt-text underline-offset-2 hover:underline [overflow-wrap:anywhere]">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

function EntryView({
  entry,
  pending,
  onChoose,
  onConfirm,
  onCancel,
}: {
  entry: Entry
  pending: boolean
  onChoose: (entry: Entry, candidate: ProspectCandidate) => void
  onConfirm: (entry: Entry) => void
  onCancel: (entry: Entry) => void
}) {
  const { reply } = entry
  return (
    <Panel>
      <div className="flex min-w-0 flex-col gap-2">
        <p className="intel-body font-medium text-foreground [overflow-wrap:anywhere]">{entry.asked}</p>
        {reply.understoodAs !== null ? <p className="intel-secondary text-meta [overflow-wrap:anywhere]">Understood as: {reply.understoodAs}</p> : null}

        {!reply.ok ? (
          <p className="intel-body text-warning-severe" role="alert">
            {reply.error}
          </p>
        ) : reply.kind === 'answer' ? (
          <p className="whitespace-pre-wrap intel-body leading-relaxed text-body [overflow-wrap:anywhere]">{reply.answer}</p>
        ) : (
          <p className="intel-body leading-relaxed text-body [overflow-wrap:anywhere]">{reply.message}</p>
        )}

        {reply.ok && reply.kind === 'choose' ? (
          entry.chosen !== null ? (
            <p className="intel-secondary text-meta">Chose {entry.chosen}.</p>
          ) : (
            <ul className="flex flex-col gap-1">
              {reply.candidates.map((candidate) => (
                <li key={candidate.id}>
                  <TextAction disabled={pending} onClick={() => onChoose(entry, candidate)} className="text-left">
                    {candidateLabel(candidate)}
                  </TextAction>
                </li>
              ))}
            </ul>
          )
        ) : null}

        {reply.ok && reply.kind === 'confirm' ? (
          entry.decision === 'confirmed' ? (
            <p className="intel-secondary text-meta">Confirmed. The result is above.</p>
          ) : entry.decision === 'cancelled' ? (
            <p className="intel-secondary text-meta">Cancelled. Nothing was queued.</p>
          ) : (
            <div className="flex flex-wrap items-center gap-3">
              <Button type="button" size="sm" disabled={pending} onClick={() => onConfirm(entry)} className={primaryButtonClassName}>
                Queue this research
              </Button>
              <TextAction disabled={pending} onClick={() => onCancel(entry)}>
                Cancel
              </TextAction>
            </div>
          )
        ) : null}

        {reply.ok && (reply.kind === 'answer' || reply.kind === 'reply' || reply.kind === 'queued') ? <RecordLinks links={reply.links} /> : null}
      </div>
    </Panel>
  )
}

function ResearchRequests({ result, pending, onRefresh }: { result: ResearchRequestsResult; pending: boolean; onRefresh: () => void }) {
  return (
    <Panel
      title="Research requests"
      headerAction={
        <TextAction pending={pending} pendingLabel="Refreshing…" onClick={onRefresh}>
          Refresh
        </TextAction>
      }
    >
      <div className="flex min-w-0 flex-col gap-2">
        <p className="intel-secondary text-meta">Research queued from this page. {PICKUP_NOTE} Times are Los Angeles time.</p>
        {!result.ok ? (
          <p className="intel-body text-warning-severe" role="alert">
            {REQUESTS_UNREADABLE}
          </p>
        ) : result.requests.length === 0 ? (
          <p className="intel-body text-body">No research requested from this page yet.</p>
        ) : (
          <ul className="divide-y divide-black/8">
            {result.requests.map((request) => (
              <li key={request.id} className="flex min-w-0 flex-col gap-1 py-2 first:pt-0 last:pb-0">
                <p className="intel-body font-medium text-foreground [overflow-wrap:anywhere]">{request.asked}</p>
                <p className="intel-secondary text-meta">
                  Requested {request.requestedAt} · {request.stateLabel}
                </p>
                <p className="intel-body text-body [overflow-wrap:anywhere]">{request.detail}</p>
                <Link href={request.link.href} className="intel-body text-cobalt-text underline-offset-2 hover:underline [overflow-wrap:anywhere]">
                  {request.link.label}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Panel>
  )
}

/**
 * The command center: one instruction at a time, answered from stored data.
 * The conversation lives in page state only and is gone on reload. Research
 * requests are read from the stored runs, so that panel survives a reload.
 */
export function AssistantConsole({ initialRequests }: { initialRequests: ResearchRequestsResult }) {
  const [instruction, setInstruction] = useState('')
  const [entries, setEntries] = useState<Entry[]>([])
  const [requests, setRequests] = useState<ResearchRequestsResult>(initialRequests)
  const [pending, startTransition] = useTransition()
  const [refreshing, startRefresh] = useTransition()
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const nextId = useRef(1)

  function refresh() {
    startRefresh(async () => {
      try {
        setRequests(await refreshResearchRequests())
      } catch {
        setRequests({ ok: false })
      }
    })
  }

  function add(asked: string, request: unknown) {
    startTransition(async () => {
      let reply: AssistantReply
      try {
        reply = await askAssistant(request)
      } catch {
        reply = { ok: false, error: UNREACHABLE, understoodAs: null }
      }
      setEntries((current) => [{ id: nextId.current++, asked, reply, chosen: null, decision: null }, ...current])
      if (reply.ok && reply.kind === 'queued') refresh()
    })
  }

  function submit() {
    const text = instruction.trim()
    if (text.length === 0 || pending) return
    setInstruction('')
    add(text, { kind: 'instruction', instruction: text })
  }

  function choose(entry: Entry, candidate: ProspectCandidate) {
    if (!entry.reply.ok || entry.reply.kind !== 'choose') return
    const { pending: waiting, ref }: { pending: PendingCommand; ref: string } = entry.reply
    setEntries((current) => current.map((item) => (item.id === entry.id ? { ...item, chosen: candidateLabel(candidate) } : item)))
    add(`${waiting.instruction} (${candidate.name})`, {
      kind: 'continue',
      instruction: waiting.instruction,
      command: waiting.command,
      selections: { ...waiting.selections, [ref]: candidate.id },
    })
  }

  function decide(entry: Entry, decision: 'confirmed' | 'cancelled') {
    setEntries((current) => current.map((item) => (item.id === entry.id ? { ...item, decision } : item)))
  }

  function confirm(entry: Entry) {
    if (!entry.reply.ok || entry.reply.kind !== 'confirm' || entry.decision !== null) return
    const { confirmation, understoodAs } = entry.reply
    decide(entry, 'confirmed')
    // The owner's click sends back exactly what was shown; the server validates all of it again.
    add(`Confirmed: ${understoodAs}`, { kind: 'confirm', ...confirmation })
  }

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <Panel>
        <form
          className="flex min-w-0 flex-col gap-2"
          aria-busy={pending}
          onSubmit={(event) => {
            event.preventDefault()
            submit()
          }}
        >
          <label htmlFor="assistant-instruction" className="intel-body font-medium text-body">
            Instruction
          </label>
          <textarea
            ref={inputRef}
            id="assistant-instruction"
            value={instruction}
            rows={2}
            maxLength={INSTRUCTION_MAX}
            placeholder="For example: Which inquiries should I follow up first?"
            onChange={(event) => setInstruction(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault()
                submit()
              }
            }}
            className={`${fieldClassName} leading-relaxed`}
          />
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <p className="intel-secondary text-meta">
              {instruction.length} of {INSTRUCTION_MAX} characters. Enter asks; Shift and Enter adds a line.
            </p>
            <Button type="submit" size="sm" disabled={pending || instruction.trim().length === 0} className={primaryButtonClassName}>
              {pending ? 'Working…' : 'Ask'}
            </Button>
          </div>
        </form>
      </Panel>

      {entries.length === 0 && !pending ? (
        <Panel title="What it can do">
          <div className="flex min-w-0 flex-col gap-2">
            <ul className="flex flex-col gap-1">
              {EXAMPLES.map((example) => (
                <li key={example.text}>
                  <TextAction
                    className="text-left"
                    onClick={() => {
                      setInstruction(example.prefill)
                      inputRef.current?.focus()
                    }}
                  >
                    {example.text}
                  </TextAction>
                </li>
              ))}
            </ul>
            <p className="intel-secondary text-meta">
              It reads what the dashboard already stores. The one thing it can do beyond reading is queue a prospect research run, and only after
              you confirm it. It does nothing else. Researching an existing prospect again is not available here yet; use Prospect Research for
              that.
            </p>
          </div>
        </Panel>
      ) : null}

      {pending ? (
        <p className="intel-secondary text-meta" role="status">
          Working on it. This can take up to a minute.
        </p>
      ) : null}

      {entries.map((entry) => (
        <EntryView key={entry.id} entry={entry} pending={pending} onChoose={choose} onConfirm={confirm} onCancel={(item) => decide(item, 'cancelled')} />
      ))}

      <ResearchRequests result={requests} pending={refreshing} onRefresh={refresh} />
    </div>
  )
}
