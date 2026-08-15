'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Check, X } from 'lucide-react'

import { AmbientHero } from '@/components/hero/AmbientHero'
import { trackCTAClick } from '@/lib/analytics'
import type { AreWeAFitPageContent } from '@/data/are-we-a-fit'

interface AreWeAFitPageClientProps {
  content: AreWeAFitPageContent
}

const idealHeading = "You're a fit if..."
const notIdealHeading = "You're not a fit if..."

export default function AreWeAFitPageClient({ content }: AreWeAFitPageClientProps) {
  const colors = {
    bg: 'var(--background)',
    text: 'var(--foreground)',
    textMuted: '#6B7280',
    divider: 'linear-gradient(90deg, transparent, rgba(0, 112, 243,0.3), transparent)',
    fitBulletIcon: '#0070F3',
    notFitBulletIcon: '#C45C5C',
  }

  const sectionMotion = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.5 },
  }

  return (
    <main className="min-h-screen transition-colors duration-500" style={{ background: colors.bg }}>
      <AmbientHero
        variant="polygons"
        compact
        eyebrow="Before You Book"
        headline="We're not for everyone."
        subhead="Honest criteria to help you decide before you book a Strategy Call."
      />

      <div className="h-px w-full" style={{ background: colors.divider }} />

      <div className="px-6 py-14 md:px-12 md:py-16 lg:px-20">
        <div className="mx-auto grid max-w-6xl items-start gap-12 md:grid-cols-2 md:gap-x-16 md:gap-y-0 lg:gap-x-20">
          {/* Ideal fit */}
          <section aria-labelledby="ideal-fit-heading">
            <motion.div {...sectionMotion}>
              <h2
                id="ideal-fit-heading"
                className="mb-9 text-center text-balance text-2xl font-bold tracking-tight md:mb-10 md:text-3xl"
                style={{ color: colors.text }}
              >
                {idealHeading}
              </h2>
              <ul className="space-y-4">
                {content.idealSection.bullets?.map((item) => (
                  <li key={item} className="flex gap-3.5">
                    <Check
                      className="mt-[0.35rem] h-[1.125rem] w-[1.125rem] shrink-0"
                      strokeWidth={1.15}
                      style={{ color: colors.fitBulletIcon }}
                      aria-hidden
                    />
                    <p
                      className="text-pretty text-base leading-relaxed md:text-lg"
                      style={{ color: colors.textMuted }}
                    >
                      {item}
                    </p>
                  </li>
                ))}
              </ul>
            </motion.div>
          </section>

          {/* Not a fit */}
          <section aria-labelledby="not-fit-heading">
            <motion.div {...sectionMotion}>
              <h2
                id="not-fit-heading"
                className="mb-9 text-center text-balance text-2xl font-bold tracking-tight md:mb-10 md:text-3xl"
                style={{ color: colors.text }}
              >
                {notIdealHeading}
              </h2>
              <ul className="space-y-4">
                {content.notIdealSection.bullets?.map((item) => (
                  <li key={item} className="flex gap-3.5">
                    <X
                      className="mt-[0.35rem] h-[1.125rem] w-[1.125rem] shrink-0"
                      strokeWidth={1.15}
                      style={{ color: colors.notFitBulletIcon }}
                      aria-hidden
                    />
                    <p
                      className="text-pretty text-base leading-relaxed md:text-lg"
                      style={{ color: colors.textMuted }}
                    >
                      {item}
                    </p>
                  </li>
                ))}
              </ul>
            </motion.div>
          </section>
        </div>
      </div>

      {/* Budget */}
      <section className="px-6 py-14 md:px-12 md:py-16 lg:px-20" aria-labelledby="budget-heading">
        <div className="mx-auto max-w-3xl">
          <motion.div {...sectionMotion}>
            <h2
              id="budget-heading"
              className="mb-5 text-2xl font-bold tracking-tight md:text-3xl"
              style={{ color: colors.text }}
            >
              {content.budgetSection.heading}
            </h2>
            <div className="space-y-4">
              {content.budgetSection.paragraphs?.map((paragraph) => {
                if (typeof paragraph === 'string') {
                  return (
                    <p
                      key={paragraph}
                      className="text-base leading-relaxed md:text-lg"
                      style={{ color: colors.textMuted }}
                    >
                      {paragraph}
                    </p>
                  )
                }

                return (
                  <p
                    key={`${paragraph.before}${paragraph.link.href}${paragraph.after}`}
                    className="text-base leading-relaxed md:text-lg"
                    style={{ color: colors.textMuted }}
                  >
                    {paragraph.before}
                    <Link
                      href={paragraph.link.href}
                      className="font-medium text-cobalt-accent underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0070F3]/40 focus-visible:ring-offset-2"
                    >
                      {paragraph.link.label}
                    </Link>
                    {paragraph.after}
                  </p>
                )
              })}
            </div>
          </motion.div>
        </div>
      </section>

      <div className="h-px w-full" style={{ background: colors.divider }} />

      {/* Closing CTA */}
      <section className="px-6 py-14 md:px-12 md:pb-20 lg:px-20" aria-labelledby="closing-heading">
        <div className="mx-auto max-w-6xl text-center">
          <motion.div {...sectionMotion}>
            <h2
              id="closing-heading"
              className="mb-6 text-balance text-2xl font-bold tracking-tight md:text-3xl"
              style={{ color: colors.text }}
            >
              {content.closingSection.heading}
            </h2>
            <p
              className="mx-auto mb-8 max-w-6xl text-base leading-relaxed md:text-lg"
              style={{ color: colors.textMuted }}
            >
              {content.closingSection.body}
            </p>
            <Link
              href={content.closingCta.href}
              onClick={() => trackCTAClick('book_strategy_call', 'are_we_a_fit')}
              className="bg-cobalt-gradient inline-block rounded-xl px-8 py-4 text-base font-semibold text-white shadow-cobalt"
            >
              {content.closingCta.label}
            </Link>
          </motion.div>
        </div>
      </section>
    </main>
  )
}
