import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  title: 'Web Design FAQs & Answers | Vizantir Studio',
  description:
    'Find answers to common questions about timelines, pricing and our approach to premium website design and development, all in one place.',
}

const faqPageJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'How much does a website project cost?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Our projects start at $15,000 for focused builds and scale to $30,000–$60,000+ for larger custom engagements. Every project is scoped and priced clearly upfront — no vague starting-at numbers, no surprise invoices.',
      },
    },
    {
      '@type': 'Question',
      name: 'How long does a website project take?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Most projects are completed within 4–6 weeks from kickoff. Larger or more complex builds may run 8–10 weeks. Timelines are set at scoping and held — we move as fast as your feedback allows.',
      },
    },
    {
      '@type': 'Question',
      name: 'Do you build in Next.js or WordPress?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "Both, depending on what fits the project. Next.js for performance-critical, custom builds. WordPress when the client needs a widely supported CMS and a familiar editing environment. We'll recommend the right platform based on your goals, team, and content needs — not our preference.",
      },
    },
    {
      '@type': 'Question',
      name: 'Do you redesign existing websites?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "Yes. We audit what you have, identify what's working, and rebuild from there. You don't need to start from scratch. If a full rebuild makes more sense, we'll tell you honestly and explain why.",
      },
    },
    {
      '@type': 'Question',
      name: 'What happens after the site launches?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'We offer monthly Website Care retainers starting at $500/month for updates, monitoring, content changes, and ongoing improvements. Most clients stay on retainer after launch so the site keeps performing as the business evolves.',
      },
    },
    {
      '@type': 'Question',
      name: 'Do you write copy for the website?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'We can guide the copy structure and messaging strategy as part of the project scope. For full copywriting, we work with trusted partners we can bring in — or we work with your existing content and sharpen it for the web.',
      },
    },
  ],
}

export default function FAQLayout({ children }: { children: ReactNode }) {
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
