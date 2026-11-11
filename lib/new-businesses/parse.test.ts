// Run with: pnpm exec tsx --test lib/new-businesses/parse.test.ts
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { FIXTURE_PAGES } from './fixtures/source.fixture';
import { countByCategory, parseNewBusinessPages, rowDedupeKey } from './parse';

describe('parseNewBusinessPages', () => {
  const result = parseNewBusinessPages(FIXTURE_PAGES);

  it('reads every complete row across pages, in order', () => {
    assert.deepEqual(result.rows.map((r) => r.index), [1, 2, 3, 4, 5, 6]);
  });

  it('reads every column of a full row', () => {
    assert.deepEqual(result.rows[0], {
      index: 1,
      name: 'FICTIONAL BAKERY LLC',
      address: '100 Example St',
      suite: 'Ste 1',
      city: 'Las Vegas',
      state: 'NV',
      zip: '89101',
      phone: '(702) 555-0101',
      category: 'Food Services - Restaurant',
    });
  });

  it('keeps a row with no address', () => {
    const row = result.rows.find((r) => r.index === 2);
    assert.equal(row?.address, null);
    assert.equal(row?.city, null);
    assert.equal(row?.phone, '(702) 555-0102');
  });

  it('joins wrapped names and categories onto their row', () => {
    const row = result.rows.find((r) => r.index === 3);
    assert.equal(row?.name, 'Imaginary Dental Arts and Orthodontic Studio PLLC');
    assert.equal(row?.category, 'Healthcare & Social Services - Group 5');
    assert.equal(row?.address, '200 Demo Ave');
  });

  it('reads column positions from each page header, even when they shift', () => {
    const row = result.rows.find((r) => r.index === 5);
    assert.equal(row?.name, 'Fictional Law Office');
    assert.equal(row?.zip, '89102');
  });

  it('skips footers, counts junk lines, and drops rows missing a category', () => {
    assert.equal(result.unparsedLines, 1);
    assert.equal(result.incompleteRows, 1);
    assert.equal(result.pagesWithoutHeader, 0);
    assert.ok(!result.rows.some((r) => r.name.includes('Page')));
  });

  it('counts per category and gives a stable dedupe key', () => {
    const counts = countByCategory(result.rows);
    assert.equal(counts.get('Professional, Scientific, and Technical Services - Group 2'), 2);
    assert.equal(rowDedupeKey(result.rows[0]!), rowDedupeKey({ ...result.rows[0]!, index: 99, name: ' fictional  bakery llc ' }));
    assert.notEqual(rowDedupeKey(result.rows[0]!), rowDedupeKey(result.rows[1]!));
  });

  it('reads nothing when no page has a header', () => {
    const empty = parseNewBusinessPages([{ items: [{ str: '1', x: 20, y: 500 }, { str: 'Nothing', x: 40, y: 500 }] }]);
    assert.deepEqual(empty.rows, []);
    assert.equal(empty.pagesWithoutHeader, 1);
  });
});
