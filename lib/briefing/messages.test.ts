// Run with: pnpm exec tsx --test lib/briefing/messages.test.ts
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { briefingFailedMessage, summaryUnavailableMessage } from './messages';

const CODES = [
  null,
  'model_not_configured',
  'model_call_failed',
  'model_call_failed (HTTP 529)',
  'model_output_empty',
  'model_output_truncated',
  'invalid_output: not JSON',
  'invalid_output: unknown recordId abc',
  'all_sources_unavailable',
  'something_new_and_unexpected',
];

describe('fallback wording', () => {
  it('explains a missing summary in a plain sentence with no internal codes', () => {
    for (const code of CODES) {
      const message = summaryUnavailableMessage(code);
      assert.match(message, /^There is no summary/, String(code));
      assert.ok(message.endsWith('.'), String(code));
      assert.ok(!/[a-z]+_[a-z]+/.test(message), `internal code in: ${message}`);
      assert.ok(!message.includes('HTTP'), message);
      if (code !== null) assert.ok(!message.includes(code), message);
    }
  });

  it('gives different reasons for setup, call and output problems', () => {
    assert.match(summaryUnavailableMessage('model_not_configured'), /not set up/);
    assert.match(summaryUnavailableMessage('model_call_failed (HTTP 500)'), /did not respond/);
    assert.match(summaryUnavailableMessage('invalid_output: not JSON'), /could not be used/);
  });

  it('explains a failed briefing plainly', () => {
    for (const code of CODES) {
      const message = briefingFailedMessage(code);
      assert.ok(!/[a-z]+_[a-z]+/.test(message), message);
    }
    assert.match(briefingFailedMessage('all_sources_unavailable'), /could not load any of its data/);
  });
});
