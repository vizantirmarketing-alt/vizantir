/**
 * Counts and comparisons for explain_score and compare_prospects, computed in
 * code so the model never tallies ratings or decides who leads. Pure.
 *
 *   - ratingCounts: per prospect and score, how many factors got each rating,
 *     by the rubric's own rating labels (Strong, Weak, None, Unknown)
 *   - comparison: for every factor and for fit, opportunity and priority,
 *     which prospect earned more, or that they are tied; and an overall line
 *     naming who leads on each of the three scores. No overall winner is ever
 *     computed beyond those three scores.
 *   - checkAbsoluteClaims: after the answer is written, refuses a narrow set
 *     of absolute phrases ("all four fit factors", "every dimension", "across
 *     the board") that the supplied counts do not make literally true.
 */

import { priorityScore } from '@/lib/prospects/params'
import { PROSPECT_RATING_LABELS, type ProspectRating, type ScoreBreakdown } from '@/lib/prospects/rubric'

export type ScoreKind = 'fit' | 'opportunity'

/** Priority as the Briefing page shows it (lib/briefing/context.ts roundedPriority): Math.round of 60% fit plus 40% opportunity. */
export function displayedPriority(fitScore: number | null, opportunityScore: number | null): number | null {
  const value = priorityScore(fitScore, opportunityScore)
  return value === null ? null : Math.round(value)
}

/** Rating labels in the rubric's order of strength, as the context labels each factor. */
export const RATING_LABELS_IN_ORDER: readonly string[] = (['strong', 'weak', 'none', 'unknown'] as const satisfies readonly ProspectRating[]).map(
  (rating) => PROSPECT_RATING_LABELS[rating],
)

export type RatingCounts = { factorCount: number; counts: Record<string, number> }

/** How many of a score's factors received each rating. */
export function ratingCounts(score: ScoreBreakdown): RatingCounts {
  const counts: Record<string, number> = Object.fromEntries(RATING_LABELS_IN_ORDER.map((label) => [label, 0]))
  for (const factor of score.factors) counts[PROSPECT_RATING_LABELS[factor.rating]] = (counts[PROSPECT_RATING_LABELS[factor.rating]] ?? 0) + 1
  return { factorCount: score.factors.length, counts }
}

/** "3 Strong, 0 Weak, 1 None, 0 Unknown, of 4 fit factors". */
export function ratingCountsLine(tally: RatingCounts, kind: ScoreKind): string {
  return `${RATING_LABELS_IN_ORDER.map((label) => `${tally.counts[label] ?? 0} ${label}`).join(', ')}, of ${tally.factorCount} ${kind} factors`
}


/* ---------- Comparing prospects ---------- */

export type ComparedProspect = {
  /** The name the context uses for this prospect (its name, with its domain when two share a name). */
  label: string
  fitScore: number | null
  opportunityScore: number | null
  fit: ScoreBreakdown
  opportunity: ScoreBreakdown
}

export const TIED = 'Tied'

/** Who has the most of a value: one label, "Tied" when all are equal, or "Tied between A and B". Null when any value is missing. */
export function leader(values: readonly { label: string; value: number | null }[]): string | null {
  if (values.some((entry) => entry.value === null)) return null
  const max = Math.max(...values.map((entry) => entry.value as number))
  const top = values.filter((entry) => entry.value === max)
  if (top.length === values.length) return TIED
  if (top.length === 1) return top[0]!.label
  return `Tied between ${joinAnd(top.map((entry) => entry.label))}`
}

