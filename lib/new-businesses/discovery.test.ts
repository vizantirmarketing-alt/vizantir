// Run with: pnpm exec tsx --test lib/new-businesses/discovery.test.ts
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { discoverFiles, formatPeriod, periodFromUrl } from './discovery';
import { FIXTURE_LISTING_HTML } from './fixtures/source.fixture';

describe('discoverFiles', () => {
  it('finds monthly lists newest first, one per period, allowlisted https only', () => {
    const files = discoverFiles(FIXTURE_LISTING_HTML);
    assert.deepEqual(
      files.map((f) => `${f.year}-${f.month}`),
      ['2026-10', '2026-9', '2026-8', '2025-9'],
    );
    assert.equal(files[0]?.url, 'https://www.clarkcountynv.gov/adobe/assets/urn:aaid:aem:bbbb/original/as/new-businesses-oct-2026.pdf', 'first link for a period wins');
  });

  it('resolves relative links against the listing page and ignores case', () => {
    const august = discoverFiles(FIXTURE_LISTING_HTML).find((f) => f.month === 8);
    assert.equal(august?.url, 'https://www.clarkcountynv.gov/adobe/assets/urn:aaid:aem:cccc/original/as/New-Businesses-Aug-2026.pdf');
  });

  it('rejects other hosts, plain http, unknown months and other files', () => {
    const urls = discoverFiles(FIXTURE_LISTING_HTML).map((f) => f.url).join(' ');
    assert.ok(!urls.includes('evil.example.com'));
    assert.ok(!urls.includes('http://'));
    assert.ok(!urls.includes('foo-2026'));
    assert.ok(!urls.includes('annual-report'));
  });

  it('reads the period from the file name, including "sept"', () => {
    assert.deepEqual(periodFromUrl(new URL('https://www.clarkcountynv.gov/a/new-businesses-sept-2025.pdf')), { year: 2025, month: 9 });
    assert.deepEqual(periodFromUrl(new URL('https://www.clarkcountynv.gov/a/new-businesses-dec-2026.pdf')), { year: 2026, month: 12 });
    assert.equal(periodFromUrl(new URL('https://www.clarkcountynv.gov/a/new-businesses-oct-2026.pdf.bak')), null);
    assert.equal(formatPeriod({ year: 2026, month: 10 }), 'October 2026');
  });
});
