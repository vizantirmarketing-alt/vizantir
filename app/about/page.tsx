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
import { breadcrumbSchema, graphSchema, personSchema } from '@/lib/schema'

const SITE_URL = 'https://www.vizantir.com'

const aboutGraph = graphSchema([
  breadcrumbSchema([
    { name: 'Home', url: SITE_URL },
    { name: 'About', url: `${SITE_URL}/about` },
  ]),
  personSchema({
    siteUrl: SITE_URL,
    name: 'James Tram',
    jobTitle: 'Founder',
    description:
      'Founder of Vizantir Design Studio, a Las Vegas web design and development studio building custom Next.js websites for established businesses. James spent 25 years operating businesses before moving into engineering.',
    sameAs: [
      'https://www.linkedin.com/in/james-tram-vizantir',
      'https://clutch.co/profile/vizantir-design-studio-0',
      'https://maps.google.com/?cid=7927126809305841776',
      'https://github.com/vizantirmarketing-alt',
    ],
  }),
])

export const metadata: Metadata = aboutMetadata

export default function AboutPage() {
  return (
    <>
      <JsonLd id="ld-about" data={aboutGraph} />
      <div className="min-h-screen bg-background text-foreground">
        <AmbientHero
          compact
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
              <AboutSection section={section}>
                {isBuildOnSection ? (
                  <div className="mt-10 md:mt-12">
                    <div className="grid grid-cols-2 gap-6 md:grid-cols-3 md:gap-8 lg:grid-cols-6">
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
                          className="group flex flex-col items-center justify-center gap-3 p-4 transition-transform duration-300 hover:scale-[1.04]"
                          aria-label={`Learn more about how Vizantir uses ${tech.name}`}
                        >
                          <div className="relative h-10 w-10 opacity-60 transition-opacity duration-300 group-hover:opacity-100 md:h-12 md:w-12">
                            <Image
                              src={`/logos/${tech.file}`}
                              alt={`${tech.name} logo`}
                              fill
                              className="object-contain"
                              sizes="(max-width: 768px) 40px, 48px"
                            />
                          </div>
                          <span className="text-center text-xs font-medium text-meta transition-colors duration-300 group-hover:text-foreground md:text-sm">
                            {tech.name}
                          </span>
                        </Link>
                      ))}
                    </div>
                    <div className="mt-10 text-center">
                      <Link
                        href="/technology"
                        className="link-cobalt inline-flex items-center gap-2 text-sm font-medium md:text-base"
                        style={{ color: 'var(--cobalt-accent)' }}
                      >
                        <span>See the full stack</span>
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                ) : null}
              </AboutSection>
              {shouldRenderPostSectionDivider ? <SectionDivider /> : null}
            </div>
          )
        })}
        <SectionDivider />
        <AboutCta content={aboutPageContent.finalCta} />
      </div>
    </>
  )
}
