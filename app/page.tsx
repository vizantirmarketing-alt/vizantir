import Hero from '@/components/homepage/Hero'
import Marquee from '@/components/homepage/Marquee'
import AboutStory from '@/components/homepage/AboutStory'
import ServicesPreview from '@/components/homepage/ServicesPreview'
import Solutions from '@/components/homepage/Solutions'
import Strategy from '@/components/homepage/Strategy'
import GlassTestimonials from '@/components/homepage/GlassTestimonials'
import FAQSection from '@/components/homepage/FAQSection'
import CTA from '@/components/homepage/CTA'
import Newsletter from '@/components/homepage/Newsletter'

export default function Home() {
  return (
    <>
      <Hero />
      <Marquee />
      <AboutStory />
      <ServicesPreview />
      <Solutions />
      <Strategy />
      <GlassTestimonials />
      <FAQSection />
      <CTA />
      <Newsletter />
    </>
  )
}
