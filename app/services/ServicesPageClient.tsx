'use client'

import { useState } from 'react'
import { ArrowRight, CheckCircle2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import ServicesHero from './ServicesHero'
import { trackCTAClick } from '@/lib/analytics'
import type { ServiceListItem } from '@/lib/sanity/types'
import { AccordionIndicator } from '@/components/ui/AccordionIndicator'
import { Button } from '@/components/ui/button'
import { Eyebrow } from '@/components/ui/Eyebrow'
import {
  blogPricing,
  carePricing,
  chatbotPricing,
  projectPricing,
  CHATBOT_SETUP_FEE,
  type BlogTier,
  type CareTier,
  type ChatbotTier,
  type PricingTier,
} from '@/data/pricing'
import { cn } from '@/lib/utils'

const CARE_CLIENT_DISCOUNT = 0.15

const CARE_REFRAME = {
  eyebrow: 'Website Care',
  heading: 'Care That Isn\u2019t Damage Control',
  body: [
    'Most maintenance plans charge you to patch a fragile platform \u2014 plugin updates, malware scans, whatever the CMS broke this week.',
    'A hand-coded Next.js site doesn\u2019t have those failure points. Vizantir care isn\u2019t about recovery. It keeps an already-fast, already-secure site continuously improving.',
  ],
} as const

const BLOG_ADDON = {
  eyebrow: 'Blog Writing Add-On',
  heading: 'Ongoing content, attached to your retainer',
  intro:
    'Add ongoing content to any care plan. Human-written posts, researched and published live \u2014 attached to your retainer, not a separate engagement.',
} as const

const CHATBOT_ADDON = {
  eyebrow: 'AI Chatbot',
  heading: 'Always-on answers, trained on your content',
  intro:
    'A custom chatbot trained on your site, services, and FAQs. Answers visitors instantly in your brand voice — no scripts, no canned responses.',
}

function getBlogCadenceLabel(tier: BlogTier): string {
  if (tier.slug === 'blog-single') return 'One-time engagement'
  if (tier.slug === 'blog-essentials') return '2 posts per month'
  if (tier.slug === 'blog-growth') return '4 posts per month'
  return tier.cadence
}

function formatCareClientPrice(priceMin: number): string {
  const discounted = Math.round(priceMin * (1 - CARE_CLIENT_DISCOUNT))
  return `$${discounted.toLocaleString()}`
}

function ProjectPricingCard({ tier }: { tier: PricingTier }) {
  const glassTransition = 'background 0.3s ease, border 0.3s ease, box-shadow 0.3s ease'

  const defaultGlass = {
    background: 'rgba(0, 0, 0, 0.02)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    border: '1px solid rgba(0, 0, 0, 0.08)',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
    transition: glassTransition,
  }

  const featuredGlass = {
    background: 'rgba(180, 132, 30, 0.04)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    border: '1px solid rgba(180, 132, 30, 0.15)',
    boxShadow: '0 4px 24px rgba(180, 132, 30, 0.08)',
    transition: glassTransition,
  }

  const baseGlass = tier.featured ? featuredGlass : defaultGlass

  return (
    <div
      className="relative flex h-full flex-col rounded-xl p-7 transition-all duration-300 md:p-8"
      style={baseGlass}
      onMouseEnter={(e) => {
        if (tier.featured) {
          e.currentTarget.style.background = 'rgba(180, 132, 30, 0.06)'
          e.currentTarget.style.border = '1px solid rgba(180, 132, 30, 0.25)'
          e.currentTarget.style.boxShadow = '0 4px 28px rgba(180, 132, 30, 0.12)'
        } else {
          e.currentTarget.style.background = 'rgba(0, 0, 0, 0.04)'
          e.currentTarget.style.border = '1px solid rgba(180, 132, 30, 0.2)'
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = baseGlass.background
        e.currentTarget.style.border = baseGlass.border
        if (tier.featured) {
          e.currentTarget.style.boxShadow = featuredGlass.boxShadow
        } else {
          e.currentTarget.style.boxShadow = defaultGlass.boxShadow
        }
      }}
    >
      {tier.featured ? (
        <span className="absolute -top-2 right-4 rounded-full bg-gold-gradient px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-[#1A1A1A]">
          Popular
        </span>
      ) : null}
      <div className="mb-2 flex items-baseline justify-between gap-4">
        <h3 className="text-xl font-bold tracking-tight text-foreground md:text-[22px]">{tier.name}</h3>
        <p className="whitespace-nowrap text-xl font-bold text-gold-accent md:text-[22px]">{tier.price}</p>
      </div>
      <p className="mb-6 border-b border-border pb-6 text-sm leading-relaxed text-muted-foreground">
        {tier.description}
      </p>
      <ul className="mb-7 flex-1 space-y-2.5">
        {tier.includes.map((line) => (
          <li key={line} className="flex items-start gap-2.5 text-sm text-foreground/80">
            <CheckCircle2 className="mt-[2px] h-4 w-4 flex-shrink-0 text-gold-accent" aria-hidden />
            {line}
          </li>
        ))}
      </ul>
      <Button
        asChild
        className={
          tier.featured
            ? 'group w-full rounded-xl bg-gold-gradient px-6 py-3 text-sm font-semibold text-[#1A1A1A] shadow-gold transition-all duration-300 hover:scale-[1.02]'
            : 'group w-full rounded-xl border border-border bg-transparent px-6 py-3 text-sm font-semibold text-foreground transition-all duration-300 hover:border-transparent hover:bg-gold-gradient hover:text-[#1A1A1A]'
        }
      >
        <Link href="/contact" onClick={() => trackCTAClick('get_started', 'services')}>
          Book a Strategy Call
          <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </Button>
    </div>
  )
}

function CarePricingCard({ tier }: { tier: CareTier }) {
  const featured = tier.slug === 'growth-care'

  return (
    <div
      className={cn(
        'relative flex h-full flex-col rounded-xl border p-7 transition-colors duration-300 md:p-8',
        featured
          ? 'border-gold-muted-border bg-gold-muted-subtle hover:border-gold-muted'
          : 'border-border bg-muted/30 hover:border-gold-muted-border',
      )}
    >
      {featured ? (
        <span className="absolute -top-2 right-4 rounded-full bg-gold-gradient px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-[#1A1A1A]">
          Popular
        </span>
      ) : null}
      <div className="mb-2 flex items-baseline justify-between gap-4">
        <h3 className="text-xl font-bold tracking-tight text-foreground md:text-[22px]">{tier.name}</h3>
        <p className="whitespace-nowrap text-xl font-bold text-gold-accent md:text-[22px]">
          ${tier.priceMin.toLocaleString()}
          <span className="ml-0.5 text-[13px] font-medium text-muted-foreground">/mo</span>
        </p>
      </div>
      <p className="mb-4 text-sm font-semibold text-gold-accent">{tier.tagline}</p>
      <p className="mb-6 border-b border-border pb-6 text-sm leading-relaxed text-muted-foreground">
        {tier.description}
      </p>
      <ul className="mb-7 flex-1 space-y-2.5">
        {tier.includes.map((line) => (
          <li key={line} className="flex items-start gap-2.5 text-sm text-foreground/80">
            <CheckCircle2 className="mt-[2px] h-4 w-4 flex-shrink-0 text-gold-accent" aria-hidden />
            {line}
          </li>
        ))}
      </ul>
    </div>
  )
}

function BlogOptionCard({ tier }: { tier: BlogTier }) {
  const isOneTime = tier.slug === 'blog-single'

  return (
    <article
      className={cn(
        'relative flex h-full flex-col rounded-xl border p-7 transition-colors duration-300 md:p-8',
        tier.popular
          ? 'border-gold-muted-border bg-gold-muted-subtle hover:border-gold-muted'
          : 'border-border bg-muted/20 hover:border-gold-muted-border',
      )}
    >
      {tier.popular ? (
        <span className="absolute -top-2 right-4 rounded-full bg-gold-gradient px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-[#1A1A1A]">
          Popular
        </span>
      ) : null}
      <div className="flex flex-1 flex-col">
        <h3 className="mb-1 text-xl font-bold tracking-tight text-foreground md:text-[22px]">
          {tier.name}
        </h3>
        <div className="mb-6 text-[13px] text-muted-foreground">{getBlogCadenceLabel(tier)}</div>

        <div className="mb-5 border-y border-border py-5">
          <div className="mb-1 text-sm text-muted-foreground line-through">{tier.price}</div>
          <div className="text-[28px] font-bold leading-none text-gold-accent">
            {formatCareClientPrice(tier.priceMin)}
            <span className="ml-1 text-sm font-medium text-muted-foreground">
              {isOneTime ? 'one-time' : '/mo'}
            </span>
          </div>
        </div>

        <p className="mb-4 flex-1 text-[15px] leading-snug text-foreground/85">{tier.tagline}</p>
        <div className="text-xs font-semibold tracking-wide text-gold-accent">15% off for care clients</div>
      </div>
    </article>
  )
}

function ChatbotOptionCard({ tier }: { tier: ChatbotTier }) {
  return (
    <article
      className={cn(
        'relative flex h-full flex-col rounded-xl border p-7 transition-colors duration-300 md:p-8',
        tier.popular
          ? 'border-gold-muted-border bg-gold-muted-subtle hover:border-gold-muted'
          : 'border-border bg-muted/20 hover:border-gold-muted-border',
      )}
    >
      {tier.popular ? (
        <span className="absolute -top-2 right-4 rounded-full bg-gold-gradient px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-[#1A1A1A]">
          Popular
        </span>
      ) : null}
      <div className="flex flex-1 flex-col">
        <h3 className="mb-1 text-xl font-bold tracking-tight text-foreground md:text-[22px]">
          {tier.name}
        </h3>
        <div className="mb-6 text-[13px] text-muted-foreground">{tier.conversations}</div>

        <div className="mb-5 border-y border-border py-5">
          <div className="text-[28px] font-bold leading-none text-gold-accent">
            ${tier.priceMin.toLocaleString()}
            <span className="ml-1 text-sm font-medium text-muted-foreground">/mo</span>
          </div>
        </div>

        <p className="mb-4 flex-1 text-[15px] leading-snug text-foreground/85">{tier.tagline}</p>
        <div className="text-xs font-semibold tracking-wide text-gold-accent">15% off for care clients</div>
      </div>
    </article>
  )
}

const WebIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
    <rect x="3" y="4" width="18" height="14" rx="2" />
    <path d="M3 9h18" />
    <circle cx="6" cy="6.5" r="0.5" fill="currentColor" />
    <circle cx="8.5" cy="6.5" r="0.5" fill="currentColor" />
    <circle cx="11" cy="6.5" r="0.5" fill="currentColor" />
    <path d="M7 21l5-3 5 3" />
  </svg>
)

const StrategyIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 8v8M8 12h8" />
  </svg>
)

const DesignIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
    <path d="M12 19l7-7 3 3-7 7-3-3z" />
    <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
    <path d="M2 2l7.586 7.586" />
    <circle cx="11" cy="11" r="2" />
  </svg>
)

const RefreshIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
    <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
    <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
    <path d="M16 21h5v-5" />
  </svg>
)

const CareIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
    <path d="M12 21C12 21 4 14.5 4 9.5C4 5.36 7.58 3 12 3s8 2.36 8 6.5c0 5-8 11.5-8 11.5z" />
    <path d="M12 3v6m-3-3h6" />
  </svg>
)

const CmsIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M9 3v18" />
    <path d="M14 8h4" />
    <path d="M14 12h4" />
    <path d="M14 16h4" />
  </svg>
)

const SERVICE_ICONS = [StrategyIcon, DesignIcon, WebIcon, RefreshIcon, CmsIcon, CareIcon]

function strategyCallLink() {
  return (
    <Link
      href="/contact"
      onClick={() => trackCTAClick('get_started', 'services')}
      className="inline-flex items-center gap-2 mt-4 font-semibold text-gold-accent hover:opacity-80 transition-opacity"
    >
      Book a Strategy Call
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
      </svg>
    </Link>
  )
}

function SanityServiceExpandedBody({ service }: { service: ServiceListItem }) {
  return (
    <div className="space-y-8">
      {service.description ? (
        <p className="leading-relaxed text-muted-foreground transition-colors duration-500">
          {service.description}
        </p>
      ) : null}
      {service.slug ? (
        <Link
          href={`/services/${service.slug}`}
          className="inline-flex items-center gap-2 font-semibold text-gold-accent hover:opacity-80 transition-opacity"
        >
          Learn more
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </Link>
      ) : null}
      {strategyCallLink()}
    </div>
  )
}

