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
  chatbotSharedIncludes,
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
  heading: 'Ongoing improvement after launch',
  body: [
    'Launch is the start of the relationship, not the end of the work. Website Care is the usual continuation of a Vizantir website project.',
    'The work is content changes, performance monitoring, analytics review, conversion improvements, search visibility, technical upkeep, new functionality, and strategic support — so the site keeps earning after it goes live.',
  ],
} as const

const LANDING_PAGE_PRICING = {
  eyebrow: 'Landing Pages',
  heading: 'Scoped conversion work',
  intro:
    'Campaign, offer, or traffic-source pages built inside the same website strategy — not a separate way to start working with Vizantir. Conversion System is for businesses spending $5,000 or more per month on paid traffic, or an offer that has to work across more than one audience.',
} as const

const CONTENT_GROWTH = {
  eyebrow: 'Search & Content Growth',
  heading: 'Strategy, implementation, and publishing into the site',
  intro:
    'Search opportunity research, service page expansion, location content where it applies, editorial content, internal linking, structured data, content updates, search visibility, and AI search visibility — published directly into the site. Plans below describe the engagement, not a quantity of posts for sale.',
} as const

const AI_EXPERIENCE = {
  eyebrow: 'AI Experience Integration',
  heading: 'Built into the existing website and its data',
  intro:
    'A knowledge assistant integrated with the client\'s site and approved business data — not a widget dropped on the page. Every plan includes the capabilities below. What differs is the depth of integration as the site gets busier.',
} as const

const CARE_CLIENT_DISCOUNT = 'Care plan clients get 15% off.'

const [essentialCare, websiteCare, growthCare] = carePricing
const careFooterText = `After launch, care retainers start at ${essentialCare.price} for ${essentialCare.name}, ${websiteCare.price} for ${websiteCare.name}, and ${growthCare.price} for ${growthCare.name}.`

function getContentPlanDetail(tier: BlogTier): string {
  if (tier.postsPerMonth === 0) return 'One-time plan'
  return `Monthly plan · typical publishing cadence of ${tier.postsPerMonth} pieces`
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
  detail,
  items = [],
  featured = false,
  badge,
  as,
  footer,
}: {
  title: string
  price: ReactNode
  tagline: string
  description?: string
  detail?: string
  items?: readonly string[]
  featured?: boolean
  badge?: string | false
  as?: 'div' | 'article'
  footer?: ReactNode
}) {
  return (
    <Card as={as} variant="muted-30" featured={featured} badge={badge}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardPrice>{price}</CardPrice>
      </CardHeader>

      <CardTagline>{tagline}</CardTagline>
      {description ? <CardDescription className="mb-4">{description}</CardDescription> : null}
      {detail ? (
        <CardDescription size="xs" className="mb-4">
          {detail}
        </CardDescription>
      ) : null}
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
      badge={false}
    />
  )
}

function LandingPagePricingCard({ tier }: { tier: LandingPageTier }) {
  return (
    <ServicePricingCard
      title={tier.name}
      price={`Starting at $${tier.priceMin.toLocaleString()}`}
      tagline={tier.tagline}
      description={tier.description}
      items={tier.includes}
    />
  )
}

function ContentGrowthCard({ tier }: { tier: BlogTier }) {
  return (
    <ServicePricingCard
      as="article"
      title={tier.name}
      price={tier.price}
      tagline={tier.tagline}
      detail={getContentPlanDetail(tier)}
      items={tier.includes}
    />
  )
}

function AiExperienceCard({ tier }: { tier: ChatbotTier }) {
  return (
    <ServicePricingCard
      as="article"
      title={tier.name}
      price={`$${tier.priceMin.toLocaleString()}/month`}
      tagline={tier.tagline}
      detail={tier.conversations}
      items={tier.includes}
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
      badge={tier.featured ? 'Recommended' : false}
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
    </div>
  )
}

