/**
 * Local date handling for the daily briefing. Every briefing date, cutoff and
 * displayed time uses America/Los_Angeles, including across daylight saving
 * changes. Pure; no I/O.
 */

export const BRIEFING_TIME_ZONE = 'America/Los_Angeles'

/** Briefings are generated at or after this local hour. */
export const BRIEFING_LOCAL_HOUR = 7

const DAY_MS = 24 * 60 * 60 * 1000

function partsFor(date: Date): Record<string, string> {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: BRIEFING_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date)
  const out: Record<string, string> = {}
  for (const part of parts) {
    out[part.type] = part.value
  }
  return out
}

/** Local calendar date as YYYY-MM-DD. */
export function localDateString(date: Date): string {
  const p = partsFor(date)
  return `${p.year}-${p.month}-${p.day}`
}

/** Local hour, 0 to 23. */
export function localHour(date: Date): number {
  return Number(partsFor(date).hour)
}

export function isBriefingDue(now: Date): boolean {
  return localHour(now) >= BRIEFING_LOCAL_HOUR
}

/** Whole calendar days between two local dates (YYYY-MM-DD), b minus a. */
export function localDaysBetween(a: string, b: string): number {
  const ta = Date.UTC(Number(a.slice(0, 4)), Number(a.slice(5, 7)) - 1, Number(a.slice(8, 10)))
  const tb = Date.UTC(Number(b.slice(0, 4)), Number(b.slice(5, 7)) - 1, Number(b.slice(8, 10)))
  return Math.round((tb - ta) / DAY_MS)
}

/** Age in whole local days from an ISO timestamp to now. */
export function localAgeDays(iso: string, now: Date): number | null {
  const then = Date.parse(iso)
  if (Number.isNaN(then)) {
    return null
  }
  return Math.max(0, localDaysBetween(localDateString(new Date(then)), localDateString(now)))
}

/** Full local timestamp for display, e.g. "Nov 10, 2026, 7:02 AM PST". */
export function formatLocalTimestamp(iso: string | null): string {
  if (iso === null) {
    return '—'
  }
  const then = Date.parse(iso)
  if (Number.isNaN(then)) {
    return '—'
  }
  return new Intl.DateTimeFormat('en-US', {
    timeZone: BRIEFING_TIME_ZONE,
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  }).format(new Date(then))
}

/** Long label for a YYYY-MM-DD briefing date, e.g. "Tuesday, November 10, 2026". */
export function formatBriefingDate(date: string): string {
  const t = Date.UTC(Number(date.slice(0, 4)), Number(date.slice(5, 7)) - 1, Number(date.slice(8, 10)), 12)
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(t))
}

export function isBriefingDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`))
}
