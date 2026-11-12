/**
 * The Google connection for direct sending: authorization URL, PKCE, the
 * state cookie, the token endpoint and the id_token claims. Uses fetch, passed
 * in, so tests never touch the network. This is not the Intel sign-in, which
 * goes through Supabase with its own OAuth client and is not touched here.
 */

import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'

import { workspaceDomain } from '@/lib/outreach/gmail/account'
import type { GmailConfig } from '@/lib/outreach/gmail/config'
import { normalizeEmail } from '@/lib/outreach/params'

export type FetchFn = typeof fetch

export const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'
export const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
export const GOOGLE_REVOKE_URL = 'https://oauth2.googleapis.com/revoke'

/** Exactly these: who the mailbox is, and permission to send. No read access. */
export const GMAIL_SCOPES = ['openid', 'email', 'https://www.googleapis.com/auth/gmail.send'] as const

/** The app's production origin (vizantir.com redirects here) and local development. */
export const ALLOWED_ORIGINS: readonly string[] = ['https://www.vizantir.com', 'http://localhost:3000']

export const CALLBACK_PATH = '/api/outreach/google/callback'
export const OAUTH_COOKIE = 'outreach_google_oauth'
export const OAUTH_COOKIE_PATH = '/api/outreach/google'
export const OAUTH_COOKIE_MAX_AGE = 600

const GOOGLE_TIMEOUT_MS = 15_000

/** The redirect URI for a request origin, or null when the origin is not allowed. */
export function redirectUriFor(origin: string): string | null {
  return ALLOWED_ORIGINS.includes(origin) ? `${origin}${CALLBACK_PATH}` : null
}

function base64url(bytes: Buffer): string {
  return bytes.toString('base64url')
}

export function newState(): string {
  return base64url(randomBytes(32))
}

/** PKCE with S256: a 43-character verifier and its SHA-256 challenge. */
export function createPkce(): { verifier: string; challenge: string } {
  const verifier = base64url(randomBytes(32))
  return { verifier, challenge: pkceChallenge(verifier) }
}

export function pkceChallenge(verifier: string): string {
  return base64url(createHash('sha256').update(verifier).digest())
}

export function stateCookieValue(state: string, verifier: string): string {
  return `${state}.${verifier}`
}

export function parseStateCookie(value: string | undefined): { state: string; verifier: string } | null {
  const match = /^([A-Za-z0-9_-]{20,128})\.([A-Za-z0-9_-]{43,128})$/.exec(value ?? '')
  return match === null ? null : { state: match[1]!, verifier: match[2]! }
}

/** Timing-safe; false for any length difference. */
export function statesMatch(expected: string, received: string): boolean {
  const a = Buffer.from(expected, 'utf8')
  const b = Buffer.from(received, 'utf8')
  return a.length === b.length && a.length > 0 && timingSafeEqual(a, b)
}

export function buildAuthorizationUrl(input: {
  clientId: string
  redirectUri: string
  state: string
  challenge: string
  /** The reply-to address in Outreach settings: the address emails go out as. */
  replyTo: string
}): string {
  const url = new URL(GOOGLE_AUTH_URL)
  url.searchParams.set('client_id', input.clientId)
  url.searchParams.set('redirect_uri', input.redirectUri)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('scope', GMAIL_SCOPES.join(' '))
  url.searchParams.set('access_type', 'offline')
  url.searchParams.set('prompt', 'consent')
  url.searchParams.set('state', input.state)
  url.searchParams.set('code_challenge', input.challenge)
  url.searchParams.set('code_challenge_method', 'S256')
  // On a Workspace domain the reply-to may be an alias, which is not a sign-in
  // name, so Google gets only the domain. A shared provider such as gmail.com
  // is not a Workspace domain, and there the reply-to is the account itself.
  const domain = workspaceDomain(input.replyTo)
  if (domain === null) url.searchParams.set('login_hint', normalizeEmail(input.replyTo))
  else url.searchParams.set('hd', domain)
  return url.toString()
}

/** hd is Google's hosted domain claim, present only for a Workspace account. */
export type IdTokenClaims = { email: string; hd: string | null }

