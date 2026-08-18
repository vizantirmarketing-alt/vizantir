import { NextResponse } from 'next/server'

import { isAllowedEmail } from '@/lib/auth/allowlist'
import { createSupabaseServerClient } from '@/lib/supabase/server'

function loginErrorUrl(origin: string): URL {
  const url = new URL('/intel/login', origin)
  url.searchParams.set('error', 'auth')
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
    return redirectUncached(loginErrorUrl(origin))
  }

  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return redirectUncached(loginErrorUrl(origin))
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!isAllowedEmail(user?.email)) {
    await supabase.auth.signOut()
    return redirectUncached(loginErrorUrl(origin))
  }

  return redirectUncached(new URL('/intel', origin))
}
