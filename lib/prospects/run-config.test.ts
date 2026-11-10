// Run with: pnpm exec tsx --test lib/prospects/run-config.test.ts
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { RUN_EXCLUSIONS_MAX, RUN_TARGET_COUNT_MAX } from './params';
import { parseRunExclusions, readRunConfig, runRequestSchema } from './run-config';

describe('runRequestSchema', () => {
  it('accepts a valid request and coerces the count', () => {
    const result = runRequestSchema.safeParse({ market: ' Fixture City ', industry: 'Dentists', targetCount: '12' });
    assert.equal(result.success, true);
    assert.equal(result.success ? result.data.targetCount : null, 12);
    assert.equal(result.success ? result.data.market : null, 'Fixture City');
  });

  it('rejects blank fields and out-of-range counts', () => {
    assert.equal(runRequestSchema.safeParse({ market: ' ', industry: 'x', targetCount: 5 }).success, false);
    assert.equal(runRequestSchema.safeParse({ market: 'x', industry: 'x', targetCount: 0 }).success, false);
    assert.equal(runRequestSchema.safeParse({ market: 'x', industry: 'x', targetCount: RUN_TARGET_COUNT_MAX + 1 }).success, false);
    assert.equal(runRequestSchema.safeParse({ market: 'x', industry: 'x', targetCount: 2.5 }).success, false);
  });
});

describe('parseRunExclusions', () => {
  it('splits, normalizes and de-duplicates domains', () => {
    assert.deepEqual(
      parseRunExclusions('https://www.example.com/\nexample.com, shop.example.org  example.net'),
      { ok: true, domains: ['example.com', 'shop.example.org', 'example.net'] },
    );
    assert.deepEqual(parseRunExclusions(''), { ok: true, domains: [] });
    assert.deepEqual(parseRunExclusions(undefined), { ok: true, domains: [] });
  });

  it('rejects invalid entries and too many domains', () => {
    assert.equal(parseRunExclusions('example.com localhost').ok, false);
    const many = Array.from({ length: RUN_EXCLUSIONS_MAX + 1 }, (_, index) => `site${index}.example.com`).join('\n');
    assert.equal(parseRunExclusions(many).ok, false);
  });
});

describe('readRunConfig', () => {
  it('reads stored config and defaults missing exclusions', () => {
    assert.deepEqual(readRunConfig({ market: 'm', industry: 'i', targetCount: 3 }), {
      market: 'm',
      industry: 'i',
      targetCount: 3,
      exclusions: [],
    });
    assert.equal(readRunConfig({ market: 'm' }), null);
    assert.equal(readRunConfig(null), null);
  });
});
