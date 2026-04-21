import { getPageSeo } from '@/sanity/lib/seo';
import type { Metadata } from 'next';
import { sanityFetch } from '@/lib/sanity/client';
import { homepageFaqsQuery } from '@/lib/sanity/queries';
import type { Faq } from '@/components/homepage/FAQSection';
import Hero from '@/components/homepage/Hero'
import Marquee from '@/components/homepage/Marquee'
import dynamic from 'next/dynamic'

const EditorialStatement = dynamic(() => import('@/components/homepage/EditorialStatement'))
const AboutStory = dynamic(() => import('@/components/homepage/AboutStory'))
const ServicesPreview = dynamic(() => import('@/components/homepage/ServicesPreview'))
const WhoWeWorkWith = dynamic(() => import('@/components/homepage/WhoWeWorkWith'))
const OperatorStatement = dynamic(() => import('@/components/homepage/OperatorStatement'))
const WhyVizantir = dynamic(() => import('@/components/homepage/WhyVizantir'))
const ResultsThatSpeak = dynamic(() => import('@/components/homepage/ResultsThatSpeak'))
const FAQSection = dynamic(() => import('@/components/homepage/FAQSection'))
const CTA = dynamic(() => import('@/components/homepage/CTA'))
const WhatHappensNext = dynamic(() => import('@/components/homepage/WhatHappensNext'))
const Newsletter = dynamic(() => import('@/components/homepage/Newsletter'))

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPageSeo('home');
  
  return {
    title: page?.seo?.metaTitle || 'Premium Web Design Studio in Las Vegas | Vizantir',
    description:
      page?.seo?.metaDescription ||
      'Discover custom, high-performance websites for hospitality, law and real estate brands across the U.S., created by our Las Vegas studio.',
    openGraph: {
      title: page?.seo?.metaTitle || 'Premium Web Design Studio in Las Vegas | Vizantir',
      description:
        page?.seo?.metaDescription ||
        'Discover custom, high-performance websites for hospitality, law and real estate brands across the U.S., created by our Las Vegas studio.',
      ...(page?.seo?.ogImage && { images: [page.seo.ogImage] }),
    },
  };
}

export default async function Home() {
  const faqs = await sanityFetch<Faq[]>(homepageFaqsQuery, {}, { tags: ['faq'] });

  return (
    <>
      <Hero />
      <Marquee />
      <EditorialStatement />
      <AboutStory />
      <ServicesPreview />
      <WhoWeWorkWith />
      <OperatorStatement />
      <WhyVizantir />
      <ResultsThatSpeak />
      <FAQSection faqs={faqs} />
      <CTA />
      <WhatHappensNext />
      <Newsletter />
    </>
  )
}
