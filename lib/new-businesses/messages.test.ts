// Run with: pnpm exec tsx --test lib/new-businesses/messages.test.ts
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { ImportCounts } from './import';
import { importResultMessage, importSummaryLine } from './messages';

const OCTOBER = { year: 2026, month: 10 };
const counts = (rowsStored: number, rowsTotal = 735): ImportCounts => ({
  rowsTotal,
  rowsStored,
  rowsDiscarded: rowsTotal - rowsStored,
  rowsInserted: rowsStored,
  unparsedLines: 0,
});

describe('importResultMessage', () => {
  it('confirms a re-import without repeating the counts', () => {
    const result = importResultMessage({ outcome: 'imported', period: OCTOBER, counts: counts(677) }, 'reimport');
    assert.deepEqual(result, { ok: true, message: 'October 2026 updated.' });
    assert.ok(!/\d{2,}/.test(result.ok ? result.message.replace('2026', '') : ''), 'no counts in the message');
  });

  it('confirms an import without repeating the counts', () => {
    assert.deepEqual(importResultMessage({ outcome: 'imported', period: OCTOBER, counts: counts(310) }), {
      ok: true,
      message: 'October 2026 imported.',
    });
  });

  it('explains, without numbers, when nothing was kept because the categories are off', () => {
    assert.deepEqual(importResultMessage({ outcome: 'imported', period: OCTOBER, counts: counts(0) }), {
      ok: true,
      message: 'October 2026 imported. Nothing was kept because their categories are off.',
    });
    assert.deepEqual(importResultMessage({ outcome: 'imported', period: OCTOBER, counts: counts(0) }, 'reimport'), {
      ok: true,
      message: 'October 2026 updated. Nothing was kept because their categories are off.',
    });
  });

  it('keeps errors as errors and the other outcomes plain', () => {
    assert.deepEqual(importResultMessage({ outcome: 'failed', period: OCTOBER, error: 'HTTP 503' }, 'reimport'), {
      ok: false,
      error: 'October 2026 failed: HTTP 503',
    });
    assert.deepEqual(importResultMessage({ outcome: 'failed', period: null, error: 'Listing page: timeout' }), {
      ok: false,
      error: 'Listing page: timeout',
    });
    assert.deepEqual(importResultMessage({ outcome: 'up_to_date', period: OCTOBER }), {
      ok: true,
      message: 'Up to date. The newest list is October 2026.',
    });
    assert.deepEqual(importResultMessage({ outcome: 'skipped_today' }), { ok: true, message: 'Already checked today.' });
  });
});

describe('importSummaryLine', () => {
  it('is the one place the counts appear, and calls rows not kept "skipped"', () => {
    const line = importSummaryLine({ rowsTotal: 735, rowsStored: 677, rowsDiscarded: 58, unparsedLines: 0 });
    assert.equal(line, '735 read · 677 kept · 58 skipped');
    assert.ok(!/discard/i.test(line));
  });

  it('adds unreadable lines only when there are some', () => {
    assert.equal(
      importSummaryLine({ rowsTotal: 10, rowsStored: 4, rowsDiscarded: 6, unparsedLines: 2 }),
      '10 read · 4 kept · 6 skipped · 2 unreadable',
    );
  });

  it('never says "discarded" in any result message', () => {
    for (const stored of [0, 310, 735]) {
      for (const action of ['import', 'reimport'] as const) {
        const result = importResultMessage({ outcome: 'imported', period: OCTOBER, counts: counts(stored) }, action);
        assert.ok(result.ok && !/discard/i.test(result.message));
      }
    }
  });
});
