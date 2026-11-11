// Run with: pnpm exec tsx --test lib/new-businesses/review.test.ts
// No database: the writer is the memory store's. All businesses are fictional.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { MemoryNewBusinessStore } from './fixtures/memory-store';
import { rescoreStoredRows } from './import';
import { setBusinessNote, setBusinessReview } from './review';

const NOW = '2026-11-10T15:00:00.000Z';
const OCT = { year: 2026, month: 10 };

function license(name: string, category: string, index: number) {
  return { index, name, address: '100 Example St', suite: null, city: 'Las Vegas', state: 'NV', zip: '89101', phone: '(702) 555-0101', category, dedupeKey: `${name}|${category}` };
}

async function storeWithTwoLicenseBusiness() {
  const store = new MemoryNewBusinessStore();
  await store.storeRows('clark_county', OCT, [
    license('Fictional Bakery LLC', 'Food Services - Restaurants & Other', 1),
    license('Fictional Bakery LLC', 'Liquor - Restaurant - Retail Beer & Wine', 2),
    { ...license('Sample Barber', 'Barber Shop - Other Services', 3), address: '200 Demo Ave' },
  ]);
  await rescoreStoredRows(store, NOW);
  return store;
}

describe('review actions apply to every license row of a business', () => {
  it('accepts every row of the business and nothing else', async () => {
    const store = await storeWithTwoLicenseBusiness();
    const primary = store.businesses().find((row) => row.name === 'Fictional Bakery LLC')!;
    assert.deepEqual(await setBusinessReview(store.reviewWriter(), primary.id, 'accepted', NOW), { ok: true });
    const bakery = store.businessRows(primary.rank!.groupKey);
    assert.equal(bakery.length, 2);
    assert.ok(bakery.every((row) => row.reviewStatus === 'accepted' && row.reviewedAt === NOW));
    assert.equal(store.byName('Sample Barber')!.reviewStatus, 'unreviewed');
  });

  it('acts on the whole business from any of its rows', async () => {
    const store = await storeWithTwoLicenseBusiness();
    const secondary = [...store.rows.values()].find((row) => row.name === 'Fictional Bakery LLC' && row.rank?.groupPrimary === false)!;
    await setBusinessReview(store.reviewWriter(), secondary.id, 'archived', NOW);
    assert.ok(store.businessRows(secondary.rank!.groupKey).every((row) => row.reviewStatus === 'archived'));
  });

  it('writes the note to every row, and clears it on an empty note', async () => {
    const store = await storeWithTwoLicenseBusiness();
    const primary = store.businesses().find((row) => row.name === 'Fictional Bakery LLC')!;
    await setBusinessNote(store.reviewWriter(), primary.id, '  Called, wants a quote  ', NOW);
    assert.ok(store.businessRows(primary.rank!.groupKey).every((row) => row.ownerNote === 'Called, wants a quote'));
    await setBusinessNote(store.reviewWriter(), primary.id, '   ', NOW);
    assert.ok(store.businessRows(primary.rank!.groupKey).every((row) => row.ownerNote === null));
  });

  it('updates only the row itself when it has not been grouped yet', async () => {
    const store = new MemoryNewBusinessStore();
    await store.storeRows('clark_county', OCT, [license('Fictional Bakery LLC', 'Food Services - Restaurants & Other', 1), license('Fictional Bakery LLC', 'Retail - Group 1', 2)]);
    const [first, second] = [...store.rows.values()];
    await setBusinessReview(store.reviewWriter(), first!.id, 'rejected', NOW);
    assert.equal(first!.reviewStatus, 'rejected');
    assert.equal(second!.reviewStatus, 'unreviewed');
  });

  it('reports a missing row', async () => {
    const store = new MemoryNewBusinessStore();
    assert.deepEqual(await setBusinessReview(store.reviewWriter(), 'nope', 'accepted', NOW), { ok: false, reason: 'not_found' });
  });
});
