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
  FileText,
  GitBranch,
  MapPin,
  Palette,
  Rocket,
  Search,
  ShieldCheck,
  X,
  Zap,
} from 'lucide-react'
import { redesignPricingFaqItems } from '@/data/industry-pricing-faqs'
import { trackBookStrategyCallIntent, trackPhoneClick } from '@/lib/analytics'

const STRATEGY_CALL_HREF = '/contact'

const offeringBlocks = [
  {
    icon: ShieldCheck,
    title: 'SEO Preservation & Ranking Continuity',
    description:
      'Every URL mapped, every redirect audited, every schema element preserved so your Google rankings survive the redesign. Not an afterthought. The first thing we scope in discovery.',
  },
  {
    icon: FileText,
    title: 'Content Migration',
    description:
      "Your existing content library moves to the new site cleanly. We audit what's ranking, what's outdated, what needs a rewrite. No content gets accidentally lost in the shuffle.",
  },
  {
    icon: GitBranch,
    title: 'Redirect Mapping',
    description:
      "Every old URL maps to a new URL with a 301 redirect. Broken links, lost referral traffic, and orphaned pages don't happen when the mapping is done right.",
  },
  {
    icon: Zap,
    title: 'Custom Next.js Performance',
    description:
      'Faster than your current site by a wide margin. Core Web Vitals tuned, mobile-first, and structured so Google reads your content clearly.',
  },
  {
    icon: Code2,
    title: 'Sanity CMS Handoff',
    description:
      'Your team owns the content system after launch. No proprietary lock-in, no monthly software rent, no waiting on a developer for basic edits.',
  },
  {
    icon: Rocket,
    title: 'Staged Launch & Verification',
    description:
      'The new site goes live only after we\'ve verified redirects work, rankings are intact, and analytics are firing. No public downtime, no "we\'ll fix it after launch."',
  },
] as const

const cheapRedesignerCompare = [
  'Rebuilds everything from scratch',
  'No redirect mapping',
  'Loses years of Google rankings',
  'Content copy-pasted without SEO audit',
  'Slow load, no Core Web Vitals tuning',
  'Disappears the moment the new site launches',
] as const

const fullRebuildAgencyCompare = [
  'Treats SEO as a post-launch afterthought',
  'Full rebuild without migration planning',
  'Traffic drops 40–60% for months post-launch',
  'Charges $50k+ for a launch that damages the business',
  'Account managers, not the developer building the site',
  'Long timelines, monthly retainers to fix what they broke',
] as const

const vizantirCompare = [
  'SEO preservation scoped in discovery, not patched in later',
  'Full redirect map audited before launch',
  'Content migration with SEO audit built in',
  'Custom Next.js. Faster than the old site by design',
  'Staged launch, verified rankings before going public',
  'Direct access to the studio owner, not an account manager',
  'Fixed-scope pricing, no surprise invoices',
] as const

const vizantirProofPoints = [
  { value: 'Next.js', label: 'Custom builds' },
  { value: '0', label: 'Downtime at launch' },
  { value: '10+', label: 'Years experience' },
] as const

const realProjectWork = [
  {
    name: 'Pink Salt Salon & Spa',
    context: 'Luxury salon · Las Vegas · WordPress → Custom Next.js',
    description:
      'A luxury Las Vegas nail salon migrated off a malware-prone WordPress site to a stable custom Next.js build. Rebuilt so the brand presented cleanly, the team could trust the site after launch, and the studio could manage updates without a fragile plugin stack.',
    href: '/case-studies/pink-salt-salon',
  },
  {
    name: 'Eloraé Nails',
    context: 'Nail studio · Las Vegas · Custom Next.js build',
    description:
      'A private Las Vegas nail studio built on custom Next.js from the ground up. Structured so the brand presents cleanly, the studio can manage updates through Sanity CMS, and the site loads fast on mobile where most bookings happen.',
    href: '/case-studies/elorae-nails',
  },
] as const

