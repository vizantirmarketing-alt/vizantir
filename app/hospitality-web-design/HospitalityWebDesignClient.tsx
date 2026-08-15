'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Eyebrow } from '@/components/ui/Eyebrow'
import SectionDivider from '@/components/ui/SectionDivider'
import {
  ArrowRight,
  CalendarCheck,
  CheckCircle2,
  Code2,
  FilePenLine,
  Images,
  MapPin,
  Palette,
  Rocket,
  Search,
  Smartphone,
  UtensilsCrossed,
  X,
} from 'lucide-react'
import { hospitalityPricingFaqs } from '@/data/industry-pricing-faqs'
import { trackBookStrategyCallIntent, trackPhoneClick } from '@/lib/analytics'

const STRATEGY_CALL_HREF = '/contact'

const offeringBlocks = [
  {
    icon: CalendarCheck,
    title: 'Booking Integrations',
    description:
      'OpenTable, Resy, SevenRooms, direct booking, or hotel PMS, wired into the site so guests can book without hunting for a widget. Configurable to your venue’s operational setup.',
  },
  {
    icon: FilePenLine,
    title: 'Menu & Events CMS',
    description:
      'Sanity so your team updates seasonal menus, private events, and specials without a developer. Content changes take minutes, not another project ticket.',
  },
  {
    icon: Smartphone,
    title: 'Mobile-First Performance',
    description:
      'Core Web Vitals tuned for the phone screen where 70%+ of hospitality searches happen. Slow loads kill booking intent before the guest reads the menu.',
  },
  {
    icon: Images,
    title: 'Gallery Architecture',
    description:
      'Purpose-built for atmosphere shots, food photography, and venue visuals that load fast. Imagery that sells the experience without dragging performance.',
  },
  {
    icon: MapPin,
    title: 'Local SEO for “Near Me”',
    description:
      'Structured for high-intent queries like “sushi near me,” “boutique hotel las vegas,” and “rooftop bar strip,” not just brand vanity terms.',
  },
  {
    icon: Palette,
    title: 'Brand-Aligned Visual System',
    description:
      'Custom design that reflects the venue, not a hospitality theme skin. Guests should feel the atmosphere before they walk through the door.',
  },
] as const

const agencyCompare = [
  'WordPress + Elementor themes',
  'Menu PDFs that hide from search engines',
  'Slow loads that kill mobile booking intent',
  'Generic hospitality templates',
  'Booking widget as an afterthought',
  'Contact forms with no conversion tracking',
] as const

const vizantirCompare = [
  'Custom Next.js builds matched to your venue',
  'Structured menu content. Searchable and mobile-friendly',
  'Performance tuned for Core Web Vitals',
  'Brand-directed design. Not a hospitality theme skin',
  'Booking integration wired from day one',
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
    title: 'Local SEO structure',
    detail:
      '“Sushi near me,” “boutique hotel las vegas,” and similar high-intent booking queries, structured into the IA so guests searching to book can find you.',
  },
  {
    title: 'Mobile-first booking flow',
    detail:
      'The guest’s first tap should move toward a booking, not toward a hamburger menu. Paths, CTAs, and placement built for phone intent.',
  },
  {
    title: 'Menu & event CMS',
    detail:
      'Sanity so your team owns seasonal menus, specials, and private events, not the developer. Updates ship in minutes.',
  },
  {
    title: 'Gallery architecture',
    detail:
      'Atmosphere and food imagery loads fast and displays cleanly on any device. The visual pitch without the performance penalty.',
  },
] as const

const processSteps = [
  {
    icon: Search,
    step: '01',
    title: 'Discovery',
    description:
      'Venue audit, guest journey mapping, competitor teardown, and booking system decisions so the build matches how your guests actually book.',
  },
  {
    icon: Palette,
    step: '02',
    title: 'Design',
    description:
      'Brand-directed design that reflects the venue. Photography direction when the property needs visuals that match its atmosphere.',
  },
  {
    icon: Code2,
    step: '03',
    title: 'Build',
    description:
      'Next.js + Sanity: booking integration, menu CMS, gallery architecture, and schema markup ready for real traffic.',
  },
  {
    icon: Rocket,
    step: '04',
    title: 'Launch',
    description:
      'Conversion tracking wired, analytics baseline set, and a clear handoff so your team can update menus without calling a developer.',
  },
] as const

