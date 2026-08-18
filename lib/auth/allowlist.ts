import 'server-only'

import { redirect } from 'next/navigation'
import type { User } from '@supabase/supabase-js'

import { serverEnv } from '@/lib/env/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

/** Single allowed operator. Override with INTEL_ALLOWED_EMAILS (comma-separated). */
const DEFAULT_ALLOWED_EMAILS = ['vizantirmarketing@gmail.com'] as const

export type IntelUser = User & { email: string }

function getAllowedEmails(): string[] {
  const fromEnv = serverEnv.INTEL_ALLOWED_EMAILS
  if (!fromEnv) {
    return [...DEFAULT_ALLOWED_EMAILS]
  }

  const parsed = fromEnv
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter((email) => email.length > 0)

  return parsed.length > 0 ? parsed : [...DEFAULT_ALLOWED_EMAILS]
}

export function isAllowedEmail(email: string | null | undefined): boolean {
  if (!email) return false
  return getAllowedEmails().includes(email.trim().toLowerCase())
}

/**
 * Single authorization boundary for Intel.
 * Every protected page and route must call this.
 */
export async function requireIntelUser(): Promise<IntelUser> {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const email = user?.email
  if (!user || !email || !isAllowedEmail(email)) {
    redirect('/intel/login')
  }

  return { ...user, email }
}
