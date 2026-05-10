import { notFound } from 'next/navigation'
import { sanityFetch } from '@/lib/sanity/client'
import { serviceBySlugQuery, locationBySlugQuery, postBySlugQuery, siteSettingsQuery } from '@/lib/sanity/queries'
import { webPageSchema, serviceSchema, locationSchema, blogPostSchema, faqSchema, breadcrumbSchema, graphSchema } from '@/lib/schema'
import { serviceId, locationId, articleId } from '@/lib/schema/ids'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ path: string[] }>
}

export default async function SchemaDebugPage({ params }: Props) {
  if (process.env.NODE_ENV === 'production') notFound()

  const { path } = await params
  const [type, slug] = path

  if (!type || !slug) {
    return (
      <div style={{ padding: '2rem', fontFamily: 'monospace' }}>
        <h1>Schema Debug</h1>
        <p>Usage: /__schema-debug/[type]/[slug]</p>
        <ul>
          <li>/__schema-debug/service/your-service-slug</li>
          <li>/__schema-debug/location/your-location-slug</li>
          <li>/__schema-debug/post/your-post-slug</li>
        </ul>
      </div>
    )
  }

  const settings = await sanityFetch<any>(siteSettingsQuery, {}, {
    fresh: true,
    tags: ['siteSettings'],
  })
  if (!settings) {
    return (
      <div style={{ padding: '2rem', fontFamily: 'monospace' }}>
        <h1>Schema Debug</h1>
        <p style={{ color: '#d9534f' }}>Error: Site settings not found</p>
      </div>
    )
  }

  let schemaData: any = null
  let pageUrl = ''

  switch (type) {
    case 'service':
      const service = await sanityFetch<any>(serviceBySlugQuery, { slug }, {
        fresh: true,
        tags: ['service'],
      })
      if (!service) notFound()
      pageUrl = `${settings.siteUrl}/services/${slug}`
      schemaData = graphSchema([
        webPageSchema({ url: pageUrl, name: service.title, siteUrl: settings.siteUrl, mainEntity: { '@id': serviceId(settings.siteUrl, slug) } }),
        serviceSchema(service, settings.siteUrl),
        breadcrumbSchema([{ name: 'Home', url: settings.siteUrl }, { name: 'Services', url: `${settings.siteUrl}/services` }, { name: service.title, url: pageUrl }]),
        faqSchema(service.faqs),
      ])
      break
    case 'location':
      const location = await sanityFetch<any>(locationBySlugQuery, { slug }, {
        fresh: true,
        tags: ['location'],
      })
      if (!location) notFound()
      pageUrl = `${settings.siteUrl}/locations/${slug}`
      schemaData = graphSchema([
        webPageSchema({ url: pageUrl, name: location.name, siteUrl: settings.siteUrl, mainEntity: { '@id': locationId(settings.siteUrl, slug, location.hasPhysicalPresence) } }),
        locationSchema(location, settings.siteUrl),
        faqSchema(location.faqs),
      ])
      break
    case 'post':
      const post = await sanityFetch<any>(postBySlugQuery, { slug }, {
        fresh: true,
        tags: ['post'],
      })
      if (!post) notFound()
      pageUrl = `${settings.siteUrl}/blog/${slug}`
      schemaData = graphSchema([
        webPageSchema({ url: pageUrl, name: post.title, siteUrl: settings.siteUrl, mainEntity: { '@id': articleId(settings.siteUrl, slug) } }),
        blogPostSchema(post, settings.siteUrl),
      ])
      break
    default:
      notFound()
  }

  const validation = validateGraph(schemaData, settings.siteUrl)

  return (
    <div style={{ padding: '2rem', fontFamily: 'monospace', maxWidth: '1200px' }}>
      <h1>Schema Debug: {type}/{slug}</h1>
      <p>URL: <a href={pageUrl}>{pageUrl}</a></p>
      
      <h2>Validation</h2>
      <ul>
        <li>@context: {schemaData['@context'] ? '✅' : '❌'}</li>
        <li>@graph: {schemaData['@graph'] ? '✅' : '❌'}</li>
        <li>Nodes: {schemaData['@graph']?.length || 0}</li>
        <li>Valid: {validation.valid ? '✅' : '❌'}</li>
      </ul>
      
      {validation.issues.length > 0 && (
        <ul>{validation.issues.map((i, idx) => <li key={idx} style={{ color: '#d9534f' }}>{i}</li>)}</ul>
      )}
      
      <h2>JSON-LD</h2>
      <pre style={{ background: '#1a1a2e', color: '#eee', padding: '1rem', borderRadius: '8px', overflow: 'auto', maxHeight: '60vh' }}>
        {JSON.stringify(schemaData, null, 2)}
      </pre>
      
      <p><a href={`https://validator.schema.org/#url=${encodeURIComponent(pageUrl)}`} target="_blank" rel="noopener noreferrer">→ Schema.org Validator</a></p>
      <p><a href={`https://search.google.com/test/rich-results?url=${encodeURIComponent(pageUrl)}`} target="_blank" rel="noopener noreferrer">→ Google Rich Results</a></p>
    </div>
  )
}

function validateGraph(schema: any, siteUrl: string): { valid: boolean; issues: string[] } {
  const issues: string[] = []
  const ids = new Set<string>()
  const nodes = schema['@graph'] || []
  
  nodes.forEach((node: any) => {
    if (node['@id']) {
      if (ids.has(node['@id'])) issues.push(`Duplicate @id: ${node['@id']}`)
      ids.add(node['@id'])
    }
  })
  
  return { valid: issues.length === 0, issues }
}

