/**
 * The call log: what the owner recorded after phoning a lead. Pure; the store
 * is injected (Supabase in lib/outreach/calls-store.ts, memory in tests).
 * Nothing here dials, texts or contacts anyone.
 *
 * A lead is closed when its latest call ended in "Spoke: not interested" or
 * "Wrong number", or when any call ended in "Asked not to be contacted". A
 * request not to be contacted is never undone by a later call: it blocks
 * drafting, approving and sending for that lead on the server, and puts the
 * lead's found email address on the do-not-contact list.
 */

import { z } from 'zod'

import type { OutreachSubjectType } from '@/lib/outreach/params'

export const CALL_OUTCOMES = ['no_answer', 'left_message', 'spoke_interested', 'spoke_not_interested', 'wrong_number', 'asked_not_to_contact'] as const
export type CallOutcome = (typeof CALL_OUTCOMES)[number]

export const CALL_OUTCOME_LABELS: Record<CallOutcome, string> = {
  no_answer: 'No answer',
  left_message: 'Left a message',
  spoke_interested: 'Spoke: interested',
  spoke_not_interested: 'Spoke: not interested',
  wrong_number: 'Wrong number',
  asked_not_to_contact: 'Asked not to be contacted',
}

/** Outcomes that take a lead out of Accepted leads and into Closed. */
export const CLOSING_OUTCOMES: readonly CallOutcome[] = ['spoke_not_interested', 'wrong_number', 'asked_not_to_contact']

export const CALL_NOTE_MAX = 500

export const ASKED_NOT_TO_CONTACT_REFUSAL = 'This business asked not to be contacted. No email can be drafted, approved or sent for it.'

export type CallSubject = { subjectType: OutreachSubjectType; subjectRef: string }

export type OutreachCall = CallSubject & {
  id: string
  leadId: string
  outcome: CallOutcome
  note: string | null
  createdAt: string
  createdBy: string
}

export interface CallStore {
  /** Every logged call, newest first. */
  listCalls(): Promise<OutreachCall[]>
  /** One lead's calls, newest first. */
  callsFor(subject: CallSubject): Promise<OutreachCall[]>
  addCall(call: Omit<OutreachCall, 'id'>): Promise<{ id: string }>
}

export type CallSummary = {
  count: number
  latestOutcome: CallOutcome
  latestAt: string
  /** Why the lead is closed; null while it is open. */
  closedBy: CallOutcome | null
}

/** A lead's calls in any order, summarised; null when there are none. */
export function summarizeCalls(calls: readonly Pick<OutreachCall, 'outcome' | 'createdAt'>[]): CallSummary | null {
  if (calls.length === 0) return null
  const sorted = [...calls].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const latest = sorted[0]!
  const asked = sorted.some((call) => call.outcome === 'asked_not_to_contact')
  const closedBy: CallOutcome | null = asked ? 'asked_not_to_contact' : CLOSING_OUTCOMES.includes(latest.outcome) ? latest.outcome : null
  return { count: calls.length, latestOutcome: latest.outcome, latestAt: latest.createdAt, closedBy }
}

/** Summaries keyed by "subjectType:subjectRef". */
export function summariesBySubject(calls: readonly OutreachCall[]): Map<string, CallSummary> {
  const grouped = new Map<string, OutreachCall[]>()
  for (const call of calls) {
    const key = `${call.subjectType}:${call.subjectRef}`
    grouped.set(key, [...(grouped.get(key) ?? []), call])
  }
  const out = new Map<string, CallSummary>()
  for (const [key, list] of grouped) out.set(key, summarizeCalls(list)!)
  return out
}

/**
 * Whether the lead asked not to be contacted. A store that cannot be read
 * (before migration 0035) has no calls, so nothing is blocked by it.
 */
export async function askedNotToContact(calls: Pick<CallStore, 'callsFor'> | undefined, subject: CallSubject): Promise<boolean> {
  if (calls === undefined) return false
  try {
    return (await calls.callsFor(subject)).some((call) => call.outcome === 'asked_not_to_contact')
  } catch {
    return false
  }
}

export const callInputSchema = z.strictObject({
  outcome: z.enum(CALL_OUTCOMES),
  note: z
    .string()
    .max(CALL_NOTE_MAX, `Keep the note under ${CALL_NOTE_MAX} characters.`)
    .transform((value) => value.replace(/\r\n?/g, '\n').trim()),
})

export type LogCallResult = { ok: true; suppressed: boolean } | { ok: false; error: string }

/**
 * Records one call for an accepted lead. After "Asked not to be contacted",
 * the lead's found email address, if any, goes on the do-not-contact list.
 * A failure to read or list the address does not undo the logged call.
 */
export async function logCall(
  deps: {
    calls: Pick<CallStore, 'addCall'>
    /** The lead's found contact address, if any. */
    foundEmail: () => Promise<string | null>
    suppress: (email: string) => Promise<void>
  },
  input: { subject: CallSubject; leadId: string; outcome: CallOutcome; note: string; createdBy: string },
  nowIso: string,
): Promise<LogCallResult> {
  const note = input.note.trim()
  if (note.length > CALL_NOTE_MAX) return { ok: false, error: `Keep the note under ${CALL_NOTE_MAX} characters.` }
  await deps.calls.addCall({
    ...input.subject,
    leadId: input.leadId,
    outcome: input.outcome,
    note: note.length > 0 ? note : null,
    createdAt: nowIso,
    createdBy: input.createdBy,
  })
  if (input.outcome !== 'asked_not_to_contact') return { ok: true, suppressed: false }
  try {
    const email = await deps.foundEmail()
    if (email === null) return { ok: true, suppressed: false }
    await deps.suppress(email)
    return { ok: true, suppressed: true }
  } catch {
    return { ok: true, suppressed: false }
  }
}
