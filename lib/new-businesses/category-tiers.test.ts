// Run with: pnpm exec tsx --test lib/new-businesses/category-tiers.test.ts
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { CATEGORY_TIERS, categoryShortName, categoryTier } from './category-tiers';

describe('categoryTier', () => {
  it('uses the exact table first', () => {
    assert.equal(categoryTier('Food Services - Restaurants & Other'), 'high');
    assert.equal(categoryTier('Wholesale Trade'), 'medium');
    assert.equal(categoryTier('Real Estate Salesperson'), 'low');
    assert.equal(categoryTier('Liquor - Restaurants - Supper Clubs'), 'low');
    assert.equal(categoryTier('Holding Company - Management of Enterprises'), 'low');
  });

  it('falls back to keywords for new category names, low before high', () => {
    assert.equal(categoryTier('Liquor - Restaurant - Tavern'), 'low');
    assert.equal(categoryTier('Restaurant - Drive Through'), 'high');
    assert.equal(categoryTier('Nail Salon Establishment'), 'high');
    assert.equal(categoryTier('Child Care Facility'), 'high');
  });

  it('defaults unknown categories to medium', () => {
    assert.equal(categoryTier('Something Entirely New'), 'medium');
  });

  it('has a tier for every category in the table', () => {
    for (const tier of Object.values(CATEGORY_TIERS)) assert.ok(['high', 'medium', 'low'].includes(tier));
    assert.ok(Object.keys(CATEGORY_TIERS).length >= 178);
  });
});

describe('categoryShortName', () => {
  it('gives plain short names', () => {
    assert.equal(categoryShortName('Food Services - Restaurants & Other'), 'Restaurant');
    assert.equal(categoryShortName('Barber Shop - Other Services'), 'Barber Shop');
    assert.equal(categoryShortName('Healthcare & Social Services - Group 1'), 'Healthcare');
    assert.equal(categoryShortName('Retail - Group 2'), 'Retail');
    assert.equal(categoryShortName('Law Firm'), 'Law Firm');
  });
});
