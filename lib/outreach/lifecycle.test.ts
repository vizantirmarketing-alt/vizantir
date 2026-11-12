// Run with: pnpm exec tsx --test lib/outreach/lifecycle.test.ts
import assert from 'node:assert/strict'
import { beforeEach, describe, it } from 'node:test'

import { MemoryOutreachStore } from './fixtures/memory-store'
import { FIXTURE_SETTINGS } from './fixtures/leads.fixture'
import {
  addSuppressionByHand,
  approveDraft,
  discardDraft,
  doNotContact,
  editAgain,
  editDraft,
  isSuppressed,
  markSent,
  removeSuppression,
} from './lifecycle'
import { localDayStartIso } from './dates'

const T1 = '2026-11-11T18:00:00.000Z'
const T2 = '2026-11-11T18:05:00.000Z'

let store: MemoryOutreachStore
let id: string

async function newDraft(subjectRef = 'prospect-a'): Promise<string> {
  const result = await store.insertDraft(
    {
      subjectType: 'prospect',
      subjectRef,
      leadId: subjectRef,
      leadName: 'Fictional Firm',
      toEmail: null,
      subject: 'A note on your contact page',
      body: 'Hello,\n\nA short note.',
      footer: 'James\nVizantir Design Studio',
      model: 'test-model',
      promptVersion: 'outreach-v1',
    },
    null,
    T1,
  )
  assert.ok(result.ok)
  return result.id
}

beforeEach(async () => {
  store = new MemoryOutreachStore(FIXTURE_SETTINGS)
  id = await newDraft()
})

const EDIT = { toEmail: ' Owner@Firm.Example ', subject: 'A better subject', body: 'Hello,\r\n\r\nEdited.' }

describe('editing and locking', () => {
  it('a draft can be edited; the recipient is normalized and the subject kept to one line', async () => {
    const result = await editDraft(store, id, { ...EDIT, subject: 'Line one\r\nBcc: evil@attacker.example' }, T2)
    assert.ok(result.ok)
    if (!result.ok) return
    assert.equal(result.draft.toEmail, 'owner@firm.example')
    assert.equal(result.draft.subject, 'Line one Bcc: evil@attacker.example')
    assert.equal(result.draft.body, 'Hello,\n\nEdited.')
    assert.equal(result.draft.footer, 'James\nVizantir Design Studio')
  })

  it('an invalid recipient is refused on save', async () => {
    const result = await editDraft(store, id, { ...EDIT, toEmail: 'owner@firm' }, T2)
    assert.deepEqual(result, { ok: false, error: 'Enter a valid recipient email.' })
  })

  it('approve needs a recipient, records approved_at and locks the text', async () => {
    assert.deepEqual(await approveDraft(store, id, T2), { ok: false, error: 'Add a valid recipient email before approving.' })
    await editDraft(store, id, EDIT, T2)
    const approved = await approveDraft(store, id, T2)
    assert.ok(approved.ok && approved.draft.status === 'approved' && approved.draft.approvedAt === T2)
    const locked = await editDraft(store, id, { ...EDIT, body: 'Changed after approval.' }, T2)
    assert.equal(locked.ok, false)
    assert.equal((await store.getDraft(id))!.body, 'Hello,\n\nEdited.')
  })

  it('edit again returns it to draft and clears approved_at', async () => {
    await editDraft(store, id, EDIT, T2)
    await approveDraft(store, id, T2)
    const back = await editAgain(store, id, T2)
    assert.ok(back.ok && back.draft.status === 'draft' && back.draft.approvedAt === null)
    assert.equal((await editDraft(store, id, { ...EDIT, body: 'Now editable.' }, T2)).ok, true)
  })

  it('mark as sent only from approved, recording sent_at', async () => {
    assert.equal((await markSent(store, id, T2)).ok, false)
    await editDraft(store, id, EDIT, T2)
    await approveDraft(store, id, T2)
    const sent = await markSent(store, id, T2)
    assert.ok(sent.ok && sent.draft.status === 'sent' && sent.draft.sentAt === T2)
    assert.equal(await store.countSentSince(localDayStartIso(new Date(T2))), 1)
    assert.equal((await editAgain(store, id, T2)).ok, false)
    assert.equal((await discardDraft(store, id, T2)).ok, false)
  })

  it('discard from draft or approved; a discarded draft accepts nothing', async () => {
    assert.ok((await discardDraft(store, id, T2)).ok)
    assert.equal((await editDraft(store, id, EDIT, T2)).ok, false)
    assert.equal((await approveDraft(store, id, T2)).ok, false)
    assert.equal((await doNotContact(store, id, T2)).ok, false)
  })

  it('a second approve of the same draft is refused (two tabs)', async () => {
    await editDraft(store, id, EDIT, T2)
    assert.ok((await approveDraft(store, id, T2)).ok)
    assert.equal((await approveDraft(store, id, T2)).ok, false)
  })
})

