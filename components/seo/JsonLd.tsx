/**
 * Server-rendered JSON-LD component
 * 
 * IMPORTANT: Only use in Server Components
 * This renders directly into HTML for crawlers (no delay)
 */

interface JsonLdProps {
  id: string
  data: Record<string, unknown>
}

export function JsonLd({ id, data }: JsonLdProps) {
  return (
    <script
      id={id}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}




