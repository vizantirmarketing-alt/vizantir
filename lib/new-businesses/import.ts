/**
 * Imports Clark County's monthly new business lists. No direct I/O: the
 * store, the two fetches and PDF text extraction are injected
 * (lib/new-businesses/deps.ts wires production; tests use fakes).
 *
 * Privacy rule: only rows whose category is enabled are stored. Every row is
 * counted toward its category; rows in disabled categories are then
 * discarded. A category seen for the first time is created disabled. After a
 * category is enabled, re-importing a stored period picks its rows up.
 *
 * Idempotent: rows are keyed by source, period and rowDedupeKey, and stored
 * with insert-or-ignore, so importing the same file twice adds nothing and
 * never overwrites a review.
 */

import { localDateString } from '@/lib/briefing/dates'
import {
  NEW_BUSINESS_SOURCE,
  comparePeriods,
  discoverFiles,
  periodKey,
  type DiscoveredFile,
  type Period,
} from '@/lib/new-businesses/discovery'
import {
  countByCategory,
  parseNewBusinessPages,
  rowDedupeKey,
  type NewBusinessRecord,
  type PositionedPage,
} from '@/lib/new-businesses/parse'
import { RANK_VERSION, rankStoredRows, type LeadTier, type RankableStoredRow, type RankSignal } from '@/lib/new-businesses/rank'

/** Only the newest few published periods are imported automatically. */
export const IMPORT_LOOKBACK_PERIODS = 3

export type ImportState = 'importing' | 'imported' | 'failed'

export type ImportSummary = {
  period: Period
  fileUrl: string
  state: ImportState
  startedAt: string
}

export type ImportCounts = {
  rowsTotal: number
  rowsStored: number
  rowsDiscarded: number
  rowsInserted: number
  unparsedLines: number
}

export type StoredRow = NewBusinessRecord & { dedupeKey: string }

/** A stored license row as the ranker and grouper need it. Read only. */
export type RankableRow = RankableStoredRow

/**
 * Written to one license row by a rescore: the business's score and its
 * grouping. Never includes review status or notes.
 */
export type RankUpdate = {
  id: string
  score: number
  tier: LeadTier
  signals: RankSignal[]
  version: string
  scoredAt: string
  groupKey: string
  groupPrimary: boolean
  /** Every category the business holds; written on every row of the business. */
  groupCategories: string[]
  /** Every period (YYYY-MM) of the business, newest first. */
  groupPeriods: string[]
  groupLicenseCount: number
}

/** Rows written per batch when saving scores. */
export const RANK_BATCH_SIZE = 500

export interface NewBusinessStore {
  listImports(source: string): Promise<ImportSummary[]>
  beginImport(source: string, period: Period, fileUrl: string, nowIso: string): Promise<void>
  /** note: a non-fatal problem to show on the import, e.g. scores not updated. */
  finishImport(source: string, period: Period, counts: ImportCounts, nowIso: string, note?: string | null): Promise<void>
  failImport(source: string, period: Period, error: string, nowIso: string): Promise<void>
  /**
   * Upserts last-seen counts for every category in the file, creating new
   * categories disabled, and returns enabled flags for those categories.
   */
  recordCategoryCounts(source: string, counts: Map<string, number>, nowIso: string): Promise<Map<string, boolean>>
  /**
   * Insert-or-ignore on (source, period, dedupe key). Returns rows newly
   * inserted. An existing row is never rewritten, so its review status and
   * owner note survive every re-import.
   */
  storeRows(source: string, period: Period, rows: StoredRow[], nowIso: string): Promise<number>
  /** Every stored license row for the source, for grouping and rescoring. */
  listRankableRows(source: string): Promise<RankableRow[]>
  /** Writes lead score and group columns only. Never touches review status or notes. */
  saveRanks(source: string, updates: RankUpdate[]): Promise<void>
}

export type ImportDeps = {
  store: NewBusinessStore
  fetchListing(): Promise<string>
  fetchPdf(url: string): Promise<Uint8Array>
  extractPages(bytes: Uint8Array): Promise<PositionedPage[]>
  now(): Date
}

export type ImportResult =
  | { outcome: 'imported'; period: Period; counts: ImportCounts; rankError?: string }
  | { outcome: 'up_to_date'; period: Period | null }
  | { outcome: 'skipped_today' }
  | { outcome: 'failed'; period: Period | null; error: string }

function errorText(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message.slice(0, 500)
  }
  return 'Unknown error'
}

/** Splits parsed rows into those stored and the count discarded. */
export function applyCategoryRule(
  rows: readonly NewBusinessRecord[],
  enabled: ReadonlyMap<string, boolean>,
): { stored: StoredRow[]; discarded: number } {
  const stored: StoredRow[] = []
  let discarded = 0
  for (const row of rows) {
    if (enabled.get(row.category) === true) {
      stored.push({ ...row, dedupeKey: rowDedupeKey(row) })
    } else {
      discarded += 1
    }
  }
  return { stored, discarded }
}

/**
 * Regroups and rescores every stored license row. Rows are grouped into
 * businesses (one primary row each), each business is scored once, and every
 * row of the business gets that score and the group's category list. Shared
 * phone and address signals depend on the whole set, so all rows are handled
 * together and saved in batches. Returns rows written.
 */
