// Run with: NODE_OPTIONS=--conditions=react-server pnpm exec tsx --test lib/intel/leads-spam.test.ts
// Spam on the Leads page: hidden from the default list and the total, shown
// under Status = Spam, deleted in bulk only when its status is spam, and the
// briefing's queries unchanged. In-memory client, no network. Fictional data only.
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { FakeLeadsDb, type FakeLeadRow } from './fixtures/fake-leads-db'
import { deleteSpamLeads } from './lead-delete'
import {
  LEAD_STATUSES,
  LEADS_DEFAULT_STATUS_LABEL,
  autoSpamNote,
  deleteAllSpamPrompt,
  hiddenSpamLine,
  leadsListHref,
  parseLeadsListParams,
} from './lead-params'
import { fetchLeadDashboardStats, fetchLeads, fetchSpamCount } from './leads'

function row(n: number, status: string, extra: Partial<FakeLeadRow> = {}): FakeLeadRow {
  return {
    id: `40000000-0000-4000-8000-${n.toString().padStart(12, '0')}`,
    name: `Fictional Person ${n}`,
    company: `Fictional Company ${n}`,
    service: 'Web Design',
    status,
    initial_channel: 'direct',
    notify_status: status === 'spam' ? null : 'sent',
    created_at: `2026-11-${(n % 28 + 1).toString().padStart(2, '0')}T12:00:00.000Z`,
    ...extra,
  }
}

// One row per status, plus two more spam rows.
function mixedRows(): FakeLeadRow[] {
  return [...LEAD_STATUSES.map((status, i) => row(i + 1, status)), row(20, 'spam'), row(21, 'spam', { initial_channel: 'referral' })]
}

const DEFAULT_VIEW = parseLeadsListParams({})

describe('leads list: spam in the default view', () => {
  it('the default view leaves spam out, including the old ?status=all link', async () => {
    assert.equal(parseLeadsListParams({ status: 'all' }).status, 'all')
    assert.equal(LEADS_DEFAULT_STATUS_LABEL, 'All except spam')
    const db = new FakeLeadsDb(mixedRows())
    const result = await fetchLeads(DEFAULT_VIEW, db.asDb())
    assert.ok(result.ok)
    assert.equal(result.total, LEAD_STATUSES.length - 1)
    assert.equal(result.rows.some((r) => r.status === 'spam'), false)
    assert.equal(result.filtersActive, false)
    assert.deepEqual(db.queries[0]!.find((c) => c[0] === 'neq'), ['neq', 'status', 'spam'])
  })

  it('Status = Spam shows spam and nothing else', async () => {
    const db = new FakeLeadsDb(mixedRows())
    const result = await fetchLeads(parseLeadsListParams({ status: 'spam' }), db.asDb())
    assert.ok(result.ok)
    assert.equal(result.total, 3)
    assert.ok(result.rows.every((r) => r.status === 'spam'))
  })

  it('the total card leaves spam out', async () => {
    const db = new FakeLeadsDb(mixedRows())
    const stats = await fetchLeadDashboardStats(db.asDb())
    assert.equal(stats.total, LEAD_STATUSES.length - 1)
  })

  it('the hidden count matches the view, links to the spam view, and is absent at zero', async () => {
    const db = new FakeLeadsDb(mixedRows())
    assert.equal(await fetchSpamCount(DEFAULT_VIEW, db.asDb()), 3)
    assert.equal(await fetchSpamCount({ channel: 'referral', q: '' }, db.asDb()), 1)
    assert.equal(hiddenSpamLine(3), '3 spam hidden')
    assert.equal(hiddenSpamLine(1), '1 spam hidden')
    assert.equal(leadsListHref({ ...DEFAULT_VIEW, status: 'spam', page: 1 }), '/intel/leads?status=spam')

    const clean = new FakeLeadsDb([row(1, 'new'), row(2, 'won')])
    assert.equal(await fetchSpamCount(DEFAULT_VIEW, clean.asDb()), 0)
    assert.equal(hiddenSpamLine(0), null)
    assert.equal(hiddenSpamLine(null), null)
  })

  it('only spam: the default list is empty and the spam is counted as hidden', async () => {
    const db = new FakeLeadsDb([row(1, 'spam'), row(2, 'spam')])
    const result = await fetchLeads(DEFAULT_VIEW, db.asDb())
    assert.ok(result.ok)
    assert.equal(result.total, 0)
    assert.equal(result.filtersActive, false)
    assert.equal(await fetchSpamCount(DEFAULT_VIEW, db.asDb()), 2)
  })
})

