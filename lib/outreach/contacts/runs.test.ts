// Run with: pnpm exec tsx --test lib/outreach/contacts/runs.test.ts
// No network or database: memory stores only. Every lead and address is fictional.
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { MemoryContactStore } from '../fixtures/memory-contact-store'
import { CONTACT_RULES_VERSION, siteForBusiness, siteForProspect } from './rules'
import {
  CONTACT_RUN_SIZE,
  MAX_WAITING_CONTACT_RUNS,
  buildContactClaimResponse,
  ingestContactBatch,
  queueContactRun,
  queueLeadContactCheck,
  rederiveContacts,
  type ContactLead,
} from './runs'
import type { ContactBatch } from './schema'

const T0 = new Date('2026-11-13T15:00:00Z')

function prospect(n: number, domain = `firm${n}.example`): ContactLead {
  const id = `10000000-0000-4000-8000-${String(n).padStart(12, '0')}`
  return { subjectType: 'prospect', subjectRef: id, leadId: id, name: `Fictional Firm ${n}`, site: siteForProspect(domain) }
}

function business(n: number, status: Parameters<typeof siteForBusiness>[0], url: string | null): ContactLead {
  const id = `20000000-0000-4000-8000-${String(n).padStart(12, '0')}`
  return { subjectType: 'new_business', subjectRef: `sample shop ${n}|las vegas`, leadId: id, name: `Sample Shop ${n}`, site: siteForBusiness(status, url) }
}

async function claim(store: MemoryContactStore, now = T0) {
  const response = await buildContactClaimResponse(store, now)
  assert.ok(response.run !== null, 'a run was claimed')
  return response
}

function batch(runId: string, leads: unknown[], finish?: 'completed'): ContactBatch {
  return { runId, leads, ...(finish ? { finish } : {}) }
}

describe('queue', () => {
  it('handles leads with no page on the server and never sends them to the runner', async () => {
    const noSite = business(1, 'no_website', null)
    const store = new MemoryContactStore([noSite, prospect(1)])
    const queued = await queueContactRun(store, 'schedule', T0)
    assert.equal(queued.outcome, 'queued')
    assert.equal(queued.noPage, 1)
    assert.equal((await store.getContact(noSite))?.status, 'no_page')
    const response = await claim(store)
    assert.ok(response.run !== null)
    assert.deepEqual(response.leads.map((l) => l.name), ['Fictional Firm 1'])
  })

  it('covers both lead types, and waits for a business website check that has not run', async () => {
    const store = new MemoryContactStore([prospect(1), business(2, 'has_website', 'https://sampleshop2.example/'), business(3, null, null)])
    await queueContactRun(store, 'dashboard', T0)
    const response = await claim(store)
    assert.ok(response.run !== null)
    assert.deepEqual(response.leads.map((l) => [l.name, l.urls]), [
      ['Fictional Firm 1', ['https://firm1.example/']],
      ['Sample Shop 2', ['https://sampleshop2.example/']],
    ])
    assert.equal(await store.getContact(business(3, null, null)), null, 'no result written while the website check is pending')
  })

  it('sends a listing page for a business with no website of its own', async () => {
    const store = new MemoryContactStore([business(4, 'social_only', 'https://www.facebook.com/sampleshop4')])
    await queueContactRun(store, 'dashboard', T0)
    const response = await claim(store)
    assert.ok(response.run !== null)
    assert.deepEqual(response.leads[0]!.urls, ['https://www.facebook.com/sampleshop4'])
  })

  it('gives the runner an id, the name and the URLs, nothing else', async () => {
    const store = new MemoryContactStore([prospect(1)])
    await queueContactRun(store, 'dashboard', T0)
    const response = await claim(store)
    assert.ok(response.run !== null)
    assert.deepEqual(Object.keys(response.leads[0]!).sort(), ['id', 'name', 'urls'])
  })

  it('takes at most 20 leads per run and holds them from other runs', async () => {
    const store = new MemoryContactStore(Array.from({ length: 25 }, (_, i) => prospect(i + 1)))
    await queueContactRun(store, 'dashboard', T0)
    await queueContactRun(store, 'dashboard', T0)
    const first = await claim(store)
    const second = await claim(store)
    assert.ok(first.run !== null && second.run !== null)
    assert.equal(first.leads.length, CONTACT_RUN_SIZE)
    assert.equal(second.leads.length, 5)
    assert.equal(new Set([...first.leads, ...second.leads].map((l) => l.id)).size, 25)
  })

  it('allows at most 2 waiting runs from the page, and one open run from the schedule', async () => {
    const store = new MemoryContactStore([prospect(1)])
    assert.equal((await queueContactRun(store, 'dashboard', T0)).outcome, 'queued')
    assert.equal((await queueContactRun(store, 'dashboard', T0)).outcome, 'queued')
    assert.equal(MAX_WAITING_CONTACT_RUNS, 2)
    assert.equal((await queueContactRun(store, 'dashboard', T0)).outcome, 'limit_reached')
    assert.equal((await queueContactRun(store, 'schedule', T0)).outcome, 'run_open')
  })

  it('queues nothing when every accepted lead has a result; only accepted leads are listed', async () => {
    const store = new MemoryContactStore([])
    assert.equal((await queueContactRun(store, 'schedule', T0)).outcome, 'nothing_to_check')
  })

  it('checks a no_page lead again once it has a page', async () => {
    const store = new MemoryContactStore([business(5, 'no_website', null)])
    await queueContactRun(store, 'schedule', T0)
    store.leads = [business(5, 'has_website', 'https://sampleshop5.example/')]
    assert.equal((await queueContactRun(store, 'schedule', T0)).outcome, 'queued')
  })
})

