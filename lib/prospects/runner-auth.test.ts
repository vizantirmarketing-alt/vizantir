// Run with: pnpm exec tsx --test lib/prospects/runner-auth.test.ts
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { authorizeRunner, bearerMatches } from './runner-auth';

const TOKEN = 'test-prospect-token-not-a-real-secret';
const CRON = 'test-cron-secret-not-a-real-secret';

describe('authorizeRunner', () => {
  it('accepts the exact bearer token', () => {
    assert.deepEqual(
      authorizeRunner(`Bearer ${TOKEN}`, { token: TOKEN, cronSecret: CRON }),
      { ok: true },
    );
  });

  it('returns 503 when the token is unset or blank', () => {
    for (const token of [undefined, '', '   ']) {
      const result = authorizeRunner(`Bearer ${TOKEN}`, { token, cronSecret: CRON });
      assert.equal(result.ok, false);
      assert.equal(result.ok ? null : result.status, 503);
    }
  });

  it('returns 503 when the token is configured equal to CRON_SECRET', () => {
    const result = authorizeRunner(`Bearer ${CRON}`, { token: CRON, cronSecret: CRON });
    assert.equal(result.ok ? null : result.status, 503);
  });

  it('rejects a missing, wrong, or malformed header with 401', () => {
    const env = { token: TOKEN, cronSecret: CRON };
    const headers = [
      null,
      '',
      TOKEN,
      `bearer ${TOKEN}`,
      `Bearer ${TOKEN} `,
      `Bearer ${TOKEN}x`,
      `Bearer ${CRON}`,
      'Bearer ',
    ];
    for (const header of headers) {
      const result = authorizeRunner(header, env);
      assert.equal(result.ok ? null : result.status, 401, `header: ${String(header)}`);
    }
  });

  it('does not accept CRON_SECRET in place of the ingest token', () => {
    const result = authorizeRunner(`Bearer ${CRON}`, { token: TOKEN, cronSecret: CRON });
    assert.equal(result.ok, false);
  });
});

describe('bearerMatches', () => {
  it('compares full header values of different lengths without throwing', () => {
    assert.equal(bearerMatches('Bearer short', TOKEN), false);
    assert.equal(bearerMatches(`Bearer ${TOKEN}${'x'.repeat(500)}`, TOKEN), false);
    assert.equal(bearerMatches(`Bearer ${TOKEN}`, TOKEN), true);
  });
});