export async function rescoreStoredRows(store: NewBusinessStore, nowIso: string): Promise<number> {
  const rows = await store.listRankableRows(NEW_BUSINESS_SOURCE)
  const updates: RankUpdate[] = []
  for (const { group, result } of rankStoredRows(rows)) {
    for (const id of group.rowIds) {
      updates.push({
        id,
        score: result.score,
        tier: result.tier,
        signals: result.signals,
        version: RANK_VERSION,
        scoredAt: nowIso,
        groupKey: group.key,
        groupPrimary: id === group.primaryId,
        groupCategories: group.categories,
        groupPeriods: group.periods,
        groupLicenseCount: group.licenseCount,
      })
    }
  }
  for (let i = 0; i < updates.length; i += RANK_BATCH_SIZE) {
    await store.saveRanks(NEW_BUSINESS_SOURCE, updates.slice(i, i + RANK_BATCH_SIZE))
  }
  return updates.length
}

/** Fetches, parses and stores one period's file. Records failure on the import row. */
export async function importFile(deps: ImportDeps, file: DiscoveredFile): Promise<ImportResult> {
  const period: Period = { year: file.year, month: file.month }
  const startIso = deps.now().toISOString()
  await deps.store.beginImport(NEW_BUSINESS_SOURCE, period, file.url, startIso)

  try {
    const bytes = await deps.fetchPdf(file.url)
    const parsed = parseNewBusinessPages(await deps.extractPages(bytes))
    if (parsed.rows.length === 0) {
      throw new Error('No rows could be read from the file')
    }

    const enabled = await deps.store.recordCategoryCounts(
      NEW_BUSINESS_SOURCE,
      countByCategory(parsed.rows),
      deps.now().toISOString(),
    )
    const { stored, discarded } = applyCategoryRule(parsed.rows, enabled)
    const inserted = await deps.store.storeRows(NEW_BUSINESS_SOURCE, period, stored, deps.now().toISOString())

    // Scoring never fails the import: a problem is recorded on the import row
    // and the scores already stored stay as they were.
    let rankError: string | undefined
    try {
      await rescoreStoredRows(deps.store, deps.now().toISOString())
    } catch (error) {
      rankError = `Lead scores were not updated: ${errorText(error)}`
    }

    const counts: ImportCounts = {
      rowsTotal: parsed.rows.length,
      rowsStored: stored.length,
      rowsDiscarded: discarded,
      rowsInserted: inserted,
      unparsedLines: parsed.unparsedLines + parsed.incompleteRows,
    }
    await deps.store.finishImport(NEW_BUSINESS_SOURCE, period, counts, deps.now().toISOString(), rankError ?? null)
    return rankError === undefined
      ? { outcome: 'imported', period, counts }
      : { outcome: 'imported', period, counts, rankError }
  } catch (error) {
    const message = errorText(error)
    await deps.store.failImport(NEW_BUSINESS_SOURCE, period, message, deps.now().toISOString())
    return { outcome: 'failed', period, error: message }
  }
}

/**
 * Imports the newest published period that has not been imported, looking at
 * the newest IMPORT_LOOKBACK_PERIODS periods only. A failed period is retried.
 */
export async function importLatest(deps: ImportDeps): Promise<ImportResult> {
  let files: DiscoveredFile[]
  try {
    files = discoverFiles(await deps.fetchListing())
  } catch (error) {
    return { outcome: 'failed', period: null, error: `Listing page: ${errorText(error)}` }
  }
  if (files.length === 0) {
    return { outcome: 'failed', period: null, error: 'No monthly lists were found on the listing page' }
  }

  const imported = new Set(
    (await deps.store.listImports(NEW_BUSINESS_SOURCE))
      .filter((i) => i.state === 'imported')
      .map((i) => periodKey(i.period)),
  )
  const target = files
    .slice(0, IMPORT_LOOKBACK_PERIODS)
    .find((file) => !imported.has(periodKey(file)))

  if (target === undefined) {
    const newest = files[0]
    return { outcome: 'up_to_date', period: newest ? { year: newest.year, month: newest.month } : null }
  }
  return importFile(deps, target)
}

/** Re-imports a period already imported, e.g. after enabling a category. */
export async function reimportPeriod(deps: ImportDeps, period: Period): Promise<ImportResult> {
  let url: string | null = null
  try {
    url = discoverFiles(await deps.fetchListing()).find((f) => periodKey(f) === periodKey(period))?.url ?? null
  } catch {
    url = null
  }
  if (url === null) {
    url = (await deps.store.listImports(NEW_BUSINESS_SOURCE)).find(
      (i) => periodKey(i.period) === periodKey(period),
    )?.fileUrl ?? null
  }
  if (url === null) {
    return { outcome: 'failed', period, error: 'The file for this period is no longer listed' }
  }
  return importFile(deps, { ...period, url })
}

/** The cron path: at most one import attempt per local day. */
export async function importLatestDaily(deps: ImportDeps): Promise<ImportResult> {
  const today = localDateString(deps.now())
  const attempts = await deps.store.listImports(NEW_BUSINESS_SOURCE)
  if (attempts.some((i) => localDateString(new Date(i.startedAt)) === today)) {
    return { outcome: 'skipped_today' }
  }
  return importLatest(deps)
}

export function sortImportsNewestFirst(imports: ImportSummary[]): ImportSummary[] {
  return [...imports].sort((a, b) => comparePeriods(b.period, a.period))
}
