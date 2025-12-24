import { MetadataRoute } from 'next'
import { sanityFetchFresh } from '@/lib/sanity/client'
import { siteSettingsQuery } from '@/lib/sanity/queries'

export default async function robots(): Promise<MetadataRoute.Robots> {
  const settings = await sanityFetchFresh<{ siteUrl: string } | null>(siteSettingsQuery)

  const siteUrl = settings?.siteUrl || process.env.NEXT_PUBLIC_SITE_URL || 'https://vizantir.com'

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/admin/', '/studio/'],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  }
}