describe('one lead from its page', () => {
  it('queues a one-lead run that only that lead is claimed for', async () => {
    const store = new MemoryContactStore([prospect(1), prospect(2)])
    const queued = await queueLeadContactCheck(store, { subjectType: 'prospect', leadId: prospect(2).leadId }, T0)
    assert.equal(queued.outcome, 'queued')
    assert.equal((await queueLeadContactCheck(store, { subjectType: 'prospect', leadId: prospect(2).leadId }, T0)).outcome, 'already_waiting')
    const response = await claim(store)
    assert.ok(response.run !== null)
    assert.deepEqual(response.leads.map((l) => l.name), ['Fictional Firm 2'])
  })

  it('records no_page at once, refuses a lead that is not accepted, and finds a business by its row id', async () => {
    const store = new MemoryContactStore([business(6, 'no_website', null)])
    assert.equal((await queueLeadContactCheck(store, { subjectType: 'new_business', leadId: business(6, 'no_website', null).leadId }, T0)).outcome, 'no_page')
    assert.equal(store.runs.length, 0)
    assert.equal((await queueLeadContactCheck(store, { subjectType: 'prospect', leadId: prospect(9).leadId }, T0)).outcome, 'not_accepted')
  })
})

describe('ingest', () => {
  it('saves a found address, decided by the server', async () => {
    const store = new MemoryContactStore([prospect(1)])
    await queueContactRun(store, 'dashboard', T0)
    const response = await claim(store)
    assert.ok(response.run !== null)
    const id = response.leads[0]!.id
    const result = await ingestContactBatch(
      store,
      batch(response.run.id, [
        {
          id,
          pages_read: ['https://firm1.example/contact'],
          addresses: [{ email: 'info@firm1.example', page_url: 'https://firm1.example/contact', context: 'Write to info@firm1.example.' }],
        },
      ], 'completed'),
      T0,
    )
    assert.ok(result.ok)
    assert.deepEqual(result.checked, [{ id, status: 'found' }])
    const stored = await store.getContact(prospect(1))
    assert.equal(stored?.email, 'info@firm1.example')
    assert.equal(stored?.kind, 'own_domain')
    assert.equal(stored?.heldByRunId, null)
  })

  it('ignores unknown lead ids and records a malformed entry for a run lead as unclear', async () => {
    const store = new MemoryContactStore([prospect(1)])
    await queueContactRun(store, 'dashboard', T0)
    const response = await claim(store)
    assert.ok(response.run !== null)
    const id = response.leads[0]!.id
    const stranger = '99999999-9999-4999-8999-999999999999'
    const result = await ingestContactBatch(
      store,
      batch(response.run.id, [
        { id: stranger, pages_read: [], addresses: [{ email: 'info@stranger.example', page_url: 'https://stranger.example/', context: 'info@stranger.example' }] },
        // A status sent by the runner makes the entry malformed: it is never read.
        { id, pages_read: [], addresses: [], status: 'found', email: 'info@firm1.example' },
      ]),
      T0,
    )
    assert.ok(result.ok)
    assert.deepEqual(result.rejected, [{ id: stranger, reasons: ['not_in_run'] }])
    assert.deepEqual(result.checked, [{ id, status: 'unclear' }])
    assert.equal(store.contacts.some((c) => c.id === stranger), false)
    assert.equal((await store.getContact(prospect(1)))?.email, null)
  })

  it('refuses a run that is not claimed', async () => {
    const store = new MemoryContactStore([prospect(1)])
    const { id } = await store.requestRun('dashboard', null, T0.toISOString())
    const result = await ingestContactBatch(store, batch(id, []), T0)
    assert.deepEqual(result, { ok: false, status: 409, error: 'Run is not claimed', runState: 'requested' })
  })

  it('releases the leads a finished run did not check', async () => {
    const store = new MemoryContactStore([prospect(1), prospect(2)])
    await queueContactRun(store, 'dashboard', T0)
    const response = await claim(store)
    assert.ok(response.run !== null)
    await ingestContactBatch(store, batch(response.run.id, [{ id: response.leads[0]!.id, pages_read: ['https://firm1.example/'], addresses: [] }], 'completed'), T0)
    assert.equal((await store.getContact(prospect(2)))?.heldByRunId, null)
    assert.equal((await store.getContact(prospect(2)))?.status, null)
  })
})

