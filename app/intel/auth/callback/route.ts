import { NextResponse } from 'next/server'

import { isAllowedEmail } from '@/lib/auth/allowlist'
import { createSupabaseServerClient } from '@/lib/supabase/server'

// TEMP: distinct error query params for diagnosing Google OAuth failures. Revert to a single 'auth' value once the cause is found.
type LoginErrorCode = 'no_code' | 'exchange' | 'no_user' | 'not_allowed'

function loginErrorUrl(origin: string, error: LoginErrorCode): URL {
  const url = new URL('/intel/login', origin)
  url.searchParams.set('error', error)
  return url
}

function redirectUncached(url: URL) {
  const response = NextResponse.redirect(url)
  response.headers.set(
    'Cache-Control',
    'private, no-cache, no-store, must-revalidate, max-age=0',
  )
  return response
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const origin = requestUrl.origin
  const code = requestUrl.searchParams.get('code')

  if (!code) {
    console.error('Intel auth callback: no code was present')
    return redirectUncached(loginErrorUrl(origin, 'no_code'))
  }

  const supabase = await createSupabaseServerClient()
  await supabase.auth.signOut()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    console.error('Intel auth callback: exchangeCodeForSession error', error)
    return redirectUncached(loginErrorUrl(origin, 'exchange'))
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    console.error('Intel auth callback: getUser returned no user')
    await supabase.auth.signOut()
    return redirectUncached(loginErrorUrl(origin, 'no_user'))
  }

  if (!isAllowedEmail(user.email)) {
    console.error('Intel auth callback: email was rejected')
    await supabase.auth.signOut()
    return redirectUncached(loginErrorUrl(origin, 'not_allowed'))
  }

  return redirectUncached(new URL('/intel', origin))
}
