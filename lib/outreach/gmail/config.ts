/**
 * Direct sending configuration. Pure: the caller passes the environment.
 *
 * Three variables, separate from the sign-in credentials:
 *   GMAIL_OAUTH_CLIENT_ID      OAuth client for the Gmail connection
 *   GMAIL_OAUTH_CLIENT_SECRET
 *   OUTREACH_TOKEN_KEY         32 random bytes, base64: encrypts the refresh token
 *
 * Any of them missing or malformed gives null, and the app runs without
 * direct sending. Nothing here logs, throws on or returns a value to a page.
 */

export type GmailConfig = {
  clientId: string
  clientSecret: string
  /** 32 bytes. */
  tokenKey: Buffer
}

export const GMAIL_ENV_NAMES = ['GMAIL_OAUTH_CLIENT_ID', 'GMAIL_OAUTH_CLIENT_SECRET', 'OUTREACH_TOKEN_KEY'] as const

type Env = Partial<Record<(typeof GMAIL_ENV_NAMES)[number], string | undefined>>

/** The key decoded, or null unless it is exactly 32 bytes of standard or URL-safe base64. */
export function decodeTokenKey(value: string | undefined): Buffer | null {
  const trimmed = (value ?? '').trim()
  if (!/^[A-Za-z0-9+/_-]+={0,2}$/.test(trimmed)) return null
  const key = Buffer.from(trimmed.replace(/-/g, '+').replace(/_/g, '/'), 'base64')
  return key.length === 32 ? key : null
}

export function gmailConfigFrom(env: Env): GmailConfig | null {
  const clientId = (env.GMAIL_OAUTH_CLIENT_ID ?? '').trim()
  const clientSecret = (env.GMAIL_OAUTH_CLIENT_SECRET ?? '').trim()
  const tokenKey = decodeTokenKey(env.OUTREACH_TOKEN_KEY)
  if (clientId.length === 0 || clientSecret.length === 0 || tokenKey === null) return null
  return { clientId, clientSecret, tokenKey }
}
