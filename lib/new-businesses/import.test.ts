// Run with: pnpm exec tsx --test lib/new-businesses/import.test.ts
// No network or database: every dependency is injected.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { FIXTURE_LISTING_HTML, FIXTURE_PAGES } from './fixtures/source.fixture';
import { MemoryNewBusinessStore } from './fixtures/memory-store';
import {
  applyCategoryRule,
  importLatest,
  importLatestDaily,
  reimportPeriod,
  rescoreStoredRows,
  type ImportDeps,
} from './import';
import { parseNewBusinessPages } from './parse';
import { setBusinessReview } from './review';

const FOOD = 'Food Services - Restaurant';
const PRO = 'Professional, Scientific, and Technical Services - Group 2';

function deps(store: MemoryNewBusinessStore, overrides: Partial<ImportDeps> = {}) {
  const fetched: string[] = [];
  const d: ImportDeps = {
    store,
    fetchListing: async () => FIXTURE_LISTING_HTML,
    fetchPdf: async (url) => {
      fetched.push(url);
      return new Uint8Array([0x25, 0x50, 0x44, 0x46]);
    },
    extractPages: async () => FIXTURE_PAGES,
    now: () => new Date('2026-11-10T15:00:00Z'),
    ...overrides,
  };
  return { d, fetched };
}

describe('enabled-category rule', () => {
  it('stores only rows in enabled categories and counts the rest as discarded', () => {
    const rows = parseNewBusinessPages(FIXTURE_PAGES).rows;
    const { stored, discarded } = applyCategoryRule(rows, new Map([[FOOD, true], [PRO, false]]));
    assert.deepEqual(stored.map((r) => r.name), ['FICTIONAL BAKERY LLC']);
    assert.equal(discarded, rows.length - 1);
  });

  it('creates new categories disabled, so a first import stores nothing', async () => {
    const store = new MemoryNewBusinessStore();
    const result = await importLatest(deps(store).d);
    assert.equal(result.outcome, 'imported');
    assert.ok(result.outcome === 'imported' && result.counts.rowsStored === 0);
    assert.equal(store.rows.size, 0);
    assert.ok([...store.categories.values()].every((c) => c.enabled === false));
    assert.equal(store.categories.get(PRO)?.lastSeenCount, 2);
  });

  it('picks up a newly enabled category when a stored period is re-imported', async () => {
    const store = new MemoryNewBusinessStore();
    await importLatest(deps(store).d);
    store.enable(PRO);
    const result = await reimportPeriod(deps(store).d, { year: 2026, month: 10 });
    assert.ok(result.outcome === 'imported');
    assert.equal(result.counts.rowsStored, 2);
    assert.equal(result.counts.rowsInserted, 2);
    assert.deepEqual([...store.rows.values()].map((r) => r.name).sort(), ['Fictional Law Office', 'Sample Consulting Group']);
  });
});

