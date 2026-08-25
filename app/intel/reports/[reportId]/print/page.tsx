import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { MonthlyReport } from '@/app/intel/reports/_components/MonthlyReport'
import { isReportId, loadReport } from '@/lib/reports/load'
import { verifyPrintToken } from '@/lib/reports/print-token'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Report',
  robots: { index: false, follow: false },
}

type PrintPageProps = {
  params: Promise<{ reportId: string }>
  searchParams: Promise<{ token?: string | string[] }>
}

export default async function IntelReportPrintPage({
  params,
  searchParams,
}: PrintPageProps) {
  const { reportId } = await params
  const query = await searchParams
  const secret = process.env.CRON_SECRET
  const token = readToken(query.token)

  if (!secret || !token || !isReportId(reportId)) {
    notFound()
  }

  if (!verifyPrintToken(token, reportId, secret)) {
    notFound()
  }

  const result = await loadReport(reportId)
  if (!result.ok) {
    notFound()
  }

  return (
    <div className="[&_.report-preview-only]:hidden">
      <MonthlyReport document={result.document} />
    </div>
  )
}

function readToken(value: string | string[] | undefined): string | null {
  if (typeof value !== 'string' || value.length === 0) {
    return null
  }
  return value
}
