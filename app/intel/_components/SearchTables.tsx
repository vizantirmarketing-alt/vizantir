import type { QueryAggregate, QueryMover } from '@/lib/intel/search'

import {
  formatClickDelta,
  formatQueryCount,
  formatQueryCtr,
  formatQueryPosition,
} from '@/app/intel/_components/SearchSurface'
import { Panel } from '@/app/intel/_components/ui/Panel'

function TableHead({ columns }: { columns: readonly string[] }) {
  return (
    <thead>
      <tr className="border-b border-black/8">
        {columns.map((column, index) => (
          <th
            key={column}
            className={
              index === columns.length - 1
                ? 'py-1.5 text-[0.7rem] font-medium uppercase tracking-[0.18em] text-meta'
                : 'py-1.5 pr-4 text-[0.7rem] font-medium uppercase tracking-[0.18em] text-meta'
            }
          >
            {column}
          </th>
        ))}
      </tr>
    </thead>
  )
}

export function SearchTopQueries({ rows }: { rows: readonly QueryAggregate[] }) {
  return (
    <Panel title="Top queries">
      {rows.length === 0 ? (
        <p className="text-sm leading-relaxed text-body">
          No queries in this range.
        </p>
      ) : (
        <div>
          <ul className="divide-y divide-black/8 lg:hidden">
            {rows.map((row) => (
              <li key={row.query} className="py-2">
                <p className="text-sm font-medium text-foreground">
                  {row.query}
                </p>
                <p className="mt-1 text-sm tabular-nums text-body">
                  {formatQueryCount(row.clicks)} clicks
                  <span aria-hidden className="px-2">
                    ·
                  </span>
                  {formatQueryCount(row.impressions)} impressions
                </p>
                <p className="mt-1 text-sm tabular-nums text-meta">
                  {formatQueryCtr(row.ctr)} CTR
                  <span aria-hidden className="px-2">
                    ·
                  </span>
                  Position {formatQueryPosition(row.position)}
                </p>
              </li>
            ))}
          </ul>

          <div className="hidden lg:block">
            <table className="w-full border-collapse text-left text-sm">
              <caption className="sr-only">
                Top queries by impressions
              </caption>
              <TableHead
                columns={['Query', 'Clicks', 'Impressions', 'CTR', 'Position']}
              />
              <tbody>
                {rows.map((row) => (
                  <tr key={row.query} className="border-b border-black/8">
                    <td className="max-w-[22rem] py-[5px] pr-4 font-medium text-foreground">
                      {row.query}
                    </td>
                    <td className="whitespace-nowrap py-[5px] pr-4 tabular-nums text-body">
                      {formatQueryCount(row.clicks)}
                    </td>
                    <td className="whitespace-nowrap py-[5px] pr-4 tabular-nums text-body">
                      {formatQueryCount(row.impressions)}
                    </td>
                    <td className="whitespace-nowrap py-[5px] pr-4 tabular-nums text-body">
                      {formatQueryCtr(row.ctr)}
                    </td>
                    <td className="whitespace-nowrap py-[5px] tabular-nums text-body">
                      {formatQueryPosition(row.position)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Panel>
  )
}

function MoverList({
  title,
  rows,
  caption,
}: {
  title: string
  rows: readonly QueryMover[]
  caption: string
}) {
  if (rows.length === 0) {
    return (
      <div>
        <h3 className="text-sm font-medium text-foreground">{title}</h3>
        <p className="mt-3 text-sm leading-relaxed text-body">
          None in this range.
        </p>
      </div>
    )
  }

  return (
    <div>
      <h3 className="text-sm font-medium text-foreground">{title}</h3>
      <ul className="mt-3 divide-y divide-black/8 lg:hidden">
        {rows.map((row) => (
          <li key={row.query} className="py-2">
            <p className="text-sm font-medium text-foreground">{row.query}</p>
            <p className="mt-1 text-sm tabular-nums text-body">
              {formatClickDelta(row.delta)} clicks
              <span aria-hidden className="px-2">
                ·
              </span>
              {formatQueryCount(row.clicks)} now
              <span aria-hidden className="px-2">
                ·
              </span>
              {formatQueryCount(row.priorClicks)} prior
            </p>
          </li>
        ))}
      </ul>
      <div className="mt-3 hidden lg:block">
        <table className="w-full border-collapse text-left text-sm">
          <caption className="sr-only">{caption}</caption>
          <TableHead columns={['Query', 'Delta', 'Now', 'Prior']} />
          <tbody>
            {rows.map((row) => (
              <tr key={row.query} className="border-b border-black/8">
                <td className="max-w-[18rem] py-[5px] pr-4 font-medium text-foreground">
                  {row.query}
                </td>
                <td className="whitespace-nowrap py-[5px] pr-4 tabular-nums text-body">
                  {formatClickDelta(row.delta)}
                </td>
                <td className="whitespace-nowrap py-[5px] pr-4 tabular-nums text-body">
                  {formatQueryCount(row.clicks)}
                </td>
                <td className="whitespace-nowrap py-[5px] tabular-nums text-body">
                  {formatQueryCount(row.priorClicks)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function SearchMovers({
  gaining,
  losing,
}: {
  gaining: readonly QueryMover[]
  losing: readonly QueryMover[]
}) {
  return (
    <Panel title="Movers">
      <div className="grid gap-6 lg:grid-cols-2">
        <MoverList
          title="Gaining clicks"
          rows={gaining}
          caption="Queries gaining clicks versus the prior period"
        />
        <MoverList
          title="Losing clicks"
          rows={losing}
          caption="Queries losing clicks versus the prior period"
        />
      </div>
    </Panel>
  )
}

export function SearchNearPageOne({
  rows,
}: {
  rows: readonly QueryAggregate[]
}) {
  return (
    <Panel title="Close to page one">
      {rows.length === 0 ? (
        <p className="text-sm leading-relaxed text-body">
          No queries sit between positions 8 and 20 with enough impressions.
        </p>
      ) : (
        <div>
          <ul className="divide-y divide-black/8 lg:hidden">
            {rows.map((row) => (
              <li key={row.query} className="py-2">
                <p className="text-sm font-medium text-foreground">
                  {row.query}
                </p>
                <p className="mt-1 text-sm tabular-nums text-body">
                  Position {formatQueryPosition(row.position)}
                  <span aria-hidden className="px-2">
                    ·
                  </span>
                  {formatQueryCount(row.impressions)} impressions
                </p>
              </li>
            ))}
          </ul>

          <div className="hidden lg:block">
            <table className="w-full border-collapse text-left text-sm">
              <caption className="sr-only">
                Queries close to page one
              </caption>
              <TableHead columns={['Query', 'Position', 'Impressions']} />
              <tbody>
                {rows.map((row) => (
                  <tr key={row.query} className="border-b border-black/8">
                    <td className="max-w-[22rem] py-[5px] pr-4 font-medium text-foreground">
                      {row.query}
                    </td>
                    <td className="whitespace-nowrap py-[5px] pr-4 tabular-nums text-body">
                      {formatQueryPosition(row.position)}
                    </td>
                    <td className="whitespace-nowrap py-[5px] tabular-nums text-body">
                      {formatQueryCount(row.impressions)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Panel>
  )
}
