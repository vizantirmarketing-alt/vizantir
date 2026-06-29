import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { Button } from '@/components/ui/button'
import { JsonLd } from '@/components/seo/JsonLd'
import { breadcrumbSchema, graphSchema, webPageSchema } from '@/lib/schema'
import { INDUSTRIES, type Industry } from './_data'

const SITE_URL = 'https://www.vizantir.com'
const PAGE_URL = `${SITE_URL}/industries`
const BUSINESS_ID = `${SITE_URL}/#business`

const PAGE_DESCRIPTION =
  'Custom web design for hospitality, law firms, commercial real estate, and established businesses where presentation directly affects revenue. Built by a Las Vegas studio.'

export const metadata: Metadata = {
  title: {
    absolute: 'Industries We Serve — Custom Web Design | Vizantir',
  },
  description: PAGE_DESCRIPTION,
  alternates: {
    canonical: PAGE_URL,
  },
  openGraph: {
    type: 'website',
    url: PAGE_URL,
    siteName: 'Vizantir',
    locale: 'en_US',
    title: 'Industries We Serve — Custom Web Design | Vizantir',
    description: PAGE_DESCRIPTION,
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Industries We Serve — Vizantir',
      },
    ],
  },
}

const pageGraph = graphSchema([
  webPageSchema({
    url: PAGE_URL,
    name: 'Industries We Build For',
    description: PAGE_DESCRIPTION,
    siteUrl: SITE_URL,
    mainEntity: { '@id': BUSINESS_ID },
  }),
  breadcrumbSchema([
    { name: 'Home', url: SITE_URL },
    { name: 'Industries', url: PAGE_URL },
  ]),
])

function IndustryGrid({ industries }: { industries: Industry[] }) {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {industries.map((industry) => (
        <article
          key={industry.slug}
          className="flex flex-col rounded-2xl border border-border bg-background p-6 md:p-8"
        >
          <h3 className="text-2xl font-bold text-foreground mb-3">{industry.name}</h3>
          <p className="text-cobalt-accent font-medium mb-4">{industry.tagline}</p>
          <p className="mb-6 flex-1 text-sm text-body leading-relaxed">{industry.description}</p>
          <Link
            href={`/${industry.slug}`}
            className="link-cobalt inline-flex items-center gap-1 text-sm font-semibold text-cobalt-accent"
          >
            Learn more
            <ArrowRight className="h-4 w-4" />
          </Link>
        </article>
      ))}
    </div>
  )
}

export default function IndustriesHubPage() {
  return (
    <>
      <JsonLd id="ld-industries-hub" data={pageGraph} />

      <main style={{ background: '#FAF9F5' }}>
        <section className="px-6 md:px-12 lg:px-20 py-16 md:py-20">
          <div className="max-w-6xl mx-auto">
            <div className="max-w-3xl mx-auto text-center mb-16 md:mb-20">
              <Eyebrow className="mb-8">Industries</Eyebrow>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-foreground mb-6">
                Industries We Build For
              </h1>
              <p className="text-base md:text-lg text-body leading-relaxed">
                Vizantir works across multiple sectors where presentation directly affects revenue.
                Hospitality, law, commercial real estate — different industries, same underlying
                challenge: established businesses where the website is the first serious test of the
                business.
              </p>
            </div>

            <div className="mb-16 md:mb-20">
              <IndustryGrid industries={INDUSTRIES} />
            </div>

            <div className="max-w-3xl mx-auto text-center mb-16">
              <p className="text-base md:text-lg text-body leading-relaxed">
                These three industries are where Vizantir has built dedicated landing pages — but the
                studio works with any established business where presentation affects revenue. If your
                sector is not listed here, the same principles apply: a custom site that earns trust,
                loads fast, and converts the visitors who matter.
              </p>
            </div>

            <div className="text-center">
              <Button
                size="lg"
                asChild
                className="rounded-xl px-8 py-4 text-base font-semibold bg-cobalt-gradient text-white shadow-cobalt group"
              >
                <Link href="/contact">
                  Book a Strategy Call
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
    </>
  )
}
