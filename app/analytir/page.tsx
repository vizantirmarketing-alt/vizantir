import type { Metadata } from 'next'
import { ArrowUpRight } from 'lucide-react'

import { Eyebrow } from '@/components/ui/Eyebrow'

import { Hero } from './_components/Hero'
import { Section } from './_components/Section'
import { Stage } from './_components/Stage'
import { Window } from './_components/Window'
import { AlertEmailScreen } from './_screens/AlertEmailScreen'
import { AnalystScreen } from './_screens/AnalystScreen'
import { DepositsScreen } from './_screens/DepositsScreen'
import { ReportPageScreen } from './_screens/ReportPageScreen'
import { LedgerScreen } from './_screens/LedgerScreen'

export const metadata: Metadata = {
  title: {
    absolute: 'Analytir | Vizantir Design Studio',
  },
  description:
    'The analytics engine we built in house, and what it says about how we work.',
  alternates: {
    canonical: '/analytir',
  },
}

const STATS = [
  { value: '79', label: 'API routes' },
  { value: '27', label: 'Database tables' },
  { value: '11', label: 'Report archetypes' },
  { value: '9', label: 'Alert types' },
] as const

const SHIPPED_MODULES = [
  'Square, QuickBooks, and Stripe ingestion',
  'Background job queue with retry',
  'HMAC webhook verification',
  'Encrypted token storage with revoked-credential detection',
  'Merchant-timezone reconciliation views',
  'LLM narrative reports across eleven archetypes',
  'Weekly and monthly PDF generation',
  'Magic-link shared reports',
  'Nine alert types with severity escalation',
  'Natural-language SQL with pre-execution validation',
  'Per-tier quota enforcement',
  'Stripe Checkout, trials, and webhook handling',
  'Two-factor authentication with recovery codes',
  'Session revocation and login history',
  'Account deletion with grace period',
  'Full user data export',
] as const

export default function AnalytirPage() {
  return (
    <>
      <Hero />

      <Section
        eyebrow="Reconciliation"
        headline="The number your processor reports is not the number that reaches your bank."
        body="Fees, tips, and financing withholdings all move between the sale and the deposit. Analytir accounts for every one of them, line by line."
      >
        <Stage background="bg-01.jpg">
          <Window title="Cash Flow" className="w-full">
            <LedgerScreen />
          </Window>
        </Stage>
      </Section>

      <Section
        flip
        eyebrow="Settlement"
        headline="Every payout, traced back to the day it was earned."
        body="Payouts arrive in batches that match no sales period. Analytir groups them by the week they settle and shows exactly what each batch contains."
      >
        <Stage background="bg-02.jpg">
          <Window title="Deposits" className="w-full">
            <DepositsScreen />
          </Window>
        </Stage>
      </Section>

      <Section
        eyebrow="Vigilance"
        headline="It noticed the register had gone quiet before the owner did."
        body="Forty-eight hours without a transaction is either a closed shop or a broken payment terminal. Analytir cannot tell which, so it does not guess. It reports the silence, ranks it against the last three months, and lists what to check first."
      >
        <Stage background="bg-03.jpg">
          <div className="flex justify-center">
            <AlertEmailScreen />
          </div>
        </Stage>
      </Section>

      <Section
        flip
        eyebrow="Explanation"
        headline="The answer, in the language the owner actually uses."
        body="Not a chart to interpret. A sentence that says where the money went, and why the deposit is smaller than the sale."
      >
        <Stage background="bg-04.jpg">
          <div className="flex justify-center">
            <AnalystScreen />
          </div>
        </Stage>
      </Section>

      <Section
        eyebrow="Judgment"
        headline="A gap that widened tenfold in three months, and nobody noticed."
        body="Thursday was quietly losing money against every other day of the week. No dashboard surfaces that, because no dashboard is looking for it. Analytir found the pattern, priced it, and prescribed the fix with a deadline attached."
      >
        <Stage background="bg-05.jpg">
          <div className="flex justify-center">
            <ReportPageScreen />
          </div>
        </Stage>
      </Section>

      <section className="py-20 md:py-28" style={{ background: 'var(--secondary)' }}>
        <div className="container mx-auto px-4">
          <div className="max-w-2xl">
            <Eyebrow align="start">Why this is here</Eyebrow>
            <h2 className="mt-6 text-4xl font-black tracking-tight text-foreground md:text-5xl lg:text-6xl">
              We built this because we wanted to know how far we could take it.
            </h2>
            <p
              className="mt-5 text-base md:text-lg"
              style={{ color: 'var(--text-body)', lineHeight: 1.7 }}
            >
              Analytir is not client work. It is what the studio does when the only
              constraint is getting it right.
            </p>
            <p
              className="text-[17px] md:text-[20px]"
              style={{
                marginTop: 32,
                fontWeight: 500,
                color: 'var(--foreground)',
              }}
            >
              See Analytir live at{' '}
              <a
                href="https://analytir.com"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: 'var(--cobalt-accent)',
                  borderBottom: '1px solid color-mix(in srgb, currentColor 30%, transparent)',
                  paddingBottom: 2,
                }}
              >
                analytir.com
              </a>
              <ArrowUpRight
                size={18}
                aria-hidden
                style={{
                  display: 'inline',
                  marginLeft: 6,
                  verticalAlign: 'middle',
                  color: 'var(--cobalt-accent)',
                }}
              />
            </p>
          </div>

          <div
            style={{
              borderTop: '1px solid rgba(0, 0, 0, 0.14)',
              marginTop: 40,
              paddingTop: 40,
            }}
          >
            <div
              className="flex flex-wrap"
              style={{ gap: 48, marginBottom: 40 }}
            >
              {STATS.map((stat) => (
                <div key={stat.label}>
                  <p
                    style={{
                      fontFamily: 'var(--font-mono, monospace)',
                      fontSize: 30,
                      color: 'var(--foreground)',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {stat.value}
                  </p>
                  <p
                    style={{
                      fontFamily: 'var(--font-mono, monospace)',
                      fontSize: 11,
                      letterSpacing: '0.14em',
                      textTransform: 'uppercase',
                      color: 'var(--text-meta)',
                      marginTop: 6,
                    }}
                  >
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>

            <p
              style={{
                fontFamily: 'var(--font-mono, monospace)',
                fontSize: 11,
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                color: 'var(--text-meta)',
                marginBottom: 14,
              }}
            >
              What shipped
            </p>
            <p
              style={{
                fontSize: 16,
                lineHeight: 2.0,
                color: 'var(--foreground)',
              }}
            >
              {SHIPPED_MODULES.map((module, index) => (
                <span key={module}>
                  {index > 0 && (
                    <span style={{ color: 'var(--text-meta)' }}> · </span>
                  )}
                  {module}
                </span>
              ))}
            </p>
          </div>
        </div>
      </section>
    </>
  )
}
