'use client'

import { useState } from 'react'
import { ArrowRight, CheckCircle2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import ServicesHero from './ServicesHero'
import { trackCTAClick } from '@/lib/analytics'
import type { ServiceListItem } from '@/lib/sanity/types'
import { AccordionIndicator } from '@/components/ui/AccordionIndicator'
import { Button } from '@/components/ui/button'
import { carePricing, projectPricing } from '@/data/pricing'
import { cn } from '@/lib/utils'

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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="mt-20 md:mt-24"
    >
      <div className="grid lg:grid-cols-2 gap-10 lg:gap-12">
        <div>
          <h3 className="text-xl md:text-2xl font-bold mb-2 text-foreground transition-colors duration-500">
            Project Pricing
          </h3>
          <p className="text-sm md:text-base mb-6 text-muted-foreground transition-colors duration-500">
            Fixed scope. Fixed price. No surprises.
          </p>
          <div className="space-y-3">
            {projectPricing.map((tier) => (
              <PricingCard
                key={tier.slug}
                title={tier.name}
                price={tier.price}
                description={tier.description}
                includes={tier.includes}
                featured={tier.featured}
              />
            ))}
          </div>
        </div>
        <div>
          <h3 className="text-xl md:text-2xl font-bold mb-2 text-foreground transition-colors duration-500">
            Website Care
          </h3>
          <p className="text-sm md:text-base mb-6 text-muted-foreground transition-colors duration-500">
            Monthly retainers after launch.
          </p>
          <div className="space-y-3">
            {carePricing.map((tier) => (
              <PricingCard
                key={tier.slug}
                title={tier.name}
                tagline={tier.tagline}
                price={tier.price}
                description={tier.description}
                includes={tier.includes}
                featured={tier.slug === 'growth-care'}
              />
            ))}
          </div>
        </div>
      </div>
      <div className="flex justify-center mt-10">
        <span className="inline-flex">{strategyCallLink()}</span>
      </div>
    </motion.div>
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

interface PricingCardProps {
  title: string
  tagline?: string
  price: string
  description: string
  includes?: readonly string[]
  featured?: boolean
}

function PricingCard({
  title,
  tagline,
  price,
  description,
  includes,
  featured = false,
}: PricingCardProps) {
  const glassTransition = 'background 0.3s ease, border 0.3s ease, box-shadow 0.3s ease'

  const defaultGlass = {
    background: 'rgba(0, 0, 0, 0.02)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    border: '1px solid rgba(0, 0, 0, 0.08)',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
    transition: glassTransition,
  }

  const featuredGlass = {
    background: 'rgba(180, 132, 30, 0.04)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    border: '1px solid rgba(180, 132, 30, 0.15)',
    boxShadow: '0 4px 24px rgba(180, 132, 30, 0.08)',
    transition: glassTransition,
  }

  const baseGlass = featured ? featuredGlass : defaultGlass

  return (
    <div
      className="relative p-5 rounded-xl border transition-all duration-300"
      style={baseGlass}
      onMouseEnter={(e) => {
        if (featured) {
          e.currentTarget.style.background = 'rgba(180, 132, 30, 0.06)'
          e.currentTarget.style.border = '1px solid rgba(180, 132, 30, 0.25)'
          e.currentTarget.style.boxShadow = '0 4px 28px rgba(180, 132, 30, 0.12)'
        } else {
          e.currentTarget.style.background = 'rgba(0, 0, 0, 0.04)'
          e.currentTarget.style.border = '1px solid rgba(180, 132, 30, 0.2)'
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = baseGlass.background
        e.currentTarget.style.border = baseGlass.border
        if (featured) {
          e.currentTarget.style.boxShadow = featuredGlass.boxShadow
        } else {
          e.currentTarget.style.boxShadow = defaultGlass.boxShadow
        }
      }}
    >
      {featured && (
        <span className="absolute -top-2 right-4 text-[10px] tracking-wider uppercase px-2 py-0.5 rounded-full font-medium bg-gold-gradient text-[#1A1A1A]">
          Popular
        </span>
      )}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h4 className="font-medium text-sm text-foreground transition-colors duration-500">
            {title}
          </h4>
          {tagline ? (
            <p className="mt-0.5 text-xs font-medium text-gold-accent transition-colors duration-500">
              {tagline}
            </p>
          ) : null}
        </div>
        <span className="text-sm font-semibold whitespace-nowrap text-gold-accent transition-colors duration-500">
          {price}
        </span>
      </div>
      <p
        className={cn(
          'text-xs leading-relaxed text-muted-foreground transition-colors duration-500',
          includes?.length ? 'mb-4' : '',
        )}
      >
        {description}
      </p>
      {includes && includes.length > 0 ? (
        <ul className="space-y-3">
          {includes.map((line, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-foreground/80">
              <CheckCircle2 size={16} className="mt-0.5 flex-shrink-0 text-gold-accent" aria-hidden />
              {line}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
