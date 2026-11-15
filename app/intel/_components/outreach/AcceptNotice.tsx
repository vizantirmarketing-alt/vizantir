'use client'

import { createContext, useContext, useState, type ReactNode } from 'react'
import Link from 'next/link'

import { TextAction } from '@/app/intel/_components/ui/TextAction'

/** "{name} accepted. It is now in Outreach." Stays until dismissed or the page is left. */
export function AcceptedNotice({ name, onDismiss }: { name: string; onDismiss: () => void }) {
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border border-black/10 bg-cobalt-soft/40 px-3 py-2" role="status">
      <p className="min-w-0 intel-body text-body [overflow-wrap:anywhere]">
        {name} accepted. It is now in{' '}
        <Link href="/intel/outreach" className="font-medium text-cobalt-text underline underline-offset-2 hover:text-cobalt-primary">
          Outreach
        </Link>
        .
      </p>
      <TextAction onClick={onDismiss}>Dismiss</TextAction>
    </div>
  )
}

type AcceptNoticeState = { name: string | null; announce: (name: string) => void; dismiss: () => void }

const AcceptNoticeContext = createContext<AcceptNoticeState | null>(null)

/**
 * Holds the confirmation above a list, so it stays visible when the accepted
 * row leaves the list because of the current filter.
 */
export function AcceptNoticeProvider({ children }: { children: ReactNode }) {
  const [name, setName] = useState<string | null>(null)
  return (
    <AcceptNoticeContext.Provider value={{ name, announce: setName, dismiss: () => setName(null) }}>{children}</AcceptNoticeContext.Provider>
  )
}

/** Where the provider's confirmation shows. Renders nothing until a lead is accepted. */
export function AcceptNoticeSlot() {
  const state = useContext(AcceptNoticeContext)
  if (state === null || state.name === null) return null
  return <AcceptedNotice name={state.name} onDismiss={state.dismiss} />
}

/** Announces an accept to the nearest provider; null outside one. */
export function useAnnounceAccepted(): ((name: string) => void) | null {
  return useContext(AcceptNoticeContext)?.announce ?? null
}
