import { requireIntelUser } from '@/lib/auth/allowlist'
import { IntelShell } from '@/app/intel/_components/IntelShell'

export const dynamic = 'force-dynamic'

export default async function IntelAppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await requireIntelUser()

  return <IntelShell email={user.email}>{children}</IntelShell>
}
