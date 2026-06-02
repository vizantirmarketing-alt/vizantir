import { projectPricing, pricingFAQs } from './pricing'

export interface RedesignPageData {
  hero: {
    eyebrow: string
    heading: string
    headingAccent: string
    subheading: string
    primaryCta: { label: string; href: string }
    secondaryCta: { label: string; href: string }
  }
  intro: {
    heading: string
    paragraphs: readonly string[]
  }
  whatYouGet: {
    heading: string
    subheading: string
    items: readonly { title: string; description: string }[]
  }
  process: {
    heading: string
    subheading: string
    steps: readonly { step: number; title: string; description: string }[]
  }
  pricing: {
    heading: string
    subheading: string
    retainerNote: string
    tiers: readonly {
      name: string
      price: string
      timeline: string
      description: string
      includes: readonly string[]
      featured?: boolean
    }[]
  }
  signs: {
    heading: string
    subheading: string
    items: readonly { title: string; description: string }[]
  }
  faqs: {
    heading: string
    items: readonly { question: string; answer: string }[]
  }
  closingCta: {
    heading: string
    body: string
    cta: { label: string; href: string }
    phoneNote: string
  }
}

export const redesignPageData: RedesignPageData = {
  hero: {
    eyebrow: 'Website Redesign · Las Vegas',
    heading: 'Your site exists.',
    headingAccent: 'It just isn\'t working.',
    subheading:
      'You already have a website. The problem is it doesn\'t reflect where the business is today — and it\'s costing you leads you never know you lost. Vizantir rebuilds from scratch on Next.js 16, designed around how your business actually operates.',
    primaryCta: { label: 'Book a Strategy Call', href: '/contact' },
    secondaryCta: { label: 'See our work', href: '/our-work' },
  },
  intro: {
    heading: 'A website redesign isn\'t about a new look.',
    paragraphs: [
      'Most businesses come to us with the same story. The site was built a few years ago, it looked fine at the time, and somewhere along the way the business grew past it. The design feels dated. The mobile experience is rough. The phone isn\'t ringing the way it should.',
      'The instinct is to freshen it up — new colors, new photos, maybe a new font. That rarely fixes the real problem. What\'s actually broken is the structure, the performance, and the way the site communicates trust to someone who has never heard of you.',
      'A proper redesign starts with understanding what the site needs to do — who it needs to reach, what will make them stay, and what will make them call. The visual direction comes after that. Not before.',
    ],
  },
  whatYouGet: {
    heading: 'What a Vizantir redesign includes',
    subheading:
      'Every redesign is scoped to what your site actually needs — not a package with services bundled in that you will never use.',
    items: [
      {
        title: 'Business and competitor research',
        description:
          'Before anything is designed we look at your market, your competitors, and how your current site is performing. That research drives every decision that follows.',
      },
      {
        title: 'Site architecture and content strategy',
        description:
          'We map the new site structure before design begins — pages, priorities, and conversion paths agreed in writing so there are no surprises.',
      },
      {
        title: 'Custom visual design',
        description:
          'Built for your brand, not pulled from a template library. Desktop and mobile comps for every key page before a line of code is written.',
      },
      {
        title: 'Next.js 16 development',
        description:
          'Hand-coded front end. Fast loads, clean URLs, and a codebase that does not depend on plugin updates to stay secure or functional.',
      },
      {
        title: 'Content migration',
        description:
          'Existing content, images, and blog posts moved to the new site cleanly. Nothing important gets left behind.',
      },
      {
        title: 'Technical SEO and redirects',
        description:
          'Old URLs redirected correctly so existing search rankings are protected. Metadata, schema, sitemap, and Core Web Vitals set up before launch.',
      },
      {
        title: 'Sanity CMS',
        description:
          'Your team updates text, images, and pages without opening a ticket. Built for the way you actually manage content.',
      },
      {
        title: 'Launch and handoff',
        description:
          'DNS, analytics, and a recorded walkthrough so you know exactly how to manage the site from day one.',
      },
    ],
  },
  process: {
    heading: 'How a redesign runs',
    subheading: 'Fixed scope, fixed price, no surprise invoices.',
    steps: [
      {
        step: 1,
        title: 'Strategy call',
        description:
          'We look at your current site together and talk through what is not working. Thirty minutes and you will know whether a redesign makes sense and what it would involve.',
      },
      {
        step: 2,
        title: 'Research and discovery',
        description:
          'We audit your current site, research your competitors, and map the new architecture. Written scope with deliverables, timeline, and fixed price before design starts.',
      },
      {
        step: 3,
        title: 'Design',
        description:
          'High-fidelity comps in rounds with clear feedback windows. You see exactly what you are getting before development begins.',
      },
      {
        step: 4,
        title: 'Development and migration',
        description:
          'Built on a staging URL you can review anytime. Content migration, forms, redirects, and integrations handled here.',
      },
      {
        step: 5,
        title: 'Launch and handoff',
        description:
          'Final QA, go-live, redirect verification, and training. Optional Website Care retainer starts after if you want ongoing support.',
      },
    ],
  },
  pricing: {
    heading: 'Redesign pricing',
    subheading:
      'Fixed-price projects for businesses ready to invest in a site that lasts. All tiers include research, strategy, design, development, and CMS setup.',
    retainerNote: pricingFAQs.retainer,
    tiers: projectPricing.map((tier) => ({
      name: tier.name,
      price: tier.price,
      timeline: tier.timeline,
      description: tier.description,
      includes: tier.includes,
      ...(tier.featured ? { featured: true as const } : {}),
    })),
  },
  signs: {
    heading: 'Signs your site needs more than a refresh',
    subheading:
      'A fresh coat of paint fixes how something looks. These problems run deeper.',
    items: [
      {
        title: 'It doesn\'t rank on Google',
        description:
          'If competitors are showing up and you are not, the problem is usually structural — not content. Technical SEO issues baked into the original build are hard to patch without rebuilding.',
      },
      {
        title: 'It loads slowly on mobile',
        description:
          'Most traffic is mobile. A site that loads in four seconds on a phone loses visitors before they read a word — and Google scores mobile performance separately.',
      },
      {
        title: 'It doesn\'t reflect where the business is today',
        description:
          'Your business has grown, your services have changed, your positioning has sharpened. The site still says what it said three years ago.',
      },
      {
        title: 'The platform is the bottleneck',
        description:
          'WordPress, Wix, Squarespace — these platforms work until they don\'t. Plugin conflicts, security issues, and editing limitations compound over time.',
      },
      {
        title: 'It isn\'t converting',
        description:
          'Traffic exists but calls and inquiries don\'t. The issue is almost never the traffic — it\'s what happens when someone lands on the site.',
      },
      {
        title: 'You are embarrassed to hand out the URL',
        description:
          'That feeling is information. If you hesitate before sharing your own website, your prospects notice too.',
      },
    ],
  },
  faqs: {
    heading: 'Website redesign questions',
    items: [
      {
        question: 'How do I know if I need a full redesign or just a refresh?',
        answer:
          'A refresh makes sense when the design feels dated but the platform is solid and the site is performing. A full redesign makes sense when the platform is the bottleneck, the site isn\'t ranking, mobile performance is poor, or the structure no longer matches how the business operates. We assess this on the strategy call and give you a straight answer.',
      },
      {
        question: 'Will a redesign hurt my existing search rankings?',
        answer:
          'Only if it is handled carelessly. Proper redirects, preserved URL structures where possible, and technical SEO setup before launch protect existing rankings. We handle all of this as part of the build.',
      },
      {
        question: 'How long does a website redesign take?',
        answer: `${pricingFAQs.timeline} Timelines assume you can provide feedback and content on schedule. Redesigns that include significant content migration may run slightly longer.`,
      },
      {
        question: 'Can you work with our existing brand or do we need to start over?',
        answer:
          'We work with your existing brand guidelines if they are solid. If the brand itself needs work we can address that as part of the project scope. Either way the visual direction is agreed before development starts.',
      },
      {
        question: 'What happens to our current site during the redesign?',
        answer:
          'It stays live throughout. We build the new site on a staging URL you can review at any time. The switchover happens at launch after final QA — typically a few hours of DNS propagation with no downtime.',
      },
      {
        question: 'How much does a website redesign cost in Las Vegas?',
        answer:
          'It depends on what the site needs. A focused redesign of a five to eight page site runs less than a full platform migration with content strategy and integrations. We quote after discovery, not before — scope drives price, not the other way around.',
      },
    ],
  },
  closingCta: {
    heading: 'Not sure what your site actually needs?',
    body:
      'Tell us what is not working today. We will look at the site, tell you honestly what we see, and give you a clear picture of what a redesign would involve — scope, timeline, and cost. No pitch deck, no pressure.',
    cta: { label: 'Book a Strategy Call', href: '/contact' },
    phoneNote: 'Or call us at (702) 289-0758',
  },
}
