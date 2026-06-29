import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { JsonLd } from '@/components/seo/JsonLd'
import { breadcrumbSchema, graphSchema, webPageSchema } from '@/lib/schema'
import { SITE_URL, TECHNOLOGIES } from './_data'

const PAGE_URL = `${SITE_URL}/technology`

export const metadata: Metadata = {
  title: {
    absolute: 'Our Technology Stack | Vizantir Design Studio',
  },
  description:
    'Vizantir builds on Next.js, Sanity, Vercel, Supabase, Stripe, and Tailwind. The technology stack behind every custom website we build.',
  alternates: {
    canonical: PAGE_URL,
  },
  openGraph: {
    type: 'website',
    url: PAGE_URL,
    siteName: 'Vizantir',
    locale: 'en_US',
    title: 'Our Technology Stack | Vizantir Design Studio',
    description:
      'Vizantir builds on Next.js, Sanity, Vercel, Supabase, Stripe, and Tailwind. The technology stack behind every custom website we build.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Vizantir Technology Stack',
      },
    ],
  },
}

const pageGraph = graphSchema([
  webPageSchema({
    url: PAGE_URL,
    name: 'Our Technology Stack',
    description:
      'Vizantir builds on Next.js, Sanity, Vercel, Supabase, Stripe, and Tailwind. The technology stack behind every custom website we build.',
    siteUrl: SITE_URL,
  }),
  breadcrumbSchema([
    { name: 'Home', url: SITE_URL },
    { name: 'Technology', url: PAGE_URL },
  ]),
])

export default function TechnologyHubPage() {
  return (
    <>
      <JsonLd id="ld-technology-hub" data={pageGraph} />

      <main style={{ background: '#FAF9F5' }}>
        <section className="px-6 md:px-12 lg:px-20 py-16 md:py-20">
          <div className="max-w-6xl mx-auto">
            <div className="max-w-3xl mx-auto text-center mb-16 md:mb-20">
              <Eyebrow className="mb-8">Our Stack</Eyebrow>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-foreground mb-6">
                The Technology Behind Every Vizantir Build
              </h1>
              <p className="text-base md:text-lg text-body leading-relaxed">
                Every tool in our stack was chosen for the same reason: to compound into a site that
                loads faster, breaks less, and stays maintainable for years. These are not buzzwords on
                a proposal — they are the actual systems running your project from day one.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-16 md:mb-20">
              {TECHNOLOGIES.map((tech) => (
                <article
                  key={tech.slug}
                  className="flex flex-col rounded-2xl border border-border bg-background p-6 md:p-8"
                >
                  <h2 className="text-2xl font-bold text-foreground mb-3">{tech.name}</h2>
                  <p className="text-cobalt-accent font-medium mb-4">{tech.tagline}</p>
                  <ul className="mb-6 space-y-3 flex-1">
                    {tech.whyWeUseIt.slice(0, 2).map((item) => (
                      <li key={item} className="flex gap-3 text-sm text-body leading-relaxed">
                        <span
                          className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full"
                          style={{ background: 'var(--cobalt-accent)' }}
                          aria-hidden
                        />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={`/technology/${tech.slug}`}
                    className="link-cobalt inline-flex items-center gap-1 text-sm font-semibold text-cobalt-accent"
                  >
                    Learn more
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </article>
              ))}
            </div>

            <div className="max-w-3xl mx-auto text-center mb-16">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6">
                Why stack choices matter
              </h2>
              <p className="text-base md:text-lg text-body leading-relaxed">
                A website is only as reliable as the systems underneath it. WordPress plugins conflict.
                Shared hosting slows down under traffic. Page builders lock you into templates. Our stack
                avoids those tradeoffs by design — so performance, security, and editability improve
                together instead of competing.
              </p>
            </div>

            <div className="text-center">
              <Link
                href="/contact"
                className="bg-cobalt-gradient inline-flex items-center gap-2 rounded-xl px-8 py-4 text-base font-semibold text-white shadow-cobalt group"
              >
                Start a project
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  )
}
