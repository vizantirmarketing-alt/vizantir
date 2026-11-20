// Run with: NODE_OPTIONS=--conditions=react-server pnpm exec tsx --test lib/outreach/footer.test.ts
// Which footer an email shows and sends: a draft that needs review follows the
// settings and the code as they are now, approval freezes it, Edit again
// unfreezes it, and a sent email keeps the footer it was sent with. Memory
// stores and scripted Google responses; no network or database. Fictional
// data only.
import assert from 'node:assert/strict'
import { beforeEach, describe, it } from 'node:test'

import { MemoryCallStore, OPEN_CLEAN_LEAD } from './fixtures/memory-call-store'
import { MemoryGmailConnectionStore, MemoryOutreachStore } from './fixtures/memory-store'
import { FIXTURE_SETTINGS } from './fixtures/leads.fixture'
import { decodeMultipart } from './fixtures/mime.fixture'
import { NOW, TEST_CONFIG, connectionFor, scriptedFetch } from './fixtures/gmail.fixture'
import { GMAIL_SEND_URL } from './gmail/api'
import { GOOGLE_TOKEN_URL } from './gmail/oauth'
import { approveAndSend } from './gmail/send'
import { approveDraft, editAgain, markSent } from './lifecycle'
import { messageText } from './mailto'
import { OPT_OUT_LINE } from './params'
import { buildFooter, draftFooter, footerOutdated } from './settings'

const TO = 'owner@fictional-firm.example'
const BODY = 'Hello,\n\nA short note about your contact page.'
const TOKEN_OK = { status: 200, json: { access_token: 'access-fictional', expires_in: 3599 } }
const SENT_OK = { status: 200, json: { id: 'msg-1', threadId: 'thread-1', labelIds: ['SENT'] } }
/** A footer stored before the opt-out wording changed. */
const OLD_FOOTER = `${FIXTURE_SETTINGS.senderName}\n${FIXTURE_SETTINGS.studioName}\n${FIXTURE_SETTINGS.postalAddress}\n\nIf you'd rather not hear from me, reply and say so, and I won't write again.`
const iso = NOW.toISOString()

let store: MemoryOutreachStore

async function storedDraft(footer = OLD_FOOTER): Promise<string> {
  const saved = await store.insertDraft(
    {
      subjectType: 'prospect',
      subjectRef: 'prospect-a',
      leadId: 'prospect-a',
      leadName: 'Fictional Firm',
      toEmail: TO,
      subject: 'Your contact page',
      body: BODY,
      footer,
      model: 'test-model',
      promptVersion: 'outreach-v6',
    },
    null,
    iso,
  )
  assert.ok(saved.ok)
  return saved.id
}

/** Sends the draft through the scripted Google mailbox and returns the plain text that went out. */
async function send(id: string): Promise<string> {
  const connections = new MemoryGmailConnectionStore()
  connections.connection = connectionFor('studio@vizantir.example')
  const { fetch, calls } = scriptedFetch({ [GOOGLE_TOKEN_URL]: [TOKEN_OK], [GMAIL_SEND_URL]: [SENT_OK] })
  const result = await approveAndSend(
    { store, connections, config: TEST_CONFIG, fetch, now: () => NOW, checkRules: async () => [], calls: new MemoryCallStore() },
    id,
  )
  assert.ok(result.ok)
  const call = calls.find((c) => c.url === GMAIL_SEND_URL)!
  return decodeMultipart(JSON.parse(call.body).raw as string).parts[0]!.text.replace(/\r\n/g, '\n')
}

const shown = async (id: string) => draftFooter((await store.getDraft(id))!, await store.getSettings())

beforeEach(() => {
  store = new MemoryOutreachStore(FIXTURE_SETTINGS)
})

