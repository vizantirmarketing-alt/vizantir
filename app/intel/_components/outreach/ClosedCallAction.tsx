'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

import { LogCallForm, type CallLead } from '@/app/intel/_components/outreach/AcceptedLeads'
import { TextAction } from '@/app/intel/_components/ui/TextAction'

export const CLOSED_CALL_HELP = 'Logging a new call with an outcome that does not close the lead reopens it.'

/**
 * A quiet correction path under Closed, for a lead closed by "Spoke: not
 * interested" or "Wrong number" (ClosedRow.canLogCall): the existing call
 * form, nothing more. Never shown for "Asked not to be contacted".
 */
export function ClosedCallAction({ lead }: { lead: CallLead }) {
  const router = useRouter()
  const [logging, setLogging] = useState(false)

  return (
    <div className="min-w-0">
      {!logging ? (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <TextAction onClick={() => setLogging(true)}>Log a call</TextAction>
          <p className="intel-secondary text-meta">{CLOSED_CALL_HELP}</p>
        </div>
      ) : (
        <LogCallForm
          row={lead}
          onCancel={() => setLogging(false)}
          onDone={() => {
            setLogging(false)
            router.refresh()
          }}
        />
      )}
    </div>
  )
}
