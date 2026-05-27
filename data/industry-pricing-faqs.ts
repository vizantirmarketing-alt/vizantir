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
} as const

export const lawFirmPricingFaqs = {
  cost: industryProjectCostAnswer(
    'law firm',
    'That covers strategy, design, development, and a CMS so your team can update content without a developer.',
  ),
  timeline: industryProjectTimelineAnswer(
    'law firm projects',
    ' depending on the number of practice areas and attorneys.',
  ),
} as const
