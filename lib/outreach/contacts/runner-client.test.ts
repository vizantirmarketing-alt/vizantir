// Run with: pnpm exec tsx --test lib/outreach/contacts/runner-client.test.ts
// No network: fetch is injected. Fictional data only.
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import type { RunnerDeps } from '@/lib/prospects/runner-client'

import { isContactCommand, runContactCli } from './runner-client'

const TOKEN = 'test-token-not-real'

function harness(status: number, body: unknown, files: Record<string, string> = {}) {
  const calls: { url: string; headers: Record<string, string>; body?: string }[] = []
  const out: string[] = []
  const err: string[] = []
  const deps: RunnerDeps = {
    fetch: async (url, init) => {
      calls.push({ url, headers: init.headers, body: init.body })
      return { status, text: async () => JSON.stringify(body) }
    },
    env: { PROSPECT_INGEST_TOKEN: TOKEN },
    readEnvFile: () => null,
    readFile: (path) => {
      if (!(path in files)) throw new Error('missing')
      return files[path]!
    },
    stdout: (line) => out.push(line),
    stderr: (line) => err.push(line),
  }
  return { deps, calls, out, err }
}

const RUN = '00000000-0000-4000-8000-000000000009'
const LEAD = '00000000-0000-4000-8000-000000000001'

describe('contact helper commands', () => {
  it('recognizes only its own commands', () => {
    assert.equal(isContactCommand('contact-claim'), true)
    assert.equal(isContactCommand('contact-ingest'), true)
    assert.equal(isContactCommand('nb-claim'), false)
  })

  it('contact-claim posts to the prospects path and exits 2 when nothing is queued, never printing the token', async () => {
    const h = harness(200, { run: null })
    assert.equal(await runContactCli(['contact-claim'], h.deps), 2)
    assert.equal(h.calls[0]!.url, 'http://localhost:3000/api/prospects/outreach-contacts/claim')
    assert.equal(h.calls[0]!.headers.Authorization, `Bearer ${TOKEN}`)
    assert.ok(!h.out.join('\n').includes(TOKEN) && !h.err.join('\n').includes(TOKEN))
  })

  it('contact-ingest checks each lead entry locally and sends nothing when one is invalid', async () => {
    const bad = JSON.stringify({ runId: RUN, leads: [{ id: LEAD, pages_read: [], addresses: [], status: 'found' }] })
    const h = harness(200, {}, { '/tmp/contact-addresses/a.json': bad })
    assert.equal(await runContactCli(['contact-ingest', '/tmp/contact-addresses/a.json'], h.deps), 1)
    assert.equal(h.calls.length, 0)
    assert.match(h.err.join('\n'), /Batch file is invalid/)
  })

  it('contact-ingest sends a valid batch and prints the server statuses', async () => {
    const good = JSON.stringify({ runId: RUN, leads: [{ id: LEAD, pages_read: ['https://fictionalfirm.example/'], addresses: [] }], finish: 'completed' })
    const h = harness(200, { runId: RUN, runState: 'completed', checked: [{ id: LEAD, status: 'none_found' }], rejected: [], counts: { checked: 1, rejected: 0 } }, {
      '/tmp/contact-addresses/b.json': good,
    })
    assert.equal(await runContactCli(['contact-ingest', '/tmp/contact-addresses/b.json'], h.deps), 0)
    assert.equal(h.calls[0]!.url, 'http://localhost:3000/api/prospects/outreach-contacts/ingest')
    assert.match(h.out.join('\n'), /checked {3}00000000-0000-4000-8000-000000000001 {2}none_found/)
  })

  it('bad usage exits 64', async () => {
    assert.equal(await runContactCli(['contact-ingest'], harness(200, {}).deps), 64)
  })
})
