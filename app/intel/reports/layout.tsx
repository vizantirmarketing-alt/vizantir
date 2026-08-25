import { requireIntelUser } from '@/lib/auth/allowlist'

export const dynamic = 'force-dynamic'

export default async function IntelReportsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireIntelUser()

  return <div className="min-h-svh bg-background">{children}</div>
}
