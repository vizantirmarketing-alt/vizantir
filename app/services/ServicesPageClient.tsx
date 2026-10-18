'use client'

import { useState, type ReactNode } from 'react'
import { ArrowRight, FileText } from 'lucide-react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import ServicesHero from './ServicesHero'
import { trackCTAClick } from '@/lib/analytics'
import type { ServiceListItem } from '@/lib/sanity/types'
import { AccordionIndicator } from '@/components/ui/AccordionIndicator'
import { Button } from '@/components/ui/button'
import {
  careBenefitTooltips,
  carePricing,
  chatbotPricing,
  chatbotSharedIncludes,
  CHATBOT_SETUP_FEE,
  CHATBOT_USAGE_FROM,
  landingPagePricing,
  projectPricing,
  publicBlogPricing,
  type BlogTier,
  type ChatbotTier,
} from '@/data/pricing'
import { serviceHref } from '@/lib/service-href'
import { cn } from '@/lib/utils'

const CARE_REFRAME = {
  heading: 'Ongoing improvement after launch',
  body: [
    'Launch is where most projects end. Some clients want help after that, so we offer it. Website Care is optional. Most clients continue with it, but a finished site is yours either way.',
    'The work is content changes, performance monitoring, analytics review, conversion improvements, search visibility, technical upkeep, new functionality, and strategic support — so the site keeps earning after it goes live.',
  ],
} as const

const LANDING_PAGE_PRICING = {
  heading: 'Scoped conversion work',
  intro:
    'Landing pages for a campaign, offer, or traffic source, built inside the same website strategy — not a separate way to start working with Vizantir. Conversion System is for businesses spending $5,000 or more per month on paid traffic, or an offer that has to work across more than one audience.',
} as const

const CONTENT_GROWTH = {
  heading: 'Strategy, implementation, and publishing into the site',
  intro:
    'Search and content growth work: opportunity research, service page expansion, location content where it applies, editorial content, internal linking, structured data, content updates, search visibility, and AI search visibility — published directly into the site. Plans below describe the engagement, not a quantity of posts for sale.',
} as const

const AI_EXPERIENCE = {
  heading: 'Built into the existing website and its data',
  intro:
    'Custom AI experiences built into the website and connected to approved business content, data, and workflows — not a widget dropped on the page. Integration scope depends on the site, data sources, CRM requirements, lead flow, and use case.',
} as const

const AFTER_LAUNCH_TRANSITION =
  'After launch, optional work is available: Website Care, search and content growth, campaign work, and AI experience integration.'

const CONTENT_GROWTH_AVAILABILITY = 'Available for Vizantir website and care clients.'

const CLOSING_CTA = {
  heading: 'The strategy call starts with the business.',
  body: 'Describe where the business is going, what the current site is failing to do, and what needs to change. That is the material the conversation needs.',
} as const

const SMALLER_PROJECTS = {
  heading: 'Something smaller?',
  body: "Some projects are simpler. A two or three page site, a single landing page, a clean launch without a CMS behind it. If that's closer to what you need, tell us what you're working on and we'll price it around what the project actually needs.",
  cta: 'Tell us about the project',
} as const

const CARE_CLIENT_DISCOUNT = 'Care plan clients get 15% off.'

const [essentialCare, websiteCare, growthCare] = carePricing
const careFooterText = `After launch, an optional care retainer is available, starting at ${essentialCare.price} for ${essentialCare.name}, ${websiteCare.price} for ${websiteCare.name}, and ${growthCare.price} for ${growthCare.name}.`

function getContentPlanDetail(tier: BlogTier): string {
  if (tier.postsPerMonth === 0) return 'One-time plan'
  return `Monthly plan · typical publishing cadence of ${tier.postsPerMonth} pieces`
}

function SectionDivider() {
  return (
    <div
      className="h-px w-full"
      style={{
        background: 'linear-gradient(90deg, transparent, rgba(0, 112, 243, 0.3), transparent)',
      }}
      aria-hidden
    />
  )
}

const CARE_LEGEND_GROUPS = carePricing
  .map((tier) => ({
    plan: tier.name,
    entries: tier.includes.flatMap((line) => {
      const explanation = careBenefitTooltips[line]
      return explanation ? [{ term: line, explanation }] : []
    }),
  }))
  .filter((group) => group.entries.length > 0)