function StandalonePricingSection() {
  return (
    <>
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0 }}
        className="mt-20 md:mt-24"
      >
        <Eyebrow align="start">Project Pricing</Eyebrow>
        <h2 className="mb-3 text-3xl font-bold leading-tight tracking-tight text-foreground md:text-4xl">
          Fixed scope. Fixed price. No surprises.
        </h2>
        <p className="mb-12 max-w-2xl text-base leading-relaxed text-muted-foreground">
          Three tiers built around how complex your site needs to be — not how much we think we can
          charge.
        </p>
        <div className="grid gap-6 lg:grid-cols-3">
          {projectPricing.map((tier) => (
            <ProjectPricingCard key={tier.slug} tier={tier} />
          ))}
        </div>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="mt-16 border-t border-border pt-16 md:mt-20 md:pt-20"
      >
        <Eyebrow align="start">{CARE_REFRAME.eyebrow}</Eyebrow>
        <h2 className="mb-3 text-3xl font-bold leading-tight tracking-tight text-foreground md:text-4xl">
          {CARE_REFRAME.heading}
        </h2>
        <div className="mb-12 max-w-2xl space-y-3.5 text-base leading-relaxed text-muted-foreground">
          {CARE_REFRAME.body.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          {carePricing.map((tier) => (
            <CarePricingCard key={tier.slug} tier={tier} />
          ))}
        </div>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="mt-16 border-t border-border pt-16 md:mt-20 md:pt-20"
      >
        <Eyebrow align="start">{BLOG_ADDON.eyebrow}</Eyebrow>
        <h2 className="mb-3 text-3xl font-bold leading-tight tracking-tight text-foreground md:text-4xl">
          {BLOG_ADDON.heading}
        </h2>
        <p className="mb-12 max-w-2xl text-base leading-relaxed text-muted-foreground">
          {BLOG_ADDON.intro}
        </p>
        <div className="grid gap-6 lg:grid-cols-3">
          {blogPricing.map((tier) => (
            <BlogOptionCard key={tier.slug} tier={tier} />
          ))}
        </div>
        <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-between">
          <p className="text-sm text-muted-foreground">Available as add-on to any Care plan.</p>
          <Link
            href="/contact"
            onClick={() => trackCTAClick('get_started', 'services')}
            className="inline-flex items-center gap-2 font-semibold text-gold-accent transition-opacity hover:opacity-80"
          >
            Book a Strategy Call
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="mt-16 md:mt-20 border-t border-border pt-16 md:pt-20"
      >
        <Eyebrow align="start">{CHATBOT_ADDON.eyebrow}</Eyebrow>
        <h2 className="mb-3 text-3xl font-bold leading-tight tracking-tight text-foreground md:text-4xl">
          {CHATBOT_ADDON.heading}
        </h2>
        <p className="mb-12 max-w-2xl text-base leading-relaxed text-muted-foreground">
          {CHATBOT_ADDON.intro}
        </p>

        <div className="grid gap-6 lg:grid-cols-3">
          {chatbotPricing.map((tier) => (
            <ChatbotOptionCard key={tier.slug} tier={tier} />
          ))}
        </div>

        <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            {CHATBOT_SETUP_FEE.display} one-time setup. Available as add-on to any Care plan.
          </p>
          <Link
            href="/contact"
            onClick={() => trackCTAClick('get_started', 'services')}
            className="inline-flex items-center gap-2 text-sm font-semibold text-gold-accent transition-opacity hover:opacity-80"
          >
            Book a Strategy Call
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </motion.section>
    </>
  )
}