const faqs = [
  {
    question: 'How much does a restaurant website cost?',
    answer: hospitalityPricingFaqs.cost,
  },
  {
    question: 'How long does it take to build a restaurant website?',
    answer: hospitalityPricingFaqs.timeline,
  },
  {
    question: 'Which booking systems do you integrate with?',
    answer: hospitalityPricingFaqs.bookingIntegrations,
  },
  {
    question: 'Can our team update menus without a developer?',
    answer: hospitalityPricingFaqs.menuUpdates,
  },
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

export default function HospitalityWebDesignClient() {
  return (
    <main className="bg-background text-foreground transition-colors duration-500">
      {/* 1 — Hero */}
      <section className="relative flex min-h-[88vh] items-center justify-center overflow-hidden px-6 pb-20 pt-32 md:px-12 lg:px-20">
        {/* Atmosphere image slot — to be added in follow-up */}
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
            <UtensilsCrossed size={16} className="text-cobalt-accent" aria-hidden />
            <span className="text-sm text-muted-foreground">
              Restaurants · Hotels · Lounges
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.08 }}
            className="mb-6 text-4xl font-black leading-[1.05] text-foreground sm:text-5xl md:text-6xl lg:text-7xl"
          >
            Hospitality Web Design
            <br />
            <span className="text-cobalt-accent">That Fills Tables</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.16 }}
            className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl"
          >
            Too many hospitality buyers land on template sites that don&apos;t reflect the venue,
            don&apos;t rank locally, and don&apos;t convert to bookings.
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
              Vizantir Design Studio · Built for restaurants, hotels, and hospitality groups
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
              A generic site loses the guest before they ever book
            </h2>
            <div className="space-y-5 text-lg leading-relaxed text-muted-foreground">
              <p>
                Template restaurant and hotel sites all look alike. The same hero, the same menu
                PDF, the same booking widget hidden three clicks deep. Guests decide in seconds. A
                generic site loses them to a competitor with a stronger first impression.
              </p>
              <p>
                Bookings live on mobile. Most booking intent happens on a phone, and template
                WordPress sites weren&apos;t built for speed. Slow load kills conversion before the
                guest even reads the menu.
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
              Built for How Hospitality Guests Decide
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              Every piece of the site earns its place. Atmosphere, local findability, and a clear
              path to book.
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
        </div>
      </section>

      <SectionDivider />

      {/* 4 — Differentiation */}
      <section className="px-6 py-20 md:px-12 lg:px-20" aria-labelledby="differentiation-heading">
        <div className="mx-auto max-w-6xl">
          <motion.div {...sectionReveal} className="mb-14 text-center">
            <Eyebrow>Differentiation</Eyebrow>
            <h2
              id="differentiation-heading"
              className="text-3xl font-bold text-foreground md:text-4xl lg:text-5xl"
            >
              How Most Agencies Build vs. How Vizantir Builds
            </h2>
          </motion.div>

          <div className="grid gap-6 lg:grid-cols-2">
            <motion.div
              {...sectionReveal}
              className="rounded-2xl border border-border bg-muted/60 p-8"
            >
              <h3 className="mb-6 text-xl font-bold text-foreground">
                How most agencies build hospitality sites
              </h3>
              <ul className="space-y-3">
                {agencyCompare.map((item) => (
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
              <h3 className="mb-6 text-xl font-bold text-foreground">How Vizantir builds them</h3>
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
                    <div className="mt-1 text-xs text-muted-foreground md:text-sm">{stat.label}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <SectionDivider />

      {/* 5 — Proof (methodology + credential band) */}
      <section className="px-6 py-20 md:px-12 lg:px-20" aria-labelledby="proof-heading">
        <div className="mx-auto max-w-6xl">
          <motion.div {...sectionReveal} className="mb-14 text-center">
            <Eyebrow>Proof</Eyebrow>
            <h2
              id="proof-heading"
              className="mb-5 text-3xl font-bold text-foreground md:text-4xl lg:text-5xl"
            >
              Process-Driven Proof, Not Invented Case Studies
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              We do not pad this page with fabricated results. What we show is how the work is
              structured, the same methodology every hospitality engagement follows.
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-40px' }}
            className="mb-12 grid gap-6 md:grid-cols-2"
          >
            {methodologyItems.map((item) => (
              <motion.div
                key={item.title}
                variants={itemVariants}
                className="rounded-2xl border border-border bg-muted p-6"
              >
                <div className="mb-3 flex items-center gap-3">
                  <UtensilsCrossed size={20} className="text-cobalt-accent" aria-hidden />
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
              Vizantir Design Studio · Las Vegas
            </p>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
              Custom Next.js websites for hospitality venues. Restaurants, hotels, and lounges,
              with booking-forward builds and local SEO structure. From Southern Nevada and
              nationwide.
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
              A clear sequence from Discovery through Launch, so you know exactly what the engagement
              looks like.
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

      {/* 7 — FAQ */}
      <section className="px-6 py-20 md:px-12 lg:px-20" aria-labelledby="faq-heading">
        <div className="mx-auto max-w-4xl">
          <motion.div {...sectionReveal} className="mb-12 text-center">
            <Eyebrow>FAQ</Eyebrow>
            <h2
              id="faq-heading"
              className="text-3xl font-bold text-foreground md:text-4xl lg:text-5xl"
            >
              Hospitality Web Design Questions
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

      {/* 8 — Closing CTA band */}
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
              Ready to Build a Site That Fills Tables?
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
              Vizantir Design Studio · Las Vegas
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
