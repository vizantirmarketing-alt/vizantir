'use client'

import { Section } from '@/components/ui/Section'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { trackBookStrategyCall } from '@/lib/analytics'
import { itemVariants } from './motion'

const STRATEGY_CALL_HREF = '/contact'

type LandingPagesHeroProps = {
  headline: string
  subheadline: string
  ctaLabel: string
  trackingLocation: string
}

export function LandingPagesHero({
  headline,
  subheadline,
  ctaLabel,
  trackingLocation,
}: LandingPagesHeroProps) {
  return (
    <Section hero className="relative flex min-h-[88svh] items-center justify-center overflow-hidden px-6 md:px-12 lg:px-20">
      <div className="pointer-events-none absolute inset-0" aria-hidden data-atmosphere-slot />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,var(--cobalt-muted-subtle)_0%,transparent_60%)]"
        aria-hidden
      />

      <div className="relative z-10 mx-auto max-w-4xl text-center">

        <motion.h1
          variants={itemVariants}
          initial="visible"
          className="mb-6 font-black leading-[1.05] text-foreground sm:text-5xl md:text-6xl lg:text-7xl"
        >
          {headline}
        </motion.h1>

        <motion.p
          variants={itemVariants}
          initial="visible"
          className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl"
        >
          {subheadline}
        </motion.p>

        <motion.div variants={itemVariants} initial="visible" className="flex flex-col items-center gap-4">
          <Button
            size="lg"
            asChild
            className="group rounded-xl bg-cobalt-gradient px-8 py-4 text-base font-semibold text-white shadow-cobalt focus-visible:ring-2 focus-visible:ring-[#0070F3]/50 focus-visible:ring-offset-2"
          >
            <Link
              href={STRATEGY_CALL_HREF}
              onClick={() => trackBookStrategyCall(trackingLocation)}
            >
              {ctaLabel}
              <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </motion.div>
      </div>
    </Section>
  )
}