describe('a draft that needs review', () => {
  it('with an old stored footer, shows and sends the current one', async () => {
    const id = await storedDraft()
    const current = buildFooter(FIXTURE_SETTINGS)
    assert.ok(current.endsWith(OPT_OUT_LINE))
    assert.equal(await shown(id), current)
    assert.equal(await send(id), messageText(BODY, current))
    assert.equal((await store.getDraft(id))!.footer, current, 'the footer sent is recorded on the row')
  })

  it('follows a settings change', async () => {
    const id = await storedDraft(buildFooter(FIXTURE_SETTINGS))
    const changed = { ...FIXTURE_SETTINGS, senderName: 'Jordan', postalAddress: '200 Fictional Way\nLas Vegas, NV 89101' }
    await store.saveSettings(changed)
    assert.equal(await shown(id), buildFooter(changed))
    assert.match(await send(id), /\n\nJordan\nVizantir[^\n]*\n200 Fictional Way\nLas Vegas, NV 89101\n\n/)
  })
})

describe('approval', () => {
  it('freezes the current footer, and a later settings change does not alter it', async () => {
    const id = await storedDraft()
    const atApproval = buildFooter(FIXTURE_SETTINGS)
    assert.ok((await approveDraft(store, id, iso, OPEN_CLEAN_LEAD)).ok)
    assert.equal((await store.getDraft(id))!.footer, atApproval)

    await store.saveSettings({ ...FIXTURE_SETTINGS, senderName: 'Jordan' })
    assert.equal(await shown(id), atApproval)
    assert.ok(footerOutdated((await store.getDraft(id))!, await store.getSettings()), 'the page notes the difference')
    assert.equal(await send(id), messageText(BODY, atApproval))
  })

  it('a frozen footer that matches the settings is not noted', async () => {
    const id = await storedDraft()
    assert.ok((await approveDraft(store, id, iso, OPEN_CLEAN_LEAD)).ok)
    assert.equal(footerOutdated((await store.getDraft(id))!, await store.getSettings()), false)
  })

  it('Edit again unfreezes it: the draft follows the current settings again', async () => {
    const id = await storedDraft()
    assert.ok((await approveDraft(store, id, iso, OPEN_CLEAN_LEAD)).ok)
    const changed = { ...FIXTURE_SETTINGS, senderName: 'Jordan' }
    await store.saveSettings(changed)
    assert.ok((await editAgain(store, id, iso)).ok)
    assert.equal(await shown(id), buildFooter(changed))
    assert.equal(footerOutdated((await store.getDraft(id))!, await store.getSettings()), false)
    assert.ok((await approveDraft(store, id, iso, OPEN_CLEAN_LEAD)).ok)
    assert.equal((await store.getDraft(id))!.footer, buildFooter(changed))
  })
})

describe('a sent email', () => {
  it('keeps the footer it was sent with, through Gmail or the mail app, whatever the settings become', async () => {
    const viaGmail = await storedDraft()
    const sentText = await send(viaGmail)

    store.drafts.length = 0
    const viaMailApp = await storedDraft()
    assert.ok((await approveDraft(store, viaMailApp, iso, OPEN_CLEAN_LEAD)).ok)
    const frozen = (await store.getDraft(viaMailApp))!.footer
    assert.ok((await markSent(store, viaMailApp, iso)).ok)

    await store.saveSettings({ ...FIXTURE_SETTINGS, senderName: 'Jordan', studioName: 'Another Studio' })
    assert.equal(await shown(viaMailApp), frozen)
    assert.equal((await store.getDraft(viaMailApp))!.footer, frozen)
    assert.equal(footerOutdated((await store.getDraft(viaMailApp))!, await store.getSettings()), false, 'no note on a sent email')
    assert.ok(sentText.endsWith(buildFooter(FIXTURE_SETTINGS)))
  })

  it('an old footer already on a sent row is never rewritten', async () => {
    const id = await storedDraft()
    await store.updateDraft(id, ['draft'], { status: 'sent', sentAt: iso, sentVia: 'mail_app', updatedAt: iso })
    assert.equal(await shown(id), OLD_FOOTER)
    assert.equal((await store.getDraft(id))!.footer, OLD_FOOTER)
  })
})

describe('incomplete settings', () => {
  it('a draft keeps showing its stored footer when the footer settings are missing', async () => {
    const id = await storedDraft()
    await store.saveSettings({ ...FIXTURE_SETTINGS, postalAddress: '' })
    assert.equal(await shown(id), OLD_FOOTER)
  })
})
