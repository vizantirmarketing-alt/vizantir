'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '@/contexts/ThemeContext'
import Link from 'next/link'
import ServicesHero from './ServicesHero'
import { trackCTAClick } from '@/lib/analytics'

type ServiceKey = 'web' | 'cms' | 'analytics' | 'seo' | 'integrations' | 'copywriting' | 'care'

// Map service IDs to individual service page slugs
const serviceSlugMap: Record<ServiceKey, string | null> = {
  'web': 'web-design',
  'cms': null,
  'analytics': null,
  'seo': 'seo',
  'integrations': null,
  'copywriting': null,
  'care': null,
}

interface Service {
  id: ServiceKey
  label: string
  tagline: string
}

const services: Service[] = [
  {
    id: 'web',
    label: 'Web Design & Development',
    tagline: 'Custom Next.js builds with enterprise SEO architecture — structured data, Core Web Vitals optimization, and AI-search readiness built in.',
  },
  {
    id: 'cms',
    label: 'Content Management',
    tagline: 'Sanity CMS integration so you can update content without a developer.',
  },
  {
    id: 'analytics',
    label: 'Analytics & Optimization',
    tagline: 'Track what matters. Test what works. Improve what converts.',
  },
  {
    id: 'seo',
    label: 'SEO & Search',
    tagline: 'Technical SEO, Local SEO, and AI search optimization that compounds over time.',
  },
  {
    id: 'integrations',
    label: 'Integrations',
    tagline: 'Connect your CRM, email, booking, and payment tools seamlessly.',
  },
  {
    id: 'copywriting',
    label: 'Copywriting',
    tagline: 'Conversion-focused copy that sounds like your brand, not a template.',
  },
  {
    id: 'care',
    label: 'Ongoing Support',
    tagline: 'Maintenance, updates, and growth retainers to keep momentum.',
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

const SeoIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
    <path d="M3 20l4-4m0 0l4-6 4 3 6-9" />
    <circle cx="7" cy="16" r="2" />
    <path d="M21 7v4h-4" />
  </svg>
)

const CareIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
    <path d="M12 21C12 21 4 14.5 4 9.5C4 5.36 7.58 3 12 3s8 2.36 8 6.5c0 5-8 11.5-8 11.5z" />
    <path d="M12 3v6m-3-3h6" />
  </svg>
)

const MarketingIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
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

const AnalyticsIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
    <path d="M4 20h16" />
    <path d="M4 20V10" />
    <path d="M8 20V14" />
    <path d="M12 20V8" />
    <path d="M16 20V12" />
    <path d="M20 20V4" />
  </svg>
)

const IntegrationsIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
    <circle cx="6" cy="6" r="3" />
    <circle cx="18" cy="6" r="3" />
    <circle cx="6" cy="18" r="3" />
    <circle cx="18" cy="18" r="3" />
    <path d="M6 9v6" />
    <path d="M18 9v6" />
    <path d="M9 6h6" />
    <path d="M9 18h6" />
  </svg>
)

const CopywritingIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
  </svg>
)

const iconMap = {
  web: WebIcon,
  cms: CmsIcon,
  analytics: AnalyticsIcon,
  seo: SeoIcon,
  integrations: IntegrationsIcon,
  copywriting: CopywritingIcon,
  care: CareIcon,
}

