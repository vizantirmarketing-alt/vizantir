import type { ReactNode } from 'react'
import { ChevronRight } from 'lucide-react'

/**
 * A panel that starts closed: native details and summary, styled like Panel.
 * The summary shows the title and a one-line status, so the owner can tell
 * whether to open it without opening it.
 */
export function CollapsedSection({ title, status, children }: { title: string; status: string; children: ReactNode }) {
  return (
    <details className="group min-w-0 rounded-xl border border-black/8 bg-white px-4 py-3 md:px-5 md:py-4">
      <summary className="-mx-1 flex min-w-0 cursor-pointer list-none flex-wrap items-baseline gap-x-3 gap-y-0.5 rounded px-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt-focus [&::-webkit-details-marker]:hidden">
        <span className="inline-flex items-center gap-1.5 intel-eyebrow text-meta">
          <ChevronRight className="size-4 shrink-0 transition-transform group-open:rotate-90 motion-reduce:transition-none" aria-hidden />
          {title}
        </span>
        <span className="min-w-0 intel-secondary text-meta [overflow-wrap:anywhere]">{status}</span>
      </summary>
      <div className="mt-3 min-w-0">{children}</div>
    </details>
  )
}
