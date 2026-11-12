/**
 * TEST FIXTURE. A scripted fetch for Google's endpoints, a fake id_token and
 * a ready connection. Fictional data only; tests never touch the network.
 */

import type { GmailConfig } from '@/lib/outreach/gmail/config'
import { encryptToken } from '@/lib/outreach/gmail/crypto'
import type { FetchFn } from '@/lib/outreach/gmail/oauth'
import type { GmailConnection } from '@/lib/outreach/types'

export const TEST_CONFIG: GmailConfig = {
  clientId: 'test-client.apps.example',
  clientSecret: 'test-secret',
  tokenKey: Buffer.alloc(32, 7),
}

export const NOW = new Date('2026-11-11T18:00:00.000Z')

export function fakeIdToken(claims: Record<string, unknown>): string {
  const part = (value: unknown) => Buffer.from(JSON.stringify(value), 'utf8').toString('base64url')
  return `${part({ alg: 'RS256', typ: 'JWT' })}.${part({
    iss: 'https://accounts.google.com',
    aud: TEST_CONFIG.clientId,
    email_verified: true,
    exp: Math.floor(NOW.getTime() / 1000) + 3600,
    ...claims,
  })}.signature`
}

export type Call = { url: string; body: string; headers: Record<string, string> }

type Reply = { status: number; json?: unknown } | 'timeout' | 'network'

/**
 * Answers by URL. Each route takes a list of replies used in order; the last
 * one repeats. Every call is recorded.
 */
export function scriptedFetch(routes: Record<string, Reply[]>): { fetch: FetchFn; calls: Call[] } {
  const calls: Call[] = []
  const used: Record<string, number> = {}
  const fetchFn: FetchFn = async (input, init) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url
    const headers: Record<string, string> = {}
    new Headers(init?.headers).forEach((value, key) => {
      headers[key] = value
    })
    calls.push({ url, body: typeof init?.body === 'string' ? init.body : '', headers })
    const replies = routes[url]
    if (replies === undefined || replies.length === 0) throw new Error(`Unexpected request to ${url}`)
    const index = Math.min(used[url] ?? 0, replies.length - 1)
    used[url] = (used[url] ?? 0) + 1
    const reply = replies[index]!
    if (reply === 'timeout') throw new DOMException('The operation was aborted due to timeout', 'TimeoutError')
    if (reply === 'network') throw new TypeError('fetch failed')
    return new Response(reply.json === undefined ? '' : JSON.stringify(reply.json), {
      status: reply.status,
      headers: { 'Content-Type': 'application/json' },
    })
  }
  return { fetch: fetchFn, calls }
}

export function connectionFor(email: string, refreshToken = 'refresh-token-fictional', needsReconnect = false): GmailConnection {
  const sealed = encryptToken(refreshToken, TEST_CONFIG.tokenKey)
  return {
    email,
    tokenCiphertext: sealed.ciphertext,
    tokenIv: sealed.iv,
    tokenTag: sealed.tag,
    connectedAt: NOW.toISOString(),
    connectedBy: 'owner@vizantir.example',
    needsReconnect,
  }
}
