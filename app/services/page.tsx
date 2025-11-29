'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '@/contexts/ThemeContext'
import ServicesHero from './ServicesHero'

type ServiceKey = 'web' | 'seo' | 'care' | 'marketing' | 'addons'

interface Service {
  id: ServiceKey
  label: string
  tagline: string
}

const services: Service[] = [
  {
    id: 'web',
    label: 'Website Design & Development',
    tagline: 'WordPress for speed to market. Next.js for cinematic performance.',
  },
  {
    id: 'seo',
    label: 'SEO & Growth Programs',
    tagline: 'Visibility systems that compound authority month over month.',
  },
  {
    id: 'care',
    label: 'Website Care Packages',
    tagline: 'Hands-off maintenance. Always secure, always fast.',
  },
  {
    id: 'marketing',
    label: 'Digital Marketing',
    tagline: 'Campaigns engineered to turn attention into revenue.',
  },
  {
    id: 'addons',
    label: 'Brand & Technical Add-Ons',
    tagline: 'Strategic upgrades that sharpen your edge.',
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

const AddOnsIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
    <path d="M12 2L2 7l10 5 10-5-10-5z" />
    <path d="M2 17l10 5 10-5" />
    <path d="M2 12l10 5 10-5" />
  </svg>
)

const iconMap: Record<ServiceKey, () => JSX.Element> = {
  web: WebIcon,
  seo: SeoIcon,
  care: CareIcon,
  marketing: MarketingIcon,
  addons: AddOnsIcon,
}

export default function ServicesPage() {
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
        className="relative px-6 md:px-12 lg:px-20 py-24 transition-colors duration-500"
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
              Full-service digital solutions
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
    case 'seo':
      return <SeoContent isNightMode={isNightMode} />
    case 'care':
      return <CareContent isNightMode={isNightMode} />
    case 'marketing':
      return <MarketingContent isNightMode={isNightMode} />
    case 'addons':
      return <AddOnsContent isNightMode={isNightMode} />
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
        Choose the platform that matches your goals. WordPress for a fast, flexible launch you can manage yourself.
        Next.js for cinematic performance and a technical foundation that scales.
      </p>

      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <CategoryLabel isNightMode={isNightMode}>WordPress Websites</CategoryLabel>
          <div className="space-y-3">
            <PricingCard
              title="Starter"
              price="$2,500+"
              description="5–8 pages. Clean, modern design. Mobile-friendly. Basic SEO foundations. Ready to launch."
              isNightMode={isNightMode}
            />
            <PricingCard
              title="Growth"
              price="$4,000+"
              description="8–12 pages. Custom layouts. Stronger visuals. Flows designed to build trust and capture leads."
              featured
              isNightMode={isNightMode}
            />
            <PricingCard
              title="Premium"
              price="$6,000+"
              description="12+ pages. Animations. Booking systems. Memberships. A polished presence that feels established."
              isNightMode={isNightMode}
            />
          </div>
        </div>

        <div>
          <CategoryLabel isNightMode={isNightMode}>Next.js Websites</CategoryLabel>
          <div className="space-y-3">
            <PricingCard
              title="Cinematic"
              price="$8,000+"
              description="Ultra-fast. Smooth motion. Parallax. Micro-interactions. Premium on every device."
              isNightMode={isNightMode}
            />
            <PricingCard
              title="With Back-End"
              price="$10,000+"
              description="User auth. Dashboards. APIs. Payments. Memberships. Function meets design."
              featured
              isNightMode={isNightMode}
            />
            <PricingCard
              title="Enterprise"
              price="$15,000+"
              description="Custom component library. Headless CMS. Security-hardened. Built to scale."
              isNightMode={isNightMode}
            />
          </div>
        </div>
      </div>

      <div
        className="grid md:grid-cols-2 gap-4 p-5 rounded-xl border transition-all duration-500"
        style={{ 
          background: isNightMode ? '#000000' : '#FAFAFA',
          borderColor: isNightMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
          transition: 'background 0.5s ease, border-color 0.5s ease',
        }}
      >
        <div>
          <p 
            className="text-xs font-semibold mb-2 transition-colors duration-500"
            style={{ color: isNightMode ? '#F8F8F8' : '#1A1A1A' }}
          >
            WordPress is best when…
          </p>
          <p 
            className="text-xs leading-relaxed transition-colors duration-500"
            style={{ color: isNightMode ? '#888888' : '#6B7280' }}
          >
            You want a flexible marketing site you can update often, with a familiar editor and faster path from idea to launch.
          </p>
        </div>
        <div>
          <p 
            className="text-xs font-semibold mb-2 transition-colors duration-500"
            style={{ color: isNightMode ? '#F8F8F8' : '#1A1A1A' }}
          >
            Next.js is best when…
          </p>
          <p 
            className="text-xs leading-relaxed transition-colors duration-500"
            style={{ color: isNightMode ? '#888888' : '#6B7280' }}
          >
            You want cinematic UX, peak performance, and a technical base that supports products, portals, or a larger ecosystem.
          </p>
        </div>
      </div>
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
        SEO is a long-term engine, not a one-time setup. These programs build visibility and authority month after month,
        compounding your organic reach into sustainable revenue.
      </p>

      <div className="grid sm:grid-cols-2 gap-3">
        <PricingCard
          title="Local SEO"
          price="$800/mo"
          description="Google Maps optimization. Business profile management. Directory listings. Review strategy for local dominance."
          isNightMode={isNightMode}
        />
        <PricingCard
          title="Core SEO"
          price="$1,200/mo"
          description="Technical cleanup. Metadata & schema. On-page adjustments. Speed improvements. Monthly health checks."
          featured
          isNightMode={isNightMode}
        />
        <PricingCard
          title="Growth SEO"
          price="$2,000/mo"
          description="Blog production. Backlink outreach. Competitor analysis. Strategy for aggressive organic traffic goals."
          isNightMode={isNightMode}
        />
        <PricingCard
          title="Elite SEO"
          price="$3,000/mo"
          description="Authority building at scale. Advanced strategy. High-volume content. For brands ready to dominate their category."
          isNightMode={isNightMode}
        />
      </div>
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
        Your website should feel stable, protected, and looked after. These care programs keep things running
        smoothly while you focus on the business.
      </p>

      <div className="grid sm:grid-cols-3 gap-3">
        <PricingCard
          title="Essential"
          price="$149/mo"
          description="Weekly backups. Plugin & core updates. Uptime monitoring. Security scans. Basic support for peace of mind."
          isNightMode={isNightMode}
        />
        <PricingCard
          title="Complete"
          price="$299/mo"
          description="Everything in Essential plus content edits, on-page optimization, image compression, and priority support."
          featured
          isNightMode={isNightMode}
        />
        <PricingCard
          title="Next.js"
          price="$499/mo"
          description="Deployment management. Version upgrades. Build monitoring. Issue response for advanced Next.js setups."
          isNightMode={isNightMode}
        />
      </div>
    </div>
  )
}