describe('importLatest', () => {
  it('imports the newest period first, then the next newest, within the lookback', async () => {
    const store = new MemoryNewBusinessStore();
    const { d, fetched } = deps(store);
    const first = await importLatest(d);
    const second = await importLatest(d);
    const third = await importLatest(d);
    const fourth = await importLatest(d);
    assert.deepEqual([first, second, third].map((r) => (r.outcome === 'imported' ? `${r.period.year}-${r.period.month}` : r.outcome)), ['2026-10', '2026-9', '2026-8']);
    assert.equal(fourth.outcome, 'up_to_date', 'September 2025 is outside the three-period lookback');
    assert.equal(fetched.length, 3);
  });

  it('is idempotent: importing the same file again adds no rows', async () => {
    const store = new MemoryNewBusinessStore();
    store.enable(FOOD);
    store.enable(PRO);
    const first = await importLatest(deps(store).d);
    const again = await reimportPeriod(deps(store).d, { year: 2026, month: 10 });
    assert.ok(first.outcome === 'imported' && first.counts.rowsInserted === 3);
    assert.ok(again.outcome === 'imported' && again.counts.rowsInserted === 0 && again.counts.rowsStored === 3);
    assert.equal(store.rows.size, 3);
  });

  it('records a failure on the import row and retries that period next time', async () => {
    const store = new MemoryNewBusinessStore();
    const failing = await importLatest(deps(store, { fetchPdf: async () => { throw new Error('HTTP 503'); } }).d);
    assert.deepEqual(failing, { outcome: 'failed', period: { year: 2026, month: 10 }, error: 'HTTP 503' });
    assert.equal(store.imports.get('2026-10')?.state, 'failed');
    assert.equal(store.imports.get('2026-10')?.error, 'HTTP 503');

    const retry = await importLatest(deps(store).d);
    assert.ok(retry.outcome === 'imported' && retry.period.month === 10);
  });

  it('fails cleanly when the file has no readable rows or the listing cannot be fetched', async () => {
    const store = new MemoryNewBusinessStore();
    const empty = await importLatest(deps(store, { extractPages: async () => [] }).d);
    assert.ok(empty.outcome === 'failed' && /No rows/.test(empty.error));
    const noListing = await importLatest(deps(store, { fetchListing: async () => { throw new Error('timeout'); } }).d);
    assert.deepEqual(noListing, { outcome: 'failed', period: null, error: 'Listing page: timeout' });
  });
});

describe('importLatestDaily', () => {
  it('attempts at most once per local day', async () => {
    const store = new MemoryNewBusinessStore();
    const morning = deps(store, { now: () => new Date('2026-11-10T15:00:00Z') });
    assert.equal((await importLatestDaily(morning.d)).outcome, 'imported');
    const later = deps(store, { now: () => new Date('2026-11-11T05:00:00Z') }); // Nov 10, 9 PM PST
    assert.equal((await importLatestDaily(later.d)).outcome, 'skipped_today');
    assert.equal(later.fetched.length, 0);
    const tomorrow = deps(store, { now: () => new Date('2026-11-11T15:00:00Z') });
    assert.equal((await importLatestDaily(tomorrow.d)).outcome, 'imported');
  });
});

describe('lead ranking during import', () => {
  it('scores every stored row at the end of an import', async () => {
    const store = new MemoryNewBusinessStore();
    store.enable(FOOD);
    store.enable(PRO);
    const result = await importLatest(deps(store).d);
    assert.ok(result.outcome === 'imported' && result.rankError === undefined);
    for (const row of store.rows.values()) {
      assert.ok(row.rank !== null, row.name);
      assert.equal(row.rank.version, 'new-business-rank-v2');
      assert.ok(row.rank.score >= 0 && row.rank.score <= 100);
    }
    assert.equal(store.byName('FICTIONAL BAKERY LLC')?.rank?.tier, 'likely');
  });

  it('rescores rows from earlier periods too, because group counts span the whole set', async () => {
    const store = new MemoryNewBusinessStore();
    store.enable(FOOD);
    await importLatest(deps(store).d);
    const first = store.byName('FICTIONAL BAKERY LLC')!.rank!.scoredAt;
    await importLatest(deps(store, { now: () => new Date('2026-11-11T15:00:00Z') }).d);
    assert.notEqual(store.byName('FICTIONAL BAKERY LLC')!.rank!.scoredAt, first);
  });

  it('keeps review status and owner note when a period is re-imported', async () => {
    const store = new MemoryNewBusinessStore();
    store.enable(FOOD);
    store.enable(PRO);
    await importLatest(deps(store).d);
    const row = store.byName('Sample Consulting Group')!;
    row.reviewStatus = 'accepted';
    row.ownerNote = 'Called back, wants a quote';

    const again = await reimportPeriod(deps(store).d, { year: 2026, month: 10 });
    assert.ok(again.outcome === 'imported' && again.counts.rowsInserted === 0);
    const after = store.byName('Sample Consulting Group')!;
    assert.equal(after.id, row.id);
    assert.equal(after.reviewStatus, 'accepted');
    assert.equal(after.ownerNote, 'Called back, wants a quote');
    assert.ok(after.rank !== null);
  });

  it('never fails the import when scoring fails, records it, and leaves earlier scores in place', async () => {
    const store = new MemoryNewBusinessStore();
    store.enable(FOOD);
    await importLatest(deps(store).d);
    const before = store.byName('FICTIONAL BAKERY LLC')!.rank;

    store.failRankSave = true;
    const result = await reimportPeriod(deps(store).d, { year: 2026, month: 10 });
    assert.equal(result.outcome, 'imported');
    assert.ok(result.outcome === 'imported' && /Lead scores were not updated: rank save unavailable/.test(result.rankError ?? ''));
    assert.equal(store.imports.get('2026-10')?.state, 'imported');
    assert.match(store.imports.get('2026-10')?.error ?? '', /Lead scores were not updated/);
    assert.deepEqual(store.byName('FICTIONAL BAKERY LLC')!.rank, before);
  });

  it('saves scores in batches', async () => {
    const store = new MemoryNewBusinessStore();
    const rows = Array.from({ length: 1203 }, (_, i) => ({
      index: i + 1, name: `Example Shop ${i}`, address: null, suite: null, city: null, state: null, zip: null, phone: null, category: FOOD,
      dedupeKey: `k${i}`,
    }));
    await store.storeRows('clark_county', { year: 2026, month: 10 }, rows);
    assert.equal(await rescoreStoredRows(store, '2026-11-10T15:00:00.000Z'), 1203);
    assert.deepEqual(store.rankSaveBatches, [500, 500, 203]);
  });
});

