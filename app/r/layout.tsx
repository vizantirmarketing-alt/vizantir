import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Report',
  robots: { index: false, follow: false },
}

export default function PublicReportLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <div className="min-h-svh bg-background">{children}</div>
}
