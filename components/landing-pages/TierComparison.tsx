'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ArrowRight, CheckCircle2 } from 'lucide-react'
import { Eyebrow } from '@/components/ui/Eyebrow'
import SectionDivider from '@/components/ui/SectionDivider'
import { landingPagePricing, type LandingPageTier } from '@/data/pricing'
import { trackBookStrategyCallIntent } from '@/lib/analytics'
import {
  containerVariants,
  itemVariants,
  sectionReveal,
} from '@/app/landing-pages/_components/motion'

const LIVE_EXAMPLE_HREF: Record<LandingPageTier['slug'], string> = {
  'campaign-landing-page': '/campaigns/website-care',
  'conversion-system': '/landing-pages',
}

const SEE_LIVE_TRACKING: Record<LandingPageTier['slug'], string> = {
  'campaign-landing-page': 'landing_pages_tier_campaign_see_live',
  'conversion-system': 'landing_pages_tier_system_see_live',
}

type TierCardProps = {
  tier: LandingPageTier
  isSystemLive: boolean
  showLiveExampleLinks: boolean
}

function TierCard({ tier, isSystemLive, showLiveExampleLinks }: TierCardProps) {
  const includes = tier.includes.slice(0, 6)
  const isSystem = tier.slug === 'conversion-system'
  const showLiveText = isSystem && isSystemLive
  const showLiveLink = showLiveExampleLinks && !showLiveText

  return (
    <motion.div
      variants={itemVariants}
      className={`flex h-full flex-col rounded-2xl border p-6 md:p-8 ${
        tier.featured
          ? 'border-cobalt-muted-border bg-cobalt-muted-subtle'
          : 'border-border bg-muted/30'
      }`}
    >
      {tier.featured ? (
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-cobalt-accent">
          Popular
        </p>
      ) : null}
      <h3 className="text-xl font-bold text-foreground">{tier.name}</h3>
      <p className="mt-2 text-2xl font-black text-foreground">{tier.price}</p>
      <p className="mt-2 text-sm font-medium text-cobalt-accent">{tier.tagline}</p>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{tier.description}</p>

      <ul className="mt-6 flex-1 space-y-3">
        {includes.map((item) => (
          <li key={item} className="flex items-start gap-2.5">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-cobalt-accent" aria-hidden />
            <span className="text-sm leading-relaxed text-muted-foreground">{item}</span>
          </li>
        ))}
      </ul>

      {showLiveText || showLiveLink ? (
        <div className="mt-8 border-t border-border pt-5">
          {showLiveText ? (
            <p className="text-sm font-medium text-foreground">
              You&apos;re viewing a live Conversion System
            </p>
          ) : (
            <Link
              // Live example demo. Campaign Landing Page build pending at /campaigns/*
              href={LIVE_EXAMPLE_HREF[tier.slug]}
              onClick={() => trackBookStrategyCallIntent(SEE_LIVE_TRACKING[tier.slug])}
              className="group inline-flex items-center text-sm font-semibold text-cobalt-accent underline-offset-2 transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0070F3]/40 focus-visible:ring-offset-2"
            >
              See a live example
              <ArrowRight className="ml-1.5 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          )}
        </div>
      ) : null}
    </motion.div>
  )
}

type TierComparisonProps = {
  showLiveExampleLinks?: boolean
  isPrimaryDemo?: boolean
}

export function TierComparison({
  showLiveExampleLinks = true,
  isPrimaryDemo,
}: TierComparisonProps) {
  const pathname = usePathname()
  const isSystemLive = isPrimaryDemo ?? pathname === '/landing-pages'

  return (
    <>
      <SectionDivider />
      <section className="px-6 py-20 md:px-12 lg:px-20" aria-labelledby="tier-comparison-heading">
        <div className="mx-auto max-w-6xl">
          <motion.div {...sectionReveal} className="mb-14 text-center">
            <Eyebrow>Pricing</Eyebrow>
            <h2
              id="tier-comparison-heading"
              className="text-3xl font-bold text-foreground md:text-4xl lg:text-5xl"
            >
              Two tiers. One craft standard.
            </h2>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-40px' }}
            className="grid gap-6 lg:grid-cols-2"
          >
            {landingPagePricing.map((tier) => (
              <TierCard
                key={tier.slug}
                tier={tier}
                isSystemLive={isSystemLive}
                showLiveExampleLinks={showLiveExampleLinks}
              />
            ))}
          </motion.div>
        </div>
      </section>
    </>
  )
}
