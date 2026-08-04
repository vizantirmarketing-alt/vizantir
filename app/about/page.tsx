import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

import AboutCta from '@/components/about-page/AboutCta'
import AboutIntroExamples from '@/components/about-page/AboutIntroExamples'
import AboutSection from '@/components/about-page/AboutSection'
import { AmbientHero } from '@/components/hero/AmbientHero'
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
        <AmbientHero
          eyebrow="Our History"
          headline="A studio for brands that have outgrown their website"
          subhead={aboutPageContent.hero.body}
        />
        <SectionDivider />
        <AboutIntroExamples content={aboutPageContent.intro} />
        <SectionDivider />
        {aboutPageContent.sections.map((section) => {
          const shouldRenderPostSectionDivider = section.id === 'whoWeWorkWith'
          const isBuildOnSection = section.id === 'whatWeBuildOn'

          return (
            <div key={section.id}>
              <AboutSection section={section} />
              {isBuildOnSection ? (
                <section className="pt-2 pb-16 md:pb-20 -mt-px" style={{ background: 'var(--background)' }}>
                  <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto">
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 md:gap-8">
                        {[
                          { name: 'Next.js', slug: 'nextjs', file: 'nextjs.svg' },
                          { name: 'Sanity', slug: 'sanity', file: 'sanity.svg' },
                          { name: 'Vercel', slug: 'vercel', file: 'vercel.svg' },
                          { name: 'Tailwind CSS', slug: 'tailwind', file: 'tailwind.svg' },
                          { name: 'TypeScript', slug: 'typescript', file: 'typescript.svg' },
                          { name: 'React', slug: 'react', file: 'react.svg' },
                        ].map((tech) => (
                          <Link
                            key={tech.slug}
                            href={`/technology/${tech.slug}`}
                            className="group flex flex-col items-center justify-center gap-3 p-4 rounded-xl transition-all duration-300 hover:bg-white/50"
                            aria-label={`Learn more about how Vizantir uses ${tech.name}`}
                          >
                            <div className="relative h-10 w-10 md:h-12 md:w-12 opacity-60 group-hover:opacity-100 transition-opacity duration-300">
                              <Image
                                src={`/logos/${tech.file}`}
                                alt={`${tech.name} logo`}
                                fill
                                className="object-contain"
                                sizes="(max-width: 768px) 40px, 48px"
                              />
                            </div>
                            <span className="text-xs md:text-sm font-medium text-meta group-hover:text-foreground transition-colors duration-300 text-center">
                              {tech.name}
                            </span>
                          </Link>
                        ))}
                      </div>
                      <div className="mt-8 md:mt-10 text-center">
                        <Link
                          href="/technology"
                          className="link-cobalt inline-flex items-center gap-2 font-medium text-sm md:text-base"
                          style={{ color: 'var(--cobalt-accent)' }}
                        >
                          <span>See the full stack</span>
                          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </section>
              ) : null}
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
