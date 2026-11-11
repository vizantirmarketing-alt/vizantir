// Run with: pnpm exec tsx --test lib/new-businesses/rank.test.ts
// All businesses here are fictional.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  RANK_VERSION,
  RANK_WEIGHTS,
  hasStoreNumber,
  isAddressName,
  isHoldingName,
  leadingCategory,
  rankBusiness,
  rankStoredRows,
  reasonLine,
  tierForScore,
  type BusinessRankInput,
  type RankableStoredRow,
} from './rank';

const ALONE = { phoneNames: 1, locationNames: 1 };
const RESTAURANT = 'Food Services - Restaurants & Other';

function biz(overrides: Partial<BusinessRankInput> = {}): BusinessRankInput {
  return { name: 'Fictional Bakery LLC', address: '100 Example St', suite: null, phone: '(702) 555-0101', categories: [RESTAURANT], ...overrides };
}

describe('rankBusiness (version 2)', () => {
  it('is versioned and keeps every weight in one object', () => {
    assert.equal(RANK_VERSION, 'new-business-rank-v2');
    assert.deepEqual(RANK_WEIGHTS.type, { high: 60, medium: 40, low: 15 });
    assert.equal(RANK_WEIGHTS.hasPhone, 5);
    assert.equal(RANK_WEIGHTS.localPhone, 10);
    assert.equal(RANK_WEIGHTS.outOfAreaPhone, -10);
    assert.equal(RANK_WEIGHTS.severalLicenses, 5);
  });

  it('scores a local restaurant with its own phone as likely', () => {
    const result = rankBusiness(biz(), ALONE);
    assert.equal(result.score, 75);
    assert.equal(result.tier, 'likely');
    assert.deepEqual(result.signals.map((s) => [s.key, s.points]), [['type', 60], ['has_phone', 5], ['local_phone', 10]]);
    assert.equal(result.signals[0]?.label, 'Restaurant license');
  });

  it('gives toll-free numbers nothing extra and penalizes other area codes', () => {
    const tollFree = rankBusiness(biz({ phone: '(888) 555-0101' }), ALONE);
    assert.equal(tollFree.score, 65);
    assert.equal(tollFree.signals.find((s) => s.key === 'toll_free_phone')?.label, 'Toll-free 888 phone number');
    for (const code of ['800', '833', '844', '855', '866', '877', '888']) {
      assert.equal(rankBusiness(biz({ phone: `${code}-555-0101` }), ALONE).score, 65, code);
    }
    const away = rankBusiness(biz({ phone: '(213) 555-0101' }), ALONE);
    assert.equal(away.score, 55);
    assert.equal(away.signals.find((s) => s.key === 'out_of_area_phone')?.label, 'Phone number from outside Las Vegas (area code 213), often a franchise or corporate office');
  });

  it('records a missing phone without points', () => {
    const none = rankBusiness(biz({ phone: null }), { phoneNames: 0, locationNames: 1 });
    assert.equal(none.score, 60);
    assert.deepEqual(none.signals.find((s) => s.key === 'no_phone'), { key: 'no_phone', label: 'No phone number on the license', points: 0 });
    assert.equal(rankBusiness(biz({ phone: '555-0101' }), ALONE).score, 60, 'an incomplete number is no phone');
  });

  it('uses the highest tier license of a grouped business, and adds 5 for several licenses', () => {
    const result = rankBusiness(biz({ categories: ['Liquor - Restaurant - Retail Beer & Wine', RESTAURANT] }), ALONE);
    assert.equal(result.signals[0]?.label, 'Restaurant license');
    assert.equal(result.score, 80);
    assert.equal(result.signals.find((s) => s.key === 'several_licenses')?.label, 'Holds 2 licenses');
    assert.equal(leadingCategory(['Wholesale Trade', 'Real Estate Salesperson']), 'Wholesale Trade');
  });

  it('keeps the shared and name penalties', () => {
    assert.equal(rankBusiness(biz(), { ...ALONE, phoneNames: 3 }).score, 35);
    assert.equal(rankBusiness(biz(), { ...ALONE, phoneNames: 2 }).score, 75, 'two names on one phone is not the pattern');
    assert.equal(rankBusiness(biz(), { ...ALONE, locationNames: 5 }).score, 55);
    assert.equal(rankBusiness(biz({ name: '3330 Example Street LLC' }), ALONE).score, 40);
    assert.equal(rankBusiness(biz({ name: 'Example Mart #1234' }), ALONE).score, 50);
  });

  it('clamps to 0..100 and maps tiers at 70 and 40', () => {
    const worst = rankBusiness(biz({ name: '4675 E Example LLC', categories: ['Real Estate Salesperson'], phone: '213-555-0101' }), { phoneNames: 12, locationNames: 9 });
    assert.equal(worst.score, 0);
    assert.equal(tierForScore(70), 'likely');
    assert.equal(tierForScore(69), 'possible');
    assert.equal(tierForScore(40), 'possible');
    assert.equal(tierForScore(39), 'low');
  });

  it('uses American spelling in every label', () => {
    const labels = [
      ...rankBusiness(biz({ categories: ['Real Estate Salesperson', RESTAURANT], phone: null }), { phoneNames: 0, locationNames: 6 }).signals,
      ...rankBusiness(biz(), { phoneNames: 4, locationNames: 1 }).signals,
    ].map((s) => s.label).join(' ');
    assert.ok(!/licence/i.test(labels), labels);
  });
});

