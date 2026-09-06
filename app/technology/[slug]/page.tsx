import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowRight } from 'lucide-react'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { JsonLd } from '@/components/seo/JsonLd'
import { breadcrumbSchema, graphSchema } from '@/lib/schema'
import {
  AREA_SERVED,
  BUSINESS_ID,
  SITE_URL,
  ALL_TECHNOLOGIES,
  getTechnologyBySlug,
} from '../_data'

interface PageProps {
  params: Promise<{ slug: string }>
}

export function generateStaticParams() {
  return ALL_TECHNOLOGIES.map((tech) => ({ slug: tech.slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const tech = getTechnologyBySlug(slug)

  if (!tech) return {}

  const url = `${SITE_URL}/technology/${tech.slug}`
  const title = `${tech.name} Development | Vizantir Design Studio`

  return {
    title: { absolute: title },
    description: tech.description,
    alternates: { canonical: url },
    openGraph: {
      type: 'website',
      url,
      siteName: 'Vizantir',
      locale: 'en_US',
      title,
      description: tech.description,
      images: [
        {
          url: '/og-image.png',
          width: 1200,
          height: 630,
          alt: `${tech.name} Development – Vizantir Design Studio`,
        },
      ],
    },
  }
}

export default async function TechnologyPage({ params }: PageProps) {
  const { slug } = await params
  const tech = getTechnologyBySlug(slug)

  if (!tech) notFound()

  const url = `${SITE_URL}/technology/${tech.slug}`

  const pageGraph = graphSchema([
    {
      '@type': 'Service',
      '@id': `${url}#service`,
      name: `${tech.name} Development by Vizantir`,
      description: tech.description,
      url,
      provider: { '@id': BUSINESS_ID },
      serviceType: 'Web Development',
      areaServed: [...AREA_SERVED],
    },
    breadcrumbSchema([
      { name: 'Home', url: SITE_URL },
      { name: 'Technology', url: `${SITE_URL}/technology` },
      { name: tech.name, url },
    ]),
  ])

  return (
    <>
      <JsonLd id={`ld-technology-${tech.slug}`} data={pageGraph} />

      <div style={{ background: 'var(--background)' }}>
        <section className="px-6 md:px-12 lg:px-20 py-16 md:py-20">
          <div className="max-w-4xl mx-auto">
            <Eyebrow align="start" className="mb-8">
              Technology · {tech.name}
            </Eyebrow>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-foreground mb-6">
              {tech.keyword}
            </h1>

            <p className="text-lg md:text-xl text-cobalt-accent font-medium mb-8">{tech.tagline}</p>

            <p className="text-base md:text-lg text-body leading-relaxed mb-16">{tech.intro}</p>

            <div className="mb-16">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6">
                Why we use {tech.name}
              </h2>
              <ul className="space-y-4">
                {tech.whyWeUseIt.map((item) => (
                  <li key={item} className="flex gap-3 text-base md:text-lg text-body leading-relaxed">
                    <span
                      className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{ background: 'var(--cobalt-accent)' }}
                      aria-hidden
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mb-16">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6">
                What this means for your business
              </h2>
              <p className="text-base md:text-lg text-body leading-relaxed">{tech.businessOutcome}</p>
            </div>

            <div className="pt-4 border-t border-border">
              <Link
                href="/contact"
                className="bg-cobalt-gradient inline-flex items-center gap-2 rounded-xl px-8 py-4 text-base font-semibold text-white shadow-cobalt group"
              >
                Build with {tech.name}
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}
