// Run with: pnpm exec tsx --test lib/outreach/draft.test.ts
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import type { CallModel } from '@/lib/briefing/narrative'

import { localDayStartIso } from './dates'
import { writeDraft, type DraftDeps } from './draft'
import { MemoryOutreachStore } from './fixtures/memory-store'
import {
  FIRST_REAL_DRAFT,
  FIXTURE_SETTINGS,
  GOOD_BUSINESS_REPLY,
  GOOD_PROSPECT_REPLY,
  PRIVATE_STRINGS,
  businessLead,
  prospectLead,
} from './fixtures/leads.fixture'
import { DAILY_DRAFT_CAP, OPT_OUT_LINE, OUTREACH_PROMPT_VERSION } from './params'
import type { OutreachDraft } from './types'

// 10:00 in Las Vegas on 2026-11-11.
const NOW = new Date('2026-11-11T18:00:00.000Z')

type Call = { system: string; user: string }

function scripted(replies: (string | { fail: string })[]): { model: CallModel; calls: Call[] } {
  const calls: Call[] = []
  const model: CallModel = async (input) => {
    calls.push(input)
    const next = replies[Math.min(calls.length - 1, replies.length - 1)]!
    return typeof next === 'string' ? { ok: true, text: next } : { ok: false, reason: next.fail }
  }
  return { model, calls }
}

function deps(store: MemoryOutreachStore, model: CallModel | null): DraftDeps {
  return { store, callModel: model, modelName: 'test-model', now: () => NOW }
}

const GOOD_PROSPECT = JSON.stringify(GOOD_PROSPECT_REPLY)
const GOOD_BUSINESS = JSON.stringify(GOOD_BUSINESS_REPLY)
const WITH_DASH = JSON.stringify({ ...GOOD_PROSPECT_REPLY, body: GOOD_PROSPECT_REPLY.body.replace('So someone', 'So someone — anyone —') })

