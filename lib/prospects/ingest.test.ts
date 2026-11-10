// Run with: pnpm exec tsx --test lib/prospects/ingest.test.ts
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  FIXTURE_BATCH,
  FIXTURE_EXCLUDED,
  FIXTURE_FULLY_RATED,
  FIXTURE_MISSING_EVIDENCE,
  FIXTURE_RUN_CONFIG,
  FIXTURE_RUN_ID,
  FIXTURE_SPARSE,
  fixtureClaimedRun,
} from './fixtures/ingest-batch.fixture';
import { MemoryProspectStore } from './fixtures/memory-store';
import {
  REJECT_REASONS,
  appendSummaryLine,
  buildErrorSummary,
  splitRunSummary,
  finalRunState,
  ingestBatch,
  prepareBatch,
} from './ingest';
import type { IngestBatch } from './ingest-schema';
import { RUBRIC_VERSION } from './rubric';

const NOW = new Date('2026-11-09T12:00:00.000Z');

function snapshot(store: MemoryProspectStore) {
  return {
    prospects: [...store.prospects.values()]
      .map((prospect) => ({ ...prospect }))
      .sort((a, b) => a.domain.localeCompare(b.domain)),
    evidence: [...store.evidence].sort((a, b) =>
      `${a.prospectId}${a.factorKey}${a.claim}`.localeCompare(`${b.prospectId}${b.factorKey}${b.claim}`),
    ),
    run: store.runs.get(FIXTURE_RUN_ID),
  };
}

describe('prepareBatch', () => {
  it('computes scores in code from ratings', () => {
    const prepared = prepareBatch(FIXTURE_BATCH, FIXTURE_RUN_CONFIG, NOW.toISOString());
    const full = prepared.accepted.find((record) => record.domain === 'example.com');
    assert.ok(full);
    // fit: 30 + 30 + 12.5 + 0 = 72.5 -> 73; opportunity: 35 + 0 (performance
    // unknown until measured) + 10 + 0 = 45, with 30 of 100 weight unknown.
    assert.equal(full.write.fitScore, 73);
    assert.equal(full.write.opportunityScore, 45);
    assert.equal(full.write.confidence, 'high');
    assert.equal(full.write.rubricVersion, RUBRIC_VERSION);

    const sparse = prepared.accepted.find((record) => record.domain === 'example.org');
    assert.ok(sparse);
    assert.equal(sparse.write.fitScore, null);
    assert.equal(sparse.write.opportunityScore, null);
    assert.equal(sparse.write.confidence, 'low');
  });

  it('falls back to the run market and industry, and keeps a supplied market', () => {
    const prepared = prepareBatch(FIXTURE_BATCH, FIXTURE_RUN_CONFIG, NOW.toISOString());
    const full = prepared.accepted.find((record) => record.domain === 'example.com');
    const sparse = prepared.accepted.find((record) => record.domain === 'example.org');
    assert.equal(full?.write.market, FIXTURE_RUN_CONFIG.market);
    assert.equal(full?.write.industry, FIXTURE_RUN_CONFIG.industry);
    assert.equal(sparse?.write.market, FIXTURE_SPARSE.market);
  });

  it('rejects a record whose non-unknown rating lacks evidence', () => {
    const prepared = prepareBatch(FIXTURE_BATCH, FIXTURE_RUN_CONFIG, NOW.toISOString());
    const rejected = prepared.rejected.find((record) => record.key === 'canyon-ridge.example.net');
    assert.deepEqual(rejected?.reasons, [`${REJECT_REASONS.missingEvidence}:growth_signals`]);
    assert.ok(!prepared.accepted.some((record) => record.domain === 'canyon-ridge.example.net'));
  });

  it('rejects excluded domains and invalid domains', () => {
    const batch: IngestBatch = {
      runId: FIXTURE_RUN_ID,
      prospects: [FIXTURE_EXCLUDED, { ...FIXTURE_EXCLUDED, domain: 'http://10.0.0.1' }],
    };
    const prepared = prepareBatch(batch, FIXTURE_RUN_CONFIG, NOW.toISOString());
    assert.equal(prepared.accepted.length, 0);
    assert.deepEqual(prepared.rejected.map((record) => record.reasons[0]), [
      REJECT_REASONS.excluded,
      REJECT_REASONS.invalidDomain,
    ]);
  });

  it('rejects a second record for the same normalized domain in one batch', () => {
    const batch: IngestBatch = {
      runId: FIXTURE_RUN_ID,
      prospects: [FIXTURE_FULLY_RATED, { ...FIXTURE_FULLY_RATED, domain: 'example.com' }],
    };
    const prepared = prepareBatch(batch, FIXTURE_RUN_CONFIG, NOW.toISOString());
    assert.equal(prepared.accepted.length, 1);
    assert.deepEqual(prepared.rejected, [
      { key: 'example.com', reasons: [REJECT_REASONS.duplicateInBatch] },
    ]);
  });
});

