import { requireIntelUser } from '@/lib/auth/allowlist'
import { startConnection } from '@/lib/outreach/gmail/connect'
import { readGmailConfig } from '@/lib/outreach/gmail/deps'
import { OAUTH_COOKIE, OAUTH_COOKIE_MAX_AGE, OAUTH_COOKIE_PATH } from '@/lib/outreach/gmail/oauth'
import { createOutreachStore } from '@/lib/outreach/store'

import { backToOutreach, redirectUncached } from '../redirect'

export const dynamic = 'force-dynamic'

/** Sends the owner to Google to grant sending permission for the reply-to mailbox. */
export async function GET(request: Request) {
  await requireIntelUser()
  const origin = new URL(request.url).origin

  let replyTo = ''
  try {
    replyTo = (await createOutreachStore().getSettings())?.replyToEmail ?? ''
  } catch {
    console.error('Outreach Google start: settings read failed')
    return backToOutreach(origin, { ok: false, message: 'Unable to read Outreach settings. Try again shortly.' })
  }

  const started = startConnection(readGmailConfig(), origin, replyTo)
  if (!started.ok) return backToOutreach(origin, { ok: false, message: started.message })

  const response = redirectUncached(started.url)
  response.cookies.set(OAUTH_COOKIE, started.cookie, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: OAUTH_COOKIE_PATH,
    maxAge: OAUTH_COOKIE_MAX_AGE,
  })
  return response
}
