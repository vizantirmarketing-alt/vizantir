import { JsonLd } from '@/components/seo/JsonLd'
import { breadcrumbSchema, graphSchema } from '@/lib/schema'
import GetStartedPageClient from './GetStartedPageClient'

const breadcrumbGraph = graphSchema([
  breadcrumbSchema([
    { name: 'Home', url: 'https://www.vizantir.com' },
    { name: 'Get Started', url: 'https://www.vizantir.com/get-started' },
  ]),
])

export default function GetStartedPage() {
  return (
    <>
      <JsonLd id="ld-breadcrumb" data={breadcrumbGraph} />
      <GetStartedPageClient />
    </>
  )
}