describe('ingestBatch', () => {
  it('saves valid records, rejects invalid ones, and records outcomes on the run', async () => {
    const store = new MemoryProspectStore([fixtureClaimedRun()]);
    const result = await ingestBatch(store, FIXTURE_BATCH, NOW);

    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.deepEqual(result.saved.map((record) => record.domain).sort(), ['example.com', 'example.org']);
    assert.equal(result.rejected.length, 2);
    assert.deepEqual(result.counts, { saved: 2, rejected: 2 });
    assert.equal(result.runState, 'claimed');

    assert.equal(store.prospects.size, 2);
    assert.equal(store.evidence.length, FIXTURE_FULLY_RATED.evidence.length + FIXTURE_SPARSE.evidence.length);
    assert.ok(store.evidence.every((item) => item.runId === FIXTURE_RUN_ID));
    assert.match(store.runs.get(FIXTURE_RUN_ID)?.errorSummary ?? '', /2 records rejected/);
  });

  it('is idempotent when the same batch is ingested twice', async () => {
    const store = new MemoryProspectStore([fixtureClaimedRun()]);
    await ingestBatch(store, FIXTURE_BATCH, NOW);
    const first = snapshot(store);

    const again = await ingestBatch(store, FIXTURE_BATCH, NOW);
    assert.equal(again.ok, true);
    assert.deepEqual(snapshot(store), first);
    assert.deepEqual(again.ok ? again.counts : null, { saved: 2, rejected: 2 });
  });

  it('replaces this run\'s evidence for a re-ingested domain rather than appending', async () => {
    const store = new MemoryProspectStore([fixtureClaimedRun()]);
    await ingestBatch(store, { runId: FIXTURE_RUN_ID, prospects: [FIXTURE_FULLY_RATED] }, NOW);

    const revised = {
      ...FIXTURE_FULLY_RATED,
      ratings: { ...FIXTURE_FULLY_RATED.ratings, growth_signals: 'unknown' as const },
      evidence: FIXTURE_FULLY_RATED.evidence.filter((item) => item.factor !== 'growth_signals'),
    };
    await ingestBatch(store, { runId: FIXTURE_RUN_ID, prospects: [revised] }, NOW);

    assert.equal(store.prospects.size, 1);
    assert.equal(store.evidence.length, FIXTURE_FULLY_RATED.evidence.length - 1);
    assert.equal(store.prospects.get('example.com')?.factorRatings.growth_signals, 'unknown');
  });

  it('keeps evidence from earlier runs and preserves the owner review', async () => {
    const otherRunId = '9b2e4c6a-1d3f-4a5b-8c7d-0e1f2a3b4c5d';
    const store = new MemoryProspectStore([
      fixtureClaimedRun(),
      fixtureClaimedRun({ id: otherRunId }),
    ]);
    await ingestBatch(store, { runId: FIXTURE_RUN_ID, prospects: [FIXTURE_FULLY_RATED] }, NOW);

    const saved = store.prospects.get('example.com');
    assert.ok(saved);
    store.prospects.set('example.com', { ...saved, reviewStatus: 'accepted', ownerNote: 'Call in January.' });

    await ingestBatch(store, { runId: otherRunId, prospects: [FIXTURE_FULLY_RATED] }, NOW);

    const after = store.prospects.get('example.com');
    assert.equal(after?.reviewStatus, 'accepted');
    assert.equal(after?.ownerNote, 'Call in January.');
    assert.equal(after?.latestRunId, otherRunId);
    assert.equal(store.evidence.length, FIXTURE_FULLY_RATED.evidence.length * 2);
  });

  it('refuses a run that does not exist or is not claimed', async () => {
    const missing = await ingestBatch(new MemoryProspectStore(), FIXTURE_BATCH, NOW);
    assert.deepEqual(missing, { ok: false, status: 404, error: 'Run not found' });

    for (const state of ['requested', 'completed', 'partial', 'failed', 'cancelled'] as const) {
      const store = new MemoryProspectStore([fixtureClaimedRun({ state })]);
      const result = await ingestBatch(store, FIXTURE_BATCH, NOW);
      assert.equal(result.ok ? null : result.status, 409);
      assert.equal(store.prospects.size, 0);
    }
  });

  it('finishes as partial when records were rejected and completed when none were', async () => {
    const partialStore = new MemoryProspectStore([fixtureClaimedRun()]);
    const partial = await ingestBatch(partialStore, { ...FIXTURE_BATCH, finish: 'completed' }, NOW);
    assert.equal(partial.ok ? partial.runState : null, 'partial');

    const cleanStore = new MemoryProspectStore([fixtureClaimedRun()]);
    const clean = await ingestBatch(
      cleanStore,
      { runId: FIXTURE_RUN_ID, prospects: [FIXTURE_FULLY_RATED], finish: 'completed' },
      NOW,
    );
    assert.equal(clean.ok ? clean.runState : null, 'completed');

    const after = await ingestBatch(cleanStore, { runId: FIXTURE_RUN_ID, prospects: [] }, NOW);
    assert.equal(after.ok ? null : after.status, 409);
  });

  it('marks a run failed when the runner reports failure', async () => {
    const store = new MemoryProspectStore([fixtureClaimedRun()]);
    const result = await ingestBatch(
      store,
      { runId: FIXTURE_RUN_ID, prospects: [], finish: 'failed', runErrors: ['Search provider unavailable'] },
      NOW,
    );
    assert.equal(result.ok ? result.runState : null, 'failed');
    assert.match(store.runs.get(FIXTURE_RUN_ID)?.errorSummary ?? '', /Runner: Search provider unavailable/);
  });

  it('does not save anything into a missing-evidence record', async () => {
    const store = new MemoryProspectStore([fixtureClaimedRun()]);
    await ingestBatch(store, { runId: FIXTURE_RUN_ID, prospects: [FIXTURE_MISSING_EVIDENCE] }, NOW);
    assert.equal(store.prospects.size, 0);
    assert.equal(store.evidence.length, 0);
  });
});

