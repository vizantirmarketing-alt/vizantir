// Run with: NODE_OPTIONS=--conditions=react-server pnpm exec tsx --test lib/outreach/rules-check.test.ts
// The hard voice rules, through one shared check, for every draft whatever
// wrote it: approve and send refuse a draft that breaks one; a save always
// goes through and reports what the rules found. The real voice check against
// the fixture leads; memory stores, a scripted model and scripted Google
// responses. No network or database. Fictional data only.
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import type { CallModel } from '@/lib/briefing/narrative'

import { buildOutreachContext, type OutreachLead } from './context'
import { writeDraft, writeManualDraft, type DraftDeps } from './draft'
import { MemoryCallStore, OPEN_LEAD } from './fixtures/memory-call-store'
import { MemoryGmailConnectionStore, MemoryOutreachStore } from './fixtures/memory-store'
import { FIXTURE_SETTINGS, GOOD_BUSINESS_REPLY, GOOD_PROSPECT_REPLY, businessLead, prospectLead } from './fixtures/leads.fixture'
import { NOW as SEND_NOW, TEST_CONFIG, connectionFor, scriptedFetch } from './fixtures/gmail.fixture'
import { GMAIL_SEND_URL } from './gmail/api'
import { GOOGLE_TOKEN_URL } from './gmail/oauth'
import { approveAndSend } from './gmail/send'
import { approveDraft, editDraft } from './lifecycle'
import { callHistoryUnreadable, closedLeadRefusal } from './calls'
import { rulesNotice, writingRulesRefusal, type DraftText } from './rules-check'
import { checkVoice, refusalReasons, voiceContextFor } from './voice'

const NOW = new Date('2026-11-18T18:00:00.000Z')
const TO = 'owner@fictional-firm.example'
const TOKEN_OK = { status: 200, json: { access_token: 'access-fictional', expires_in: 3599 } }
const SENT_OK = { status: 200, json: { id: 'msg-1', threadId: 'thread-1', labelIds: ['SENT'] } }

/** The real hard rules against a lead, as checkDraftRules applies them in production. */
function realCheck(lead: OutreachLead) {
  return async (text: DraftText) => refusalReasons(checkVoice({ subject: text.subject, body: text.body }, voiceContextFor(buildOutreachContext(lead), FIXTURE_SETTINGS.studioName)))
}

function modelDeps(store: MemoryOutreachStore, reply: object): DraftDeps {
  const model: CallModel = async () => ({ ok: true, text: JSON.stringify(reply) })
  return { store, callModel: model, modelName: 'test-model', now: () => NOW, calls: new MemoryCallStore() }
}

type Case = { name: string; lead: () => OutreachLead; reply: { subject: string; body: string }; bad: (body: string) => string; refusal: RegExp }

const CASES: Case[] = [
  {
    name: 'casual call',
    lead: prospectLead,
    reply: GOOD_PROSPECT_REPLY,
    bad: (body) => body.replace(/[^\n]+$/, "I'd be glad to hop on a quick call this week if that helps?"),
    refusal: /does not meet the writing rules: It used the casual phrase "hop on a call"\./,
  },
  {
    name: '"new" wording',
    lead: businessLead,
    reply: GOOD_BUSINESS_REPLY,
    bad: (body) => body.replace('I came across Desert Bloom Tacos in Henderson.', 'I saw that you recently opened in Henderson.'),
    refusal: /does not meet the writing rules: It called the business new/,
  },
]

/** A model draft for the case's lead, written with the good reply and a recipient. */
async function modelDraft(c: Case) {
  const store = new MemoryOutreachStore(FIXTURE_SETTINGS)
  const written = await writeDraft(modelDeps(store, c.reply), c.lead())
  assert.ok(written.ok)
  await store.updateDraft(written.draftId, ['draft'], { toEmail: TO, updatedAt: NOW.toISOString() })
  return { store, id: written.draftId, guards: { ...OPEN_LEAD, checkRules: realCheck(c.lead()) } }
}

