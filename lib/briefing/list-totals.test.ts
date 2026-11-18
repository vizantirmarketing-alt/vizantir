// Run with: NODE_OPTIONS=--conditions=react-server pnpm exec tsx --test lib/briefing/list-totals.test.ts
// The briefing's writer gets the true total beside the rows shown for every
// truncated list, and performance ratings computed in code. No network or
// database. Fictional data only.
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { assembleBriefingContent, type RawBriefingInputs, type RawUnreviewedProspect } from './context'
import { readBriefingContent } from './content-schema'
import { FIXTURE_NOW, FIXTURE_WINDOWS, fixtureInputs } from './fixtures/briefing-inputs.fixture'
import { BRIEFING_SYSTEM_PROMPT, buildUserMessage } from './narrative'
import { lcpRating, mobileScoreRating, performanceRatings } from './performance-rating'

function assemble(inputs: RawBriefingInputs) {
  return assembleBriefingContent(inputs, { now: FIXTURE_NOW, windows: FIXTURE_WINDOWS })
}

function sent(inputs: RawBriefingInputs) {
  return JSON.parse(buildUserMessage(assemble(inputs)))
}

function unreviewed(n: number): RawUnreviewedProspect {
  return { id: `50000000-0000-4000-8000-${n.toString().padStart(12, '0')}`, name: `Fictional Unreviewed ${n}`, domain: `u${n}.example.org`, fitScore: 60, opportunityScore: 60 }
}

// 48 open findings with 7 loaded, 30 unreviewed prospects with 25 loaded: the shapes seen on Nov 17.
function truncatedInputs(): RawBriefingInputs {
  const base = fixtureInputs()
  return {
    ...base,
    topUnreviewed: { ok: true, value: Array.from({ length: 25 }, (_, i) => unreviewed(i + 1)) },
    unreviewedTotal: { ok: true, value: 30 },
    findings: base.findings.ok ? { ok: true, value: { ...base.findings.value, total: 48 } } : base.findings,
  }
}

describe('list totals: every truncated list carries shown and total', () => {
  it('findings: 5 listed of 48 open', () => {
    const { findings } = sent(truncatedInputs())
    assert.equal(findings.total, 48)
    assert.equal(findings.listedCount, 5)
    assert.equal(findings.listed.length, 5)
  })

  it('unreviewed prospects: 5 listed of 30, and the total is stored', () => {
    const content = assemble(truncatedInputs())
    assert.equal(content.topUnreviewed.length, 5)
    assert.equal(content.topUnreviewedTotal, 30)
    const message = sent(truncatedInputs())
    assert.deepEqual([message.unreviewedProspects.total, message.unreviewedProspects.listedCount], [30, 5])
    // The bare list is no longer sent under its old name.
    assert.equal('topUnreviewed' in message, false)
  })

  it('unreviewed prospects: an unknown total is sent as null, never as the listed count', () => {
    const inputs = { ...truncatedInputs(), unreviewedTotal: { ok: false } as const }
    const message = sent(inputs)
    assert.equal(message.unreviewedProspects.total, null)
    assert.equal(message.unreviewedProspects.listedCount, 5)
    assert.equal(assemble(inputs).topUnreviewedTotal, undefined)
  })

  it('new prospects: listed and total, labelled apart', () => {
    const base = fixtureInputs()
    assert.ok(base.newProspects.ok)
    const inputs: RawBriefingInputs = { ...base, newProspects: { ok: true, value: { ...base.newProspects.value, total: 64 } } }
    const { newProspects } = sent(inputs)
    assert.equal(newProspects.total, 64)
    assert.equal(newProspects.listedCount, base.newProspects.value.rows.length)
    assert.equal('newProspectsTotal' in sent(inputs), false)
  })

  it('inquiries: the recent total beside the number listed', () => {
    const { inquiries } = sent(fixtureInputs())
    assert.equal(inquiries.recentNew, 6)
    assert.equal(inquiries.listedCount, 5)
    assert.equal(inquiries.recent.length, 5)
  })
})

describe('performance ratings', () => {
  it('mobile score at each band edge', () => {
    assert.equal(mobileScoreRating(100), 'good')
    assert.equal(mobileScoreRating(90), 'good')
    assert.equal(mobileScoreRating(89), 'needs improvement')
    assert.equal(mobileScoreRating(50), 'needs improvement')
    assert.equal(mobileScoreRating(49), 'poor')
    assert.equal(mobileScoreRating(0), 'poor')
  })

  it('LCP at each band edge', () => {
    assert.equal(lcpRating(2500), 'good')
    assert.equal(lcpRating(2501), 'needs improvement')
    assert.equal(lcpRating(4000), 'needs improvement')
    assert.equal(lcpRating(4001), 'poor')
  })

  it('the Nov 17 prospect: 73/100 needs improvement, LCP 10.9 s poor', () => {
    assert.deepEqual(performanceRatings({ performanceScore: 73, lcpMs: 10_900 }), {
      mobileScore: 73,
      mobileScoreRating: 'needs improvement',
      lcpSeconds: 10.9,
      lcpRating: 'poor',
    })
  })

  it('a measured new prospect reaches the writer as rated numbers, not a free-text line', () => {
    const { newProspects } = sent(fixtureInputs())
    const measured = newProspects.listed.find((p: { performance: unknown }) => p.performance !== null)
    assert.deepEqual(measured.performance, { mobileScore: 33, mobileScoreRating: 'poor', lcpSeconds: 16.2, lcpRating: 'poor' })
    // The stored line the page shows is unchanged.
    assert.ok(assemble(fixtureInputs()).newProspects.some((p) => p.performance === 'Mobile performance 33/100, LCP 16.2 s'))
  })
})

describe('the prompt', () => {
  it('requires true totals and never the listed count as a total', () => {
    assert.match(BRIEFING_SYSTEM_PROMPT, /Any number of records you state must be a total/)
    assert.match(BRIEFING_SYSTEM_PROMPT, /"the top 5 of 48 unreviewed prospects"/)
    assert.match(BRIEFING_SYSTEM_PROMPT, /Never present listedCount as a total/)
    assert.match(BRIEFING_SYSTEM_PROMPT, /When total is null the true number is unknown: state no count for that list/)
  })

  it('limits performance wording to the supplied ratings or numbers, naming the metric', () => {
    assert.match(BRIEFING_SYSTEM_PROMPT, /Describe performance only with those supplied ratings or the raw numbers, and always name the metric/)
    assert.match(BRIEFING_SYSTEM_PROMPT, /such as severe/)
  })

  it('applies both rules to suggested actions', () => {
    assert.match(BRIEFING_SYSTEM_PROMPT, /These rules apply to the narrative and to every action text alike/)
  })
})

describe('stored briefings', () => {
  it('a briefing saved without the new fields still parses', () => {
    const old = JSON.parse(JSON.stringify(assemble(truncatedInputs())))
    delete old.topUnreviewedTotal
    for (const p of old.newProspects) delete p.performanceRatings
    const read = readBriefingContent(old)
    assert.ok(read !== null)
    assert.equal(read.topUnreviewedTotal, undefined)
    // And its message still builds, with an unknown unreviewed total.
    assert.equal(JSON.parse(buildUserMessage(read)).unreviewedProspects.total, null)
  })

  it('a new briefing reads back with its total and ratings', () => {
    const read = readBriefingContent(JSON.parse(JSON.stringify(assemble(truncatedInputs()))))
    assert.equal(read?.topUnreviewedTotal, 30)
    assert.ok(read?.newProspects.some((p) => p.performanceRatings?.lcpRating === 'poor'))
  })
})
