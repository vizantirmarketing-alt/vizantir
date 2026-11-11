import type { ReactNode } from 'react'
import { cookies } from 'next/headers'

import { IntelShellFrame } from '@/app/intel/_components/IntelShellFrame'
import { SIDEBAR_COOKIE, parseSidebarCookie } from '@/lib/intel/sidebar'

/**
 * Server half of the Intel shell. Reads the sidebar preference cookie so the
 * first paint already has the right layout (no flash, no hydration mismatch).
 * Rendered by app/intel/(app)/layout.tsx and by app/intel/reports/page.tsx,
 * which sits outside that layout; both get the preference without changes.
 */
export async function IntelShell({ email, children }: { email: string; children: ReactNode }) {
  const initialSidebar = parseSidebarCookie((await cookies()).get(SIDEBAR_COOKIE)?.value)
  return (
    <IntelShellFrame email={email} initialSidebar={initialSidebar}>
      {children}
    </IntelShellFrame>
  )
}
