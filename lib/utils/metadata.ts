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
  const base = settings?.siteUrl || 'https://www.vizantir.com'
  return `${base}${path}`
}