describe('name patterns', () => {
  it('recognises names that are only a street address', () => {
    for (const name of ['3330 EXAMPLE STREET LLC', '1601 Sample Center Drive LLC', '7960 N Demo Blvd LLC', '7 Bond Lane LLC', '4675 E EXAMPLE LLC', '3707 East Sample LLC', '1200 S Main St Unit 4 LLC']) {
      assert.equal(isAddressName(name), true, name);
    }
  });

  it('leaves real shops that start with a number alone', () => {
    for (const name of ['101 Main St Cafe', '702 Pizza Co', '530 Electric LLC', '503 Flooring LLC', '24 Hour Fitness Example', '5 Star Locksmith', '369 Beauty Bar', '4 Paws LLC', '888 Sushi and Robata', '7-Example Market']) {
      assert.equal(isAddressName(name), false, name);
    }
  });

  it('recognises holding-style names by their final word', () => {
    for (const name of ['Example Holdings LLC', 'Sample Asset Holdings, LLC', 'Demo Family Trust', 'Gold Example Investments, Inc.', 'Sample Capital', 'Fictional Properties LLC', 'Example Holding LLC']) {
      assert.equal(isHoldingName(name), true, name);
    }
  });

  it('leaves real businesses that use those words elsewhere in the name', () => {
    for (const name of ['Capital Barbers', 'Trust Plumbing LLC', 'Family Trust Insurance', 'Capital Music Management LLC', 'Properties Of Paint Studio', 'Example Trust Company', 'Example Properties LLC Series 4']) {
      assert.equal(isHoldingName(name), false, name);
    }
  });

  it('recognises store numbers, but not a short second-location number', () => {
    for (const name of ['Example Mart #1234', 'Sample Foods Store 0456', 'Demo Market Store #42923A', 'Example Pets # 531']) {
      assert.equal(hasStoreNumber(name), true, name);
    }
    for (const name of ['Example Tacos #2', 'Sample Grocery #57', 'Studio 54 Example', 'Unit 1200 Example', 'Example 1234 LLC']) {
      assert.equal(hasStoreNumber(name), false, name);
    }
  });
});

