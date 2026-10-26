'use client'

import { MotionCard } from '@/components/ui/MotionCard'
import { Section } from '@/components/ui/Section'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import SectionDivider from '@/components/ui/SectionDivider'
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Code2,
  FileBarChart,
  LayoutGrid,
  MessageSquare,
  Palette,
  Rocket,
  Route,
  Search,
  UserRound,
  X,
} from 'lucide-react'
import { commercialRealEstatePricingFaqItems } from '@/data/industry-pricing-faqs'
import { trackBookStrategyCall, trackPhoneClick } from '@/lib/analytics'

const STRATEGY_CALL_HREF = '/contact'

const offeringBlocks = [
  {
    icon: LayoutGrid,
    title: 'Listing Architecture',
    description:
      'Property listings that render fast, filter cleanly, and surface the right details for investors, tenants, and brokers alike. Configurable to your firm’s asset classes.',
  },
  {
    icon: Route,
    title: 'Multi-Audience IA',
    description:
      'Investors, tenants, capital partners, and brokers each need different content paths. The site routes them without making them ask.',
  },
  {
    icon: UserRound,
    title: 'Broker & Team Credibility',
    description:
      'Bio pages with Person schema, headshots, credentials, and contact routing so inquiries reach the right person the first time.',
  },
  {
    icon: MessageSquare,
    title: 'Inquiry Routing',
    description:
      'Property inquiry forms that route to the correct broker or team, not a black-hole info@ inbox that stalls the deal.',
  },
  {
    icon: FileBarChart,
    title: 'Market Reports & Insights CMS',
    description:
      'Sanity so your team publishes market data, quarterly reports, and thought leadership without waiting on a developer.',
  },
  {
    icon: Palette,
    title: 'Brand-Aligned Design',
    description:
      'Custom design that reflects your firm’s caliber and asset class, not a generic CRE theme skin.',
  },
] as const

const agencyCompare = [
  'WordPress + Elementor CRE themes',
  'Listing grids that treat every audience the same',
  'Slow listing pages that kill inquiry intent',
  'Generic broker bios with no schema',
  'Info@ inbox forms with no inquiry routing',
  'Contact forms with no conversion tracking',
] as const

const vizantirCompare = [
  'Custom Next.js builds matched to your firm and asset class',
  'Multi-audience IA. Investors, tenants, brokers each get the right path',
  'Performance tuned for Core Web Vitals',
  'Broker bios with Person schema and contact routing',
  'Property inquiry routing wired from day one',
  'Conversion events tracked from launch',
  'Sanity CMS your team can run without a developer',
] as const

const vizantirProofPoints = [
  { value: 'Next.js', label: 'Custom builds' },
  { value: 'Mobile', label: 'First by default' },
  { value: '10+', label: 'Years experience' },
] as const

const methodologyItems = [
  {
    title: 'Listing architecture',
    detail:
      'Property listings structured for how investors, tenants, and brokers actually search. Fast, filterable, and information-dense where it matters.',
  },
  {
    title: 'Multi-audience IA',
    detail:
      'Investor pages, tenant pages, market reports, and broker profiles built for each audience’s decision path.',
  },
  {
    title: 'Broker & team credibility',
    detail:
      'Person schema, headshots, credentials, and inquiry routing so the site reflects the caliber of your team.',
  },
  {
    title: 'Inquiry routing',
    detail:
      'Property inquiries route to the right broker or team automatically. No black-hole info@ inbox.',
  },
] as const

const processSteps = [
  {
    icon: Search,
    title: 'Discovery',
    description:
      'Firm audit, audience mapping (investors/tenants/brokers/capital), asset class inventory, and listing system decisions so the build matches how CRE deals actually get done.',
  },
  {
    icon: Palette,
    title: 'Design',
    description:
      'Brand-directed design that reflects the caliber of your firm and asset class, not a CRE theme skin.',
  },
  {
    icon: Code2,
    title: 'Build',
    description:
      'Next.js + Sanity: listings architecture, multi-audience IA, broker profiles, inquiry routing, and schema markup.',
  },
  {
    icon: Rocket,
    title: 'Launch',
    description:
      'Conversion tracking wired, analytics baseline set, and a clear handoff so your team can publish market reports and update listings without calling a developer.',
  },
] as const