function MarketingContent({ isNightMode }: { isNightMode: boolean }) {
  return (
    <div className="space-y-8">
      <p 
        className="leading-relaxed transition-colors duration-500"
        style={{ color: isNightMode ? '#888888' : '#6B7280' }}
      >
        Campaigns designed to do more than reach people—engineered to convert attention into measurable,
        trackable revenue.
      </p>

      <div className="grid sm:grid-cols-2 gap-3">
        <PricingCard
          title="PPC Management"
          price="$800/mo + spend"
          description="Google & Meta campaigns. Proper tracking. Keyword intent. Creative testing. Performance reporting."
          featured
          isNightMode={isNightMode}
        />
        <PricingCard
          title="Social Advertising"
          price="$700/mo"
          description="Paid campaigns on Instagram, Facebook, and LinkedIn. Awareness, lead gen, and retargeting."
          isNightMode={isNightMode}
        />
        <PricingCard
          title="Landing Pages"
          price="$1,000+"
          description="Focused pages built for a single purpose—booking, lead capture, or product purchase."
          isNightMode={isNightMode}
        />
        <PricingCard
          title="Analytics Setup"
          price="$300+"
          description="GA4 setup. Event tracking. Dashboards. Simple reporting that shows what's actually happening."
          isNightMode={isNightMode}
        />
      </div>
    </div>
  )
}

function AddOnsContent({ isNightMode }: { isNightMode: boolean }) {
  return (
    <div className="space-y-8">
      <p 
        className="leading-relaxed transition-colors duration-500"
        style={{ color: isNightMode ? '#888888' : '#6B7280' }}
      >
        When you want to sharpen your brand, tell a clearer story, or connect more tools behind the scenes—
        these add-ons extend what your site can do.
      </p>

      <div className="grid sm:grid-cols-2 gap-3">
        <PricingCard
          title="Brand Identity"
          price="$500+"
          description="Logo. Color palette. Typography. Usage guidance. Everything you need to appear consistent online."
          isNightMode={isNightMode}
        />
        <PricingCard
          title="Content Writing"
          price="$150/page"
          description="Website copy and blog content that blends clarity with SEO intent. Sounds like your brand, not a template."
          featured
          isNightMode={isNightMode}
        />
        <PricingCard
          title="Hosting Setup"
          price="$200+"
          description="Hosting selection. Migration. SSL. CDN. Basic security hardening. Backup configuration."
          isNightMode={isNightMode}
        />
        <PricingCard
          title="Integrations"
          price="Custom"
          description="CRMs. Booking tools. Payment gateways. Email platforms. Automations. Your stack, working together."
          isNightMode={isNightMode}
        />
      </div>
    </div>
  )
}