describe('one active draft per subject', () => {
  it('a second active draft for the same subject is refused', async () => {
    const second = await store.insertDraft({ ...(await store.getDraft(id))! }, null, T2)
    assert.deepEqual(second, { ok: false, reason: 'conflict' })
  })

  it('after a discard or a send, a new draft is allowed', async () => {
    await discardDraft(store, id, T2)
    const next = await newDraft()
    assert.ok(next)
    await editDraft(store, next, EDIT, T2)
    await approveDraft(store, next, T2)
    await markSent(store, next, T2)
    assert.ok(await newDraft())
  })

  it('edit again cannot create a second active draft', async () => {
    await editDraft(store, id, EDIT, T2)
    await approveDraft(store, id, T2)
    await markSent(store, id, T2)
    const other = await newDraft()
    assert.ok(other)
    assert.equal((await store.findActiveDraft('prospect', 'prospect-a'))!.id, other)
  })
})

describe('do not contact and the suppression list', () => {
  it('suppression matches the exact address or a suppressed domain', () => {
    const entries = [
      { email: 'blocked@one.example', domain: null },
      { email: 'anyone@two.example', domain: 'two.example' },
    ]
    assert.equal(isSuppressed(' Blocked@One.Example ', entries), true)
    assert.equal(isSuppressed('other@one.example', entries), false)
    assert.equal(isSuppressed('someone.else@two.example', entries), true)
    assert.equal(isSuppressed('someone@sub.two.example', entries), false)
  })

  it('approve is refused for a suppressed address', async () => {
    await addSuppressionByHand(store, { email: 'owner@firm.example', wholeDomain: false }, T1)
    await editDraft(store, id, EDIT, T2)
    const result = await approveDraft(store, id, T2)
    assert.equal(result.ok, false)
    assert.match(result.ok ? '' : result.error, /do-not-contact list/)
  })

  it('approve is refused for an address at a suppressed domain', async () => {
    await addSuppressionByHand(store, { email: 'info@firm.example', wholeDomain: true }, T1)
    await editDraft(store, id, EDIT, T2)
    assert.equal((await approveDraft(store, id, T2)).ok, false)
  })

  it('do not contact adds the recipient and discards the draft', async () => {
    await editDraft(store, id, EDIT, T2)
    await approveDraft(store, id, T2)
    const result = await doNotContact(store, id, T2)
    assert.ok(result.ok && result.draft.status === 'discarded')
    assert.deepEqual(
      store.suppressions.map((s) => [s.email, s.domain, s.reason]),
      [['owner@firm.example', null, 'do_not_contact']],
    )
  })

  it('do not contact on a sent email keeps it recorded as sent', async () => {
    await editDraft(store, id, EDIT, T2)
    await approveDraft(store, id, T2)
    await markSent(store, id, T2)
    const result = await doNotContact(store, id, T2)
    assert.ok(result.ok && result.draft.status === 'sent')
    assert.equal(store.suppressions.length, 1)
  })

  it('do not contact needs a recipient', async () => {
    const result = await doNotContact(store, id, T2)
    assert.equal(result.ok, false)
    assert.equal((await store.getDraft(id))!.status, 'draft')
  })

  it('the email is unique; adding it again widens to the domain but never narrows', async () => {
    assert.deepEqual(await addSuppressionByHand(store, { email: 'a@firm.example', wholeDomain: false }, T1), { ok: true, outcome: 'added' })
    assert.deepEqual(await addSuppressionByHand(store, { email: 'A@FIRM.EXAMPLE', wholeDomain: true }, T1), { ok: true, outcome: 'exists' })
    assert.deepEqual(await addSuppressionByHand(store, { email: 'a@firm.example', wholeDomain: false }, T1), { ok: true, outcome: 'exists' })
    assert.equal(store.suppressions.length, 1)
    assert.equal(store.suppressions[0]!.domain, 'firm.example')
  })

  it('a shared mail provider cannot be suppressed as a domain', async () => {
    const result = await addSuppressionByHand(store, { email: 'someone@gmail.com', wholeDomain: true }, T1)
    assert.equal(result.ok, false)
    assert.deepEqual(await addSuppressionByHand(store, { email: 'someone@gmail.com', wholeDomain: false }, T1), { ok: true, outcome: 'added' })
  })

  it('an invalid address is refused', async () => {
    assert.equal((await addSuppressionByHand(store, { email: 'not an email', wholeDomain: false }, T1)).ok, false)
  })

  it('removing an entry requires confirmation', async () => {
    await addSuppressionByHand(store, { email: 'a@firm.example', wholeDomain: false }, T1)
    const entryId = store.suppressions[0]!.id
    assert.deepEqual(await removeSuppression(store, entryId, false), { ok: false, error: 'Confirm the removal first.' })
    assert.equal(store.suppressions.length, 1)
    assert.deepEqual(await removeSuppression(store, entryId, true), { ok: true })
    assert.equal(store.suppressions.length, 0)
  })
})