describe('rankStoredRows', () => {
  let n = 0;
  function row(overrides: Partial<RankableStoredRow> = {}): RankableStoredRow {
    n += 1;
    return {
      id: `r${String(n).padStart(3, '0')}`, name: 'Fictional Bakery LLC', address: '100 Example St', suite: null, phone: '(702) 555-0101',
      category: RESTAURANT, period: '2026-10', reviewStatus: 'unreviewed', reviewedAt: null, hasNote: false, createdAt: `2026-11-0${(n % 9) + 1}T00:00:00Z`,
      ...overrides,
    };
  }

  it('scores each business once and gives every license row of it the same score', () => {
    const rows = [
      row({ name: 'Fictional Bakery LLC', category: RESTAURANT }),
      row({ name: 'FICTIONAL BAKERY, L.L.C.', category: 'Liquor - Restaurant - Retail Beer & Wine' }),
      row({ name: 'Sample Barber', address: '200 Demo Ave', category: 'Barber Shop - Other Services', phone: null }),
    ];
    const ranked = rankStoredRows(rows);
    assert.equal(ranked.length, 2);
    const bakery = ranked.find((b) => b.group.rowIds.length === 2)!;
    assert.equal(bakery.result.score, 80);
    assert.deepEqual(bakery.group.categories, ['Food Services - Restaurants & Other', 'Liquor - Restaurant - Retail Beer & Wine']);
  });

  it('counts shared phones by distinct business names across all rows', () => {
    const rows = [
      row({ name: 'Alpha Example LLC', address: '1 A St', phone: '702-555-0199' }),
      row({ name: 'Beta Example LLC', address: '2 B St', phone: '(702) 555-0199' }),
      row({ name: 'Gamma Example LLC', address: '3 C St', phone: '7025550199' }),
    ];
    for (const { result } of rankStoredRows(rows)) {
      assert.ok(result.signals.some((s) => s.label === 'Shares a phone number with 2 other new licenses'));
    }
  });

  it('does not treat different suites at one street address as a shared address', () => {
    const rows = [1, 2, 3, 4, 5].map((i) => row({ name: `Suite Tenant ${i}`, address: '500 Example Way', suite: `Ste ${i}`, phone: null }));
    for (const { result } of rankStoredRows(rows)) assert.ok(!result.signals.some((s) => s.key === 'shared_location'));
    const shared = [1, 2, 3, 4, 5].map((i) => row({ name: `Virtual Office ${i}`, address: '600 Example Blvd', suite: 'Suite 100', phone: null }));
    for (const { result } of rankStoredRows(shared)) assert.ok(result.signals.some((s) => s.key === 'shared_location'));
  });
});

describe('reasonLine', () => {
  it('shows just the type for a typical local business', () => {
    assert.equal(reasonLine(rankBusiness(biz(), ALONE).signals), 'Restaurant license');
    assert.equal(reasonLine(rankBusiness(biz({ categories: [RESTAURANT, 'Retail - Group 1'] }), ALONE).signals), 'Restaurant license');
  });

  it('adds only what sets the business apart, largest effect first, at most two', () => {
    assert.equal(
      reasonLine(rankBusiness(biz({ phone: '213-555-0101' }), ALONE).signals),
      'Restaurant license · phone number from outside Las Vegas (area code 213), often a franchise or corporate office',
    );
    assert.equal(reasonLine(rankBusiness(biz({ phone: '888-555-0101' }), ALONE).signals), 'Restaurant license · toll-free 888 phone number');
    assert.equal(reasonLine(rankBusiness(biz({ phone: null }), { phoneNames: 0, locationNames: 1 }).signals), 'Restaurant license · no phone number on the license');
    assert.equal(
      reasonLine(rankBusiness(biz({ name: 'Example Mart #1234' }), { phoneNames: 12, locationNames: 6 }).signals),
      'Restaurant license · shares a phone number with 11 other new licenses · name has a store number, so likely a chain location',
    );
  });

  it('never prints the phone or local-number signals that describe nearly every row', () => {
    const line = reasonLine(rankBusiness(biz({ categories: [RESTAURANT, 'Retail - Group 1'] }), ALONE).signals);
    assert.ok(!/phone number on the license|local 702/i.test(line));
    assert.ok(!/holds 2 licenses/i.test(line));
  });
});
