import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

import { GoogleConnection } from '@/app/intel/_components/outreach/GoogleConnection'
import { OutreachSettingsForm } from '@/app/intel/_components/outreach/OutreachSettingsForm'
import { SuppressionList } from '@/app/intel/_components/outreach/SuppressionList'
import { Panel } from '@/app/intel/_components/ui/Panel'
import { requireIntelUser } from '@/lib/auth/allowlist'
import { createOutreachStore } from '@/lib/outreach/deps'
import { createGmailConnectionStore, readGmailConfig } from '@/lib/outreach/gmail/deps'
import { RESULT_COOKIE, RESULT_PARAM, decodeNotice, type ConnectionNotice } from '@/lib/outreach/gmail/flash'
import { connectionView, type ConnectionView } from '@/lib/outreach/gmail/view'
import type { OutreachSettings, Suppression } from '@/lib/outreach/types'
import { setupNotice } from '@/lib/outreach/worklist'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Outreach settings',
  robots: { index: false, follow: false },
}

type Loaded =
  | { ok: true; settings: OutreachSettings | null; suppressions: Suppression[]; connection: ConnectionView }
  | { ok: false }

async function load(): Promise<Loaded> {
  try {
    const store = createOutreachStore()
    const [settings, suppressions, connection] = await Promise.all([
      store.getSettings(),
      store.listSuppressions(),
      createGmailConnectionStore().get(),
    ])
    return { ok: true, settings, suppressions, connection: connectionView(readGmailConfig(), connection, settings?.replyToEmail ?? null) }
  } catch {
    console.error('Outreach settings load failed')
    return { ok: false }
  }
}

/** The connection result, shown once after Google sends the owner back here. */
async function connectionNotice(searchParams: Promise<Record<string, string | string[] | undefined>>): Promise<ConnectionNotice | null> {
  if ((await searchParams)[RESULT_PARAM] !== '1') return null
  return decodeNotice((await cookies()).get(RESULT_COOKIE)?.value)
}

export default async function OutreachSettingsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireIntelUser()
  const [data, notice] = await Promise.all([load(), connectionNotice(searchParams)])
  const setup = data.ok ? setupNotice(data.settings, data.connection) : null

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <Link
        href="/intel/outreach"
        className="inline-flex items-baseline gap-1 intel-body text-foreground transition-colors hover:text-cobalt-primary"
      >
        <ArrowLeft className="size-[1em]" aria-hidden />
        Outreach
      </Link>
      <div className="min-w-0">
        <h1 className="intel-title text-foreground">Outreach settings</h1>
        <p className="mt-1 intel-secondary text-meta">
          Who emails are from, the addresses never to write to, and the Google connection for sending from the dashboard.
        </p>
      </div>

      {setup !== null ? (
        <p className="intel-body text-warning-severe" role="status">
          {setup}
        </p>
      ) : null}

      {!data.ok ? (
        <Panel>
          <p className="intel-body leading-relaxed text-body" role="alert">
            Unable to load Outreach settings. Try again shortly.
          </p>
        </Panel>
      ) : (
        <>
          <Panel title="Settings">
            <div className="@container">
              <OutreachSettingsForm settings={data.settings} />
            </div>
          </Panel>
          <Panel title="Direct sending">
            <GoogleConnection view={data.connection} notice={notice} />
          </Panel>
          <Panel title="Do not contact">
            <SuppressionList entries={data.suppressions} />
          </Panel>
        </>
      )}
    </div>
  )
}
