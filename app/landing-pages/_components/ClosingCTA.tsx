'use client'

import { Section } from '@/components/ui/Section'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { trackBookStrategyCall, trackPhoneClick } from '@/lib/analytics'
import { sectionReveal } from './motion'

const STRATEGY_CALL_HREF = '/contact'

type ClosingCTAProps = {
  heading: string
  subheading: string
  ctaLabel: string
  trackingLocation: string
}

export function ClosingCTA({
  heading,
  subheading,
  ctaLabel,
  trackingLocation,
}: ClosingCTAProps) {
  return (
    <Section size="lg" className="relative overflow-hidden bg-cobalt-primary px-6 md:px-12 lg:px-20"
      aria-labelledby="closing-cta-heading">
      <div className="relative z-10 mx-auto max-w-3xl text-center">
        <motion.div {...sectionReveal}>
          <h2
            id="closing-cta-heading"
            className="mb-5 font-bold text-white md:text-4xl lg:text-5xl"
          >
            {heading}
          </h2>
          <p className="mb-[var(--cta-gap)] text-lg text-white/80">{subheading}</p>
          <Button
            size="lg"
            asChild
            className="btn-inverse group rounded-xl bg-white px-8 py-4 text-base font-semibold text-cobalt-text shadow-lg hover:bg-white/95 focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-cobalt-primary"
          >
            <Link
              href={STRATEGY_CALL_HREF}
              onClick={() => trackBookStrategyCall(trackingLocation)}
            >
              {ctaLabel}
              <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
          <p className="mt-6 text-sm text-white/70">
            <span className="block md:inline">
              Vizantir Design Studio · Las Vegas, NV 89139
            </span>
            <span className="mx-2 hidden text-white/40 md:inline">·</span>
            <Link
              href="tel:+17022890758"
              onClick={trackPhoneClick}
              className="block text-white -mx-2 -my-0.5 rounded-full px-2 py-0.5 transition-colors duration-150 hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-cobalt-primary md:inline"
            >
              (702) 289-0758
            </Link>
          </p>
        </motion.div>
      </div>
    </Section>
  )
}