describe('delete all spam', () => {
  it('removes only spam rows and leaves every other status untouched', async () => {
    const rows = mixedRows()
    const db = new FakeLeadsDb(rows)
    const result = await deleteSpamLeads(db.asDb(), { all: true })
    assert.ok(result.ok)
    assert.equal(result.deletedIds.length, 3)
    assert.deepEqual(
      db.rows.map((r) => r.status).sort(),
      LEAD_STATUSES.filter((s) => s !== 'spam').slice().sort(),
    )
    // The rule is in the delete query itself.
    assert.deepEqual(db.queries[0], [['from', 'contact_submissions'], ['delete'], ['eq', 'status', 'spam'], ['select', 'id', null]])
    // Every remaining row is unchanged.
    for (const kept of db.rows) assert.deepEqual(kept, rows.find((r) => r.id === kept.id))
  })

  it('the single-row delete uses the same path and still refuses non-spam', async () => {
    const db = new FakeLeadsDb([row(1, 'new'), row(2, 'spam')])
    const refused = await deleteSpamLeads(db.asDb(), { id: row(1, 'new').id })
    assert.ok(refused.ok)
    assert.deepEqual(refused.deletedIds, [])
    const done = await deleteSpamLeads(db.asDb(), { id: row(2, 'spam').id })
    assert.ok(done.ok)
    assert.deepEqual(done.deletedIds, [row(2, 'spam').id])
    assert.deepEqual(db.rows.map((r) => r.status), ['new'])
  })

  it('the confirmation states the count', () => {
    assert.equal(deleteAllSpamPrompt(4), 'Delete all 4 spam inquiries? This deletion is permanent.')
    assert.equal(deleteAllSpamPrompt(1), 'Delete 1 spam inquiry? This deletion is permanent.')
  })
})

describe('auto-flagged spam on the detail page', () => {
  it('says so only for spam with no status change in its history', () => {
    assert.match(autoSpamNote('spam', 0) ?? '', /^Marked as spam automatically when it was submitted/)
    assert.equal(autoSpamNote('spam', 1), null)
    assert.equal(autoSpamNote('new', 0), null)
  })
})

describe('the briefing receives what it did before', () => {
  it('its inquiry list query is unchanged: status new, no spam filter added', async () => {
    const db = new FakeLeadsDb(mixedRows())
    const result = await fetchLeads({ status: 'new', channel: 'all', q: '', sort: 'newest', page: 1 }, db.asDb())
    assert.deepEqual(db.queries[0], [
      ['from', 'contact_submissions'],
      ['select', 'id, name, company, service, status, initial_channel, notify_status, created_at', { count: 'exact' }],
      ['eq', 'status', 'new'],
      ['order', 'created_at', { ascending: false }],
      ['order', 'id', { ascending: false }],
      ['range', 0, 24],
    ])
    assert.ok(result.ok)
    assert.deepEqual(result.rows.map((r) => r.status), ['new'])
  })

  it('its new and delivery-issue counts are queried as before, and spam is not dropped from them', async () => {
    // A row marked spam by hand after its notification failed still counts as a delivery issue, as before.
    const db = new FakeLeadsDb([...mixedRows(), row(30, 'spam', { notify_status: 'failed' }), row(31, 'new', { notify_status: 'not_configured' })])
    const stats = await fetchLeadDashboardStats(db.asDb())
    assert.equal(stats.newCount, 2)
    assert.equal(stats.deliveryIssues, 2)
    const [, newQuery, activeQuery, deliveryQuery] = db.queries
    assert.deepEqual(newQuery, [['from', 'contact_submissions'], ['select', 'id', { count: 'exact', head: true }], ['eq', 'status', 'new']])
    assert.deepEqual(activeQuery, [
      ['from', 'contact_submissions'],
      ['select', 'id', { count: 'exact', head: true }],
      ['in', 'status', ['reviewing', 'contacted', 'discovery_scheduled', 'proposal_sent']],
    ])
    assert.deepEqual(deliveryQuery, [['from', 'contact_submissions'], ['select', 'id', { count: 'exact', head: true }], ['in', 'notify_status', ['failed', 'not_configured']]])
  })
})
