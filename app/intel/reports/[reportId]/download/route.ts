import { NextResponse } from 'next/server'

import { requireIntelUser } from '@/lib/auth/allowlist'
import { isReportId } from '@/lib/reports/load'
import { createSupabaseServiceRole } from '@/lib/supabase/service'

export const dynamic = 'force-dynamic'

const REPORTS_BUCKET = 'reports'
const SIGNED_URL_TTL_SECONDS = 60

type RouteContext = {
  params: Promise<{ reportId: string }>
}

export async function GET(_request: Request, context: RouteContext) {
  await requireIntelUser()

  const { reportId } = await context.params
  if (!isReportId(reportId)) {
    return NextResponse.json({ error: 'Report not found' }, { status: 404 })
  }

  try {
    const supabase = createSupabaseServiceRole()
    const reportResult = await supabase
      .from('reports')
      .select('id, pdf_path')
      .eq('id', reportId)
      .maybeSingle()

    if (reportResult.error) {
      console.error('Report lookup failed')
      return NextResponse.json(
        { error: 'Unable to download report.' },
        { status: 500 },
      )
    }

    if (reportResult.data === null) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    const pdfPath = reportResult.data.pdf_path
    if (typeof pdfPath !== 'string' || pdfPath.length === 0) {
      return NextResponse.json(
        { error: 'The PDF has not been generated yet.' },
        { status: 404 },
      )
    }

    const signed = await supabase.storage
      .from(REPORTS_BUCKET)
      .createSignedUrl(pdfPath, SIGNED_URL_TTL_SECONDS)

    if (signed.error || typeof signed.data?.signedUrl !== 'string') {
      console.error('Report PDF signed URL failed')
      return NextResponse.json(
        { error: 'Unable to download report.' },
        { status: 500 },
      )
    }

    return NextResponse.redirect(signed.data.signedUrl)
  } catch {
    console.error('Report PDF download failed')
    return NextResponse.json(
      { error: 'Unable to download report.' },
      { status: 500 },
    )
  }
}
