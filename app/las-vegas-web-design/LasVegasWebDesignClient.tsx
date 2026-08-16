'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Eyebrow } from '@/components/ui/Eyebrow'
import SectionDivider from '@/components/ui/SectionDivider'
import { PricingCards } from '@/components/pricing/PricingCards'
import {
  ArrowRight,
  CheckCircle2,
  Code2,
  MapPin,
  MapPinned,
  Navigation,
  Palette,
  Phone,
  Rocket,
  Search,
  ShieldCheck,
  X,
  Zap,
} from 'lucide-react'
import { lasVegasPricingFaqs } from '@/data/industry-pricing-faqs'
import { trackBookStrategyCallIntent, trackPhoneClick } from '@/lib/analytics'

const STRATEGY_CALL_HREF = '/contact'

const offeringBlocks = [
  {
    icon: Search,
    title: 'Local SEO Structure',
    description:
      'Sites structured for "Las Vegas [service]" queries, Google Business Profile alignment, neighborhood-relevant keywords, and local search intent, not generic SEO advice.',
  },
  {
    icon: MapPinned,
    title: 'Neighborhood Relevance',
    description:
      'Content and IA that reflects where your customers actually are: Summerlin, Henderson, Green Valley, downtown, the Strip. Local context signals win local search.',
  },
  {
    icon: Phone,
    title: 'Conversion Paths for Local Buyers',
    description:
      'Local buyers behave differently than national traffic. Phone-first CTAs, map integration, hours prominence, direction links. The details that turn Las Vegas searchers into actual customers.',
  },
  {
    icon: Zap,
    title: 'Custom Next.js Performance',
    description:
      'Fast on mobile where 70%+ of local searches happen. Core Web Vitals tuned so your site outranks slower competitors.',
  },
  {
    icon: ShieldCheck,
    title: 'Sanity CMS You Own',
    description:
      'Your team updates content, prices, hours, and photos without waiting on a developer. No lock-in, no theme, no monthly software fees for basic edits.',
  },
  {
    icon: Navigation,
    title: 'Local Support After Launch',
    description:
      "We're in Las Vegas. Meetings in person when it helps. Response times that match your business hours, not an overseas timezone.",
  },
] as const

const outOfTownCompare = [
  "Doesn't know the local market",
  'Pitches templates dressed up as custom',
  'Slow response across timezones',
  'Charges $30k+ for template-tier work',
  'Disappears after launch',
  'No in-person availability',
] as const

const cheapLocalCompare = [
  'Elementor / template WordPress builds',
  'Same design as every other local site',
  'Slow loads that hurt local ranking',
  'Contact forms with no conversion tracking',
  'Ongoing plugin/theme lock-in',
  'Monthly fees for basic edits',
] as const

const vizantirCompare = [
  'Custom Next.js builds matched to your business',
  'Local SEO structure from day one',
  'Southern Nevada based. In-person when needed',
  'Performance tuned for Core Web Vitals',
  'Sanity CMS your team fully owns',
  'Fixed-scope pricing, no monthly software rent',
  'Direct access to the studio owner, not an account manager',
] as const

const vizantirProofPoints = [
  { value: 'Next.js', label: 'Custom builds' },
  { value: 'Local', label: 'Southern Nevada' },
  { value: '10+', label: 'Years experience' },
] as const

const realClients = [
  {
    name: 'Eloraé Nails',
    context: 'Nail studio · Las Vegas',
    description:
      'A clean single-page site for a private Las Vegas nail studio, moved off Wix onto a custom Next.js build. Built so the brand presents cleanly and the studio can manage updates without a fragile template stack.',
    href: '/case-studies/elorae-nails',
  },
  {
    name: 'Pink Salt Salon & Spa',
    context: 'Salon & spa · Las Vegas',
    description:
      'Migrated a luxury Las Vegas nail salon off a malware-prone WordPress site to a stable custom build. The goal was reliability and a site the team could trust after launch, not another plugin-heavy rebuild.',
    href: '/case-studies/pink-salt-salon',
  },
  {
    name: 'Meridian Row',
    context: 'Retail & dining development · Las Vegas',
    description:
      'A fast, clean site for a premium Las Vegas retail and dining development. Built to present the project clearly and attract serious tenants, not look like every other CRE brochure site in the valley.',
    href: '/case-studies/meridian-row',
  },
] as const

