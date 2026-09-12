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

const WEEKDAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
] as const

export type OpeningHoursSpecification = {
  '@type': 'OpeningHoursSpecification'
  dayOfWeek: string[]
  opens: string
  closes: string
}

function expandDayRange(label: string): string[] {
  const [startRaw, endRaw] = label.split(/\s*-\s*/).map((part) => part.trim())
  if (!startRaw) return []
  if (!endRaw) {
    return WEEKDAYS.includes(startRaw as (typeof WEEKDAYS)[number]) ? [startRaw] : []
  }
  const start = WEEKDAYS.indexOf(startRaw as (typeof WEEKDAYS)[number])
  const end = WEEKDAYS.indexOf(endRaw as (typeof WEEKDAYS)[number])
  if (start === -1 || end === -1 || end < start) return []
  return WEEKDAYS.slice(start, end + 1)
}

function toHour24(hour: number, meridiem: string): number {
  const period = meridiem.toUpperCase()
  if (period === 'AM') return hour === 12 ? 0 : hour
  return hour === 12 ? 12 : hour + 12
}

function parseClockRange(hours: string): { opens: string; closes: string } | null {
  const match = hours.match(
    /(\d{1,2}):(\d{2})\s*(AM|PM)\s*-\s*(\d{1,2}):(\d{2})\s*(AM|PM)/i,
  )
  if (!match) return null
  const opensHour = toHour24(Number(match[1]), match[3])
  const closesHour = toHour24(Number(match[4]), match[6])
  const pad = (value: number) => value.toString().padStart(2, '0')
  return {
    opens: `${pad(opensHour)}:${match[2]}`,
    closes: `${pad(closesHour)}:${match[5]}`,
  }
}

/** schema.org OpeningHoursSpecification derived from `contactDetails.hours`. */
export function getOpeningHoursSpecification(): OpeningHoursSpecification[] {
  return contactDetails.hours.flatMap((row) => {
    const times = parseClockRange(row.hours)
    const days = expandDayRange(row.days)
    if (!times || days.length === 0) return []
    return [
      {
        '@type': 'OpeningHoursSpecification' as const,
        dayOfWeek: days,
        opens: times.opens,
        closes: times.closes,
      },
    ]
  })
}
