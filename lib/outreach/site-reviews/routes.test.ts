// Run with: pnpm exec tsx --test lib/outreach/site-reviews/routes.test.ts
// The route handlers over a memory store. No network or database. Fictional data only.
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import type { RunnerDeps } from '@/lib/prospects/runner-client'

import { MemorySiteReviewStore } from '../fixtures/memory-site-review-store'
import { reviewSiteFor } from './rules'
import { handleSiteReviewClaim, handleSiteReviewIngest } from './routes'
import { isSiteReviewCommand, runSiteReviewCli } from './runner-client'
import { queueSiteReviewRun, type SiteReviewLead } from './runs'
import { SITE_REVIEW_INGEST_MAX_BODY_CHARS } from './schema'

const T0 = new Date('2026-11-16T15:00:00Z')
const ENV = { token: 'runner-token-fictional', cronSecret: 'cron-secret-fictional' }
const AUTH = `Bearer ${ENV.token}`
const LEAD: SiteReviewLead = {
  subjectType: 'new_business',
  subjectRef: 'group-fictional',
  leadId: '20000000-0000-4000-8000-000000000001',
  name: 'Fictional Bakery',
  site: reviewSiteFor('https://www.fictional-bakery.example/'),
}
const OBSERVATION = {
  category: 'contact_path',
  text: 'The catering page has no form or booking link.',
  page_url: 'https://www.fictional-bakery.example/catering',
  excerpt: 'For catering orders please call us during opening hours.',
}

function ingest(store: MemorySiteReviewStore, body: unknown, authorization: string | null = AUTH) {
  const text = typeof body === 'string' ? body : JSON.stringify(body)
  return handleSiteReviewIngest({ authorization, contentLength: String(text.length), text: async () => text }, ENV, () => store, T0)
}

async function claimed() {
  const store = new MemorySiteReviewStore([LEAD])
  await queueSiteReviewRun(store, 'dashboard', T0)
  const reply = await handleSiteReviewClaim(AUTH, ENV, () => store, T0)
  assert.equal(reply.status, 200)
  const body = reply.body as { run: { id: string }; leads: { id: string }[] }
  return { store, runId: body.run.id, leadId: body.leads[0]!.id }
}

describe('site review routes: auth', () => {
  it('claim and ingest refuse a missing or wrong token, or the cron secret, and never touch the store', async () => {
    const store = new MemorySiteReviewStore([LEAD])
    let touched = false
    const watched = () => {
      touched = true
      return store
    }
    for (const header of [null, 'Bearer wrong', ENV.token, `Bearer ${ENV.cronSecret}`]) {
      assert.equal((await handleSiteReviewClaim(header, ENV, watched, T0)).status, 401)
      const reply = await handleSiteReviewIngest({ authorization: header, contentLength: '2', text: async () => '{}' }, ENV, watched, T0)
      assert.equal(reply.status, 401)
    }
    assert.equal(touched, false)
  })

  it('is not configured without a token', async () => {
    const store = new MemorySiteReviewStore([LEAD])
    assert.equal((await handleSiteReviewClaim(AUTH, { token: undefined, cronSecret: undefined }, () => store, T0)).status, 503)
  })
})

describe('site review routes: schema and ingest', () => {
  it('rejects an unknown top-level field and an oversized body', async () => {
    const { store, runId } = await claimed()
    assert.equal((await ingest(store, { runId, leads: [], extra: true })).status, 400)
    assert.equal((await ingest(store, 'not json')).status, 400)
    const big = await handleSiteReviewIngest(
      { authorization: AUTH, contentLength: String(SITE_REVIEW_INGEST_MAX_BODY_CHARS + 1), text: async () => '{}' },
      ENV,
      () => store,
      T0,
    )
    assert.equal(big.status, 413)
  })

  it('stores the server\'s decision', async () => {
    const { store, runId, leadId } = await claimed()
    const reply = await ingest(store, { runId, leads: [{ id: leadId, pages_read: ['https://www.fictional-bakery.example/'], observations: [OBSERVATION] }], finish: 'completed' })
    assert.equal(reply.status, 200)
    assert.deepEqual((reply.body as { reviewed: unknown }).reviewed, [{ id: leadId, status: 'reviewed' }])
    assert.equal(store.reviews[0]!.status, 'reviewed')
    assert.equal(store.runs[0]!.state, 'completed')
  })

  it('never accepts a status from the runner: such an entry is recorded as unclear', async () => {
    const { store, runId, leadId } = await claimed()
    const reply = await ingest(store, { runId, leads: [{ id: leadId, pages_read: [], observations: [OBSERVATION], status: 'reviewed' }] })
    assert.equal(reply.status, 200)
    assert.equal(store.reviews[0]!.status, 'unclear')
    assert.deepEqual(store.reviews[0]!.observations, [])
  })

  it('ignores unknown lead ids and writes nothing for them', async () => {
    const { store, runId } = await claimed()
    const stranger = '99999999-0000-4000-8000-000000000001'
    const reply = await ingest(store, { runId, leads: [{ id: stranger, pages_read: [], observations: [OBSERVATION] }] })
    assert.equal(reply.status, 200)
    assert.deepEqual((reply.body as { rejected: unknown }).rejected, [{ id: stranger, reasons: ['not_in_run'] }])
    assert.equal(store.reviews[0]!.status, null)
  })

  it('refuses a run that is not claimed', async () => {
    const store = new MemorySiteReviewStore([LEAD])
    assert.equal((await ingest(store, { runId: '99999999-0000-4000-8000-000000000002', leads: [] })).status, 404)
  })
})

describe('site review helper commands', () => {
  function harness(status: number, body: unknown, files: Record<string, string> = {}) {
    const calls: { url: string; body?: string }[] = []
    const err: string[] = []
    const deps: RunnerDeps = {
      fetch: async (url, init) => {
        calls.push({ url, body: init.body })
        return { status, text: async () => JSON.stringify(body) }
      },
      env: { PROSPECT_INGEST_TOKEN: 'test-token-not-real' },
      readEnvFile: () => null,
      readFile: (path) => {
        if (!(path in files)) throw new Error('missing')
        return files[path]!
      },
      stdout: () => {},
      stderr: (line) => err.push(line),
    }
    return { deps, calls, err }
  }

  it('recognizes only its own commands and calls its own routes', async () => {
    assert.equal(isSiteReviewCommand('site-review-claim'), true)
    assert.equal(isSiteReviewCommand('contact-claim'), false)
    const h = harness(200, { run: null })
    assert.equal(await runSiteReviewCli(['site-review-claim'], h.deps), 2)
    assert.equal(h.calls[0]!.url, 'http://localhost:3000/api/prospects/site-reviews/claim')
  })

  it('checks a batch locally before sending it', async () => {
    const bad = JSON.stringify({ runId: '00000000-0000-4000-8000-000000000009', leads: [{ id: 'not-a-uuid', pages_read: [], observations: [] }] })
    const h = harness(200, {}, { 'b.json': bad })
    assert.equal(await runSiteReviewCli(['site-review-ingest', 'b.json'], h.deps), 1)
    assert.equal(h.calls.length, 0)
  })
})
