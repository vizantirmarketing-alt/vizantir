import { ContactAddress } from '@/app/intel/_components/outreach/ContactAddress'
import { DraftEmailAction } from '@/app/intel/_components/outreach/DraftEmailAction'
import { NewBusinessRowControls } from '@/app/intel/_components/new-businesses/NewBusinessRowControls'
import { WebsiteCell } from '@/app/intel/_components/new-businesses/WebsiteCell'
import { NewBusinessLeadChip } from '@/app/intel/_components/ui/StatusChip'
import { formatPeriod } from '@/lib/new-businesses/discovery'
import type { NewBusinessRow } from '@/lib/new-businesses/load'
import { PHONE_LABEL } from '@/lib/new-businesses/params'
import type { ContactNote } from '@/lib/outreach/contacts/view'

function address(row: Pick<NewBusinessRow, 'address' | 'suite' | 'city' | 'state' | 'zip'>): string {
  const street = [row.address, row.suite].filter(Boolean).join(', ')
  const place = [row.city, [row.state, row.zip].filter(Boolean).join(' ')].filter(Boolean).join(', ')
  return [street, place].filter(Boolean).join(' · ') || '—'
}

/**
 * One row per business. Presentational only: rows come from
 * fetchNewBusinesses. Scrolls inside its panel when the panel is narrower
 * than the table.
 */
export function NewBusinessesTable({
  rows,
  activeDrafts,
  contactNotes = null,
}: {
  rows: NewBusinessRow[]
  /** Active outreach draft ids by subject (group key, or row id before grouping). Null when they could not be read. */
  activeDrafts: ReadonlyMap<string, string> | null
  /** Contact address lines for accepted rows, by subject. Null when they could not be read. */
  contactNotes?: ReadonlyMap<string, ContactNote> | null
}) {
  return (
    <div className="max-w-full overflow-x-auto">
      <table className="w-full text-left intel-secondary">
        <thead>
          <tr className="border-b border-black/8">
            <th className="intel-th pr-3">Business</th>
            <th className="intel-th pr-3">Licenses</th>
            {/* Phone sits under the address to keep the table within its panel at 1280px. */}
            <th className="intel-th pr-3">Address · {PHONE_LABEL.toLowerCase()}</th>
            <th className="intel-th pr-3">Website</th>
            <th className="intel-th pr-3">Lead</th>
            <th className="intel-th">Review</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-black/8">
          {rows.map((row) => (
            <tr key={row.id} id={`business-${row.id}`} className="scroll-mt-4 align-top target:bg-cobalt-soft/40">
              <td className="min-w-44 py-2.5 pr-3">
                <span className="block font-medium text-foreground">{row.name}</span>
                {row.leadReason !== null ? (
                  <span className="mt-0.5 line-clamp-2 text-meta">{row.leadReason}</span>
                ) : null}
              </td>
              <td className="min-w-44 py-2.5 pr-3">
                <ul className="text-body">
                  {row.licenses.map((license) => (
                    <li key={license}>{license}</li>
                  ))}
                </ul>
                <span className="mt-0.5 block text-meta">{formatPeriod(row.latestPeriod)}</span>
              </td>
              <td className="min-w-44 py-2.5 pr-3 text-body">
                <span className="block">{address(row)}</span>
                <span className="block whitespace-nowrap">{row.phone ?? 'No phone'}</span>
              </td>
              <td className="min-w-36 max-w-56 py-2.5 pr-3">
                <WebsiteCell website={row.website} />
              </td>
              <td className="whitespace-nowrap py-2.5 pr-3">
                {row.leadTier !== null && row.leadScore !== null ? (
                  <span className="inline-flex items-center gap-2">
                    <NewBusinessLeadChip tier={row.leadTier} />
                    <span className="text-body" aria-label={`Score ${row.leadScore} of 100`}>
                      {row.leadScore}
                    </span>
                  </span>
                ) : (
                  <span className="text-meta">Not scored</span>
                )}
              </td>
              <td className="py-2.5">
                <NewBusinessRowControls id={row.id} reviewStatus={row.reviewStatus} ownerNote={row.ownerNote} />
                {row.reviewStatus === 'accepted' ? (
                  <div className="mt-1.5">
                    <DraftEmailAction
                      subjectType="new_business"
                      leadId={row.id}
                      activeDraftId={activeDrafts?.get(row.groupKey ?? row.id) ?? null}
                    />
                    {contactNotes !== null ? (
                      <div className="mt-1.5 max-w-64">
                        <ContactAddress note={contactNotes.get(row.groupKey ?? row.id) ?? null} subjectType="new_business" leadId={row.id} />
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
