import { MetadataRoute } from 'next'
import { sanityFetch } from '@/lib/sanity/client'
import { siteSettingsQuery } from '@/lib/sanity/queries'

export const revalidate = 3600

export default async function robots(): Promise<MetadataRoute.Robots> {
  const settings = await sanityFetch<{ siteUrl: string } | null>(siteSettingsQuery, {}, {
    tags: ['siteSettings'],
  })

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
