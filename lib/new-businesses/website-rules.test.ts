// Run with: pnpm exec tsx --test lib/new-businesses/website-rules.test.ts
// All businesses here are fictional.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  WEBSITE_RULES_VERSION,
  candidateClass,
  decideWebsiteStatus,
  distinctSearchCount,
  identityAccepted,
  rederiveWebsiteDecision,
  reportFromStoredEvidence,
} from './website-rules';
import type { CheckCandidate, CheckedBusiness, IdentityMatch } from './website-schema';

const NONE: IdentityMatch = { name: false, street_address: false, phone: false, city: false, business_type: false };
const MATCH: IdentityMatch = { ...NONE, name: true, street_address: true };

function candidate(url: string, identity: IdentityMatch = MATCH, kind: CheckCandidate['kind_claimed'] = 'own_site'): CheckCandidate {
  return { url, kind_claimed: kind, excerpt: 'Example Bakery, 100 Example St, Las Vegas.', identity_match: identity };
}

function report(overrides: Partial<CheckedBusiness> = {}): CheckedBusiness {
  return {
    id: '00000000-0000-4000-8000-000000000001',
    searches: ['"Example Bakery" Las Vegas', '"Example Bakery" 100 Example St'],
    candidates: [],
    placeholder: false,
    outcome_claimed: 'none_found',
    ...overrides,
  };
}

describe('identityAccepted', () => {
  it('needs the name plus street address, phone, or city and business type', () => {
    assert.equal(identityAccepted({ ...NONE, name: true, street_address: true }), true);
    assert.equal(identityAccepted({ ...NONE, name: true, phone: true }), true);
    assert.equal(identityAccepted({ ...NONE, name: true, city: true, business_type: true }), true);
  });

  it('rejects a name alone, city alone, type alone, and anything without the name', () => {
    assert.equal(identityAccepted({ ...NONE, name: true }), false);
    assert.equal(identityAccepted({ ...NONE, name: true, city: true }), false);
    assert.equal(identityAccepted({ ...NONE, name: true, business_type: true }), false);
    assert.equal(identityAccepted({ ...NONE, street_address: true, phone: true, city: true, business_type: true }), false);
  });
});

