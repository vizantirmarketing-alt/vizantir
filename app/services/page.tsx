import { Metadata } from 'next'
import { sanityFetch } from '@/lib/sanity/client'
import { allServicesQuery, siteSettingsQuery } from '@/lib/sanity/queries'
import { JsonLd } from '@/components/seo/JsonLd'
import { collectionPageSchema, breadcrumbSchema, graphSchema } from '@/lib/schema'
import type { ServiceListItem, SiteSettings } from '@/lib/sanity/types'
import ServicesPageClient from './ServicesPageClient'

const DROPPED_SERVICE_SLUGS = new Set(['nextjs-development', 'sanity-cms'])

const SERVICE_MERGES: {
  keepSlug: string
  dropSlug: string
  title?: string
}[] = [
  { keepSlug: 'web-development', dropSlug: 'nextjs-development' },
  { keepSlug: 'cms-integrations', dropSlug: 'sanity-cms', title: 'CMS Integration' },
]

function pickMoreCompleteText(primary?: string, secondary?: string): string | undefined {
  const left = primary?.trim() ?? ''
  const right = secondary?.trim() ?? ''
  if (!left && !right) return undefined
  return right.length > left.length ? right : left
}

function pickMoreCompleteList(primary?: string[], secondary?: string[]): string[] | undefined {
  const left = primary?.filter(Boolean) ?? []
  const right = secondary?.filter(Boolean) ?? []
  if (left.length === 0 && right.length === 0) return primary
  return right.length > left.length ? right : left
}

/** Collapse duplicate Sanity services for the /services accordion. Order is unchanged. */
function mergeDuplicateServices(services: ServiceListItem[]): ServiceListItem[] {
  const bySlug = new Map(services.map((service) => [service.slug, service]))

  return services
    .filter((service) => !DROPPED_SERVICE_SLUGS.has(service.slug))
    .map((service) => {
      const pair = SERVICE_MERGES.find((merge) => merge.keepSlug === service.slug)
      if (!pair) return service

      const dropped = bySlug.get(pair.dropSlug)
      return {
        ...service,
        title: pair.title ?? service.title,
        description: pickMoreCompleteText(service.description, dropped?.description),
        included: pickMoreCompleteList(service.included, dropped?.included),
      }
    })
}

export async function generateMetadata(): Promise<Metadata> {
  const settings = await sanityFetch<SiteSettings | null>(siteSettingsQuery, {}, { tags: ['siteSettings'] })

  if (!settings) {
    return {
      title: 'Website Strategy, Design & Development Services',
      description:
        "Explore strategy, design, development, CMS integrations, and ongoing care for established brands that care how they're perceived.",
    }
  }

  return {
    title: 'Website Strategy, Design & Development Services',
    description:
      "Explore strategy, design, development, CMS integrations, and ongoing care for established brands that care how they're perceived.",
    alternates: { canonical: `${settings.siteUrl}/services` },
  }
}

export default async function ServicesPage() {
  const [services, settings] = await Promise.all([
    sanityFetch<ServiceListItem[]>(allServicesQuery, {}, { tags: ['service'] }),
    sanityFetch<SiteSettings | null>(siteSettingsQuery, {}, { tags: ['siteSettings'] }),
  ])

  // Order matches `allServicesQuery` only (GROQ `order(...)`). No sorting in React.
  const list = mergeDuplicateServices(services ?? [])

  if (!settings) {
    return <ServicesPageClient services={list} />
  }

  const url = `${settings.siteUrl}/services`
  const pageGraph = graphSchema([
    collectionPageSchema({
      url,
      name: 'Our Services',
      description: 'Professional services we offer.',
      siteUrl: settings.siteUrl,
      items: list.map((s) => ({ name: s.title, url: `${settings.siteUrl}/services/${s.slug}` })),
    }),
    breadcrumbSchema([
      { name: 'Home', url: settings.siteUrl },
      { name: 'Services', url },
    ]),
  ])

  return (
    <>
      <JsonLd id="ld-services-index" data={pageGraph} />
      <ServicesPageClient services={list} />
    </>
  )
}