function joinAnd(items: readonly string[]): string {
  if (items.length <= 2) return items.join(' and ')
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`
}

function roundPoints(points: number): number {
  return Math.round(points * 10) / 10
}

export const FIT_POINTS_MEANING = 'More fit points means the business is a better fit for the studio.'
export const OPPORTUNITY_POINTS_MEANING =
  'More opportunity points means more opportunity for the studio, which usually means a weaker result for the site itself. Leading on an opportunity factor means the site has more room to improve there, not that the site does better.'

function scoreLine(name: string, values: { label: string; value: number | null }[]): string {
  const lead = leader(values)
  const numbers = values.length === 2 ? `${values[0]!.value ?? 'no score'} to ${values[1]!.value ?? 'no score'}` : values.map((entry) => `${entry.label} ${entry.value ?? 'no score'}`).join(', ')
  if (lead === null) return `${name} cannot be compared because a score is missing (${numbers}).`
  if (lead === TIED) return `Tied on ${name} (${numbers}).`
  if (lead.startsWith('Tied between')) return `${lead} on ${name} (${numbers}).`
  return `${lead} leads on ${name} (${numbers}).`
}

export function buildComparison(prospects: readonly ComparedProspect[]) {
  const scores = (['fit', 'opportunity', 'priority'] as const).map((score) => {
    const values = prospects.map((p) => ({
      label: p.label,
      value: score === 'fit' ? p.fitScore : score === 'opportunity' ? p.opportunityScore : displayedPriority(p.fitScore, p.opportunityScore),
    }))
    return { score, values, leads: leader(values) ?? 'Not comparable: a score is missing', line: scoreLine(score, values) }
  })
  const factors = (kind: ScoreKind) =>
    prospects[0]![kind].factors.map((factor, index) => {
      const values = prospects.map((p) => ({ label: p.label, value: roundPoints(p[kind].factors[index]?.points ?? 0) }))
      return {
        factor: factor.label,
        maxPoints: factor.weight,
        pointsEarned: Object.fromEntries(values.map((entry) => [entry.label, entry.value])),
        leads: leader(values) ?? TIED,
      }
    })
  return {
    note: 'Computed in code from the stored scores and the points each factor earned. "leads" names the prospect with more points, or says Tied. State these exactly as given; do not recount or re-rank. No prospect is ahead overall beyond these three scores.',
    overall: scores.map((score) => score.line).join(' '),
    scores: scores.map(({ score, values, leads }) => ({ score, values: Object.fromEntries(values.map((entry) => [entry.label, entry.value])), leads })),
    fitFactors: { meaning: FIT_POINTS_MEANING, factors: factors('fit') },
    opportunityFactors: { meaning: OPPORTUNITY_POINTS_MEANING, factors: factors('opportunity') },
  }
}

/** Labels for compared prospects: the name, with the domain added when two share a name. */
export function comparedLabels(prospects: readonly { name: string; domain: string }[]): string[] {
  return prospects.map((p) => (prospects.filter((other) => other.name.trim().toLowerCase() === p.name.trim().toLowerCase()).length > 1 ? `${p.name} (${p.domain})` : p.name))
}

/* ---------- The absolute-claim check ---------- */

/** What the check knows: each prospect's counts, and (compare only) who leads on each factor and score. */
export type ClaimFacts = {
  prospects: { label: string; fit: RatingCounts; opportunity: RatingCounts }[]
  /** Compare only: the "leads" value of each fit and opportunity factor and of fit, opportunity and priority. */
  leads: { fit: string[]; opportunity: string[]; scores: string[] } | null
}

export function claimFactsFor(prospects: readonly ComparedProspect[], compare: boolean): ClaimFacts {
  let leads: ClaimFacts['leads'] = null
  if (compare) {
    const comparison = buildComparison(prospects)
    leads = {
      fit: comparison.fitFactors.factors.map((f) => f.leads),
      opportunity: comparison.opportunityFactors.factors.map((f) => f.leads),
      scores: comparison.scores.map((s) => s.leads),
    }
  }
  return { prospects: prospects.map((p) => ({ label: p.label, fit: ratingCounts(p.fit), opportunity: ratingCounts(p.opportunity) })), leads }
}

/** Whether one prospect (one named in the sentence, if any is) leads on everything in the list. */
function leadsOnAll(list: readonly string[], named: readonly string[]): boolean {
  const first = list[0]
  return first !== undefined && named.includes(first) && list.every((lead) => lead === first)
}

const NUMBER_WORDS: Record<string, number> = { two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, both: 2 }

/**
 * Absolute phrases about factors or dimensions:
 *   all | every | none of  [of] [the|its|their|both]  [count]  [measured|scored]  [fit|opportunity]  [rubric|scoring]  factor(s) | dimension(s)
 * and the fixed phrases below.
 */
const QUANTIFIED = /\b(all|every|none of)\s+(?:of\s+)?(?:(?:the|its|their|both|his|her)\s+)?(?:(two|three|four|five|six|seven|eight|\d)\s+)?(?:(?:measured|scored)\s+)?(?:(fit|opportunity)\s+)?(?:(?:rubric|scoring)\s+)?(factors?|dimensions?)\b/gi
const FIXED = /\b(across the board|in every respect|in all respects|on every front|by every measure|on all counts|on every count)\b/gi
const RATING_WORD = /\b(strong|weak|none|unknown)\b/gi
const LEAD_WORD = /\b(leads?|ahead|higher|better|outscores?|stronger|more promising|beats?|wins?)\b/i

export type AbsoluteClaim = { phrase: string; reason: string }

function sentences(text: string): string[] {
  return text.split(/(?<=[.!?])\s+|\n+/).filter((s) => s.trim().length > 0)
}

function ratingLabel(word: string): string {
  return word[0]!.toUpperCase() + word.slice(1).toLowerCase()
}

/**
 * The ratings a phrase is about: the rating word closest to it in the
 * sentence (other than the phrase's own "none"), together with any rating
 * joined to that word by "or" or "and" ("Weak or Unknown").
 */
function nearestRatings(sentence: string, start: number, end: number): string[] {
  const words = [...sentence.matchAll(RATING_WORD)].filter((m) => !((m.index ?? 0) >= start && (m.index ?? 0) < end))
  let best: { index: number; distance: number } | null = null
  words.forEach((m, index) => {
    const at = m.index ?? 0
    const distance = at < start ? start - (at + m[0].length) : at - end
    if (best === null || distance < best.distance) best = { index, distance }
  })
  if (best === null) return []
  const chosen = new Set([(best as { index: number }).index])
  const joined = (a: RegExpMatchArray, b: RegExpMatchArray) => /^\s*,?\s*(?:or|and)\s+$/i.test(sentence.slice((a.index ?? 0) + a[0].length, b.index ?? 0))
  for (let i = (best as { index: number }).index; i + 1 < words.length && joined(words[i]!, words[i + 1]!); i++) chosen.add(i + 1)
  for (let i = (best as { index: number }).index; i - 1 >= 0 && joined(words[i - 1]!, words[i]!); i--) chosen.add(i - 1)
  return [...chosen].map((index) => ratingLabel(words[index]![0]))
}

/** Prospects named in the sentence by full name, or by a first word of four letters or more. All prospects when none is named. */
function namedProspects(sentence: string, facts: ClaimFacts): ClaimFacts['prospects'] {
  const lower = sentence.toLowerCase()
  const named = facts.prospects.filter((p) => {
    const label = p.label.toLowerCase()
    const first = label.split(/[\s(&,]/)[0] ?? ''
    return lower.includes(label) || (first.length >= 4 && first !== 'the' && new RegExp(`\\b${first.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(lower))
  })
  return named.length > 0 ? named : facts.prospects
}