describe('decideWebsiteStatus', () => {
  it('no_website: none_found after two distinct searches and no accepted candidate', () => {
    const result = decideWebsiteStatus(report());
    assert.equal(result.status, 'no_website');
    assert.equal(result.url, null);
    assert.equal(result.rulesVersion, WEBSITE_RULES_VERSION);
  });

  it('none_found after a single search becomes unclear', () => {
    assert.equal(decideWebsiteStatus(report({ searches: ['"Example Bakery" Las Vegas'] })).status, 'unclear');
  });

  it('two searches that differ only in case or spacing count as one', () => {
    assert.equal(distinctSearchCount(['Example Bakery Las Vegas', '  example   bakery LAS VEGAS ']), 1);
    assert.equal(decideWebsiteStatus(report({ searches: ['Example Bakery Las Vegas', 'example bakery, las vegas'] })).status, 'unclear');
  });

  it('a candidate that fails the identity rule is ignored', () => {
    const result = decideWebsiteStatus(report({ candidates: [candidate('https://www.example-bakery.test/', { ...NONE, name: true, city: true })] }));
    assert.equal(result.status, 'no_website');
    assert.equal(result.evidence.candidates[0]?.accepted, false);
  });

  it('social_only: every accepted candidate is social or a directory', () => {
    const result = decideWebsiteStatus(report({ outcome_claimed: 'found', candidates: [candidate('https://www.facebook.com/examplebakery'), candidate('https://www.yelp.com/biz/example-bakery')] }));
    assert.equal(result.status, 'social_only');
    assert.equal(result.url, 'https://www.facebook.com/examplebakery');
  });

  it('free_builder: the best accepted candidate is a builder address', () => {
    const result = decideWebsiteStatus(report({ outcome_claimed: 'found', candidates: [candidate('https://www.facebook.com/examplebakery'), candidate('https://examplebakery.wixsite.com/home')] }));
    assert.equal(result.status, 'free_builder');
    assert.equal(result.url, 'https://examplebakery.wixsite.com/home');
  });

  it('has_website: an accepted own domain that is not a placeholder, preferred over everything else', () => {
    const result = decideWebsiteStatus(report({ outcome_claimed: 'found', candidates: [candidate('https://examplebakery.wixsite.com/'), candidate('https://www.example-bakery.test/')] }));
    assert.equal(result.status, 'has_website');
    assert.equal(result.url, 'https://www.example-bakery.test/');
  });

  it('placeholder: an accepted own domain marked placeholder', () => {
    assert.equal(decideWebsiteStatus(report({ outcome_claimed: 'found', placeholder: true, candidates: [candidate('https://www.example-bakery.test/')] })).status, 'placeholder');
  });

  it('unclear: found or unclear claimed with nothing accepted', () => {
    assert.equal(decideWebsiteStatus(report({ outcome_claimed: 'found' })).status, 'unclear');
    assert.equal(decideWebsiteStatus(report({ outcome_claimed: 'unclear' })).status, 'unclear');
  });

  it('decides from observations, not from what the runner claims', () => {
    // The runner calls a Facebook page its own site; the server classifies by host.
    const result = decideWebsiteStatus(report({ outcome_claimed: 'found', candidates: [candidate('https://www.facebook.com/examplebakery', MATCH, 'own_site')] }));
    assert.equal(result.status, 'social_only');
  });

  it('keeps the searches, every candidate and its matches as evidence', () => {
    const result = decideWebsiteStatus(report({ outcome_claimed: 'found', note: 'Own site found.', candidates: [candidate('https://www.example-bakery.test/')] }));
    assert.deepEqual(result.evidence.searches, ['"Example Bakery" Las Vegas', '"Example Bakery" 100 Example St']);
    assert.deepEqual(result.evidence.candidates[0]?.matched, ['name', 'street_address']);
    assert.equal(result.evidence.candidates[0]?.hostKind, 'own_domain');
    assert.equal(result.evidence.note, 'Own site found.');
  });
});

