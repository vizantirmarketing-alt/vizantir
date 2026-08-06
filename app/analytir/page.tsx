import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

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

export default function AnalytirPage() {
  return (
    <>
      <Hero />

      <Section
        eyebrow="Reconciliation"
        headline="The number your processor reports is not the number that reaches your bank."
        body="Fees, tips, and financing withholdings all move between the sale and the deposit. Analytir accounts for every one of them, line by line."
      >
        <Stage>
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
        <Stage>
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
        <Stage>
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
        <Stage>
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
        <Stage>
          <div className="flex justify-center">
            <ReportPageScreen />
          </div>
        </Stage>
      </Section>

      <section className="py-20 md:py-28" style={{ background: 'var(--secondary)' }}>
        <div className="container mx-auto max-w-3xl px-4">
          <Eyebrow align="start">Why this is here</Eyebrow>
          <h2 className="mt-6 text-4xl font-black tracking-tight text-foreground md:text-5xl lg:text-6xl">
            This is what we build when there is no client to answer to.
          </h2>
          <p
            className="mt-5 text-base md:text-lg"
            style={{ color: 'var(--text-body)', lineHeight: 1.7 }}
          >
            Analytir is not client work. It is what the studio does when the only
            constraint is getting it right. If that is the standard you want applied to
            your business, start with a conversation.
          </p>
          <Link
            href="/contact"
            className="mt-8 inline-flex items-center gap-2 rounded-full px-8 py-4 font-medium text-white"
            style={{ background: 'var(--cobalt-accent)' }}
          >
            Book a Strategy Call
            <ArrowRight size={18} aria-hidden />
          </Link>
          <p className="mt-4" style={{ fontSize: 13, color: 'var(--text-meta)' }}>
            Analytir is a separate product. You can see it at{' '}
            <a
              href="https://analytir.com"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--cobalt-accent)' }}
            >
              analytir.com
            </a>.
          </p>
        </div>
      </section>
    </>
  )
}
