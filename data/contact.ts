export const contactDetails = {
  email: 'info@vizantir.com',
  phoneDisplay: '+1 (702) 289-0758',
  phoneTel: '+17022890758',
  location: 'Las Vegas, NV 89139',
  // Matches app/layout.tsx Organization schema areaServed + serviceArea.
  areaServed: [
    'Las Vegas',
    'Henderson',
    'Summerlin',
    'Paradise',
    'Nevada',
    'United States',
  ],
  serviceArea:
    'Remote-first studio based in Las Vegas — including Henderson, Summerlin, and Paradise — serving Southern Nevada and clients nationwide',
  hours: [
    { days: 'Monday - Friday', hours: '9:00 AM - 6:00 PM PST' },
    { days: 'Saturday', hours: 'By appointment' },
    { days: 'Sunday', hours: 'Closed' },
  ],
  responseTimeAverage: 'Under 24 hours',
} as const