describe('writeDraft', () => {
  it('writes a draft on the first reply and appends the footer in code', async () => {
    const store = new MemoryOutreachStore(FIXTURE_SETTINGS)
    const { model, calls } = scripted([GOOD_PROSPECT])
    const result = await writeDraft(deps(store, model), prospectLead())
    assert.deepEqual(result, { ok: true, draftId: 'draft-1', attempts: 1 })
    assert.equal(calls.length, 1)
    const draft = store.drafts[0]!
    assert.equal(draft.status, 'draft')
    assert.equal(draft.body, GOOD_PROSPECT_REPLY.body)
    assert.equal(draft.subject, GOOD_PROSPECT_REPLY.subject)
    assert.equal(draft.footer, `James\nVizantir Design Studio\n100 Example Plaza, Suite 1\nLas Vegas, NV 89100\n\n${OPT_OUT_LINE}`)
    assert.ok(!draft.body.includes(OPT_OUT_LINE))
    assert.equal(draft.toEmail, null)
    assert.equal(draft.model, 'test-model')
    assert.equal(draft.promptVersion, 'outreach-v4')
    assert.equal(OUTREACH_PROMPT_VERSION, 'outreach-v4')
    assert.equal(draft.leadName, 'Harbor & Pine Family Law')
  })

  it('a footer written by the model is rejected, never kept', async () => {
    const store = new MemoryOutreachStore(FIXTURE_SETTINGS)
    const withFooter = JSON.stringify({ ...GOOD_PROSPECT_REPLY, body: `${GOOD_PROSPECT_REPLY.body}\n\n${OPT_OUT_LINE}` })
    const { model } = scripted([withFooter, withFooter])
    const result = await writeDraft(deps(store, model), prospectLead())
    assert.equal(result.ok, false)
    assert.equal(store.drafts.length, 0)
  })

  it('retries once with the violations listed, then succeeds', async () => {
    const store = new MemoryOutreachStore(FIXTURE_SETTINGS)
    const { model, calls } = scripted([WITH_DASH, GOOD_PROSPECT])
    const result = await writeDraft(deps(store, model), prospectLead())
    assert.deepEqual(result, { ok: true, draftId: 'draft-1', attempts: 2 })
    assert.equal(calls.length, 2)
    assert.ok(!calls[0]!.system.includes('previous reply broke'))
    assert.match(calls[1]!.system, /previous reply broke these rules:\n- No em dashes, en dashes or spaced hyphens\./)
    assert.equal(calls[1]!.user, calls[0]!.user)
  })

  it('retries once on bad JSON', async () => {
    const store = new MemoryOutreachStore(FIXTURE_SETTINGS)
    const { model, calls } = scripted(['Here you go: not json', GOOD_PROSPECT])
    assert.equal((await writeDraft(deps(store, model), prospectLead())).ok, true)
    assert.equal(calls.length, 2)
  })

  it('fails with a plain message after a second violation, saving nothing', async () => {
    const store = new MemoryOutreachStore(FIXTURE_SETTINGS)
    const { model, calls } = scripted([WITH_DASH, WITH_DASH])
    const result = await writeDraft(deps(store, model), prospectLead())
    assert.equal(calls.length, 2)
    assert.equal(result.ok, false)
    if (!result.ok) {
      assert.equal(result.reason, 'rules_not_met')
      assert.equal(
        result.message,
        'The draft did not meet the writing rules after two attempts. On the last attempt: It used a dash. Try again, or write it by hand later.',
      )
    }
    assert.equal(store.drafts.length, 0)
  })

  it('the first real draft is refused after the retry, which lists each rule it broke', async () => {
    const store = new MemoryOutreachStore(FIXTURE_SETTINGS)
    const first = JSON.stringify(FIRST_REAL_DRAFT)
    const { model, calls } = scripted([first, first])
    const result = await writeDraft(deps(store, model), prospectLead())
    assert.ok(!result.ok && result.reason === 'rules_not_met')
    assert.equal(
      result.message,
      "The draft did not meet the writing rules after two attempts. On the last attempt: It did not introduce the studio with the exact description. The opening line was not 'Hello,'. It read stiffly: no contractions, or 'I would be glad' and the like. The subject used a banned word or the studio name. Try again, or write it by hand later.",
    )
    assert.doesNotMatch(result.message, /[a-z]+_[a-z]+/, 'no rule keys')
    const retry = calls[1]!.system
    assert.match(retry, /- Introduce the studio exactly as "Vizantir Design Studio, a custom web studio in Las Vegas"/)
    assert.match(retry, /- Open the body with "Hello," on its own line/)
    assert.match(retry, /- Write with natural contractions/)
    assert.match(retry, /- Make the subject a plain phrase/)
    assert.equal(store.drafts.length, 0)
  })

  it('a refusal leaves the existing draft for the lead untouched', async () => {
    const store = new MemoryOutreachStore(FIXTURE_SETTINGS)
    await writeDraft(deps(store, scripted([GOOD_PROSPECT]).model), prospectLead())
    const before = structuredClone(store.drafts)
    const result = await writeDraft(deps(store, scripted([WITH_DASH, WITH_DASH]).model), prospectLead())
    assert.ok(!result.ok && result.reason === 'rules_not_met')
    assert.deepEqual(store.drafts, before)
  })

  it('a warning never refuses: a reply drawing on two findings is saved', async () => {
    const store = new MemoryOutreachStore(FIXTURE_SETTINGS)
    const twoFindings = JSON.stringify({
      ...GOOD_PROSPECT_REPLY,
      body: GOOD_PROSPECT_REPLY.body.replace(
        "So someone who finds you in the evening can't get in touch until the next day.",
        'Your divorce and custody pages also repeat the same paragraphs.',
      ),
    })
    const { model, calls } = scripted([twoFindings])
    assert.deepEqual(await writeDraft(deps(store, model), prospectLead()), { ok: true, draftId: 'draft-1', attempts: 1 })
    assert.equal(calls.length, 1)
  })

  it('a failed model call is retried once, then refused plainly', async () => {
    const store = new MemoryOutreachStore(FIXTURE_SETTINGS)
    const { model, calls } = scripted([{ fail: 'model_call_failed (HTTP 529)' }, { fail: 'model_call_failed (HTTP 529)' }])
    const result = await writeDraft(deps(store, model), prospectLead())
    assert.equal(calls.length, 2)
    assert.deepEqual(result, { ok: false, reason: 'model_failed', message: 'The draft could not be written. Try again shortly.' })
  })

  it('a new business with no website found', async () => {
    const store = new MemoryOutreachStore(FIXTURE_SETTINGS)
    const { model, calls } = scripted([GOOD_BUSINESS])
    const result = await writeDraft(deps(store, model), businessLead())
    assert.equal(result.ok, true)
    assert.equal(store.drafts[0]!.subjectRef, 'desert bloom tacos|henderson')
    assert.equal(store.drafts[0]!.leadId, '22222222-2222-4222-8222-222222222222')
    for (const secret of PRIVATE_STRINGS) {
      assert.ok(!calls[0]!.user.includes(secret) && !calls[0]!.system.includes(secret), secret)
    }
  })

  it('refuses before any model call when settings are incomplete', async () => {
    for (const settings of [null, { ...FIXTURE_SETTINGS, postalAddress: '  ' }, { ...FIXTURE_SETTINGS, replyToEmail: 'not an email' }]) {
      const store = new MemoryOutreachStore(settings)
      const { model, calls } = scripted([GOOD_PROSPECT])
      const result = await writeDraft(deps(store, model), prospectLead())
      assert.equal(result.ok, false)
      if (!result.ok) {
        assert.equal(result.reason, 'settings_incomplete')
        assert.match(result.message, /Outreach settings/)
      }
      assert.equal(calls.length, 0)
    }
    const store = new MemoryOutreachStore({ ...FIXTURE_SETTINGS, postalAddress: '' })
    const result = await writeDraft(deps(store, scripted([GOOD_PROSPECT]).model), prospectLead())
    assert.ok(!result.ok && result.message.startsWith('Add the postal mailing address in Outreach settings'))
  })

  it('refuses a lead that is not accepted', async () => {
    const store = new MemoryOutreachStore(FIXTURE_SETTINGS)
    const { model, calls } = scripted([GOOD_BUSINESS])
    const result = await writeDraft(deps(store, model), businessLead({ reviewStatus: 'unreviewed' }))
    assert.ok(!result.ok && result.reason === 'not_accepted')
    assert.equal(calls.length, 0)
  })

  it('refuses when the model is not configured', async () => {
    const result = await writeDraft(deps(new MemoryOutreachStore(FIXTURE_SETTINGS), null), prospectLead())
    assert.ok(!result.ok && result.reason === 'model_not_configured')
  })

  it(`caps drafts at ${DAILY_DRAFT_CAP} per local day, counting replaced drafts`, async () => {
    const store = new MemoryOutreachStore(FIXTURE_SETTINGS)
    const { model } = scripted([GOOD_PROSPECT])
    // 30 drafts today, all for the same lead: each replaces the one before.
    for (let i = 0; i < DAILY_DRAFT_CAP; i += 1) {
      assert.equal((await writeDraft(deps(store, model), prospectLead())).ok, true, `draft ${i + 1}`)
    }
    assert.equal(store.drafts.filter((d) => d.status === 'draft').length, 1)
    const capped = await writeDraft(deps(store, model), businessLead())
    assert.ok(!capped.ok && capped.reason === 'daily_cap')
    assert.match(capped.ok ? '' : capped.message, /30 drafts have been written today/)
  })

  it('the cap resets at local midnight, not UTC midnight', async () => {
    const store = new MemoryOutreachStore(FIXTURE_SETTINGS)
    // Yesterday evening in Las Vegas, which is already 2026-11-11 in UTC.
    const lateYesterday = '2026-11-11T07:30:00.000Z'
    assert.equal(localDayStartIso(NOW), '2026-11-11T08:00:00.000Z')
    for (let i = 0; i < DAILY_DRAFT_CAP; i += 1) {
      store.drafts.push({ ...sampleDraft(i), createdAt: lateYesterday, updatedAt: lateYesterday })
    }
    const result = await writeDraft(deps(store, scripted([GOOD_PROSPECT]).model), prospectLead())
    assert.equal(result.ok, true)
  })

  it('one active draft per lead: drafting again replaces an unapproved draft', async () => {
    const store = new MemoryOutreachStore(FIXTURE_SETTINGS)
    const { model } = scripted([GOOD_PROSPECT])
    await writeDraft(deps(store, model), prospectLead())
    await writeDraft(deps(store, model), prospectLead())
    assert.deepEqual(
      store.drafts.map((d) => [d.id, d.status]),
      [
        ['draft-1', 'discarded'],
        ['draft-2', 'draft'],
      ],
    )
  })

  it('one active draft per lead: an approved draft is never replaced', async () => {
    const store = new MemoryOutreachStore(FIXTURE_SETTINGS)
    const { model, calls } = scripted([GOOD_PROSPECT])
    await writeDraft(deps(store, model), prospectLead())
    store.drafts[0]!.status = 'approved'
    const result = await writeDraft(deps(store, model), prospectLead())
    assert.ok(!result.ok && result.reason === 'approved_exists')
    assert.equal(calls.length, 1)
    assert.equal(store.drafts.length, 1)
  })

  it('one active draft per business across every license row', async () => {
    const store = new MemoryOutreachStore(FIXTURE_SETTINGS)
    const { model } = scripted([GOOD_BUSINESS])
    await writeDraft(deps(store, model), businessLead())
    // The same business reached through another of its license rows.
    await writeDraft(deps(store, model), businessLead({ id: '33333333-3333-4333-8333-333333333333' }))
    assert.equal(store.drafts.filter((d) => d.status === 'draft').length, 1)
  })
})

function sampleDraft(i: number): OutreachDraft {
  return {
    id: `old-${i}`,
    subjectType: 'prospect',
    subjectRef: `old-${i}`,
    leadId: `old-${i}`,
    leadName: 'Old',
    toEmail: null,
    subject: 'Old',
    body: 'Old',
    footer: 'Old',
    status: 'discarded',
    model: 'test-model',
    promptVersion: 'outreach-v1',
    createdAt: '',
    updatedAt: '',
    approvedAt: null,
    sentAt: null,
    sentVia: null,
    gmailMessageId: null,
    gmailThreadId: null,
    sendError: null,
  }
}
