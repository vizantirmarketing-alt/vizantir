export const trackEvent = (eventName: string, params?: Record<string, any>) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, params)
  }
}

// Form submissions
export const trackFormSubmission = (formName: string) => {
  trackEvent('form_submission', { 
    form_name: formName,
    event_category: 'conversion'
  })
}

// Phone link clicks
export const trackPhoneClick = () => {
  trackEvent('phone_click', { 
    event_category: 'contact',
    event_label: '+1 (702) 604-6177'
  })
}

// CTA button clicks
export const trackCTAClick = (buttonName: string, location: string) => {
  trackEvent('cta_click', { 
    button_name: buttonName, 
    location: location,
    event_category: 'engagement'
  })
}

