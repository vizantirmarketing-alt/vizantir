'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Check, X } from 'lucide-react'

import { Eyebrow } from '@/components/ui/Eyebrow'
import { trackCTAClick } from '@/lib/analytics'
import type { AreWeAFitPageContent } from '@/data/are-we-a-fit'

interface AreWeAFitPageClientProps {
  content: AreWeAFitPageContent
}

const heroEyebrow = 'Before you book'
const heroHeading = "We're not for everyone."
const heroSubheading =
  'Honest criteria to help you decide before you book a Strategy Call.'
const idealHeading = "You're a fit if..."
const notIdealHeading = "You're not a fit if..."

export default function AreWeAFitPageClient({ content }: AreWeAFitPageClientProps) {
  const colors = {
    bg: '#FAF9F5',
    text: 'var(--foreground)',
    textMuted: '#6B7280',
    accentSolid: 'var(--cobalt-primary)',
    cardBg: '#FFFFFF',
    cardBorder: 'rgba(0,0,0,0.08)',
    divider: 'linear-gradient(90deg, transparent, rgba(0, 112, 243,0.3), transparent)',
    budgetAsideBg: 'rgba(0, 112, 243,0.06)',
    heroWash: 'radial-gradient(ellipse 85% 60% at 50% -5%, rgba(0, 112, 243,0.14), transparent 55%)',
    fitBulletIcon: 'rgba(0, 112, 243, 0.88)',
  }

  const sectionMotion = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.5 },
  }

  return (
    <main className="min-h-screen transition-colors duration-500" style={{ background: colors.bg }}>
      {/* Hero */}
      <section className="relative overflow-hidden px-6 pt-28 pb-14 md:px-12 md:pb-16 lg:px-20">
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: colors.heroWash }}
          aria-hidden
        />
        <div className="relative z-10 mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-5"
          >
            <Eyebrow>{heroEyebrow}</Eyebrow>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.06 }}
            className="text-3xl font-bold leading-tight tracking-tight transition-colors duration-500 sm:text-4xl md:text-5xl lg:text-[2.75rem] lg:leading-[1.12]"
            style={{ color: colors.text }}
          >
            {heroHeading}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.12 }}
            className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed md:text-xl"
            style={{ color: colors.textMuted }}
          >
            {heroSubheading}
          </motion.p>
        </div>
      </section>

      <div className="h-px w-full" style={{ background: colors.divider }} />

      {/* Ideal fit */}
      <section className="px-6 py-14 md:px-12 md:py-16 lg:px-20" aria-labelledby="ideal-fit-heading">
        <div className="mx-auto max-w-3xl">
          <motion.div {...sectionMotion}>
            <h2
              id="ideal-fit-heading"
              className="mb-9 text-center text-2xl font-bold tracking-tight md:mb-10 md:text-3xl"
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
                  <p className="text-base leading-relaxed md:text-lg" style={{ color: colors.textMuted }}>
                    {item}
                  </p>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </section>

      {/* Not a fit — same surface treatment as ideal section */}
      <section className="px-6 py-14 md:px-12 md:py-16 lg:px-20" aria-labelledby="not-fit-heading">
        <div className="mx-auto max-w-3xl">
          <motion.div {...sectionMotion}>
            <h2
              id="not-fit-heading"
              className="mb-9 text-center text-2xl font-bold tracking-tight md:mb-10 md:text-3xl"
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
                    style={{ color: colors.fitBulletIcon }}
                    aria-hidden
                  />
                  <p className="text-base leading-relaxed md:text-lg" style={{ color: colors.textMuted }}>
                    {item}
                  </p>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </section>

      {/* Budget — candid aside */}
      <section className="px-6 py-14 md:px-12 md:py-16 lg:px-20" aria-labelledby="budget-heading">
        <div className="mx-auto max-w-3xl">
          <motion.div
            {...sectionMotion}
            className="rounded-2xl border-l-4 py-6 pl-10 pr-5 md:pl-12 md:pr-9"
            style={{
              borderLeftColor: colors.accentSolid,
              background: colors.budgetAsideBg,
              borderTop: `1px solid ${colors.cardBorder}`,
              borderRight: `1px solid ${colors.cardBorder}`,
              borderBottom: `1px solid ${colors.cardBorder}`,
              borderTopRightRadius: '1rem',
              borderBottomRightRadius: '1rem',
            }}
          >
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
        <div className="mx-auto max-w-3xl text-center">
          <motion.div {...sectionMotion}>
            <h2
              id="closing-heading"
              className="mb-6 text-2xl font-bold tracking-tight md:text-3xl"
              style={{ color: colors.text }}
            >
              {content.closingSection.heading}
            </h2>
            <p className="mx-auto mb-8 max-w-2xl text-base leading-relaxed md:text-lg" style={{ color: colors.textMuted }}>
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