describe('rules version 2: host and kind_claimed', () => {
  it('is version 2', () => {
    assert.equal(WEBSITE_RULES_VERSION, 'website-check-v2');
  });

  it('a news article that mentions the business, after two searches, is no_website', () => {
    const result = decideWebsiteStatus(report({
      outcome_claimed: 'found',
      candidates: [candidate('https://www.example-news.test/2026/11/new-bakery-opens', MATCH, 'other')],
    }));
    assert.equal(result.status, 'no_website');
    assert.equal(result.url, null);
    assert.equal(result.evidence.candidates[0]?.class, 'mention');
    assert.equal(result.evidence.candidates[0]?.accepted, true, 'the mention stays in the evidence');
  });

  it('a mention after a single search is unclear', () => {
    const result = decideWebsiteStatus(report({
      searches: ['"Example Bakery" Las Vegas'],
      outcome_claimed: 'found',
      candidates: [candidate('https://www.example-news.test/story', MATCH, 'other')],
    }));
    assert.equal(result.status, 'unclear');
    assert.equal(result.url, null);
  });

  it('a directory on an unlisted host, claimed as directory, is social_only', () => {
    const result = decideWebsiteStatus(report({ outcome_claimed: 'found', candidates: [candidate('https://www.unlisted-directory.test/biz/example-bakery', MATCH, 'directory')] }));
    assert.equal(result.status, 'social_only');
    assert.equal(result.url, 'https://www.unlisted-directory.test/biz/example-bakery');
  });

  it('own_site claimed for a listed social host is still social_only', () => {
    const result = decideWebsiteStatus(report({ outcome_claimed: 'found', candidates: [candidate('https://www.instagram.com/examplebakery', MATCH, 'own_site')] }));
    assert.equal(result.status, 'social_only');
  });

  it('own_site or builder_page on an unlisted host is the own domain', () => {
    assert.equal(candidateClass('https://www.example-bakery.test/', 'own_site'), 'own_domain');
    assert.equal(candidateClass('https://www.example-bakery.test/', 'builder_page'), 'own_domain');
    assert.equal(candidateClass('https://examplebakery.wixsite.com/', 'own_site'), 'free_builder');
    assert.equal(candidateClass('https://examplebakery.wixsite.com/', 'other'), 'free_builder');
    assert.equal(candidateClass('https://www.yelp.com/biz/x', 'other'), 'listing');
  });

  it('a mention never hides a real listing or site', () => {
    const result = decideWebsiteStatus(report({
      outcome_claimed: 'found',
      candidates: [candidate('https://www.example-news.test/story', MATCH, 'other'), candidate('https://www.facebook.com/examplebakery', MATCH, 'social')],
    }));
    assert.equal(result.status, 'social_only');
    assert.equal(result.url, 'https://www.facebook.com/examplebakery');
  });

  it('compared with version 1, kind_claimed can never produce a higher status than the host alone', () => {
    // Higher means more web presence. With kind_claimed own_site everywhere,
    // version 2 classes every candidate by host alone, exactly as version 1 did.
    const PRESENCE = { no_website: 0, unclear: 1, social_only: 2, free_builder: 3, placeholder: 4, has_website: 5 } as const;
    const URLS = ['https://www.example-bakery.test/', 'https://www.facebook.com/x', 'https://x.wixsite.com/', 'https://www.unlisted-directory.test/x'];
    const KINDS = ['own_site', 'social', 'directory', 'builder_page', 'other'] as const;
    let compared = 0;
    for (const placeholder of [false, true]) {
      for (const outcome of ['none_found', 'found', 'unclear'] as const) {
        for (const searches of [['a'], ['a', 'b']]) {
          for (const pair of URLS.flatMap((a) => URLS.map((b) => [a, b] as const))) {
            for (const kinds of KINDS.flatMap((a) => KINDS.map((b) => [a, b] as const))) {
              const base = { searches, placeholder, outcome_claimed: outcome };
              const withKinds = decideWebsiteStatus(report({ ...base, candidates: pair.map((url, i) => candidate(url, MATCH, kinds[i])) }));
              const hostAlone = decideWebsiteStatus(report({ ...base, candidates: pair.map((url) => candidate(url, MATCH, 'own_site')) }));
              assert.ok(PRESENCE[withKinds.status] <= PRESENCE[hostAlone.status], `${pair} ${kinds}: ${withKinds.status} > ${hostAlone.status}`);
              compared += 1;
            }
          }
        }
      }
    }
    assert.equal(compared, 2 * 3 * 2 * 16 * 25);
  });
});

describe('re-deriving stored results', () => {
  it('rebuilds the report from stored version 1 evidence, including every identity field', () => {
    const v1Evidence = {
      searches: ['"Example Bakery" Las Vegas', '"Example Bakery" 100 Example St'],
      candidates: [{ url: 'https://www.example-news.test/story', kindClaimed: 'other', hostKind: 'own_domain', excerpt: 'Example Bakery has no online presence yet.', matched: ['name', 'street_address'], accepted: true }],
      placeholder: false,
      outcomeClaimed: 'found',
      note: null,
    };
    const rebuilt = reportFromStoredEvidence('id-1', v1Evidence);
    assert.deepEqual(rebuilt?.candidates[0]?.identity_match, { name: true, street_address: true, phone: false, city: false, business_type: false });
    const decision = rederiveWebsiteDecision('id-1', v1Evidence);
    assert.equal(decision?.status, 'no_website');
    assert.equal(decision?.rulesVersion, 'website-check-v2');
  });

  it('returns null, and guesses nothing, when a field the rules need is missing', () => {
    const missingKind = { searches: ['a', 'b'], candidates: [{ url: 'https://x.test/', excerpt: 'x', matched: ['name'] }], placeholder: false, outcomeClaimed: 'found' };
    assert.equal(rederiveWebsiteDecision('id-2', missingKind), null);
    assert.equal(rederiveWebsiteDecision('id-3', { searches: ['a'], candidates: [], placeholder: false }), null);
    assert.equal(rederiveWebsiteDecision('id-4', null), null);
  });
});
