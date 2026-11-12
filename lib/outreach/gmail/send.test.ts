// Run with: NODE_OPTIONS=--conditions=react-server pnpm exec tsx --test lib/outreach/gmail/send.test.ts
import assert from 'node:assert/strict'
import { beforeEach, describe, it } from 'node:test'

import { MemoryGmailConnectionStore, MemoryOutreachStore } from '../fixtures/memory-store'
import { FIXTURE_SETTINGS } from '../fixtures/leads.fixture'
import { decodeMultipart } from '../fixtures/mime.fixture'
import { NOW, TEST_CONFIG, connectionFor, scriptedFetch } from '../fixtures/gmail.fixture'
import { markSent, doNotContact } from '../lifecycle'
import { OUTREACH_DAILY_SEND_LIMIT, SENDING_STALE_MS } from '../params'
import { GMAIL_SEND_URL, sendGmailMessage } from './api'
import { GOOGLE_TOKEN_URL } from './oauth'
import { NOT_CONFIRMED, approveAndSend, type SendDeps } from './send'

const TO = 'owner@halcyon-fictional.example'
const TOKEN_OK = { status: 200, json: { access_token: 'access-fictional', expires_in: 3599 } }
const SENT_OK = { status: 200, json: { id: 'msg-1', threadId: 'thread-1', labelIds: ['SENT'] } }

let store: MemoryOutreachStore
let connections: MemoryGmailConnectionStore

async function newDraft(overrides: { toEmail?: string | null; subjectRef?: string; approved?: boolean } = {}): Promise<string> {
  const result = await store.insertDraft(
    {
      subjectType: 'prospect',
      subjectRef: overrides.subjectRef ?? 'prospect-a',
      leadId: overrides.subjectRef ?? 'prospect-a',
      leadName: 'Fictional Firm',
      toEmail: overrides.toEmail === undefined ? TO : overrides.toEmail,
      subject: 'Your contact page',
      body: 'Hello,\n\nA short note about your contact page.',
      footer: 'James\nVizantir Design Studio\n100 Example Plaza',
      model: 'test-model',
      promptVersion: 'outreach-v4',
    },
    null,
    NOW.toISOString(),
  )
  assert.ok(result.ok)
  if (overrides.approved !== false) {
    await store.updateDraft(result.id, ['draft'], { status: 'approved', approvedAt: NOW.toISOString(), updatedAt: NOW.toISOString() })
  }
  return result.id
}

function deps(fetchFn: SendDeps['fetch'], overrides: Partial<SendDeps> = {}): SendDeps {
  return { store, connections, config: TEST_CONFIG, fetch: fetchFn, now: () => NOW, checkRules: async () => [], ...overrides }
}

const sendCalls = (calls: { url: string }[]) => calls.filter((call) => call.url === GMAIL_SEND_URL).length

beforeEach(() => {
  store = new MemoryOutreachStore(FIXTURE_SETTINGS)
  connections = new MemoryGmailConnectionStore()
  connections.connection = connectionFor('studio@vizantir.example')
})

