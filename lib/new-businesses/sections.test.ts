// Run with: pnpm exec tsx --test lib/new-businesses/sections.test.ts
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { categoriesStatus, checksStatus, importsStatus } from './sections'

describe('collapsed section statuses', () => {
  it('categories: how many are on', () => {
    assert.equal(categoriesStatus([{ enabled: true }, { enabled: false }, { enabled: true }]), '2 of 3 categories on')
    assert.equal(categoriesStatus(null), 'Unable to load categories')
  })

  it('imports: the newest imported period', () => {
    assert.equal(
      importsStatus([
        { period: { year: 2026, month: 11 }, state: 'failed' },
        { period: { year: 2026, month: 10 }, state: 'imported' },
      ]),
      'Latest import: October 2026',
    )
    assert.equal(importsStatus([]), 'Nothing imported yet')
  })

  it('website checks: the latest run', () => {
    const run = { state: 'completed', businessCount: 30, checked: 30, requestedAt: '2026-11-14T15:00:00Z', claimedAt: '2026-11-14T16:00:00Z', finishedAt: '2026-11-14T18:00:00Z' }
    assert.equal(checksStatus([run]), 'Latest check: 30 of 30, Nov 14')
    assert.equal(checksStatus([{ ...run, state: 'requested', businessCount: 0, checked: 0, claimedAt: null, finishedAt: null }]), 'Latest check: waiting for the research runner, Nov 14')
    assert.equal(checksStatus([]), 'No website checks yet')
  })
})
