// Run with: pnpm exec tsx --test lib/prospects/params.test.ts
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  PROSPECT_DISPLAY_TIME_ZONE,
  formatProspectTimestamp,
  formatShortDate,
} from './params';

describe('prospect date display', () => {
  it('uses Los Angeles time', () => {
    assert.equal(PROSPECT_DISPLAY_TIME_ZONE, 'America/Los_Angeles');
  });

  it('keeps an evening Las Vegas request on the same calendar day', () => {
    // 7:30 PM PST on Nov 9 is 03:30 UTC on Nov 10.
    assert.equal(formatShortDate('2026-11-10T03:30:00.000Z'), 'Nov 9, 2026');
  });

  it('rolls over at Los Angeles midnight, not UTC midnight', () => {
    assert.equal(formatShortDate('2026-11-10T07:59:00.000Z'), 'Nov 9, 2026');
    assert.equal(formatShortDate('2026-11-10T08:00:00.000Z'), 'Nov 10, 2026');
  });

  it('follows daylight saving time', () => {
    // 11:30 PM PDT on Jul 4 is 06:30 UTC on Jul 5.
    assert.equal(formatShortDate('2026-07-05T06:30:00.000Z'), 'Jul 4, 2026');
  });

  it('formats full timestamps in Los Angeles time with the zone name', () => {
    const formatted = formatProspectTimestamp('2026-11-10T03:30:00.000Z');
    assert.match(formatted, /^November 9, 2026/);
    assert.match(formatted, /7:30\sPM/);
    assert.match(formatted, /PST$/);
  });

  it('renders a dash for missing or invalid dates', () => {
    assert.equal(formatShortDate(null), '—');
    assert.equal(formatShortDate('not a date'), '—');
    assert.equal(formatProspectTimestamp(null), '—');
  });
});
