import type { Metadata } from 'next'

const canonicalUrl = 'https://www.vizantir.com/about'

export const aboutMetadata: Metadata = {
  title: 'About Vizantir | Premium Web Design Studio Las Vegas',
  description:
    'Vizantir is a Las Vegas web design and development studio building custom Next.js websites for established brands that have outgrown their current site.',
  alternates: {
    canonical: canonicalUrl,
  },
  openGraph: {
    title: 'About Vizantir | Premium Web Design Studio Las Vegas',
    description:
      'Vizantir is a Las Vegas web design and development studio building custom Next.js websites for established brands that have outgrown their current site.',
    url: canonicalUrl,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About Vizantir | Premium Web Design Studio Las Vegas',
    description:
      'Vizantir is a Las Vegas web design and development studio building custom Next.js websites for established brands that have outgrown their current site.',
  },
}

export interface AboutHeroContent {
  heading: string
}

export interface AboutIntroContent {
  paragraph: string
  examples: readonly string[]
  closing: string
}

export interface AboutNarrativeSection {
  id: 'newStudio' | 'whatWeBuildOn' | 'whoWeWorkWith' | 'behindVizantir'
  heading: string
  paragraphs: readonly string[]
}

export interface AboutFinalCtaContent {
  href: string
  label: string
}

export interface AboutPageContent {
  eyebrow: string
  hero: AboutHeroContent
  intro: AboutIntroContent
  sections: readonly AboutNarrativeSection[]
  finalCta: AboutFinalCtaContent
}

export const aboutPageContent: AboutPageContent = {
  eyebrow: 'Our History',
  hero: {
    heading: 'A studio for brands that have outgrown their website',
  },
  intro: {
    paragraph:
      'Vizantir is a design and development studio based in Las Vegas. We build websites for brands whose business has moved past what their current site can carry.',
    examples: [
      'A restaurant still running on a stock WordPress theme.',
      'A law firm with a site that no longer reflects the quality of its work.',
      'A real estate group whose portfolio looks like every other listing page.',
    ],
    closing:
      "Most of our clients already have a website. The problem is that it was built for a version of their business they've outgrown.",
  },
  sections: [
    {
      id: 'newStudio',
      heading: 'New studio, not a first attempt',
      paragraphs: [
        'Vizantir is new. The experience behind it is not.',
        'The studio was founded on more than ten years of hands-on web development — from custom WordPress themes to modern websites and applications built with Next.js, TypeScript, and Sanity.',
        'That background matters. We know why WordPress became the default, and we know where it starts to fall short for brands that care about speed, security, and design.',
        "Most agencies only know one side of that story. We've built on both.",
      ],
    },
    {
      id: 'whatWeBuildOn',
      heading: 'What we build on',
      paragraphs: [
        'Every Vizantir site is built on Next.js, TypeScript, Sanity, and Vercel.',
        'No page builders. No bloated plugin stacks. No fragile setup that needs constant patching just to stay stable.',
        "The result is a site that loads faster than most WordPress sites, is harder to compromise, and is easier for your team to update day-to-day. We put as much thought into the editing experience as we do the visitor experience, because the people maintaining your site shouldn't dread logging in.",
      ],
    },
    {
      id: 'whoWeWorkWith',
      heading: 'Who we work with',
      paragraphs: [
        'Vizantir works with premium brands and established businesses — luxury hospitality, boutique law firms, commercial real estate, and product companies that serve a discerning audience.',
        "The common thread isn't the industry. It's the standard.",
        'Our clients care about craft, notice when something is off, and want their website to hold up to the same scrutiny as the rest of their business.',
      ],
    },
    {
      id: 'behindVizantir',
      heading: 'Behind Vizantir',
      paragraphs: [
        'Vizantir runs as a focused studio, not a traditional agency.',
        "The person you meet in a first call is the person doing the work — the design, the development, the decisions. There's no sales handoff and no account manager passing things along.",
        'The studio was started after years of watching good brands get handed generic websites by agencies that treat web as an add-on to a marketing retainer.',
        'Vizantir exists to do it differently, for clients who want it done well.',
      ],
    },
  ],
  finalCta: {
    href: '/are-we-a-fit',
    label: 'Are We a Fit?',
  },
}
