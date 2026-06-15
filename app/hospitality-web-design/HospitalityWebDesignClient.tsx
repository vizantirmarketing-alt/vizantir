'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Eyebrow } from '@/components/ui/Eyebrow'
import SectionDivider from '@/components/ui/SectionDivider'
import {
  ArrowRight,
  Zap,
  CalendarCheck,
  Smartphone,
  Palette,
  CheckCircle2,
  UtensilsCrossed,
} from 'lucide-react'
import { hospitalityPricingFaqs } from '@/data/industry-pricing-faqs'
import { trackPhoneClick } from '@/lib/analytics'

export default function HospitalityWebDesignClient() {
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
      answer: hospitalityPricingFaqs.cost,
    },
    {
      question: 'Can you integrate with OpenTable or Resy?',
      answer:
        'Yes. We build reservation integrations directly into the site so guests can book without leaving your page.',
    },
    {
      question: 'How long does it take to build a restaurant website?',
      answer: hospitalityPricingFaqs.timeline,
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
    <main className="bg-background text-foreground transition-colors duration-500">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center px-6 md:px-12 lg:px-20 pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,var(--gold-muted-subtle)_0%,transparent_60%)]" />

        <div className="relative z-10 max-w-6xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-muted/50 mb-8"
          >
            <UtensilsCrossed size={16} className="text-gold-accent" />
            <span className="text-sm text-muted-foreground">
              Restaurants · Hotels · Lounges
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black mb-6 leading-[1.05] text-foreground"
          >
            Hospitality Web Design
            <br />
            <span className="text-gold-accent">That Fills Tables</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg md:text-xl max-w-3xl mx-auto mb-10 text-muted-foreground leading-relaxed"
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
              className="rounded-xl px-8 py-4 text-base font-semibold bg-gold-gradient text-[#1A1A1A] shadow-gold transition-all duration-300 hover:scale-[1.02] group"
            >
              <Link href="/contact">
                Book a Strategy Call
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Link
              href="/case-studies"
              className="inline-flex items-center justify-center gap-2 text-base font-semibold text-gold-accent transition-colors duration-300 hover:opacity-80 group"
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
                <div className="text-2xl md:text-3xl font-bold text-gold-accent">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
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
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 text-foreground">
              Web Design Built for Hospitality
            </h2>
            <p className="text-lg max-w-2xl mx-auto text-muted-foreground">
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
                className="p-6 rounded-2xl border border-border bg-muted transition-all duration-300 hover:-translate-y-1 hover:border-gold-muted-border"
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-black/[0.02]">
                  <card.icon size={24} className="text-gold-accent" />
                </div>
                <h3 className="text-lg font-bold mb-2 text-foreground">{card.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{card.description}</p>
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
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 text-foreground">
                We Understand Hospitality Businesses
              </h2>
              <p className="text-lg mb-6 text-muted-foreground leading-relaxed">
                Hospitality websites need to do more than look good. They need to drive reservations,
                communicate atmosphere, and work flawlessly on every device.
              </p>
              <ul className="space-y-3">
                {industryBullets.map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle2
                      size={20}
                      className="flex-shrink-0 mt-0.5 text-gold-accent"
                    />
                    <span className="text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="p-8 rounded-2xl border border-border bg-muted"
            >
              <h3 className="text-xl font-bold mb-4 text-foreground">Venue types</h3>
              <p className="text-sm mb-6 text-muted-foreground">Hospitality concepts we support:</p>
              <ul className="space-y-3">
                {venueTypes.map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle2
                      size={20}
                      className="flex-shrink-0 mt-0.5 text-gold-accent"
                    />
                    <span className="text-sm text-muted-foreground">{item}</span>
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
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground">
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
                className="p-6 rounded-2xl border border-border bg-muted transition-all duration-300 hover:-translate-y-1 hover:border-gold-muted-border"
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-black/[0.02]">
                  <CheckCircle2 size={24} className="text-gold-accent" />
                </div>
                <p className="text-sm leading-relaxed font-medium text-foreground">{line}</p>
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
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground">
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
                className="p-6 rounded-2xl border border-border bg-muted"
              >
                <h3 className="text-lg font-semibold mb-3 text-foreground">{faq.question}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{faq.answer}</p>
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
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 text-foreground">
              Ready to Elevate Your Hospitality Brand?
            </h2>
            <p className="text-lg mb-10 max-w-2xl mx-auto text-muted-foreground">
              Let&apos;s talk about your project. No commitment, no pressure — just a conversation
              about what your site needs.
            </p>
            <Button
              size="lg"
              asChild
              className="rounded-xl px-8 py-4 text-base font-semibold bg-gold-gradient text-[#1A1A1A] shadow-gold transition-all duration-300 hover:scale-[1.02] group"
            >
              <Link href="/contact">
                Book a Strategy Call
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <p className="mt-6 text-sm text-muted-foreground">
              Or call us:{' '}
              <Link
                href="tel:+17022890758"
                onClick={trackPhoneClick}
                className="text-gold-accent hover:opacity-80 transition-opacity"
              >
                (702) 289-0758
              </Link>
            </p>
          </motion.div>
        </div>
      </section>
    </main>
  )
}