function sendDeps(store: MemoryOutreachStore, c: Case, fetch: ReturnType<typeof scriptedFetch>['fetch']) {
  const connections = new MemoryGmailConnectionStore()
  connections.connection = connectionFor('studio@vizantir.example')
  const check = realCheck(c.lead())
  return { store, connections, config: TEST_CONFIG, fetch, now: () => SEND_NOW, checkRules: (text: DraftText) => check(text), calls: new MemoryCallStore() }
}

for (const c of CASES) {
  describe(`the ${c.name} rule at every step`, () => {
    it('a model draft edited to break it is saved, the problems come back, and approve and send still refuse the same text', async () => {
      const { store, id, guards } = await modelDraft(c)
      const result = await editDraft(store, id, { toEmail: TO, subject: c.reply.subject, body: c.bad(c.reply.body) }, NOW.toISOString(), guards)
      assert.ok(result.ok)
      assert.ok(result.rules.checked)
      assert.ok(result.rules.problems.length > 0)
      assert.match(`This email does not meet the writing rules: ${result.rules.problems.join(' ')}`, c.refusal)
      assert.equal((await store.getDraft(id))!.body, c.bad(c.reply.body).trim())

      const approved = await approveDraft(store, id, NOW.toISOString(), guards)
      assert.ok(!approved.ok && c.refusal.test(approved.error))
      assert.equal((await store.getDraft(id))!.status, 'draft')

      const { fetch, calls } = scriptedFetch({})
      const sent = await approveAndSend(sendDeps(store, c, fetch), id)
      assert.ok(!sent.ok && c.refusal.test(sent.error))
      assert.equal(calls.length, 0)
      assert.equal((await store.getDraft(id))!.status, 'draft')
    })

    it('a clean edit is saved with no problems', async () => {
      const { store, id, guards } = await modelDraft(c)
      const result = await editDraft(store, id, { toEmail: TO, subject: c.reply.subject, body: c.reply.body }, NOW.toISOString(), guards)
      assert.ok(result.ok)
      assert.deepEqual(result.rules, { checked: true, problems: [] })
    })

    it('a hand-written draft that breaks it is saved on its first save, with the problems, and is refused at approve', async () => {
      const store = new MemoryOutreachStore(FIXTURE_SETTINGS)
      const created = await writeManualDraft(modelDeps(store, c.reply), c.lead(), { toEmail: TO, subject: c.reply.subject, body: c.bad(c.reply.body) })
      assert.ok(created.ok)
      assert.ok(created.rules.checked)
      assert.match(`This email does not meet the writing rules: ${created.rules.problems.join(' ')}`, c.refusal)
      assert.equal(store.drafts.length, 1)
      const approved = await approveDraft(store, created.draftId, NOW.toISOString(), { ...OPEN_LEAD, checkRules: realCheck(c.lead()) })
      assert.ok(!approved.ok && c.refusal.test(approved.error))
    })

    it('a clean hand-written draft is saved on its first save with no problems', async () => {
      const store = new MemoryOutreachStore(FIXTURE_SETTINGS)
      const created = await writeManualDraft(modelDeps(store, c.reply), c.lead(), { toEmail: TO, subject: c.reply.subject, body: c.reply.body })
      assert.ok(created.ok)
      assert.deepEqual(created.rules, { checked: true, problems: [] })
    })

    it('a model draft that somehow holds it is refused at approve', async () => {
      const { store, id, guards } = await modelDraft(c)
      await store.updateDraft(id, ['draft'], { body: c.bad(c.reply.body), updatedAt: NOW.toISOString() })
      const result = await approveDraft(store, id, NOW.toISOString(), guards)
      assert.equal(result.ok, false)
      if (!result.ok) {
        assert.match(result.error, c.refusal)
        assert.match(result.error, /Edit it before approving\.$/)
      }
      assert.equal((await store.getDraft(id))!.status, 'draft')
    })

    it('an approved model draft holding it is refused at send, before Google is contacted or the draft changes', async () => {
      const { store, id } = await modelDraft(c)
      await store.updateDraft(id, ['draft'], { body: c.bad(c.reply.body), status: 'approved', approvedAt: NOW.toISOString(), updatedAt: NOW.toISOString() })
      const { fetch, calls } = scriptedFetch({})
      const result = await approveAndSend(sendDeps(store, c, fetch), id)
      assert.equal(result.ok, false)
      if (!result.ok) {
        assert.match(result.error, c.refusal)
        assert.match(result.error, /Nothing was sent\. Edit it before sending\.$/)
        assert.equal(result.outcome, 'refused')
      }
      assert.equal(calls.length, 0)
      const row = (await store.getDraft(id))!
      assert.equal(row.status, 'approved')
      assert.equal(row.sentAt, null)
    })

    it('a clean draft still saves, approves and sends', async () => {
      const { store, id, guards } = await modelDraft(c)
      assert.ok((await editDraft(store, id, { toEmail: TO, subject: c.reply.subject, body: c.reply.body }, NOW.toISOString(), guards)).ok)
      assert.ok((await approveDraft(store, id, NOW.toISOString(), guards)).ok)
      const { fetch, calls } = scriptedFetch({ [GOOGLE_TOKEN_URL]: [TOKEN_OK], [GMAIL_SEND_URL]: [SENT_OK] })
      const result = await approveAndSend(sendDeps(store, c, fetch), id)
      assert.ok(result.ok)
      assert.equal((await store.getDraft(id))!.status, 'sent')
      assert.equal(calls.filter((call) => call.url === GMAIL_SEND_URL).length, 1)
    })
  })
}

