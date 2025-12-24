import type { SiteSettings } from '@/lib/sanity/types'

interface OgImageParams {
  pageImage?: string | null
  settings: SiteSettings | null
  alt: string
}

export function getOgImage({ pageImage, settings, alt }: OgImageParams) {
  if (!settings) return undefined
  
  const imageUrl = pageImage || settings.ogImageUrl
  if (!imageUrl) return undefined
  return [{ url: imageUrl, width: 1200, height: 630, alt }]
}

export function getCanonicalUrl(settings: SiteSettings | null, path: string) {
  if (!settings) {
    const fallbackUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://vizantir.com'
    return `${fallbackUrl}${path}`
  }
  return `${settings.siteUrl}${path}`
}



