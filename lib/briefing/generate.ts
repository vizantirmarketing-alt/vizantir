/**
 * Daily briefing generation. No direct I/O: the store, the read-only data
 * sources and the model call are injected (lib/briefing/deps.ts wires the
 * production versions; tests use fakes).
 *
 * The structured content is always saved. The narrative is supplementary:
 * when the model is not configured, the call fails, or its output does not
 * validate, the briefing is saved without one and the reason is recorded.
 */

import {
  assembleBriefingContent,
  briefingWindows,
  type BriefingContent,
  type BriefingWindows,
  type RawBriefingInputs,
  type SourceFreshness,
} from '@/lib/briefing/context'
import { isBriefingDue, localDateString } from '@/lib/briefing/dates'
import { requestNarrative, type CallModel } from '@/lib/briefing/narrative'

export const BRIEFING_STATUSES = ['complete', 'no_narrative', 'failed'] as const
export type BriefingStatus = (typeof BRIEFING_STATUSES)[number]

export type BriefingRecord = {
  briefingDate: string
  generatedAt: string
  status: BriefingStatus
  content: BriefingContent
  narrative: string | null
  sourceFreshness: SourceFreshness[]
  error: string | null
}

export interface BriefingStore {
  getByDate(briefingDate: string): Promise<BriefingRecord | null>
  /** Most recent briefing strictly before this date. */
  getLatestBefore(briefingDate: string): Promise<BriefingRecord | null>
  /**
   * overwrite false inserts only if no row exists for the date and returns
   * 'exists' otherwise. overwrite true replaces the row for the date.
   */
  save(record: BriefingRecord, options: { overwrite: boolean }): Promise<'saved' | 'exists'>
}

export interface BriefingSources {
  /** Read-only. Each section reports its own failure rather than throwing. */
  load(options: { windows: BriefingWindows; now: Date }): Promise<RawBriefingInputs>
}

export type GenerateDeps = {
  store: BriefingStore
  sources: BriefingSources
  /** Null when the model is not configured. */
  callModel: CallModel | null
  now(): Date
}

export type GenerateResult = {
  outcome: 'saved' | 'exists'
  briefingDate: string
  status: BriefingStatus
  error: string | null
}

const ALL_SECTIONS: readonly (keyof RawBriefingInputs)[] = [
  'newProspects',
  'topUnreviewed',
  'inquiries',
  'inquiryStats',
  'findings',
  'runs',
  'sources',
]

function allFailed(): RawBriefingInputs {
  return {
    newProspects: { ok: false },
    topUnreviewed: { ok: false },
    inquiries: { ok: false },
    inquiryStats: { ok: false },
    findings: { ok: false },
    runs: { ok: false },
    sources: { ok: false },
  }
}

export async function generateBriefing(
  deps: GenerateDeps,
  options: { overwrite: boolean },
): Promise<GenerateResult> {
  const now = deps.now()
  const briefingDate = localDateString(now)
  const previous = await deps.store.getLatestBefore(briefingDate)
  const windows = briefingWindows(now, previous?.generatedAt ?? null)

  let inputs: RawBriefingInputs
  try {
    inputs = await deps.sources.load({ windows, now })
  } catch {
    inputs = allFailed()
  }

  const content = assembleBriefingContent(inputs, { now, windows })

  let status: BriefingStatus
  let narrative: string | null = null
  let error: string | null = null

  if (content.unavailable.length === ALL_SECTIONS.length) {
    status = 'failed'
    error = 'all_sources_unavailable'
  } else if (content.quiet) {
    // Nothing new: the page says so plainly. No model call is needed.
    status = 'complete'
  } else if (deps.callModel === null) {
    status = 'no_narrative'
    error = 'model_not_configured'
  } else {
    const result = await requestNarrative(content, deps.callModel)
    if (result.ok) {
      status = 'complete'
      narrative = result.narrative
      content.suggestedActions = result.actions
    } else {
      status = 'no_narrative'
      error = result.reason
    }
  }

  const record: BriefingRecord = {
    briefingDate,
    generatedAt: now.toISOString(),
    status,
    content,
    narrative,
    sourceFreshness: content.sources,
    error,
  }

  const outcome = await deps.store.save(record, { overwrite: options.overwrite })
  return { outcome, briefingDate, status, error }
}

export type ScheduledBriefingResult =
  | { action: 'skipped'; reason: 'before_local_hour' | 'already_exists'; briefingDate: string }
  | ({ action: 'generated' } & GenerateResult)

/** The cron path: generate today's briefing once, at or after 7:00 local. */
export async function generateScheduledBriefing(
  deps: GenerateDeps,
): Promise<ScheduledBriefingResult> {
  const now = deps.now()
  const briefingDate = localDateString(now)
  if (!isBriefingDue(now)) {
    return { action: 'skipped', reason: 'before_local_hour', briefingDate }
  }
  if ((await deps.store.getByDate(briefingDate)) !== null) {
    return { action: 'skipped', reason: 'already_exists', briefingDate }
  }
  const result = await generateBriefing(deps, { overwrite: false })
  if (result.outcome === 'exists') {
    return { action: 'skipped', reason: 'already_exists', briefingDate }
  }
  return { action: 'generated', ...result }
}
