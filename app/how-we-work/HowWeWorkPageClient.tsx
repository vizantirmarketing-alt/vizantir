'use client'

import { useState } from 'react'
import { howWeWorkFaqs, howWeWorkProcess } from '@/data/how-we-work'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Check, X } from 'lucide-react'
import { AccordionIndicator } from '@/components/ui/AccordionIndicator'
import { AmbientHero } from '@/components/hero/AmbientHero'

function RecommendedBadge({ visible }: { visible: boolean }) {
  return (
    <div className="mb-4 flex min-h-[22px] items-center justify-end">
      <span
        className={`rounded-full bg-cobalt-gradient px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-white ${
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
    textSubtle: '#9CA3AF',
    accent: 'var(--cobalt-accent)',
    cardBg: '#FFFFFF',
    cardBorder: 'rgba(0,0,0,0.08)',
    divider: 'linear-gradient(90deg, transparent, rgba(0, 112, 243,0.3), transparent)',
  }

  const [openFaq, setOpenFaq] = useState<number | null>(null)

  return (
    <main
      className="min-h-screen transition-colors duration-500"
      style={{ background: colors.bg }}
    >
      <AmbientHero
        variant="helix"
        compact
        eyebrow="How We Work"
        headline="You know the price before we start."
        subhead="A clear process with defined scope, fixed pricing, and milestone check-ins. You know exactly what you're getting before we start."
      />

      {/* Divider */}
      <div className="w-full h-px" style={{ background: colors.divider }} />

      {/* Process Steps Section */}
      <section className="px-6 md:px-12 lg:px-20 py-20">
        <div className="max-w-4xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-2xl md:text-3xl font-bold mb-16 text-center text-balance transition-colors duration-500"
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
                    color: '#0070F3',
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
                    className="text-pretty text-base leading-relaxed transition-colors duration-500"
                    style={{ color: colors.textMuted }}
                  >
                    {step.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="w-full h-px" style={{ background: colors.divider }} />

      {/* Why Vizantir Section */}
      <section className="px-6 md:px-12 lg:px-20 py-20">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <span
              className="inline-block text-xs tracking-[0.25em] uppercase font-semibold mb-4"
              style={{ color: colors.accent }}
            >
              Comparison
            </span>
            <h2
            className="text-2xl md:text-3xl font-bold text-balance transition-colors duration-500"
            style={{ color: colors.text }}
            >
              Why Vizantir
            </h2>
          </motion.div>

          {/* Comparison Cards */}
          <div className="grid items-stretch md:grid-cols-3 gap-6">
            {/* Traditional Agencies */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="relative h-full overflow-hidden p-6 rounded-2xl border"
              style={{
                background: colors.cardBg,
                borderColor: colors.cardBorder,
              }}
            >
              <RecommendedBadge visible={false} />

              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
                style={{
                  background: 'rgba(239,68,68,0.1)',
                }}
              >
                <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>

              <h3
                className="text-lg font-bold mb-2 md:min-h-[3.5rem] transition-colors duration-500"
                style={{ color: colors.text }}
              >
                Traditional Agencies
              </h3>

              <ul className="space-y-2 text-pretty text-sm leading-normal transition-colors duration-500" style={{ color: colors.textMuted }}>
                <li className="flex items-start gap-2">
                  <X className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-[2px]" aria-hidden />
                  <span>Big teams, big overhead</span>
                </li>
                <li className="flex items-start gap-2">
                  <X className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-[2px]" aria-hidden />
                  <span>Layers between you and the work</span>
                </li>
                <li className="flex items-start gap-2">
                  <X className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-[2px]" aria-hidden />
                  <span>Vague quotes, surprise invoices</span>
                </li>
                <li className="flex items-start gap-2">
                  <X className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-[2px]" aria-hidden />
                  <span>Account managers, not builders</span>
                </li>
              </ul>
            </motion.div>

            {/* Hourly Dev Shops */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="relative h-full overflow-hidden p-6 rounded-2xl border"
              style={{
                background: colors.cardBg,
                borderColor: colors.cardBorder,
              }}
            >
              <RecommendedBadge visible={false} />

              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
                style={{
                  background: 'rgba(0, 112, 243,0.1)',
                }}
              >
                <svg className="w-5 h-5 text-cobalt-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>

              <h3
                className="text-lg font-bold mb-2 md:min-h-[3.5rem] transition-colors duration-500"
                style={{ color: colors.text }}
              >
                Hourly Dev Shops
              </h3>

              <ul className="space-y-2 text-pretty text-sm leading-normal transition-colors duration-500" style={{ color: colors.textMuted }}>
                <li className="flex items-start gap-2">
                  <X className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-[2px]" aria-hidden />
                  <span>You buy hours, not outcomes</span>
                </li>
                <li className="flex items-start gap-2">
                  <X className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-[2px]" aria-hidden />
                  <span>100 hours in, project 60% done</span>
                </li>
                <li className="flex items-start gap-2">
                  <X className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-[2px]" aria-hidden />
                  <span>No guaranteed deliverable</span>
                </li>
                <li className="flex items-start gap-2">
                  <X className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-[2px]" aria-hidden />
                  <span>"Buy more hours to finish"</span>
                </li>
              </ul>
            </motion.div>

            {/* Vizantir */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="relative h-full overflow-hidden p-6 rounded-2xl border"
              style={{
                background: 'linear-gradient(135deg, rgba(0, 112, 243,0.1) 0%, rgba(0, 112, 243,0.02) 100%)',
                borderColor: 'rgba(0, 112, 243,0.3)',
              }}
            >
              <RecommendedBadge visible />

              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
                style={{
                  background: 'rgba(16,185,129,0.1)',
                }}
              >
                <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>

              <h3
                className="text-lg font-bold mb-2 md:min-h-[3.5rem] transition-colors duration-500"
                style={{ color: colors.text }}
              >
                Vizantir
              </h3>

              <ul className="space-y-2 text-pretty text-sm leading-normal transition-colors duration-500" style={{ color: colors.textMuted }}>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-cobalt-accent flex-shrink-0 mt-[2px]" aria-hidden />
                  <span>Fixed scope, fixed price</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-cobalt-accent flex-shrink-0 mt-[2px]" aria-hidden />
                  <span>You get a finished product</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-cobalt-accent flex-shrink-0 mt-[2px]" aria-hidden />
                  <span>Direct access to the builder</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-cobalt-accent flex-shrink-0 mt-[2px]" aria-hidden />
                  <span>No surprise invoices</span>
                </li>
              </ul>
            </motion.div>
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
            We don’t sell hours. We deliver finished products.
          </motion.p>
        </div>
      </section>

      {/* Divider */}
      <div className="w-full h-px" style={{ background: colors.divider }} />

      {/* What's Included Section */}
      <section className="px-6 md:px-12 lg:px-20 pt-20 pb-10">
        <div className="max-w-4xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-2xl md:text-3xl font-bold mb-12 text-center text-balance"
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
                Every Project Includes
              </h3>

              <ul className="space-y-4 text-pretty text-base leading-relaxed transition-colors duration-500" style={{ color: colors.textMuted }}>
                {[
                  'Defined scope before work begins',
                  'Milestone updates throughout',
                  'Mobile-responsive design',
                  'Basic SEO setup',
                  'Launch support',
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <Check className="h-4 w-4 text-cobalt-accent flex-shrink-0 mt-[2px]" aria-hidden />
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
                Not Included (Unless Scoped)
              </h3>

              <ul className="space-y-4 text-pretty text-base leading-relaxed transition-colors duration-500" style={{ color: colors.textMuted }}>
                {[
                  'Unlimited revisions',
                  'Ongoing maintenance ($295/mo, optional)',
                  'Content writing',
                  'Stock photography',
                  'Hosting fees',
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <X className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-[2px]" aria-hidden />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="w-full h-px" style={{ background: colors.divider }} />

      {/* FAQ Section */}
      <section className="px-6 md:px-12 lg:px-20 pt-10 pb-20">
        <div className="max-w-3xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-2xl md:text-3xl font-bold mb-12 text-center text-balance"
            style={{ color: colors.text }}
          >
            Questions
          </motion.h2>

          <div className="space-y-3">
            {howWeWorkFaqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
              >
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className={`w-full text-left px-6 py-5 rounded-xl border transition-all duration-300 ${
                    openFaq !== index ? 'hover:bg-[#F9FAFB]' : ''
                  }`}
                  style={{
                    background: colors.cardBg,
                    borderColor:
                      openFaq === index
                        ? 'rgba(0, 112, 243,0.3)'
                        : colors.cardBorder,
                  }}
                >
                  <div className="flex items-center justify-between gap-4">
                    <span
                      className="font-medium"
                      style={{ color: colors.text }}
                    >
                      {faq.question}
                    </span>
                    <AccordionIndicator
                      isOpen={openFaq === index}
                      className="w-5 h-5 flex-shrink-0"
                      style={{ color: 'var(--cobalt-accent)' }}
                    />
                  </div>

                  {openFaq === index && (
                    <p
                      className="mt-4 text-sm leading-relaxed"
                      style={{ color: colors.textMuted }}
                    >
                      {faq.answer}
                    </p>
                  )}
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="w-full h-px" style={{ background: colors.divider }} />

      {/* CTA Section */}
      <section className="px-6 md:px-12 lg:px-20 py-20 md:py-24">
        <div className="max-w-2xl mx-auto text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-3xl md:text-4xl font-bold mb-6 text-balance transition-colors duration-500"
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
            Let's talk about your project. No commitment, no pressure.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Link
              href="/contact"
              className="bg-cobalt-gradient inline-flex items-center justify-center rounded-xl px-8 py-4 text-base font-semibold text-white shadow-cobalt focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0070F3]/40 focus-visible:ring-offset-2"
            >
              Book a Strategy Call
            </Link>
          </motion.div>
        </div>
      </section>
    </main>
  )
}