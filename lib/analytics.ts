/** Client helpers for CTAs/forms/phone taps. No-op after GA4 removal. */
export function trackEvent(_eventName: string, _params?: Record<string, unknown>): void {}

export function trackFormSubmission(_formName: string): void {}

export function trackPhoneClick(): void {}

export function trackCTAClick(_buttonName: string, _location: string): void {}
