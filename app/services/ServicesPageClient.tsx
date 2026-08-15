'use client'

import { useState, type ReactNode } from 'react'
import { ArrowRight, FileText } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import ServicesHero from './ServicesHero'
import { trackCTAClick } from '@/lib/analytics'
import type { ServiceListItem } from '@/lib/sanity/types'
import { AccordionIndicator } from '@/components/ui/AccordionIndicator'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardCheckItem,
  CardCheckList,
  CardDescription,
  CardDivider,
  CardHeader,
  CardPrice,
  CardTagline,
  CardTitle,
} from '@/components/ui/Card'
import {
  blogPricing,
  carePricing,
  chatbotPricing,
  CHATBOT_SETUP_FEE,
  landingPagePricing,
  projectPricing,
  type BlogTier,
  type CareTier,
  type ChatbotTier,
  type LandingPageTier,
  type PricingTier,
} from '@/data/pricing'
import { cn } from '@/lib/utils'

const CARE_REFRAME = {
  eyebrow: 'Website Care',
  heading: 'Care That Isn\u2019t Damage Control',
  body: [
    'Most maintenance plans charge you to patch a fragile platform. Plugin updates, malware scans, whatever the CMS broke this week.',
    'A hand-coded Next.js site doesn\u2019t have those failure points. Vizantir care isn\u2019t about recovery. It keeps an already-fast, already-secure site continuously improving.',
  ],
} as const

const LANDING_PAGE_PRICING = {
  eyebrow: 'Landing Pages',
  heading: 'Pages built to convert traffic',
  intro:
    'Single-purpose pages for campaigns, offers, and paid traffic. Custom-designed, tracked, and ready to plug into your ads.',
} as const

const BLOG_ADDON = {
  eyebrow: 'Blog Writing Add-On',
  heading: 'Ongoing content, attached to your retainer',
  intro:
    'Add ongoing content to any care plan. Human-written posts, researched and published live. Attached to your retainer, not a separate engagement.',
} as const

const CHATBOT_ADDON = {
  eyebrow: 'AI Chatbot',
  heading: 'Always-on answers, trained on your content',
  intro:
    'A custom chatbot trained on your site, services, and FAQs. Answers visitors instantly in your brand voice. No scripts, no canned responses.',
}

const CARE_CLIENT_DISCOUNT = 'Care plan clients get 15% off.'

const [essentialCare, websiteCare, growthCare] = carePricing
const careFooterText = `After launch, care retainers start at ${essentialCare.price} for ${essentialCare.name}, ${websiteCare.price} for ${websiteCare.name}, and ${growthCare.price} for ${growthCare.name}.`

function getBlogCadenceLabel(tier: BlogTier): string {
  if (tier.postsPerMonth === 0) return 'One-time engagement'
  return `${tier.postsPerMonth} posts per month`
}

function SectionDivider() {
  return (
    <div
      className="h-px w-full"
      style={{ background: 'linear-gradient(90deg, transparent, rgba(0, 112, 243, 0.3), transparent)' }}
      aria-hidden
    />
  )
}

function ServicePricingCard({
  title,
  price,
  tagline,
  description,
  items = [],
  featured = false,
  as,
  footer,
}: {
  title: string
  price: ReactNode
  tagline: string
  description?: string
  items?: readonly string[]
  featured?: boolean
  as?: 'div' | 'article'
  footer?: ReactNode
}) {
  return (
    <Card as={as} variant="muted-30" featured={featured}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardPrice>{price}</CardPrice>
      </CardHeader>

      <CardTagline>{tagline}</CardTagline>
      {description ? <CardDescription className="mb-4">{description}</CardDescription> : null}
      <CardDivider />

      {items.length > 0 ? (
        <CardCheckList>
          {items.map((line) => (
            <CardCheckItem key={line}>{line}</CardCheckItem>
          ))}
        </CardCheckList>
      ) : null}

      {footer}
    </Card>
  )
}

function CarePricingCard({ tier }: { tier: CareTier }) {
  return (
    <ServicePricingCard
      title={tier.name}
      price={
        <>
          ${tier.priceMin.toLocaleString()}
          <span className="ml-0.5 text-[13px] font-medium text-muted-foreground">/mo</span>
        </>
      }
      tagline={tier.tagline}
      description={tier.description}
      items={tier.includes}
      featured={Boolean(tier.featured)}
    />
  )
}

function LandingPagePricingCard({ tier }: { tier: LandingPageTier }) {
  return (
    <ServicePricingCard
      title={tier.name}
      price={tier.price}
      tagline={tier.tagline}
      description={tier.description}
      items={tier.includes}
      featured={Boolean(tier.featured)}
    />
  )
}

function BlogOptionCard({ tier }: { tier: BlogTier }) {
  return (
    <ServicePricingCard
      as="article"
      title={tier.name}
      price={tier.price}
      tagline={tier.tagline}
      description={getBlogCadenceLabel(tier)}
      items={tier.includes}
      featured={Boolean(tier.popular)}
    />
  )
}

