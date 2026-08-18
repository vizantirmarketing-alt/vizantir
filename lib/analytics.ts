import { track } from '@vercel/analytics'

type AnalyticsPropertyValue = string | number | boolean | null | undefined
type AnalyticsProperties = Record<string, AnalyticsPropertyValue>

type GtagEventFn = (
  command: 'event',
  eventName: string,
  eventParams?: AnalyticsProperties,
) => void

const GA4_EVENT_NAMES = {
  form_submission: 'lead_form_submit',
  phone_click: 'phone_click',
  contact_click: 'contact_click',
  cta_click: 'cta_click',
  book_strategy_call_intent: 'consultation_click',
  landing_pages_handoff_preview_view: 'handoff_preview_view',
  landing_pages_variant_system_demo_view: 'variant_system_demo_view',
  landing_pages_variant_comparison_navigate: 'variant_comparison_navigate',
} as const

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

function isMappedVercelEventName(
  eventName: string,
): eventName is keyof typeof GA4_EVENT_NAMES {
  return Object.prototype.hasOwnProperty.call(GA4_EVENT_NAMES, eventName)
}

function toGa4EventName(vercelEventName: string): string {
  if (isMappedVercelEventName(vercelEventName)) {
    return GA4_EVENT_NAMES[vercelEventName]
  }
  return vercelEventName
}

/** Sends a custom event to GA4. No-op when `window.gtag` is not a function. */
function sendToGa4(eventName: string, params?: AnalyticsProperties): void {
  if (typeof window === 'undefined') return

  const gtag = (window as typeof window & { gtag?: GtagEventFn }).gtag
  if (typeof gtag !== 'function') return

  gtag('event', eventName, params)
}

function trackToBoth(vercelEventName: string, params?: AnalyticsProperties): void {
  track(vercelEventName, params)
  sendToGa4(toGa4EventName(vercelEventName), params)
}

/** Custom event via Vercel Web Analytics and GA4. */
export function trackEvent(eventName: string, params?: Record<string, unknown>): void {
  trackToBoth(eventName, toAnalyticsProperties(params))
}

export function trackFormSubmission(formName: string): void {
  trackToBoth('form_submission', { form_name: formName })
}

export function trackPhoneClick(): void {
  trackToBoth('phone_click')
}

export function trackCTAClick(buttonName: string, location: string): void {
  trackToBoth('cta_click', { button_name: buttonName, location })
}

/** Primary conversion intent — Book a Strategy Call CTAs. */
export function trackBookStrategyCallIntent(location: string): void {
  trackToBoth('book_strategy_call_intent', { location })
}
