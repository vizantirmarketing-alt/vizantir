// Run with: NODE_OPTIONS=--conditions=react-server pnpm exec tsx --test lib/outreach/gmail/connect.test.ts
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { MemoryGmailConnectionStore } from '../fixtures/memory-store'
import { gmailConfigFrom, decodeTokenKey } from './config'
import { completeConnection, disconnect, startConnection, NOT_SET_UP, type CallbackInput } from './connect'
import { decryptToken, encryptToken } from './crypto'
import { NOW, TEST_CONFIG, connectionFor, fakeIdToken, scriptedFetch } from '../fixtures/gmail.fixture'
import {
  GMAIL_SCOPES,
  GOOGLE_REVOKE_URL,
  GOOGLE_TOKEN_URL,
  parseStateCookie,
  pkceChallenge,
  readIdToken,
  redirectUriFor,
  statesMatch,
} from './oauth'
import { connectionView } from './view'

const REPLY_TO = 'studio@vizantir.example'
const STATE = 'a'.repeat(43)
const VERIFIER = 'b'.repeat(43)

function input(overrides: Partial<CallbackInput> = {}): CallbackInput {
  return {
    code: 'auth-code',
    state: STATE,
    error: null,
    cookie: `${STATE}.${VERIFIER}`,
    redirectUri: 'http://localhost:3000/api/outreach/google/callback',
    replyTo: REPLY_TO,
    connectedBy: 'Owner@Vizantir.Example',
    ...overrides,
  }
}

function tokenReply(json: Record<string, unknown>) {
  return { [GOOGLE_TOKEN_URL]: [{ status: 200, json }], [GOOGLE_REVOKE_URL]: [{ status: 200, json: {} }] }
}

function deps(fetchFn: ReturnType<typeof scriptedFetch>['fetch'], connections = new MemoryGmailConnectionStore()) {
  return { config: TEST_CONFIG, connections, fetch: fetchFn, now: () => NOW }
}

describe('configuration', () => {
  it('missing or malformed environment variables give null, without throwing', () => {
    const key = Buffer.alloc(32, 1).toString('base64')
    assert.equal(gmailConfigFrom({}), null)
    assert.equal(gmailConfigFrom({ GMAIL_OAUTH_CLIENT_ID: 'id', GMAIL_OAUTH_CLIENT_SECRET: 'secret' }), null)
    assert.equal(gmailConfigFrom({ GMAIL_OAUTH_CLIENT_ID: 'id', OUTREACH_TOKEN_KEY: key }), null)
    assert.equal(gmailConfigFrom({ GMAIL_OAUTH_CLIENT_ID: ' ', GMAIL_OAUTH_CLIENT_SECRET: 'secret', OUTREACH_TOKEN_KEY: key }), null)
    assert.equal(gmailConfigFrom({ GMAIL_OAUTH_CLIENT_ID: 'id', GMAIL_OAUTH_CLIENT_SECRET: 'secret', OUTREACH_TOKEN_KEY: 'too-short' }), null)
    assert.equal(decodeTokenKey(Buffer.alloc(31).toString('base64')), null)
    assert.equal(decodeTokenKey('not base64 at all!'), null)
    const config = gmailConfigFrom({ GMAIL_OAUTH_CLIENT_ID: 'id', GMAIL_OAUTH_CLIENT_SECRET: 'secret', OUTREACH_TOKEN_KEY: key })
    assert.equal(config?.tokenKey.length, 32)
  })

  it('without configuration the settings say it is not set up, and Connect is refused', () => {
    assert.deepEqual(connectionView(null, null, REPLY_TO), { state: 'not_set_up' })
    assert.deepEqual(connectionView(null, connectionFor(REPLY_TO), REPLY_TO), { state: 'not_set_up' })
    assert.deepEqual(startConnection(null, 'http://localhost:3000', REPLY_TO), { ok: false, message: NOT_SET_UP })
  })
})