function ChatbotOptionCard({ tier }: { tier: ChatbotTier }) {
  return (
    <ServicePricingCard
      as="article"
      title={tier.name}
      price={`$${tier.priceMin.toLocaleString()}/month`}
      tagline={tier.tagline}
      items={[tier.conversations]}
      featured={Boolean(tier.popular)}
    />
  )
}

function ProjectPricingCard({ tier }: { tier: PricingTier }) {
  return (
    <ServicePricingCard
      title={tier.name}
      price={tier.price}
      tagline={tier.timeline}
      description={tier.description}
      items={tier.includes}
      featured={tier.featured}
      footer={
        <Button
          asChild
          variant={tier.featured ? 'default' : 'cobaltOutline'}
          className={
            tier.featured
              ? 'group w-full rounded-xl bg-cobalt-gradient px-6 py-3 text-sm font-semibold text-white shadow-cobalt'
              : 'group w-full rounded-xl px-6 py-3 text-sm font-semibold text-foreground transition-all duration-300 hover:border-transparent hover:[background:var(--cobalt-gradient)] hover:text-white hover:shadow-cobalt'
          }
        >
          <Link href="/contact" onClick={() => trackCTAClick('get_started', 'services')}>
            Book a Strategy Call
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </Button>
      }
    />
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

const LandingIcon = () => <FileText className="h-6 w-6" strokeWidth={1.5} />

const SERVICE_ICON_BY_SLUG: Record<string, typeof StrategyIcon> = {
  'website-strategy': StrategyIcon,
  'web-design': DesignIcon,
  'web-development': WebIcon,
  'landing-pages': LandingIcon,
  'website-refreshes': RefreshIcon,
  'cms-integrations': CmsIcon,
  'website-care': CareIcon,
}

const SERVICE_ICON_FALLBACK = [
  StrategyIcon,
  DesignIcon,
  WebIcon,
  LandingIcon,
  RefreshIcon,
  CmsIcon,
  CareIcon,
]

function iconForService(slug: string, index: number) {
  return SERVICE_ICON_BY_SLUG[slug] ?? SERVICE_ICON_FALLBACK[index % SERVICE_ICON_FALLBACK.length]
}

function strategyCallLink() {
  return (
    <Link
      href="/contact"
      onClick={() => trackCTAClick('get_started', 'services')}
      className="link-cobalt inline-flex items-center gap-2 font-semibold text-cobalt-accent"
    >
      Book a Strategy Call
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
      </svg>
    </Link>
  )
}

function SanityServiceExpandedBody({ service }: { service: ServiceListItem }) {
  const included = service.included?.filter(Boolean) ?? []

  return (
    <div className="space-y-5">
      {included.length > 0 ? (
        <ul className="m-0 list-none space-y-2 p-0">
          {included.map((item) => (
            <li key={item} className="text-pretty text-sm text-muted-foreground">
              {item}
            </li>
          ))}
        </ul>
      ) : null}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-6">
        {service.slug ? (
          <Link
            href={`/services/${service.slug}`}
            className="link-cobalt inline-flex items-center gap-2 font-semibold text-cobalt-accent"
          >
            Learn more
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        ) : null}
        {strategyCallLink()}
      </div>
    </div>
  )
}

function SectionHeading({
  eyebrow,
  heading,
  children,
}: {
  eyebrow?: string
  heading: string
  children?: ReactNode
}) {
  return (
    <div className="mb-12 text-center">
      {eyebrow ? (
        <span className="mb-4 inline-block text-xs font-semibold uppercase tracking-[0.25em] text-cobalt-accent">
          {eyebrow}
        </span>
      ) : null}
      <h2 className="text-balance text-3xl font-bold leading-tight tracking-tight text-foreground md:text-4xl">
        {heading}
      </h2>
      {children}
    </div>
  )
}

function PricingSection({
  children,
  delay = 0,
}: {
  children: ReactNode
  delay?: number
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay }}
      className="px-6 py-20 md:px-12 lg:px-20"
    >
      <div className="mx-auto max-w-5xl">{children}</div>
    </motion.section>
  )
}

