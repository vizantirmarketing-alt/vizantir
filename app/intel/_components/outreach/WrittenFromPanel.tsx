import { Panel } from '@/app/intel/_components/ui/Panel'
import type { BasisItem } from '@/lib/outreach/context'
import { parseHttpUrl } from '@/lib/new-businesses/website-hosts'

/** A stored source link: http and https only, opened without referrer or opener, marked nofollow. */
function SourceLink({ href }: { href: string }) {
  const url = parseHttpUrl(href)
  if (url === null) return null
  const label = `${url.hostname.replace(/^www\./, '')}${url.pathname === '/' ? '' : url.pathname}`
  return (
    <a
      href={url.toString()}
      target="_blank"
      rel="noopener noreferrer nofollow"
      className="inline-block max-w-full truncate align-bottom intel-body text-cobalt-text underline-offset-2 hover:underline"
    >
      {label}
    </a>
  )
}

/**
 * What the draft was written from: the same selection the drafting makes,
 * computed from the lead as it is now. null means the lead could not be loaded.
 */
export function WrittenFromPanel({ items }: { items: BasisItem[] | null }) {
  return (
    <Panel title="Written from">
      {items === null ? (
        <p className="intel-body text-body">This lead can no longer be loaded, so what the email was written from cannot be shown.</p>
      ) : (
        <>
          <p className="intel-secondary text-meta">Check the claim in the email against these before approving.</p>
          {items.length === 0 ? (
            <p className="mt-3 intel-body text-body">No findings are stored for this lead.</p>
          ) : (
            <ul className="mt-3 divide-y divide-black/8">
              {items.map((item, i) => (
                <li key={`${i}-${item.label}`} className="min-w-0 py-3 first:pt-0 last:pb-0">
                  <p className="intel-secondary font-medium text-foreground">{item.label}</p>
                  <p className="mt-1 intel-body leading-relaxed text-body [overflow-wrap:anywhere]">{item.text}</p>
                  {item.sourceUrl !== null ? (
                    <div className="mt-1 min-w-0">
                      <SourceLink href={item.sourceUrl} />
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </Panel>
  )
}