describe('one shared check', () => {
  it('a lead that cannot be loaded refuses approve and send, saying what did not happen', async () => {
    const draft = { subjectType: 'prospect' as const, subjectRef: 'p', leadId: 'p', subject: 's', body: 'b' }
    const unloadable = async () => null
    assert.match((await writingRulesRefusal(unloadable, draft, 'approved')) ?? '', /cannot be checked against the writing rules\. It was not approved\.$/)
    assert.match((await writingRulesRefusal(unloadable, draft, 'sent')) ?? '', /cannot be checked against the writing rules\. Nothing was sent\.$/)
    assert.equal(await writingRulesRefusal(async () => [], draft, 'sent'), null)
  })

  it('an approved draft whose lead cannot be loaded is not sent', async () => {
    const c = CASES[0]!
    const { store, id } = await modelDraft(c)
    await store.updateDraft(id, ['draft'], { status: 'approved', approvedAt: NOW.toISOString(), updatedAt: NOW.toISOString() })
    const { fetch, calls } = scriptedFetch({})
    const result = await approveAndSend({ ...sendDeps(store, c, fetch), checkRules: async () => null }, id)
    assert.equal(result.ok, false)
    assert.equal(calls.length, 0)
  })

  it('every hard rule runs at each step, not only these two: a bad greeting is reported at save and refused at approve and send', async () => {
    const c = CASES[0]!
    const noGreeting = (body: string) => body.replace(/^Hello,/, 'Hi there,')
    const saving = await modelDraft(c)
    const saved = await editDraft(saving.store, saving.id, { toEmail: TO, subject: c.reply.subject, body: noGreeting(c.reply.body) }, NOW.toISOString(), saving.guards)
    assert.ok(saved.ok && saved.rules.checked && saved.rules.problems.some((p) => /The opening line was not 'Hello,'/.test(p)))

    const approving = await modelDraft(c)
    await approving.store.updateDraft(approving.id, ['draft'], { body: noGreeting(c.reply.body), updatedAt: NOW.toISOString() })
    const approved = await approveDraft(approving.store, approving.id, NOW.toISOString(), approving.guards)
    assert.ok(!approved.ok && /The opening line was not 'Hello,'/.test(approved.error))

    const sending = await modelDraft(c)
    await sending.store.updateDraft(sending.id, ['draft'], { body: noGreeting(c.reply.body), status: 'approved', approvedAt: NOW.toISOString(), updatedAt: NOW.toISOString() })
    const { fetch, calls } = scriptedFetch({})
    const sent = await approveAndSend(sendDeps(sending.store, c, fetch), sending.id)
    assert.ok(!sent.ok && /The opening line was not 'Hello,'/.test(sent.error))
    assert.equal(calls.length, 0)
  })
})

