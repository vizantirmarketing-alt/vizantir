import type { Metadata } from 'next'

import { carePricing, landingPagePricing, projectPricing } from './pricing'

const [essentialsProjectTier, , enterpriseProjectTier] = projectPricing
const [essentialCareTier] = carePricing
const campaignLandingPageTier = landingPagePricing.find(
  (tier) => tier.slug === 'campaign-landing-page',
)
if (!campaignLandingPageTier) {
  throw new Error('landingPagePricing is missing campaign-landing-page')
}
const campaignLandingPageFloor = `$${campaignLandingPageTier.priceMin.toLocaleString('en-US')}`

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
    siteName: 'Vizantir',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: 'https://www.vizantir.com/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Vizantir Design Studio - Premium Web Design Las Vegas',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Are We a Fit? Premium Web Design for Established Businesses | Vizantir',
    description:
      "Vizantir is a premium Las Vegas web design studio for established businesses whose website no longer reflects their brand. Learn if we're the right fit for your project.",
  },
}

export interface AreWeAFitLinkedParagraph {
  before: string
  link: { label: string; href: string }
  after: string
}

export type AreWeAFitParagraph = string | AreWeAFitLinkedParagraph

interface AreWeAFitBulletSection {
  id: 'ideal' | 'notIdeal' | 'budget' | 'closing'
  heading: string
  /** Present for single-prose sections (closing); omit when using paragraphs */
  body?: string
  /** Multi-paragraph prose (budget); plain string or linked segment */
  paragraphs?: readonly AreWeAFitParagraph[]
  bullets?: readonly string[]
}

interface AreWeAFitCta {
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

export function flattenAreWeAFitParagraph(paragraph: AreWeAFitParagraph): string {
  if (typeof paragraph === 'string') return paragraph
  return `${paragraph.before}${paragraph.link.label}${paragraph.after}`
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
      `You're ready to invest ${essentialsProjectTier.price} or more in a custom website build`,
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
      'You need a full website live in two weeks',
    ],
  },
  budgetSection: {
    id: 'budget',
    heading: "Let's talk web design pricing honestly.",
    paragraphs: [
      `Custom website projects start at ${essentialsProjectTier.price} and scale to ${enterpriseProjectTier.price} depending on scope. That's not the cheapest option in the Las Vegas web design market, and it isn't meant to be.`,
      {
        before: 'We also build ',
        link: { label: 'campaign landing pages', href: '/services/landing-pages' },
        after: ` starting at ${campaignLandingPageFloor}, for businesses that need one page to do one job: a paid campaign, a launch, a single offer. After launch, care retainers start at ${essentialCareTier.price}.`,
      },
      'If budget is your primary concern, template platforms like Squarespace, Webflow, and Wix will serve you well. Vizantir is for businesses where the cost of a mediocre website — lost trust, lost leads, lost deals — is higher than the investment in a premium one.',
    ],
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
