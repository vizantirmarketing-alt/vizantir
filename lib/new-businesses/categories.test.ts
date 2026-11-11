// Run with: pnpm exec tsx --test lib/new-businesses/categories.test.ts
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { bulkTargets, filterCategories, formatEnabledTotal, type CategoryState } from './categories';

const CATEGORIES: CategoryState[] = [
  { category: 'Food Services - Restaurant', enabled: true },
  { category: 'Food Services - Mobile Food Vendor', enabled: false },
  { category: 'Healthcare & Social Services - Group 5', enabled: false },
  { category: 'Construction', enabled: false },
  { category: 'Professional, Scientific, and Technical Services - Group 2', enabled: true },
];

describe('filterCategories', () => {
  it('matches by name, ignoring case and extra spaces', () => {
    assert.deepEqual(filterCategories(CATEGORIES, '  food   services ').map((c) => c.category), [
      'Food Services - Restaurant',
      'Food Services - Mobile Food Vendor',
    ]);
    assert.equal(filterCategories(CATEGORIES, 'SERVICES').length, 4);
    assert.equal(filterCategories(CATEGORIES, '').length, 5);
    assert.deepEqual(filterCategories(CATEGORIES, 'nothing matches'), []);
  });
});

describe('bulk actions respect the filter', () => {
  it('Turn on shown changes only shown categories that are off', () => {
    assert.deepEqual(bulkTargets(CATEGORIES, 'food', true), ['Food Services - Mobile Food Vendor']);
    assert.ok(!bulkTargets(CATEGORIES, 'food', true).includes('Construction'));
  });

  it('Turn off shown changes only shown categories that are on', () => {
    assert.deepEqual(bulkTargets(CATEGORIES, 'food', false), ['Food Services - Restaurant']);
    assert.ok(!bulkTargets(CATEGORIES, 'food', false).includes('Professional, Scientific, and Technical Services - Group 2'));
  });

  it('applies to everything when the filter is empty, and to nothing when nothing matches', () => {
    assert.deepEqual(bulkTargets(CATEGORIES, '', true), [
      'Food Services - Mobile Food Vendor',
      'Healthcare & Social Services - Group 5',
      'Construction',
    ]);
    assert.deepEqual(bulkTargets(CATEGORIES, 'zzz', true), []);
    assert.deepEqual(bulkTargets(CATEGORIES, 'zzz', false), []);
  });
});

describe('formatEnabledTotal', () => {
  it('shows the running total', () => {
    assert.equal(formatEnabledTotal(CATEGORIES), '2 of 5 on');
    assert.equal(formatEnabledTotal([]), '0 of 0 on');
  });
});
