'use client'

import Script from 'next/script'

const GA_ID = process.env.NEXT_PUBLIC_GA_ID

// Debug logging (remove after verification)
if (typeof window !== 'undefined') {
  console.log('GA_ID:', GA_ID)
}

export default function GoogleAnalytics() {
  if (!GA_ID) {
    console.warn('Google Analytics: NEXT_PUBLIC_GA_ID is not set')
    return null
  }

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
        onLoad={() => {
          console.log('Google Analytics script loaded')
        }}
        onError={() => {
          console.error('Google Analytics script failed to load')
        }}
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}');
          console.log('Google Analytics initialized with ID: ${GA_ID}');
        `}
      </Script>
    </>
  )
}
