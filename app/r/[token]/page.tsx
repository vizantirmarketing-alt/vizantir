import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { MonthlyReport } from '@/app/intel/reports/_components/MonthlyReport'
import { loadPublicReport } from '@/lib/reports/delivery'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Report',
  robots: { index: false, follow: false },
}

type PublicReportPageProps = {
  params: Promise<{ token: string }>
}

export default async function PublicReportPage({
  params,
}: PublicReportPageProps) {
  const { token } = await params
  const result = await loadPublicReport(token)
  if (!result.ok) {
    notFound()
  }

  return (
    <>
      {result.pdfDownloadUrl ? (
        <div className="print:hidden mx-auto flex w-full min-w-0 max-w-[40rem] px-5 pt-8 sm:px-8">
          <a
            href={result.pdfDownloadUrl}
            className="text-sm font-medium text-cobalt-primary underline-offset-4 hover:underline"
            rel="noreferrer"
          >
            Download PDF
          </a>
        </div>
      ) : null}
      <MonthlyReport document={result.document} />
    </>
  )
}