function StandalonePricingSection() {
  return (
    <>
      <SectionDivider />
      <PricingSection delay={0}>
        <SectionHeading eyebrow="Project Pricing" heading="Fixed scope. Fixed price. No surprises.">
          <p className="mx-auto mt-3 max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground">
            Three tiers built around how complex your site needs to be, not how much we think we can charge.
          </p>
        </SectionHeading>
        <div className="grid items-stretch gap-6 md:grid-cols-3">
          {projectPricing.map((tier) => (
            <ProjectPricingCard key={tier.slug} tier={tier} />
          ))}
        </div>
        <p className="mx-auto mt-10 max-w-2xl text-center text-sm text-muted-foreground">
          {careFooterText}
        </p>
      </PricingSection>

      <SectionDivider />
      <PricingSection delay={0.1}>
        <SectionHeading eyebrow={CARE_REFRAME.eyebrow} heading={CARE_REFRAME.heading}>
          <div className="mx-auto mt-3 max-w-2xl space-y-3.5 text-pretty text-base leading-relaxed text-muted-foreground">
            {CARE_REFRAME.body.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </SectionHeading>
        <div className="grid items-stretch gap-6 lg:grid-cols-3">
          {carePricing.map((tier) => (
            <CarePricingCard key={tier.slug} tier={tier} />
          ))}
        </div>
      </PricingSection>

      <SectionDivider />
      <PricingSection delay={0.15}>
        <SectionHeading eyebrow={LANDING_PAGE_PRICING.eyebrow} heading={LANDING_PAGE_PRICING.heading}>
          <p className="mx-auto mt-3 max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground">
            {LANDING_PAGE_PRICING.intro}
          </p>
        </SectionHeading>
        <div className="grid items-stretch gap-6 lg:grid-cols-2">
          {landingPagePricing.map((tier) => (
            <LandingPagePricingCard key={tier.slug} tier={tier} />
          ))}
        </div>
      </PricingSection>

      <SectionDivider />
      <PricingSection delay={0.2}>
        <SectionHeading eyebrow={BLOG_ADDON.eyebrow} heading={BLOG_ADDON.heading}>
          <p className="mx-auto mt-3 max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground">
            {BLOG_ADDON.intro}
          </p>
        </SectionHeading>
        <div className="grid items-stretch gap-6 lg:grid-cols-3">
          {blogPricing.map((tier) => (
            <BlogOptionCard key={tier.slug} tier={tier} />
          ))}
        </div>
        <p className="mt-6 text-pretty text-base leading-relaxed text-muted-foreground">
          {CARE_CLIENT_DISCOUNT}
        </p>
        <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-between">
          <p className="text-sm text-muted-foreground">Available as add-on to any Care plan.</p>
          <Link
            href="/contact"
            onClick={() => trackCTAClick('get_started', 'services')}
            className="link-cobalt inline-flex items-center gap-2 font-semibold text-cobalt-accent"
          >
            Book a Strategy Call
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </PricingSection>

      <SectionDivider />
      <PricingSection delay={0.3}>
        <SectionHeading eyebrow={CHATBOT_ADDON.eyebrow} heading={CHATBOT_ADDON.heading}>
          <p className="mx-auto mt-3 max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground">
            {CHATBOT_ADDON.intro}
          </p>
        </SectionHeading>

        <div className="grid items-stretch gap-6 lg:grid-cols-3">
          {chatbotPricing.map((tier) => (
            <ChatbotOptionCard key={tier.slug} tier={tier} />
          ))}
        </div>
        <p className="mt-6 text-pretty text-base leading-relaxed text-muted-foreground">
          {CARE_CLIENT_DISCOUNT}
        </p>

        <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            {CHATBOT_SETUP_FEE.display} one-time setup. Available as add-on to any Care plan.
          </p>
          <Link
            href="/contact"
            onClick={() => trackCTAClick('get_started', 'services')}
            className="link-cobalt inline-flex items-center gap-2 text-sm font-semibold text-cobalt-accent"
          >
            Book a Strategy Call
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </PricingSection>
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

      <SectionDivider />

      <section
        id="services"
        className="relative bg-background px-6 py-20 transition-colors duration-500 md:px-12 lg:px-20"
      >
        <div className="mx-auto max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <SectionHeading heading="Services" />
          </motion.div>

          <div className="divide-y divide-border">
            {services.map((service, index) => {
              const isOpen = openServiceId === service._id
              const Icon = iconForService(service.slug, index)

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
                    className="group w-full py-6 text-left transition-colors duration-500 md:py-7"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div
                          className={cn(
                            'mt-0.5 flex-shrink-0 transition-colors duration-500',
                            isOpen ? 'text-cobalt-accent' : 'text-muted-foreground',
                          )}
                        >
                          <Icon />
                        </div>

                        <div>
                          <h3 className="text-balance text-lg font-semibold text-foreground transition-colors duration-500 md:text-xl">
                            {service.title}
                          </h3>
                          {service.description ? (
                            <p className="mt-1 text-pretty text-sm text-muted-foreground transition-colors duration-500">
                              {service.description}
                            </p>
                          ) : null}
                        </div>
                      </div>

                      <AccordionIndicator
                        isOpen={isOpen}
                        className="w-5 h-5 flex-shrink-0 text-cobalt-accent"
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
                          <div className="mt-6 pt-1 transition-colors duration-500">
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
        </div>
      </section>

      <StandalonePricingSection />

      <SectionDivider />

      <section className="px-6 py-20 md:px-12 md:py-24 lg:px-20">
        <div className="mx-auto max-w-5xl text-center">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
          >
            <p className="mb-6 text-muted-foreground transition-colors duration-500">
              Ready to start your project?
            </p>
            <Link
              href="/contact"
              onClick={() => trackCTAClick('get_started', 'services')}
              className="bg-cobalt-gradient inline-flex items-center justify-center rounded-xl px-8 py-4 text-base font-semibold text-white shadow-cobalt focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0070F3]/40 focus-visible:ring-offset-2"
            >
              Book a Strategy Call
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  )
}

