import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { sanityFetch } from '@/lib/sanity/client'
import { locationBySlugQuery, allLocationsQuery, siteSettingsQuery } from '@/lib/sanity/queries'
import { JsonLd } from '@/components/seo/JsonLd'
import { webPageSchema, locationSchema, faqSchema, breadcrumbSchema, graphSchema } from '@/lib/schema'
import { locationId } from '@/lib/schema/ids'
import { getOgImage, getCanonicalUrl } from '@/lib/utils/metadata'
import type { Location, SiteSettings } from '@/lib/sanity/types'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  const locations = await sanityFetch<{ slug: string }[]>(allLocationsQuery, {}, { tags: ['location'] })
  return (locations || []).map((l) => ({ slug: l.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const [location, settings] = await Promise.all([
    sanityFetch<Location>(locationBySlugQuery, { slug }, { tags: ['location'] }),
    sanityFetch<SiteSettings | null>(siteSettingsQuery, {}, { tags: ['siteSettings'] }),
  ])
  
  if (!location || !settings) return {}
  
  const url = getCanonicalUrl(settings, `/locations/${location.slug}`)
  const title = location.metaTitle || `Services in ${location.city}`
  
  return {
    title,
    description: location.metaDescription || location.description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description: location.metaDescription || location.description,
      url,
      type: 'website',
      images: getOgImage({ pageImage: location.ogImageUrl, settings, alt: title }),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: location.metaDescription || location.description,
      images: getOgImage({ pageImage: location.ogImageUrl, settings, alt: title }),
    },
  }
}

export default async function LocationPage({ params }: Props) {
  const { slug } = await params
  const [location, settings] = await Promise.all([
    sanityFetch<Location>(locationBySlugQuery, { slug }, { tags: ['location'] }),
    sanityFetch<SiteSettings | null>(siteSettingsQuery, {}, { tags: ['siteSettings'] }),
  ])
  
  if (!location || !settings) notFound()

  const url = getCanonicalUrl(settings, `/locations/${location.slug}`)
  const pageGraph = graphSchema([
    webPageSchema({
      url,
      name: location.hasPhysicalPresence ? `Our ${location.city} Office` : `Services in ${location.city}`,
      description: location.metaDescription || location.description,
      siteUrl: settings.siteUrl,
      mainEntity: { '@id': locationId(settings.siteUrl, location.slug, location.hasPhysicalPresence) },
    }),
    locationSchema(location, settings.siteUrl),
    breadcrumbSchema([
      { name: 'Home', url: settings.siteUrl },
      { name: 'Locations', url: `${settings.siteUrl}/locations` },
      { name: location.city, url },
    ]),
    faqSchema(location.faqs, url),
  ])

  return (
    <>
      <JsonLd id={`ld-location-${location.slug}`} data={pageGraph} />
      <main>
        <h1>{location.headline || `Services in ${location.city}`}</h1>
        
        {/* Unique content - required to avoid doorway page penalties */}
        {location.content && location.content.length > 0 && (
          <section>
            <h2>{location.city} Market Insights</h2>
            {/* Render content - you can use PortableText component here */}
            {/* For now, just showing structure */}
          </section>
        )}

        {/* Local proof */}
        {location.testimonials && location.testimonials.length > 0 && (
          <section>
            <h2>What {location.city} Clients Say</h2>
            {location.testimonials.map((testimonial, index) => (
              <div key={index}>
                <blockquote>{testimonial.quote}</blockquote>
                <p>- {testimonial.name}, {testimonial.company}</p>
              </div>
            ))}
          </section>
        )}

        {/* Service areas if applicable */}
        {location.serviceAreas && location.serviceAreas.length > 0 && (
          <section>
            <h2>Service Areas</h2>
            <p>We serve the following areas in and around {location.city}:</p>
            <ul>
              {location.serviceAreas.map((area, index) => (
                <li key={index}>{area}</li>
              ))}
            </ul>
          </section>
        )}

        {/* Physical address if applicable */}
        {location.hasPhysicalPresence && location.address && (
          <section>
            <h2>Visit Our {location.city} Office</h2>
            <address>
              {location.address.street}<br />
              {location.address.city}, {location.address.state} {location.address.zip}
            </address>
          </section>
        )}

        {/* Honest CTA based on presence */}
        <section>
          <h2>
            {location.hasPhysicalPresence
              ? `Let's Meet in ${location.city}`
              : `Ready to Grow Your ${location.city} Business?`}
          </h2>
        </section>
      </main>
    </>
  )
}

