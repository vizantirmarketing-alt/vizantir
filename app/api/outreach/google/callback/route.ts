import { cookies } from 'next/headers'

import { requireIntelUser } from '@/lib/auth/allowlist'
import { completeConnection } from '@/lib/outreach/gmail/connect'
import { createConnectDeps, readGmailConfig } from '@/lib/outreach/gmail/deps'
import { NOT_SET_UP } from '@/lib/outreach/gmail/connect'
import { OAUTH_COOKIE, OAUTH_COOKIE_PATH, redirectUriFor } from '@/lib/outreach/gmail/oauth'
import { createOutreachStore } from '@/lib/outreach/store'

import { backToOutreach } from '../redirect'

export const dynamic = 'force-dynamic'

/** Google returns here. The state cookie is cleared whatever the outcome. */
export async function GET(request: Request) {
  const user = await requireIntelUser()
  const url = new URL(request.url)
  const origin = url.origin
  const cookie = (await cookies()).get(OAUTH_COOKIE)?.value

  const finish = (ok: boolean, message: string) => {
    const response = backToOutreach(origin, { ok, message })
    response.cookies.set(OAUTH_COOKIE, '', { httpOnly: true, secure: true, sameSite: 'lax', path: OAUTH_COOKIE_PATH, maxAge: 0 })
    return response
  }

  const config = readGmailConfig()
  if (config === null) return finish(false, NOT_SET_UP)
  const redirectUri = redirectUriFor(origin)
  if (redirectUri === null) return finish(false, 'Google can only be connected from the live dashboard or from local development.')

  try {
    const settings = await createOutreachStore().getSettings()
    const result = await completeConnection(createConnectDeps(config), {
      code: url.searchParams.get('code'),
      state: url.searchParams.get('state'),
      error: url.searchParams.get('error'),
      cookie,
      redirectUri,
      replyTo: settings?.replyToEmail ?? '',
      connectedBy: user.email,
    })
    return result.ok ? finish(true, `Connected ${result.email}. Approved emails can now be sent from the dashboard.`) : finish(false, result.message)
  } catch {
    console.error('Outreach Google callback failed')
    return finish(false, 'The connection could not be saved. Nothing was stored. Try again shortly.')
  }
}
