// Run with: pnpm exec tsx --test lib/prospects/rubric.test.ts
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  FACTOR_DEFINITIONS,
  FIT_FACTORS,
  OPPORTUNITY_FACTORS,
  PROSPECT_FACTORS,
  RUBRIC_VERSION,
  computeConfidence,
  computeScore,
  factorPoints,
  factorsMissingEvidence,
  readFactorRatings,
  scoreProspect,
  type FactorRatings,
  type ProspectRating,
} from './rubric';

function allRated(rating: ProspectRating): FactorRatings {
  return Object.fromEntries(
    PROSPECT_FACTORS.map((factor) => [factor, rating]),
  ) as FactorRatings;
}

describe('rubric weights', () => {
  it('fit and opportunity weights each sum to 100', () => {
    const sum = (factors: readonly (keyof typeof FACTOR_DEFINITIONS)[]) =>
      factors.reduce((total, key) => total + FACTOR_DEFINITIONS[key].weight, 0);
    assert.equal(sum(FIT_FACTORS), 100);
    assert.equal(sum(OPPORTUNITY_FACTORS), 100);
  });

  it('uses the agreed weights', () => {
    assert.equal(FACTOR_DEFINITIONS.market_industry_match.weight, 30);
    assert.equal(FACTOR_DEFINITIONS.business_complexity.weight, 30);
    assert.equal(FACTOR_DEFINITIONS.custom_web_relevance.weight, 25);
    assert.equal(FACTOR_DEFINITIONS.growth_signals.weight, 15);
    assert.equal(FACTOR_DEFINITIONS.navigation_conversion_friction.weight, 35);
    assert.equal(FACTOR_DEFINITIONS.performance_technical_issues.weight, 30);
    assert.equal(FACTOR_DEFINITIONS.content_information_architecture.weight, 20);
    assert.equal(FACTOR_DEFINITIONS.integration_cms_opportunity.weight, 15);
  });
});

describe('rating to points', () => {
  it('maps strong to full weight, weak to half, none and unknown to zero', () => {
    assert.equal(factorPoints('business_complexity', 'strong'), 30);
    assert.equal(factorPoints('business_complexity', 'weak'), 15);
    assert.equal(factorPoints('business_complexity', 'none'), 0);
    assert.equal(factorPoints('business_complexity', 'unknown'), 0);
  });

  it('scores 100 when every factor is strong and 0 when every factor is none', () => {
    assert.equal(computeScore('fit', allRated('strong')).score, 100);
    assert.equal(computeScore('opportunity', allRated('strong')).score, 100);
    assert.equal(computeScore('fit', allRated('none')).score, 0);
  });

  it('rounds half points to the nearest whole score', () => {
    const ratings = { ...allRated('none'), market_industry_match: 'strong', business_complexity: 'strong', custom_web_relevance: 'weak' } satisfies FactorRatings;
    // 30 + 30 + 12.5 + 0 = 72.5
    assert.equal(computeScore('fit', ratings).score, 73);
  });
});

describe('null and confidence rules', () => {
  it('nulls a score when more than half of its weight is unknown', () => {
    const ratings = { ...allRated('strong'), business_complexity: 'unknown', custom_web_relevance: 'unknown' } satisfies FactorRatings;
    // fit unknown weight 55 of 100
    const fit = computeScore('fit', ratings);
    assert.equal(fit.knownWeight, 45);
    assert.equal(fit.score, null);
  });

  it('keeps a score when exactly half of its weight is unknown', () => {
    const ratings = { ...allRated('strong'), navigation_conversion_friction: 'unknown', integration_cms_opportunity: 'unknown' } satisfies FactorRatings;
    // opportunity unknown weight 35 + 15 = 50
    const opportunity = computeScore('opportunity', ratings);
    assert.equal(opportunity.score, 50);
  });

  it('gives unknown factors no points even when the score is kept', () => {
    const ratings = { ...allRated('strong'), growth_signals: 'unknown' } satisfies FactorRatings;
    assert.equal(computeScore('fit', ratings).score, 85);
  });

  it('nulls both scores when everything is unknown and confidence is low', () => {
    const scores = scoreProspect(allRated('unknown'));
    assert.equal(scores.fit.score, null);
    assert.equal(scores.opportunity.score, null);
    assert.equal(scores.confidence, 'low');
    assert.equal(scores.knownFactorCount, 0);
  });

  it('sets confidence by share of known factors', () => {
    const withKnown = (count: number): FactorRatings => {
      const ratings = allRated('unknown');
      for (const factor of PROSPECT_FACTORS.slice(0, count)) {
        ratings[factor] = 'none';
      }
      return ratings;
    };
    assert.equal(computeConfidence(withKnown(8)).confidence, 'high');
    assert.equal(computeConfidence(withKnown(6)).confidence, 'high');
    assert.equal(computeConfidence(withKnown(5)).confidence, 'medium');
    assert.equal(computeConfidence(withKnown(4)).confidence, 'medium');
    assert.equal(computeConfidence(withKnown(3)).confidence, 'low');
  });

  it('counts a rating of none as known', () => {
    assert.equal(scoreProspect(allRated('none')).confidence, 'high');
  });

  it('stamps the rubric version', () => {
    assert.equal(scoreProspect(allRated('weak')).rubricVersion, RUBRIC_VERSION);
  });
});

describe('evidence requirement', () => {
  it('requires evidence for every factor not rated unknown', () => {
    const ratings = { ...allRated('unknown'), growth_signals: 'strong', integration_cms_opportunity: 'none' } satisfies FactorRatings;
    assert.deepEqual(factorsMissingEvidence(ratings, []), [
      'growth_signals',
      'integration_cms_opportunity',
    ]);
    assert.deepEqual(factorsMissingEvidence(ratings, ['growth_signals']), [
      'integration_cms_opportunity',
    ]);
    assert.deepEqual(
      factorsMissingEvidence(ratings, ['growth_signals', 'integration_cms_opportunity']),
      [],
    );
  });

  it('does not require evidence for unknown factors', () => {
    assert.deepEqual(factorsMissingEvidence(allRated('unknown'), []), []);
  });
});

describe('readFactorRatings', () => {
  it('reads stored JSON and treats missing or invalid values as unknown', () => {
    const ratings = readFactorRatings({ growth_signals: 'strong', business_complexity: 'excellent' });
    assert.equal(ratings.growth_signals, 'strong');
    assert.equal(ratings.business_complexity, 'unknown');
    assert.equal(ratings.market_industry_match, 'unknown');
    assert.deepEqual(readFactorRatings(null), allRated('unknown'));
  });
});
