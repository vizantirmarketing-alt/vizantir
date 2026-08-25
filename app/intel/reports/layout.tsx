export const dynamic = 'force-dynamic'

export default async function IntelReportsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <div className="min-h-svh bg-background">{children}</div>
}
