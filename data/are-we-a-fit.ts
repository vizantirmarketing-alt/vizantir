import type { Metadata } from 'next'

import { projectPricing } from './pricing'

const [essentialsProjectTier, , enterpriseProjectTier] = projectPricing

const canonicalUrl = 'https://www.vizantir.com/are-we-a-fit'

export const areWeAFitMetadata: Metadata = {
  title: 'Are We a Fit? Premium Web Design for Established Businesses | Vizantir',
  description:
    "Vizantir is a premium Las Vegas web design studio for established businesses whose website no longer reflects their brand. Learn if we're the right fit for your project.",
  alternates: {
    canonical: canonicalUrl,
  },
  openGraph: {
    title: 'Are We a Fit? Premium Web Design for Established Businesses | Vizantir',
    description:
      "Vizantir is a premium Las Vegas web design studio for established businesses whose website no longer reflects their brand. Learn if we're the right fit for your project.",
    url: canonicalUrl,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Are We a Fit? Premium Web Design for Established Businesses | Vizantir',
    description:
      "Vizantir is a premium Las Vegas web design studio for established businesses whose website no longer reflects their brand. Learn if we're the right fit for your project.",
  },
}

export interface AreWeAFitBulletSection {
  id: 'ideal' | 'notIdeal' | 'budget' | 'closing'
  heading: string
  /** Present for prose sections (budget, closing); omit for bullet-only sections */
  body?: string
  bullets?: readonly string[]
}

export interface AreWeAFitCta {
  label: string
  href: string
}

export interface AreWeAFitPageContent {
  heroEyebrow: string
  heroHeading: string
  heroSubheading: string
  idealSection: AreWeAFitBulletSection
  notIdealSection: AreWeAFitBulletSection
  budgetSection: AreWeAFitBulletSection
  closingSection: AreWeAFitBulletSection
  closingCta: AreWeAFitCta
}

export const areWeAFitPageContent: AreWeAFitPageContent = {
  heroEyebrow: 'Fit & expectations',
  heroHeading: 'Not every web design project is right for us. Not every studio is right for you.',
  heroSubheading:
    "The honest answer to 'are we a fit for your business?' — so you can decide before you book a strategy call with Vizantir.",
  idealSection: {
    id: 'ideal',
    heading: "You're likely a fit if...",
    bullets: [
      'You run an established business in Las Vegas or nationwide — not a pre-launch idea or side project',
      'Your current website is hurting your brand more than helping — and you already know it',
      'You run an established business where presentation and trust affect revenue — beauty, wellness, creative studios, professional services, retail, luxury, or financial services',
      'You want a custom website designed around your business — not a template with your logo pasted on it',
      'You care about strategy, conversion, and search visibility — not just aesthetics',
      `You're ready to invest ${essentialsProjectTier.price} or more in a premium web design project`,
    ],
  },
  notIdealSection: {
    id: 'notIdeal',
    heading: "You're probably not a fit if...",
    bullets: [
      "You're looking for the cheapest web design agency in Las Vegas",
      'You want unlimited revisions, hourly billing, or "just buy more hours to finish"',
      'You want to build the site yourself and hire someone to push buttons',
      "You need full-service marketing — we build websites; we don't run your Google Ads or manage your social media",
      'You want a plugin-heavy WordPress template, not a custom Next.js build',
      'You need the site live in two weeks',
    ],
  },
  budgetSection: {
    id: 'budget',
    heading: "Let's talk web design pricing honestly.",
    body: `Custom website design projects at Vizantir start at ${essentialsProjectTier.price} and scale up to ${enterpriseProjectTier.price} depending on scope and complexity. That's not the cheapest option in the Las Vegas web design market — and it's not meant to be. If budget is your primary concern, there are excellent template-based solutions from platforms like Squarespace, Webflow, and Wix that will serve you well. Vizantir is for businesses where the cost of a mediocre website — lost trust, lost leads, lost deals — is higher than the investment in a premium one.`,
  },
  closingSection: {
    id: 'closing',
    heading: 'Still unsure?',
    body: "If you've read this page and you're still not sure whether Vizantir is the right web design partner for your business, that's exactly what the Strategy Call is for. It's a 30-minute conversation — no pitch deck, no pressure — where we'll tell you honestly whether our studio is the right fit for your project, or recommend someone better suited.",
  },
  closingCta: {
    label: 'Book a Strategy Call',
    href: '/contact',
  },
}
