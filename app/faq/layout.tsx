import type { Faq } from '@/components/homepage/FAQSection'
import type { ReactNode } from 'react'
import { sanityFetch } from '@/lib/sanity/client'
import { faqPageFaqsQuery } from '@/lib/sanity/queries'

export default async function FAQLayout({ children }: { children: ReactNode }) {
  const faqs = await sanityFetch<Faq[]>(faqPageFaqsQuery, {}, { tags: ['faq'] })

  const faqPageJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqPageJsonLd) }}
      />
      {children}
    </>
  )
}
