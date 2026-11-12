/**
 * The one-time result of a Google connection attempt, carried from the
 * callback route to the Outreach page in a short-lived httpOnly cookie, so no
 * message or address goes in the URL. Pure.
 */

export const RESULT_COOKIE = 'outreach_google_result'
export const RESULT_COOKIE_PATH = '/intel/outreach'
export const RESULT_COOKIE_MAX_AGE = 60
/** The query flag that tells the page to show the result once. */
export const RESULT_PARAM = 'google'

export type ConnectionNotice = { ok: boolean; message: string }

export function encodeNotice(notice: ConnectionNotice): string {
  return Buffer.from(JSON.stringify({ ok: notice.ok, message: notice.message.slice(0, 500) }), 'utf8').toString('base64url')
}

export function decodeNotice(value: string | undefined): ConnectionNotice | null {
  if (value === undefined || !/^[A-Za-z0-9_-]{1,1200}$/.test(value)) return null
  try {
    const parsed: unknown = JSON.parse(Buffer.from(value, 'base64url').toString('utf8'))
    if (parsed === null || typeof parsed !== 'object') return null
    const { ok, message } = parsed as Record<string, unknown>
    if (typeof ok !== 'boolean' || typeof message !== 'string' || message.length === 0) return null
    return { ok, message: message.slice(0, 500) }
  } catch {
    return null
  }
}
