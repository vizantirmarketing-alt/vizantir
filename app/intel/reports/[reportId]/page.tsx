import type { Metadata } from 'next'

import { MonthlyReport } from '@/app/intel/reports/_components/MonthlyReport'
import { requireIntelUser } from '@/lib/auth/allowlist'
import { isReportId, loadReport } from '@/lib/reports/load'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Report',
  robots: { index: false, follow: false },
}

type ReportPageProps = {
  params: Promise<{ reportId: string }>
}

export default async function IntelReportPreviewPage({
  params,
}: ReportPageProps) {
  await requireIntelUser()

  const { reportId } = await params
  if (!isReportId(reportId)) {
    return <ReportStateMessage title="Report not found" body="No report exists for this address." />
  }

  const result = await loadReport(reportId)

  if (!result.ok && result.reason === 'not_found') {
    return <ReportStateMessage title="Report not found" body="No report exists for this address." />
  }

  if (!result.ok && result.reason === 'malformed') {
    return (
      <ReportStateMessage
        title="Snapshot unreadable"
        body="This report exists, but its snapshot is missing, the wrong version, or malformed. It cannot be rendered from the stored record."
      />
    )
  }

  if (!result.ok) {
    return (
      <ReportStateMessage
        title="Unable to load report"
        body="The report could not be loaded. Try again shortly."
      />
    )
  }

  return <MonthlyReport document={result.document} />
}

function ReportStateMessage({
  title,
  body,
}: {
  title: string
  body: string
}) {
  return (
    <div className="report-document mx-auto w-full max-w-[40rem] px-5 py-16 sm:px-8">
      <p className="text-[0.7rem] font-medium uppercase tracking-[0.22em] text-cobalt-primary">
        Vizantir
      </p>
      <h1 className="mt-6 text-[1.65rem] font-medium tracking-tight text-foreground">
        {title}
      </h1>
      <p className="mt-4 text-[0.95rem] leading-[1.65] text-body">{body}</p>
    </div>
  )
}