describe('approve and send', () => {
  it('sends the locked subject, body and footer, and records the Gmail ids', async () => {
    const id = await newDraft()
    const { fetch, calls } = scriptedFetch({ [GOOGLE_TOKEN_URL]: [TOKEN_OK], [GMAIL_SEND_URL]: [SENT_OK] })
    const result = await approveAndSend(deps(fetch), id)
    assert.ok(result.ok)
    const row = (await store.getDraft(id))!
    assert.equal(row.status, 'sent')
    assert.equal(row.sentVia, 'gmail')
    assert.equal(row.gmailMessageId, 'msg-1')
    assert.equal(row.gmailThreadId, 'thread-1')
    assert.equal(row.sentAt, NOW.toISOString())

    const send = calls.find((call) => call.url === GMAIL_SEND_URL)!
    assert.equal(send.headers.authorization, 'Bearer access-fictional')
    const raw = Buffer.from(JSON.parse(send.body).raw as string, 'base64url').toString('utf8')
    assert.match(raw, /^From: "James" <studio@vizantir\.example>\r\n/)
    assert.match(raw, /\r\nTo: owner@halcyon-fictional\.example\r\n/)
    assert.match(raw, /\r\nReply-To: studio@vizantir\.example\r\n/)
    assert.match(raw, /\r\nSubject: Your contact page\r\n/)
    const text = decodeMultipart(JSON.parse(send.body).raw as string).parts[0]!.text
    assert.equal(text, 'Hello,\r\n\r\nA short note about your contact page.\r\n\r\nJames\r\nVizantir Design Studio\r\n100 Example Plaza')
  })

  it('a draft that passes the hard rules is approved and sent in one step', async () => {
    const id = await newDraft({ approved: false })
    const { fetch } = scriptedFetch({ [GOOGLE_TOKEN_URL]: [TOKEN_OK], [GMAIL_SEND_URL]: [SENT_OK] })
    const result = await approveAndSend(deps(fetch), id)
    assert.ok(result.ok)
    const row = (await store.getDraft(id))!
    assert.equal(row.status, 'sent')
    assert.equal(row.approvedAt, NOW.toISOString())
  })

  it('a draft that breaks a hard rule is refused before anything is sent', async () => {
    const id = await newDraft({ approved: false })
    const { fetch, calls } = scriptedFetch({})
    const result = await approveAndSend(deps(fetch, { checkRules: async () => ["The opening line was not 'Hello,'."] }), id)
    assert.equal(result.ok, false)
    if (!result.ok) assert.match(result.error, /opening line/)
    assert.equal(calls.length, 0)
    assert.equal((await store.getDraft(id))!.status, 'draft')
  })

  it('a suppressed recipient is refused at send time, by address and by domain', async () => {
    const id = await newDraft()
    await store.addSuppression({ email: TO, domain: null, reason: 'manual' }, NOW.toISOString())
    const { fetch, calls } = scriptedFetch({})
    const byAddress = await approveAndSend(deps(fetch), id)
    assert.equal(byAddress.ok, false)
    if (!byAddress.ok) assert.match(byAddress.error, /do-not-contact/)

    store.suppressions = []
    await store.addSuppression({ email: 'someone@halcyon-fictional.example', domain: 'halcyon-fictional.example', reason: 'manual' }, NOW.toISOString())
    const byDomain = await approveAndSend(deps(fetch), id)
    assert.equal(byDomain.ok, false)
    assert.equal(calls.length, 0)
    assert.equal((await store.getDraft(id))!.status, 'approved')
  })

  it('refuses the 21st Gmail send of the day; mail-app sends do not count', async () => {
    const { fetch, calls } = scriptedFetch({ [GOOGLE_TOKEN_URL]: [TOKEN_OK], [GMAIL_SEND_URL]: [SENT_OK] })
    for (let i = 0; i < OUTREACH_DAILY_SEND_LIMIT; i++) {
      const id = await newDraft({ subjectRef: `lead-${i}` })
      assert.ok((await approveAndSend(deps(fetch), id)).ok, `send ${i + 1}`)
    }
    const mailApp = await newDraft({ subjectRef: 'lead-mail-app' })
    assert.ok((await markSent(store, mailApp, NOW.toISOString())).ok)
    assert.equal((await store.getDraft(mailApp))!.sentVia, 'mail_app')

    const twentyFirst = await newDraft({ subjectRef: 'lead-21' })
    const result = await approveAndSend(deps(fetch), twentyFirst)
    assert.equal(result.ok, false)
    if (!result.ok) assert.match(result.error, /20 of 20/)
    assert.equal(sendCalls(calls), OUTREACH_DAILY_SEND_LIMIT)
    assert.equal((await store.getDraft(twentyFirst))!.status, 'approved')
  })

  it('a double click sends once', async () => {
    const id = await newDraft()
    const { fetch, calls } = scriptedFetch({ [GOOGLE_TOKEN_URL]: [TOKEN_OK], [GMAIL_SEND_URL]: [SENT_OK] })
    const [first, second] = await Promise.all([approveAndSend(deps(fetch), id), approveAndSend(deps(fetch), id)])
    assert.equal([first, second].filter((r) => r.ok).length, 1)
    const refused = [first, second].find((r) => !r.ok)
    assert.ok(refused && !refused.ok && /already being sent, or was sent/.test(refused.error))
    assert.equal(sendCalls(calls), 1)
    // And once more after it was sent.
    const again = await approveAndSend(deps(fetch), id)
    assert.equal(again.ok, false)
    assert.equal(sendCalls(calls), 1)
  })

  it('a header containing a line break is refused and the draft is untouched', async () => {
    const id = await newDraft()
    store.settings = { ...FIXTURE_SETTINGS, senderName: 'James\r\nBcc: someone@attacker.example' }
    const { fetch, calls } = scriptedFetch({})
    const result = await approveAndSend(deps(fetch), id)
    assert.equal(result.ok, false)
    if (!result.ok) assert.match(result.error, /line break/)
    assert.equal(calls.length, 0)
    assert.equal((await store.getDraft(id))!.status, 'approved')
  })

  it('a 4xx returns the draft to approved with a short error', async () => {
    const id = await newDraft()
    const { fetch, calls } = scriptedFetch({
      [GOOGLE_TOKEN_URL]: [TOKEN_OK],
      [GMAIL_SEND_URL]: [{ status: 400, json: { error: { code: 400, message: 'Invalid To header' } } }],
    })
    const result = await approveAndSend(deps(fetch), id)
    assert.equal(result.ok, false)
    if (!result.ok) {
      assert.equal(result.outcome, 'rejected')
      assert.match(result.error, /Google refused the email \(HTTP 400\): Invalid To header/)
    }
    const row = (await store.getDraft(id))!
    assert.equal(row.status, 'approved')
    assert.match(row.sendError ?? '', /HTTP 400/)
    assert.equal(row.sentAt, null)
    assert.equal(sendCalls(calls), 1)
  })

  it('a timeout becomes not confirmed, with no retry', async () => {
    const id = await newDraft()
    const { fetch, calls } = scriptedFetch({ [GOOGLE_TOKEN_URL]: [TOKEN_OK], [GMAIL_SEND_URL]: ['timeout', SENT_OK] })
    const result = await approveAndSend(deps(fetch), id)
    assert.deepEqual(result, { ok: false, outcome: 'unconfirmed', error: NOT_CONFIRMED })
    assert.equal(NOT_CONFIRMED, 'Not confirmed. Check your Sent folder before trying again.')
    assert.equal((await store.getDraft(id))!.status, 'send_unconfirmed')
    assert.equal(sendCalls(calls), 1)
  })

  it('a 5xx becomes not confirmed too; the owner can then mark it sent (through Gmail) or try again', async () => {
    const id = await newDraft()
    const { fetch, calls } = scriptedFetch({ [GOOGLE_TOKEN_URL]: [TOKEN_OK], [GMAIL_SEND_URL]: [{ status: 503, json: {} }, SENT_OK] })
    assert.equal((await approveAndSend(deps(fetch), id)).ok, false)
    assert.equal((await store.getDraft(id))!.status, 'send_unconfirmed')
    // Try again is a new click.
    assert.ok((await approveAndSend(deps(fetch), id)).ok)
    assert.equal(sendCalls(calls), 2)

    const other = await newDraft({ subjectRef: 'lead-b' })
    const timeout = scriptedFetch({ [GOOGLE_TOKEN_URL]: [TOKEN_OK], [GMAIL_SEND_URL]: ['network'] })
    await approveAndSend(deps(timeout.fetch), other)
    const marked = await markSent(store, other, NOW.toISOString())
    assert.ok(marked.ok)
    assert.equal((await store.getDraft(other))!.sentVia, 'gmail')
  })

  it('invalid_grant marks the connection as needing reconnect, and nothing is sent', async () => {
    const id = await newDraft()
    const { fetch, calls } = scriptedFetch({ [GOOGLE_TOKEN_URL]: [{ status: 400, json: { error: 'invalid_grant', error_description: 'Token has been expired or revoked.' } }] })
    const result = await approveAndSend(deps(fetch), id)
    assert.equal(result.ok, false)
    if (!result.ok) assert.match(result.error, /Reconnect Google/)
    assert.equal(connections.connection?.needsReconnect, true)
    assert.equal(sendCalls(calls), 0)
    assert.equal((await store.getDraft(id))!.status, 'approved')
    // And the next click is refused without asking Google.
    const next = await approveAndSend(deps(fetch), id)
    assert.equal(next.ok, false)
    assert.equal(calls.length, 1)
  })

  it('missing configuration or connection refuses without throwing', async () => {
    const id = await newDraft()
    const { fetch, calls } = scriptedFetch({})
    const notSetUp = await approveAndSend(deps(fetch, { config: null }), id)
    assert.equal(notSetUp.ok, false)
    if (!notSetUp.ok) assert.equal(notSetUp.error, 'Direct sending is not set up yet.')
    connections.connection = null
    assert.equal((await approveAndSend(deps(fetch), id)).ok, false)
    assert.equal(calls.length, 0)
  })

  it('a missing recipient is refused', async () => {
    const id = await newDraft({ toEmail: null, approved: false })
    const result = await approveAndSend(deps(scriptedFetch({}).fetch), id)
    assert.equal(result.ok, false)
    if (!result.ok) assert.match(result.error, /recipient/)
  })

  it('a send in flight cannot be sent again until it is stale', async () => {
    const id = await newDraft()
    await store.updateDraft(id, ['approved'], { status: 'sending', updatedAt: NOW.toISOString() })
    const { fetch, calls } = scriptedFetch({ [GOOGLE_TOKEN_URL]: [TOKEN_OK], [GMAIL_SEND_URL]: [SENT_OK] })
    const now = await approveAndSend(deps(fetch), id)
    assert.equal(now.ok, false)
    if (!now.ok) assert.match(now.error, /already being sent/)
    assert.equal(calls.length, 0)
    const later = new Date(NOW.getTime() + SENDING_STALE_MS + 1000)
    assert.ok((await approveAndSend(deps(fetch, { now: () => later }), id)).ok)
  })

  it('do not contact on a not confirmed email keeps its record', async () => {
    const id = await newDraft()
    await store.updateDraft(id, ['approved'], { status: 'send_unconfirmed', updatedAt: NOW.toISOString() })
    assert.ok((await doNotContact(store, id, NOW.toISOString())).ok)
    assert.equal((await store.getDraft(id))!.status, 'send_unconfirmed')
    assert.equal(store.suppressions.length, 1)
  })
})

