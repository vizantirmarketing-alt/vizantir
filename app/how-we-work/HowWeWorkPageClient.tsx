'use client'

import { AccordionItem } from '@/components/ui/AccordionItem'
import { MotionCard } from '@/components/ui/MotionCard'
import { Section } from '@/components/ui/Section'
import { useState } from 'react'
import {
  howWeWorkComparisonColumns,
  howWeWorkComparisonTagline,
  howWeWorkExcludes,
  howWeWorkExcludesHeading,
  howWeWorkFaqs,
  howWeWorkIncludes,
  howWeWorkIncludesHeading,
  howWeWorkProcess,
} from '@/data/how-we-work'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { trackBookStrategyCall } from '@/lib/analytics'
import { Check, X } from 'lucide-react'
import { AmbientHero } from '@/components/hero/AmbientHero'

function RecommendedBadge({ visible }: { visible: boolean }) {
  return (
    <div className="mb-4 flex min-h-[22px] items-center justify-end">
      <span
        className={`rounded-full bg-cobalt-gradient px-2 py-0.5 text-[11px] font-medium uppercase tracking-wider text-white ${
          visible ? '' : 'invisible'
        }`}
        aria-hidden={!visible}
      >
        Recommended
      </span>
    </div>
  )
}

export default function HowWeWorkPageClient() {
  // Colors matching Vizantir design system
  const colors = {
    bg: 'var(--background)',
    text: 'var(--foreground)',
    textMuted: '#6B7280',
    textSubtle: 'var(--muted-foreground)',
    accent: 'var(--cobalt-accent)',
    cardBg: '#FFFFFF',
    cardBorder: 'rgba(0,0,0,0.08)',
    divider: 'linear-gradient(90deg, transparent, rgba(0, 112, 243,0.3), transparent)',
  }

  const [openFaq, setOpenFaq] = useState<number | null>(null)

  return (
    <div
      className="min-h-screen transition-colors duration-500"
      style={{ background: colors.bg }}
    >
      <AmbientHero
        variant="helix"
        compact
        headline="You know the price before we start."
        subhead="A clear process with defined scope, fixed pricing, and milestone check-ins. You know exactly what you're getting before we start."
      />

      {/* Divider */}
      <div className="w-full h-px" style={{ background: colors.divider }} />

      {/* Process Steps Section */}
      <Section className="px-6 md:px-12 lg:px-20">
        <div className="max-w-4xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="md:text-3xl font-bold mb-16 text-center text-balance transition-colors duration-500"
            style={{ color: colors.text }}
          >
            The Process
          </motion.h2>

          <div className="mx-auto w-fit max-w-full space-y-8">
            {howWeWorkProcess.map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="flex gap-6 md:gap-8"
              >
                {/* Number */}
                <div
                  className="flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center text-lg font-bold"
                  style={{
                    background: 'rgba(0, 112, 243,0.1)',
                    color: 'var(--cobalt-text)',
                  }}
                >
                  {step.number}
                </div>

                {/* Content */}
                <div className="flex-1 pt-2">
                  <h3
                    className="text-xl font-bold mb-2 transition-colors duration-500"
                    style={{ color: colors.text }}
                  >
                    {step.title}
                  </h3>
                  <p
                    className="max-w-[55ch] text-pretty text-base leading-relaxed transition-colors duration-500"
                    style={{ color: colors.textMuted }}
                  >
                    {step.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* Divider */}
      <div className="w-full h-px" style={{ background: colors.divider }} />

      {/* Why Vizantir Section */}
      <Section className="px-6 md:px-12 lg:px-20">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <h2
            className="md:text-3xl font-bold text-balance transition-colors duration-500"
            style={{ color: colors.text }}
            >
              Why Vizantir
            </h2>
          </motion.div>

          {/* Comparison Cards */}
          <div className="grid items-stretch md:grid-cols-3 gap-6">
            {/* Traditional Agencies */}
            <MotionCard variant="plain" badge={false}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="block h-full overflow-hidden rounded-2xl border"
              style={{
                background: colors.cardBg,
                borderColor: colors.cardBorder,
              }}>
              <RecommendedBadge visible={false} />

              <h3
                className="text-lg font-bold mb-2 md:min-h-[3.5rem] transition-colors duration-500"
                style={{ color: colors.text }}
              >
                {howWeWorkComparisonColumns[0].name}
              </h3>

              <ul className="space-y-2 text-pretty text-sm leading-normal transition-colors duration-500" style={{ color: colors.textMuted }}>
                {howWeWorkComparisonColumns[0].items.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <X className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-[2px]" aria-hidden />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </MotionCard>

            {/* Hourly Dev Shops */}
            <MotionCard variant="plain" badge={false}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="block h-full overflow-hidden rounded-2xl border"
              style={{
                background: colors.cardBg,
                borderColor: colors.cardBorder,
              }}>
              <RecommendedBadge visible={false} />

              <h3
                className="text-lg font-bold mb-2 md:min-h-[3.5rem] transition-colors duration-500"
                style={{ color: colors.text }}
              >
                {howWeWorkComparisonColumns[1].name}
              </h3>

              <ul className="space-y-2 text-pretty text-sm leading-normal transition-colors duration-500" style={{ color: colors.textMuted }}>
                {howWeWorkComparisonColumns[1].items.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <X className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-[2px]" aria-hidden />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </MotionCard>

            {/* Vizantir */}
            <MotionCard variant="plain" badge={false}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="block h-full overflow-hidden rounded-2xl border"
              style={{
                background: 'linear-gradient(135deg, rgba(0, 112, 243,0.1) 0%, rgba(0, 112, 243,0.02) 100%)',
                borderColor: 'rgba(0, 112, 243,0.3)',
              }}>
              <RecommendedBadge visible />

              <h3
                className="text-lg font-bold mb-2 md:min-h-[3.5rem] transition-colors duration-500"
                style={{ color: colors.text }}
              >
                {howWeWorkComparisonColumns[2].name}
              </h3>

              <ul className="space-y-2 text-pretty text-sm leading-normal transition-colors duration-500" style={{ color: colors.textMuted }}>
                {howWeWorkComparisonColumns[2].items.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-cobalt-text flex-shrink-0 mt-[2px]" aria-hidden />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </MotionCard>
          </div>

          {/* One-liner */}
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="py-16 text-center text-xl font-medium md:py-20 md:text-2xl"
            style={{ color: colors.text }}
          >
            {howWeWorkComparisonTagline}

          </motion.p>
        </div>
      </Section>

      {/* Divider */}
      <div className="w-full h-px" style={{ background: colors.divider }} />

      {/* What's Included Section */}
      <Section edge="top" className="px-6 md:px-12 lg:px-20">
        <div className="max-w-4xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="md:text-3xl font-bold mb-12 text-center text-balance"
            style={{ color: colors.text }}
          >
            What to Expect
          </motion.h2>

          <div className="grid items-stretch gap-8 md:grid-cols-[1fr_auto_1fr] md:gap-0">
            {/* Included */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="md:pr-10 lg:pr-12"
            >
              <h3
                className="text-xs tracking-[0.25em] uppercase font-medium mb-6 flex min-h-[2.5em] items-end transition-colors duration-500"
                style={{ color: colors.accent }}
              >
                {howWeWorkIncludesHeading}
              </h3>

              <ul className="space-y-4 text-pretty text-base leading-relaxed transition-colors duration-500" style={{ color: colors.textMuted }}>
                {howWeWorkIncludes.map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <Check className="h-4 w-4 text-cobalt-text flex-shrink-0 mt-[2px]" aria-hidden />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            <div
              className="hidden w-px self-stretch bg-black/[0.08] md:block"
              aria-hidden
            />

            {/* Not Included */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="self-stretch md:pl-10 lg:pl-12"
            >
              <h3
                className="text-xs tracking-[0.25em] uppercase font-medium mb-6 flex min-h-[2.5em] items-end transition-colors duration-500"
                style={{ color: colors.textSubtle }}
              >
                {howWeWorkExcludesHeading}
              </h3>

              <ul className="space-y-4 text-pretty text-base leading-relaxed transition-colors duration-500" style={{ color: colors.textMuted }}>
                {howWeWorkExcludes.map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <X className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-[2px]" aria-hidden />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </Section>

      {/* Divider */}
      <div className="w-full h-px" style={{ background: colors.divider }} />

      {/* FAQ Section */}
      <Section size="sm" className="px-6 md:px-12 lg:px-20">
        <div className="max-w-3xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="md:text-3xl font-bold mb-12 text-center text-balance"
            style={{ color: colors.text }}
          >
            Questions
          </motion.h2>

          <div className="space-y-[var(--stack)]">
            {howWeWorkFaqs.map((faq, index) => {
              const isOpen = openFaq === index
              const triggerId = `how-we-work-faq-trigger-${index}`
              const panelId = `how-we-work-faq-panel-${index}`

              return (
                <AccordionItem
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                  triggerId={triggerId}
                  panelId={panelId}
                  isOpen={isOpen}
                  onToggle={() => setOpenFaq(isOpen ? null : index)}
                  question={faq.question}
                  questionClassName="text-base font-medium"
                  questionStyle={{ color: colors.text }}
                  style={{
                    background: colors.cardBg,
                    borderColor: isOpen ? 'rgba(0, 112, 243,0.3)' : colors.cardBorder,
                  }}
                >
                  <p
                    className="text-sm leading-relaxed"
                    style={{ color: colors.textMuted }}
                  >
                    {faq.answer}
                  </p>
                </AccordionItem>
              )
            })}
          </div>
        </div>
      </Section>

      {/* Divider */}
      <div className="w-full h-px" style={{ background: colors.divider }} />

      {/* CTA Section */}
      <Section size="lg" className="px-6 md:px-12 lg:px-20">
        <div className="max-w-2xl mx-auto text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="md:text-4xl font-bold mb-6 text-balance transition-colors duration-500"
            style={{ color: colors.text }}
          >
            Ready to start?
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-10 text-base leading-relaxed transition-colors duration-500"
            style={{ color: colors.textMuted }}
          >
            Let&apos;s talk about your project. No commitment, no pressure.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Link
              href="/contact"
              onClick={() => trackBookStrategyCall('how_we_work')}
              className="bg-cobalt-gradient inline-flex items-center justify-center rounded-xl px-8 py-4 text-base font-semibold text-white shadow-cobalt focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0070F3]/40 focus-visible:ring-offset-2"
            >
              Book a Strategy Call
            </Link>
          </motion.div>
        </div>
      </Section>
    </div>
  )
}