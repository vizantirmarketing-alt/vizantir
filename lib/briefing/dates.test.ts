// Run with: pnpm exec tsx --test lib/briefing/dates.test.ts
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  BRIEFING_TIME_ZONE,
  isBriefingDue,
  localAgeDays,
  localDateString,
  localDaysBetween,
  localHour,
} from './dates';

describe('briefing local dates', () => {
  it('uses America/Los_Angeles', () => {
    assert.equal(BRIEFING_TIME_ZONE, 'America/Los_Angeles');
  });

  it('keeps an evening in Las Vegas on the same local date', () => {
    // 7:30 PM PST on Nov 9 is 03:30 UTC on Nov 10.
    assert.equal(localDateString(new Date('2026-11-10T03:30:00Z')), '2026-11-09');
  });

  it('rolls the date at local midnight on the day daylight saving ends', () => {
    // Nov 1 2026: midnight PDT is 07:00 UTC; clocks fall back at 09:00 UTC.
    assert.equal(localDateString(new Date('2026-11-01T06:59:00Z')), '2026-10-31');
    assert.equal(localDateString(new Date('2026-11-01T07:00:00Z')), '2026-11-01');
    // 23:30 PST on Nov 1 is 07:30 UTC on Nov 2.
    assert.equal(localDateString(new Date('2026-11-02T07:30:00Z')), '2026-11-01');
    assert.equal(localDateString(new Date('2026-11-02T08:00:00Z')), '2026-11-02');
  });

  it('treats 7:00 local as due in both standard and daylight time', () => {
    // Daylight time (UTC-7): 14:00 UTC is 7:00 local.
    assert.equal(localHour(new Date('2026-07-15T14:00:00Z')), 7);
    assert.equal(isBriefingDue(new Date('2026-07-15T13:59:00Z')), false);
    assert.equal(isBriefingDue(new Date('2026-07-15T14:00:00Z')), true);
    // Standard time (UTC-8): 14:00 UTC is 6:00 local, 15:00 UTC is 7:00.
    assert.equal(isBriefingDue(new Date('2026-12-15T14:00:00Z')), false);
    assert.equal(isBriefingDue(new Date('2026-12-15T15:00:00Z')), true);
    // The morning daylight saving starts (Mar 8 2026), 14:00 UTC is 7:00 PDT.
    assert.equal(localHour(new Date('2026-03-08T14:00:00Z')), 7);
    // The morning it ends (Nov 1 2026), 14:00 UTC is 6:00 PST.
    assert.equal(isBriefingDue(new Date('2026-11-01T14:00:00Z')), false);
    assert.equal(isBriefingDue(new Date('2026-11-01T15:00:00Z')), true);
  });

  it('counts calendar days across daylight saving changes', () => {
    assert.equal(localDaysBetween('2026-10-31', '2026-11-02'), 2);
    assert.equal(localDaysBetween('2026-03-07', '2026-03-09'), 2);
    assert.equal(localDaysBetween('2026-11-10', '2026-11-10'), 0);
    assert.equal(localDaysBetween('2026-12-31', '2027-01-01'), 1);
  });

  it('computes local age in days', () => {
    const now = new Date('2026-11-10T16:00:00Z'); // Nov 10, 8:00 AM PST
    assert.equal(localAgeDays('2026-11-07T18:00:00Z', now), 3);
    assert.equal(localAgeDays('2026-11-10T03:30:00Z', now), 1); // evening of Nov 9 local
    assert.equal(localAgeDays('not a date', now), null);
  });
});
