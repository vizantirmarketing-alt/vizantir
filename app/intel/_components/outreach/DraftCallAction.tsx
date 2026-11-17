'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { LogCallForm, PhoneLink, type CallLead } from '@/app/intel/_components/outreach/AcceptedLeads'

const primaryClassName = 'bg-cobalt-primary intel-secondary text-white hover:bg-[#1E85FF]'

/**
 * The phone and "Log a call" for a draft with no recipient, when no email
 * address is published for the lead (draftCallPhone). Shown on the draft's
 * Needs review line and on its page. Nothing is dialled by the dashboard.
 */
export function DraftCallAction({ lead, phone }: { lead: CallLead; phone: string }) {
  const router = useRouter()
  const [logging, setLogging] = useState(false)
  const [saved, setSaved] = useState(false)

  return (
    <div className="min-w-0">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <p className="intel-secondary text-meta">
          No email address is published. Call <PhoneLink phone={phone} />.
        </p>
        {!logging ? (
          <Button
            type="button"
            size="sm"
            onClick={() => {
              setSaved(false)
              setLogging(true)
            }}
            className={primaryClassName}
          >
            Log a call
          </Button>
        ) : null}
      </div>
      {saved ? (
        <p className="intel-secondary text-meta" role="status">
          Call saved.
        </p>
      ) : null}
      {logging ? (
        <LogCallForm
          row={lead}
          onCancel={() => setLogging(false)}
          onDone={() => {
            setLogging(false)
            setSaved(true)
            router.refresh()
          }}
        />
      ) : null}
    </div>
  )
}
