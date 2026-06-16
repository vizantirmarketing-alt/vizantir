'use client'

import { useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import ServicesHero from './ServicesHero'
import { trackCTAClick } from '@/lib/analytics'
import type { ServiceListItem } from '@/lib/sanity/types'
import { AccordionIndicator } from '@/components/ui/AccordionIndicator'
import { Button } from '@/components/ui/button'
import { Eyebrow } from '@/components/ui/Eyebrow'
import {
  Card,
  CardBody,
  CardCheckItem,
  CardCheckList,
  CardDescription,
  CardFooter,
  CardHeader,
  CardPrice,
  CardPriceBlock,
  CardTagline,
  CardTitle,
} from '@/components/ui/Card'
import {
  blogPricing,
  carePricing,
  chatbotPricing,
  projectPricing,
  CHATBOT_SETUP_FEE,
  formatCareClientPrice,
  type BlogTier,
  type CareTier,
  type ChatbotTier,
  type PricingTier,
} from '@/data/pricing'
import { cn } from '@/lib/utils'

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

function ProjectPricingCard({ tier }: { tier: PricingTier }) {
  return (
    <Card variant="glass" featured={tier.featured}>
      <CardHeader>
        <CardTitle>{tier.name}</CardTitle>
        <CardPrice>{tier.price}</CardPrice>
      </CardHeader>

      <CardDescription bordered>{tier.description}</CardDescription>

      <CardCheckList>
        {tier.includes.map((line) => (
          <CardCheckItem key={line}>{line}</CardCheckItem>
        ))}
      </CardCheckList>

      <CardFooter>
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
      </CardFooter>
    </Card>
  )
}

function CarePricingCard({ tier }: { tier: CareTier }) {
  const featured = tier.slug === 'growth-care'

  return (
    <Card variant="muted-30" featured={featured}>
      <CardHeader>
        <CardTitle>{tier.name}</CardTitle>
        <CardPrice>
          ${tier.priceMin.toLocaleString()}
          <span className="ml-0.5 text-[13px] font-medium text-muted-foreground">/mo</span>
        </CardPrice>
      </CardHeader>

      <CardTagline>{tier.tagline}</CardTagline>
      <CardDescription bordered>{tier.description}</CardDescription>

      <CardCheckList>
        {tier.includes.map((line) => (
          <CardCheckItem key={line}>{line}</CardCheckItem>
        ))}
      </CardCheckList>
    </Card>
  )
}

function BlogOptionCard({ tier }: { tier: BlogTier }) {
  const isOneTime = tier.slug === 'blog-single'

  return (
    <Card as="article" variant="muted-20" featured={tier.popular}>
      <CardBody>
        <CardTitle className="mb-1">{tier.name}</CardTitle>
        <CardDescription size="xs" className="mb-6">
          {getBlogCadenceLabel(tier)}
        </CardDescription>

        <CardPriceBlock
          compareAt={tier.price}
          price={formatCareClientPrice(tier.priceMin)}
          suffix={isOneTime ? 'one-time' : '/mo'}
        />

        <p className="mb-4 flex-1 text-[15px] leading-snug text-foreground/85">{tier.tagline}</p>
        <div className="text-xs font-semibold tracking-wide text-gold-accent">
          15% off for care clients
        </div>
      </CardBody>
    </Card>
  )
}

function ChatbotOptionCard({ tier }: { tier: ChatbotTier }) {
  return (
    <Card as="article" variant="muted-20" featured={tier.popular}>
      <CardBody>
        <CardTitle className="mb-1">{tier.name}</CardTitle>
        <CardDescription size="xs" className="mb-6">
          {tier.conversations}
        </CardDescription>

        <CardPriceBlock
          compareAt={`$${tier.priceMin.toLocaleString()}/month`}
          price={formatCareClientPrice(tier.priceMin)}
          suffix="/mo"
        />

        <p className="mb-4 flex-1 text-[15px] leading-snug text-foreground/85">{tier.tagline}</p>
        <div className="text-xs font-semibold tracking-wide text-gold-accent">
          15% off for care clients
        </div>
      </CardBody>
    </Card>
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

