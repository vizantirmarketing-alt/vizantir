import type { Metadata } from 'next'

import AboutCta from '@/components/about-page/AboutCta'
import AboutDivider from '@/components/about-page/AboutDivider'
import AboutHero from '@/components/about-page/AboutHero'
import AboutIntroExamples from '@/components/about-page/AboutIntroExamples'
import AboutSection from '@/components/about-page/AboutSection'
import { JsonLd } from '@/components/seo/JsonLd'
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
        <AboutDivider />
        <AboutIntroExamples content={aboutPageContent.intro} />
        <AboutDivider />
        {aboutPageContent.sections.map((section) => {
          const shouldRenderPostSectionDivider = section.id === 'whoWeWorkWith'

          return (
            <div key={section.id}>
              <AboutSection section={section} />
              {shouldRenderPostSectionDivider ? <AboutDivider /> : null}
            </div>
          )
        })}
        <AboutDivider />
        <AboutCta content={aboutPageContent.finalCta} />
      </main>
    </>
  )
}
