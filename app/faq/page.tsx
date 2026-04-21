import type { Faq } from '@/components/homepage/FAQSection'
import { JsonLd } from '@/components/seo/JsonLd'
import { sanityFetch } from '@/lib/sanity/client'
import { faqPageFaqsQuery } from '@/lib/sanity/queries'
import { breadcrumbSchema, graphSchema } from '@/lib/schema'
import FAQPageClient from './FAQPageClient'

const breadcrumbGraph = graphSchema([
  breadcrumbSchema([
    { name: 'Home', url: 'https://www.vizantir.com' },
    { name: 'FAQ', url: 'https://www.vizantir.com/faq' },
  ]),
])

export default async function FAQPage() {
  const faqs = await sanityFetch<Faq[]>(faqPageFaqsQuery, {}, { tags: ['faq'] })

  return (
    <>
      <JsonLd id="ld-breadcrumb" data={breadcrumbGraph} />
      <FAQPageClient faqs={faqs} />
    </>
  )
}
