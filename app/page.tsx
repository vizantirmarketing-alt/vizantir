import { getPageSeo } from '@/sanity/lib/seo';
import type { Metadata } from 'next';
import Hero from '@/components/homepage/Hero'
import Marquee from '@/components/homepage/Marquee'
import AboutStory from '@/components/homepage/AboutStory'
import ServicesPreview from '@/components/homepage/ServicesPreview'
import WhoWeWorkWith from '@/components/homepage/WhoWeWorkWith'
import WhyVizantir from '@/components/homepage/WhyVizantir'
import Solutions from '@/components/homepage/Solutions'
import Strategy from '@/components/homepage/Strategy'
import ResultsThatSpeak from '@/components/homepage/ResultsThatSpeak'
import GlassTestimonials from '@/components/homepage/GlassTestimonials'
import FAQSection from '@/components/homepage/FAQSection'
import CTA from '@/components/homepage/CTA'
import WhatHappensNext from '@/components/homepage/WhatHappensNext'
import Newsletter from '@/components/homepage/Newsletter'

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPageSeo('home');
  
  return {
    title: page?.seo?.metaTitle || 'Vizantir',
    description: page?.seo?.metaDescription || 'Web Design Agency',
    openGraph: {
      title: page?.seo?.metaTitle || 'Vizantir',
      description: page?.seo?.metaDescription || 'Web Design Agency',
      ...(page?.seo?.ogImage && { images: [page.seo.ogImage] }),
    },
  };
}

export default function Home() {
  return (
    <>
      <Hero />
      <Marquee />
      <AboutStory />
      <ServicesPreview />
      <WhoWeWorkWith />
      <WhyVizantir />
      <Solutions />
      <Strategy />
      <ResultsThatSpeak />
      <GlassTestimonials />
      <FAQSection />
      <CTA />
      <WhatHappensNext />
      <Newsletter />
    </>
  )
}
