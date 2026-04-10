'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '@/contexts/ThemeContext'
import Link from 'next/link'
import ServicesHero from './ServicesHero'
import { trackCTAClick } from '@/lib/analytics'

type ServiceKey = 'strategy' | 'design' | 'dev' | 'refresh' | 'cms' | 'care'

interface Service {
  id: ServiceKey
  label: string
  tagline: string
}

const services: Service[] = [
  {
    id: 'strategy',
    label: 'Website Strategy',
    tagline:
      'Before we design anything, we map the site to your business goals, your buyers, and the trust signals that convert them.',
  },
  {
    id: 'design',
    label: 'Web Design',
    tagline:
      'Original, custom design built around your brand. No templates. No shortcuts. Every layout decision made with your buyer in mind.',
  },
  {
    id: 'dev',
    label: 'Web Development',
    tagline:
      'Custom Next.js and WordPress builds. Fast, clean, and easy for your team to update without touching code.',
  },
  {
    id: 'refresh',
    label: 'Website Refreshes',
    tagline:
      "Already have a site? We rebuild the structure, design, and performance without starting from scratch where it isn't needed.",
  },
  {
    id: 'cms',
    label: 'CMS Integrations',
    tagline:
      'Sanity, WordPress, and custom CMS setups that give your team control over content without depending on a developer for every change.',
  },
  {
    id: 'care',
    label: 'Website Care',
    tagline:
      'Monthly retainers for updates, monitoring, performance improvements, and ongoing support after launch.',
  },
]

// Service Icons
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

