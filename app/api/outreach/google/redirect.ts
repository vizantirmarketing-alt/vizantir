import 'server-only'

import { NextResponse } from 'next/server'

import { RESULT_COOKIE, RESULT_COOKIE_MAX_AGE, RESULT_COOKIE_PATH, RESULT_PARAM, encodeNotice, type ConnectionNotice } from '@/lib/outreach/gmail/flash'

const NO_STORE = 'private, no-cache, no-store, must-revalidate, max-age=0'

/** Back to Outreach with the result in a one-minute cookie. */
export function backToOutreach(origin: string, notice: ConnectionNotice): NextResponse {
  const url = new URL('/intel/outreach', origin)
  url.searchParams.set(RESULT_PARAM, '1')
  const response = NextResponse.redirect(url, 303)
  response.headers.set('Cache-Control', NO_STORE)
  response.cookies.set(RESULT_COOKIE, encodeNotice(notice), {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: RESULT_COOKIE_PATH,
    maxAge: RESULT_COOKIE_MAX_AGE,
  })
  return response
}

export function redirectUncached(url: string): NextResponse {
  const response = NextResponse.redirect(url, 303)
  response.headers.set('Cache-Control', NO_STORE)
  return response
}
