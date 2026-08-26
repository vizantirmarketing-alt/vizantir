import { after, NextResponse } from 'next/server'

import { matchKnownBot, recordCrawlerHit } from '@/lib/intel/crawlers'
import { sanityFetch } from '@/lib/sanity/client'
import { siteSettingsQuery } from '@/lib/sanity/queries'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const userAgent = request.headers.get('user-agent') ?? ''
  const bot = matchKnownBot(userAgent)
  if (bot !== null) {
    after(() => recordCrawlerHit({ bot, userAgent }))
  }

  const body = await buildRobotsTxt()
  return new NextResponse(body, {
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'no-store',
    },
  })
}

async function buildRobotsTxt(): Promise<string> {
  let settings: { siteUrl: string } | null = null
  try {
    settings = await sanityFetch<{ siteUrl: string } | null>(
      siteSettingsQuery,
      {},
      { tags: ['siteSettings'] },
    )
  } catch {
    settings = null
  }

  const siteUrl =
    settings?.siteUrl ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    'https://vizantir.com'

  return [
    'User-Agent: *',
    'Allow: /',
    'Disallow: /api/',
    'Disallow: /admin/',
    'Disallow: /studio/',
    'Disallow: /intel/',
    'Disallow: /r/',
    '',
    `Sitemap: ${siteUrl}/sitemap.xml`,
    '',
  ].join('\n')
}
