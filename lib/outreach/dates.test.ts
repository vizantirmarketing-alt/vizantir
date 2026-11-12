// Run with: pnpm exec tsx --test lib/outreach/dates.test.ts
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { localDayStartIso } from './dates'

describe('localDayStartIso', () => {
  it('standard time: midnight Pacific is 08:00 UTC', () => {
    assert.equal(localDayStartIso(new Date('2026-11-11T18:00:00.000Z')), '2026-11-11T08:00:00.000Z')
    // 23:30 local on the 10th is still the 10th.
    assert.equal(localDayStartIso(new Date('2026-11-11T07:30:00.000Z')), '2026-11-10T08:00:00.000Z')
  })

  it('daylight time: midnight Pacific is 07:00 UTC', () => {
    assert.equal(localDayStartIso(new Date('2026-07-04T20:00:00.000Z')), '2026-07-04T07:00:00.000Z')
  })

  it('on the day clocks fall back, the day started in daylight time', () => {
    // 2026-11-01: 01:59 PDT becomes 01:00 PST. Noon local is 20:00 UTC.
    assert.equal(localDayStartIso(new Date('2026-11-01T20:00:00.000Z')), '2026-11-01T07:00:00.000Z')
  })

  it('on the day clocks spring forward, the day started in standard time', () => {
    // 2026-03-08: 02:00 PST becomes 03:00 PDT. Noon local is 19:00 UTC.
    assert.equal(localDayStartIso(new Date('2026-03-08T19:00:00.000Z')), '2026-03-08T08:00:00.000Z')
  })
})
