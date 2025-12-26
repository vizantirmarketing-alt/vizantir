'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, Zap, Shield, TrendingUp, Clock, CheckCircle2, MapPin } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import { trackPhoneClick } from '@/lib/analytics'

export default function LasVegasWebDesignClient() {
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

  const services = [
    {
      icon: Zap,
      title: 'Custom Web Design',
      description: 'Bespoke designs that capture your brand and convert visitors into customers. No templates.',
    },
    {
      icon: TrendingUp,
      title: 'Next.js Development',
      description: 'Enterprise-grade technology used by Nike, Netflix, and TikTok. Fast, secure, scalable.',
    },
    {
      icon: Shield,
      title: 'SEO & Performance',
      description: 'Sites that load in under 1 second and rank. Built for Google, optimized for humans.',
    },
    {
      icon: Clock,
      title: 'Ongoing Support',
      description: 'We don\'t disappear after launch. Strategic partnership for continued growth.',
    },
  ]

  const faqs = [
    {
      question: 'How much does web design cost in Las Vegas?',
      answer: 'Web design costs in Las Vegas vary widely. Template-based sites start around $2,500-5,000. Custom WordPress sites run $5,000-15,000. Premium custom Next.js sites like we build start at $15,000 and go up based on complexity. The investment depends on your needs, but our clients typically see ROI within 6-12 months through improved conversions.',
    },
    {
      question: 'Why should I choose a Las Vegas web design agency?',
      answer: 'A local Las Vegas agency understands the unique market dynamics of Southern Nevada—from the tourism-heavy economy to the growing tech and professional services sectors. We know what resonates with Las Vegas customers and can meet in person when needed. Plus, we\'re in your timezone for responsive communication.',
    },
    {
      question: 'What makes Vizantir different from other Las Vegas web designers?',
      answer: 'Unlike most Las Vegas agencies that use WordPress templates, we build custom sites on Next.js—the same technology used by Nike, Netflix, and TikTok. Our sites load in under 1 second, score 90+ on Google PageSpeed, and are built for long-term performance. We focus on results, not just aesthetics.',
    },
    {
      question: 'How long does it take to build a website?',
      answer: 'Most of our Las Vegas web design projects take 6-10 weeks from kickoff to launch. This includes discovery, design, development, content integration, and testing. Rush timelines are possible for an additional fee. We prioritize getting it right over getting it fast.',
    },
    {
      question: 'Do you offer ongoing website maintenance?',
      answer: 'One of the advantages of our Next.js approach is minimal maintenance requirements—no plugin updates, no security patches, no database optimization. We offer optional support packages for content updates and strategic improvements, but your site won\'t break if you don\'t maintain it monthly.',
    },
  ]

  const serviceAreas = [
    'Downtown Las Vegas',
    'Summerlin',
    'Henderson',
    'North Las Vegas',
    'Spring Valley',
    'Paradise',
    'Enterprise',
    'Green Valley',
    'Centennial Hills',
    'Southern Highlands',
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
        {/* Background gradient */}
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            background: isNightMode 
              ? 'radial-gradient(ellipse at top right, rgba(255,198,76,0.15), transparent 60%)' 
              : 'radial-gradient(ellipse at top right, rgba(255,198,76,0.2), transparent 60%)',
          }}
        />
        
        <div className="relative z-10 max-w-6xl mx-auto text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 mb-6 px-5 py-2.5 rounded-full border backdrop-blur-md"
            style={{
              background: isNightMode ? 'rgba(255, 198, 76, 0.1)' : 'rgba(255, 198, 76, 0.15)',
              borderColor: isNightMode ? 'rgba(255, 198, 76, 0.3)' : 'rgba(255, 198, 76, 0.5)',
            }}
          >
            <MapPin size={16} style={{ color: colors.accent }} />
            <span
              className="text-sm font-medium"
              style={{ color: isNightMode ? '#FFC64C' : '#1A1A1A' }}
            >
              Las Vegas, Nevada
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black mb-6 leading-[1.05]"
            style={{ color: colors.text }}
          >
            Las Vegas Web Design
            <br />
            <span style={{ color: colors.accent }}>That Actually Performs</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg md:text-xl max-w-3xl mx-auto mb-10"
            style={{ color: colors.textMuted, lineHeight: 1.7 }}
          >
            We build custom websites for Las Vegas businesses on Next.js—the same technology 
            behind Nike, Netflix, and TikTok. Fast load times. Higher conversions. Zero maintenance headaches.
          </motion.p>

          {/* CTA Buttons */}
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
              <Link href="/get-started">
                Get a Free Consultation
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
              <Link href="/case-studies">
                View Our Work
              </Link>
            </Button>
          </motion.div>

          {/* Trust indicators */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="mt-12 flex flex-wrap justify-center gap-8"
          >
            {[
              { value: '90+', label: 'PageSpeed Score' },
              { value: '<1s', label: 'Load Time' },
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

      {/* Divider */}
      <div className="w-full h-px" style={{ background: colors.divider }} />

      {/* Why Las Vegas Businesses Choose Us */}
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
              Web Design Built for Las Vegas
            </h2>
            <p
              className="text-lg max-w-2xl mx-auto"
              style={{ color: colors.textMuted }}
            >
              From the Strip to Summerlin, we help Las Vegas businesses stand out online 
              with websites that load fast and convert visitors into customers.
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {services.map((service, index) => (
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
                  <service.icon size={24} style={{ color: colors.accent }} />
                </div>
                <h3
                  className="text-lg font-bold mb-2"
                  style={{ color: colors.text }}
                >
                  {service.title}
                </h3>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: colors.textMuted }}
                >
                  {service.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Divider */}
      <div className="w-full h-px" style={{ background: colors.divider }} />

      {/* The Las Vegas Difference */}
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
                Local Expertise
              </span>
              <h2
                className="text-3xl md:text-4xl font-bold mb-6"
                style={{ color: colors.text }}
              >
                We Know Las Vegas Business
              </h2>
              <p
                className="text-lg mb-6"
                style={{ color: colors.textMuted, lineHeight: 1.7 }}
              >
                Las Vegas isn't just casinos and tourism. It's a growing hub for tech startups, 
                professional services, healthcare, and home services. We understand the local market 
                and build websites that resonate with your specific audience.
              </p>
              <ul className="space-y-3">
                {[
                  'Based in Las Vegas—available for in-person meetings',
                  'Deep understanding of Southern Nevada market dynamics',
                  'Experience with tourism, hospitality, and service businesses',
                  'Same-timezone communication and support',
                ].map((item, index) => (
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
              <h3
                className="text-xl font-bold mb-4"
                style={{ color: colors.text }}
              >
                Service Areas
              </h3>
              <p
                className="text-sm mb-6"
                style={{ color: colors.textMuted }}
              >
                We serve businesses throughout the Las Vegas Valley:
              </p>
              <div className="grid grid-cols-2 gap-3">
                {serviceAreas.map((area, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 text-sm"
                    style={{ color: colors.textMuted }}
                  >
                    <MapPin size={14} style={{ color: colors.accent }} />
                    {area}
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Divider */}
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
            <h2
              className="text-3xl md:text-4xl font-bold"
              style={{ color: colors.text }}
            >
              Las Vegas Web Design Questions
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
                <h3
                  className="text-lg font-semibold mb-3"
                  style={{ color: colors.text }}
                >
                  {faq.question}
                </h3>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: colors.textMuted }}
                >
                  {faq.answer}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Divider */}
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
              Ready to Stand Out in Las Vegas?
            </h2>
            <p
              className="text-lg mb-10 max-w-2xl mx-auto"
              style={{ color: colors.textMuted }}
            >
              Let's talk about your project. No commitment, no pressure—just a conversation 
              about how we can help your Las Vegas business grow online.
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
              <Link href="/get-started">
                Get Your Free Consultation
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <p
              className="mt-6 text-sm"
              style={{ color: colors.textMuted }}
            >
              Or call us: <a href="tel:+17026046177" onClick={trackPhoneClick} style={{ color: colors.accent }}>(702) 604-6177</a>
            </p>
          </motion.div>
        </div>
      </section>
    </main>
  )
}
