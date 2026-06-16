'use client'

import { useState } from 'react'
import { howWeWorkFaqs, howWeWorkProcess } from '@/data/how-we-work'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { AccordionIndicator } from '@/components/ui/AccordionIndicator'
import { Eyebrow } from '@/components/ui/Eyebrow'

export default function HowWeWorkPageClient() {
  // Colors matching Vizantir design system
  const colors = {
    bg: '#FAFAFA',
    text: '#1A1A1A',
    textMuted: '#6B7280',
    textSubtle: '#9CA3AF',
    accent: 'var(--gold-accent)',
    cardBg: '#FFFFFF',
    cardBorder: 'rgba(0,0,0,0.08)',
    divider: 'linear-gradient(90deg, transparent, rgba(180,83,9,0.3), transparent)',
  }

  const [openFaq, setOpenFaq] = useState<number | null>(null)

  return (
    <main
      className="min-h-screen transition-colors duration-500"
      style={{ background: colors.bg }}
    >
      {/* Hero Section */}
      <section className="relative px-6 md:px-12 lg:px-20 pt-32 pb-20">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6"
          >
            <Eyebrow>How We Work</Eyebrow>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6 transition-colors duration-500"
            style={{ color: colors.text }}
          >
            From first call to launch —
            <br />
            <span className="transition-colors duration-500" style={{ color: colors.textMuted }}>no surprises.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg max-w-2xl mx-auto leading-relaxed transition-colors duration-500"
            style={{ color: colors.textMuted }}
          >
            A clear process with defined scope, fixed pricing, and milestone check-ins.
            You know exactly what you're getting before we start.
          </motion.p>
        </div>
      </section>

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
            className="text-2xl md:text-3xl font-bold mb-16 text-center transition-colors duration-500"
            style={{ color: colors.text }}
          >
            The Process
          </motion.h2>

          <div className="space-y-8">
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
                    background: 'rgba(180,83,9,0.1)',
                    color: colors.accent,
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
                    className="text-base leading-relaxed transition-colors duration-500"
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

      {/* Choosing the Right Platform */}
      <section className="px-6 md:px-12 lg:px-20 py-20">
        <div className="max-w-4xl mx-auto">
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
              Platform
            </span>
            <h2
            className="text-2xl md:text-3xl font-bold transition-colors duration-500"
            style={{ color: colors.text }}
            >
              Choosing the Right Fit
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* WordPress Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="p-8 rounded-2xl border"
              style={{
                background: colors.cardBg,
                borderColor: colors.cardBorder,
              }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-6"
                style={{
                  background: 'rgba(180,83,9,0.1)',
                }}
              >
                <svg
                  className="w-6 h-6"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={colors.accent}
                  strokeWidth="1.5"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
              </div>

              <h3
                className="text-xl font-bold mb-3 transition-colors duration-500"
                style={{ color: colors.text }}
              >
                WordPress
              </h3>

              <p className="mb-6 text-base leading-relaxed transition-colors duration-500" style={{ color: colors.textMuted }}>
                Best for marketing sites, blogs, and businesses that want to update
                content themselves. Faster to launch, familiar editing experience.
              </p>

              <div
                className="flex items-center gap-2 text-sm font-medium"
                style={{ color: colors.textSubtle }}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <span>Timeline: 3-5 weeks</span>
              </div>
            </motion.div>

            {/* Next.js Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="p-8 rounded-2xl border"
              style={{
                background: colors.cardBg,
                borderColor: colors.cardBorder,
              }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-6"
                style={{
                  background: 'rgba(180,83,9,0.1)',
                }}
              >
                <svg
                  className="w-6 h-6"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={colors.accent}
                  strokeWidth="1.5"
                >
                  <polygon points="12 2 2 7 12 12 22 7 12 2" />
                  <polyline points="2 17 12 22 22 17" />
                  <polyline points="2 12 12 17 22 12" />
                </svg>
              </div>

              <h3
                className="text-xl font-bold mb-3 transition-colors duration-500"
                style={{ color: colors.text }}
              >
                Next.js
              </h3>

              <p className="mb-6 text-base leading-relaxed transition-colors duration-500" style={{ color: colors.textMuted }}>
                Best for brands that need cinematic motion, peak performance, or custom
                functionality like dashboards, portals, and integrations.
              </p>

              <div
                className="flex items-center gap-2 text-sm font-medium"
                style={{ color: colors.textSubtle }}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <span>Timeline: 5-8 weeks</span>
              </div>
            </motion.div>
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-center mt-8 text-sm"
            style={{ color: colors.textSubtle }}
          >
            Not sure which fits? We'll figure that out in Discovery.
          </motion.p>
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
            className="text-2xl md:text-3xl font-bold transition-colors duration-500"
            style={{ color: colors.text }}
            >
              Why Vizantir
            </h2>
          </motion.div>

          {/* Comparison Cards */}
          <div className="grid md:grid-cols-3 gap-6">
            {/* Traditional Agencies */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="p-6 rounded-2xl border"
              style={{
                background: colors.cardBg,
                borderColor: colors.cardBorder,
              }}
            >
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
                className="text-lg font-bold mb-2 transition-colors duration-500"
                style={{ color: colors.text }}
              >
                Traditional Agencies
              </h3>

              <ul className="space-y-2 text-sm leading-normal transition-colors duration-500" style={{ color: colors.textMuted }}>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 mt-0.5">✗</span>
                  <span>Big teams, big overhead, big invoices</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 mt-0.5">✗</span>
                  <span>Layers between you and the work</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 mt-0.5">✗</span>
                  <span>Vague quotes, surprise invoices</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 mt-0.5">✗</span>
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
              className="p-6 rounded-2xl border"
              style={{
                background: colors.cardBg,
                borderColor: colors.cardBorder,
              }}
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
                style={{
                  background: 'rgba(255, 198, 76,0.1)',
                }}
              >
                <svg className="w-5 h-5 text-gold-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>

              <h3
                className="text-lg font-bold mb-2 transition-colors duration-500"
                style={{ color: colors.text }}
              >
                Hourly Dev Shops
              </h3>

              <ul className="space-y-2 text-sm leading-normal transition-colors duration-500" style={{ color: colors.textMuted }}>
                <li className="flex items-start gap-2">
                  <span className="text-gold-accent mt-0.5">✗</span>
                  <span>You buy hours, not outcomes</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gold-accent mt-0.5">✗</span>
                  <span>100 hours in, project 60% done</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gold-accent mt-0.5">✗</span>
                  <span>No guaranteed deliverable</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gold-accent mt-0.5">✗</span>
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
              className="p-6 rounded-2xl border relative overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, rgba(180,83,9,0.1) 0%, rgba(180,83,9,0.02) 100%)',
                borderColor: 'rgba(180,83,9,0.3)',
              }}
            >
              {/* Popular badge */}
              <span
                className="absolute top-4 right-4 text-[10px] tracking-wider uppercase px-2 py-1 rounded-full font-semibold"
                style={{
                  background: colors.accent,
                  color: '#FFFFFF',
                }}
              >
                Better
              </span>

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
                className="text-lg font-bold mb-2 transition-colors duration-500"
                style={{ color: colors.text }}
              >
                Vizantir
              </h3>

              <ul className="space-y-2 text-sm leading-normal transition-colors duration-500" style={{ color: colors.textMuted }}>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 mt-0.5">✓</span>
                  <span>Fixed scope, fixed price</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 mt-0.5">✓</span>
                  <span>You get a finished product</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 mt-0.5">✓</span>
                  <span>Direct access to the builder</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 mt-0.5">✓</span>
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
            className="text-center mt-12 text-lg font-medium"
            style={{ color: colors.text }}
          >
            "We don't sell hours.{' '}
            <span className="transition-colors duration-500" style={{ color: colors.accent }}>We deliver finished products.</span>"
          </motion.p>
        </div>
      </section>

      {/* Divider */}
      <div className="w-full h-px" style={{ background: colors.divider }} />

      {/* What's Included Section */}
      <section className="px-6 md:px-12 lg:px-20 py-20">
        <div className="max-w-4xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-2xl md:text-3xl font-bold mb-12 text-center"
            style={{ color: colors.text }}
          >
            What to Expect
          </motion.h2>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Included */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h3
                className="text-xs tracking-[0.25em] uppercase font-medium mb-6 transition-colors duration-500"
                style={{ color: colors.accent }}
              >
                Every Project Includes
              </h3>

              <ul className="space-y-4 text-base leading-relaxed transition-colors duration-500" style={{ color: colors.textMuted }}>
                {[
                  'Defined scope before work begins',
                  'Milestone updates throughout',
                  'Mobile-responsive design',
                  'Basic SEO setup',
                  'Launch support',
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <span className="text-emerald-500">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Not Included */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <h3
                className="text-xs tracking-[0.25em] uppercase font-medium mb-6 transition-colors duration-500"
                style={{ color: colors.textSubtle }}
              >
                Not Included (Unless Scoped)
              </h3>

              <ul className="space-y-4 text-base leading-relaxed transition-colors duration-500" style={{ color: colors.textMuted }}>
                {[
                  'Unlimited revisions',
                  'Ongoing maintenance',
                  'Content writing',
                  'Stock photography',
                  'Hosting fees',
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <span className="transition-colors duration-500" style={{ color: colors.textSubtle }}>✗</span>
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
      <section className="px-6 md:px-12 lg:px-20 py-20">
        <div className="max-w-3xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-2xl md:text-3xl font-bold mb-12 text-center"
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
                  className="w-full text-left p-5 rounded-xl border transition-all duration-300"
                  style={{
                    background: colors.cardBg,
                    borderColor:
                      openFaq === index
                        ? 'rgba(180,83,9,0.3)'
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
                      style={{ color: 'var(--gold-accent)' }}
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
            className="text-3xl md:text-4xl font-bold mb-6 transition-colors duration-500"
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
              className="inline-flex items-center gap-3 px-8 py-4 rounded-full text-base font-semibold transition-all duration-300 hover:scale-105 group"
              style={{
                background: '#1A1A1A',
                color: '#FFFFFF',
              }}
            >
              <span>Get in Touch</span>
              <svg
                className="w-5 h-5 transition-transform group-hover:translate-x-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </motion.div>
        </div>
      </section>
    </main>
  )
}