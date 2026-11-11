// Run with: pnpm exec tsx --test lib/new-businesses/normalize.test.ts
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { isLocalPhone, locationKey, normalizeAddress, normalizeName, normalizePhone, normalizeSuite } from './normalize';

describe('normalizePhone', () => {
  it('reduces any US format to ten digits', () => {
    assert.equal(normalizePhone('(702) 555-0101'), '7025550101');
    assert.equal(normalizePhone('702.555.0101'), '7025550101');
    assert.equal(normalizePhone('+1 725 555 0101'), '7255550101');
  });
  it('rejects anything that is not a full number', () => {
    assert.equal(normalizePhone('555-0101'), null);
    assert.equal(normalizePhone(''), null);
    assert.equal(normalizePhone(null), null);
    assert.equal(normalizePhone('2 702 555 0101'), null);
  });
  it('recognises the local area codes only', () => {
    assert.equal(isLocalPhone('7025550101'), true);
    assert.equal(isLocalPhone('7255550101'), true);
    assert.equal(isLocalPhone('7755550101'), false);
    assert.equal(isLocalPhone(null), false);
  });
});

describe('normalizeName', () => {
  it('ignores case, punctuation and entity suffixes', () => {
    assert.equal(normalizeName('Desert Bloom, LLC'), 'DESERT BLOOM');
    assert.equal(normalizeName('DESERT BLOOM L.L.C.'), 'DESERT BLOOM');
    assert.equal(normalizeName('desert   bloom inc.'), 'DESERT BLOOM');
    assert.equal(normalizeName('Smith & Sons Co'), 'SMITH AND SONS');
  });
  it('keeps a name that is only a suffix-like word', () => {
    assert.equal(normalizeName('LLC'), 'LLC');
    assert.equal(normalizeName('Company Kitchen'), 'COMPANY KITCHEN');
  });
});

describe('normalizeAddress and normalizeSuite', () => {
  it('unifies common street abbreviations', () => {
    assert.equal(normalizeAddress('100 West Example Street'), '100 W EXAMPLE ST');
    assert.equal(normalizeAddress('100 W. Example St.'), '100 W EXAMPLE ST');
    assert.equal(normalizeAddress('  '), null);
  });
  it('drops suite labels', () => {
    assert.equal(normalizeSuite('Ste 1'), '1');
    assert.equal(normalizeSuite('Suite #1'), '1');
    assert.equal(normalizeSuite('UNIT 4B'), '4B');
    assert.equal(normalizeSuite(''), null);
  });
  it('treats different suites at one street address as different places', () => {
    assert.equal(locationKey('100 Example St', 'Ste 1'), locationKey('100 EXAMPLE STREET', '#1'));
    assert.notEqual(locationKey('100 Example St', 'Ste 1'), locationKey('100 Example St', 'Ste 2'));
    assert.notEqual(locationKey('100 Example St', 'Ste 1'), locationKey('100 Example St', null));
    assert.equal(locationKey(null, 'Ste 1'), null);
  });
});
