// Run with: pnpm exec tsx --test lib/prospects/ingest-schema.test.ts
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  FIXTURE_BATCH,
  FIXTURE_FULLY_RATED,
  FIXTURE_RUN_ID,
} from './fixtures/ingest-batch.fixture';
import {
  INGEST_MAX_BODY_CHARS,
  INGEST_MAX_EVIDENCE_PER_PROSPECT,
  INGEST_MAX_PROSPECTS,
  parseIngestBody,
} from './ingest-schema';

function body(value: unknown): string {
  return JSON.stringify(value);
}

function expectInvalid(value: unknown, status: 400 | 413 = 400): void {
  const result = parseIngestBody(typeof value === 'string' ? value : body(value));
  assert.equal(result.ok, false);
  assert.equal(result.ok ? null : result.status, status);
}

describe('parseIngestBody', () => {
  it('accepts the fixture batch', () => {
    const result = parseIngestBody(body(FIXTURE_BATCH));
    assert.equal(result.ok, true);
    assert.equal(result.ok ? result.batch.prospects.length : 0, 4);
  });

  it('rejects malformed JSON', () => {
    expectInvalid('{"runId":');
  });

  it('rejects oversized bodies before parsing', () => {
    expectInvalid('x'.repeat(INGEST_MAX_BODY_CHARS + 1), 413);
  });

  it('rejects unknown fields at every level', () => {
    expectInvalid({ ...FIXTURE_BATCH, extra: true });
    expectInvalid({ ...FIXTURE_BATCH, prospects: [{ ...FIXTURE_FULLY_RATED, email: 'someone@example.com' }] });
    expectInvalid({
      ...FIXTURE_BATCH,
      prospects: [{
        ...FIXTURE_FULLY_RATED,
        evidence: [{ ...FIXTURE_FULLY_RATED.evidence[0], confidence: 'high' }],
      }],
    });
  });

  it('rejects caller-supplied scores and confidence', () => {
    expectInvalid({ ...FIXTURE_BATCH, prospects: [{ ...FIXTURE_FULLY_RATED, fitScore: 100 }] });
    expectInvalid({ ...FIXTURE_BATCH, prospects: [{ ...FIXTURE_FULLY_RATED, confidence: 'high' }] });
  });

  it('rejects unknown rating values and unknown or missing factors', () => {
    expectInvalid({ ...FIXTURE_BATCH, prospects: [{ ...FIXTURE_FULLY_RATED, ratings: { ...FIXTURE_FULLY_RATED.ratings, growth_signals: 'excellent' } }] });
    expectInvalid({ ...FIXTURE_BATCH, prospects: [{ ...FIXTURE_FULLY_RATED, ratings: { ...FIXTURE_FULLY_RATED.ratings, made_up_factor: 'strong' } }] });
    const { growth_signals: _omitted, ...missingOne } = FIXTURE_FULLY_RATED.ratings;
    void _omitted;
    expectInvalid({ ...FIXTURE_BATCH, prospects: [{ ...FIXTURE_FULLY_RATED, ratings: missingOne }] });
  });

  it('rejects evidence with a bad kind, url, factor or date', () => {
    const base = FIXTURE_FULLY_RATED.evidence[0];
    const variants = [
      { ...base, kind: 'rumour' },
      { ...base, sourceUrl: 'javascript:alert(1)' },
      { ...base, sourceUrl: 'not a url' },
      { ...base, factor: 'made_up_factor' },
      { ...base, observedAt: 'yesterday' },
      { ...base, claim: '' },
    ];
    for (const evidence of variants) {
      expectInvalid({ ...FIXTURE_BATCH, prospects: [{ ...FIXTURE_FULLY_RATED, evidence: [evidence] }] });
    }
  });

  it('rejects a non-uuid run id', () => {
    expectInvalid({ ...FIXTURE_BATCH, runId: 'run-1' });
    expectInvalid({ ...FIXTURE_BATCH, runId: undefined });
  });

  it('caps batch size and evidence per prospect', () => {
    const tooMany = Array.from({ length: INGEST_MAX_PROSPECTS + 1 }, () => FIXTURE_FULLY_RATED);
    expectInvalid({ runId: FIXTURE_RUN_ID, prospects: tooMany });

    const evidence = Array.from(
      { length: INGEST_MAX_EVIDENCE_PER_PROSPECT + 1 },
      () => FIXTURE_FULLY_RATED.evidence[0],
    );
    expectInvalid({ runId: FIXTURE_RUN_ID, prospects: [{ ...FIXTURE_FULLY_RATED, evidence }] });

    const atCap = Array.from({ length: INGEST_MAX_PROSPECTS }, () => FIXTURE_FULLY_RATED);
    assert.equal(parseIngestBody(body({ runId: FIXTURE_RUN_ID, prospects: atCap })).ok, true);
  });

  it('accepts an empty finishing batch', () => {
    const result = parseIngestBody(body({ runId: FIXTURE_RUN_ID, prospects: [], finish: 'completed' }));
    assert.equal(result.ok, true);
  });

  it('rejects an unknown finish value', () => {
    expectInvalid({ runId: FIXTURE_RUN_ID, prospects: [], finish: 'done' });
  });
});
