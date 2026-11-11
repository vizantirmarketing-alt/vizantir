/**
 * Plain wording for the New Businesses page. Pure.
 *
 * Counts appear in one place only: each import row's summary line
 * (importSummaryLine). Action results confirm what happened without
 * repeating those numbers. Rows that were not kept are always called
 * "skipped".
 */

import { formatPeriod } from '@/lib/new-businesses/discovery'
import type { ImportResult } from '@/lib/new-businesses/import'

export type ImportMessage = { ok: true; message: string } | { ok: false; error: string }

export type ImportAction = 'import' | 'reimport'

export function importResultMessage(result: ImportResult, action: ImportAction = 'import'): ImportMessage {
  switch (result.outcome) {
    case 'imported': {
      const period = formatPeriod(result.period)
      const done = `${period} ${action === 'reimport' ? 'updated' : 'imported'}.`
      const nothingKept = result.counts.rowsStored === 0 && result.counts.rowsTotal > 0
      const base = nothingKept ? `${done} Nothing was kept because their categories are off.` : done
      return {
        ok: true,
        message: result.rankError ? `${base} Lead scores were not updated; earlier scores are unchanged.` : base,
      }
    }
    case 'up_to_date':
      return {
        ok: true,
        message: result.period ? `Up to date. The newest list is ${formatPeriod(result.period)}.` : 'Up to date.',
      }
    case 'skipped_today':
      return { ok: true, message: 'Already checked today.' }
    case 'failed':
      return {
        ok: false,
        error: result.period ? `${formatPeriod(result.period)} failed: ${result.error}` : result.error,
      }
  }
}

/** The single place an import's counts are shown, e.g. "735 read · 677 kept · 58 skipped". */
export function importSummaryLine(counts: {
  rowsTotal: number
  rowsStored: number
  rowsDiscarded: number
  unparsedLines: number
}): string {
  const parts = [`${counts.rowsTotal} read`, `${counts.rowsStored} kept`, `${counts.rowsDiscarded} skipped`]
  if (counts.unparsedLines > 0) {
    parts.push(`${counts.unparsedLines} unreadable`)
  }
  return parts.join(' · ')
}