describe('run summary helpers', () => {
  it('does not duplicate runner errors when a batch is resent', () => {
    const outcomes = {};
    const first = buildErrorSummary(null, outcomes, ['Timeout on page 2']);
    const second = buildErrorSummary(first.summary, outcomes, ['Timeout on page 2']);
    assert.equal(second.summary, 'Runner: Timeout on page 2');
  });

  it('treats runner errors as a partial result', () => {
    assert.equal(finalRunState('completed', { saved: 3, rejected: 0 }, ['Runner: one site timed out']), 'partial');
    assert.equal(finalRunState('completed', { saved: 0, rejected: 0 }, []), 'completed');
    assert.equal(finalRunState('failed', { saved: 3, rejected: 0 }, []), 'failed');
  });
});

describe('rubric v2 ingest rules', () => {
  const nowIso = NOW.toISOString();

  it('rejects a record that rates the performance factor', () => {
    const rated = { ...FIXTURE_FULLY_RATED, ratings: { ...FIXTURE_FULLY_RATED.ratings, performance_technical_issues: 'weak' as const } };
    const prepared = prepareBatch({ runId: FIXTURE_RUN_ID, prospects: [rated] }, FIXTURE_RUN_CONFIG, nowIso);
    assert.equal(prepared.accepted.length, 0);
    assert.deepEqual(prepared.rejected[0]?.reasons, [`${REJECT_REASONS.serverRatedFactor}:performance_technical_issues`]);
  });

  it('rejects performance evidence even when the rating is unknown', () => {
    const withEvidence = {
      ...FIXTURE_FULLY_RATED,
      evidence: [
        ...FIXTURE_FULLY_RATED.evidence,
        { factor: 'performance_technical_issues' as const, kind: 'measurement' as const, claim: 'Fixture: score 41.', sourceUrl: 'https://example.com/', observedAt: '2026-11-01T17:30:00.000Z' },
      ],
    };
    const prepared = prepareBatch({ runId: FIXTURE_RUN_ID, prospects: [withEvidence] }, FIXTURE_RUN_CONFIG, nowIso);
    assert.equal(prepared.accepted.length, 0);
    assert.match(prepared.rejected[0]?.reasons[0] ?? '', /^server_rated_factor:/);
  });

  it('rejects a navigation rating backed by only one source URL', () => {
    const oneSource = {
      ...FIXTURE_FULLY_RATED,
      evidence: FIXTURE_FULLY_RATED.evidence.filter(
        (item) => !(item.factor === 'navigation_conversion_friction' && item.sourceUrl.endsWith('/services')),
      ),
    };
    const prepared = prepareBatch({ runId: FIXTURE_RUN_ID, prospects: [oneSource] }, FIXTURE_RUN_CONFIG, nowIso);
    assert.equal(prepared.accepted.length, 0);
    assert.deepEqual(prepared.rejected[0]?.reasons, [`${REJECT_REASONS.needsTwoSources}:navigation_conversion_friction`]);
  });

  it('rejects two navigation items that cite the same URL', () => {
    const sameUrl = {
      ...FIXTURE_FULLY_RATED,
      evidence: FIXTURE_FULLY_RATED.evidence.map((item) =>
        item.factor === 'navigation_conversion_friction' ? { ...item, sourceUrl: 'https://example.com/' } : item,
      ),
    };
    const prepared = prepareBatch({ runId: FIXTURE_RUN_ID, prospects: [sameUrl] }, FIXTURE_RUN_CONFIG, nowIso);
    assert.equal(prepared.accepted.length, 0);
  });

  it('accepts navigation evidence from two distinct URLs, and unknown navigation with none', () => {
    const prepared = prepareBatch({ runId: FIXTURE_RUN_ID, prospects: [FIXTURE_FULLY_RATED] }, FIXTURE_RUN_CONFIG, nowIso);
    assert.equal(prepared.accepted.length, 1);

    const unknownNav = {
      ...FIXTURE_FULLY_RATED,
      ratings: { ...FIXTURE_FULLY_RATED.ratings, navigation_conversion_friction: 'unknown' as const },
      evidence: FIXTURE_FULLY_RATED.evidence.filter((item) => item.factor !== 'navigation_conversion_friction'),
    };
    const second = prepareBatch({ runId: FIXTURE_RUN_ID, prospects: [unknownNav] }, FIXTURE_RUN_CONFIG, nowIso);
    assert.equal(second.accepted.length, 1);
  });
});

