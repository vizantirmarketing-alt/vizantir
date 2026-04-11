import { JsonLd } from '@/components/seo/JsonLd'
import { breadcrumbSchema, graphSchema } from '@/lib/schema'
import FAQPageClient from './FAQPageClient'

const breadcrumbGraph = graphSchema([
  breadcrumbSchema([
    { name: 'Home', url: 'https://www.vizantir.com' },
    { name: 'FAQ', url: 'https://www.vizantir.com/faq' },
  ]),
])

export default function FAQPage() {
  return (
    <>
      <JsonLd id="ld-breadcrumb" data={breadcrumbGraph} />
      <FAQPageClient />
    </>
  )
}
