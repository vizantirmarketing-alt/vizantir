import { NextResponse } from 'next/server'

import { requireIntelUser } from '@/lib/auth/allowlist'
import {
  leadsExportFilename,
  parseLeadsListParams,
} from '@/lib/intel/lead-params'
import { fetchLeadsExport } from '@/lib/intel/leads'
import { encodeLeadsCsv } from '@/lib/intel/leads-csv'

export const dynamic = 'force-dynamic'

function readSearchParam(
  searchParams: URLSearchParams,
  key: string,
): string | undefined {
  const value = searchParams.get(key)
  return value === null ? undefined : value
}

export async function GET(request: Request) {
  await requireIntelUser()

  const { searchParams } = new URL(request.url)
  const params = parseLeadsListParams({
    status: readSearchParam(searchParams, 'status'),
    channel: readSearchParam(searchParams, 'channel'),
    q: readSearchParam(searchParams, 'q'),
    sort: readSearchParam(searchParams, 'sort'),
  })

  const result = await fetchLeadsExport(params)
  if (!result.ok) {
    return new NextResponse('Unable to export inquiries.', {
      status: 500,
      headers: { 'Cache-Control': 'no-store' },
    })
  }

  const body = encodeLeadsCsv(result.records)
  const filename = leadsExportFilename(params, {
    truncated: result.truncated,
  })

  return new NextResponse(body, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  })
}