function scopeCounts(p: ClaimFacts['prospects'][number], kind: ScoreKind | null, count: number | null): RatingCounts {
  if (kind !== null) return p[kind]
  if (count !== null && p.fit.factorCount === count && p.opportunity.factorCount !== count) return p.fit
  if (count !== null && p.opportunity.factorCount === count && p.fit.factorCount !== count) return p.opportunity
  const counts: Record<string, number> = {}
  for (const label of RATING_LABELS_IN_ORDER) counts[label] = (p.fit.counts[label] ?? 0) + (p.opportunity.counts[label] ?? 0)
  return { factorCount: p.fit.factorCount + p.opportunity.factorCount, counts }
}

/**
 * The absolute claims in an answer that the supplied counts do not support.
 * Empty when there are none. Deterministic; see QUANTIFIED and FIXED.
 *
 * For a quantified phrase about factors:
 *   - a count ("all four") must equal the number of factors in its scope
 *     (the named score; else the score with that many factors; else both)
 *   - with a rating word in the same sentence (the nearest one), "all" or
 *     "every" needs every factor in scope to have that rating, and "none of"
 *     needs none to, for each prospect named in the sentence (all prospects
 *     when none is named)
 *   - with no rating word, and a lead word ("leads", "ahead", "better"...),
 *     compare needs one prospect to lead on everything
 * For a phrase about dimensions, or a fixed phrase ("across the board"):
 *   - with a rating word, the same rating check over all factors
 *   - otherwise, "all three dimensions" needs one prospect to lead on fit,
 *     opportunity and priority; any other such phrase needs one prospect to
 *     lead on every factor and on all three scores (compare only; explain is
 *     not checked)
 */
