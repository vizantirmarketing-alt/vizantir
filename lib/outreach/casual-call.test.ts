// Run with: NODE_OPTIONS=--conditions=react-server pnpm exec tsx --test lib/outreach/casual-call.test.ts
// The casual call rule (outreach-v7): casual call phrasings are a hard voice
// rule for model drafts, edits and hand-written drafts, and the refusal names
// the phrase. Memory stores, a scripted model and fictional data only. No
// network or database.
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import type { CallModel } from '@/lib/briefing/narrative'

import { buildOutreachContext } from './context'
import { writeDraft, writeManualDraft, type DraftDeps } from './draft'
import { MemoryCallStore, OPEN_LEAD } from './fixtures/memory-call-store'
import { MemoryOutreachStore } from './fixtures/memory-store'
import { FIXTURE_SETTINGS, GOOD_BUSINESS_REPLY, GOOD_PROSPECT_REPLY, businessLead, prospectLead } from './fixtures/leads.fixture'
import { approveDraft, editDraft } from './lifecycle'
import { OUTREACH_PROMPT_VERSION } from './params'
import { outreachSystemPrompt } from './prompt'
import type { OutreachDraft } from './types'
import { CASUAL_CALL_PHRASES, casualCallPhrases, checkVoice, refusalReasons, voiceContextFor } from './voice'

const NOW = new Date('2026-11-18T18:00:00.000Z')
const ASK = 'Would you be open to a short call, or a reply with a good time to talk?'

const prospectVoice = () => voiceContextFor(buildOutreachContext(prospectLead()), FIXTURE_SETTINGS.studioName)
const businessVoice = () => voiceContextFor(buildOutreachContext(businessLead()), FIXTURE_SETTINGS.studioName)

/** The good prospect reply with its last line replaced. */
const withAsk = (ask: string) => GOOD_PROSPECT_REPLY.body.replace(ASK, ask)

/** The hard rules against the prospect fixture, as checkDraftRules applies them at approve and send. */
const checkRules = async (draft: Pick<OutreachDraft, 'subject' | 'body'>) => refusalReasons(checkVoice({ subject: draft.subject, body: draft.body }, prospectVoice()))

function scripted(replies: object[]): CallModel {
  let n = 0
  return async () => ({ ok: true, text: JSON.stringify(replies[Math.min(n++, replies.length - 1)]) })
}

function deps(store: MemoryOutreachStore, model: CallModel | null): DraftDeps {
  return { store, callModel: model, modelName: 'test-model', now: () => NOW, calls: new MemoryCallStore() }
}

const LISTED = [
  ['hop on a call', 'hop on a call'],
  ['hop on a short call', 'hop on a call'],
  ['hop on a quick call', 'hop on a call'],
  ['jump on a call', 'jump on a call'],
  ['jump on a quick call', 'jump on a call'],
  ['quick chat', 'quick chat'],
  ['pick your brain', 'pick your brain'],
  ['touch base', 'touch base'],
  ['circle back', 'circle back'],
] as const

describe('casual call phrasings are refused', () => {
  it('each listed phrase, in a sentence, is a hard violation that names it', () => {
    for (const [wording, phrase] of LISTED) {
      const violations = checkVoice({ subject: GOOD_PROSPECT_REPLY.subject, body: withAsk(`Could we ${wording} sometime next week?`) }, prospectVoice())
      const casual = violations.find((v) => v.rule === 'casual_call')
      assert.ok(casual, wording)
      assert.deepEqual(casual.phrases, [phrase], wording)
      assert.ok(
        refusalReasons(violations).includes(
          `It used the casual phrase "${phrase}". Reword the invitation plainly, such as offering to talk it through by phone or inviting a reply by email.`,
        ),
        wording,
      )
    }
  })

  it('case does not matter, and extra words or line breaks between the words are tolerated', () => {
    for (const text of ['HOP ON A QUICK CALL', 'Hop on a short phone call', 'jumping on a quick 15-minute call', 'a Quick\nchat', 'a quick phone chat', 'pick your marketing brain', 'Touching base', 'circling right back', 'I could circle back']) {
      assert.ok(casualCallPhrases(text).length > 0, text)
    }
  })

  it('in the subject too, and for a business lead', () => {
    assert.ok(checkVoice({ subject: 'Quick chat about your site', body: GOOD_PROSPECT_REPLY.body }, prospectVoice()).some((v) => v.rule === 'casual_call'))
    const body = GOOD_BUSINESS_REPLY.body.replace(/[^\n]+$/, 'Happy to hop on a call if that helps?')
    assert.ok(checkVoice({ subject: GOOD_BUSINESS_REPLY.subject, body }, businessVoice()).some((v) => v.rule === 'casual_call'))
  })

  it('names every phrase when there is more than one', () => {
    const violations = checkVoice({ subject: GOOD_PROSPECT_REPLY.subject, body: withAsk('Happy to touch base, or we could jump on a call?') }, prospectVoice())
    assert.ok(refusalReasons(violations).some((reason) => reason.startsWith('It used the casual phrases "jump on a call" and "touch base".')))
  })

  it('there is one pattern per phrase', () => {
    assert.deepEqual(
      CASUAL_CALL_PHRASES.map(({ phrase }) => phrase),
      ['hop on a call', 'jump on a call', 'quick chat', 'pick your brain', 'touch base', 'circle back'],
    )
  })
})

