import { serviceHref } from '@/lib/service-href'

/** Homepage and footer link these service subpages, in this order. */
export const LINKED_SERVICE_SLUGS = [
  'website-strategy',
  'web-design',
  'web-development',
  'website-refreshes',
  'cms-integrations',
  'website-care',
] as const

export type LinkedService = {
  title: string
  description?: string
  href: string
}

export function toLinkedServices(
  services: { slug: string; title: string; description?: string }[],
): LinkedService[] {
  const bySlug = new Map(services.map((service) => [service.slug, service]))

  return LINKED_SERVICE_SLUGS.flatMap((slug) => {
    const service = bySlug.get(slug)
    if (!service?.title) return []
    return [
      {
        title: service.title,
        description: service.description,
        href: serviceHref(slug),
      },
    ]
  })
}
