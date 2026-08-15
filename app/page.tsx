import { getPageSeo } from '@/sanity/lib/seo';
import type { Metadata } from 'next';
import { sanityFetch } from '@/lib/sanity/client';
import { caseStudiesBySlugsQuery, homepageFaqsQuery } from '@/lib/sanity/queries';
import type { CaseStudyListItem } from '@/lib/sanity/types';
import type { Faq } from '@/components/homepage/FAQSection';
import Hero from '@/components/homepage/Hero'
import Marquee from '@/components/homepage/Marquee'
import SectionDivider from '@/components/ui/SectionDivider'
import dynamic from 'next/dynamic'

const EditorialStatement = dynamic(() => import('@/components/homepage/EditorialStatement'))
const AboutStory = dynamic(() => import('@/components/homepage/AboutStory'))
const ServicesPreview = dynamic(() => import('@/components/homepage/ServicesPreview'))
const WhoWeWorkWith = dynamic(() => import('@/components/homepage/WhoWeWorkWith'))
const OperatorStatement = dynamic(() => import('@/components/homepage/OperatorStatement'))
const WhyVizantir = dynamic(() => import('@/components/homepage/WhyVizantir'))
const ResultsThatSpeak = dynamic(() => import('@/components/homepage/ResultsThatSpeak'))
const AnalytirSection = dynamic(() => import('@/components/analytir/AnalytirSection'))
const FAQSection = dynamic(() => import('@/components/homepage/FAQSection'))
const CTA = dynamic(() => import('@/components/homepage/CTA'))
const WhatHappensNext = dynamic(() => import('@/components/homepage/WhatHappensNext'))

const HOME_URL = 'https://www.vizantir.com'
const HOME_TITLE = 'Custom Websites for Established Brands | Vizantir'
const HOME_DESCRIPTION =
  'We build custom websites for established businesses that care how they\'re perceived. Hand-built in Next.js by a Las Vegas studio, for clients nationwide.'
const ROOT_OG_IMAGES = [
  {
    url: 'https://www.vizantir.com/og-image.png',
    width: 1200,
    height: 630,
    alt: 'Vizantir Design Studio - Premium Web Design Las Vegas',
  },
]

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPageSeo('home');
  const title = page?.seo?.metaTitle || HOME_TITLE
  const description = page?.seo?.metaDescription || HOME_DESCRIPTION
  
  return {
    title,
    description,
    alternates: {
      canonical: HOME_URL,
    },
    openGraph: {
      title,
      description,
      url: HOME_URL,
      siteName: 'Vizantir',
      locale: 'en_US',
      type: 'website',
      images: page?.seo?.ogImage ? [page.seo.ogImage] : ROOT_OG_IMAGES,
    },
  };
}

const FEATURED_CASE_STUDY_SLUGS = [
  'evolve-dance-center',
  'pink-salt-salon',
  'essence-of-watches',
] as const

export default async function Home() {
  const [faqs, featuredCaseStudies] = await Promise.all([
    sanityFetch<Faq[]>(homepageFaqsQuery, {}, { tags: ['faq'] }),
    sanityFetch<CaseStudyListItem[]>(
      caseStudiesBySlugsQuery,
      { slugs: FEATURED_CASE_STUDY_SLUGS },
      { tags: ['caseStudy'] },
    ),
  ])

  const bySlug = new Map(featuredCaseStudies.map((study) => [study.slug, study]))
  const orderedCaseStudies = FEATURED_CASE_STUDY_SLUGS.flatMap((slug) => {
    const study = bySlug.get(slug)
    return study ? [study] : []
  })

  return (
    <>
      <Hero />
      <Marquee />
      <EditorialStatement />
      <AboutStory />
      <SectionDivider />
      <ServicesPreview />
      <WhoWeWorkWith />
      <OperatorStatement />
      <WhyVizantir />
      <SectionDivider />
      <ResultsThatSpeak caseStudies={orderedCaseStudies} />
      <AnalytirSection />
      <FAQSection faqs={faqs} />

      <SectionDivider />
      <CTA />
      <WhatHappensNext />
    </>
  )
}