const iconMap = {
  strategy: StrategyIcon,
  design: DesignIcon,
  dev: WebIcon,
  refresh: RefreshIcon,
  cms: CmsIcon,
  care: CareIcon,
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

export default function ServicesPageClient() {
  const { isNightMode } = useTheme()
  const [openService, setOpenService] = useState<ServiceKey | null>('strategy')

  const handleToggle = (id: ServiceKey) => {
    setOpenService((prev) => (prev === id ? null : id))
  }

  return (
    <div 
      className="min-h-screen transition-colors duration-500"
      style={{ background: isNightMode ? '#000000' : '#FAFAFA' }}
    >
      {/* Hero */}
      <ServicesHero />

      {/* Services Accordion */}
      <section 
        id="services"
        className="relative px-6 md:px-12 lg:px-20 py-20 md:py-24 transition-colors duration-500"
        style={{ background: isNightMode ? '#000000' : '#FAFAFA' }}
      >
        <div className="max-w-5xl mx-auto">
          {/* Section Header */}
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

          {/* Service Cards */}
          <div className="space-y-3">
            {services.map((service, index) => {
              const isOpen = openService === service.id
              const Icon = iconMap[service.id]

              return (
                <motion.div
                  key={service.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30, delay: index * 0.05 }}
                >
                  <button
                    type="button"
                    onClick={() => handleToggle(service.id)}
                    className="group w-full text-left rounded-2xl p-6 md:p-8 border transition-all duration-500"
                    style={{
                      background: isNightMode 
                        ? (isOpen ? '#000000' : '#000000') 
                        : (isOpen ? '#FAFAFA' : '#FAFAFA'),
                      borderColor: isNightMode 
                        ? (isOpen ? 'rgba(255,198,76,0.2)' : 'rgba(255,255,255,0.08)') 
                        : (isOpen ? 'rgba(180,83,9,0.2)' : 'rgba(0,0,0,0.08)'),
                      boxShadow: isOpen
                        ? (isNightMode ? '0 10px 40px rgba(0,0,0,0.5)' : '0 10px 40px rgba(0,0,0,0.08)')
                        : 'none',
                      transition: 'background 0.5s ease, border-color 0.5s ease, box-shadow 0.5s ease',
                    }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-5">
                        {/* Icon */}
                        <div
                          className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-500"
                          style={{
                            background: isOpen 
                              ? 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)'
                              : (isNightMode ? '#1A1A1A' : '#F5F5F4'),
                            color: isOpen 
                              ? '#FFFFFF' 
                              : (isNightMode ? '#888888' : '#78716C'),
                            boxShadow: isOpen ? '0 8px 20px rgba(245,158,11,0.3)' : 'none',
                            transition: 'background 0.5s ease, color 0.5s ease, box-shadow 0.5s ease',
                          }}
                        >
                          <Icon />
                        </div>

                        {/* Text */}
                        <div>
                          <h3
                            className="text-lg md:text-xl font-semibold transition-colors duration-500"
                            style={{ color: isNightMode ? '#F8F8F8' : '#1A1A1A' }}
                          >
                            {service.label}
                          </h3>
                          <p
                            className="mt-1 text-sm transition-colors duration-500"
                            style={{ color: isNightMode ? '#888888' : '#6B7280' }}
                          >
                            {service.tagline}
                          </p>
                        </div>
                      </div>

                      {/* Arrow */}
                      <div
                        className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center border transition-all duration-500"
                        style={{
                          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                          background: isOpen 
                            ? (isNightMode ? 'rgba(255,198,76,0.1)' : '#FEF3C7')
                            : (isNightMode ? '#000000' : '#FAFAFA'),
                          borderColor: isOpen 
                            ? (isNightMode ? 'rgba(255,198,76,0.3)' : 'rgba(180,83,9,0.3)')
                            : (isNightMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'),
                          color: isOpen 
                            ? (isNightMode ? '#FFC64C' : '#B45309')
                            : (isNightMode ? '#666666' : '#9CA3AF'),
                          transition: 'transform 0.5s ease, background 0.5s ease, border-color 0.5s ease, color 0.5s ease',
                        }}
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>

                    {/* Expanded Content */}
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          key={`${service.id}-content`}
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
                            <ServiceContent id={service.id} isNightMode={isNightMode} />
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

          {/* Bottom CTA */}
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

/* ===== Service Content ===== */

interface ServiceContentProps {
  id: ServiceKey
  isNightMode: boolean
}

function ServiceContent({ id, isNightMode }: ServiceContentProps) {
  switch (id) {
    case 'strategy':
      return <StrategyContent isNightMode={isNightMode} />
    case 'design':
      return <DesignContent isNightMode={isNightMode} />
    case 'dev':
      return <DevContent isNightMode={isNightMode} />
    case 'refresh':
      return <RefreshContent isNightMode={isNightMode} />
    case 'cms':
      return <CmsContent isNightMode={isNightMode} />
    case 'care':
      return <CareContent isNightMode={isNightMode} />
    default:
      return null
  }
}

/* ===== Pricing Card ===== */

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
          ? (isNightMode 
              ? 'linear-gradient(135deg, rgba(255,198,76,0.1) 0%, rgba(217,119,6,0.05) 100%)'
              : 'linear-gradient(135deg, rgba(254,243,199,0.8) 0%, rgba(255,237,213,0.6) 100%)')
          : (isNightMode ? '#000000' : '#FAFAFA'),
        borderColor: featured
          ? (isNightMode ? 'rgba(255,198,76,0.2)' : 'rgba(217,119,6,0.2)')
          : (isNightMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'),
        transition: 'background 0.5s ease, border-color 0.5s ease',
      }}
    >
      {featured && (
        <span
          className="absolute -top-2 right-4 text-[10px] tracking-wider uppercase px-2 py-0.5 rounded-full font-medium"
          style={{ background: isNightMode ? '#FFC64C' : '#F59E0B', color: '#000000' }}
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
          style={{ color: isNightMode ? '#FFC64C' : '#B45309' }}
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

function CategoryLabel({ children, isNightMode }: { children: React.ReactNode; isNightMode: boolean }) {
  return (
    <h4 
      className="text-xs font-semibold tracking-wider uppercase mb-4 transition-colors duration-500"
      style={{ color: isNightMode ? '#666666' : '#9CA3AF' }}
    >
      {children}
    </h4>
  )
}


/* ===== Content Sections ===== */

function strategyCallLink() {
  return (
    <Link
      href="/contact"
      onClick={() => trackCTAClick('get_started', 'services')}
      className="inline-flex items-center gap-2 mt-4 font-semibold hover:opacity-80 transition-opacity"
      style={{ color: '#FFC64C' }}
    >
      Book a Strategy Call
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
      </svg>
    </Link>
  )
}

function StrategyContent({ isNightMode }: { isNightMode: boolean }) {
  return (
    <div className="space-y-8">
      <p
        className="leading-relaxed transition-colors duration-500"
        style={{ color: isNightMode ? '#888888' : '#6B7280' }}
      >
        Before we design anything, we map the site to your business goals, your buyers, and the trust signals that convert them.
      </p>
      {strategyCallLink()}
    </div>
  )
}

function DesignContent({ isNightMode }: { isNightMode: boolean }) {
  return (
    <div className="space-y-8">
      <p
        className="leading-relaxed transition-colors duration-500"
        style={{ color: isNightMode ? '#888888' : '#6B7280' }}
      >
        Original, custom design built around your brand. No templates. No shortcuts. Every layout decision is made with your buyer in mind — so the site earns trust and supports how you actually sell.
      </p>
      {strategyCallLink()}
    </div>
  )
}

function DevContent({ isNightMode }: { isNightMode: boolean }) {
  return (
    <div className="space-y-8">
      <p
        className="leading-relaxed transition-colors duration-500"
        style={{ color: isNightMode ? '#888888' : '#6B7280' }}
      >
        Custom Next.js and WordPress builds. Fast, clean, and easy for your team to update without touching code.
      </p>

      <div
        className="py-6 px-6 rounded-xl border"
        style={{
          background: isNightMode ? 'rgba(255, 255, 255, 0.03)' : 'rgba(255, 255, 255, 0.7)',
          borderColor: isNightMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
        }}
      >
        <p
          className="text-sm md:text-base leading-relaxed transition-colors duration-500"
          style={{ color: isNightMode ? 'rgba(255, 255, 255, 0.85)' : '#4B5563' }}
        >
          Every build includes SEO-friendly architecture, structured data, performance optimization, and mobile standards — built in from day one, not bolted on after.
        </p>
      </div>

      <div
        className="py-8 px-6 rounded-xl border text-center"
        style={{
          background: isNightMode ? 'rgba(255, 255, 255, 0.03)' : 'rgba(255, 255, 255, 0.7)',
          borderColor: isNightMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
        }}
      >
        <p
          className="text-xs font-semibold tracking-wider uppercase mb-3 transition-colors duration-500"
          style={{ color: isNightMode ? '#666666' : '#9CA3AF' }}
        >
          ENTERPRISE TECHNOLOGY
        </p>
        <h3
          className="text-lg md:text-xl font-semibold mb-4 transition-colors duration-500"
          style={{ color: isNightMode ? '#F8F8F8' : '#1A1A1A' }}
        >
          Built on the same technology as
        </h3>
        <div className="flex flex-wrap items-center justify-center gap-6 md:gap-8 mb-4">
          {['Nike', 'Netflix', 'TikTok', 'Notion', 'Target', 'OpenAI'].map((company, index) => (
            <span
              key={index}
              className="text-sm md:text-base font-medium transition-colors duration-500"
              style={{ color: isNightMode ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)' }}
            >
              {company}
            </span>
          ))}
        </div>
        <p
          className="text-sm leading-relaxed mb-3 max-w-2xl mx-auto transition-colors duration-500"
          style={{ color: isNightMode ? 'rgba(255, 255, 255, 0.6)' : '#6B7280' }}
        >
          We build on Next.js — the framework billion-dollar companies choose when performance and scale matter. You get the same speed, security, and search-friendly structure.
        </p>
        <Link
          href="/faq"
          className="inline-flex items-center gap-1 text-sm font-medium hover:opacity-80 transition-opacity"
          style={{ color: '#FFC64C' }}
        >
          Why Next.js?
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </Link>
      </div>

      {strategyCallLink()}
    </div>
  )
}

function RefreshContent({ isNightMode }: { isNightMode: boolean }) {
  return (
    <div className="space-y-8">
      <p
        className="leading-relaxed transition-colors duration-500"
        style={{ color: isNightMode ? '#888888' : '#6B7280' }}
      >
        Already have a site? We rebuild the structure, design, and performance without starting from scratch where it isn&apos;t needed — and we&apos;ll tell you honestly when a full rebuild is the better move.
      </p>
      {strategyCallLink()}
    </div>
  )
}

function CmsContent({ isNightMode }: { isNightMode: boolean }) {
  return (
    <div className="space-y-8">
      <p
        className="leading-relaxed transition-colors duration-500"
        style={{ color: isNightMode ? '#888888' : '#6B7280' }}
      >
        Sanity, WordPress, and custom CMS setups that give your team control over content without depending on a developer for every change.
      </p>

      <div className="grid sm:grid-cols-2 gap-3">
        <PricingCard
          title="CMS Integration"
          price="$3,000+"
          description="Sanity CMS setup with custom schemas for pages, blog, team, and services. Full training included."
          featured
          isNightMode={isNightMode}
        />
        <PricingCard
          title="Blog System"
          price="$1,500+"
          description="Full blog with categories, tags, authors, and structured metadata fields. Write and publish without touching code."
          isNightMode={isNightMode}
        />
        <PricingCard
          title="Portfolio / Case Studies"
          price="$2,000+"
          description="Dynamic case study pages you can manage. Add new projects as you complete them."
          isNightMode={isNightMode}
        />
        <PricingCard
          title="Content Migration"
          price="$500+"
          description="Move existing content from WordPress, Squarespace, or other platforms into your new CMS."
          isNightMode={isNightMode}
        />
      </div>

      {strategyCallLink()}
    </div>
  )
}

function CareContent({ isNightMode }: { isNightMode: boolean }) {
  return (
    <div className="space-y-8">
      <p
        className="leading-relaxed transition-colors duration-500"
        style={{ color: isNightMode ? '#888888' : '#6B7280' }}
      >
        Monthly retainers for updates, monitoring, performance improvements, and ongoing support after launch.
      </p>

      {strategyCallLink()}
    </div>
  )
}