describe('plain wording passes', () => {
  it('the alternatives and ordinary uses of call, quick and base are not caught', () => {
    for (const text of [
      "I'm happy to talk it through by phone.",
      'Call me at the number below.',
      'I took a quick look at your site.',
      "I'm based in Las Vegas.",
      'A short call, or a reply by email, either works.',
      'I would jump on a chance to call you.',
      'The base price is listed.',
      'A quick reply to chat later is fine.',
    ]) {
      assert.deepEqual(casualCallPhrases(text), [], text)
    }
  })

  it('the fixture replies still pass every hard rule', () => {
    assert.deepEqual(checkVoice(GOOD_PROSPECT_REPLY, prospectVoice()), [])
    assert.deepEqual(checkVoice(GOOD_BUSINESS_REPLY, businessVoice()), [])
    const plainAsk = withAsk("I'm happy to talk it through by phone, or you can reply with a good time?")
    assert.ok(!checkVoice({ subject: GOOD_PROSPECT_REPLY.subject, body: plainAsk }, prospectVoice()).some((v) => v.rule === 'casual_call'))
  })
})

describe('the rule applies wherever the hard rules do', () => {
  it('a model draft that uses one twice is refused, naming the phrase, and nothing is saved', async () => {
    const store = new MemoryOutreachStore(FIXTURE_SETTINGS)
    const casual = { subject: GOOD_PROSPECT_REPLY.subject, body: withAsk('Could we hop on a quick call this week?') }
    const result = await writeDraft(deps(store, scripted([casual, casual])), prospectLead())
    assert.equal(result.ok, false)
    if (!result.ok) {
      assert.equal(result.reason, 'rules_not_met')
      assert.match(result.message, /It used the casual phrase "hop on a call"\. Reword the invitation plainly/)
    }
    assert.equal(store.drafts.length, 0)
  })

  it('a model draft that fixes it on the retry is saved under outreach-v7', async () => {
    const store = new MemoryOutreachStore(FIXTURE_SETTINGS)
    const casual = { subject: GOOD_PROSPECT_REPLY.subject, body: withAsk('Could we touch base this week?') }
    const result = await writeDraft(deps(store, scripted([casual, GOOD_PROSPECT_REPLY])), prospectLead())
    assert.ok(result.ok)
    assert.equal(store.drafts[0]!.promptVersion, 'outreach-v7')
  })

  it('an edit that adds one is saved, and the problems name the phrase', async () => {
    const store = new MemoryOutreachStore(FIXTURE_SETTINGS)
    const written = await writeDraft(deps(store, scripted([GOOD_PROSPECT_REPLY])), prospectLead())
    assert.ok(written.ok)
    const edited = await editDraft(
      store,
      written.draftId,
      { toEmail: 'owner@fictional-firm.example', subject: GOOD_PROSPECT_REPLY.subject, body: withAsk('Can I pick your brain about it?') },
      NOW.toISOString(),
      { ...OPEN_LEAD, checkRules },
    )
    assert.ok(edited.ok && edited.rules.checked)
    assert.ok(edited.rules.problems.some((p) => /^It used the casual phrase "pick your brain"\. Reword the invitation plainly/.test(p)))
    assert.match((await store.getDraft(written.draftId))!.body, /pick your brain/)
  })

  it('a hand-written draft is refused at approval, naming the phrase, and passes once reworded', async () => {
    const store = new MemoryOutreachStore(FIXTURE_SETTINGS)
    const created = await writeManualDraft(deps(store, null), prospectLead(), {
      toEmail: 'owner@fictional-firm.example',
      subject: GOOD_PROSPECT_REPLY.subject,
      body: withAsk("I'll circle back next week unless you'd like a reply sooner?"),
    })
    assert.ok(created.ok)
    const refused = await approveDraft(store, created.draftId, NOW.toISOString(), { ...OPEN_LEAD, checkRules })
    assert.equal(refused.ok, false)
    if (!refused.ok) assert.match(refused.error, /It used the casual phrase "circle back"\. Reword the invitation plainly/)

    const reworded = await editDraft(
      store,
      created.draftId,
      { toEmail: 'owner@fictional-firm.example', subject: GOOD_PROSPECT_REPLY.subject, body: GOOD_PROSPECT_REPLY.body },
      NOW.toISOString(),
      { ...OPEN_LEAD, checkRules },
    )
    assert.ok(reworded.ok)
    assert.ok((await approveDraft(store, created.draftId, NOW.toISOString(), { ...OPEN_LEAD, checkRules })).ok)
  })
})

describe('the prompt and its version', () => {
  it('the prompt version is outreach-v7', () => {
    assert.equal(OUTREACH_PROMPT_VERSION, 'outreach-v7')
  })

  it('the prompt states the rule and a plain alternative, with no fixed sentence', () => {
    const prompt = outreachSystemPrompt(FIXTURE_SETTINGS, buildOutreachContext(prospectLead()))
    assert.match(prompt, /Never use casual call phrasings: "hop on a call", "hop on a quick call", "jump on a call", "quick chat", "pick your brain", "touch base", "circle back"/)
    assert.match(prompt, /Word the ask plainly and specifically, in your own direct voice, for this email: for example, offer to talk it through by phone, or invite a reply by email\./)
    assert.equal(/—/.test(prompt), false)
  })

  it('the "new" rule still works beside it', () => {
    const body = GOOD_BUSINESS_REPLY.body.replace('I came across Desert Bloom Tacos in Henderson.', 'I saw that you recently opened in Henderson.')
    const violations = checkVoice({ subject: GOOD_BUSINESS_REPLY.subject, body }, businessVoice())
    assert.ok(violations.some((v) => v.rule === 'new_business'))
    assert.ok(!violations.some((v) => v.rule === 'casual_call'))
    assert.ok(refusalReasons(violations).some((reason) => reason.startsWith('It called the business new')))
  })
})
