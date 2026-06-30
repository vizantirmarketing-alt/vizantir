import Link from 'next/link'
import { ArrowRight, CheckCircle2 } from 'lucide-react'
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

const [essentialsCare, growthCare, enterpriseCare] = carePricing

const careFooterText = `After launch, Website Care retainers start at ${essentialsCare.price} for Essentials Care, ${growthCare.price} for Growth Care, and ${enterpriseCare.price} for Enterprise Care.`

export function PricingCards({
  heading,
  intro,
  showCareFooter = true,
  ctaText = 'Book a Strategy Call',
  ctaHref = '/contact',
  align = 'center',
}: PricingCardsProps) {
  const isStart = align === 'start'

  return (
    <>
      {heading ? (
        <h2
          className={cn(
            'font-bold text-foreground',
            isStart
              ? 'mb-3 text-3xl leading-tight tracking-tight md:text-4xl'
              : 'mb-4 text-3xl md:text-4xl lg:text-5xl',
          )}
        >
          {heading}
        </h2>
      ) : null}

      {intro ? (
        <p
          className={cn(
            'text-muted-foreground',
            isStart
              ? 'mb-12 max-w-2xl text-base leading-relaxed'
              : 'mx-auto mb-16 max-w-2xl text-lg',
          )}
        >
          {intro}
        </p>
      ) : null}

      <div className="mb-10 grid gap-6 md:grid-cols-3 lg:grid-cols-3">
        {projectPricing.map((tier) => (
          <div
            key={tier.slug}
            className={cn(
              'relative flex flex-col rounded-2xl border bg-muted p-8',
              tier.featured
                ? 'border-cobalt-muted-border shadow-[0_0_40px_rgba(0,112,243,0.08)]'
                : 'border-border',
            )}
          >
            {tier.featured ? (
              <span className="absolute -top-2 right-4 rounded-full bg-cobalt-gradient px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-white">
                Popular
              </span>
            ) : null}
            <h3 className="mb-1 text-xl font-bold text-foreground">{tier.name}</h3>
            <p className="mb-1 text-3xl font-black text-cobalt-accent">{tier.price}</p>
            <p className="mb-4 text-sm text-muted-foreground">{tier.timeline}</p>
            <p className="mb-6 text-sm leading-relaxed text-muted-foreground">{tier.description}</p>
            <ul className="mb-6 mt-2 space-y-3">
              {tier.includes.map((line) => (
                <li key={line} className="flex items-start gap-2 text-sm text-foreground/80">
                  <CheckCircle2
                    className="mt-[2px] h-4 w-4 flex-shrink-0 text-cobalt-accent"
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
              <Link href={ctaHref}>
                {ctaText}
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>
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
