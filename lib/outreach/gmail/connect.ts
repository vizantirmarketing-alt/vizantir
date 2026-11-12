/**
 * Connecting and disconnecting the owner's Google mailbox. Pure: the store,
 * fetch and clock are passed in. The routes under app/api/outreach/google/
 * and the disconnect action are thin wrappers.
 */

import { addressFits, workspaceDomain } from '@/lib/outreach/gmail/account'
import type { GmailConfig } from '@/lib/outreach/gmail/config'
import { decryptToken, encryptToken } from '@/lib/outreach/gmail/crypto'
import {
  buildAuthorizationUrl,
  createPkce,
  exchangeCode,
  newState,
  parseStateCookie,
  readIdToken,
  redirectUriFor,
  revokeToken,
  stateCookieValue,
  statesMatch,
  type FetchFn,
} from '@/lib/outreach/gmail/oauth'
import { isValidEmail, normalizeEmail } from '@/lib/outreach/params'
import type { GmailConnectionStore } from '@/lib/outreach/types'

export const NOT_SET_UP = 'Direct sending is not set up yet.'
const NEED_REPLY_TO = 'Add the reply-to email in Outreach settings first. Emails go out as that address.'

export type StartResult = { ok: true; url: string; cookie: string } | { ok: false; message: string }

export function startConnection(config: GmailConfig | null, origin: string, replyTo: string): StartResult {
  if (config === null) return { ok: false, message: NOT_SET_UP }
  const redirectUri = redirectUriFor(origin)
  if (redirectUri === null) return { ok: false, message: 'Google can only be connected from the live dashboard or from local development.' }
  const sendAs = normalizeEmail(replyTo)
  if (!isValidEmail(sendAs)) return { ok: false, message: NEED_REPLY_TO }
  const state = newState()
  const { verifier, challenge } = createPkce()
  return {
    ok: true,
    url: buildAuthorizationUrl({ clientId: config.clientId, redirectUri, state, challenge, replyTo: sendAs }),
    cookie: stateCookieValue(state, verifier),
  }
}

export type ConnectDeps = {
  config: GmailConfig
  connections: GmailConnectionStore
  fetch: FetchFn
  now: () => Date
}

export type CallbackInput = {
  code: string | null
  state: string | null
  /** Google's error parameter, when the owner cancelled or Google refused. */
  error: string | null
  cookie: string | undefined
  redirectUri: string
  replyTo: string
  connectedBy: string
}

export type ConnectResult = { ok: true; email: string } | { ok: false; message: string }

const failed = (message: string): ConnectResult => ({ ok: false, message })

export async function completeConnection(deps: ConnectDeps, input: CallbackInput): Promise<ConnectResult> {
  if (input.error !== null) return failed('Google sign-in was cancelled or refused. Nothing was saved.')
  const saved = parseStateCookie(input.cookie)
  if (saved === null || input.state === null || !statesMatch(saved.state, input.state)) {
    return failed('This Google sign-in could not be verified, so nothing was saved. Start again with Connect Google.')
  }
  if (input.code === null || input.code.length === 0) return failed('Google did not complete the connection. Nothing was saved.')
  const replyTo = normalizeEmail(input.replyTo)
  if (!isValidEmail(replyTo)) return failed(NEED_REPLY_TO)

  const exchange = await exchangeCode(deps.fetch, deps.config, { code: input.code, verifier: saved.verifier, redirectUri: input.redirectUri })
  if (!exchange.ok) return failed('Google did not complete the connection. Nothing was saved. Try again.')

  const claims = readIdToken(exchange.idToken, deps.config.clientId, deps.now().getTime())
  if (claims === null) return failed("Google's reply could not be verified, so nothing was saved. Try again.")

  const mismatch = accountMismatch(claims.email, claims.hd, replyTo)
  if (mismatch !== null) {
    // Not kept, so the permission just granted is handed back.
    if (exchange.refreshToken !== null) await revokeToken(deps.fetch, exchange.refreshToken)
    return failed(mismatch)
  }
  if (exchange.refreshToken === null) {
    return failed('Google did not grant lasting sending permission, so nothing was saved. Try Connect Google again.')
  }

  const sealed = encryptToken(exchange.refreshToken, deps.config.tokenKey)
  await deps.connections.save({
    email: claims.email,
    tokenCiphertext: sealed.ciphertext,
    tokenIv: sealed.iv,
    tokenTag: sealed.tag,
    connectedAt: deps.now().toISOString(),
    connectedBy: normalizeEmail(input.connectedBy),
    needsReconnect: false,
  })
  return { ok: true, email: claims.email }
}

/**
 * Why the signed-in Google account may not send as the reply-to address, or
 * null when it may. On a shared mail provider it must be the address itself.
 * On a Workspace domain it must be on that domain, and Google's hd claim must
 * name the same domain, so a personal account cannot stand in.
 */
function accountMismatch(email: string, hd: string | null, replyTo: string): string | null {
  const domain = workspaceDomain(replyTo)
  if (domain === null) {
    return email === replyTo
      ? null
      : `You signed in to Google as ${email}, but the reply-to address in Outreach settings is ${replyTo}. Nothing was saved. Connect again and choose ${replyTo}.`
  }
  if (!addressFits(email, replyTo).ok) {
    return `You signed in to Google as ${email}, but emails go out as ${replyTo}, so the account must be on ${domain}. Nothing was saved. Connect again with an account on ${domain}.`
  }
  if (hd !== domain) {
    return `You signed in to Google as ${email}, but Google did not confirm it as a Workspace account on ${domain}. Nothing was saved. Connect again with your ${domain} Workspace account.`
  }
  return null
}

/** Revokes the permission at Google, then deletes the row whether or not Google confirmed. */
export async function disconnect(deps: { config: GmailConfig | null; connections: GmailConnectionStore; fetch: FetchFn }): Promise<{ revoked: boolean }> {
  const connection = await deps.connections.get()
  if (connection === null) return { revoked: false }
  let revoked = false
  if (deps.config !== null) {
    const token = decryptToken(
      { ciphertext: connection.tokenCiphertext, iv: connection.tokenIv, tag: connection.tokenTag },
      deps.config.tokenKey,
    )
    if (token !== null) revoked = await revokeToken(deps.fetch, token)
  }
  await deps.connections.remove()
  return { revoked }
}