const methodologyItems = [
  {
    title: 'Local SEO structure',
    detail:
      'Southern Nevada geo signals, neighborhood keywords, and Google Business Profile alignment so local search intent can find the right business.',
  },
  {
    title: 'Mobile-first performance',
    detail:
      'Built for where 70%+ of Las Vegas local searches happen. Fast loads, clean Core Web Vitals, and conversion paths that work on a phone.',
  },
  {
    title: 'CMS ownership handoff',
    detail:
      'Sanity so your team can publish hours, menus, prices, and photos without waiting on a developer or paying monthly software rent for basic edits.',
  },
] as const

const processSteps = [
  {
    icon: Search,
    step: '01',
    title: 'Discovery',
    description:
      'Business audit, local competitor teardown, keyword mapping for Las Vegas and neighborhood-level queries, and an in-person kickoff when it makes sense.',
  },
  {
    icon: Palette,
    step: '02',
    title: 'Design',
    description:
      'Custom brand-directed design that reflects your business, not a template theme skin. Photography guidance when the project needs local visuals.',
  },
  {
    icon: Code2,
    step: '03',
    title: 'Build',
    description:
      'Next.js + Sanity: local SEO structure, mobile-first performance, conversion paths tuned for local intent, and schema markup.',
  },
  {
    icon: Rocket,
    step: '04',
    title: 'Launch',
    description:
      'Conversion tracking wired, Google Business Profile alignment, analytics baseline, and a clear handoff so your team can update content without calling a developer.',
  },
] as const

const faqs = [
  {
    question: 'How much does a Las Vegas web design project cost?',
    answer: lasVegasPricingFaqs.cost,
  },
  {
    question: 'Why hire a local studio vs a national agency or overseas freelancer?',
    answer: lasVegasPricingFaqs.localVsNational,
  },
  {
    question: 'How long does a Las Vegas web design project take?',
    answer: lasVegasPricingFaqs.timeline,
  },
  {
    question: 'What technology do you use, and do we own it?',
    answer: lasVegasPricingFaqs.stackAndOwnership,
  },
  {
    question: 'What happens after the site launches?',
    answer: lasVegasPricingFaqs.postLaunch,
  },
] as const

const verticalLinks = [
  { label: 'law firms', href: '/law-firm-web-design' },
  { label: 'hospitality venues', href: '/hospitality-web-design' },
  { label: 'commercial real estate firms', href: '/commercial-real-estate-web-design' },
] as const

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