describe('re-derivation', () => {
  it('re-decides results stored under an older rules version', async () => {
    const store = new MemoryContactStore([prospect(1)])
    await queueContactRun(store, 'dashboard', T0)
    const response = await claim(store)
    assert.ok(response.run !== null)
    await ingestContactBatch(
      store,
      batch(response.run.id, [
        {
          id: response.leads[0]!.id,
          pages_read: ['https://firm1.example/contact'],
          addresses: [{ email: 'sales@firm1.example', page_url: 'https://firm1.example/contact', context: 'sales@firm1.example' }],
        },
      ], 'completed'),
      T0,
    )
    const row = store.contacts[0]!
    // As if an older version had stored a different result from the same evidence.
    row.rulesVersion = 'contact-rules-v0'
    row.status = 'none_found'
    row.email = null
    assert.equal(await rederiveContacts(store, T0.toISOString()), 1)
    assert.equal(store.contacts[0]!.status, 'found')
    assert.equal(store.contacts[0]!.email, 'sales@firm1.example')
    assert.equal(store.contacts[0]!.rulesVersion, CONTACT_RULES_VERSION)
    assert.equal(await rederiveContacts(store, T0.toISOString()), 0, 'current results are left alone')
  })
})

describe('contact-rules-v2: checking again', () => {
  const PAGE = 'https://firm1.example/contact'

  async function storedUnderV1(status: 'none_found' | 'named_only' | 'unclear') {
    const store = new MemoryContactStore([prospect(1)])
    await queueContactRun(store, 'dashboard', T0)
    const response = await claim(store)
    assert.ok(response.run !== null)
    await ingestContactBatch(store, batch(response.run.id, [{ id: response.leads[0]!.id, pages_read: [PAGE], addresses: [] }], 'completed'), T0)
    const row = store.contacts[0]!
    // As stored under v1: the mailto address was rejected for its context, and its outcome alone kept.
    row.rulesVersion = 'contact-rules-v1'
    row.status = status
    row.evidence =
      status === 'unclear'
        ? { malformed: true }
        : { name: 'Fictional Firm 1', site: prospect(1).site, pagesRead: [PAGE], addresses: [{ redacted: true, outcome: status === 'named_only' ? 'named' : 'rejected' }], note: null }
    return { store, row }
  }

  it('Find contact email queues a lead whose result is none_found, named_only or unclear', async () => {
    for (const status of ['none_found', 'named_only', 'unclear'] as const) {
      const { store } = await storedUnderV1(status)
      const queued = await queueLeadContactCheck(store, { subjectType: 'prospect', leadId: prospect(1).leadId }, T0)
      assert.equal(queued.outcome, 'queued', status)
    }
  })

  it('the morning step re-derives a v1 result without error and queues the lead again when it is not found', async () => {
    for (const status of ['none_found', 'named_only', 'unclear'] as const) {
      const { store, row } = await storedUnderV1(status)
      const queued = await queueContactRun(store, 'schedule', T0)
      assert.equal(queued.outcome, 'queued', status)
      assert.equal(queued.rederived, 0, status)
      assert.equal(row.status, status, 'the stored result stays until the runner checks again')
      assert.equal(row.rulesVersion, 'contact-rules-v1')
      const response = await claim(store)
      assert.ok(response.run !== null)
      assert.deepEqual(response.leads.map((l) => l.name), ['Fictional Firm 1'])
      const id = response.leads[0]!.id
      await ingestContactBatch(
        store,
        batch(response.run.id, [
          {
            id,
            pages_read: [PAGE],
            addresses: [{ email: 'information@firm1.example', page_url: PAGE, context: 'For more information click here', link_href: 'mailto:information@firm1.example' }],
          },
        ], 'completed'),
        T0,
      )
      assert.equal(row.status, 'found', status)
      assert.equal(row.email, 'information@firm1.example')
      assert.equal(row.rulesVersion, CONTACT_RULES_VERSION)
      assert.equal((await queueContactRun(store, 'schedule', T0)).outcome, 'nothing_to_check', 'a current result is not queued again')
    }
  })

  it('checks leads with no result before older-version results, within the run size', async () => {
    const leads = Array.from({ length: CONTACT_RUN_SIZE + 1 }, (_, i) => prospect(i + 1))
    const store = new MemoryContactStore(leads)
    await store.saveLeadResult(leads[0]!, { status: 'none_found', email: null, sourceUrl: null, kind: null, rejectedCount: 0, namedCount: 0, evidence: { malformed: true }, rulesVersion: 'contact-rules-v1' }, T0.toISOString())
    await queueContactRun(store, 'schedule', T0)
    const response = await claim(store)
    assert.ok(response.run !== null)
    assert.equal(response.leads.length, CONTACT_RUN_SIZE)
    assert.ok(!response.leads.some((l) => l.name === 'Fictional Firm 1'), 'the older result waits for the next run')
  })
})
