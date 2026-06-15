'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { PortableText } from '@portabletext/react'
import { ArrowRight, CheckCircle2 } from 'lucide-react'

import { vizantirPortableTextComponents } from '@/components/portable-text'
import { AccordionIndicator } from '@/components/ui/AccordionIndicator'
import { Button } from '@/components/ui/button'
import { Eyebrow } from '@/components/ui/Eyebrow'
import type { Service } from '@/lib/sanity/types'

interface ServicePageContentProps {
  service: Service
}

export default function ServicePageContent({ service }: ServicePageContentProps) {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0)

  const colors = useMemo(
    () => ({
      bg: '#FAFAFA',
      text: '#1A1A1A',
      textMuted: '#6B6B6B',
      accent: 'var(--gold-primary)',
      cardBg: '#FFFFFF',
      cardBorder: 'rgba(0,0,0,0.08)',
      divider: 'linear-gradient(90deg, transparent, rgba(180,83,9,0.3), transparent)',
    }),
    []
  )

  const sortedProcess = useMemo(() => {
    if (!service.process?.length) return []
    return [...service.process].sort((a, b) => (a.step ?? 0) - (b.step ?? 0))
  }, [service.process])

  const hasOverview = Array.isArray(service.overview) && service.overview.length > 0
  const hasBenefits = service.benefits && service.benefits.length > 0
  const hasProcess = sortedProcess.length > 0
  const hasOfferings = service.offerings && service.offerings.length > 0
  const hasDeliverables = service.deliverables && service.deliverables.length > 0
  const hasFaqs = service.faqs && service.faqs.length > 0
  const hasRelated = service.relatedServices && service.relatedServices.length > 0

  return (
    <main style={{ background: colors.bg }} className="min-h-screen transition-colors duration-500">
      {/* Hero */}
      <section className="relative px-6 md:px-12 lg:px-20 pt-28 pb-16 md:pb-20 overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            background: 'radial-gradient(ellipse at top right, rgba(255,198,76,0.18), transparent 55%)',
          }}
        />
        <div className="relative z-10 mx-auto max-w-4xl">
          <Link
            href="/services"
            className="mb-8 inline-flex items-center gap-2 text-sm font-medium transition-opacity hover:opacity-80"
            style={{ color: colors.textMuted }}
          >
            <span aria-hidden>←</span>
            All services
          </Link>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
            <Eyebrow align="start" className="mb-4">
              Service
            </Eyebrow>
            <h1
              className="text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl"
              style={{ color: colors.text }}
            >
              {service.heroHeadline || service.title}
            </h1>
            {service.heroSubheadline ? (
              <p className="mt-6 text-xl leading-relaxed md:text-2xl" style={{ color: colors.textMuted }}>
                {service.heroSubheadline}
              </p>
            ) : null}
            {service.description ? (
              <p
                className={`${service.heroSubheadline ? 'mt-4' : 'mt-6'} max-w-3xl text-lg leading-relaxed`}
                style={{ color: colors.textMuted }}
              >
                {service.description}
              </p>
            ) : null}
          </motion.div>
        </div>
      </section>

      <div className="h-px w-full" style={{ background: colors.divider }} />

      {/* Overview */}
      {hasOverview ? (
        <>
          <section className="px-6 py-16 md:px-12 md:py-20 lg:px-20">
            <div className="mx-auto max-w-3xl">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45 }}
              >
                <span
                  className="mb-4 inline-block text-xs font-medium uppercase tracking-[0.25em]"
                  style={{ color: colors.accent }}
                >
                  Overview
                </span>
                <h2 className="mb-8 text-3xl font-bold md:text-4xl" style={{ color: colors.text }}>
                  How we approach this
                </h2>
                <PortableText value={service.overview!} components={vizantirPortableTextComponents} />
              </motion.div>
            </div>
          </section>
          <div className="h-px w-full" style={{ background: colors.divider }} />
        </>
      ) : null}

      {/* Benefits */}
      {hasBenefits ? (
        <>
          <section className="px-6 py-16 md:px-12 md:py-20 lg:px-20">
            <div className="mx-auto max-w-4xl">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45 }}
                className="mb-10 text-center md:text-left"
              >
                <span
                  className="mb-4 inline-block text-xs font-medium uppercase tracking-[0.25em]"
                  style={{ color: colors.accent }}
                >
                  Benefits
                </span>
                <h2 className="text-3xl font-bold md:text-4xl" style={{ color: colors.text }}>
                  What you get
                </h2>
              </motion.div>
              <ul className="mx-auto max-w-2xl space-y-4">
                {service.benefits!.map((item, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: -12 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.35, delay: index * 0.04 }}
                    className="flex items-start gap-4"
                  >
                    <CheckCircle2 size={22} className="mt-0.5 shrink-0" style={{ color: colors.accent }} />
                    <span className="text-lg leading-relaxed" style={{ color: colors.textMuted }}>
                      {item}
                    </span>
                  </motion.li>
                ))}
              </ul>
            </div>
          </section>
          <div className="h-px w-full" style={{ background: colors.divider }} />
        </>
      ) : null}

      {/* Process */}
      {hasProcess ? (
        <>
          <section className="px-6 py-16 md:px-12 md:py-20 lg:px-20">
            <div className="mx-auto max-w-6xl">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45 }}
                className="mb-12 text-center"
              >
                <span
                  className="mb-4 inline-block text-xs font-medium uppercase tracking-[0.25em]"
                  style={{ color: colors.accent }}
                >
                  Process
                </span>
                <h2 className="text-3xl font-bold md:text-4xl" style={{ color: colors.text }}>
                  How it works
                </h2>
              </motion.div>
              <div className="grid gap-6 md:grid-cols-2">
                {sortedProcess.map((step, index) => (
                  <motion.div
                    key={`${step.step}-${index}`}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: index * 0.06 }}
                    className="rounded-2xl border p-6 md:p-8"
                    style={{ background: colors.cardBg, borderColor: colors.cardBorder }}
                  >
                    <div
                      className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl text-lg font-bold"
                      style={{ background: `${colors.accent}22`, color: colors.accent }}
                    >
                      {step.step ?? index + 1}
                    </div>
                    <h3 className="mb-3 text-xl font-bold" style={{ color: colors.text }}>
                      {step.title}
                    </h3>
                    <p className="leading-relaxed" style={{ color: colors.textMuted }}>
                      {step.description}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
          <div className="h-px w-full" style={{ background: colors.divider }} />
        </>
      ) : null}

      {/* Offerings */}
      {hasOfferings ? (
        <>
          <section className="px-6 py-16 md:px-12 md:py-20 lg:px-20">
            <div className="mx-auto max-w-6xl">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45 }}
                className="mb-12 text-center"
              >
                <span
                  className="mb-4 inline-block text-xs font-medium uppercase tracking-[0.25em]"
                  style={{ color: colors.accent }}
                >
                  Offerings
                </span>
                <h2 className="text-3xl font-bold md:text-4xl" style={{ color: colors.text }}>
                  What&apos;s included
                </h2>
              </motion.div>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {service.offerings!.map((offering, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: index * 0.05 }}
                    className="rounded-2xl border p-6 transition-transform duration-300 hover:-translate-y-0.5"
                    style={{ background: colors.cardBg, borderColor: colors.cardBorder }}
                  >
                    <h3 className="mb-3 text-lg font-bold" style={{ color: colors.text }}>
                      {offering.name}
                    </h3>
                    <p className="text-sm leading-relaxed" style={{ color: colors.textMuted }}>
                      {offering.description}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
          <div className="h-px w-full" style={{ background: colors.divider }} />
        </>
      ) : null}

      {/* Deliverables */}
      {hasDeliverables ? (
        <>
          <section className="px-6 py-16 md:px-12 md:py-20 lg:px-20">
            <div className="mx-auto max-w-4xl">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45 }}
                className="mb-10 text-center md:text-left"
              >
                <span
                  className="mb-4 inline-block text-xs font-medium uppercase tracking-[0.25em]"
                  style={{ color: colors.accent }}
                >
                  Deliverables
                </span>
                <h2 className="text-3xl font-bold md:text-4xl" style={{ color: colors.text }}>
                  Tangible outputs
                </h2>
              </motion.div>
              <ul className="mx-auto max-w-2xl space-y-3">
                {service.deliverables!.map((item, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.35, delay: index * 0.03 }}
                    className="flex items-start gap-3"
                  >
                    <CheckCircle2 size={20} className="mt-0.5 shrink-0" style={{ color: colors.accent }} />
                    <span className="leading-relaxed" style={{ color: colors.textMuted }}>
                      {item}
                    </span>
                  </motion.li>
                ))}
              </ul>
            </div>
          </section>
          <div className="h-px w-full" style={{ background: colors.divider }} />
        </>
      ) : null}

      {/* FAQs */}
      {hasFaqs ? (
        <>
          <section className="px-6 py-16 md:px-12 md:py-20 lg:px-20">
            <div className="mx-auto max-w-4xl">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45 }}
                className="mb-10 text-center"
              >
                <span
                  className="mb-4 inline-block text-xs font-medium uppercase tracking-[0.25em]"
                  style={{ color: colors.accent }}
                >
                  FAQs
                </span>
                <h2 className="text-3xl font-bold md:text-4xl" style={{ color: colors.text }}>
                  Common questions
                </h2>
              </motion.div>
              <div className="space-y-4">
                {service.faqs!.map((faq, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: index * 0.04 }}
                    className="overflow-hidden rounded-xl"
                    style={{
                      background: 'rgba(0,0,0,0.02)',
                      border: `1px solid rgba(0,0,0,0.08)`,
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaqIndex(openFaqIndex === index ? null : index)}
                      className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left transition-colors"
                      style={{ color: '#1A1A1A' }}
                    >
                      <span className="pr-4 text-lg font-semibold">{faq.question}</span>
                      <AccordionIndicator
                        isOpen={openFaqIndex === index}
                        className="w-5 h-5 flex-shrink-0"
                        style={{ color: 'var(--gold-accent)' }}
                      />
                    </button>
                    <AnimatePresence>
                      {openFaqIndex === index ? (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.28 }}
                          className="overflow-hidden"
                        >
                          <div className="px-6 pb-6">
                            <p
                              className="leading-relaxed whitespace-pre-wrap"
                              style={{ color: '#4A4A4A' }}
                            >
                              {faq.answer}
                            </p>
                          </div>
                        </motion.div>
                      ) : null}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
          <div className="h-px w-full" style={{ background: colors.divider }} />
        </>
      ) : null}

      {/* Related services */}
      {hasRelated ? (
        <>
          <section className="px-6 py-16 md:px-12 md:py-20 lg:px-20">
            <div className="mx-auto max-w-6xl">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45 }}
                className="mb-12 text-center"
              >
                <span
                  className="mb-4 inline-block text-xs font-medium uppercase tracking-[0.25em]"
                  style={{ color: colors.accent }}
                >
                  Related
                </span>
                <h2 className="text-3xl font-bold md:text-4xl" style={{ color: colors.text }}>
                  More services
                </h2>
              </motion.div>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {service.relatedServices!.map((rel, index) => (
                  <motion.div
                    key={rel.slug}
                    initial={{ opacity: 0, y: 14 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: index * 0.05 }}
                  >
                    <Link
                      href={`/services/${rel.slug}`}
                      className="group flex h-full flex-col rounded-2xl border p-6 transition-all duration-300 hover:-translate-y-1"
                      style={{ background: colors.cardBg, borderColor: colors.cardBorder }}
                    >
                      <h3 className="mb-3 text-lg font-bold" style={{ color: colors.text }}>
                        {rel.title}
                      </h3>
                      <span
                        className="mt-auto inline-flex items-center gap-2 text-sm font-semibold"
                        style={{ color: colors.accent }}
                      >
                        View service
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
          <div className="h-px w-full" style={{ background: colors.divider }} />
        </>
      ) : null}

      {/* CTA */}
      <section className="px-6 py-16 md:px-12 md:pb-24 lg:px-20">
        <div className="mx-auto max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="rounded-2xl p-8 md:p-12"
            style={{
              background: 'rgba(255,198,76,0.15)',
              border: '1px solid rgba(255,198,76,0.3)',
            }}
          >
            <h2 className="mb-4 text-2xl font-bold md:text-3xl" style={{ color: colors.text }}>
              Ready to talk about {service.title}?
            </h2>
            <p className="mb-8 text-lg" style={{ color: colors.textMuted }}>
              Book a strategy call and we&apos;ll walk through goals, scope, and fit—no pitch deck required.
            </p>
            <Button
              size="lg"
              asChild
              className="text-base font-semibold transition-all duration-300 hover:scale-105"
              style={{ background: 'var(--gold-primary)', color: '#1A1A1A', borderRadius: '8px' }}
            >
              <Link href="/contact" className="inline-flex items-center gap-2 px-8 py-4">
                Book a strategy call
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>
    </main>
  )
}