describe('saving', () => {
  const EDIT = { toEmail: TO, subject: GOOD_PROSPECT_REPLY.subject, body: GOOD_PROSPECT_REPLY.body.replace(/[^\n]+$/, 'Can I pick your brain about it?') }

  it('a closed lead still refuses the save, before the rules are checked, and nothing is saved', async () => {
    const { store, id } = await modelDraft(CASES[0]!)
    let checked = false
    const result = await editDraft(store, id, EDIT, NOW.toISOString(), {
      closedBy: async () => ({ readable: true, closedBy: 'spoke_not_interested' }),
      checkRules: async () => ((checked = true), []),
    })
    assert.deepEqual(result, { ok: false, error: closedLeadRefusal('spoke_not_interested') })
    assert.equal(checked, false)
    assert.equal((await store.getDraft(id))!.body, GOOD_PROSPECT_REPLY.body.trim())
  })

  it('unreadable call history still refuses the save, and nothing is saved', async () => {
    const { store, id, guards } = await modelDraft(CASES[0]!)
    const result = await editDraft(store, id, EDIT, NOW.toISOString(), { ...guards, closedBy: async () => ({ readable: false }) })
    assert.deepEqual(result, { ok: false, error: callHistoryUnreadable('saved') })
    assert.equal((await store.getDraft(id))!.body, GOOD_PROSPECT_REPLY.body.trim())
  })

  it('a lead that cannot be loaded, or a check that fails outright, still saves and reports it as unchecked', async () => {
    for (const checkRules of [async () => null, async (): Promise<string[]> => { throw new Error('down') }]) {
      const { store, id } = await modelDraft(CASES[0]!)
      const result = await editDraft(store, id, EDIT, NOW.toISOString(), { ...OPEN_LEAD, checkRules })
      assert.ok(result.ok)
      assert.deepEqual(result.rules, { checked: false })
      assert.equal((await store.getDraft(id))!.body, EDIT.body.trim())
    }
  })
})

describe('the notice', () => {
  it('after a save: problems listed under "Saved. Before this can be approved, change the following:"', () => {
    assert.deepEqual(rulesNotice({ checked: true, problems: ['One.', 'Two.'] }, true), {
      lead: 'Saved. Before this can be approved, change the following:',
      problems: ['One.', 'Two.'],
    })
  })

  it('after a clean save: the normal saved confirmation', () => {
    assert.deepEqual(rulesNotice({ checked: true, problems: [] }, true), { lead: 'Saved.', problems: [] })
  })

  it('on page load: the same list without "Saved.", and nothing for a clean draft', () => {
    assert.deepEqual(rulesNotice({ checked: true, problems: ['One.'] }, false), { lead: 'Before this can be approved, change the following:', problems: ['One.'] })
    assert.equal(rulesNotice({ checked: true, problems: [] }, false), null)
  })

  it('a lead that cannot be loaded says it cannot be checked, approved or sent', () => {
    assert.match(rulesNotice({ checked: false }, true)!.lead, /^Saved\. This lead can no longer be loaded, so the email cannot be checked against the writing rules\. It cannot be approved or sent until it can be checked\.$/)
    assert.match(rulesNotice({ checked: false }, false)!.lead, /^This lead can no longer be loaded/)
  })

  it('has no em-dashes', () => {
    for (const notice of [rulesNotice({ checked: true, problems: ['x'] }, true), rulesNotice({ checked: false }, false)]) assert.equal(/\u2014/.test(notice!.lead), false)
  })
})