const faqs = commercialRealEstatePricingFaqItems

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: 'easeOut' as const },
  },
}

const sectionReveal = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-40px' },
  transition: { duration: 0.5, ease: 'easeOut' as const },
}

export default function CREWebDesignClient() {
  return (
    <div className="bg-background text-foreground transition-colors duration-500">
      {/* 1 — Hero */}
      <Section hero className="relative flex min-h-[88svh] items-center justify-center overflow-hidden px-6 md:px-12 lg:px-20">
        {/* Atmosphere image slot — property, building, or market visual to be added in follow-up */}
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden
          data-atmosphere-slot
        />
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,var(--cobalt-muted-subtle)_0%,transparent_60%)]"
          aria-hidden
        />

        <div className="relative z-10 mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="mb-8 inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-4 py-2"
          >
            <Building2 size={16} className="text-cobalt-text" aria-hidden />
            <span className="text-sm text-muted-foreground">
              CRE Firms · Brokerages · Property Groups
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.08 }}
            className="mb-6 font-black leading-[1.05] text-foreground sm:text-5xl md:text-6xl lg:text-7xl"
          >
            Commercial Real Estate Web Design
            <br />
            <span className="text-cobalt-text">That Converts</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.16 }}
            className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl"
          >
            Too many CRE firms lose qualified inquiries to competitors with stronger listing
            presentation and multi-audience content architecture. That&apos;s what a site built
            for how deals actually get done looks like.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.24 }}
            className="flex flex-col items-center gap-[var(--btn-stack)]"
          >
            <Button
              size="lg"
              asChild
              className="group rounded-xl bg-cobalt-gradient px-8 py-4 text-base font-semibold text-white shadow-cobalt focus-visible:ring-2 focus-visible:ring-[#0070F3]/50 focus-visible:ring-offset-2"
            >
              <Link
                href={STRATEGY_CALL_HREF}
                onClick={() => trackBookStrategyCall('commercial_real_estate_hero')}
              >
                Book a Strategy Call
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <p className="text-sm text-muted-foreground">
              Vizantir Design Studio · Built for CRE firms, brokerages, and property groups
            </p>
          </motion.div>
        </div>
      </Section>

      <SectionDivider />

      {/* 2 — The Problem */}
      <Section className="px-6 md:px-12 lg:px-20" aria-labelledby="problem-heading">
        <div className="mx-auto max-w-3xl">
          <motion.div {...sectionReveal}>
            <h2
              id="problem-heading"
              className="mb-8 font-bold text-foreground md:text-4xl lg:text-5xl"
            >
              A generic site loses qualified inquiries before they ever reach your team
            </h2>
            <div className="max-w-[48ch] space-y-5 text-lg leading-relaxed text-muted-foreground">
              <p>
                Template CRE sites all look alike. A stock building hero, a generic &ldquo;About Our
                Firm&rdquo; page, a listing grid that doesn&apos;t help anyone find what they&apos;re
                looking for. Investors, tenants, and capital partners all need different information
                paths. A generic site loses them to a competitor who built their site for how CRE
                actually gets done.
              </p>
              <p>
                Property inquiries live and die on presentation and clarity. Slow listing pages,
                generic broker bios, and buried inquiry forms cost qualified leads. The site should
                route each visitor to the right person, the right listing, the right answer, not
                force them to hunt.
              </p>
            </div>
          </motion.div>
        </div>
      </Section>

      <SectionDivider />

      {/* 3 — What We Build */}
      <Section className="px-6 md:px-12 lg:px-20" aria-labelledby="what-we-build-heading">
        <div className="mx-auto max-w-6xl">
          <motion.div {...sectionReveal} className="mb-[var(--heading-gap)] text-center">
            <h2
              id="what-we-build-heading"
              className="mb-5 font-bold text-foreground md:text-4xl lg:text-5xl"
            >
              Built for How CRE Audiences Decide
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              Every piece of the site earns its place. Listing clarity, multi-audience paths, and a
              clear route to the right inquiry.
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-40px' }}
            className="grid gap-[var(--stack)] md:grid-cols-2 lg:grid-cols-3"
          >
            {offeringBlocks.map((block) => (
              <MotionCard variant="plain" pad="sm" interactive badge={false}
                key={block.title}
                variants={itemVariants}
                className="block h-auto rounded-2xl border border-border bg-muted">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-black/[0.02]">
                  <block.icon size={24} className="text-cobalt-text" aria-hidden />
                </div>
                <h3 className="mb-2 text-lg font-bold text-foreground">{block.title}</h3>
                <p className="text-base md:text-sm leading-normal md:leading-relaxed text-muted-foreground">{block.description}</p>
              </MotionCard>
            ))}
          </motion.div>
        </div>
      </Section>

      <SectionDivider />

      {/* 4 — Differentiation */}
      <Section className="px-6 md:px-12 lg:px-20" aria-labelledby="differentiation-heading">
        <div className="mx-auto max-w-6xl">
          <motion.div {...sectionReveal} className="mb-[var(--heading-gap)] text-center">
            <h2
              id="differentiation-heading"
              className="font-bold text-foreground md:text-4xl lg:text-5xl"
            >
              How Most Agencies Build vs. How Vizantir Builds
            </h2>
          </motion.div>

          <div className="grid gap-[var(--stack)] lg:grid-cols-2">
            <MotionCard variant="plain" badge={false}
              {...sectionReveal}
              className="block h-auto rounded-2xl border border-border bg-muted">
              <h3 className="mb-6 text-xl font-bold text-foreground">
                How most agencies build CRE sites
              </h3>
              <ul className="space-y-3">
                {agencyCompare.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <X
                      className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/70"
                      aria-hidden
                    />
                    <span className="text-base md:text-sm leading-normal md:leading-relaxed text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </MotionCard>

            <MotionCard variant="plain" badge={false}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.5, delay: 0.08 }}
              className="block h-auto rounded-2xl border border-cobalt-muted-border bg-cobalt-muted-subtle">
              <h3 className="mb-6 text-xl font-bold text-foreground">How Vizantir builds them</h3>
              <ul className="mb-8 space-y-3">
                {vizantirCompare.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle2
                      className="mt-0.5 h-4 w-4 shrink-0 text-cobalt-text"
                      aria-hidden
                    />
                    <span className="text-base md:text-sm leading-normal md:leading-relaxed text-foreground/90">{item}</span>
                  </li>
                ))}
              </ul>
              <div className="grid grid-cols-3 gap-4 border-t border-border pt-6">
                {vizantirProofPoints.map((stat) => (
                  <div key={stat.label} className="text-center">
                    <div className="text-xl font-bold text-cobalt-text md:text-2xl">
                      {stat.value}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground md:text-sm">{stat.label}</div>
                  </div>
                ))}
              </div>
            </MotionCard>
          </div>
        </div>
      </Section>

      <SectionDivider />

      {/* 5 — Proof (methodology + credential band) */}
      <Section className="px-6 md:px-12 lg:px-20" aria-labelledby="proof-heading">
        <div className="mx-auto max-w-6xl">
          <motion.div {...sectionReveal} className="mb-[var(--heading-gap)] text-center">
            <h2
              id="proof-heading"
              className="mb-5 font-bold text-foreground md:text-4xl lg:text-5xl"
            >
              Process-Driven Proof, Not Invented Case Studies
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              We do not pad this page with fabricated results. What we show is how the work is
              structured, the same methodology every CRE engagement follows.
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-40px' }}
            className="mb-12 grid gap-[var(--stack)] md:grid-cols-2"
          >
            {methodologyItems.map((item) => (
              <MotionCard variant="plain" pad="sm" badge={false}
                key={item.title}
                variants={itemVariants}
                className="block h-auto rounded-2xl border border-border bg-muted">
                <div className="mb-3 flex items-center gap-3">
                  <Building2 size={20} className="text-cobalt-text" aria-hidden />
                  <h3 className="text-lg font-bold text-foreground">{item.title}</h3>
                </div>
                <p className="text-base md:text-sm leading-normal md:leading-relaxed text-muted-foreground">{item.detail}</p>
              </MotionCard>
            ))}
          </motion.div>

          <motion.div
            {...sectionReveal}
            className="rounded-2xl border border-border bg-muted px-6 py-8 text-center md:px-10"
          >
            <p className="text-base font-semibold tracking-wide text-foreground md:text-lg">
              Vizantir Design Studio · Las Vegas
            </p>
            <p className="mx-auto mt-3 max-w-[48ch] text-sm leading-relaxed text-muted-foreground">
              Custom Next.js websites for CRE firms, brokerages, and property groups, with
              listing-forward builds and multi-audience content architecture. From Southern Nevada
              and nationwide.
            </p>
          </motion.div>
        </div>
      </Section>

      <SectionDivider />

      {/* 6 — Process */}
      <Section className="px-6 md:px-12 lg:px-20" aria-labelledby="process-heading">
        <div className="mx-auto max-w-6xl">
          <motion.div {...sectionReveal} className="mb-[var(--heading-gap)] text-center">
            <h2
              id="process-heading"
              className="mb-5 font-bold text-foreground md:text-4xl lg:text-5xl"
            >
              What Happens When We Build Your Site
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              A clear sequence from Discovery through Launch, so you know exactly what the engagement
              looks like.
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-40px' }}
            className="grid gap-[var(--stack)] sm:grid-cols-2 lg:grid-cols-4"
          >
            {processSteps.map((step) => (
              <MotionCard variant="plain" pad="sm" badge={false}
                key={step.title}
                variants={itemVariants}
                className="block h-auto rounded-2xl border border-border bg-muted">
                <div className="mb-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-black/[0.02]">
                    <step.icon size={22} className="text-cobalt-text" aria-hidden />
                  </div>
                </div>
                <h3 className="mb-2 text-lg font-bold text-foreground">{step.title}</h3>
                <p className="text-base md:text-sm leading-normal md:leading-relaxed text-muted-foreground">{step.description}</p>
              </MotionCard>
            ))}
          </motion.div>
        </div>
      </Section>

      <SectionDivider />

      {/* 7 — FAQ */}
      <Section className="px-6 md:px-12 lg:px-20" aria-labelledby="faq-heading">
        <div className="mx-auto max-w-4xl">
          <motion.div {...sectionReveal} className="mb-[var(--heading-gap)] text-center">
            <h2
              id="faq-heading"
              className="font-bold text-foreground md:text-4xl lg:text-5xl"
            >
              Commercial Real Estate Web Design Questions
            </h2>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-40px' }}
            className="space-y-[var(--stack)]"
          >
            {faqs.map((faq) => (
              <MotionCard variant="plain" pad="sm" badge={false}
                key={faq.question}
                variants={itemVariants}
                className="block h-auto rounded-2xl border border-border bg-muted">
                <h3 className="mb-3 text-lg font-semibold text-foreground">{faq.question}</h3>
                <p className="max-w-[48ch] text-base md:text-sm leading-normal md:leading-relaxed text-muted-foreground">{faq.answer}</p>
              </MotionCard>
            ))}
          </motion.div>
        </div>
      </Section>

      {/* 8 — Closing CTA band */}
      <Section size="lg" className="relative overflow-hidden bg-cobalt-primary px-6 md:px-12 lg:px-20"
        aria-labelledby="closing-cta-heading">
        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <motion.div {...sectionReveal}>
            <h2
              id="closing-cta-heading"
              className="mb-5 font-bold text-white md:text-4xl lg:text-5xl"
            >
              Ready to Build a Site That Converts Qualified Inquiries?
            </h2>
            <p className="mb-[var(--cta-gap)] text-lg text-white">
              Strategy calls are 30 minutes, no pitch, just fit.
            </p>
            <Button
              size="lg"
              asChild
              className="btn-inverse group rounded-xl bg-white px-8 py-4 text-base font-semibold text-cobalt-text shadow-lg hover:bg-white/95 focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-cobalt-primary"
            >
              <Link
                href={STRATEGY_CALL_HREF}
                onClick={() => trackBookStrategyCall('commercial_real_estate_closing')}
              >
                Book a Strategy Call
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <p className="mt-6 text-sm text-white">
              Vizantir Design Studio · Las Vegas
              <span className="mx-2 text-white">·</span>
              <Link
                href="tel:+17022890758"
                onClick={trackPhoneClick}
                className="text-white -mx-2 -my-0.5 rounded-full px-2 py-0.5 transition-colors duration-150 hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-cobalt-primary"
              >
                (702) 289-0758
              </Link>
            </p>
          </motion.div>
        </div>
      </Section>
    </div>
  )
}