interface ServicesPageClientProps {
  services: ServiceListItem[]
}

export default function ServicesPageClient({ services }: ServicesPageClientProps) {
  const [openServiceId, setOpenServiceId] = useState<string | null>(() => services[0]?._id ?? null)

  const handleToggle = (id: string) => {
    setOpenServiceId((prev) => (prev === id ? null : id))
  }

  return (
    <div className="min-h-screen bg-background transition-colors duration-500">
      <ServicesHero />

      <section
        id="services"
        className="relative px-6 md:px-12 lg:px-20 py-20 md:py-24 bg-background transition-colors duration-500"
      >
        <div className="max-w-5xl mx-auto">
          <motion.div
            className="mb-16 text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground transition-colors duration-500">
              What We Build
            </h2>
          </motion.div>

          <div className="space-y-3">
            {services.map((service, index) => {
              const isOpen = openServiceId === service._id
              const Icon = SERVICE_ICONS[index % SERVICE_ICONS.length]

              return (
                <motion.div
                  key={service._id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30, delay: index * 0.05 }}
                >
                  <button
                    type="button"
                    onClick={() => handleToggle(service._id)}
                    className={cn(
                      'group w-full text-left rounded-2xl p-6 md:p-8 border transition-all duration-500 bg-muted hover:bg-muted/80',
                      isOpen ? 'border-gold-muted-border' : 'border-border',
                    )}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-5">
                        <div
                          className={cn(
                            'flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-500',
                            isOpen
                              ? 'bg-gold-gradient text-white shadow-gold'
                              : 'bg-background text-muted-foreground',
                          )}
                        >
                          <Icon />
                        </div>

                        <div>
                          <h3 className="text-lg md:text-xl font-semibold text-foreground transition-colors duration-500">
                            {service.title}
                          </h3>
                          {service.description ? (
                            <p className="mt-1 text-sm text-muted-foreground transition-colors duration-500">
                              {service.description}
                            </p>
                          ) : null}
                        </div>
                      </div>

                      <AccordionIndicator
                        isOpen={isOpen}
                        className="w-5 h-5 flex-shrink-0 text-gold-accent"
                      />
                    </div>

                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          key={`${service._id}-content`}
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                          className="overflow-hidden"
                        >
                          <div className="pt-8 mt-8 border-t border-border transition-colors duration-500">
                            <SanityServiceExpandedBody service={service} />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </button>
                </motion.div>
              )
            })}
          </div>

          <StandalonePricingSection />

          <motion.div
            className="mt-24 text-center"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
          >
            <p className="mb-6 text-muted-foreground transition-colors duration-500">
              Ready to start your project?
            </p>
            <Button
              size="lg"
              asChild
              className="rounded-xl px-8 py-4 text-base font-semibold bg-gold-gradient text-[#1A1A1A] shadow-gold transition-all duration-300 hover:scale-[1.02] group"
            >
              <Link href="/contact" onClick={() => trackCTAClick('get_started', 'services')}>
                Book a Strategy Call
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  )
}