describe('token encryption', () => {
  it('round trips with a new IV every time', () => {
    const a = encryptToken('refresh-token-fictional', TEST_CONFIG.tokenKey)
    const b = encryptToken('refresh-token-fictional', TEST_CONFIG.tokenKey)
    assert.notEqual(a.iv, b.iv)
    assert.notEqual(a.ciphertext, b.ciphertext)
    assert.equal(Buffer.from(a.iv, 'base64').length, 12)
    assert.equal(Buffer.from(a.tag, 'base64').length, 16)
    assert.equal(decryptToken(a, TEST_CONFIG.tokenKey), 'refresh-token-fictional')
  })

  it('fails on a changed ciphertext, IV, tag or key', () => {
    const sealed = encryptToken('refresh-token-fictional', TEST_CONFIG.tokenKey)
    const flip = (b64: string) => {
      const bytes = Buffer.from(b64, 'base64')
      bytes[0] = bytes[0]! ^ 1
      return bytes.toString('base64')
    }
    assert.equal(decryptToken({ ...sealed, ciphertext: flip(sealed.ciphertext) }, TEST_CONFIG.tokenKey), null)
    assert.equal(decryptToken({ ...sealed, iv: flip(sealed.iv) }, TEST_CONFIG.tokenKey), null)
    assert.equal(decryptToken({ ...sealed, tag: flip(sealed.tag) }, TEST_CONFIG.tokenKey), null)
    assert.equal(decryptToken(sealed, Buffer.alloc(32, 8)), null)
  })
})

describe('starting the connection', () => {
  it('asks for exactly the three scopes, offline access, consent, PKCE and the Workspace domain, with no login hint', () => {
    const started = startConnection(TEST_CONFIG, 'https://www.vizantir.com', 'Studio@Vizantir.Example')
    assert.ok(started.ok)
    if (!started.ok) return
    const url = new URL(started.url)
    assert.equal(url.origin + url.pathname, 'https://accounts.google.com/o/oauth2/v2/auth')
    assert.equal(url.searchParams.get('scope'), 'openid email https://www.googleapis.com/auth/gmail.send')
    assert.deepEqual(url.searchParams.get('scope')?.split(' '), [...GMAIL_SCOPES])
    assert.equal(url.searchParams.get('access_type'), 'offline')
    assert.equal(url.searchParams.get('prompt'), 'consent')
    // The reply-to may be an alias, which is not a sign-in name.
    assert.equal(url.searchParams.get('login_hint'), null)
    assert.equal(url.searchParams.get('hd'), 'vizantir.example')
    assert.equal(url.searchParams.get('redirect_uri'), 'https://www.vizantir.com/api/outreach/google/callback')
    assert.equal(url.searchParams.get('code_challenge_method'), 'S256')
    const saved = parseStateCookie(started.cookie)
    assert.ok(saved)
    assert.equal(url.searchParams.get('state'), saved?.state)
    assert.equal(url.searchParams.get('code_challenge'), pkceChallenge(saved!.verifier))
  })

  it('for a shared mail provider sends the login hint and no hd', () => {
    const started = startConnection(TEST_CONFIG, 'http://localhost:3000', 'Someone.Fictional@gmail.com')
    assert.ok(started.ok)
    if (!started.ok) return
    const url = new URL(started.url)
    assert.equal(url.searchParams.get('hd'), null)
    assert.equal(url.searchParams.get('login_hint'), 'someone.fictional@gmail.com')
  })

  it('accepts only the production origin and localhost:3000', () => {
    assert.equal(redirectUriFor('https://www.vizantir.com'), 'https://www.vizantir.com/api/outreach/google/callback')
    assert.equal(redirectUriFor('http://localhost:3000'), 'http://localhost:3000/api/outreach/google/callback')
    for (const origin of ['https://vizantir-git-branch.vercel.app', 'http://www.vizantir.com', 'http://localhost:3001', 'https://evil.example']) {
      assert.equal(redirectUriFor(origin), null, origin)
      assert.equal(startConnection(TEST_CONFIG, origin, REPLY_TO).ok, false, origin)
    }
  })

  it('needs a reply-to address first', () => {
    assert.equal(startConnection(TEST_CONFIG, 'http://localhost:3000', '').ok, false)
  })
})