function SectionHeading({
  eyebrow,
  heading,
  children,
  compact = false,
}: {
  eyebrow?: string
  heading: string
  children?: ReactNode
  compact?: boolean
}) {
  return (
    <div className={compact ? 'mb-8 text-center' : 'mb-12 text-center'}>
      {eyebrow ? (
        <span className="mb-4 inline-block text-xs font-semibold uppercase tracking-[0.25em] text-cobalt-accent">
          {eyebrow}
        </span>
      ) : null}
      <h2
        className={cn(
          'text-balance font-bold leading-tight tracking-tight text-foreground',
          compact ? 'text-2xl md:text-3xl' : 'text-3xl md:text-4xl',
        )}
      >
        {heading}
      </h2>
      {children}
    </div>
  )
}

function PricingSection({
  children,
  delay = 0,
  compact = false,
}: {
  children: ReactNode
  delay?: number
  compact?: boolean
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay }}
      className={compact ? 'px-6 py-12 md:px-12 lg:px-20' : 'px-6 py-20 md:px-12 lg:px-20'}
    >
      <div className="mx-auto max-w-5xl">{children}</div>
    </motion.section>
  )
}

function ProjectPricingSection() {
  return (
    <PricingSection>
      <SectionHeading eyebrow="Website Projects" heading="Fixed scope. Fixed price. One engagement.">
        <p className="mx-auto mt-3 max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground">
          Strategy, custom design, development, and launch priced as a complete website project. Growth is the
          engagement most established businesses need.
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
  )
}

function OngoingCapabilities() {
  return (
    <>
      <PricingSection compact>
        <SectionHeading eyebrow="After launch" heading="The engagement continues">
          <p className="mx-auto mt-3 max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground">
            Website Care, search and content, campaign pages, and AI experience work sit inside the same
            relationship — supporting the site after it launches, not competing with the website project.
          </p>
        </SectionHeading>
      </PricingSection>

      <PricingSection delay={0.05} compact>
        <SectionHeading compact eyebrow={CARE_REFRAME.eyebrow} heading={CARE_REFRAME.heading}>
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

      <PricingSection delay={0.1} compact>
        <SectionHeading compact eyebrow={CONTENT_GROWTH.eyebrow} heading={CONTENT_GROWTH.heading}>
          <p className="mx-auto mt-3 max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground">
            {CONTENT_GROWTH.intro}
          </p>
        </SectionHeading>
        <div className="grid items-stretch gap-6 lg:grid-cols-3">
          {blogPricing.map((tier) => (
            <ContentGrowthCard key={tier.slug} tier={tier} />
          ))}
        </div>
        <p className="mt-6 text-pretty text-base leading-relaxed text-muted-foreground">
          {CARE_CLIENT_DISCOUNT}
        </p>
      </PricingSection>

      <PricingSection delay={0.15} compact>
        <SectionHeading compact eyebrow={LANDING_PAGE_PRICING.eyebrow} heading={LANDING_PAGE_PRICING.heading}>
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

      <PricingSection delay={0.2} compact>
        <SectionHeading compact eyebrow={AI_EXPERIENCE.eyebrow} heading={AI_EXPERIENCE.heading}>
          <p className="mx-auto mt-3 max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground">
            {AI_EXPERIENCE.intro}
          </p>
        </SectionHeading>

        <CardCheckList className="mx-auto mb-10 max-w-2xl flex-none">
          {chatbotSharedIncludes.map((line) => (
            <CardCheckItem key={line}>{line}</CardCheckItem>
          ))}
        </CardCheckList>

        <div className="grid items-stretch gap-6 lg:grid-cols-3">
          {chatbotPricing.map((tier) => (
            <AiExperienceCard key={tier.slug} tier={tier} />
          ))}
        </div>
        <p className="mt-6 text-pretty text-base leading-relaxed text-muted-foreground">
          {CARE_CLIENT_DISCOUNT}
        </p>
        <p className="mt-3 text-sm text-muted-foreground">
          {CHATBOT_SETUP_FEE.display} one-time setup. Integrate the assistant into the existing site, connect
          approved business data, and tune conversation flows.
        </p>
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

      <ProjectPricingSection />

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
            <SectionHeading heading="What the engagement covers">
              <p className="mx-auto mt-3 max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground">
                Strategy, design, development, launch, and ongoing growth — one website project, not a menu of
                disconnected offerings.
              </p>
            </SectionHeading>
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

      <SectionDivider />

      <OngoingCapabilities />

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
              Start a conversation about a website project.
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