const methodologyItems = [
  {
    title: 'SEO preservation audit',
    detail:
      'Existing URLs, ranking pages, redirect chains, schema, and canonical structure audited before design starts.',
  },
  {
    title: 'Content migration with SEO context',
    detail:
      'Every ranking page reviewed for what to keep, what to rewrite, what to consolidate. No content lost, no rankings orphaned.',
  },
  {
    title: 'Staged launch with verification',
    detail:
      'New site goes live only after redirects are verified, rankings checked, and analytics confirmed firing. No "we\'ll fix it after launch."',
  },
] as const

const processSteps = [
  {
    icon: Search,
    step: '01',
    title: 'Discovery',
    description:
      'Site audit, SEO baseline, redirect map planning, content inventory, ranking pages identified for preservation.',
  },
  {
    icon: Palette,
    step: '02',
    title: 'Design',
    description:
      'Custom brand-directed design that reflects the caliber of your business, not a template theme skin. Structured for the migration, not built in isolation from it.',
  },
  {
    icon: Code2,
    step: '03',
    title: 'Build',
    description:
      'Next.js + Sanity: content migration, redirect mapping, schema markup, performance tuning, staged environment for pre-launch verification.',
  },
  {
    icon: Rocket,
    step: '04',
    title: 'Launch',
    description:
      'Redirects verified, rankings checked, analytics baseline set. Site goes public only when the migration is confirmed clean. Handoff so your team can manage content without calling a developer.',
  },
] as const

const faqs = redesignPricingFaqItems

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

