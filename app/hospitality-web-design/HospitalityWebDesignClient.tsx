'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { VerticalBadge } from '@/components/ui/VerticalBadge'
import {
  ArrowRight,
  Zap,
  CalendarCheck,
  Smartphone,
  Palette,
  CheckCircle2,
  UtensilsCrossed,
} from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import { trackPhoneClick } from '@/lib/analytics'

export default function HospitalityWebDesignClient() {
  const { isNightMode } = useTheme()

  const colors = {
    bg: isNightMode ? '#000000' : '#FAFAFA',
    text: isNightMode ? '#F8F8F8' : '#1A1A1A',
    textMuted: isNightMode ? '#9CA3AF' : '#6B6B6B',
    accent: '#FFC64C',
    cardBg: isNightMode ? '#0A0A0A' : '#FFFFFF',
    cardBorder: isNightMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
    divider: isNightMode
      ? 'linear-gradient(90deg, transparent, rgba(255,198,76,0.3), transparent)'
      : 'linear-gradient(90deg, transparent, rgba(180,83,9,0.3), transparent)',
  }

  const whyCards = [
    {
      icon: CalendarCheck,
      title: 'Reservation-Forward Design',
      description:
        'Layouts that guide guests to book, not just browse',
    },
    {
      icon: Zap,
      title: 'Next.js Performance',
      description: 'Fast load times that keep high-intent visitors from bouncing',
    },
    {
      icon: Smartphone,
      title: 'Mobile-First Builds',
      description:
        'Most hospitality searches happen on mobile; we build for that first',
    },
    {
      icon: Palette,
      title: 'Brand-Aligned Visuals',
      description:
        'Design that matches the atmosphere and quality of the venue',
    },
  ]

  const industryBullets = [
    'Experience with restaurants, hotels, lounges, and event venues',
    'Deep understanding of hospitality guest journeys',
    'Designs that communicate quality before the first visit',
    'Builds optimized for OpenTable, Resy, and direct booking integrations',
  ]

  const venueTypes = [
    'Restaurants & chef-led concepts',
    'Hotels & boutique properties',
    'Lounges & nightlife',
    'Event venues & private dining',
  ]

  const workIncludes = [
    'Custom visual design aligned to your brand and atmosphere',
    'Mobile-first responsive layout',
    'Reservation and booking system integration',
    'Menu, events, and gallery pages',
    'Local SEO optimization for restaurant and hotel searches',
    'Post-launch care and content updates',
  ]

  const faqs = [
    {
      question: 'How much does a restaurant website cost?',
      answer:
        'Custom restaurant websites at Vizantir start at $15,000. The investment covers strategy, design, development, and CMS integration so your team can update menus and events without a developer.',
    },
    {
      question: 'Can you integrate with OpenTable or Resy?',
      answer:
        'Yes. We build reservation integrations directly into the site so guests can book without leaving your page.',
    },
    {
      question: 'How long does it take to build a restaurant website?',
      answer:
        'Most hospitality projects take 6-10 weeks from kickoff to launch, depending on scope and content readiness.',
    },
    {
      question: 'Do you work with hotels as well as restaurants?',
      answer:
        'Yes. We work with restaurants, hotels, lounges, event venues, and other hospitality businesses across the US.',
    },
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: 'easeOut' as const },
    },
  }

  return (
    <main style={{ background: colors.bg }} className="transition-colors duration-500">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center px-6 md:px-12 lg:px-20 pt-32 pb-20 overflow-hidden">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background: isNightMode
              ? 'radial-gradient(ellipse at top right, rgba(255,198,76,0.15), transparent 60%)'
              : 'radial-gradient(ellipse at top right, rgba(255,198,76,0.2), transparent 60%)',
          }}
        />

        <div className="relative z-10 max-w-6xl mx-auto text-center">
          <VerticalBadge icon={UtensilsCrossed} label="Restaurants · Hotels · Lounges" isNightMode={isNightMode} />

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black mb-6 leading-[1.1]"
            style={{ color: colors.text }}
          >
            Hospitality Web Design
            <br />
            <span style={{ color: colors.accent }}>That Fills Tables</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg md:text-xl max-w-3xl mx-auto mb-10"
            style={{ color: colors.textMuted, lineHeight: 1.7 }}
          >
            We build custom websites for restaurants, hotels, and hospitality groups — designed to
            drive reservations, build brand presence, and convert visitors into guests.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Button
              size="lg"
              asChild
              className="text-base px-8 py-6 font-semibold border-0 transition-all duration-300 hover:scale-105 group"
              style={{
                background: colors.accent,
                color: '#1A1A1A',
                borderRadius: '12px',
              }}
            >
              <Link href="/contact">
                Book a Strategy Call
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="text-base px-8 py-6 font-semibold transition-all duration-300 hover:scale-105"
              style={{
                borderColor: isNightMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
                color: colors.text,
                borderRadius: '12px',
                background: 'transparent',
              }}
            >
              <Link href="/case-studies">View Our Work</Link>
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="mt-12 flex flex-wrap justify-center gap-8"
          >
            {[
              { value: 'Next.js', label: 'Built' },
              { value: 'Mobile', label: 'First' },
              { value: '10+', label: 'Years Experience' },
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-2xl md:text-3xl font-bold" style={{ color: colors.accent }}>
                  {stat.value}
                </div>
                <div className="text-sm" style={{ color: colors.textMuted }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      <div className="w-full h-px" style={{ background: colors.divider }} />

      {/* Why Choose Us */}
      <section className="px-6 md:px-12 lg:px-20 py-20">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <span
              className="inline-block text-xs tracking-[0.25em] uppercase font-medium mb-4"
              style={{ color: colors.accent }}
            >
              Why Choose Us
            </span>
            <h2
              className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6"
              style={{ color: colors.text }}
            >
              Web Design Built for Hospitality
            </h2>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: colors.textMuted }}>
              From fine dining to boutique hotels, we build websites that reflect the experience guests
              can expect before they ever walk through the door.
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {whyCards.map((card, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="p-6 rounded-2xl border transition-all duration-300 hover:-translate-y-1"
                style={{
                  background: colors.cardBg,
                  borderColor: colors.cardBorder,
                }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: `${colors.accent}15` }}
                >
                  <card.icon size={24} style={{ color: colors.accent }} />
                </div>
                <h3 className="text-lg font-bold mb-2" style={{ color: colors.text }}>
                  {card.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: colors.textMuted }}>
                  {card.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <div className="w-full h-px" style={{ background: colors.divider }} />

      {/* Industry Expertise */}
      <section className="px-6 md:px-12 lg:px-20 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <span
                className="inline-block text-xs tracking-[0.25em] uppercase font-medium mb-4"
                style={{ color: colors.accent }}
              >
                Industry Expertise
              </span>
              <h2 className="text-3xl md:text-4xl font-bold mb-6" style={{ color: colors.text }}>
                We Understand Hospitality Businesses
              </h2>
              <p
                className="text-lg mb-6"
                style={{ color: colors.textMuted, lineHeight: 1.7 }}
              >
                Hospitality websites need to do more than look good. They need to drive reservations,
                communicate atmosphere, and work flawlessly on every device.
              </p>
              <ul className="space-y-3">
                {industryBullets.map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle2
                      size={20}
                      className="flex-shrink-0 mt-0.5"
                      style={{ color: colors.accent }}
                    />
                    <span style={{ color: colors.textMuted }}>{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="p-8 rounded-2xl border"
              style={{
                background: colors.cardBg,
                borderColor: colors.cardBorder,
              }}
            >
              <h3 className="text-xl font-bold mb-4" style={{ color: colors.text }}>
                Venue types
              </h3>
              <p className="text-sm mb-6" style={{ color: colors.textMuted }}>
                Hospitality concepts we support:
              </p>
              <ul className="space-y-3">
                {venueTypes.map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle2
                      size={20}
                      className="flex-shrink-0 mt-0.5"
                      style={{ color: colors.accent }}
                    />
                    <span className="text-sm" style={{ color: colors.textMuted }}>
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      <div className="w-full h-px" style={{ background: colors.divider }} />

      {/* What the work includes */}
      <section className="px-6 md:px-12 lg:px-20 py-20">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <h2
              className="text-3xl md:text-4xl lg:text-5xl font-bold"
              style={{ color: colors.text }}
            >
              Everything Your Hospitality Site Needs
            </h2>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {workIncludes.map((line, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="p-6 rounded-2xl border transition-all duration-300 hover:-translate-y-1"
                style={{
                  background: colors.cardBg,
                  borderColor: colors.cardBorder,
                }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: `${colors.accent}15` }}
                >
                  <CheckCircle2 size={24} style={{ color: colors.accent }} />
                </div>
                <p className="text-sm leading-relaxed font-medium" style={{ color: colors.text }}>
                  {line}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <div className="w-full h-px" style={{ background: colors.divider }} />

      {/* FAQ Section */}
      <section className="px-6 md:px-12 lg:px-20 py-20">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <span
              className="inline-block text-xs tracking-[0.25em] uppercase font-medium mb-4"
              style={{ color: colors.accent }}
            >
              FAQ
            </span>
            <h2 className="text-3xl md:text-4xl font-bold" style={{ color: colors.text }}>
              Hospitality Web Design Questions
            </h2>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="space-y-4"
          >
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="p-6 rounded-2xl border"
                style={{
                  background: colors.cardBg,
                  borderColor: colors.cardBorder,
                }}
              >
                <h3 className="text-lg font-semibold mb-3" style={{ color: colors.text }}>
                  {faq.question}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: colors.textMuted }}>
                  {faq.answer}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <div className="w-full h-px" style={{ background: colors.divider }} />

      {/* CTA Section */}
      <section className="px-6 md:px-12 lg:px-20 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2
              className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6"
              style={{ color: colors.text }}
            >
              Ready to Elevate Your Hospitality Brand?
            </h2>
            <p
              className="text-lg mb-10 max-w-2xl mx-auto"
              style={{ color: colors.textMuted }}
            >
              Let&apos;s talk about your project. No commitment, no pressure — just a conversation
              about what your site needs.
            </p>
            <Button
              size="lg"
              asChild
              className="text-base px-10 py-6 font-semibold border-0 transition-all duration-300 hover:scale-105 group"
              style={{
                background: colors.accent,
                color: '#1A1A1A',
                borderRadius: '12px',
              }}
            >
              <Link href="/contact">
                Book a Strategy Call
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <p className="mt-6 text-sm" style={{ color: colors.textMuted }}>
              Or call us:{' '}
              <a
                href="tel:+17022890758"
                onClick={trackPhoneClick}
                style={{ color: colors.accent }}
              >
                (702) 289-0758
              </a>
            </p>
          </motion.div>
        </div>
      </section>
    </main>
  )
}
