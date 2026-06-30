import { projectPricing, pricingFAQs } from './pricing'

const essentialsProjectTier = projectPricing[0]

export interface LasVegasHeroContent {
  eyebrow: string
  heading: string
  headingAccent: string
  subheading: string
  primaryCta: { label: string; href: string }
  secondaryCta: { label: string; href: string }
}

export interface LasVegasIntroContent {
  heading: string
  paragraphs: readonly string[]
}

export interface LasVegasWhatYouGetItem {
  title: string
  description: string
}

export interface LasVegasProcessStep {
  step: number
  title: string
  description: string
}

export interface LasVegasPricingTier {
  name: string
  price: string
  timeline: string
  description: string
  includes: readonly string[]
  featured?: boolean
}

export interface LasVegasIndustriesContent {
  heading: string
  body: string
  items: readonly string[]
}

export interface LasVegasFaqItem {
  question: string
  answer: string
}

export interface LasVegasClosingCtaContent {
  heading: string
  body: string
  cta: { label: string; href: string }
  phoneNote: string
}

export interface LasVegasPageData {
  hero: LasVegasHeroContent
  intro: LasVegasIntroContent
  whatYouGet: {
    heading: string
    subheading: string
    items: readonly LasVegasWhatYouGetItem[]
  }
  process: {
    heading: string
    subheading: string
    steps: readonly LasVegasProcessStep[]
  }
  pricing: {
    heading: string
    subheading: string
    retainerNote: string
    tiers: readonly LasVegasPricingTier[]
  }
  industries: LasVegasIndustriesContent
  faqs: {
    heading: string
    items: readonly LasVegasFaqItem[]
  }
  closingCta: LasVegasClosingCtaContent
}

