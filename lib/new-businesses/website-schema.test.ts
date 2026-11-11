// Run with: pnpm exec tsx --test lib/new-businesses/website-schema.test.ts
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { CHECK_INGEST_MAX_BODY_CHARS, parseCheckBody } from './website-schema';

const RUN = '00000000-0000-4000-8000-000000000009';
const ID = '00000000-0000-4000-8000-000000000001';

function business(overrides: Record<string, unknown> = {}) {
  return { id: ID, searches: ['"Example Bakery" Las Vegas'], candidates: [], placeholder: false, outcome_claimed: 'none_found', ...overrides };
}
function candidate(overrides: Record<string, unknown> = {}) {
  return {
    url: 'https://www.example-bakery.test/',
    kind_claimed: 'own_site',
    excerpt: 'Example Bakery on Example St.',
    identity_match: { name: true, street_address: true, phone: false, city: true, business_type: false },
    ...overrides,
  };
}
const body = (value: unknown) => JSON.stringify(value);

describe('parseCheckBody', () => {
  it('accepts a well-formed batch', () => {
    const result = parseCheckBody(body({ runId: RUN, businesses: [business({ candidates: [candidate()] })], finish: 'completed', runNotes: ['Skipped one business: blocked.'] }));
    assert.equal(result.ok, true);
  });

  it('rejects oversized bodies before parsing, and invalid JSON', () => {
    const big = parseCheckBody('x'.repeat(CHECK_INGEST_MAX_BODY_CHARS + 1));
    assert.ok(!big.ok && big.status === 413);
    const junk = parseCheckBody('{not json');
    assert.ok(!junk.ok && junk.status === 400 && junk.error === 'Invalid JSON');
  });

  it('rejects unknown keys anywhere, including a status, score or tier', () => {
    for (const bad of [
      { runId: RUN, businesses: [], status: 'no_website' },
      { runId: RUN, businesses: [business({ website_status: 'no_website' })] },
      { runId: RUN, businesses: [business({ score: 90 })] },
      { runId: RUN, businesses: [business({ candidates: [candidate({ tier: 'likely' })] })] },
      { runId: RUN, businesses: [business({ candidates: [candidate({ identity_match: { name: true, street_address: true, phone: false, city: true, business_type: false, owner: true } })] })] },
    ]) {
      const result = parseCheckBody(body(bad));
      assert.ok(!result.ok && result.status === 400, JSON.stringify(bad));
    }
  });

  it('enforces the caps: 40 businesses, 6 candidates, 1 to 3 searches', () => {
    assert.ok(!parseCheckBody(body({ runId: RUN, businesses: Array.from({ length: 41 }, () => business()) })).ok);
    assert.ok(!parseCheckBody(body({ runId: RUN, businesses: [business({ candidates: Array.from({ length: 7 }, () => candidate()) })] })).ok);
    assert.ok(!parseCheckBody(body({ runId: RUN, businesses: [business({ searches: [] })] })).ok);
    assert.ok(!parseCheckBody(body({ runId: RUN, businesses: [business({ searches: ['a', 'b', 'c', 'd'] })] })).ok);
    assert.ok(parseCheckBody(body({ runId: RUN, businesses: Array.from({ length: 40 }, () => business()) })).ok);
  });

  it('accepts only http and https URLs', () => {
    for (const url of ['javascript:alert(1)', 'ftp://example.test/', 'data:text/html,hi', 'example.test', 'https://user:pass@example.test/']) {
      assert.ok(!parseCheckBody(body({ runId: RUN, businesses: [business({ candidates: [candidate({ url })] })] })).ok, url);
    }
    assert.ok(parseCheckBody(body({ runId: RUN, businesses: [business({ candidates: [candidate({ url: 'http://example.test/' })] })] })).ok);
  });

  it('limits excerpts to under 25 words and bounds string lengths', () => {
    const long = Array.from({ length: 25 }, (_, i) => `w${i}`).join(' ');
    assert.ok(!parseCheckBody(body({ runId: RUN, businesses: [business({ candidates: [candidate({ excerpt: long })] })] })).ok);
    assert.ok(!parseCheckBody(body({ runId: RUN, businesses: [business({ searches: ['x'.repeat(301)] })] })).ok);
    assert.ok(!parseCheckBody(body({ runId: RUN, businesses: [business({ note: 'x'.repeat(301) })] })).ok);
  });

  it('rejects non-uuid ids and unknown enum values', () => {
    assert.ok(!parseCheckBody(body({ runId: 'run-1', businesses: [] })).ok);
    assert.ok(!parseCheckBody(body({ runId: RUN, businesses: [business({ id: 'row-1' })] })).ok);
    assert.ok(!parseCheckBody(body({ runId: RUN, businesses: [business({ outcome_claimed: 'definitely' })] })).ok);
    assert.ok(!parseCheckBody(body({ runId: RUN, businesses: [], finish: 'partial' })).ok);
  });
});

describe('businesses submitted without searching', () => {
  const unsearched = { searches: [], candidates: [], outcome_claimed: 'unclear', note: "Licensed under a person's name; not searched." };

  it('accepts zero searches when the outcome is unclear, there are no candidates, and a note says why', () => {
    assert.ok(parseCheckBody(body({ runId: RUN, businesses: [business(unsearched)] })).ok);
  });

  it('rejects every other zero-search submission', () => {
    for (const bad of [
      { ...unsearched, outcome_claimed: 'none_found' },
      { ...unsearched, outcome_claimed: 'found' },
      { ...unsearched, note: undefined },
      { ...unsearched, note: '   ' },
      { ...unsearched, candidates: [candidate()] },
    ]) {
      const result = parseCheckBody(body({ runId: RUN, businesses: [business(bad)] }));
      assert.ok(!result.ok && result.status === 400, JSON.stringify(bad));
    }
  });
});
