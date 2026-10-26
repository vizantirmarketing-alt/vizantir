'use client'

import Link from 'next/link'
import { trackBookStrategyCall, trackCTAClick } from '@/lib/analytics'
import { ArrowRight, CheckCircle2 } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/button'
import { carePricing, projectPricing } from '@/data/pricing'
import { cn } from '@/lib/utils'

export interface PricingCardsProps {
  /** Optional custom heading above the cards. If omitted, no heading rendered. */
  heading?: string
  /** Optional intro paragraph below heading */
  intro?: string
  /** Whether to show the Care retainer footer line. Defaults to true. */
  showCareFooter?: boolean
  /** Override the CTA text on all cards. Defaults to "Book a Strategy Call" */
  ctaText?: string
  /** Override the CTA href. Defaults to "/contact" */
  ctaHref?: string
  /** Heading and intro alignment. Defaults to center (landing pages). Use start for /services. */
  align?: 'start' | 'center'
}

const [essentialCare, websiteCare, growthCare] = carePricing

const DEFAULT_CTA_HREF = '/contact'

const careFooterText = `After launch, an optional care retainer is available, starting at ${essentialCare.price} for ${essentialCare.name}, ${websiteCare.price} for ${websiteCare.name}, and ${growthCare.price} for ${growthCare.name}.`

export function PricingCards({
  heading,
  intro,
  showCareFooter = true,
  ctaText = 'Book a Strategy Call',
  ctaHref = DEFAULT_CTA_HREF,
  align = 'center',
}: PricingCardsProps) {
  const isStart = align === 'start'

  return (
    <>
      {heading ? (
        <h2
          className={cn(
            'text-balance font-bold text-foreground',
            isStart
              ? 'mb-3 leading-tight tracking-tight md:text-4xl'
              : 'mb-4 md:text-4xl lg:text-5xl',
          )}
        >
          {heading}
        </h2>
      ) : null}

      {intro ? (
        <p
          className={cn(
            'text-pretty text-muted-foreground',
            isStart
              ? 'mb-12 max-w-2xl text-base leading-relaxed'
              : 'mx-auto mb-16 max-w-2xl text-lg',
          )}
        >
          {intro}
        </p>
      ) : null}

      <div className="mb-10 grid items-stretch gap-[var(--stack)] md:grid-cols-3 lg:grid-cols-3">
        {projectPricing.map((tier) => (
          <Card
            key={tier.slug}
            variant="plain"
            featured={tier.featured}
            className={cn(
              'rounded-2xl bg-muted',
              tier.featured
                ? 'border-cobalt-muted-border shadow-[0_0_40px_rgba(0,112,243,0.08)]'
                : 'border-border',
            )}
          >
            <h3 className="mb-1 text-balance text-xl font-bold text-foreground">{tier.name}</h3>
            <p className="mb-1 text-3xl font-black text-cobalt-text">{tier.price}</p>
            <p className="mb-4 text-pretty text-sm text-muted-foreground">{tier.timeline}</p>
            <p className="mb-6 text-pretty text-base md:text-sm leading-normal md:leading-relaxed text-muted-foreground">{tier.description}</p>
            <ul className="mb-6 mt-2 space-y-3">
              {tier.includes.map((line) => (
                <li key={line} className="flex items-start gap-2 text-pretty text-base md:text-sm text-foreground/80">
                  <CheckCircle2
                    className="mt-[2px] h-4 w-4 flex-shrink-0 text-cobalt-text"
                    aria-hidden
                  />
                  {line}
                </li>
              ))}
            </ul>
            <div className="flex-1" />
            <Button
              asChild
              variant={tier.featured ? 'default' : 'cobaltOutline'}
              className={
                tier.featured
                  ? 'group w-full rounded-xl bg-cobalt-gradient px-6 py-3 text-sm font-semibold text-white shadow-cobalt'
                  : 'group w-full rounded-xl px-6 py-3 text-sm font-semibold text-foreground transition-all duration-300 hover:border-transparent hover:[background:var(--cobalt-gradient)] hover:text-white hover:shadow-cobalt'
              }
            >
              <Link
                href={ctaHref}
                onClick={() => {
                  const location = `pricing_cards_${tier.slug}`
                  if (ctaHref === DEFAULT_CTA_HREF) trackBookStrategyCall(location)
                  else trackCTAClick('pricing_card_cta', location)
                }}
              >
                {ctaText}
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </Card>
        ))}
      </div>

      {showCareFooter ? (
        <p className="mx-auto max-w-2xl text-center text-sm text-muted-foreground">
          {careFooterText}
        </p>
      ) : null}
    </>
  )
}
