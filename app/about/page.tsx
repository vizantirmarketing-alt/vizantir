import type { Metadata } from 'next'

import AboutCta from '@/components/about-page/AboutCta'
import AboutHero from '@/components/about-page/AboutHero'
import AboutIntroExamples from '@/components/about-page/AboutIntroExamples'
import AboutSection from '@/components/about-page/AboutSection'
import { JsonLd } from '@/components/seo/JsonLd'
import SectionDivider from '@/components/ui/SectionDivider'
import { aboutMetadata, aboutPageContent } from '@/data/about'
import { breadcrumbSchema, graphSchema } from '@/lib/schema'

const breadcrumbGraph = graphSchema([
  breadcrumbSchema([
    { name: 'Home', url: 'https://www.vizantir.com' },
    { name: 'About', url: 'https://www.vizantir.com/about' },
  ]),
])

export const metadata: Metadata = aboutMetadata

export default function AboutPage() {
  return (
    <>
      <JsonLd id="ld-breadcrumb" data={breadcrumbGraph} />
      <main className="min-h-screen bg-background text-foreground">
        <AboutHero eyebrow={aboutPageContent.eyebrow} content={aboutPageContent.hero} />
        <SectionDivider />
        <AboutIntroExamples content={aboutPageContent.intro} />
        <SectionDivider />
        {aboutPageContent.sections.map((section) => {
          const shouldRenderPostSectionDivider = section.id === 'whoWeWorkWith'

          return (
            <div key={section.id}>
              <AboutSection section={section} />
              {shouldRenderPostSectionDivider ? <SectionDivider /> : null}
            </div>
          )
        })}
        <SectionDivider />
        <AboutCta content={aboutPageContent.finalCta} />
      </main>
    </>
  )
}