/**
 * The email and hd claims from an id_token taken straight from Google's token
 * endpoint over TLS (so its signature need not be checked again). The
 * audience must be our client, the email verified and the token unexpired.
 */
export function readIdToken(idToken: string, clientId: string, nowMs: number): IdTokenClaims | null {
  const parts = idToken.split('.')
  if (parts.length !== 3) return null
  let claims: Record<string, unknown>
  try {
    const parsed: unknown = JSON.parse(Buffer.from(parts[1]!, 'base64url').toString('utf8'))
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) return null
    claims = parsed as Record<string, unknown>
  } catch {
    return null
  }
  if (claims.iss !== 'https://accounts.google.com' && claims.iss !== 'accounts.google.com') return null
  const audOk = claims.aud === clientId || (Array.isArray(claims.aud) && claims.aud.length === 1 && claims.aud[0] === clientId)
  if (!audOk) return null
  if (claims.email_verified !== true && claims.email_verified !== 'true') return null
  if (typeof claims.exp !== 'number' || claims.exp * 1000 <= nowMs) return null
  if (typeof claims.email !== 'string' || claims.email.length === 0) return null
  const hd = typeof claims.hd === 'string' && claims.hd.trim().length > 0 ? claims.hd.trim().toLowerCase() : null
  return { email: normalizeEmail(claims.email), hd }
}

async function postForm(fetchFn: FetchFn, url: string, form: Record<string, string>): Promise<{ status: number; json: Record<string, unknown> } | null> {
  try {
    const response = await fetchFn(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(form).toString(),
      signal: AbortSignal.timeout(GOOGLE_TIMEOUT_MS),
      cache: 'no-store',
    })
    let json: Record<string, unknown> = {}
    try {
      const parsed: unknown = await response.json()
      if (parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed)) json = parsed as Record<string, unknown>
    } catch {
      // An empty or non-JSON body; the status says enough.
    }
    return { status: response.status, json }
  } catch {
    return null
  }
}

export type CodeExchange = { ok: true; idToken: string; refreshToken: string | null } | { ok: false }

export async function exchangeCode(
  fetchFn: FetchFn,
  config: GmailConfig,
  input: { code: string; verifier: string; redirectUri: string },
): Promise<CodeExchange> {
  const result = await postForm(fetchFn, GOOGLE_TOKEN_URL, {
    code: input.code,
    client_id: config.clientId,
    client_secret: config.clientSecret,
    redirect_uri: input.redirectUri,
    grant_type: 'authorization_code',
    code_verifier: input.verifier,
  })
  if (result === null || result.status < 200 || result.status >= 300) return { ok: false }
  const idToken = result.json.id_token
  const refreshToken = result.json.refresh_token
  if (typeof idToken !== 'string') return { ok: false }
  return { ok: true, idToken, refreshToken: typeof refreshToken === 'string' && refreshToken.length > 0 ? refreshToken : null }
}

export type AccessTokenResult = { ok: true; accessToken: string } | { ok: false; reason: 'invalid_grant' | 'failed' }

/** A fresh access token. Never stored. */
export async function refreshAccessToken(fetchFn: FetchFn, config: GmailConfig, refreshToken: string): Promise<AccessTokenResult> {
  const result = await postForm(fetchFn, GOOGLE_TOKEN_URL, {
    client_id: config.clientId,
    client_secret: config.clientSecret,
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
  })
  if (result === null) return { ok: false, reason: 'failed' }
  if (result.json.error === 'invalid_grant') return { ok: false, reason: 'invalid_grant' }
  const accessToken = result.json.access_token
  if (result.status < 200 || result.status >= 300 || typeof accessToken !== 'string') return { ok: false, reason: 'failed' }
  return { ok: true, accessToken }
}

/** True when Google confirmed the revocation. */
export async function revokeToken(fetchFn: FetchFn, token: string): Promise<boolean> {
  const result = await postForm(fetchFn, GOOGLE_REVOKE_URL, { token })
  return result !== null && result.status >= 200 && result.status < 300
}
