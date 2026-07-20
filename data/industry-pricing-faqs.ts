import { industryProjectCostAnswer, industryProjectTimelineAnswer } from './pricing'

export const commercialRealEstatePricingFaqs = {
  cost: industryProjectCostAnswer(
    'CRE',
    'The investment covers strategy, design, development, and CMS so your team can manage listings and content without a developer.',
  ),
  timeline: industryProjectTimelineAnswer(
    'commercial real estate projects',
    ' depending on the number of listings and pages required.',
  ),
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