describe('grouping during import', () => {
  it('marks one primary row per business and gives every row the group fields', async () => {
    const store = new MemoryNewBusinessStore();
    store.enable(FOOD);
    store.enable(PRO);
    await importLatest(deps(store).d);
    await importLatest(deps(store, { now: () => new Date('2026-11-11T15:00:00Z') }).d);
    // Two periods of the same three businesses: six license rows, three businesses.
    assert.equal(store.rows.size, 6);
    assert.equal(store.businesses().length, 3);
    for (const primary of store.businesses()) {
      const rows = store.businessRows(primary.rank!.groupKey);
      assert.equal(rows.length, 2);
      assert.equal(primary.rank!.groupLicenseCount, 2);
      assert.deepEqual(primary.rank!.groupPeriods, ['2026-10', '2026-09']);
      assert.ok(rows.every((row) => row.rank!.score === primary.rank!.score));
    }
  });

  it('a new license row never resurfaces a reviewed business as unreviewed', async () => {
    const store = new MemoryNewBusinessStore();
    store.enable(FOOD);
    await importLatest(deps(store).d);
    const bakery = store.businesses().find((row) => row.name === 'FICTIONAL BAKERY LLC')!;
    await setBusinessReview(store.reviewWriter(), bakery.id, 'accepted', '2026-11-10T16:00:00.000Z');

    // The next period brings a new, unreviewed license row for the same business.
    await importLatest(deps(store, { now: () => new Date('2026-11-11T15:00:00Z') }).d);
    const rows = store.businessRows(bakery.rank!.groupKey);
    assert.equal(rows.length, 2);
    assert.ok(rows.some((row) => row.reviewStatus === 'unreviewed'), 'the new license row itself is not rewritten');

    const primary = store.businesses().find((row) => row.rank!.groupKey === bakery.rank!.groupKey)!;
    assert.equal(primary.id, bakery.id);
    assert.equal(primary.reviewStatus, 'accepted');
    const unreviewedBusinesses = store.businesses().filter((row) => row.reviewStatus === 'unreviewed');
    assert.ok(!unreviewedBusinesses.some((row) => row.rank!.groupKey === bakery.rank!.groupKey));
  });
});
