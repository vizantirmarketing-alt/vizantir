// Run with: pnpm exec tsx --test lib/new-businesses/website-rules.test.ts
// All businesses here are fictional.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { WEBSITE_RULES_VERSION, decideWebsiteStatus, distinctSearchCount, identityAccepted } from './website-rules';
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
