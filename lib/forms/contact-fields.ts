/** Shared with ContactPageClient and API validation — keep in sync. */
export const CONTACT_SERVICES = [
  'New Website',
  'Website Redesign',
  'Platform Migration',
  'Custom Development',
  'Landing Page',
  'Website Refresh',
  'Website Care / Retainer',
  'Not Sure Yet',
] as const;

import { CONTACT_BUDGET_FROM_PRICING } from '@/data/pricing'

export const CONTACT_BUDGETS = CONTACT_BUDGET_FROM_PRICING
