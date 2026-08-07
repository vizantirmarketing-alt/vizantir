import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { sanityFetch } from '@/lib/sanity/client'
import { allCaseStudiesQuery, caseStudyBySlugQuery, siteSettingsQuery } from '@/lib/sanity/queries'
import { getCanonicalUrl, getOgImage } from '@/lib/utils/metadata'
import type { CaseStudy, SiteSettings } from '@/lib/sanity/types'
import { JsonLd } from '@/components/seo/JsonLd'
import { breadcrumbSchema, caseStudySchema, graphSchema, webPageSchema } from '@/lib/schema'

import CaseStudyPageContent from './CaseStudyPageContent'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  const caseStudies = await sanityFetch<{ slug: string }[]>(
    allCaseStudiesQuery,
    {},
    { tags: ['caseStudy'] }
  )

  return caseStudies.map((caseStudy) => ({ slug: caseStudy.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params

  const [caseStudy, settings] = await Promise.all([
    sanityFetch<CaseStudy | null>(caseStudyBySlugQuery, { slug }, { tags: ['caseStudy'] }),
    sanityFetch<SiteSettings | null>(siteSettingsQuery, {}, { tags: ['siteSettings'] }),
  ])

  if (!caseStudy) return {}

  const rawTitle = caseStudy.metaTitle || caseStudy.title
  const baseTitle = rawTitle
    .replace(/\s*[—–-]\s*Vizantir Design Studio\s*$/i, '')
    .replace(/\s*\|\s*Vizantir(?: Design Studio)?\s*$/i, '')
    .trim() || rawTitle
  const description = caseStudy.metaDescription || caseStudy.summary || undefined
  const url = getCanonicalUrl(settings, `/case-studies/${caseStudy.slug}`)
  const siteName = settings?.siteName || 'Vizantir'
  const socialTitle = baseTitle.endsWith(siteName)
    ? baseTitle
    : `${baseTitle} | ${siteName}`

  return {
    title: baseTitle,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: socialTitle,
      description,
      url,
      type: 'website',
      images: getOgImage({ pageImage: caseStudy.ogImageUrl, settings, alt: caseStudy.title }),
    },
    twitter: {
      card: 'summary_large_image',
      title: socialTitle,
      description,
      images: getOgImage({ pageImage: caseStudy.ogImageUrl, settings, alt: caseStudy.title }),
    },
  }
}

export default async function CaseStudyPage({ params }: Props) {
  const { slug } = await params

  const [caseStudy, settings] = await Promise.all([
    sanityFetch<CaseStudy | null>(caseStudyBySlugQuery, { slug }, { tags: ['caseStudy'] }),
    sanityFetch<SiteSettings | null>(siteSettingsQuery, {}, { tags: ['siteSettings'] }),
  ])

  if (!caseStudy) notFound()

  const caseStudyUrl = getCanonicalUrl(settings, `/case-studies/${caseStudy.slug}`)
  const siteUrl = getCanonicalUrl(settings, '')

  const caseStudyGraph = graphSchema([
    webPageSchema({
      url: caseStudyUrl,
      name: caseStudy.title,
      description: caseStudy.metaDescription || caseStudy.summary,
      siteUrl,
      mainEntity: { '@id': `${caseStudyUrl}#casestudy` },
      imageUrl: caseStudy.ogImageUrl,
      dateModified: caseStudy._updatedAt,
    }),
    caseStudySchema(caseStudy, siteUrl),
    breadcrumbSchema([
      { name: 'Home', url: siteUrl },
      { name: 'Case Studies', url: `${siteUrl}/case-studies` },
      { name: caseStudy.title, url: caseStudyUrl },
    ]),
  ])

  return (
    <>
      <JsonLd id="ld-case-study" data={caseStudyGraph} />
      <CaseStudyPageContent caseStudy={caseStudy} />
    </>
  )
}
