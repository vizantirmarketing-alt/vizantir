import { industryProjectCostAnswer, industryProjectTimelineAnswer } from './pricing'

export const lasVegasPricingFaqs = {
  cost: 'Custom Las Vegas websites at Vizantir start at $15,000. That covers strategy, design, development, and a Sanity CMS so your team owns the content system. Fixed-scope pricing — no surprise invoices.',
  localVsNational:
    "Out-of-town agencies don't know the difference between Summerlin and Henderson, don't understand how local search actually works for a Las Vegas business, and disappear after launch. Overseas freelancers build template sites that look like every other business in the valley. A local custom studio knows the market, builds the site right the first time, and stays reachable when you need us.",
  timeline:
    'Most projects take 6–8 weeks from kickoff to launch, depending on scope and content readiness. Larger projects with multiple locations or advanced integrations take longer — we scope timelines in discovery.',
  stackAndOwnership:
    'We build every site on Next.js with Sanity CMS. You own everything — the code, the content, the domain, the analytics. No proprietary lock-in, no monthly software rent for basic content edits. If you ever decide to move on, we hand off the repository cleanly.',
  postLaunch:
    'We offer optional care plans starting at $650/month — hosting oversight, security updates, monthly change hours, and preferred rates on future work. Existing site clients also get an existing-site page rate on landing pages and new sections.',
} as const

export const commercialRealEstatePricingFaqs = {
  cost: industryProjectCostAnswer(
    'CRE',
    'The investment covers strategy, design, development, and CMS so your team can manage listings and content without a developer.',
  ),
  timeline: industryProjectTimelineAnswer(
    'commercial real estate projects',
    ' depending on the number of listings and pages required.',
  ),
  listingsCms:
    'We build every CRE site on Sanity so your team can publish listings, update statuses, add photography, and manage market reports without waiting on a developer. Listings render fast, filter cleanly, and route inquiries to the right broker automatically.',
  brokerTeamPages:
    'Broker bios are built as first-class pages with Person schema, headshots, credentials, and direct inquiry routing — so contacts reach the right person the first time. Your team can update bios, add new hires, and manage credentials through the CMS.',
} as const

export const hospitalityPricingFaqs = {
  cost: industryProjectCostAnswer(
    'restaurant',
    'The investment covers strategy, design, development, and CMS integration so your team can update menus and events without a developer.',
  ),
  timeline: industryProjectTimelineAnswer(
    'hospitality projects',
    ', depending on scope and content readiness.',
  ),
  bookingIntegrations:
    'OpenTable, Resy, SevenRooms, Tock, direct booking widgets, and hotel PMS platforms. We can also build a custom reservation flow if your venue requires it. The right choice depends on your operational setup — we sort that out during discovery.',
  menuUpdates:
    'Yes. We build every hospitality site on Sanity CMS so your team can update menus, add specials, publish events, and manage gallery content without waiting on a developer. Seasonal changes take minutes, not project fees.',
} as const

export const lawFirmPricingFaqs = {
  cost: industryProjectCostAnswer(
    'law firm',
    'That covers strategy, design, development, and a CMS so your team can update content without a developer.',
  ),
  timeline: industryProjectTimelineAnswer(
    'law firm projects',
    ', depending on the number of practice areas and attorneys.',
  ),
  practiceAreas:
    'Yes. We build dedicated practice area pages structured for local search — clear expertise signaling, location-relevant keywords, and internal linking so high-intent queries can find the right attorney and practice.',
  existingBrand:
    'Yes. We can build around your existing brand and logo, or refine the visual system as part of the engagement so the site matches the caliber of your practice.',
} as const

export const redesignPricingFaqs = {
  seoRankings:
    "Not if it's done right. Every URL gets mapped, every 301 redirect gets audited, every schema element gets preserved. We audit your ranking pages in discovery and structure the entire migration to protect them. Most redesigns lose rankings because the agency treats SEO as an afterthought — ours are scoped around SEO preservation from day one.",
  contentMigration:
    "Every page gets audited before migration. Ranking pages get preserved. Outdated pages get consolidated or rewritten. Nothing important gets lost. You'll know exactly what's moving, what's being rewritten, and what's being retired before we start building.",
  downtime:
    'No. The new site is built on a staged environment while your current site stays live. When the new site launches, it goes public in a single DNS change — no downtime, no gap where visitors see a broken site. Redirects are verified before the switch.',
  timeline:
    'Most redesigns take 6–10 weeks from kickoff to launch, depending on content volume, custom features, and existing site complexity. Larger sites with hundreds of ranking pages take longer — we scope timelines in discovery based on your actual site.',
  existingPlatform:
    "We've migrated sites off all four. Content gets exported, audited, and rebuilt in Sanity CMS. Redirects get mapped from your existing URLs to the new site structure. Rankings and referral traffic survive because we plan the migration before we touch the design.",
} as const
