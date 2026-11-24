// Run with: NODE_OPTIONS=--conditions=react-server pnpm exec tsx --test lib/prospects/targeted-run.test.ts
// Targeted runs (research one saved prospect again): the optional
// config.targetDomain in claim, ingest and the stored-config reader, and proof
// that ordinary runs are exactly as before.
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import type { SupabaseClient } from '@supabase/supabase-js'

import { buildClaimResponse, type ClaimedRun, type ProspectClaimStore } from './claim'
import { FIXTURE_BATCH, FIXTURE_FULLY_RATED, FIXTURE_RUN_CONFIG, FIXTURE_RUN_ID, fixtureClaimedRun } from './fixtures/ingest-batch.fixture'
import { MemoryProspectStore } from './fixtures/memory-store'
import { REJECT_REASONS, ingestBatch, type ProspectWrite, type RunConfig } from './ingest'
import type { IngestBatch } from './ingest-schema'
import { PROSPECT_REVIEW_STATUSES } from './params'
import { FACTOR_DEFINITIONS, PROSPECT_FACTORS, PROSPECT_RATINGS, RUBRIC_VERSION } from './rubric'
import { readRunConfig } from './run-config'
import { createProspectStore } from './store'

const NOW = new Date('2026-11-23T18:00:00.000Z')
const TARGET = 'example.com' // FIXTURE_FULLY_RATED's domain, normalized
const TARGETED_CONFIG: RunConfig = { market: 'Fixture City, NV', industry: 'Fictional law firms', targetCount: 1, exclusions: [], targetDomain: TARGET }

function claimStore(run: ClaimedRun | null, domains: string[]): ProspectClaimStore {
  return {
    async failAbandonedRuns() {
      return 0
    },
    async claimOldestRequestedRun() {
      return run
    },
    async listKnownDomains() {
      return domains
    },
  }
}

const KNOWN = ['example.org', TARGET, 'shop.example.net', TARGET]

describe('stored run config', () => {
  it('an ordinary config reads back with exactly its four fields, as before (extra keys such as campaignId still dropped)', () => {
    const stored = { market: 'Las Vegas', industry: 'Law', targetCount: 5, exclusions: ['a.example'], campaignId: 'c-1' }
    const read = readRunConfig(stored)
    assert.deepEqual(read, { market: 'Las Vegas', industry: 'Law', targetCount: 5, exclusions: ['a.example'] })
    assert.deepEqual(Object.keys(read!), ['market', 'industry', 'targetCount', 'exclusions'])
    assert.equal(JSON.stringify(readRunConfig({ market: 'M', industry: 'I', targetCount: 1 })), '{"market":"M","industry":"I","targetCount":1,"exclusions":[]}')
  })

  it('a targeted config keeps its normalized target domain; anything not normalized makes the config unreadable', () => {
    assert.deepEqual(readRunConfig(TARGETED_CONFIG), TARGETED_CONFIG)
    for (const bad of ['https://example.com/', 'WWW.Example.com', 'not a domain', '']) {
      assert.equal(readRunConfig({ ...TARGETED_CONFIG, targetDomain: bad }), null, bad)
    }
  })
})

describe('claim', () => {
  it('an untargeted claim is byte-for-byte the response it always was', async () => {
    const run: ClaimedRun = { id: FIXTURE_RUN_ID, config: FIXTURE_RUN_CONFIG, requestedAt: '2026-11-23T17:00:00.000Z', claimedAt: NOW.toISOString() }
    const response = await buildClaimResponse(claimStore(run, KNOWN), NOW)
    // The response as built before targeted runs existed.
    const before = {
      run,
      rubric: {
        version: RUBRIC_VERSION,
        ratings: PROSPECT_RATINGS,
        factors: PROSPECT_FACTORS.map((key) => ({ key, score: FACTOR_DEFINITIONS[key].score, label: FACTOR_DEFINITIONS[key].label, description: FACTOR_DEFINITIONS[key].description })),
      },
      knownDomains: [...new Set(KNOWN)].sort(),
    }
    assert.equal(JSON.stringify(response), JSON.stringify(before))
    assert.equal('targetDomain' in response, false)
  })

  it('a targeted claim carries the target, clearly marked, and leaves only it out of the skip list', async () => {
    const run: ClaimedRun = { id: FIXTURE_RUN_ID, config: TARGETED_CONFIG, requestedAt: '2026-11-23T17:00:00.000Z', claimedAt: NOW.toISOString() }
    const response = await buildClaimResponse(claimStore(run, KNOWN), NOW)
    assert.ok(response.run !== null && 'knownDomains' in response)
    assert.equal(response.targetDomain, TARGET)
    assert.equal(response.run.config.targetDomain, TARGET)
    assert.deepEqual(response.knownDomains, ['example.org', 'shop.example.net'])
    assert.deepEqual(Object.keys(response).sort(), ['knownDomains', 'rubric', 'run', 'targetDomain'])
  })
})

function snapshot(store: MemoryProspectStore) {
  return { prospects: [...store.prospects.values()].sort((a, b) => a.domain.localeCompare(b.domain)), evidence: store.evidence, run: store.runs.get(FIXTURE_RUN_ID) }
}

