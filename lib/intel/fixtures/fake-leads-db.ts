/**
 * TEST FIXTURE. A tiny in-memory stand-in for the service-role client, covering
 * only the query calls the Leads read and delete functions make on
 * contact_submissions. It records every call, so tests can assert the exact
 * query a function sends, and applies eq, neq and in filters to its rows.
 * Never import from application code.
 */

import type { LeadsDb } from '@/lib/intel/leads'

export type FakeLeadRow = {
  id: string
  name: string
  company: string | null
  service: string
  status: string
  initial_channel: string | null
  notify_status: string | null
  created_at: string
}

export type RecordedCall = [method: string, ...args: unknown[]]

type Filter = (row: FakeLeadRow) => boolean

export class FakeLeadsDb {
  rows: FakeLeadRow[]
  /** One list of calls per query, in the order the queries were started. */
  queries: RecordedCall[][] = []

  constructor(rows: FakeLeadRow[]) {
    this.rows = rows
  }

  asDb(): LeadsDb {
    return this as unknown as LeadsDb
  }

  from(table: string) {
    const calls: RecordedCall[] = [['from', table]]
    this.queries.push(calls)
    const filters: Filter[] = []
    let head = false
    let isDelete = false
    let range: [number, number] | null = null
    const readRows = () => this.rows
    const writeRows = (next: FakeLeadRow[]) => {
      this.rows = next
    }

    const builder = {
      select(columns: string, options?: { head?: boolean }) {
        calls.push(['select', columns, options ?? null])
        head = options?.head === true
        return builder
      },
      delete() {
        calls.push(['delete'])
        isDelete = true
        return builder
      },
      eq(column: keyof FakeLeadRow, value: unknown) {
        calls.push(['eq', column, value])
        filters.push((row) => row[column] === value)
        return builder
      },
      neq(column: keyof FakeLeadRow, value: unknown) {
        calls.push(['neq', column, value])
        filters.push((row) => row[column] !== value)
        return builder
      },
      in(column: keyof FakeLeadRow, values: unknown[]) {
        calls.push(['in', column, values])
        filters.push((row) => values.includes(row[column]))
        return builder
      },
      or(expression: string) {
        calls.push(['or', expression])
        return builder
      },
      order(column: string, options: unknown) {
        calls.push(['order', column, options])
        return builder
      },
      range(from: number, to: number) {
        calls.push(['range', from, to])
        range = [from, to]
        return builder
      },
      then<T>(resolve: (value: { data: unknown; error: null; count: number }) => T) {
        const matched = readRows().filter((row) => filters.every((f) => f(row)))
        if (isDelete) {
          writeRows(readRows().filter((row) => !matched.includes(row)))
          return Promise.resolve(resolve({ data: matched.map((r) => ({ id: r.id })), error: null, count: matched.length }))
        }
        const page = range === null ? matched : matched.slice(range[0], range[1] + 1)
        return Promise.resolve(resolve({ data: head ? null : page.map((r) => ({ ...r })), error: null, count: matched.length }))
      },
    }
    return builder
  }
}