export default function LasVegasWebDesignClient() {
  return (
    <main className="bg-background text-foreground transition-colors duration-500">
      {/* 1 — Hero */}
      <section className="relative flex min-h-[88svh] items-center justify-center overflow-hidden px-6 pb-20 pt-32 md:px-12 lg:px-20">
        {/* Atmosphere image slot — Las Vegas skyline, local district visual, or neutral local imagery to be added in follow-up */}
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
            <MapPin size={16} className="text-cobalt-accent" aria-hidden />
            <span className="text-sm text-muted-foreground">Las Vegas · Southern Nevada</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.08 }}
            className="mb-6 text-4xl font-black leading-[1.05] text-foreground sm:text-5xl md:text-6xl lg:text-7xl"
          >
            Las Vegas Web Design
            <br />
            <span className="text-cobalt-accent">
              Built for Las Vegas Businesses That Need to Win Local
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.16 }}
            className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl"
          >
            Most Las Vegas business owners choose between out-of-town agencies who don&apos;t know
            the market, cheap template shops, and custom local studios. Vizantir is the third
            option. A Southern Nevada studio that builds sites that actually work.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.24 }}
            className="flex flex-col items-center gap-4"
          >
            <Button
              size="lg"
              asChild
              className="group rounded-xl bg-cobalt-gradient px-8 py-4 text-base font-semibold text-white shadow-cobalt focus-visible:ring-2 focus-visible:ring-[#0070F3]/50 focus-visible:ring-offset-2"
            >
              <Link
                href={STRATEGY_CALL_HREF}
                onClick={() => trackBookStrategyCallIntent('hero')}
              >
                Book a Strategy Call
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <p className="text-sm text-muted-foreground">
              Vizantir Design Studio · Las Vegas · Serving Summerlin, Henderson, Paradise, and
              Southern Nevada
            </p>
          </motion.div>
        </div>
      </section>

      <SectionDivider />

      {/* 2 — The Problem */}
      <section className="px-6 py-20 md:px-12 lg:px-20" aria-labelledby="problem-heading">
        <div className="mx-auto max-w-3xl">
          <motion.div {...sectionReveal}>
            <Eyebrow>The Problem</Eyebrow>
            <h2
              id="problem-heading"
              className="mb-8 text-3xl font-bold text-foreground md:text-4xl lg:text-5xl"
            >
              Three options. Two of them waste money.
            </h2>
            <div className="space-y-5 text-lg leading-relaxed text-muted-foreground">
              <p>
                The choice most Las Vegas business owners face is between three bad options.
                Out-of-town agencies pitch big-city polish but don&apos;t know the difference
                between Summerlin and Henderson, don&apos;t understand how local search actually
                works for a Las Vegas business, and disappear the moment the project ships. Cheap
                local shops build template WordPress sites that look like every other business in
                the valley. Slow, generic, and impossible to update without another invoice.
              </p>
              <p>
                The third option is a local custom studio. Someone who understands the market,
                builds the site right the first time, and stays reachable after launch. That&apos;s
                what Vizantir does. Custom Next.js websites for Las Vegas businesses that need
                their site to actually work, not just exist.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      <SectionDivider />

      {/* 3 — What We Build */}
      <section className="px-6 py-20 md:px-12 lg:px-20" aria-labelledby="what-we-build-heading">
        <div className="mx-auto max-w-6xl">
          <motion.div {...sectionReveal} className="mb-14 text-center">
            <Eyebrow>What We Build</Eyebrow>
            <h2
              id="what-we-build-heading"
              className="mb-5 text-3xl font-bold text-foreground md:text-4xl lg:text-5xl"
            >
              What We Build for Las Vegas Businesses
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              Local search structure, conversion paths that match how valley buyers decide, and a
              stack your team can own after launch.
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-40px' }}
            className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
          >
            {offeringBlocks.map((block) => (
              <motion.div
                key={block.title}
                variants={itemVariants}
                className="card-interactive rounded-2xl border border-border bg-muted p-6 transition-colors duration-300 hover:border-cobalt-accent/30"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-black/[0.02]">
                  <block.icon size={24} className="text-cobalt-accent" aria-hidden />
                </div>
                <h3 className="mb-2 text-lg font-bold text-foreground">{block.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{block.description}</p>
              </motion.div>
            ))}
          </motion.div>

          <motion.p
            {...sectionReveal}
            className="mx-auto mt-12 max-w-2xl text-center text-base leading-relaxed text-muted-foreground"
          >
            We build for{' '}
            {verticalLinks.map((link, index) => (
              <span key={link.href}>
                <Link
                  href={link.href}
                  className="font-medium text-cobalt-accent underline-offset-2 transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0070F3]/40 focus-visible:ring-offset-2"
                >
                  {link.label}
                </Link>
                {index < verticalLinks.length - 2 ? ', ' : null}
                {index === verticalLinks.length - 2 ? ', and ' : null}
              </span>
            ))}
            , and more.
          </motion.p>
        </div>
      </section>

      <SectionDivider />

      {/* 4 — Differentiation (three-column geo comparison) */}
      <section className="px-6 py-20 md:px-12 lg:px-20" aria-labelledby="differentiation-heading">
        <div className="mx-auto max-w-6xl">
          <motion.div {...sectionReveal} className="mb-14 text-center">
            <Eyebrow>Differentiation</Eyebrow>
            <h2
              id="differentiation-heading"
              className="text-3xl font-bold text-foreground md:text-4xl lg:text-5xl"
            >
              Out-of-Town, Cheap Local, or Custom Local
            </h2>
          </motion.div>

          <div className="grid gap-6 lg:grid-cols-3">
            <motion.div
              {...sectionReveal}
              className="rounded-2xl border border-border bg-muted/60 p-8"
            >
              <h3 className="mb-6 text-xl font-bold text-foreground">Out-of-Town Agency</h3>
              <ul className="space-y-3">
                {outOfTownCompare.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <X
                      className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/70"
                      aria-hidden
                    />
                    <span className="text-sm leading-relaxed text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.5, delay: 0.04 }}
              className="rounded-2xl border border-border bg-muted/60 p-8"
            >
              <h3 className="mb-6 text-xl font-bold text-foreground">Cheap Local Shop</h3>
              <ul className="space-y-3">
                {cheapLocalCompare.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <X
                      className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/70"
                      aria-hidden
                    />
                    <span className="text-sm leading-relaxed text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.5, delay: 0.08 }}
              className="rounded-2xl border border-cobalt-accent/25 bg-muted p-8 shadow-[0_0_0_1px_rgba(0,112,243,0.06)]"
            >
              <h3 className="mb-6 text-xl font-bold text-foreground">Vizantir</h3>
              <ul className="mb-8 space-y-3">
                {vizantirCompare.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle2
                      className="mt-0.5 h-4 w-4 shrink-0 text-cobalt-accent"
                      aria-hidden
                    />
                    <span className="text-sm leading-relaxed text-foreground/90">{item}</span>
                  </li>
                ))}
              </ul>
              <div className="grid grid-cols-3 gap-4 border-t border-border pt-6">
                {vizantirProofPoints.map((stat) => (
                  <div key={stat.label} className="text-center">
                    <div className="text-xl font-bold text-cobalt-accent md:text-2xl">
                      {stat.value}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground md:text-sm">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <SectionDivider />

      {/* 5 — Proof (real clients + methodology) */}
      <section className="px-6 py-20 md:px-12 lg:px-20" aria-labelledby="proof-heading">
        <div className="mx-auto max-w-6xl">
          <motion.div {...sectionReveal} className="mb-14 text-center">
            <Eyebrow>Proof</Eyebrow>
            <h2
              id="proof-heading"
              className="mb-5 text-3xl font-bold text-foreground md:text-4xl lg:text-5xl"
            >
              Real Las Vegas Businesses We&apos;ve Built For
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              Named client work from Southern Nevada. Not concept mockups, not invented case
              studies.
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-40px' }}
            className="mb-16 grid gap-6 md:grid-cols-3"
          >
            {realClients.map((client) => (
              <motion.div
                key={client.name}
                variants={itemVariants}
                className="card-interactive flex flex-col rounded-2xl border border-border bg-muted p-6 transition-colors duration-300 hover:border-cobalt-accent/30"
              >
                <h3 className="mb-1 text-lg font-bold text-foreground">{client.name}</h3>
                <p className="mb-4 text-sm text-cobalt-accent">{client.context}</p>
                <p className="mb-5 flex-1 text-sm leading-relaxed text-muted-foreground">
                  {client.description}
                </p>
                <Link
                  href={client.href}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-cobalt-accent transition-colors hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0070F3]/40 focus-visible:ring-offset-2"
                >
                  View case study
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </motion.div>
            ))}
          </motion.div>

          <motion.div {...sectionReveal} className="mb-10 text-center">
            <h3 className="mb-3 text-2xl font-bold text-foreground md:text-3xl">
              How We Approach Local Work
            </h3>
            <p className="mx-auto max-w-2xl text-base text-muted-foreground">
              The same framework every Las Vegas engagement follows, regardless of vertical.
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-40px' }}
            className="mb-12 grid gap-6 md:grid-cols-3"
          >
            {methodologyItems.map((item) => (
              <motion.div
                key={item.title}
                variants={itemVariants}
                className="rounded-2xl border border-border bg-muted p-6"
              >
                <div className="mb-3 flex items-center gap-3">
                  <MapPin size={20} className="text-cobalt-accent" aria-hidden />
                  <h3 className="text-lg font-bold text-foreground">{item.title}</h3>
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">{item.detail}</p>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            {...sectionReveal}
            className="rounded-2xl border border-border bg-muted/80 px-6 py-8 text-center md:px-10"
          >
            <p className="text-base font-semibold tracking-wide text-foreground md:text-lg">
              Vizantir Design Studio · Las Vegas, NV 89139
            </p>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
              Custom Next.js websites for Las Vegas businesses across verticals. Salons,
              restaurants, law firms, CRE, and more. Built locally, structured for Southern Nevada
              search, owned by you after launch.
            </p>
          </motion.div>
        </div>
      </section>

      <SectionDivider />

      {/* 6 — Process */}
      <section className="px-6 py-20 md:px-12 lg:px-20" aria-labelledby="process-heading">
        <div className="mx-auto max-w-6xl">
          <motion.div {...sectionReveal} className="mb-14 text-center">
            <Eyebrow>Process</Eyebrow>
            <h2
              id="process-heading"
              className="mb-5 text-3xl font-bold text-foreground md:text-4xl lg:text-5xl"
            >
              What Happens When We Build Your Site
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              A clear sequence from Discovery through Launch, adapted for cross-vertical local work.
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-40px' }}
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
          >
            {processSteps.map((step) => (
              <motion.div
                key={step.title}
                variants={itemVariants}
                className="rounded-2xl border border-border bg-muted p-6"
              >
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-black/[0.02]">
                    <step.icon size={22} className="text-cobalt-accent" aria-hidden />
                  </div>
                  <span className="text-xs font-semibold tracking-wider text-cobalt-accent">
                    {step.step}
                  </span>
                </div>
                <h3 className="mb-2 text-lg font-bold text-foreground">{step.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{step.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <SectionDivider />

      {/* 7 — Pricing (retained — geo buyers price-shop; OfferCatalog is real SEO value) */}
      <section className="px-6 py-20 md:px-12 lg:px-20" aria-labelledby="pricing-heading">
        <div className="mx-auto max-w-6xl">
          <motion.div {...sectionReveal} className="mb-14 text-center">
            <Eyebrow>Pricing</Eyebrow>
            <h2
              id="pricing-heading"
              className="mb-5 text-3xl font-bold text-foreground md:text-4xl lg:text-5xl"
            >
              Fixed-Scope Projects, No Surprise Invoices
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              Clear project tiers so you know the investment before kickoff, not a vague estimate
              that climbs after the deposit clears.
            </p>
          </motion.div>

          <PricingCards />
        </div>
      </section>

      <SectionDivider />

      {/* 8 — FAQ */}
      <section className="px-6 py-20 md:px-12 lg:px-20" aria-labelledby="faq-heading">
        <div className="mx-auto max-w-4xl">
          <motion.div {...sectionReveal} className="mb-12 text-center">
            <Eyebrow>FAQ</Eyebrow>
            <h2
              id="faq-heading"
              className="text-3xl font-bold text-foreground md:text-4xl lg:text-5xl"
            >
              Las Vegas Web Design Questions
            </h2>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-40px' }}
            className="space-y-4"
          >
            {faqs.map((faq) => (
              <motion.div
                key={faq.question}
                variants={itemVariants}
                className="rounded-2xl border border-border bg-muted p-6"
              >
                <h3 className="mb-3 text-lg font-semibold text-foreground">{faq.question}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{faq.answer}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* 9 — Closing CTA band */}
      <section
        className="relative overflow-hidden bg-cobalt-primary px-6 py-24 md:px-12 lg:px-20"
        aria-labelledby="closing-cta-heading"
      >
        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <motion.div {...sectionReveal}>
            <h2
              id="closing-cta-heading"
              className="mb-5 text-3xl font-bold text-white md:text-4xl lg:text-5xl"
            >
              Ready to Build a Site That Actually Works in Las Vegas?
            </h2>
            <p className="mb-10 text-lg text-white/80">
              Strategy calls are 30 minutes, no pitch, just fit.
            </p>
            <Button
              size="lg"
              asChild
              className="group rounded-xl bg-white px-8 py-4 text-base font-semibold text-cobalt-primary shadow-lg hover:bg-white/95 focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-cobalt-primary"
            >
              <Link
                href={STRATEGY_CALL_HREF}
                onClick={() => trackBookStrategyCallIntent('closing_cta')}
              >
                Book a Strategy Call
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <p className="mt-6 text-sm text-white/70">
              Vizantir Design Studio · Las Vegas, NV 89139
              <span className="mx-2 text-white/40">·</span>
              <Link
                href="tel:+17022890758"
                onClick={trackPhoneClick}
                className="text-white/90 underline-offset-2 transition-colors hover:text-white hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-cobalt-primary"
              >
                (702) 289-0758
              </Link>
            </p>
          </motion.div>
        </div>
      </section>
    </main>
  )
}
