// Run with: pnpm exec tsx --test lib/new-businesses/group.test.ts
// All businesses here are fictional.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { businessKey, choosePrimary, groupBusinesses, type GroupInput } from './group';

let n = 0;
function row(overrides: Partial<GroupInput> = {}): GroupInput {
  n += 1;
  return {
    id: `r${String(n).padStart(3, '0')}`, name: 'Fictional Bakery LLC', address: '100 Example St', suite: null, phone: '(702) 555-0101',
    category: 'Food Services - Restaurants & Other', period: '2026-10', reviewStatus: 'unreviewed', reviewedAt: null, hasNote: false,
    createdAt: '2026-11-01T00:00:00Z', ...overrides,
  };
}

describe('businessKey', () => {
  it('groups name and address variants together', () => {
    assert.equal(
      businessKey(row({ name: 'Fictional Bakery, L.L.C.', address: '100 EXAMPLE STREET' })),
      businessKey(row({ name: 'FICTIONAL BAKERY LLC', address: '100 Example St.' })),
    );
  });

  it('keeps different suites, different names and different addresses apart', () => {
    assert.notEqual(businessKey(row({ suite: 'Ste 1' })), businessKey(row({ suite: 'Ste 2' })));
    assert.notEqual(businessKey(row({ name: 'Other Bakery LLC' })), businessKey(row()));
    assert.notEqual(businessKey(row({ address: '200 Example St' })), businessKey(row()));
  });

  it('falls back to name and phone without an address, and never groups by name alone', () => {
    assert.equal(businessKey(row({ address: null, phone: '702-555-0101' })), businessKey(row({ address: null, phone: '(702) 555-0101' })));
    assert.notEqual(businessKey(row({ address: null, phone: null })), businessKey(row({ address: null, phone: null })));
  });
});

describe('groupBusinesses', () => {
  it('makes one business per name and location across periods, without merging rows', () => {
    const rows = [
      row({ category: 'Food Services - Restaurants & Other', period: '2026-09' }),
      row({ category: 'Liquor - Restaurant - Retail Beer & Wine', period: '2026-10' }),
      row({ category: 'Food Services - Restaurants & Other', period: '2026-10' }),
      row({ name: 'Sample Barber', address: '200 Demo Ave', category: 'Barber Shop - Other Services' }),
    ];
    const groups = groupBusinesses(rows);
    assert.equal(groups.length, 2);
    const bakery = groups.find((g) => g.licenseCount === 3)!;
    assert.deepEqual(bakery.rowIds, [rows[0]!.id, rows[1]!.id, rows[2]!.id]);
    assert.deepEqual(bakery.categories, ['Food Services - Restaurants & Other', 'Liquor - Restaurant - Retail Beer & Wine']);
    assert.deepEqual(bakery.periods, ['2026-10', '2026-09']);
  });
});

describe('choosePrimary', () => {
  it('prefers a reviewed row, most recently reviewed first', () => {
    const rows = [
      row({ createdAt: '2026-09-01T00:00:00Z' }),
      row({ createdAt: '2026-10-01T00:00:00Z', reviewStatus: 'accepted', reviewedAt: '2026-10-05T00:00:00Z' }),
      row({ createdAt: '2026-10-02T00:00:00Z', reviewStatus: 'archived', reviewedAt: '2026-10-09T00:00:00Z' }),
    ];
    assert.equal(choosePrimary(rows).id, rows[2]!.id);
  });

  it('then a row with a note, then the earliest stored row', () => {
    const noted = [row({ createdAt: '2026-09-01T00:00:00Z' }), row({ createdAt: '2026-10-01T00:00:00Z', hasNote: true })];
    assert.equal(choosePrimary(noted).id, noted[1]!.id);
    const plain = [row({ createdAt: '2026-10-01T00:00:00Z' }), row({ createdAt: '2026-09-01T00:00:00Z' })];
    assert.equal(choosePrimary(plain).id, plain[1]!.id);
  });

  it('never lets a later unreviewed license take over a reviewed business', () => {
    const reviewed = row({ createdAt: '2026-09-01T00:00:00Z', reviewStatus: 'rejected', reviewedAt: '2026-09-20T00:00:00Z' });
    const later = row({ createdAt: '2026-11-01T00:00:00Z', category: 'Retail - Group 1', period: '2026-11' });
    assert.equal(choosePrimary([later, reviewed]).id, reviewed.id);
  });
});