export default function WebsiteRedesignLasVegasClient() {
  return (
    <main className="bg-background text-foreground transition-colors duration-500">
      {/* 1 — Hero */}
      <section className="relative flex min-h-[88svh] items-center justify-center overflow-hidden px-6 pb-20 pt-32 md:px-12 lg:px-20">
        {/* Atmosphere image slot — before/after redesign visual or neutral local imagery to be added in follow-up */}
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
            <span className="text-sm text-muted-foreground">Website Redesign · Las Vegas</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.08 }}
            className="mb-6 text-4xl font-black leading-[1.05] text-foreground sm:text-5xl md:text-6xl lg:text-7xl"
          >
            Website Redesign in Las Vegas
            <br />
            <span className="text-cobalt-accent">
              Built to Protect Your Rankings, Not Break Them
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.16 }}
            className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl"
          >
            Most redesigns fail because agencies rebuild from scratch, break redirect chains, and
            let years of SEO history disappear. Vizantir migrates carefully so your rankings, your
            content, and your traffic survive the redesign.
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
              Vizantir Design Studio · Las Vegas · SEO-safe redesigns for established businesses
            </p>
          </motion.div>
        </div>
      </section>

      <SectionDivider />

      {/* 2 — The Problem (partner-choice framing) */}
      <section className="px-6 py-20 md:px-12 lg:px-20" aria-labelledby="problem-heading">
        <div className="mx-auto max-w-3xl">
          <motion.div {...sectionReveal}>
            <Eyebrow>The Problem</Eyebrow>
            <h2
              id="problem-heading"
              className="mb-8 text-3xl font-bold text-foreground md:text-4xl lg:text-5xl"
            >
              You&apos;ve decided to redesign. The risk is who you hire.
            </h2>
            <div className="space-y-5 text-lg leading-relaxed text-muted-foreground">
              <p>
                You&apos;ve decided to redesign. That&apos;s the easy part. The hard part is picking
                a partner who won&apos;t wreck what already works. Cheap redesigners rebuild
                everything from scratch, break your redirect chains, and let years of Google
                rankings evaporate the day the new site launches. Agencies pitch fresh design but
                treat SEO as an afterthought, until your traffic disappears six weeks in.
              </p>
              <p>
                A careful migration keeps your rankings, your content library, and your traffic
                intact while the site gets rebuilt around them. That&apos;s what Vizantir does.
                Custom Next.js redesigns with SEO preservation, redirect mapping, and content
                migration handled from day one, not patched in after launch.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      <SectionDivider />

      {/* 3 — What We Build for Redesign Projects */}
      <section className="px-6 py-20 md:px-12 lg:px-20" aria-labelledby="what-we-build-heading">
        <div className="mx-auto max-w-6xl">
          <motion.div {...sectionReveal} className="mb-14 text-center">
            <Eyebrow>What We Build</Eyebrow>
            <h2
              id="what-we-build-heading"
              className="mb-5 text-3xl font-bold text-foreground md:text-4xl lg:text-5xl"
            >
              What We Build for Redesign Projects
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              SEO preservation first, then content migration, redirects, performance, and a clean
              handoff so your rankings survive the rebuild.
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
            We redesign for{' '}
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

      {/* 4 — Differentiation (three redesign risk profiles) */}
      <section className="px-6 py-20 md:px-12 lg:px-20" aria-labelledby="differentiation-heading">
        <div className="mx-auto max-w-6xl">
          <motion.div {...sectionReveal} className="mb-14 text-center">
            <Eyebrow>Differentiation</Eyebrow>
            <h2
              id="differentiation-heading"
              className="text-3xl font-bold text-foreground md:text-4xl lg:text-5xl"
            >
              Cheap Redesigner, Full-Rebuild Agency, or SEO-Safe Studio
            </h2>
          </motion.div>

          <div className="grid gap-6 lg:grid-cols-3">
            <motion.div
              {...sectionReveal}
              className="rounded-2xl border border-border bg-muted/60 p-8"
            >
              <h3 className="mb-6 text-xl font-bold text-foreground">Cheap Redesigner</h3>
              <ul className="space-y-3">
                {cheapRedesignerCompare.map((item) => (
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
              <h3 className="mb-6 text-xl font-bold text-foreground">Full-Rebuild Agency</h3>
              <ul className="space-y-3">
                {fullRebuildAgencyCompare.map((item) => (
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

      {/* 5 — Proof (real migrations + methodology) */}
      <section className="px-6 py-20 md:px-12 lg:px-20" aria-labelledby="proof-heading">
        <div className="mx-auto max-w-6xl">
          <motion.div {...sectionReveal} className="mb-14 text-center">
            <Eyebrow>Proof</Eyebrow>
            <h2
              id="proof-heading"
              className="mb-5 text-3xl font-bold text-foreground md:text-4xl lg:text-5xl"
            >
              Real Las Vegas Businesses We&apos;ve Built and Migrated
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              Named work from Southern Nevada. Not concept mockups, not invented case studies.
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-40px' }}
            className="mb-16 grid gap-6 md:grid-cols-2"
          >
            {realProjectWork.map((client) => (
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
              How We Approach Redesigns
            </h3>
            <p className="mx-auto max-w-2xl text-base text-muted-foreground">
              The same migration framework every redesign follows. SEO preservation before design
              starts.
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
                  <ShieldCheck size={20} className="text-cobalt-accent" aria-hidden />
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
              Custom Next.js redesigns for established Las Vegas businesses. WordPress migrations,
              Wix migrations, Squarespace and Webflow projects from Southern Nevada and
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
              What Happens When We Redesign Your Site
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              A clear sequence from Discovery through Launch, scoped around SEO preservation and
              migration verification.
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

      {/* 7 — Pricing (retained — purchase-intent buyers price-shop; OfferCatalog is real SEO value) */}
      <section className="px-6 py-20 md:px-12 lg:px-20" aria-labelledby="pricing-heading">
        <div className="mx-auto max-w-6xl">
          <motion.div {...sectionReveal} className="mb-14 text-center">
            <Eyebrow>Pricing</Eyebrow>
            <h2
              id="pricing-heading"
              className="mb-5 text-3xl font-bold text-foreground md:text-4xl lg:text-5xl"
            >
              Redesign Project Tiers
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
              Website Redesign Questions
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
              Ready to Redesign Without Breaking What Already Works?
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