function PricingRow({
  name,
  price,
  priceNote,
  suffix,
  muted,
  description,
  items,
  featured = false,
  as: Wrapper = 'div',
}: {
  name: string
  price: string
  priceNote?: string
  suffix?: string
  muted?: string
  description: string
  items: readonly string[]
  featured?: boolean
  as?: 'div' | 'article'
}) {
  return (
    <Wrapper>
      <SectionDivider />
      <div className="grid gap-6 py-12 md:grid-cols-3 md:gap-12 md:py-16">
        <div>
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h3 className="text-balance text-xl font-bold text-foreground">{name}</h3>
            {featured ? <span className="text-sm font-medium text-muted-foreground">Recommended</span> : null}
          </div>
          {priceNote ? <p className="mt-4 text-sm text-muted-foreground">{priceNote}</p> : null}
          <p
            className={cn(
              'text-5xl font-bold leading-none tracking-[-0.04em] md:text-[56px]',
              priceNote ? 'mt-1' : 'mt-4',
              featured ? 'text-cobalt-text' : 'text-foreground',
            )}
          >
            {price}
            {suffix ? (
              <span className="ml-1 text-base font-medium tracking-normal text-muted-foreground">{suffix}</span>
            ) : null}
          </p>
          {muted ? <p className="mt-3 text-pretty text-sm text-muted-foreground">{muted}</p> : null}
        </div>
        <div className="md:col-span-2">
          <p className="max-w-[48ch] text-pretty text-base leading-relaxed text-muted-foreground">{description}</p>
          <ul className="mt-6 grid gap-x-8 gap-y-3 md:grid-cols-2">
            {items.map((line) => (
              <li
                key={line}
                className="relative text-pretty pl-4 text-sm text-foreground/80 before:absolute before:left-0 before:content-['–']"
              >
                {line}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Wrapper>
  )
}

function CarePricingRows() {
  return (
    <div>
      {carePricing.map((tier) => (
        <div key={tier.slug}>
          <SectionDivider />
          <div className="grid gap-6 py-12 md:grid-cols-3 md:gap-12 md:py-16">
            <div>
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <h3 className="text-balance text-xl font-bold text-foreground">{tier.name}</h3>
                {tier.featured ? <span className="text-sm font-medium text-muted-foreground">Recommended</span> : null}
              </div>
              <p
                className={cn(
                  'mt-4 text-5xl font-bold leading-none tracking-[-0.04em] md:text-[56px]',
                  tier.featured ? 'text-cobalt-text' : 'text-foreground',
                )}
              >
                ${tier.priceMin.toLocaleString('en-US')}
                <span className="ml-1 text-base font-medium tracking-normal text-muted-foreground">/mo</span>
              </p>
              <p className="mt-3 text-pretty text-sm text-muted-foreground">{tier.tagline}</p>
            </div>
            <div className="md:col-span-2">
              <p className="max-w-[48ch] text-pretty text-base leading-relaxed text-muted-foreground">
                {tier.description}
              </p>
              <ul className="mt-6 grid gap-x-8 gap-y-3 md:grid-cols-2">
                {tier.includes.map((line) => (
                  <li
                    key={line}
                    className="relative text-pretty pl-4 text-sm text-foreground/80 before:absolute before:left-0 before:content-['–']"
                  >
                    {line}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ))}
      <SectionDivider />
      <div className="mt-12 flex justify-center">
        <Button
          asChild
          variant="default"
          className="group rounded-xl bg-cobalt-gradient px-8 py-4 text-base font-semibold text-white shadow-cobalt"
        >
          <Link href="/contact" onClick={() => trackCTAClick('get_started', 'services')}>
            Book a Strategy Call
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </Button>
      </div>
    </div>
  )
}

function ContentGrowthRows() {
  return (
    <div>
      {publicBlogPricing.map((tier) => (
        <PricingRow
          key={tier.slug}
          as="article"
          name={tier.name}
          price={`$${tier.priceMin.toLocaleString('en-US')}`}
          suffix="/mo"
          muted={getContentPlanDetail(tier)}
          description={tier.tagline}
          items={tier.includes}
        />
      ))}
      <SectionDivider />
    </div>
  )
}

function LandingPageRows() {
  return (
    <div>
      {landingPagePricing.map((tier) => (
        <PricingRow
          key={tier.slug}
          as="article"
          name={tier.name}
          priceNote="Starting at"
          price={`$${tier.priceMin.toLocaleString('en-US')}`}
          muted={tier.tagline}
          description={tier.description}
          items={tier.includes}
        />
      ))}
      <SectionDivider />
    </div>
  )
}

function conversationAllowanceCopy(tiers: readonly ChatbotTier[]): string {
  const counts = tiers
    .map((tier) => tier.conversations.match(/[\d,]+/)?.[0])
    .filter((value): value is string => Boolean(value))
  if (counts.length === 0) {
    return 'Usage is metered. Allowances are sized during scoping.'
  }
  const listed = counts.length === 1 ? counts[0] : `${counts.slice(0, -1).join(', ')}, or ${counts[counts.length - 1]}`
  return `Usage is metered. Allowances are sized during scoping — currently up to ${listed} conversations per month depending on the integration.`
}

function ConversationAllowances({ copy }: { copy: string }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="mt-4">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="ai-conversation-allowances"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between gap-4 py-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0070F3]/40 focus-visible:ring-offset-2"
      >
        <span className="text-sm font-medium text-foreground">Conversation allowances</span>
        <AccordionIndicator isOpen={open} className="h-4 w-4 text-cobalt-text" />
      </button>
      <p id="ai-conversation-allowances" hidden={!open} className="mt-3 text-pretty text-[13px] text-muted-foreground">
        {copy}
      </p>
    </div>
  )
}

function CareTermsLegend() {
  const [open, setOpen] = useState(false)

  return (
    <div className="mt-6 border-t border-border pt-4">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="website-care-terms"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between gap-4 py-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0070F3]/40 focus-visible:ring-offset-2"
      >
        <span className="text-sm font-medium text-foreground">What these terms mean</span>
        <AccordionIndicator isOpen={open} className="h-4 w-4 text-cobalt-text" />
      </button>
      <div id="website-care-terms" hidden={!open} className="mt-3 space-y-5">
        {CARE_LEGEND_GROUPS.map((group) => (
          <div key={group.plan}>
            <p className="mb-2 text-xs font-medium text-muted-foreground">{group.plan}</p>
            <dl className="space-y-3">
              {group.entries.map((entry) => (
                <div key={entry.term}>
                  <dt className="text-[13px] font-medium text-foreground">{entry.term}</dt>
                  <dd className="mt-0.5 text-pretty text-[13px] leading-relaxed text-muted-foreground">
                    {entry.explanation}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>
    </div>
  )
}

function AiExperienceBlock() {
  return (
    <article>
      <SectionDivider />
      <div className="grid gap-6 py-12 md:grid-cols-3 md:gap-12 md:py-16">
        <div>
          <h3 className="text-balance text-xl font-bold text-foreground">Ongoing usage and management</h3>
          <div className="mt-4 flex flex-wrap items-baseline gap-x-8 gap-y-4">
            <div>
              <p className="text-5xl font-bold leading-none tracking-[-0.04em] text-foreground md:text-[56px]">
                {CHATBOT_SETUP_FEE.display}
              </p>
              <p className="mt-3 text-sm text-muted-foreground">one-time setup</p>
            </div>
            <div>
              <p className="text-5xl font-bold leading-none tracking-[-0.04em] text-foreground md:text-[56px]">
                {`from $${CHATBOT_USAGE_FROM.toLocaleString('en-US')}`}
                <span className="ml-1 text-base font-medium tracking-normal text-muted-foreground">/mo</span>
              </p>
            </div>
          </div>
          <p className="mt-3 text-pretty text-sm text-muted-foreground">{CARE_CLIENT_DISCOUNT}</p>
        </div>
        <div className="md:col-span-2">
          <p className="max-w-[48ch] text-pretty text-base leading-relaxed text-muted-foreground">
            Custom integration is scoped separately.
          </p>
          <ul className="mt-6 grid gap-x-8 gap-y-3 md:grid-cols-2">
            {chatbotSharedIncludes.map((line) => (
              <li
                key={line}
                className="relative text-pretty pl-4 text-sm text-foreground/80 before:absolute before:left-0 before:content-['–']"
              >
                {line}
              </li>
            ))}
          </ul>
          <ConversationAllowances copy={conversationAllowanceCopy(chatbotPricing)} />
        </div>
      </div>
      <SectionDivider />
    </article>
  )
}

function ProjectPricingRows() {
  return (
    <div>
      {projectPricing.map((tier) => (
        <div key={tier.slug}>
          <SectionDivider />
          <div className="grid gap-6 py-12 md:grid-cols-3 md:gap-12 md:py-16">
            <div>
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <h3 className="text-balance text-xl font-bold text-foreground">{tier.name}</h3>
                {tier.featured ? <span className="text-sm font-medium text-muted-foreground">Recommended</span> : null}
              </div>
              <p
                className={cn(
                  'mt-4 text-5xl font-bold leading-none tracking-[-0.04em] md:text-[56px]',
                  tier.featured ? 'text-cobalt-text' : 'text-foreground',
                )}
              >
                {tier.price}
              </p>
              <p className="mt-3 text-pretty text-sm text-muted-foreground">{tier.timeline}</p>
            </div>
            <div className="md:col-span-2">
              <p className="max-w-[55ch] text-pretty text-base leading-relaxed text-muted-foreground">
                {tier.description}
              </p>
              <ul className="mt-6 grid gap-x-8 gap-y-3 md:grid-cols-2">
                {tier.includes.map((line) => (
                  <li
                    key={line}
                    className="relative text-pretty pl-4 text-sm text-foreground/80 before:absolute before:left-0 before:content-['–']"
                  >
                    {line}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ))}
      <SectionDivider />
      <div className="mt-12 flex justify-center">
        <Button
          asChild
          variant="default"
          className="group rounded-xl bg-cobalt-gradient px-8 py-4 text-base font-semibold text-white shadow-cobalt"
        >
          <Link href="/contact" onClick={() => trackCTAClick('get_started', 'services')}>
            Book a Strategy Call
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </Button>
      </div>
    </div>
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

const SERVICE_ICON_FALLBACK = [StrategyIcon, DesignIcon, WebIcon, LandingIcon, RefreshIcon, CmsIcon, CareIcon]

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
          href={serviceHref(service.slug)}
          className="link-cobalt inline-flex items-center gap-2 font-semibold text-cobalt-text"
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
  heading,
  children,
  compact = false,
}: {
  heading: string
  children?: ReactNode
  compact?: boolean
}) {
  return (
    <div className={compact ? 'mb-8 text-center' : 'mb-12 text-center'}>
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
  id,
  className,
}: {
  children: ReactNode
  delay?: number
  compact?: boolean
  id?: string
  className?: string
}) {
  return (
    <motion.section
      id={id}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay }}
      className={cn(compact ? 'px-6 py-12 md:px-12 lg:px-20' : 'px-6 py-20 md:px-12 lg:px-20', className)}
    >
      <div className="mx-auto max-w-5xl">{children}</div>
    </motion.section>
  )
}

function ProjectPricingSection() {
  return (
    <>
      <PricingSection>
        <SectionHeading heading="Fixed scope. Fixed price. One engagement.">
          <p className="mx-auto mt-3 max-w-[55ch] text-pretty text-base leading-relaxed text-muted-foreground">
            Strategy, custom design, development, and launch priced as a complete website project,{' '}
            <Link
              href="/get-started"
              className="font-medium text-cobalt-text underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0070F3]/40 focus-visible:ring-offset-2"
            >
              from first call to launch
            </Link>
            . Growth is the engagement most established businesses need.
          </p>
        </SectionHeading>
        <ProjectPricingRows />
        <p className="mx-auto mt-6 max-w-[48ch] text-pretty text-center text-sm text-muted-foreground">
          {careFooterText}
        </p>
      </PricingSection>
      <section className="bg-[color-mix(in_oklab,var(--background),var(--foreground)_4%)] px-6 py-14 md:px-12 md:py-20 lg:px-20">
        <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-3 md:gap-12">
          <h2 className="text-balance text-3xl font-bold leading-tight tracking-tight text-foreground md:text-4xl">
            {SMALLER_PROJECTS.heading}
          </h2>
          <div className="md:col-span-2">
            <p className="max-w-[48ch] text-pretty text-base leading-relaxed text-muted-foreground">
              {SMALLER_PROJECTS.body}
            </p>
            <div className="mt-8">
              <Button
                asChild
                variant="default"
                className="rounded-xl bg-cobalt-gradient px-6 py-3 text-sm font-semibold text-white shadow-cobalt"
              >
                <Link href="/contact">{SMALLER_PROJECTS.cta}</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

function OngoingCapabilities() {
  return (
    <>
      <PricingSection compact>
        <p className="mx-auto mb-10 max-w-[55ch] text-center text-pretty text-base leading-relaxed text-muted-foreground">
          {AFTER_LAUNCH_TRANSITION}
        </p>
        <SectionHeading compact heading={CARE_REFRAME.heading}>
          <div className="mx-auto mt-3 max-w-[55ch] space-y-3.5 text-pretty text-base leading-relaxed text-muted-foreground">
            {CARE_REFRAME.body.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </SectionHeading>
        <CarePricingRows />
        <CareTermsLegend />
      </PricingSection>

      <PricingSection delay={0.05} compact>
        <SectionHeading compact heading={CONTENT_GROWTH.heading}>
          <p className="mx-auto mt-3 max-w-[55ch] text-pretty text-base leading-relaxed text-muted-foreground">
            {CONTENT_GROWTH.intro}
          </p>
        </SectionHeading>
        <ContentGrowthRows />
        <p className="mt-6 max-w-[55ch] text-pretty text-base leading-relaxed text-muted-foreground">
          {CONTENT_GROWTH_AVAILABILITY} {CARE_CLIENT_DISCOUNT}
        </p>
      </PricingSection>

      <PricingSection delay={0.1} compact id="landing-pages" className="scroll-mt-32">
        <SectionHeading compact heading={LANDING_PAGE_PRICING.heading}>
          <p className="mx-auto mt-3 max-w-[55ch] text-pretty text-base leading-relaxed text-muted-foreground">
            {LANDING_PAGE_PRICING.intro}
          </p>
        </SectionHeading>
        <LandingPageRows />
      </PricingSection>

      <PricingSection delay={0.15} compact>
        <SectionHeading compact heading={AI_EXPERIENCE.heading}>
          <p className="mx-auto mt-3 max-w-[55ch] text-pretty text-base leading-relaxed text-muted-foreground">
            {AI_EXPERIENCE.intro}
          </p>
        </SectionHeading>
        <AiExperienceBlock />
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
              <p className="mx-auto mt-3 max-w-[55ch] text-pretty text-base leading-relaxed text-muted-foreground">
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
                  transition={{
                    type: 'spring',
                    stiffness: 300,
                    damping: 30,
                    delay: index * 0.05,
                  }}
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
                            isOpen ? 'text-cobalt-text' : 'text-muted-foreground',
                          )}
                        >
                          <Icon />
                        </div>

                        <div>
                          <h3 className="text-balance text-lg font-semibold text-foreground transition-colors duration-500 md:text-xl">
                            {service.title}
                          </h3>
                          {service.description ? (
                            <p className="mt-1 max-w-[55ch] text-pretty text-sm text-muted-foreground transition-colors duration-500">
                              {service.description}
                            </p>
                          ) : null}
                        </div>
                      </div>

                      <AccordionIndicator isOpen={isOpen} className="w-5 h-5 flex-shrink-0 text-cobalt-text" />
                    </div>

                    {/* Always rendered so every "Learn more" link is in the server HTML.
                        A closed row is collapsed and inert: not focusable, hidden from screen readers. */}
                    <motion.div
                      initial={false}
                      animate={isOpen ? { opacity: 1, height: 'auto' } : { opacity: 0, height: 0 }}
                      transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                      className="overflow-hidden"
                      inert={!isOpen}
                    >
                      <div className="mt-6 pt-1 transition-colors duration-500">
                        <SanityServiceExpandedBody service={service} />
                      </div>
                    </motion.div>
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
            <SectionHeading compact heading={CLOSING_CTA.heading}>
              <p className="mx-auto mt-3 max-w-[55ch] text-pretty text-base leading-relaxed text-muted-foreground">
                {CLOSING_CTA.body}
              </p>
            </SectionHeading>
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
