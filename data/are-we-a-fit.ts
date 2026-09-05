import type { Metadata } from 'next'

import { carePricing, landingPagePricing, projectPricing } from './pricing'

const [essentialsProjectTier] = projectPricing
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

export const areWeAFitPageTitle = 'Are We a Fit?'
export const areWeAFitPageDescription =
  'Honest criteria on whether Vizantir is the right premium web design studio for your business. Read this before booking a Strategy Call.'

export const areWeAFitPageContent: AreWeAFitPageContent = {
  heroEyebrow: 'Fit & expectations',
  heroHeading: 'Not every web design project is right for us. Not every studio is right for you.',
  heroSubheading:
    "The honest answer to 'are we a fit for your business?' Decide before you book a strategy call with Vizantir.",
  idealSection: {
    id: 'ideal',
    heading: "You're likely a fit if...",
    bullets: [
      'Your current website is working against your brand, and you already know it',
      'You run an established business with real revenue, not a pre-launch idea or a side project',
      'How your business presents itself affects what you can charge and who says yes',
      'You want a site built around how your business actually works, not a template with your logo on it',
      "You expect the site to do a job, and you'll judge it on whether it did",
      `You're ready to invest ${essentialsProjectTier.price} or more in a custom build`,
    ],
  },
  notIdealSection: {
    id: 'notIdeal',
    heading: "You're probably not a fit if...",
    bullets: [
      "Price is your main filter and you're looking for the lowest number in Las Vegas",
      'You want hourly billing, unlimited revisions, or open-ended scope',
      'You want to make the design decisions and hire someone to execute them',
      "You need marketing services. We build websites. We don't run your ads or manage your social",
      'You want a WordPress site assembled from a template and plugins',
      'You need a full website live in two weeks',
    ],
  },
  budgetSection: {
    id: 'budget',
    heading: 'What it costs.',
    paragraphs: [
      `Custom website projects start at ${essentialsProjectTier.price} and scale past $60,000. What moves the number is scope: how many pages, how much custom functionality, whether we're building the content system or migrating one.`,
      {
        before: '',
        link: { label: 'Campaign landing pages', href: '/services/landing-pages' },
        after: ` start at ${campaignLandingPageFloor}, for a business that needs one page to do one job. After launch, Website Care is optional ongoing work — content, conversion, search, and related improvements. Monthly plans range from ${carePricing[0].price} to ${carePricing[2].price}; see the Services page.`,
      },
      "If budget is the deciding factor, Squarespace and Wix are the right call. We're a fit when a weak website costs you more than a strong one does.",
      "If we don't think a project at this level will pay for itself in your business, we'll say so on the call before you spend anything.",
    ],
  },
  closingSection: {
    id: 'closing',
    heading: 'Still unsure?',
    body: "If you've read this page and you're still not sure whether Vizantir is right for your business, that's what the Strategy Call is for. Thirty minutes, no pitch deck. We'll tell you honestly whether we're the right studio for your project, or point you to someone better suited.",
  },
  closingCta: {
    label: 'Book a Strategy Call',
    href: '/contact',
  },
}

function sectionAnswer(section: AreWeAFitBulletSection): string {
  if (section.bullets?.length) return section.bullets.join(' ')
  if (section.paragraphs?.length) {
    return section.paragraphs.map(flattenAreWeAFitParagraph).join(' ')
  }
  return section.body ?? ''
}

export const areWeAFitFaqs = [
  {
    question: areWeAFitPageContent.idealSection.heading,
    answer: sectionAnswer(areWeAFitPageContent.idealSection),
  },
  {
    question: areWeAFitPageContent.notIdealSection.heading,
    answer: sectionAnswer(areWeAFitPageContent.notIdealSection),
  },
  {
    question: areWeAFitPageContent.budgetSection.heading,
    answer: sectionAnswer(areWeAFitPageContent.budgetSection),
  },
  {
    question: areWeAFitPageContent.closingSection.heading,
    answer: sectionAnswer(areWeAFitPageContent.closingSection),
  },
] as const
