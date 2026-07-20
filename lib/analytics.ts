import { track } from '@vercel/analytics'

type AnalyticsPropertyValue = string | number | boolean | null | undefined
type AnalyticsProperties = Record<string, AnalyticsPropertyValue>

function toAnalyticsProperties(
  params?: Record<string, unknown>,
): AnalyticsProperties | undefined {
  if (!params) return undefined

  const properties: AnalyticsProperties = {}
  for (const [key, value] of Object.entries(params)) {
    if (
      value === null ||
      value === undefined ||
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean'
    ) {
      properties[key] = value
    } else {
      properties[key] = String(value)
    }
  }
  return properties
}

/** Custom event via Vercel Web Analytics. */
export function trackEvent(eventName: string, params?: Record<string, unknown>): void {
  track(eventName, toAnalyticsProperties(params))
}

export function trackFormSubmission(formName: string): void {
  track('form_submission', { form_name: formName })
}

export function trackPhoneClick(): void {
  track('phone_click')
}

export function trackCTAClick(buttonName: string, location: string): void {
  track('cta_click', { button_name: buttonName, location })
}

/** Primary conversion intent — Book a Strategy Call CTAs. */
export function trackBookStrategyCallIntent(location: string): void {
  track('book_strategy_call_intent', { location })
}
