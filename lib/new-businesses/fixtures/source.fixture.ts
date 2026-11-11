/**
 * TEST FIXTURE. Used by tests only; never import from application code.
 *
 * A synthetic listing page and synthetic positioned PDF text. Every business
 * is fictional; names, addresses and phone numbers are made up (555 numbers,
 * example streets). Nothing here comes from a real list.
 */

import type { PositionedItem, PositionedPage } from '@/lib/new-businesses/parse'

export const FIXTURE_LISTING_HTML = `
<html><body>
  <a href="https://www.clarkcountynv.gov/adobe/assets/urn:aaid:aem:aaaa/original/as/new-businesses-sep-2026.pdf">September 2026</a>
  <a href="https://www.clarkcountynv.gov/adobe/assets/urn:aaid:aem:bbbb/original/as/new-businesses-oct-2026.pdf">October 2026</a>
  <a href="/adobe/assets/urn:aaid:aem:cccc/original/as/New-Businesses-Aug-2026.pdf">August 2026 (relative)</a>
  <a href="https://www.clarkcountynv.gov/adobe/assets/urn:aaid:aem:dddd/original/as/new-businesses-oct-2026.pdf">October 2026 duplicate</a>
  <a href="https://evil.example.com/new-businesses-nov-2026.pdf">Wrong host</a>
  <a href="http://www.clarkcountynv.gov/x/new-businesses-dec-2026.pdf">Not https</a>
  <a href="https://www.clarkcountynv.gov/x/new-businesses-foo-2026.pdf">Bad month</a>
  <a href="https://www.clarkcountynv.gov/x/annual-report-2026.pdf">Other PDF</a>
  <a href='https://clarkcountynv.gov/x/new-businesses-sept-2025.pdf'>Sept spelling, bare host</a>
</body></html>`

const COLS1 = { index: 14, name: 36, address: 175, suite: 272, city: 330, state: 380, zip: 402, phone: 431, category: 495 }
// The second page's header sits lower and further right, as some real files do.
const COLS2 = Object.fromEntries(Object.entries(COLS1).map(([k, v]) => [k, v + 12])) as typeof COLS1

type Cells = Partial<Record<keyof typeof COLS1, string>>

function line(cols: typeof COLS1, y: number, cells: Cells, indexOffset = 6): PositionedItem[] {
  return Object.entries(cells).map(([key, str]) => ({
    str: str as string,
    x: cols[key as keyof typeof COLS1] + (key === 'index' ? indexOffset : 1),
    y,
  }))
}

function header(cols: typeof COLS1, y: number): PositionedItem[] {
  return [
    { str: 'Index', x: cols.index, y },
    { str: 'Business Name', x: cols.name, y: y + 1 },
    { str: 'Address', x: cols.address, y },
    { str: 'Suite', x: cols.suite, y },
    { str: 'City', x: cols.city, y },
    { str: 'State', x: cols.state, y },
    { str: 'Zip', x: cols.zip, y },
    { str: 'Phone', x: cols.phone, y },
    { str: 'Category', x: cols.category, y },
  ]
}

export const FIXTURE_PAGES: PositionedPage[] = [
  {
    items: [
      { str: 'Clark County Department of Business License', x: 297, y: 603 },
      { str: 'New Businesses October 1 - October 31, 2026', x: 295, y: 591 },
      ...header(COLS1, 564),
      ...line(COLS1, 554, { index: '1', name: 'FICTIONAL BAKERY LLC', address: '100 Example St', suite: 'Ste 1', city: 'Las Vegas', state: 'NV', zip: '89101', phone: '(702) 555-0101', category: 'Food Services - Restaurant' }),
      ...line(COLS1, 544, { index: '2', name: 'Sample Consulting Group', phone: '(702) 555-0102', category: 'Professional, Scientific, and Technical Services - Group 2' }),
      // Row 3 wraps: the name and the category continue on the next line.
      ...line(COLS1, 534, { index: '3', name: 'Imaginary Dental Arts and', address: '200 Demo Ave', city: 'Henderson', state: 'NV', zip: '89052', phone: '(702) 555-0103', category: 'Healthcare & Social Services -' }),
      ...line(COLS1, 525, { name: 'Orthodontic Studio PLLC', category: 'Group 5' }),
      ...line(COLS1, 515, { index: '4', name: 'Placeholder Plumbing', address: '300 Mock Rd', suite: 'Unit 4', city: 'North Las Veg', state: 'NV', zip: '89030', phone: '(702) 555-0104', category: 'Construction' }),
      { str: 'Page 1 of 2', x: 735, y: 24 },
    ],
  },
  {
    items: [
      { str: 'Clark County Department of Business License', x: 297, y: 603 },
      ...header(COLS2, 555),
      ...line(COLS2, 545, { index: '5', name: 'Fictional Law Office', address: '400 Sample Blvd', city: 'Las Vegas', state: 'NV', zip: '89102', phone: '(702) 555-0105', category: 'Professional, Scientific, and Technical Services - Group 2' }, 8),
      // A junk line: something in the Index column that is not a number.
      ...line(COLS2, 535, { index: 'Total' }),
      ...line(COLS2, 525, { index: '6', name: 'Demo Food Truck #9', address: '500 Example Way', city: 'Las Vegas', state: 'NV', zip: '89103', phone: '(702) 555-0106', category: 'Food Services - Mobile Food Vendor' }, 8),
      // Row 7 has no category, so it cannot be kept.
      ...line(COLS2, 515, { index: '7', name: 'No Category Example' }, 8),
      { str: 'Page 2 of 2', x: 746, y: 14 },
    ],
  },
]
