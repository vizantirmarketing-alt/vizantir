import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { Button } from '@/components/ui/button'
import { JsonLd } from '@/components/seo/JsonLd'
import { breadcrumbSchema, graphSchema, webPageSchema } from '@/lib/schema'
import { INDUSTRIES, SECONDARY_INDUSTRIES, type Industry } from './_data'

const SITE_URL = 'https://www.vizantir.com'
const PAGE_URL = `${SITE_URL}/industries`
const BUSINESS_ID = `${SITE_URL}/#business`

const PAGE_DESCRIPTION =
  'Vizantir builds custom websites for established businesses across all sectors. Dedicated landing pages for hospitality, law firms, and commercial real estate. Premium custom builds across many more.'

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
                Who We Build For
              </h1>
              <p className="text-base md:text-lg text-body leading-relaxed">
                Vizantir builds custom websites for established businesses across all sectors —
                wherever the website is a serious touchpoint between you and the people who decide
                whether to work with you.
              </p>
            </div>

            <div className="mb-16 md:mb-20">
              <div className="max-w-3xl mx-auto text-center mb-10 md:mb-12">
                <p className="text-xs md:text-sm font-semibold uppercase tracking-widest text-meta mb-3">
                  Industries With Dedicated Pages
                </p>
                <p className="text-base md:text-lg text-body leading-relaxed">
                  We&apos;ve built deep SEO-focused landing pages for three industries where the buyer
                  signals are strongest. The site work itself looks the same across every sector —
                  premium, fast, custom.
                </p>
              </div>
              <IndustryGrid industries={INDUSTRIES} />
            </div>

            <div className="mb-16 md:mb-20">
              <div className="max-w-3xl mx-auto text-center mb-8 md:mb-10">
                <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">Also Serving</h2>
                <p className="text-base md:text-lg text-body leading-relaxed">
                  Vizantir takes projects across the broader market — any established business that
                  wants a premium, custom-built site over a templated solution.
                </p>
              </div>
              <div className="max-w-3xl mx-auto flex flex-wrap justify-center gap-2 md:gap-3">
                {SECONDARY_INDUSTRIES.map((industry) => (
                  <span
                    key={industry}
                    className="rounded-full bg-black/[0.04] px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-black/[0.07]"
                  >
                    {industry}
                  </span>
                ))}
              </div>
            </div>

            <div className="max-w-3xl mx-auto text-center mb-16">
              <p className="text-base md:text-lg text-body leading-relaxed">
                Industry isn&apos;t the qualifier — established business and premium budget are. If you
                operate in a sector that isn&apos;t listed here, the work looks the same: a custom site
                built to be fast, durable, and uniquely yours.
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
