'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { TextAction } from '@/app/intel/_components/ui/TextAction'
import { writeItYourselfHref } from '@/lib/outreach/links'
import { NO_FINDING_TEXT, type OutreachSubjectType } from '@/lib/outreach/params'

import { writeOutreachDraft } from '@/app/intel/(app)/outreach/actions'

/**
 * "Draft email" for an accepted lead, or "View draft" when the lead already
 * has a draft that needs review or is approved. A lead with nothing specific
 * known (hasSpecificFinding) gets the reason and "Write it yourself" instead.
 */
export function DraftEmailAction({
  subjectType,
  leadId,
  activeDraftId,
  hasFinding,
}: {
  subjectType: OutreachSubjectType
  leadId: string
  activeDraftId: string | null
  hasFinding: boolean
}) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  if (activeDraftId !== null) {
    return (
      <Link
        href={`/intel/outreach/${activeDraftId}`}
        className="-mx-1 inline-flex rounded px-1 intel-body font-medium text-cobalt-text underline-offset-2 transition-colors hover:bg-cobalt-soft hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt-focus"
      >
        View draft
      </Link>
    )
  }

  if (!hasFinding) {
    return (
      <div className="space-y-1">
        <p className="intel-secondary text-meta">{NO_FINDING_TEXT}</p>
        <Link
          href={writeItYourselfHref({ subjectType, leadId })}
          className="-mx-1 inline-flex rounded px-1 intel-body font-medium text-cobalt-text underline-offset-2 transition-colors hover:bg-cobalt-soft hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt-focus"
        >
          Write it yourself
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-1">
      <TextAction
        pending={pending}
        pendingLabel="Drafting…"
        onClick={() => {
          setError(null)
          startTransition(async () => {
            const result = await writeOutreachDraft(subjectType, leadId)
            if (result.ok) router.push(`/intel/outreach/${result.draftId}`)
            else setError(result.error)
          })
        }}
      >
        Draft email
      </TextAction>
      {error !== null ? (
        <p className="intel-secondary text-warning-severe" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
