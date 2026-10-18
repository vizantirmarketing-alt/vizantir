import { PricingOverviewCta } from '@/components/homepage/PricingOverviewCta'
import { carePricing, projectPricing } from '@/data/pricing'
import { cn } from '@/lib/utils'

const [essentialCare, websiteCare, growthCare] = carePricing

export function PricingOverview() {
  return (
    <section className="px-6 py-16 transition-colors duration-500 md:px-12 md:py-20 lg:px-20 short-landscape:py-8">
      <div className="mx-auto max-w-5xl">
        <h2 className="text-balance text-3xl font-black tracking-tight text-foreground md:text-4xl">
          Fixed scope. Fixed price. One engagement.
        </h2>

        <div className="mt-10">
          {projectPricing.map((tier) => (
            <div key={tier.slug} className="grid gap-4 border-t border-border py-8 md:grid-cols-3 md:gap-12 md:py-10">
              <div>
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <h3 className="text-balance text-xl font-bold text-foreground">{tier.name}</h3>
                  {tier.featured ? (
                    <span className="text-sm font-medium text-muted-foreground">Recommended</span>
                  ) : null}
                </div>
                <p
                  className={cn(
                    'mt-3 text-4xl font-bold leading-none tracking-[-0.04em] md:text-5xl',
                    tier.featured ? 'text-cobalt-text' : 'text-foreground',
                  )}
                >
                  {tier.price}
                </p>
                <p className="mt-3 text-pretty text-sm text-muted-foreground">{tier.timeline}</p>
              </div>
              <p className="max-w-[48ch] text-pretty text-base leading-relaxed text-muted-foreground md:col-span-2">
                {tier.description}
              </p>
            </div>
          ))}
        </div>

        <div className="border-t border-border pt-8">
          <p className="max-w-[48ch] text-pretty text-sm text-muted-foreground">
            After launch, an optional care retainer is available, starting at {essentialCare.price} for{' '}
            {essentialCare.name}, {websiteCare.price} for {websiteCare.name}, and {growthCare.price} for{' '}
            {growthCare.name}.
          </p>
          <PricingOverviewCta />
        </div>
      </div>
    </section>
  )
}
