'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { TextAction } from '@/app/intel/_components/ui/TextAction'
import type { ConnectionNotice } from '@/lib/outreach/gmail/flash'
import type { ConnectionView } from '@/lib/outreach/gmail/view'
import { formatShortDate } from '@/lib/prospects/params'

import { disconnectGoogle } from '@/app/intel/(app)/outreach/actions'

const START_HREF = '/api/outreach/google/start'

const linkActionClassName =
  '-mx-1 inline-flex items-center rounded px-1 intel-body font-medium text-cobalt-text underline-offset-2 transition-colors hover:bg-cobalt-soft hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt-focus'

/**
 * Direct sending: connect the Google account that sends as the reply-to
 * address (the address itself, or an account on its Workspace domain that
 * has it as an alias), reconnect when
 * Google stops accepting the connection, or disconnect.
 */
export function GoogleConnection({ view, notice }: { view: ConnectionView; notice: ConnectionNotice | null }) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function onDisconnect() {
    setError(null)
    setMessage(null)
    startTransition(async () => {
      const result = await disconnectGoogle()
      setConfirming(false)
      if (!result.ok) {
        setError(result.error)
        return
      }
      setMessage(result.message ?? 'Disconnected.')
      router.refresh()
    })
  }

  return (
    <div className="space-y-3" aria-busy={pending}>
      {notice !== null ? (
        <p className={`intel-body ${notice.ok ? 'text-body' : 'text-warning-severe'} [overflow-wrap:anywhere]`} role={notice.ok ? 'status' : 'alert'}>
          {notice.message}
        </p>
      ) : null}

      {view.state === 'not_set_up' ? (
        <p className="intel-body text-body">Direct sending is not set up yet.</p>
      ) : view.state === 'not_connected' ? (
        <>
          <p className="intel-body text-body">
            Connect the Google account for your reply-to address to send approved emails from the dashboard, one at a time. On a Workspace domain this can be the main account the reply-to address is an alias of.
          </p>
          <Button asChild size="sm" className="bg-cobalt-primary intel-secondary text-white hover:bg-[#1E85FF]">
            <a href={START_HREF}>Connect Google</a>
          </Button>
        </>
      ) : (
        <>
          <div className="min-w-0">
            {view.sendsAs === null ? (
              <p className="intel-body text-foreground [overflow-wrap:anywhere]">{view.email}</p>
            ) : (
              <p className="intel-body text-foreground [overflow-wrap:anywhere]">
                Connected as {view.email}. Emails go out as {view.sendsAs}.
              </p>
            )}
            <p className="intel-secondary text-meta">Connected {formatShortDate(view.connectedAt)}</p>
          </div>
          {view.sendsAs !== null && view.fits ? (
            <p className="intel-secondary text-meta">
              The sending address must be listed under Send mail as in Gmail settings, or Gmail will replace it with the connected address.
            </p>
          ) : null}
          {!view.fits ? (
            <p className="intel-body text-warning-severe" role="alert">
              This account cannot send as the reply-to address in settings. Reconnect with an account that can, or correct the reply-to address.
            </p>
          ) : null}
          {view.state === 'needs_reconnect' ? (
            <p className="intel-body text-warning-severe" role="alert">
              Google no longer accepts this connection. Reconnect to send from the dashboard again.
            </p>
          ) : null}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <a href={START_HREF} className={linkActionClassName}>
              Reconnect
            </a>
            {confirming ? (
              <>
                <TextAction tone="destructive" pending={pending} pendingLabel="Disconnecting…" onClick={onDisconnect}>
                  Confirm disconnect
                </TextAction>
                <TextAction disabled={pending} onClick={() => setConfirming(false)}>
                  Cancel
                </TextAction>
              </>
            ) : (
              <TextAction tone="destructive" onClick={() => setConfirming(true)}>
                Disconnect
              </TextAction>
            )}
          </div>
        </>
      )}

      {view.state !== 'not_set_up' ? (
        <p className="intel-secondary text-meta">Sending permission only. The dashboard cannot read your mail.</p>
      ) : null}
      {message !== null ? (
        <p className="intel-body text-body" role="status">
          {message}
        </p>
      ) : null}
      {error !== null ? (
        <p className="intel-body text-warning-severe" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
