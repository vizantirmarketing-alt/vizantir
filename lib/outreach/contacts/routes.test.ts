// Run with: pnpm exec tsx --test lib/outreach/contacts/routes.test.ts
// The route handlers over a memory store. No network or database. Fictional data only.
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { MemoryContactStore } from '../fixtures/memory-contact-store'
import { siteForProspect } from './rules'
import { handleContactClaim, handleContactIngest } from './routes'
import { queueContactRun, type ContactLead } from './runs'
import { CONTACT_INGEST_MAX_BODY_CHARS } from './schema'

const T0 = new Date('2026-11-13T15:00:00Z')
const ENV = { token: 'runner-token-fictional', cronSecret: 'cron-secret-fictional' }
const AUTH = `Bearer ${ENV.token}`
const LEAD: ContactLead = {
  subjectType: 'prospect',
  subjectRef: '10000000-0000-4000-8000-000000000001',
  leadId: '10000000-0000-4000-8000-000000000001',
  name: 'Fictional Firm',
  site: siteForProspect('fictionalfirm.example'),
}

function ingest(store: MemoryContactStore, body: unknown, authorization: string | null = AUTH) {
  const text = typeof body === 'string' ? body : JSON.stringify(body)
  return handleContactIngest({ authorization, contentLength: String(text.length), text: async () => text }, ENV, () => store, T0)
}

async function claimed() {
  const store = new MemoryContactStore([LEAD])
  await queueContactRun(store, 'dashboard', T0)
  const reply = await handleContactClaim(AUTH, ENV, () => store, T0)
  assert.equal(reply.status, 200)
  const body = reply.body as { run: { id: string }; leads: { id: string }[] }
  return { store, runId: body.run.id, leadId: body.leads[0]!.id }
}

describe('contact routes: auth', () => {
  it('claim and ingest refuse a missing or wrong token, and never touch the store', async () => {
    const store = new MemoryContactStore([LEAD])
    let touched = false
    const watched = () => {
      touched = true
      return store
    }
    for (const header of [null, 'Bearer wrong', ENV.token, `Bearer ${ENV.cronSecret}`]) {
      assert.equal((await handleContactClaim(header, ENV, watched, T0)).status, 401)
      const reply = await handleContactIngest({ authorization: header, contentLength: '2', text: async () => '{}' }, ENV, watched, T0)
      assert.equal(reply.status, 401)
    }
    assert.equal(touched, false)
  })

  it('is not configured without a token, or when it equals the cron secret', async () => {
    const store = new MemoryContactStore([LEAD])
    assert.equal((await handleContactClaim(AUTH, { token: undefined, cronSecret: undefined }, () => store, T0)).status, 503)
    assert.equal((await handleContactClaim(AUTH, { token: ENV.token, cronSecret: ENV.token }, () => store, T0)).status, 503)
  })
})

describe('contact routes: schema', () => {
  it('rejects unknown top-level fields, bad JSON and oversized bodies', async () => {
    const { store, runId } = await claimed()
    assert.equal((await ingest(store, { runId, leads: [], extra: true })).status, 400)
    assert.equal((await ingest(store, '{not json')).status, 400)
    assert.equal((await ingest(store, { leads: [] })).status, 400)
    const big = await handleContactIngest(
      { authorization: AUTH, contentLength: String(CONTACT_INGEST_MAX_BODY_CHARS + 1), text: async () => '{}' },
      ENV,
      () => store,
      T0,
    )
    assert.equal(big.status, 413)
  })

  it('never accepts a status, kind or chosen address from the runner', async () => {
    const { store, runId, leadId } = await claimed()
    const reply = await ingest(store, {
      runId,
      leads: [{ id: leadId, pages_read: [], addresses: [], status: 'found', kind: 'own_domain', chosen: 'info@fictionalfirm.example' }],
    })
    assert.equal(reply.status, 200)
    assert.deepEqual((reply.body as { checked: unknown[] }).checked, [{ id: leadId, status: 'unclear' }])
    const row = await store.getContact(LEAD)
    assert.equal(row?.status, 'unclear')
    assert.equal(row?.email, null)
  })

  it('ignores lead ids outside the run', async () => {
    const { store, runId } = await claimed()
    const stranger = '99999999-9999-4999-8999-999999999999'
    const reply = await ingest(store, { runId, leads: [{ id: stranger, pages_read: [], addresses: [] }] })
    assert.equal(reply.status, 200)
    assert.deepEqual((reply.body as { rejected: unknown[] }).rejected, [{ id: stranger, reasons: ['not_in_run'] }])
    assert.equal(store.contacts.length, 1)
    assert.equal(store.contacts[0]!.status, null)
  })

  it('a run that does not exist is 404', async () => {
    const { store } = await claimed()
    const reply = await ingest(store, { runId: '88888888-8888-4888-8888-888888888888', leads: [] })
    assert.equal(reply.status, 404)
  })
})
