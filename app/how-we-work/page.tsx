import { JsonLd } from '@/components/seo/JsonLd'
import { breadcrumbSchema, graphSchema } from '@/lib/schema'
import HowWeWorkPageClient from './HowWeWorkPageClient'

const breadcrumbGraph = graphSchema([
  breadcrumbSchema([
    { name: 'Home', url: 'https://www.vizantir.com' },
    { name: 'How We Work', url: 'https://www.vizantir.com/how-we-work' },
  ]),
])

export default function HowWeWorkPage() {
  return (
    <>
      <JsonLd id="ld-breadcrumb" data={breadcrumbGraph} />
      <HowWeWorkPageClient />
    </>
  )
}
