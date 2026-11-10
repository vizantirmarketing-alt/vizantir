// Run with: pnpm exec tsx --test lib/prospects/params.test.ts
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  DEFAULT_PROSPECT_SORT,
  PROSPECT_DISPLAY_TIME_ZONE,
  comparePriority,
  formatSavedOfRequested,
  parseProspectsListParams,
  priorityScore,
  prospectsListHref,
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

describe('priority sort', () => {
  it('weights fit 60 percent and opportunity 40 percent', () => {
    assert.equal(priorityScore(80, 50), 68);
    assert.equal(priorityScore(100, 0), 60);
    assert.equal(priorityScore(0, 100), 40);
  });

  it('is null when either score is missing', () => {
    assert.equal(priorityScore(null, 50), null);
    assert.equal(priorityScore(80, null), null);
  });

  it('orders highest priority first, missing scores last, then by name', () => {
    const rows = [
      { name: 'Missing fit', fitScore: null, opportunityScore: 90 },
      { name: 'Low', fitScore: 50, opportunityScore: 20 },
      { name: 'High', fitScore: 88, opportunityScore: 58 },
      { name: 'Missing opportunity', fitScore: 99, opportunityScore: null },
      { name: 'Also high', fitScore: 88, opportunityScore: 58 },
    ];
    assert.deepEqual(
      [...rows].sort(comparePriority).map((row) => row.name),
      ['Also high', 'High', 'Low', 'Missing fit', 'Missing opportunity'],
    );
  });

  it('is the default sort and is omitted from the URL', () => {
    const params = parseProspectsListParams({});
    assert.equal(params.sort, 'priority');
    assert.equal(DEFAULT_PROSPECT_SORT, 'priority');
    assert.equal(prospectsListHref(params), '/intel/prospects');
    assert.equal(prospectsListHref({ ...params, sort: 'fit' }), '/intel/prospects?sort=fit');
    assert.equal(parseProspectsListParams({ sort: 'fit' }).sort, 'fit');
    assert.equal(parseProspectsListParams({ sort: 'bogus' }).sort, 'priority');
  });
});

describe('saved against requested', () => {
  it('formats saved of requested', () => {
    assert.equal(formatSavedOfRequested(7, 10), '7 of 10');
    assert.equal(formatSavedOfRequested(0, 5), '0 of 5');
    assert.equal(formatSavedOfRequested(3, null), '3');
  });
});
