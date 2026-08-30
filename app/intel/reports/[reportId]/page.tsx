import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

import { MonthlyReport } from '@/app/intel/reports/_components/MonthlyReport'
import { ReportReviewControls } from '@/app/intel/reports/_components/ReportReviewControls'
import { loadReviewFields } from '@/app/intel/reports/data'
import { requireIntelUser } from '@/lib/auth/allowlist'
import { isReportId, loadReport } from '@/lib/reports/load'
import { createSupabaseServiceRole } from '@/lib/supabase/service'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

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
    return (
      <PreviewChrome>
        <ReportStateMessage title="Report not found" body="No report exists for this address." />
      </PreviewChrome>
    )
  }

  const result = await loadReport(reportId)

  if (!result.ok && result.reason === 'not_found') {
    return (
      <PreviewChrome>
        <ReportStateMessage title="Report not found" body="No report exists for this address." />
      </PreviewChrome>
    )
  }

  if (!result.ok && result.reason === 'malformed') {
    return (
      <PreviewChrome>
        <ReportStateMessage
          title="Snapshot unreadable"
          body="This report exists, but its snapshot is missing, the wrong version, or malformed. It cannot be rendered from the stored record."
        />
      </PreviewChrome>
    )
  }

  if (!result.ok) {
    return (
      <PreviewChrome>
        <ReportStateMessage
          title="Unable to load report"
          body="The report could not be loaded. Try again shortly."
        />
      </PreviewChrome>
    )
  }

  const awaitingReview =
    result.document.tier === 'care' && result.document.status === 'pending'
  const [review, hasPdf] = await Promise.all([
    awaitingReview
      ? loadReviewFields(result.document.reportId, result.document.client.id)
      : Promise.resolve(null),
    loadReportHasPdf(result.document.reportId),
  ])

  return (
    <PreviewChrome
      downloadHref={
        hasPdf ? `/intel/reports/${result.document.reportId}/download` : null
      }
      review={
        awaitingReview ? (
          <ReportReviewControls
            reportId={result.document.reportId}
            analysis={review?.ok ? review.fields.analysis : ''}
            workCompleted={review?.ok ? review.fields.workCompleted : ''}
          />
        ) : null
      }
    >
      <MonthlyReport document={result.document} />
    </PreviewChrome>
  )
}

function PreviewChrome({
  children,
  downloadHref,
  review,
}: {
  children: ReactNode
  downloadHref?: string | null
  review?: ReactNode
}) {
  return (
    <div>
      <div className="print:hidden border-b border-black/8 px-5 py-4 sm:px-8">
        <div className="mx-auto w-full max-w-[40rem]">
          <div className="flex items-baseline justify-between gap-4">
            <Link
              href="/intel/reports"
              className="inline-flex items-baseline gap-1 text-sm text-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="size-[1em]" aria-hidden />
              Reports
            </Link>
            {downloadHref ? (
              <Link
                href={downloadHref}
                prefetch={false}
                className="text-sm text-meta transition-colors hover:text-foreground"
              >
                Download PDF
              </Link>
            ) : null}
          </div>
          {review}
        </div>
      </div>
      {children}
    </div>
  )
}

async function loadReportHasPdf(reportId: string): Promise<boolean> {
  const supabase = createSupabaseServiceRole()
  const result = await supabase
    .from('reports')
    .select('pdf_path')
    .eq('id', reportId)
    .maybeSingle()

  if (result.error || result.data === null) {
    return false
  }

  const pdfPath = result.data.pdf_path
  return typeof pdfPath === 'string' && pdfPath.trim().length > 0
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