describe('ingest', () => {
  it('an untargeted ingest is unchanged: same result and same writes, whether the config came straight or through the stored-config reader, and no target rule applies', async () => {
    const direct = new MemoryProspectStore([fixtureClaimedRun()])
    const viaReader = new MemoryProspectStore([fixtureClaimedRun({ config: readRunConfig(JSON.parse(JSON.stringify(FIXTURE_RUN_CONFIG)))! })])
    const a = await ingestBatch(direct, FIXTURE_BATCH, NOW)
    const b = await ingestBatch(viaReader, FIXTURE_BATCH, NOW)
    assert.equal(JSON.stringify(a), JSON.stringify(b))
    assert.equal(JSON.stringify(snapshot(direct)), JSON.stringify(snapshot(viaReader)))
    assert.ok(a.ok)
    // Several different domains saved in one ordinary run, as always.
    assert.deepEqual(a.saved.map((record) => record.domain).sort(), ['example.com', 'example.org'])
    assert.equal(JSON.stringify(a).includes(REJECT_REASONS.notTargetDomain), false)
  })

  it('a targeted ingest saves the target domain only, and rejects every other domain with a clear reason, saving nothing for it', async () => {
    const store = new MemoryProspectStore([fixtureClaimedRun({ config: TARGETED_CONFIG })])
    const result = await ingestBatch(store, { ...FIXTURE_BATCH, finish: 'completed' }, NOW)
    assert.ok(result.ok)
    assert.deepEqual(result.saved.map((record) => record.domain), [TARGET])
    assert.deepEqual([...store.prospects.keys()], [TARGET])
    const others = result.rejected.filter((record) => record.key !== TARGET)
    assert.ok(others.length >= 2)
    for (const record of others) assert.deepEqual(record.reasons, [REJECT_REASONS.notTargetDomain], record.key)
    assert.ok(store.evidence.every((item) => item.prospectId === store.prospects.get(TARGET)!.id))
  })

  it('a targeted batch naming only another company saves nothing at all, and the run finishes partial with the reason recorded', async () => {
    const store = new MemoryProspectStore([fixtureClaimedRun({ config: { ...TARGETED_CONFIG, targetDomain: 'some-other.example' } })])
    const batch: IngestBatch = { runId: FIXTURE_RUN_ID, prospects: [FIXTURE_FULLY_RATED], finish: 'completed' }
    const result = await ingestBatch(store, batch, NOW)
    assert.ok(result.ok)
    assert.deepEqual([result.saved, store.prospects.size, store.evidence.length], [[], 0, 0])
    assert.equal(result.runState, 'partial')
    assert.match(store.runs.get(FIXTURE_RUN_ID)!.errorSummary ?? '', /1 record rejected: example\.com \(not_target_domain\)/)
  })
})

describe('re-research keeps the owner\'s review status and note', () => {
  /** A fake Supabase client for the prospects upsert: records the row and merges it like ON CONFLICT DO UPDATE (only the columns sent). */
  function fakeClient(existing: Record<string, unknown>) {
    const sent: Record<string, unknown>[] = []
    const table = { ...existing }
    const client = {
      from(name: string) {
        assert.equal(name, 'prospects')
        return {
          upsert(row: Record<string, unknown>, options: { onConflict: string }) {
            assert.equal(options.onConflict, 'domain')
            sent.push(row)
            Object.assign(table, row)
            return { select: () => ({ single: async () => ({ data: { id: table.id }, error: null }) }) }
          },
        }
      },
    }
    return { client: client as unknown as SupabaseClient, sent, table }
  }

  const write: ProspectWrite = {
    domain: TARGET,
    canonicalName: 'Example Firm',
    market: 'Fixture City, NV',
    industry: 'Fictional law firms',
    factorRatings: Object.fromEntries(PROSPECT_FACTORS.map((key) => [key, 'unknown'])) as ProspectWrite['factorRatings'],
    fitScore: null,
    opportunityScore: null,
    confidence: 'low',
    rubricVersion: RUBRIC_VERSION,
    latestRunId: FIXTURE_RUN_ID,
    lastResearchedAt: NOW.toISOString(),
  }

  for (const status of PROSPECT_REVIEW_STATUSES) {
    it(`a ${status} prospect stays ${status}, with its note, review time and creation time`, async () => {
      const existing = { id: 'p-1', domain: TARGET, review_status: status, owner_note: 'Owner note.', reviewed_at: '2026-11-01T00:00:00.000Z', created_at: '2026-10-01T00:00:00.000Z', fit_score: 90 }
      const fake = fakeClient(existing)
      await createProspectStore(fake.client).saveProspect(write)
      for (const column of ['review_status', 'owner_note', 'reviewed_at', 'created_at']) assert.equal(column in fake.sent[0]!, false, column)
      assert.deepEqual(
        [fake.table.review_status, fake.table.owner_note, fake.table.reviewed_at, fake.table.created_at],
        [status, 'Owner note.', '2026-11-01T00:00:00.000Z', '2026-10-01T00:00:00.000Z'],
      )
      // Scores are replaced by the new research.
      assert.equal(fake.table.fit_score, null)
    })
  }
})
