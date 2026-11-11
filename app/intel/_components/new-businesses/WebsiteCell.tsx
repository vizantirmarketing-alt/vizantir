import { WebsiteStatusChip } from '@/app/intel/_components/ui/StatusChip'
import type { NewBusinessWebsite } from '@/lib/new-businesses/load'
import { parseHttpUrl } from '@/lib/new-businesses/website-hosts'

/**
 * A link to a URL the research runner reported. Rendered only for http and
 * https URLs, never followed by the server, and opened without referrer or
 * opener and marked nofollow.
 */
function ExternalLink({ href }: { href: string }) {
  const url = parseHttpUrl(href)
  if (url === null) return null
  const label = `${url.hostname.replace(/^www\./, '')}${url.pathname === '/' ? '' : url.pathname}`
  return (
    <a
      href={url.toString()}
      target="_blank"
      rel="noopener noreferrer nofollow"
      className="break-all text-cobalt-text underline-offset-2 hover:underline"
    >
      {label}
    </a>
  )
}

/** The website check result: a status chip, the URL found, and the evidence on demand. */
export function WebsiteCell({ website }: { website: NewBusinessWebsite | null }) {
  if (website === null) return null
  const hasEvidence = website.searches.length > 0 || website.candidates.length > 0
  return (
    <div className="min-w-0 space-y-1">
      <WebsiteStatusChip status={website.status} />
      {website.url !== null ? (
        <div>
          <ExternalLink href={website.url} />
        </div>
      ) : null}
      {hasEvidence ? (
        <details className="text-meta">
          <summary className="cursor-pointer text-cobalt-text underline-offset-2 hover:underline">Evidence</summary>
          <div className="mt-1 space-y-1.5">
            {website.searches.length > 0 ? (
              <div>
                <p className="font-medium text-body">Searches</p>
                <ul className="list-disc pl-5">
                  {website.searches.map((search, i) => (
                    <li key={`${i}-${search}`}>{search}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {website.candidates.length > 0 ? (
              <div>
                <p className="font-medium text-body">Pages found</p>
                <ul className="space-y-1">
                  {website.candidates.map((candidate, i) => (
                    <li key={`${i}-${candidate.url}`}>
                      <q className="text-body">{candidate.excerpt}</q>{' '}
                      <ExternalLink href={candidate.url} />
                      {candidate.accepted ? null : <span> · did not match this business</span>}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </details>
      ) : null}
    </div>
  )
}