export function checkAbsoluteClaims(answer: string, facts: ClaimFacts, compare: boolean): AbsoluteClaim[] {
  const found: AbsoluteClaim[] = []
  for (const sentence of sentences(answer)) {
    const matches = [
      ...[...sentence.matchAll(QUANTIFIED)].map((m) => ({ m, fixed: false })),
      ...[...sentence.matchAll(FIXED)].map((m) => ({ m, fixed: true })),
    ]
    for (const { m, fixed } of matches) {
      const phrase = m[0]
      const start = m.index ?? 0
      const end = start + phrase.length
      const quantifier = fixed ? 'all' : m[1]!.toLowerCase()
      const countWord = fixed ? undefined : m[2]?.toLowerCase()
      const count = countWord === undefined ? null : (NUMBER_WORDS[countWord] ?? Number(countWord))
      const kind = fixed ? null : ((m[3]?.toLowerCase() as ScoreKind | undefined) ?? null)
      const aboutDimensions = fixed || /^dimension/i.test(m[4] ?? '')
      const ratings = nearestRatings(sentence, start, end)
      const prospects = namedProspects(sentence, facts)

      if (ratings.length > 0) {
        const ratingName = ratings.join(' or ')
        for (const p of prospects) {
          const scope = scopeCounts(p, aboutDimensions ? null : kind, aboutDimensions ? null : count)
          const have = ratings.reduce((sum, rating) => sum + (scope.counts[rating] ?? 0), 0)
          if (count !== null && !aboutDimensions && count !== scope.factorCount) {
            found.push({ phrase, reason: `says ${count} factors where ${p.label} has ${scope.factorCount} in that score` })
          } else if (quantifier === 'none of' ? have !== 0 : have !== scope.factorCount) {
            found.push({ phrase, reason: `${p.label} has ${have} of ${scope.factorCount} factors rated ${ratingName}` })
          }
        }
        continue
      }
      if (!aboutDimensions && count !== null) {
        for (const p of prospects) {
          const scope = scopeCounts(p, kind, count)
          if (count !== scope.factorCount) found.push({ phrase, reason: `says ${count} factors where ${p.label} has ${scope.factorCount} in that score` })
        }
      }
      if (!compare || facts.leads === null) continue
      const named = prospects.map((p) => p.label)
      if (aboutDimensions && count === facts.leads.scores.length) {
        // "all three dimensions": the three scores (fit, opportunity, priority).
        if (!leadsOnAll(facts.leads.scores, named)) found.push({ phrase, reason: 'no prospect leads on all of fit, opportunity and priority' })
      } else if (aboutDimensions) {
        // "every dimension", "across the board": one prospect must lead on every factor and on all three scores.
        if (!leadsOnAll([...facts.leads.fit, ...facts.leads.opportunity, ...facts.leads.scores], named)) {
          found.push({ phrase, reason: 'no prospect leads on every factor and on fit, opportunity and priority' })
        }
      } else if (LEAD_WORD.test(sentence)) {
        // "leads on all four fit factors": one prospect must lead on every factor in that scope.
        const scope =
          kind !== null
            ? facts.leads[kind]
            : count !== null && facts.leads.fit.length === count
              ? facts.leads.fit
              : count !== null && facts.leads.opportunity.length === count
                ? facts.leads.opportunity
                : [...facts.leads.fit, ...facts.leads.opportunity]
        if (!leadsOnAll(scope, named)) found.push({ phrase, reason: 'no prospect leads on every one of those factors' })
      }
    }
  }
  return found
}
