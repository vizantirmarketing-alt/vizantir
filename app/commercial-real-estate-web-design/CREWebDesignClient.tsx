'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Eyebrow } from '@/components/ui/Eyebrow'
import SectionDivider from '@/components/ui/SectionDivider'
import {
  ArrowRight,
  Building2,
  Award,
  Target,
  Zap,
  CheckCircle2,
} from 'lucide-react'
import { commercialRealEstatePricingFaqs } from '@/data/industry-pricing-faqs'
import { trackPhoneClick } from '@/lib/analytics'

export default function CREWebDesignClient() {
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
      answer: commercialRealEstatePricingFaqs.cost,
    },
    {
      question: 'Can you integrate property listings into the site?',
      answer:
        'Yes. We build CMS-driven listing pages so your team can add, update, and remove properties without touching code.',
    },
    {
      question: 'How long does it take to build a CRE website?',
      answer: commercialRealEstatePricingFaqs.timeline,
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
    <main className="bg-background text-foreground transition-colors duration-500">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center px-6 md:px-12 lg:px-20 pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,var(--cobalt-muted-subtle)_0%,transparent_60%)]" />

        <div className="relative z-10 max-w-6xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-muted/50 mb-8"
          >
            <Building2 size={16} className="text-cobalt-accent" />
            <span className="text-sm text-muted-foreground">
              CRE Firms · Brokerages · Property Groups
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black mb-6 leading-[1.05] text-foreground"
          >
            Commercial Real Estate
            <br />
            <span className="text-cobalt-accent">Web Design That Converts</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg md:text-xl max-w-3xl mx-auto mb-10 text-muted-foreground leading-relaxed"
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
              className="rounded-xl px-8 py-4 text-base font-semibold bg-cobalt-gradient text-white shadow-cobalt group"
            >
              <Link href="/contact">
                Book a Strategy Call
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Link
              href="/case-studies"
              className="inline-flex items-center justify-center gap-2 text-base font-semibold text-cobalt-accent transition-colors duration-300 hover:opacity-80 group"
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
                <div className="text-2xl md:text-3xl font-bold text-cobalt-accent">{stat.value}</div>
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
              Web Design Built for Commercial Real Estate
            </h2>
            <p className="text-lg max-w-2xl mx-auto text-muted-foreground">
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
                className="card-interactive p-6 rounded-2xl border border-border bg-muted"
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-black/[0.02]">
                  <card.icon size={24} className="text-cobalt-accent" />
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
                We Understand CRE Firms and Brokerages
              </h2>
              <p className="text-lg mb-6 text-muted-foreground leading-relaxed">
                Commercial real estate websites need to serve multiple audiences — investors,
                tenants, and partners — while maintaining a consistent, authoritative brand presence.
              </p>
              <ul className="space-y-3">
                {industryBullets.map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle2
                      className="h-4 w-4 flex-shrink-0 text-cobalt-accent mt-[2px]"
                      aria-hidden
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
              <h3 className="text-xl font-bold mb-4 text-foreground">Organization types</h3>
              <p className="text-sm mb-6 text-muted-foreground">CRE organizations we support:</p>
              <ul className="space-y-3">
                {organizationTypes.map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle2
                      className="h-4 w-4 flex-shrink-0 text-cobalt-accent mt-[2px]"
                      aria-hidden
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
                className="card-interactive p-6 rounded-2xl border border-border bg-muted"
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-black/[0.02]">
                  <CheckCircle2 size={24} className="text-cobalt-accent" />
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
              Ready to Present Your Firm at the Level Your Work Deserves?
            </h2>
            <p className="text-lg mb-10 max-w-2xl mx-auto text-muted-foreground">
              Let&apos;s talk about your project and whether Vizantir is the right fit to build it.
            </p>
            <Button
              size="lg"
              asChild
              className="rounded-xl px-8 py-4 text-base font-semibold bg-cobalt-gradient text-white shadow-cobalt group"
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
                className="link-cobalt text-cobalt-accent"
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