export default function ServicesPageClient() {
  const { isNightMode } = useTheme()
  const [openService, setOpenService] = useState<ServiceKey | null>('web')

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
              Everything you need to grow online
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
              <span>Get in touch</span>
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
    case 'web':
      return <WebContent isNightMode={isNightMode} />
    case 'cms':
      return <CmsContent isNightMode={isNightMode} />
    case 'analytics':
      return <AnalyticsContent isNightMode={isNightMode} />
    case 'seo':
      return <SeoContent isNightMode={isNightMode} />
    case 'integrations':
      return <IntegrationsContent isNightMode={isNightMode} />
    case 'copywriting':
      return <CopywritingContent isNightMode={isNightMode} />
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

function WebContent({ isNightMode }: { isNightMode: boolean }) {
  return (
    <div className="space-y-8">
      <p 
        className="leading-relaxed transition-colors duration-500"
        style={{ color: isNightMode ? '#888888' : '#6B7280' }}
      >
        Custom-built Next.js sites engineered for speed, SEO, and scale.
      </p>

      {/* Enterprise Technology Section */}
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
          We build on Next.js — the framework billion-dollar companies choose when performance and scale matter. You get the same speed, security, and SEO advantages.
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

      <div>
        <CategoryLabel isNightMode={isNightMode}>Next.js Websites</CategoryLabel>
        <div className="space-y-3">
          <PricingCard
            title="Foundation"
            price="$15,000+"
            description="5-10 pages. Custom Next.js build. Responsive design, smooth animations, SEO foundations. Clean, fast, and built to perform."
            isNightMode={isNightMode}
          />
          <PricingCard
            title="Growth"
            price="$30,000+"
            description="10-20 pages. Headless CMS integration. Custom animations, advanced SEO architecture, designed to convert and scale."
            featured
            isNightMode={isNightMode}
          />
          <PricingCard
            title="Premium"
            price="$60,000+"
            description="20+ pages or e-commerce. Complex animations, full CMS, third-party integrations. A complete digital presence built for serious brands."
            isNightMode={isNightMode}
          />
        </div>
      </div>

      <Link 
        href="/get-started" 
        onClick={() => trackCTAClick('get_started', 'services')}
        className="inline-flex items-center gap-2 mt-4 font-semibold hover:opacity-80 transition-opacity" 
        style={{ color: '#FFC64C' }}
      >
        Get Started
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
        </svg>
      </Link>
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
        Update your website without waiting on a developer. We integrate Sanity CMS so you can edit pages, add blog posts, update team members, and manage content from a simple dashboard.
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
          description="Full blog with categories, tags, authors, and SEO fields. Write and publish without touching code."
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

      <Link 
        href="/get-started" 
        onClick={() => trackCTAClick('get_started', 'services')}
        className="inline-flex items-center gap-2 mt-4 font-semibold hover:opacity-80 transition-opacity" 
        style={{ color: '#FFC64C' }}
      >
        Get Started
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
        </svg>
      </Link>
    </div>
  )
}

function AnalyticsContent({ isNightMode }: { isNightMode: boolean }) {
  return (
    <div className="space-y-8">
      <p 
        className="leading-relaxed transition-colors duration-500"
        style={{ color: isNightMode ? '#888888' : '#6B7280' }}
      >
        Stop guessing. We set up the tracking infrastructure so you can see exactly where visitors come from, what they do, and whether they convert — then help you improve it.
      </p>

      <div className="grid sm:grid-cols-2 gap-3">
        <PricingCard
          title="Analytics Setup"
          price="$500+"
          description="Google Analytics 4 and Tag Manager configured properly. Events, goals, and basic reporting."
          isNightMode={isNightMode}
        />
        <PricingCard
          title="Conversion Tracking"
          price="$800+"
          description="Track form submissions, phone clicks, button clicks, and purchases. Know your actual ROI."
          featured
          isNightMode={isNightMode}
        />
        <PricingCard
          title="Heatmaps & Recordings"
          price="$400+"
          description="Microsoft Clarity or Hotjar setup. See where users click, scroll, and get stuck."
          isNightMode={isNightMode}
        />
        <PricingCard
          title="A/B Testing"
          price="$600+"
          description="Test headlines, CTAs, layouts. Make decisions based on data, not opinions."
          isNightMode={isNightMode}
        />
        <PricingCard
          title="Full Analytics Stack"
          price="$1,500+"
          description="GA4 + GTM + Clarity + conversion tracking + custom dashboard. The complete picture."
          isNightMode={isNightMode}
        />
        <PricingCard
          title="Monthly Reporting"
          price="$300/mo"
          description="Monthly analytics report with insights and recommendations. Know what's working."
          isNightMode={isNightMode}
        />
      </div>

      <Link 
        href="/get-started" 
        onClick={() => trackCTAClick('get_started', 'services')}
        className="inline-flex items-center gap-2 mt-4 font-semibold hover:opacity-80 transition-opacity" 
        style={{ color: '#FFC64C' }}
      >
        Get Started
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
        </svg>
      </Link>
    </div>
  )
}

function SeoContent({ isNightMode }: { isNightMode: boolean }) {
  return (
    <div className="space-y-8">
      <p 
        className="leading-relaxed transition-colors duration-500"
        style={{ color: isNightMode ? '#888888' : '#6B7280' }}
      >
        SEO is a long-term engine, not a one-time setup. These programs build visibility and authority month after month, compounding your organic reach into sustainable revenue — including optimization for AI search engines.
      </p>

      <div>
        <CategoryLabel isNightMode={isNightMode}>Monthly Programs</CategoryLabel>
        <div className="grid sm:grid-cols-2 gap-3">
          <PricingCard
            title="Local SEO"
            price="$800/mo"
            description="Google Business Profile optimization, local schema, directory listings, review strategy."
            isNightMode={isNightMode}
          />
          <PricingCard
            title="Technical SEO"
            price="$1,200/mo"
            description="Site audits, schema markup, Core Web Vitals, sitemap optimization, crawl fixes."
            featured
            isNightMode={isNightMode}
          />
          <PricingCard
            title="Growth SEO"
            price="$2,000/mo"
            description="Content strategy, blog production, backlink outreach, competitor analysis."
            isNightMode={isNightMode}
          />
          <PricingCard
            title="Elite SEO"
            price="$3,000/mo"
            description="Authority building at scale. Advanced strategy, high-volume content, category dominance."
            isNightMode={isNightMode}
          />
        </div>
      </div>

      <div>
        <CategoryLabel isNightMode={isNightMode}>AI Search Optimization (AEO)</CategoryLabel>
        <div className="grid sm:grid-cols-2 gap-3">
          <PricingCard
            title="AEO Foundation"
            price="$1,000+"
            description="llms.txt setup, entity optimization, structured data for ChatGPT and Perplexity visibility."
            featured
            isNightMode={isNightMode}
          />
          <PricingCard
            title="AEO + SEO Bundle"
            price="$1,800/mo"
            description="Combined traditional SEO and AI search optimization. Future-proof your visibility."
            isNightMode={isNightMode}
          />
        </div>
        <p 
          className="mt-4 text-sm transition-colors duration-500"
          style={{ color: isNightMode ? '#666666' : '#9CA3AF' }}
        >
          AI search engines like ChatGPT and Perplexity are changing how people find information. AEO ensures your business appears in AI-generated answers, not just traditional search results.
        </p>
      </div>

      <Link 
        href="/get-started" 
        onClick={() => trackCTAClick('get_started', 'services')}
        className="inline-flex items-center gap-2 mt-4 font-semibold hover:opacity-80 transition-opacity" 
        style={{ color: '#FFC64C' }}
      >
        Get Started
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
        </svg>
      </Link>
    </div>
  )
}

function IntegrationsContent({ isNightMode }: { isNightMode: boolean }) {
  return (
    <div className="space-y-8">
      <p 
        className="leading-relaxed transition-colors duration-500"
        style={{ color: isNightMode ? '#888888' : '#6B7280' }}
      >
        Your website should work with your tools, not against them. We connect the platforms you already use so data flows automatically and nothing falls through the cracks.
      </p>

      <div className="grid sm:grid-cols-2 gap-3">
        <PricingCard
          title="CRM Integration"
          price="$500+"
          description="HubSpot, Salesforce, Pipedrive, Zoho — form submissions flow directly into your pipeline."
          featured
          isNightMode={isNightMode}
        />
        <PricingCard
          title="Email Marketing"
          price="$400+"
          description="Mailchimp, Klaviyo, ConvertKit — capture leads and trigger automated sequences."
          isNightMode={isNightMode}
        />
        <PricingCard
          title="Booking & Scheduling"
          price="$300+"
          description="Calendly, Cal.com, Acuity — let visitors book directly without back-and-forth."
          isNightMode={isNightMode}
        />
        <PricingCard
          title="Payments"
          price="$800+"
          description="Stripe, Square, PayPal — accept payments, deposits, or subscriptions on-site."
          isNightMode={isNightMode}
        />
        <PricingCard
          title="Chat & Support"
          price="$300+"
          description="Intercom, Drift, LiveChat — engage visitors in real-time."
          isNightMode={isNightMode}
        />
        <PricingCard
          title="Custom Automation"
          price="$600+"
          description="Zapier workflows, webhooks, API connections. Your stack, working together."
          isNightMode={isNightMode}
        />
      </div>

      <Link 
        href="/get-started" 
        onClick={() => trackCTAClick('get_started', 'services')}
        className="inline-flex items-center gap-2 mt-4 font-semibold hover:opacity-80 transition-opacity" 
        style={{ color: '#FFC64C' }}
      >
        Get Started
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
        </svg>
      </Link>
    </div>
  )
}

function CopywritingContent({ isNightMode }: { isNightMode: boolean }) {
  return (
    <div className="space-y-8">
      <p 
        className="leading-relaxed transition-colors duration-500"
        style={{ color: isNightMode ? '#888888' : '#6B7280' }}
      >
        Great design with weak copy doesn't convert. We write website copy that sounds like your brand, speaks to your audience, and moves people to act.
      </p>

      <div className="grid sm:grid-cols-2 gap-3">
        <PricingCard
          title="Website Copy"
          price="$150/page"
          description="Homepage, about, services — conversion-focused copy that blends clarity with SEO intent."
          featured
          isNightMode={isNightMode}
        />
        <PricingCard
          title="Landing Page Copy"
          price="$400+"
          description="Single-purpose pages built to convert. Headlines, benefits, CTAs, objection handling."
          isNightMode={isNightMode}
        />
        <PricingCard
          title="Blog Posts"
          price="$200/post"
          description="SEO-optimized articles that rank and establish authority. 1,000-2,000 words."
          isNightMode={isNightMode}
        />
        <PricingCard
          title="Email Sequences"
          price="$500+"
          description="Welcome series, nurture campaigns, re-engagement flows. Copy that converts over time."
          isNightMode={isNightMode}
        />
      </div>

      <Link 
        href="/get-started" 
        onClick={() => trackCTAClick('get_started', 'services')}
        className="inline-flex items-center gap-2 mt-4 font-semibold hover:opacity-80 transition-opacity" 
        style={{ color: '#FFC64C' }}
      >
        Get Started
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
        </svg>
      </Link>
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
        Your website is an asset that needs care. We offer ongoing support to keep it secure, fast, and growing — so you can focus on your business.
      </p>

      <div>
        <CategoryLabel isNightMode={isNightMode}>Website Care</CategoryLabel>
        <div className="grid sm:grid-cols-3 gap-3">
          <PricingCard
            title="Essential"
            price="$149/mo"
            description="Weekly backups, security scans, uptime monitoring, plugin updates. Peace of mind."
            isNightMode={isNightMode}
          />
          <PricingCard
            title="Complete"
            price="$299/mo"
            description="Everything in Essential plus content edits, image optimization, and priority support."
            featured
            isNightMode={isNightMode}
          />
          <PricingCard
            title="Next.js Care"
            price="$499/mo"
            description="Deployment management, version upgrades, build monitoring, performance optimization."
            isNightMode={isNightMode}
          />
        </div>
      </div>

      <div>
        <CategoryLabel isNightMode={isNightMode}>Growth Retainer</CategoryLabel>
        <div className="grid sm:grid-cols-2 gap-3">
          <PricingCard
            title="Growth Lite"
            price="$1,000/mo"
            description="Monthly analytics review, conversion recommendations, 5 hours of updates or improvements."
            isNightMode={isNightMode}
          />
          <PricingCard
            title="Growth Pro"
            price="$2,500/mo"
            description="Full optimization: A/B testing, CRO, new features, priority support, 15 hours/month."
            featured
            isNightMode={isNightMode}
          />
        </div>
        <p 
          className="mt-4 text-sm transition-colors duration-500"
          style={{ color: isNightMode ? '#666666' : '#9CA3AF' }}
        >
          Growth retainers are for businesses that want continuous improvement — not just maintenance. We actively work to increase your conversions month over month.
        </p>
      </div>
    </div>
  )
}