describe('sending as an alias', () => {
  it('sends From the reply-to address with the token of the connected account', async () => {
    connections.connection = connectionFor('owner@vizantir.example', 'refresh-token-owner')
    const id = await newDraft()
    const { fetch, calls } = scriptedFetch({ [GOOGLE_TOKEN_URL]: [TOKEN_OK], [GMAIL_SEND_URL]: [SENT_OK] })
    const result = await approveAndSend(deps(fetch), id)
    assert.ok(result.ok)
    const refresh = calls.find((call) => call.url === GOOGLE_TOKEN_URL)!
    assert.equal(new URLSearchParams(refresh.body).get('refresh_token'), 'refresh-token-owner')
    const send = calls.find((call) => call.url === GMAIL_SEND_URL)!
    assert.equal(send.headers.authorization, 'Bearer access-fictional')
    const raw = Buffer.from(JSON.parse(send.body).raw as string, 'base64url').toString('utf8')
    assert.match(raw, /^From: "James" <studio@vizantir\.example>\r\n/)
    assert.match(raw, /\r\nReply-To: studio@vizantir\.example\r\n/)
    assert.ok(!raw.includes('owner@vizantir.example'))
  })

  it('a reply-to changed to another domain after connecting refuses the send, and nothing is sent', async () => {
    store = new MemoryOutreachStore({ ...FIXTURE_SETTINGS, replyToEmail: 'hello@another-fictional.example' })
    connections.connection = connectionFor('owner@vizantir.example')
    const id = await newDraft()
    const { fetch, calls } = scriptedFetch({ [GOOGLE_TOKEN_URL]: [TOKEN_OK], [GMAIL_SEND_URL]: [SENT_OK] })
    const result = await approveAndSend(deps(fetch), id)
    assert.equal(result.ok, false)
    if (!result.ok) {
      assert.equal(result.outcome, 'refused')
      assert.match(result.error, /owner@vizantir\.example/)
      assert.match(result.error, /hello@another-fictional\.example/)
      assert.match(result.error, /Reconnect Google/)
    }
    assert.equal(calls.length, 0)
    assert.equal((await store.getDraft(id))!.status, 'approved')
  })

  it('on a shared mail provider a different stored address refuses the send', async () => {
    store = new MemoryOutreachStore({ ...FIXTURE_SETTINGS, replyToEmail: 'someone.fictional@gmail.com' })
    connections.connection = connectionFor('another.fictional@gmail.com')
    const id = await newDraft()
    const { fetch, calls } = scriptedFetch({})
    assert.equal((await approveAndSend(deps(fetch), id)).ok, false)
    assert.equal(calls.length, 0)
  })
})

describe('the Gmail request', () => {
  it('a request that never answers times out as unknown', async () => {
    const hanging: SendDeps['fetch'] = (_input, init) =>
      new Promise((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => reject(init.signal?.reason))
      })
    assert.deepEqual(await sendGmailMessage(hanging, 'token', 'raw', 20), { kind: 'unknown' })
  })

  it('408 and 5xx are unknown; other 4xx are refusals', async () => {
    for (const [status, kind] of [[408, 'unknown'], [500, 'unknown'], [502, 'unknown'], [400, 'rejected'], [403, 'rejected'], [429, 'rejected']] as const) {
      const { fetch } = scriptedFetch({ [GMAIL_SEND_URL]: [{ status, json: { error: { message: 'x' } } }] })
      assert.equal((await sendGmailMessage(fetch, 'token', 'raw')).kind, kind, String(status))
    }
  })
})
