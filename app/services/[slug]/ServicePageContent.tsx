'use client'

import { AccordionItem } from '@/components/ui/AccordionItem'
import { cardSurfaceVariants } from '@/components/ui/Card'
import { cn } from '@/lib/utils'
import { MotionCard } from '@/components/ui/MotionCard'
import { Section } from '@/components/ui/Section'
import { useMemo, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { PortableText } from '@portabletext/react'
import { ArrowRight, CheckCircle2 } from 'lucide-react'

import { TierComparison } from '@/components/landing-pages/TierComparison'
import { vizantirPortableTextComponents } from '@/components/portable-text'
import { Button } from '@/components/ui/button'
import { serviceHref } from '@/lib/service-href'
import type { Service } from '@/lib/sanity/types'

type ServiceHeadingSet = {
  overview: string
  benefits: string
  process: string
  offerings: string
  deliverables: string
  faqs: string
  related: string
}

const SERVICE_HEADINGS: Record<string, ServiceHeadingSet> = {
  'website-strategy': {
    overview: 'How we map the site before design',
    benefits: 'What strategy work covers',
    process: 'How a strategy engagement runs',
    offerings: "What's in the strategy map",
    deliverables: 'What you leave the strategy with',
    faqs: 'Questions about website strategy',
    related: 'Services that follow strategy',
  },
  'web-design': {
    overview: 'How we design around the brand and the buyer',
    benefits: 'What custom design includes',
    process: 'How design and build happen together',
    offerings: "What's in a design engagement",
    deliverables: 'Design you can review in the browser',
    faqs: 'Questions about web design',
    related: 'Services around the design',
  },
  'web-development': {
    overview: 'How we build on Next.js',
    benefits: 'What a custom Next.js build includes',
    process: 'How development runs from kickoff to launch',
    offerings: "What's in the development stack",
    deliverables: 'Code and CMS you receive',
    faqs: 'Questions about web development',
    related: 'Services around the build',
  },
  'landing-pages': {
    overview: 'How we build conversion pages',
    benefits: 'What a landing page engagement includes',
    process: 'How a landing page is scoped',
    offerings: "What's in each landing page tier",
    deliverables: 'Pages and tracking you receive',
    faqs: 'Questions about landing pages',
    related: 'Services around campaign pages',
  },
  'website-refreshes': {
    overview: 'How we decide what to fix versus rebuild',
    benefits: 'What a refresh can change',
    process: 'How an audit-led refresh runs',
    offerings: "What's in a refresh engagement",
    deliverables: 'Fixes you keep from the current site',
    faqs: 'Questions about website refreshes',
    related: 'Services around a refresh',
  },
  'cms-integrations': {
    overview: 'How we set up Sanity for editors',
    benefits: 'What a Sanity setup includes',
    process: 'How the CMS engagement runs',
    offerings: "What's in the Studio configuration",
    deliverables: 'Schemas and training you receive',
    faqs: 'Questions about CMS integrations',
    related: 'Services around the CMS',
  },
  'website-care': {
    overview: 'How we keep the site working after launch',
    benefits: 'What a care retainer covers',
    process: 'How monthly care runs',
    offerings: "What's in each care tier",
    deliverables: 'Reports and work you receive each month',
    faqs: 'Questions about website care',
    related: 'Services around ongoing care',
  },
}

const FALLBACK_HEADINGS: ServiceHeadingSet = {
  overview: 'How we approach this',
  benefits: 'What you get',
  process: 'How it works',
  offerings: "What's included",
  deliverables: 'Tangible outputs',
  faqs: 'Common questions',
  related: 'More services',
}

interface ServicePageContentProps {
  service: Service
}

export default function ServicePageContent({ service }: ServicePageContentProps) {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0)

  const colors = useMemo(
    () => ({
      bg: 'var(--background)',
      text: 'var(--foreground)',
      textMuted: 'var(--muted-foreground)',
      accent: 'var(--cobalt-primary)',
      cardBg: '#FFFFFF',
      cardBorder: 'rgba(0,0,0,0.08)',
      divider: 'linear-gradient(90deg, transparent, rgba(0, 112, 243,0.3), transparent)',
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
  const headings = SERVICE_HEADINGS[service.slug] ?? FALLBACK_HEADINGS

  return (
    <div style={{ background: colors.bg }} className="min-h-screen transition-colors duration-500">
      {/* Hero */}
      <Section hero className="relative px-6 md:px-12 lg:px-20 overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            background: 'radial-gradient(ellipse at top right, rgba(0, 112, 243,0.18), transparent 55%)',
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
            {service.slug === 'landing-pages' ? (
              <Link
                href="/landing-pages"
                className="mt-8 flex items-center justify-between gap-4 rounded-2xl border p-5 no-underline transition-opacity hover:opacity-90 md:p-6"
                style={{
                  background: 'rgba(0, 112, 243, 0.08)',
                  borderColor: 'rgba(0, 112, 243, 0.28)',
                }}
              >
                <span className="min-w-0">
                  <span
                    className="mb-1 block text-xs font-medium uppercase tracking-[0.2em]"
                    style={{ color: colors.accent }}
                  >
                    Landing page offerings
                  </span>
                  <span className="block text-lg font-semibold md:text-xl" style={{ color: colors.text }}>
                    See packages, pricing, and live examples
                  </span>
                </span>
                <ArrowRight className="h-5 w-5 shrink-0" style={{ color: colors.accent }} />
              </Link>
            ) : null}
          </motion.div>
        </div>
      </Section>

      <div className="h-px w-full" style={{ background: colors.divider }} />

      {/* Overview */}
      {hasOverview ? (
        <>
          <Section className="px-6 md:px-12 lg:px-20">
            <div className="mx-auto max-w-3xl">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45 }}
              >
                <h2 className="mb-8 text-3xl font-bold md:text-4xl" style={{ color: colors.text }}>
                  {headings.overview}
                </h2>
                <PortableText value={service.overview!} components={vizantirPortableTextComponents} />
              </motion.div>
            </div>
          </Section>
          <div className="h-px w-full" style={{ background: colors.divider }} />
        </>
      ) : null}

      {/* Benefits */}
      {hasBenefits ? (
        <>
          <Section className="px-6 md:px-12 lg:px-20">
            <div className="mx-auto max-w-4xl">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45 }}
                className="mb-10 text-center md:text-left"
              >
                <h2 className="text-3xl font-bold md:text-4xl" style={{ color: colors.text }}>
                  {headings.benefits}
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
          </Section>
          <div className="h-px w-full" style={{ background: colors.divider }} />
        </>
      ) : null}

      {/* Process */}
      {hasProcess ? (
        <>
          <Section className="px-6 md:px-12 lg:px-20">
            <div className="mx-auto max-w-6xl">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45 }}
                className="mb-12 text-center"
              >
                <h2 className="text-3xl font-bold md:text-4xl" style={{ color: colors.text }}>
                  {headings.process}
                </h2>
              </motion.div>
              <div className="grid gap-[var(--stack)] md:grid-cols-2">
                {sortedProcess.map((step, index) => (
                  <MotionCard variant="plain" badge={false}
                    key={`${step.step}-${index}`}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: index * 0.06 }}
                    className="block h-auto rounded-2xl border"
                    style={{ background: colors.cardBg, borderColor: colors.cardBorder }}>
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
                  </MotionCard>
                ))}
              </div>
            </div>
          </Section>
          <div className="h-px w-full" style={{ background: colors.divider }} />
        </>
      ) : null}

      {/* Offerings */}
      {hasOfferings ? (
        <>
          <Section className="px-6 md:px-12 lg:px-20">
            <div className="mx-auto max-w-6xl">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45 }}
                className="mb-12 text-center"
              >
                <h2 className="text-3xl font-bold md:text-4xl" style={{ color: colors.text }}>
                  {headings.offerings}
                </h2>
              </motion.div>
              <div className="grid gap-[var(--stack)] md:grid-cols-2 lg:grid-cols-3">
                {service.offerings!.map((offering, index) => (
                  <MotionCard variant="plain" interactive badge={false}
                    key={index}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: index * 0.05 }}
                    className="block h-auto rounded-2xl border"
                    style={{ background: colors.cardBg, borderColor: colors.cardBorder }}>
                    <h3 className="mb-3 text-lg font-bold" style={{ color: colors.text }}>
                      {offering.name}
                    </h3>
                    <p className="text-sm leading-relaxed" style={{ color: colors.textMuted }}>
                      {offering.description}
                    </p>
                  </MotionCard>
                ))}
              </div>
            </div>
          </Section>
          <div className="h-px w-full" style={{ background: colors.divider }} />
        </>
      ) : null}

      {service.slug === 'landing-pages' && (
        <TierComparison isPrimaryDemo={false} />
      )}

      {/* Deliverables */}
      {hasDeliverables ? (
        <>
          <Section className="px-6 md:px-12 lg:px-20">
            <div className="mx-auto max-w-4xl">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45 }}
                className="mb-10 text-center md:text-left"
              >
                <h2 className="text-3xl font-bold md:text-4xl" style={{ color: colors.text }}>
                  {headings.deliverables}
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
          </Section>
          <div className="h-px w-full" style={{ background: colors.divider }} />
        </>
      ) : null}

      {/* FAQs */}
      {hasFaqs ? (
        <>
          <Section className="px-6 md:px-12 lg:px-20">
            <div className="mx-auto max-w-4xl">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45 }}
                className="mb-10 text-center"
              >
                <h2 className="text-3xl font-bold md:text-4xl" style={{ color: colors.text }}>
                  {headings.faqs}
                </h2>
              </motion.div>
              <div className="space-y-[var(--stack)]">
                {service.faqs!.map((faq, index) => {
                  const isOpen = openFaqIndex === index
                  const triggerId = `service-faq-trigger-${service.slug}-${index}`
                  const panelId = `service-faq-panel-${service.slug}-${index}`

                  return (
                    <AccordionItem
                      key={index}
                      initial={{ opacity: 0, y: 12 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: index * 0.04 }}
                      triggerId={triggerId}
                      panelId={panelId}
                      isOpen={isOpen}
                      onToggle={() => setOpenFaqIndex(isOpen ? null : index)}
                      question={faq.question}
                      style={{ background: 'rgba(0,0,0,0.02)', borderColor: 'rgba(0,0,0,0.08)' }}
                    >
                      <p className="leading-relaxed whitespace-pre-wrap text-body">{faq.answer}</p>
                    </AccordionItem>
                  )
                })}
              </div>
            </div>
          </Section>
          <div className="h-px w-full" style={{ background: colors.divider }} />
        </>
      ) : null}

      {/* Related services */}
      {hasRelated ? (
        <>
          <Section className="px-6 md:px-12 lg:px-20">
            <div className="mx-auto max-w-6xl">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45 }}
                className="mb-12 text-center"
              >
                <h2 className="text-3xl font-bold md:text-4xl" style={{ color: colors.text }}>
                  {headings.related}
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
                      href={serviceHref(rel.slug)}
                      className={cn(cardSurfaceVariants({ variant: 'plain', interactive: true }), 'group rounded-2xl')}
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
          </Section>
          <div className="h-px w-full" style={{ background: colors.divider }} />
        </>
      ) : null}

      {/* CTA */}
      <Section size="lg" className="px-6 md:px-12 lg:px-20">
        <div className="mx-auto max-w-3xl text-center">
          <MotionCard variant="plain" pad="lg" badge={false}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="block h-auto rounded-2xl"
            style={{
              background: 'rgba(0, 112, 243,0.15)',
              border: '1px solid rgba(0, 112, 243,0.3)',
            }}
          >
            <h2 className="mb-4 text-2xl font-bold md:text-3xl" style={{ color: colors.text }}>
              Ready to talk about {service.title}?
            </h2>
            <p className="mb-8 text-lg" style={{ color: colors.textMuted }}>
              Book a strategy call and we&apos;ll walk through goals, scope, and fit. No pitch deck required.
            </p>
            <Button
              size="lg"
              asChild
              className="bg-cobalt-gradient text-base font-semibold rounded-lg"
            >
              <Link href="/contact" className="inline-flex items-center gap-2 px-8 py-4">
                Book a strategy call
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </MotionCard>
        </div>
      </Section>
    </div>
  )
}
