import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { sanityFetch } from '@/lib/sanity/client'
import { allCaseStudiesQuery, caseStudyBySlugQuery, siteSettingsQuery } from '@/lib/sanity/queries'
import { getCanonicalUrl, getOgImage } from '@/lib/utils/metadata'
import type { CaseStudy, SiteSettings } from '@/lib/sanity/types'

import CaseStudyPageContent from './CaseStudyPageContent'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  const caseStudies = await sanityFetch<{ slug: string }[]>(
    allCaseStudiesQuery,
    {},
    { tags: ['case-studies'] }
  )

  return caseStudies.map((caseStudy) => ({ slug: caseStudy.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params

  const [caseStudy, settings] = await Promise.all([
    sanityFetch<CaseStudy | null>(caseStudyBySlugQuery, { slug }, { tags: ['case-studies', `case-study-${slug}`] }),
    sanityFetch<SiteSettings | null>(siteSettingsQuery, {}, { tags: ['settings'] }),
  ])

  if (!caseStudy) return {}

  const title = caseStudy.metaTitle || caseStudy.title
  const description = caseStudy.metaDescription || caseStudy.summary || undefined
  const url = getCanonicalUrl(settings, `/case-studies/${caseStudy.slug}`)

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: 'website',
      images: getOgImage({ pageImage: caseStudy.ogImageUrl, settings, alt: caseStudy.title }),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: getOgImage({ pageImage: caseStudy.ogImageUrl, settings, alt: caseStudy.title }),
    },
  }
}

export default async function CaseStudyPage({ params }: Props) {
  const { slug } = await params
  const caseStudy = await sanityFetch<CaseStudy | null>(
    caseStudyBySlugQuery,
    { slug },
    { tags: ['case-studies', `case-study-${slug}`] }
  )

  if (!caseStudy) notFound()

  return <CaseStudyPageContent caseStudy={caseStudy} />
}
