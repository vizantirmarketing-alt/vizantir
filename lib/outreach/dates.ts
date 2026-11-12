/**
 * The start of the owner's local day, for the daily draft cap and the sent
 * count. Uses the briefing's time zone (America/Los_Angeles). Pure.
 */

import { BRIEFING_TIME_ZONE, localDateString } from '@/lib/briefing/dates'

function offsetMinutes(at: Date): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: BRIEFING_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(at)
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? '0')
  const asUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'))
  return Math.round((asUtc - Math.floor(at.getTime() / 1000) * 1000) / 60_000)
}

/** ISO instant of local midnight at the start of `now`'s local day, across daylight saving changes. */
export function localDayStartIso(now: Date): string {
  const date = localDateString(now)
  const midnightAsUtc = Date.UTC(Number(date.slice(0, 4)), Number(date.slice(5, 7)) - 1, Number(date.slice(8, 10)))
  // The offset at local midnight can differ from the offset now on a
  // daylight saving day, so it is read at the first guess and corrected once.
  let guess = midnightAsUtc - offsetMinutes(now) * 60_000
  guess = midnightAsUtc - offsetMinutes(new Date(guess)) * 60_000
  return new Date(guess).toISOString()
}
