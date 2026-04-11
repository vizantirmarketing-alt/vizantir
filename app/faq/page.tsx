import { JsonLd } from '@/components/seo/JsonLd'
import { breadcrumbSchema, graphSchema } from '@/lib/schema'
import FAQPageClient from './FAQPageClient'

const breadcrumbGraph = graphSchema([
  breadcrumbSchema([
    { name: 'Home', url: 'https://www.vizantir.com' },
    { name: 'FAQ', url: 'https://www.vizantir.com/faq' },
  ]),
])

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Why do clients choose Vizantir over larger agencies?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Larger agencies come with overhead, junior account teams, and slow turnarounds. At Vizantir you get senior-level execution, direct communication, and faster delivery without the agency markup.',
      },
    },
    {
      '@type': 'Question',
      name: 'How does the engagement model work?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'We start with a strategy call, scope the engagement, and deliver value before asking for anything long-term. Retainers come after we have earned them, not before.',
      },
    },
    {
      '@type': 'Question',
      name: 'What does the timeline look like from kickoff to launch?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Most website projects take 4 to 6 weeks from kickoff to launch. Timeline depends on scope and how quickly feedback is provided.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can you work with an existing site or brand?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. We can audit and improve an existing site without starting over. If a full rebuild is the better move we will say so honestly.',
      },
    },
    {
      '@type': 'Question',
      name: 'What industries do you specialize in?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'We specialize in hospitality, restaurants, law firms, commercial real estate, and luxury lifestyle brands — high-stakes markets where design and performance directly affect revenue.',
      },
    },
    {
      '@type': 'Question',
      name: 'What is your philosophy on design and results?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Every design decision is tied to an outcome. Layout, copy, and speed are built for conversion. We measure what moves the business, not vanity metrics.',
      },
    },
  ],
}

export default function FAQPage() {
  return (
    <>
      <JsonLd id="ld-breadcrumb" data={breadcrumbGraph} />
      <JsonLd id="ld-faq" data={faqJsonLd} />
      <FAQPageClient />
    </>
  )
}
