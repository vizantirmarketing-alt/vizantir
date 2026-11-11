/**
 * Parses positioned text from the Clark County new business list into typed
 * rows. Pure; no I/O. lib/new-businesses/pdf.ts turns a PDF into the
 * positioned items this expects.
 *
 * The list is a table with the header row
 *   Index | Business Name | Address | Suite | City | State | Zip | Phone | Category
 * Column positions are read from each page's own header row, because they
 * shift between files. A line whose Index cell is a number starts a row; a
 * line with no index continues the row above it (wrapped names, addresses or
 * categories). Page footers are ignored. Anything else is counted as an
 * unparsed line.
 */

export type PositionedItem = { str: string; x: number; y: number }
export type PositionedPage = { items: PositionedItem[] }

export const COLUMNS = [
  'index',
  'name',
  'address',
  'suite',
  'city',
  'state',
  'zip',
  'phone',
  'category',
] as const
type Column = (typeof COLUMNS)[number]

const HEADER_LABELS: Record<string, Column> = {
  index: 'index',
  'business name': 'name',
  address: 'address',
  suite: 'suite',
  city: 'city',
  state: 'state',
  zip: 'zip',
  phone: 'phone',
  category: 'category',
}

export type NewBusinessRecord = {
  index: number
  name: string
  address: string | null
  suite: string | null
  city: string | null
  state: string | null
  zip: string | null
  phone: string | null
  category: string
}

export type ParseResult = {
  rows: NewBusinessRecord[]
  /** Lines below a header that were neither a row, a continuation nor a footer. */
  unparsedLines: number
  /** Rows dropped for missing a business name or category. */
  incompleteRows: number
  pagesWithoutHeader: number
}

const LINE_TOLERANCE = 2.5
const COLUMN_SLACK = 4
const FOOTER_RE = /^page\s+\d+\s+of\s+\d+$/i

type Line = { y: number; items: PositionedItem[] }

function groupLines(items: readonly PositionedItem[]): Line[] {
  const lines: Line[] = []
  for (const item of items) {
    if (item.str.trim() === '') continue
    const line = lines.find((l) => Math.abs(l.y - item.y) <= LINE_TOLERANCE)
    if (line) line.items.push(item)
    else lines.push({ y: item.y, items: [item] })
  }
  for (const line of lines) line.items.sort((a, b) => a.x - b.x)
  // PDF y grows upward: higher y is nearer the top of the page.
  return lines.sort((a, b) => b.y - a.y)
}

type ColumnStarts = { column: Column; x: number }[]

function headerColumns(line: Line): ColumnStarts | null {
  const starts: ColumnStarts = []
  for (const item of line.items) {
    const column = HEADER_LABELS[item.str.trim().toLowerCase()]
    if (column !== undefined) starts.push({ column, x: item.x })
  }
  const found = new Set(starts.map((s) => s.column))
  if (!found.has('name') || !found.has('category') || !found.has('index')) {
    return null
  }
  return starts.sort((a, b) => a.x - b.x)
}

function columnFor(x: number, starts: ColumnStarts): Column {
  let chosen: Column = starts[0]?.column ?? 'index'
  for (const start of starts) {
    if (start.x <= x + COLUMN_SLACK) chosen = start.column
  }
  return chosen
}

type Draft = Record<Column, string[]>

function emptyDraft(): Draft {
  return Object.fromEntries(COLUMNS.map((c) => [c, [] as string[]])) as Draft
}

function cellsOf(line: Line, starts: ColumnStarts): Draft {
  const draft = emptyDraft()
  for (const item of line.items) {
    draft[columnFor(item.x, starts)].push(item.str.trim())
  }
  return draft
}

function clean(parts: string[]): string | null {
  const text = parts.join(' ').replace(/\s+/g, ' ').trim()
  return text.length > 0 ? text : null
}

function finish(draft: Draft): NewBusinessRecord | null {
  const index = Number(clean(draft.index))
  const name = clean(draft.name)
  const category = clean(draft.category)
  if (!Number.isInteger(index) || name === null || category === null) {
    return null
  }
  return {
    index,
    name,
    address: clean(draft.address),
    suite: clean(draft.suite),
    city: clean(draft.city),
    state: clean(draft.state),
    zip: clean(draft.zip),
    phone: clean(draft.phone),
    category,
  }
}

export function parseNewBusinessPages(pages: readonly PositionedPage[]): ParseResult {
  const rows: NewBusinessRecord[] = []
  let unparsedLines = 0
  let incompleteRows = 0
  let pagesWithoutHeader = 0
  let starts: ColumnStarts | null = null
  let current: Draft | null = null

  const flush = () => {
    if (current === null) return
    const record = finish(current)
    if (record) rows.push(record)
    else incompleteRows += 1
    current = null
  }

  for (const page of pages) {
    const lines = groupLines(page.items)
    const headerIndex = lines.findIndex((line) => headerColumns(line) !== null)
    if (headerIndex === -1) {
      pagesWithoutHeader += 1
      if (starts === null) continue
    } else {
      starts = headerColumns(lines[headerIndex] as Line)
    }
    if (starts === null) continue
    const body = headerIndex === -1 ? lines : lines.slice(headerIndex + 1)

    for (const line of body) {
      const text = line.items.map((i) => i.str.trim()).join(' ')
      if (FOOTER_RE.test(text)) continue
      const cells = cellsOf(line, starts)
      const indexText = clean(cells.index)
      if (indexText !== null && /^\d+$/.test(indexText)) {
        flush()
        current = cells
        continue
      }
      if (indexText === null && current !== null) {
        for (const column of COLUMNS) {
          if (column !== 'index') current[column].push(...cells[column])
        }
        continue
      }
      unparsedLines += 1
    }
  }
  flush()

  return { rows, unparsedLines, incompleteRows, pagesWithoutHeader }
}

/** Per-category counts for a parse, before any category filtering. */
export function countByCategory(rows: readonly NewBusinessRecord[]): Map<string, number> {
  const counts = new Map<string, number>()
  for (const row of rows) {
    counts.set(row.category, (counts.get(row.category) ?? 0) + 1)
  }
  return counts
}

/** Stable identity of a row within a period, so re-imports do not duplicate it. */
export function rowDedupeKey(row: NewBusinessRecord): string {
  const norm = (value: string | null) => (value ?? '').toLowerCase().replace(/\s+/g, ' ').trim()
  const digits = (value: string | null) => (value ?? '').replace(/\D/g, '')
  return [norm(row.name), norm(row.address), norm(row.suite), digits(row.zip), digits(row.phone), norm(row.category)].join('|')
}