describe('the callback', () => {
  it('a state mismatch is rejected before any request to Google', async () => {
    const { fetch, calls } = scriptedFetch({})
    const connections = new MemoryGmailConnectionStore()
    for (const bad of [
      input({ state: 'c'.repeat(43) }),
      input({ state: null }),
      input({ cookie: undefined }),
      input({ cookie: 'garbage' }),
      input({ state: STATE.slice(1) }),
    ]) {
      const result = await completeConnection(deps(fetch, connections), bad)
      assert.equal(result.ok, false)
      if (!result.ok) assert.match(result.message, /could not be verified/)
    }
    assert.equal(calls.length, 0)
    assert.equal(connections.connection, null)
    assert.equal(statesMatch('abc', 'abc'), true)
    assert.equal(statesMatch('abc', 'abd'), false)
    assert.equal(statesMatch('', ''), false)
  })

  it('stores the encrypted refresh token for the reply-to address and sends the PKCE verifier', async () => {
    const { fetch, calls } = scriptedFetch(tokenReply({ id_token: fakeIdToken({ email: 'Studio@Vizantir.Example', hd: 'vizantir.example' }), refresh_token: 'refresh-token-fictional' }))
    const connections = new MemoryGmailConnectionStore()
    const result = await completeConnection(deps(fetch, connections), input())
    assert.deepEqual(result, { ok: true, email: REPLY_TO })
    const body = new URLSearchParams(calls[0]!.body)
    assert.equal(body.get('code_verifier'), VERIFIER)
    assert.equal(body.get('grant_type'), 'authorization_code')
    const saved = connections.connection!
    assert.equal(saved.email, REPLY_TO)
    assert.equal(saved.connectedBy, 'owner@vizantir.example')
    assert.equal(saved.needsReconnect, false)
    assert.ok(!saved.tokenCiphertext.includes('refresh-token-fictional'))
    assert.equal(decryptToken({ ciphertext: saved.tokenCiphertext, iv: saved.tokenIv, tag: saved.tokenTag }, TEST_CONFIG.tokenKey), 'refresh-token-fictional')
  })

  it('an account on another domain is rejected, nothing is stored, and the message names the account and the domain', async () => {
    const { fetch, calls } = scriptedFetch(tokenReply({ id_token: fakeIdToken({ email: 'other@elsewhere.example', hd: 'elsewhere.example' }), refresh_token: 'refresh-token-fictional' }))
    const connections = new MemoryGmailConnectionStore()
    const result = await completeConnection(deps(fetch, connections), input())
    assert.equal(result.ok, false)
    if (!result.ok) {
      assert.match(result.message, /other@elsewhere\.example/)
      assert.match(result.message, /must be on vizantir\.example/)
    }
    assert.equal(connections.connection, null)
    assert.equal(connections.saves, 0)
    // The permission just granted is handed back.
    assert.ok(calls.some((call) => call.url === GOOGLE_REVOKE_URL))
  })

  it('a missing refresh token is rejected and nothing is stored', async () => {
    const { fetch } = scriptedFetch(tokenReply({ id_token: fakeIdToken({ email: REPLY_TO, hd: 'vizantir.example' }) }))
    const connections = new MemoryGmailConnectionStore()
    const result = await completeConnection(deps(fetch, connections), input())
    assert.equal(result.ok, false)
    if (!result.ok) assert.match(result.message, /lasting sending permission/)
    assert.equal(connections.saves, 0)
  })

  it('an id_token for another client, unverified or expired is rejected', async () => {
    for (const claims of [{ aud: 'someone-else' }, { email_verified: false }, { exp: Math.floor(NOW.getTime() / 1000) - 10 }, { iss: 'https://evil.example' }]) {
      const { fetch } = scriptedFetch(tokenReply({ id_token: fakeIdToken({ email: REPLY_TO, hd: 'vizantir.example', ...claims }), refresh_token: 'r' }))
      const connections = new MemoryGmailConnectionStore()
      const result = await completeConnection(deps(fetch, connections), input())
      assert.equal(result.ok, false, JSON.stringify(claims))
      assert.equal(connections.saves, 0)
    }
    assert.equal(readIdToken('not-a-jwt', TEST_CONFIG.clientId, NOW.getTime()), null)
  })

  it('an alias on the same Workspace domain is accepted, and the connected primary address is stored', async () => {
    const { fetch, calls } = scriptedFetch(tokenReply({ id_token: fakeIdToken({ email: 'owner@vizantir.example', hd: 'vizantir.example' }), refresh_token: 'refresh-token-owner' }))
    const connections = new MemoryGmailConnectionStore()
    const result = await completeConnection(deps(fetch, connections), input())
    assert.deepEqual(result, { ok: true, email: 'owner@vizantir.example' })
    assert.equal(connections.connection?.email, 'owner@vizantir.example')
    assert.ok(!calls.some((call) => call.url === GOOGLE_REVOKE_URL))
    const view = connectionView(TEST_CONFIG, connections.connection, REPLY_TO)
    assert.ok(view.state === 'connected')
    if (view.state === 'connected') {
      assert.equal(view.email, 'owner@vizantir.example')
      assert.equal(view.sendsAs, REPLY_TO)
      assert.equal(view.fits, true)
    }
  })

  it('a missing or wrong hd claim is refused on a Workspace domain, and nothing is stored', async () => {
    for (const hd of [undefined, 'elsewhere.example', '']) {
      const { fetch, calls } = scriptedFetch(tokenReply({ id_token: fakeIdToken({ email: 'owner@vizantir.example', hd }), refresh_token: 'refresh-token-owner' }))
      const connections = new MemoryGmailConnectionStore()
      const result = await completeConnection(deps(fetch, connections), input())
      assert.equal(result.ok, false, String(hd))
      if (!result.ok) {
        assert.match(result.message, /owner@vizantir\.example/)
        assert.match(result.message, /Workspace account on vizantir\.example/)
      }
      assert.equal(connections.saves, 0)
      assert.ok(calls.some((call) => call.url === GOOGLE_REVOKE_URL))
    }
  })

  it('on a shared mail provider the account must be the reply-to address exactly', async () => {
    const replyTo = 'someone.fictional@gmail.com'
    const other = scriptedFetch(tokenReply({ id_token: fakeIdToken({ email: 'another.fictional@gmail.com' }), refresh_token: 'r' }))
    const refused = new MemoryGmailConnectionStore()
    const result = await completeConnection(deps(other.fetch, refused), input({ replyTo }))
    assert.equal(result.ok, false)
    if (!result.ok) {
      assert.match(result.message, /another\.fictional@gmail\.com/)
      assert.match(result.message, /someone\.fictional@gmail\.com/)
    }
    assert.equal(refused.saves, 0)

    const same = scriptedFetch(tokenReply({ id_token: fakeIdToken({ email: 'Someone.Fictional@gmail.com' }), refresh_token: 'r' }))
    const accepted = new MemoryGmailConnectionStore()
    assert.deepEqual(await completeConnection(deps(same.fetch, accepted), input({ replyTo })), { ok: true, email: replyTo })
    const view = connectionView(TEST_CONFIG, accepted.connection, replyTo)
    if (view.state === 'connected') assert.equal(view.sendsAs, null)
  })

  it('the settings flag a connection that no longer fits the reply-to address', () => {
    const view = connectionView(TEST_CONFIG, connectionFor('owner@vizantir.example'), 'hello@another-fictional.example')
    assert.ok(view.state === 'connected' && view.fits === false)
  })

  it('a cancelled sign-in or a failed exchange stores nothing', async () => {
    const cancelled = await completeConnection(deps(scriptedFetch({}).fetch), input({ error: 'access_denied' }))
    assert.equal(cancelled.ok, false)
    const { fetch } = scriptedFetch({ [GOOGLE_TOKEN_URL]: [{ status: 400, json: { error: 'invalid_grant' } }] })
    const connections = new MemoryGmailConnectionStore()
    assert.equal((await completeConnection(deps(fetch, connections), input())).ok, false)
    assert.equal(connections.saves, 0)
  })
})

describe('disconnecting', () => {
  it('revokes, then deletes the row', async () => {
    const connections = new MemoryGmailConnectionStore()
    connections.connection = connectionFor(REPLY_TO)
    const { fetch, calls } = scriptedFetch({ [GOOGLE_REVOKE_URL]: [{ status: 200, json: {} }] })
    assert.deepEqual(await disconnect({ config: TEST_CONFIG, connections, fetch }), { revoked: true })
    assert.equal(new URLSearchParams(calls[0]!.body).get('token'), 'refresh-token-fictional')
    assert.equal(connections.connection, null)
  })

  it('deletes the row even when revoking fails', async () => {
    for (const reply of [{ status: 400, json: { error: 'invalid_token' } }, 'network' as const]) {
      const connections = new MemoryGmailConnectionStore()
      connections.connection = connectionFor(REPLY_TO)
      const { fetch } = scriptedFetch({ [GOOGLE_REVOKE_URL]: [reply] })
      assert.deepEqual(await disconnect({ config: TEST_CONFIG, connections, fetch }), { revoked: false })
      assert.equal(connections.connection, null)
    }
  })
})
