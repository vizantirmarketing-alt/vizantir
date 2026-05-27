'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Eyebrow } from '@/components/ui/Eyebrow'
import SectionDivider from '@/components/ui/SectionDivider'
import { VerticalBadge } from '@/components/ui/VerticalBadge'
import {
  ArrowRight,
  Building2,
  Award,
  Target,
  Zap,
  CheckCircle2,
} from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import { trackPhoneClick } from '@/lib/analytics'

export default function CREWebDesignClient() {
  const { isNightMode } = useTheme()

  const colors = {
    bg: isNightMode ? '#000000' : '#FAFAFA',
    text: isNightMode ? '#F8F8F8' : '#1A1A1A',
    textMuted: isNightMode ? '#9CA3AF' : '#6B6B6B',
    accent: 'var(--gold-primary)',
    cardBg: isNightMode ? '#0A0A0A' : '#FFFFFF',
    cardBorder: isNightMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
    divider: isNightMode
      ? 'linear-gradient(90deg, transparent, rgba(255,198,76,0.3), transparent)'
      : 'linear-gradient(90deg, transparent, rgba(180,83,9,0.3), transparent)',
  }

  const whyCards = [
    {
      icon: Building2,
      title: 'Property Showcase Design',
      description:
        'Layouts built to present listings, portfolios, and developments clearly',
    },
    {
      icon: Award,
      title: 'Authority-First Positioning',
      description: 'Design that signals market expertise and firm credibility',
    },
    {
      icon: Target,
      title: 'Lead Generation Focus',
      description: 'Clear pathways for qualified prospects to make contact',
    },
    {
      icon: Zap,
      title: 'Next.js Performance',
      description:
        'Fast, scalable builds that handle large property portfolios',
    },
  ]

  const industryBullets = [
    'Experience with brokerages, developers, and property management groups',
    'Understanding of CRE deal cycles and how buyers and tenants research online',
    'Designs that present market authority without sacrificing usability',
    'Builds structured for property listings, team pages, and market reports',
  ]

  const organizationTypes = [
    'CRE brokerages & advisory firms',
    'Developers & property owners',
    'Property management groups',
    'Investment firms & capital partners',
  ]

  const workIncludes = [
    'Custom visual design aligned to firm positioning and market focus',
    'Property and listing pages with CMS integration',
    'Team and broker profile pages',
    'Lead capture and inquiry forms',
    'Market report and insights section',
    'Post-launch care and content updates',
  ]

  const faqs = [
    {
      question: 'How much does a commercial real estate website cost?',
      answer:
        'Custom CRE websites at Vizantir start at $15,000. The investment covers strategy, design, development, and CMS so your team can manage listings and content without a developer.',
    },
    {
      question: 'Can you integrate property listings into the site?',
      answer:
        'Yes. We build CMS-driven listing pages so your team can add, update, and remove properties without touching code.',
    },
    {
      question: 'How long does it take to build a CRE website?',
      answer:
        'Most commercial real estate projects take 6-10 weeks from kickoff to launch depending on the number of listings and pages required.',
    },
    {
      question: 'Do you work with developers and property management firms as well as brokerages?',
      answer:
        'Yes. We work with brokerages, developers, property management groups, and investment firms across the US.',
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
          className="absolute inset-0"
          style={{
            background: isNightMode
              ? 'radial-gradient(ellipse at top right, rgba(255, 198, 76, 0.08), transparent 60%)'
              : 'radial-gradient(ellipse at top right, rgba(180, 83, 9, 0.05), transparent 60%)',
          }}
        />

        <div className="relative z-10 max-w-6xl mx-auto text-center">
          <VerticalBadge icon={Building2} label="CRE Firms · Brokerages · Property Groups" isNightMode={isNightMode} />

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black mb-6 leading-[1.05]"
            style={{ color: colors.text }}
          >
            Commercial Real Estate
            <br />
            <span style={{ color: colors.accent }}>Web Design That Converts</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg md:text-xl max-w-3xl mx-auto mb-10"
            style={{ color: colors.textMuted, lineHeight: 1.7 }}
          >
            We build custom websites for commercial real estate firms and brokerages — designed to
            showcase properties, establish market authority, and generate qualified inquiries.
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
              className="rounded-xl px-8 py-4 text-base font-semibold transition-all duration-300 hover:scale-[1.02] group"
              style={{
                background: 'var(--gold-gradient)',
                color: '#1A1A1A',
                boxShadow: 'var(--gold-shadow)',
              }}
            >
              <Link href="/contact">
                Book a Strategy Call
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Link
              href="/case-studies"
              className="inline-flex items-center gap-2 text-base font-semibold transition-colors duration-300 group"
              style={{ color: 'var(--gold-accent)' }}
            >
              View Our Work
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
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

      <SectionDivider />

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
            <Eyebrow>Why Choose Us</Eyebrow>
            <h2
              className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6"
              style={{ color: colors.text }}
            >
              Web Design Built for Commercial Real Estate
            </h2>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: colors.textMuted }}>
              CRE firms need websites that communicate market expertise, showcase properties
              professionally, and make it easy for prospects to reach the right person.
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
                  style={{
                    background: isNightMode ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.02)',
                  }}
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

      <SectionDivider />

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
              <Eyebrow align="start">Industry Expertise</Eyebrow>
              <h2 className="text-3xl md:text-4xl font-bold mb-6" style={{ color: colors.text }}>
                We Understand CRE Firms and Brokerages
              </h2>
              <p
                className="text-lg mb-6"
                style={{ color: colors.textMuted, lineHeight: 1.7 }}
              >
                Commercial real estate websites need to serve multiple audiences — investors,
                tenants, and partners — while maintaining a consistent, authoritative brand presence.
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
                Organization types
              </h3>
              <p className="text-sm mb-6" style={{ color: colors.textMuted }}>
                CRE organizations we support:
              </p>
              <ul className="space-y-3">
                {organizationTypes.map((item, index) => (
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

      <SectionDivider />

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
              Everything Your CRE Site Needs
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
                  style={{
                    background: isNightMode ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.02)',
                  }}
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

      <SectionDivider />

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
            <Eyebrow>FAQ</Eyebrow>
            <h2 className="text-3xl md:text-4xl font-bold" style={{ color: colors.text }}>
              Commercial Real Estate Web Design Questions
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

      <SectionDivider />

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
              Ready to Present Your Firm at the Level Your Work Deserves?
            </h2>
            <p
              className="text-lg mb-10 max-w-2xl mx-auto"
              style={{ color: colors.textMuted }}
            >
              Let&apos;s talk about your project and whether Vizantir is the right fit to build it.
            </p>
            <Button
              size="lg"
              asChild
              className="rounded-xl px-8 py-4 text-base font-semibold transition-all duration-300 hover:scale-[1.02] group"
              style={{
                background: 'var(--gold-gradient)',
                color: '#1A1A1A',
                boxShadow: 'var(--gold-shadow)',
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
