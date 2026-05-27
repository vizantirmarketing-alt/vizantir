'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '@/contexts/ThemeContext'
import Link from 'next/link'
import ServicesHero from './ServicesHero'
import { trackCTAClick } from '@/lib/analytics'
import type { ServiceListItem } from '@/lib/sanity/types'

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
      className="inline-flex items-center gap-2 mt-4 font-semibold hover:opacity-80 transition-opacity"
      style={{ color: 'var(--gold-primary)' }}
    >
      Book a Strategy Call
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
      </svg>
    </Link>
  )
}

function SanityServiceExpandedBody({ service, isNightMode }: { service: ServiceListItem; isNightMode: boolean }) {
  return (
    <div className="space-y-8">
      {service.description ? (
        <p
          className="leading-relaxed transition-colors duration-500"
          style={{ color: isNightMode ? '#888888' : '#6B7280' }}
        >
          {service.description}
        </p>
      ) : null}
      {service.slug ? (
        <Link
          href={`/services/${service.slug}`}
          className="inline-flex items-center gap-2 font-semibold hover:opacity-80 transition-opacity"
          style={{ color: 'var(--gold-primary)' }}
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

function StandalonePricingSection({ isNightMode }: { isNightMode: boolean }) {
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
          <h3
            className="text-xl md:text-2xl font-bold mb-2 transition-colors duration-500"
            style={{ color: isNightMode ? '#F8F8F8' : '#1A1A1A' }}
          >
            Project Pricing
          </h3>
          <p
            className="text-sm md:text-base mb-6 transition-colors duration-500"
            style={{ color: isNightMode ? '#888888' : '#6B7280' }}
          >
            Fixed scope. Fixed price. No surprises.
          </p>
          <div className="space-y-3">
            <PricingCard
              title="Essentials"
              price="$15,000+"
              description="5-10 pages. Custom Next.js build. Custom design, smooth animations, and a mobile-first build. Most Essentials sites score 85+ on PageSpeed."
              isNightMode={isNightMode}
            />
            <PricingCard
              title="Growth"
              price="$30,000+"
              description="10-20 pages. Headless CMS integration. Custom animations, conversion-focused structure, built for more — more pages, more locations, more editors in the CMS."
              featured
              isNightMode={isNightMode}
            />
            <PricingCard
              title="Enterprise"
              price="$60,000+"
              description="20+ pages or e-commerce. Complex animations, full CMS, third-party integrations. For businesses with complex requirements — multi-stakeholder approvals, compliance needs, or high-traffic campaigns."
              isNightMode={isNightMode}
            />
          </div>
        </div>
        <div>
          <h3
            className="text-xl md:text-2xl font-bold mb-2 transition-colors duration-500"
            style={{ color: isNightMode ? '#F8F8F8' : '#1A1A1A' }}
          >
            Website Care
          </h3>
          <p
            className="text-sm md:text-base mb-6 transition-colors duration-500"
            style={{ color: isNightMode ? '#888888' : '#6B7280' }}
          >
            Monthly retainers after launch.
          </p>
          <div className="space-y-3">
            <PricingCard
              title="Care — Essentials"
              price="$500–$900/mo"
              description="Core maintenance: updates, backups, monitoring, and prioritized fixes so your site stays reliable."
              isNightMode={isNightMode}
            />
            <PricingCard
              title="Care — Growth"
              price="$1,200–$2,000/mo"
              description="More bandwidth for content changes, performance tuning, and proactive improvements."
              featured
              isNightMode={isNightMode}
            />
            <PricingCard
              title="Care — Enterprise"
              price="$2,500–$4,500/mo"
              description="Hands-on support for larger sites: faster turnaround, deeper technical work, and ongoing optimization."
              isNightMode={isNightMode}
            />
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
  const { isNightMode } = useTheme()
  const [openServiceId, setOpenServiceId] = useState<string | null>(() => services[0]?._id ?? null)

  const handleToggle = (id: string) => {
    setOpenServiceId((prev) => (prev === id ? null : id))
  }

  return (
    <div
      className="min-h-screen transition-colors duration-500"
      style={{ background: isNightMode ? '#000000' : '#FAFAFA' }}
    >
      <ServicesHero />

      <section
        id="services"
        className="relative px-6 md:px-12 lg:px-20 py-20 md:py-24 transition-colors duration-500"
        style={{ background: isNightMode ? '#000000' : '#FAFAFA' }}
      >
        <div className="max-w-5xl mx-auto">
          <motion.div
            className="mb-16 text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2
              className="text-3xl md:text-4xl font-bold transition-colors duration-500"
              style={{ color: isNightMode ? '#F8F8F8' : '#1A1A1A' }}
            >
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
                    className="group w-full text-left rounded-2xl p-6 md:p-8 border transition-all duration-500"
                    style={{
                      background: isNightMode ? (isOpen ? '#000000' : '#000000') : isOpen ? '#FAFAFA' : '#FAFAFA',
                      borderColor: isNightMode
                        ? isOpen
                          ? 'rgba(255,198,76,0.2)'
                          : 'rgba(255,255,255,0.08)'
                        : isOpen
                          ? 'rgba(180,83,9,0.2)'
                          : 'rgba(0,0,0,0.08)',
                      boxShadow: isOpen
                        ? isNightMode
                          ? '0 10px 40px rgba(0,0,0,0.5)'
                          : '0 10px 40px rgba(0,0,0,0.08)'
                        : 'none',
                      transition: 'background 0.5s ease, border-color 0.5s ease, box-shadow 0.5s ease',
                    }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-5">
                        <div
                          className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-500"
                          style={{
                            background: isOpen
                              ? 'var(--gold-gradient)'
                              : isNightMode
                                ? '#1A1A1A'
                                : '#F5F5F4',
                            color: isOpen ? '#FFFFFF' : isNightMode ? '#888888' : '#78716C',
                            boxShadow: isOpen ? 'var(--gold-shadow)' : 'none',
                            transition: 'background 0.5s ease, color 0.5s ease, box-shadow 0.5s ease',
                          }}
                        >
                          <Icon />
                        </div>

                        <div>
                          <h3
                            className="text-lg md:text-xl font-semibold transition-colors duration-500"
                            style={{ color: isNightMode ? '#F8F8F8' : '#1A1A1A' }}
                          >
                            {service.title}
                          </h3>
                          {service.description ? (
                            <p
                              className="mt-1 text-sm transition-colors duration-500"
                              style={{ color: isNightMode ? '#888888' : '#6B7280' }}
                            >
                              {service.description}
                            </p>
                          ) : null}
                        </div>
                      </div>

                      <div
                        className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center border transition-all duration-500"
                        style={{
                          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                          background: isOpen
                            ? isNightMode
                              ? 'rgba(255,198,76,0.1)'
                              : '#FEF3C7'
                            : isNightMode
                              ? '#000000'
                              : '#FAFAFA',
                          borderColor: isOpen
                            ? isNightMode
                              ? 'rgba(255,198,76,0.3)'
                              : 'rgba(180,83,9,0.3)'
                            : isNightMode
                              ? 'rgba(255,255,255,0.1)'
                              : 'rgba(0,0,0,0.1)',
                          color: isOpen
                            ? isNightMode
                              ? 'var(--gold-primary)'
                              : 'var(--gold-accent)'
                            : isNightMode
                              ? '#666666'
                              : '#9CA3AF',
                          transition: 'transform 0.5s ease, background 0.5s ease, border-color 0.5s ease, color 0.5s ease',
                        }}
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
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
                          <div
                            className="pt-8 mt-8 border-t transition-colors duration-500"
                            style={{ borderColor: isNightMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }}
                          >
                            <SanityServiceExpandedBody service={service} isNightMode={isNightMode} />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </button>
                </motion.div>
              )
            })}
          </div>

          <StandalonePricingSection isNightMode={isNightMode} />

          <motion.div
            className="mt-24 text-center"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
          >
            <p
              className="mb-6 transition-colors duration-500"
              style={{ color: isNightMode ? '#888888' : '#6B7280' }}
            >
              Ready to start your project?
            </p>
            <a
              href="/contact"
              className="inline-flex items-center gap-3 px-8 py-4 rounded-full text-sm font-semibold transition-all duration-500 group"
              style={{
                background: isNightMode ? '#F8F8F8' : '#1A1A1A',
                color: isNightMode ? '#1A1A1A' : '#FFFFFF',
                transition: 'background 0.5s ease, color 0.5s ease',
              }}
            >
              <span>Book a Strategy Call</span>
              <svg
                className="w-4 h-4 transition-transform group-hover:translate-x-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </a>
          </motion.div>
        </div>
      </section>
    </div>
  )
}

interface PricingCardProps {
  title: string
  price: string
  description: string
  featured?: boolean
  isNightMode: boolean
}

function PricingCard({ title, price, description, featured = false, isNightMode }: PricingCardProps) {
  return (
    <div
      className="relative p-5 rounded-xl border transition-all duration-500"
      style={{
        background: featured
          ? isNightMode
            ? 'linear-gradient(135deg, var(--gold-muted-subtle) 0%, color-mix(in srgb, var(--gold-accent) 5%, transparent) 100%)'
            : 'linear-gradient(135deg, rgba(254,243,199,0.8) 0%, rgba(255,237,213,0.6) 100%)'
          : isNightMode
            ? '#000000'
            : '#FAFAFA',
        borderColor: featured
          ? isNightMode
            ? 'var(--gold-muted-border)'
            : 'color-mix(in srgb, var(--gold-accent) 20%, transparent)'
          : isNightMode
            ? 'rgba(255,255,255,0.06)'
            : 'rgba(0,0,0,0.06)',
        transition: 'background 0.5s ease, border-color 0.5s ease',
      }}
    >
      {featured && (
        <span
          className="absolute -top-2 right-4 text-[10px] tracking-wider uppercase px-2 py-0.5 rounded-full font-medium"
          style={{ background: isNightMode ? 'var(--gold-primary)' : 'var(--gold-primary)', color: '#000000' }}
        >
          Popular
        </span>
      )}
      <div className="flex items-start justify-between gap-3 mb-3">
        <h4
          className="font-medium text-sm transition-colors duration-500"
          style={{ color: isNightMode ? '#F8F8F8' : '#1A1A1A' }}
        >
          {title}
        </h4>
        <span
          className="text-sm font-semibold whitespace-nowrap transition-colors duration-500"
          style={{ color: 'var(--gold-accent)' }}
        >
          {price}
        </span>
      </div>
      <p
        className="text-xs leading-relaxed transition-colors duration-500"
        style={{ color: isNightMode ? '#888888' : '#6B7280' }}
      >
        {description}
      </p>
    </div>
  )
}
