import { industryProjectCostAnswer, industryProjectTimelineAnswer } from './pricing'

export const lasVegasPricingFaqs = {
  cost: 'Custom Las Vegas websites at Vizantir start at $15,000. That covers strategy, design, development, and a Sanity CMS so your team owns the content system. Fixed-scope pricing. No surprise invoices.',
  localVsNational:
    "Out-of-town agencies don't know the difference between Summerlin and Henderson, don't understand how local search actually works for a Las Vegas business, and disappear after launch. Overseas freelancers build template sites that look like every other business in the valley. A local custom studio knows the market, builds the site right the first time, and stays reachable when you need us.",
  timeline:
    'Most projects take 6–8 weeks from kickoff to launch, depending on scope and content readiness. Larger projects with multiple locations or advanced integrations take longer. We scope timelines in discovery.',
  stackAndOwnership:
    'We build every site on Next.js with Sanity CMS. You own everything. The code, the content, the domain, the analytics. No proprietary lock-in, no monthly software rent for basic content edits. If you ever decide to move on, we hand off the repository cleanly.',
  postLaunch:
    'We offer optional care plans starting at $295/month. Hosting oversight, security updates, monthly change hours, and preferred rates on future work. Existing site clients also get an existing-site page rate on landing pages and new sections, which applies in place of care preferred rates rather than in addition to them.',
} as const

export const lasVegasPricingFaqItems = [
  {
    question: 'How much does a Las Vegas web design project cost?',
    answer: lasVegasPricingFaqs.cost,
  },
  {
    question: 'Why hire a local studio vs a national agency or overseas freelancer?',
    answer: lasVegasPricingFaqs.localVsNational,
  },
  {
    question: 'How long does a Las Vegas web design project take?',
    answer: lasVegasPricingFaqs.timeline,
  },
  {
    question: 'What technology do you use, and do we own it?',
    answer: lasVegasPricingFaqs.stackAndOwnership,
  },
  {
    question: 'What happens after the site launches?',
    answer: lasVegasPricingFaqs.postLaunch,
  },
] as const

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
    'Broker bios are built as first-class pages with Person schema, headshots, credentials, and direct inquiry routing, so contacts reach the right person the first time. Your team can update bios, add new hires, and manage credentials through the CMS.',
} as const

export const commercialRealEstatePricingFaqItems = [
  {
    question: 'How much does a commercial real estate website cost?',
    answer: commercialRealEstatePricingFaqs.cost,
  },
  {
    question: 'How long does it take to build a CRE website?',
    answer: commercialRealEstatePricingFaqs.timeline,
  },
  {
    question: 'How does the listings CMS work?',
    answer: commercialRealEstatePricingFaqs.listingsCms,
  },
  {
    question: 'How do you handle broker and team pages?',
    answer: commercialRealEstatePricingFaqs.brokerTeamPages,
  },
] as const

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
    'OpenTable, Resy, SevenRooms, Tock, direct booking widgets, and hotel PMS platforms. We can also build a custom reservation flow if your venue requires it. The right choice depends on your operational setup. We sort that out during discovery.',
  menuUpdates:
    'Yes. We build every hospitality site on Sanity CMS so your team can update menus, add specials, publish events, and manage gallery content without waiting on a developer. Seasonal changes take minutes, not project fees.',
} as const

export const hospitalityPricingFaqItems = [
  {
    question: 'How much does a restaurant website cost?',
    answer: hospitalityPricingFaqs.cost,
  },
  {
    question: 'How long does it take to build a restaurant website?',
    answer: hospitalityPricingFaqs.timeline,
  },
  {
    question: 'Which booking systems do you integrate with?',
    answer: hospitalityPricingFaqs.bookingIntegrations,
  },
  {
    question: 'Can our team update menus without a developer?',
    answer: hospitalityPricingFaqs.menuUpdates,
  },
] as const

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
    'Yes. We build dedicated practice area pages structured for local search. Clear expertise signaling, location-relevant keywords, and internal linking so high-intent queries can find the right attorney and practice.',
  existingBrand:
    'Yes. We can build around your existing brand and logo, or refine the visual system as part of the engagement so the site matches the caliber of your practice.',
} as const

export const lawFirmPricingFaqItems = [
  {
    question: 'How much does a law firm website cost?',
    answer: lawFirmPricingFaqs.cost,
  },
  {
    question: 'How long does it take to build a law firm website?',
    answer: lawFirmPricingFaqs.timeline,
  },
  {
    question: 'Do you build practice area pages?',
    answer: lawFirmPricingFaqs.practiceAreas,
  },
  {
    question: 'Can you work with an existing brand or logo?',
    answer: lawFirmPricingFaqs.existingBrand,
  },
] as const

export const redesignPricingFaqs = {
  seoRankings:
    "Not if it's done right. Every URL gets mapped, every 301 redirect gets audited, every schema element gets preserved. We audit your ranking pages in discovery and structure the entire migration to protect them. Most redesigns lose rankings because the agency treats SEO as an afterthought. Ours are scoped around SEO preservation from day one.",
  contentMigration:
    "Every page gets audited before migration. Ranking pages get preserved. Outdated pages get consolidated or rewritten. Nothing important gets lost. You'll know exactly what's moving, what's being rewritten, and what's being retired before we start building.",
  downtime:
    'No. The new site is built on a staged environment while your current site stays live. When the new site launches, it goes public in a single DNS change. No downtime, no gap where visitors see a broken site. Redirects are verified before the switch.',
  timeline:
    'Most redesigns take 6–10 weeks from kickoff to launch, depending on content volume, custom features, and existing site complexity. Larger sites with hundreds of ranking pages take longer. We scope timelines in discovery based on your actual site.',
  existingPlatform:
    "We've migrated sites off all four. Content gets exported, audited, and rebuilt in Sanity CMS. Redirects get mapped from your existing URLs to the new site structure. Rankings and referral traffic survive because we plan the migration before we touch the design.",
} as const

export const redesignPricingFaqItems = [
  {
    question: 'Will we lose our search rankings during the redesign?',
    answer: redesignPricingFaqs.seoRankings,
  },
  {
    question: 'What happens to our existing content and pages?',
    answer: redesignPricingFaqs.contentMigration,
  },
  {
    question: 'Will our site go down during the migration?',
    answer: redesignPricingFaqs.downtime,
  },
  {
    question: 'How long does a Las Vegas website redesign take?',
    answer: redesignPricingFaqs.timeline,
  },
  {
    question: "We're on WordPress / Wix / Squarespace / Webflow. How does the migration work?",
    answer: redesignPricingFaqs.existingPlatform,
  },
] as const

export const industryPricingFaqGroups = [
  { href: '/las-vegas-web-design', faqs: lasVegasPricingFaqItems },
  { href: '/website-redesign-las-vegas', faqs: redesignPricingFaqItems },
  { href: '/law-firm-web-design', faqs: lawFirmPricingFaqItems },
  { href: '/hospitality-web-design', faqs: hospitalityPricingFaqItems },
  { href: '/commercial-real-estate-web-design', faqs: commercialRealEstatePricingFaqItems },
] as const