export const lasVegasPageData: LasVegasPageData = {
  hero: {
    eyebrow: 'Las Vegas · Southern Nevada',
    heading: 'Las Vegas Web Design',
    headingAccent: 'Built for businesses that need their site to work harder',
    subheading:
      'Vizantir is a Las Vegas design studio building custom websites on Next.js 16 for established companies across the valley and nationwide. Strategy, design, and development under one roof.',
    primaryCta: { label: 'Book a Strategy Call', href: '/contact' },
    secondaryCta: { label: 'See how we work', href: '/how-we-work' },
  },
  intro: {
    heading: 'Your website is doing a job. Most aren\'t built for it.',
    paragraphs: [
      'A Las Vegas business owner recently told us their site looked fine but hadn\'t brought in a qualified lead in eight months. The design was dated, the mobile experience was rough, and every page load felt like waiting for dial-up. They weren\'t losing customers to competitors with better products. They were losing them to competitors with better websites.',
      'That pattern shows up everywhere we look: professional services firms in Henderson, retail groups in Summerlin, home services companies in Paradise. The business outgrew the site years ago. Vizantir rebuilds from scratch on Next.js 16 with a CMS your team can actually use, so the site keeps pace with how you operate today.',
      'We work locally when it helps and remotely when it doesn\'t. Same timezone, same direct line to the people building your project. No account managers reading from a script.',
    ],
  },
  whatYouGet: {
    heading: 'What\'s included',
    subheading:
      'Every project is scoped before design starts. Here is what a typical Vizantir build covers.',
    items: [
      {
        title: 'Discovery and site architecture',
        description:
          'We map your goals, audience, and content before pixels hit the screen. Sitemap, page priorities, and conversion paths are agreed in writing.',
      },
      {
        title: 'Custom visual design',
        description:
          'Layouts built for your brand, not pulled from a theme marketplace. Desktop and mobile comps for every key page.',
      },
      {
        title: 'Next.js 16 development',
        description:
          'Hand-coded front end with TypeScript. Fast loads, clean URLs, and a stack that does not depend on plugin updates to stay secure.',
      },
      {
        title: 'Sanity CMS integration',
        description:
          'Your team edits text, images, and blog posts without opening a ticket. Structured content fields keep pages consistent.',
      },
      {
        title: 'Technical SEO foundation',
        description:
          'Metadata, schema markup, sitemap, and Core Web Vitals tuned before launch. We set up the structure; ongoing content is yours or ours via retainer.',
      },
      {
        title: 'Launch support and handoff',
        description:
          'DNS, redirects, analytics hooks, and a recorded walkthrough so you know how to manage the site on day one.',
      },
    ],
  },
  process: {
    heading: 'How a project runs',
    subheading: 'Five phases, fixed scope, no surprise invoices halfway through.',
    steps: [
      {
        step: 1,
        title: 'Strategy call',
        description:
          'Thirty minutes to understand your business, timeline, and budget. We tell you honestly if Vizantir is the right fit.',
      },
      {
        step: 2,
        title: 'Discovery and proposal',
        description:
          'Written scope with deliverables, timeline, and fixed price. You approve before any design work begins.',
      },
      {
        step: 3,
        title: 'Design',
        description:
          'High-fidelity comps in rounds with clear feedback windows. Revisions stay inside the agreed scope.',
      },
      {
        step: 4,
        title: 'Development',
        description:
          'Build on a staging URL you can review anytime. Content entry, forms, and integrations happen here.',
      },
      {
        step: 5,
        title: 'Launch and handoff',
        description:
          'Final QA, go-live, and training. Optional Website Care retainer starts after if you want ongoing updates.',
      },
    ],
  },
  pricing: {
    heading: 'Project pricing',
    subheading:
      'Fixed-price builds for businesses ready to invest in a site that lasts. All tiers include strategy, design, development, and CMS setup.',
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
  industries: {
    heading: 'Who we build for',
    body:
      'Vizantir works with established businesses across Southern Nevada and the U.S. Recent projects have included a Las Vegas salon group recovering from a hacked WordPress install, a private nail studio that migrated off Wix, and a dance studio that outgrew its template. We also take on medical practices, financial advisors, contractors, and franchise operators. If presentation affects revenue, we can probably help.',
    items: [
      'Professional services and B2B',
      'Retail and consumer brands',
      'Healthcare and wellness',
      'Real estate and property',
      'Hospitality and food service',
      'Home services and trades',
      'Financial and advisory firms',
    ],
  },
  faqs: {
    heading: 'Las Vegas web design questions',
    items: [
      {
        question: 'How much does web design cost in Las Vegas?',
        answer: `Template sites from local freelancers often run $3,000–$8,000. Custom WordPress builds typically land between $8,000 and $20,000. Vizantir projects start at ${essentialsProjectTier.price} for a fixed-scope Next.js build. Price depends on page count, integrations, and content complexity. We quote after discovery, not before.`,
      },
      {
        question: 'Why hire a Las Vegas web design studio instead of a national agency?',
        answer:
          'Timezone alignment matters when you want same-day feedback. We can meet in person when a walkthrough helps. You also get a team that knows the local market without treating every business like a casino or a law firm. National agencies can be excellent; we compete on direct access and custom builds, not headcount.',
      },
      {
        question: 'Do you only work with Las Vegas businesses?',
        answer:
          'No. We are based in Las Vegas and serve clients across Henderson, Summerlin, Paradise, and the wider valley, but roughly half our work is with companies outside Nevada. Remote collaboration is standard for us.',
      },
      {
        question: 'What stack do you build on?',
        answer:
          'Next.js 16, React, TypeScript, and Tailwind CSS on the front end. Sanity for content management. Hosted on Vercel for speed and reliability. We chose this stack because it performs well, scales cleanly, and does not require monthly plugin maintenance.',
      },
      {
        question: 'How long does a website project take?',
        answer: `${pricingFAQs.timeline} Timelines assume you can provide content and feedback on schedule.`,
      },
      {
        question: 'Can you redesign an existing site without starting from zero?',
        answer:
          'Sometimes a refresh is enough. More often, businesses come to us because the current platform (WordPress, Wix, Squarespace) is the bottleneck. We assess during the strategy call and recommend a full rebuild only when it saves money long term.',
      },
      {
        question: 'What happens after launch?',
        answer: `You own the site and the codebase. ${pricingFAQs.retainer} if you want us handling updates, content changes, and small improvements. Many clients manage day-to-day edits themselves through Sanity and call us for larger work.`,
      },
    ],
  },
  closingCta: {
    heading: 'Ready to talk about your site?',
    body:
      'Tell us what is not working today and what a better website should do for your business. We will give you a straight answer on scope, timeline, and whether Vizantir is the right studio for the job.',
    cta: { label: 'Book a Strategy Call', href: '/contact' },
    phoneNote: 'Or call us at (702) 289-0758',
  },
}