describe('run notes versus errors', () => {
  it('finishes as completed with notes and a shortfall but no errors or rejections', async () => {
    const store = new MemoryProspectStore([fixtureClaimedRun({ config: { ...FIXTURE_RUN_CONFIG, targetCount: 10 } })]);
    const result = await ingestBatch(
      store,
      {
        runId: FIXTURE_RUN_ID,
        prospects: [FIXTURE_FULLY_RATED],
        finish: 'completed',
        runNotes: ['Skipped example-firm.example.net: HTTP 403', 'Only 1 of 10 qualified: most results were directories.'],
      },
      NOW,
    );
    assert.equal(result.ok ? result.runState : null, 'completed');
    const summary = store.runs.get(FIXTURE_RUN_ID)?.errorSummary ?? null;
    assert.deepEqual(splitRunSummary(summary), {
      errors: [],
      notes: ['Skipped example-firm.example.net: HTTP 403', 'Only 1 of 10 qualified: most results were directories.'],
    });
  });

  it('still finishes as partial when there is a runner error', async () => {
    const store = new MemoryProspectStore([fixtureClaimedRun()]);
    const result = await ingestBatch(
      store,
      { runId: FIXTURE_RUN_ID, prospects: [FIXTURE_FULLY_RATED], finish: 'completed', runErrors: ['Search provider timed out'], runNotes: ['Skipped one site'] },
      NOW,
    );
    assert.equal(result.ok ? result.runState : null, 'partial');
    const split = splitRunSummary(store.runs.get(FIXTURE_RUN_ID)?.errorSummary ?? null);
    assert.deepEqual(split.errors, ['Search provider timed out']);
    assert.deepEqual(split.notes, ['Skipped one site']);
  });

  it('does not duplicate notes when a batch is resent', () => {
    const first = buildErrorSummary(null, {}, [], ['Skipped one site']);
    const second = buildErrorSummary(first.summary, {}, [], ['Skipped one site']);
    assert.equal(second.summary, 'Note: Skipped one site');
    assert.deepEqual(second.noteLines, ['Note: Skipped one site']);
    assert.deepEqual(second.runnerLines, []);
  });

  it('keeps system lines such as an abandoned-run reason as errors', () => {
    const rebuilt = buildErrorSummary('System: Run abandoned', {}, [], []);
    assert.deepEqual(rebuilt.runnerLines, ['System: Run abandoned']);
  });

  it('splits stored summaries into errors and notes', () => {
    assert.deepEqual(splitRunSummary(null), { errors: [], notes: [] });
    assert.deepEqual(
      splitRunSummary('2 records rejected: a.example.com (missing_evidence:growth_signals)\nRunner: timeout\nNote: skipped b.example.com\nSystem: abandoned'),
      {
        errors: ['2 records rejected: a.example.com (missing_evidence:growth_signals)', 'timeout', 'abandoned'],
        notes: ['skipped b.example.com'],
      },
    );
  });

  it('appends a summary line once', () => {
    assert.equal(appendSummaryLine(null, 'System: x'), 'System: x');
    assert.equal(appendSummaryLine('Note: a', 'System: x'), 'Note: a\nSystem: x');
    assert.equal(appendSummaryLine('Note: a\nSystem: x', 'System: x'), 'Note: a\nSystem: x');
  });
});
