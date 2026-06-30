'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowRight, CheckCircle2, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Eyebrow } from '@/components/ui/Eyebrow'
import SectionDivider from '@/components/ui/SectionDivider'
import { PricingCards } from '@/components/pricing/PricingCards'
import { lasVegasPageData } from '@/data/las-vegas-web-design'
import { trackPhoneClick } from '@/lib/analytics'
import type { FaqItem } from '@/app/las-vegas-web-design/_schema'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
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

interface LasVegasWebDesignPageProps {
  faqItems: readonly FaqItem[]
}

export default function LasVegasWebDesignPage({ faqItems }: LasVegasWebDesignPageProps) {
  const { hero, intro, whatYouGet, process, pricing, industries, faqs, closingCta } =
    lasVegasPageData

  return (
    <main className="bg-background text-foreground transition-colors duration-500">
      {/* Hero */}
      <section className="relative min-h-[90vh] flex items-center justify-center px-6 md:px-12 lg:px-20 pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,var(--cobalt-muted-subtle)_0%,transparent_60%)]" />

        <div className="relative z-10 max-w-6xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-muted/50 mb-8"
          >
            <MapPin size={16} className="text-cobalt-accent" />
            <span className="text-sm text-muted-foreground">{hero.eyebrow}</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black mb-6 leading-[1.05] text-foreground"
          >
            {hero.heading}
            <br />
            <span className="text-cobalt-accent">{hero.headingAccent}</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg md:text-xl max-w-3xl mx-auto mb-10 text-muted-foreground leading-relaxed"
          >
            {hero.subheading}
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
              <Link href={hero.primaryCta.href}>
                {hero.primaryCta.label}
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Link
              href={hero.secondaryCta.href}
              className="inline-flex items-center justify-center gap-2 text-base font-semibold text-cobalt-accent transition-colors duration-300 hover:opacity-80 group"
            >
              {hero.secondaryCta.label}
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </motion.div>
        </div>
      </section>

      <SectionDivider />

      {/* Intro */}
      <section className="px-6 md:px-12 lg:px-20 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <Eyebrow>{intro.heading}</Eyebrow>
            <div className="space-y-6 text-lg md:text-xl leading-relaxed text-muted-foreground">
              {intro.paragraphs.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <SectionDivider />

      {/* What You Get */}
      <section className="px-6 md:px-12 lg:px-20 py-20">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <Eyebrow>{whatYouGet.heading}</Eyebrow>
            <p className="text-lg max-w-2xl mx-auto text-muted-foreground">{whatYouGet.subheading}</p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {whatYouGet.items.map((item, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="card-interactive p-6 rounded-2xl border border-border bg-muted"
              >
                <h3 className="text-lg font-bold mb-3 text-foreground">{item.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{item.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <SectionDivider />

      {/* Process */}
      <section className="px-6 md:px-12 lg:px-20 py-20">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <Eyebrow>Process</Eyebrow>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-foreground">{process.heading}</h2>
            <p className="text-lg text-muted-foreground">{process.subheading}</p>
          </motion.div>

          <motion.ol
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="space-y-6"
          >
            {process.steps.map((step) => (
              <motion.li
                key={step.step}
                variants={itemVariants}
                className="flex gap-6 p-6 rounded-2xl border border-border bg-muted"
              >
                <span className="flex-shrink-0 w-10 h-10 rounded-full bg-cobalt-muted-subtle border border-cobalt-muted-border flex items-center justify-center text-cobalt-accent font-bold">
                  {step.step}
                </span>
                <div>
                  <h3 className="text-lg font-bold mb-2 text-foreground">{step.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{step.description}</p>
                </div>
              </motion.li>
            ))}
          </motion.ol>
        </div>
      </section>

      <SectionDivider />

      {/* Pricing */}
      <section className="px-6 md:px-12 lg:px-20 py-20">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <Eyebrow>Pricing</Eyebrow>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-foreground">{pricing.heading}</h2>
            <p className="text-lg max-w-2xl mx-auto text-muted-foreground">{pricing.subheading}</p>
          </motion.div>

          <PricingCards />
        </div>
      </section>

      <SectionDivider />

      {/* Industries */}
      <section className="px-6 md:px-12 lg:px-20 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <Eyebrow align="start">Industries</Eyebrow>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 text-foreground">{industries.heading}</h2>
              <p className="text-lg text-muted-foreground leading-relaxed">{industries.body}</p>
            </motion.div>

            <motion.ul
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid sm:grid-cols-2 gap-3"
            >
              {industries.items.map((item, index) => (
                <motion.li
                  key={index}
                  variants={itemVariants}
                  className="flex items-center gap-3 p-4 rounded-xl border border-border bg-muted text-sm text-foreground/80"
                >
                  <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-cobalt-accent mt-[2px]" aria-hidden />
                  {item}
                </motion.li>
              ))}
            </motion.ul>
          </div>
        </div>
      </section>

      <SectionDivider />

      {/* FAQs */}
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
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground">{faqs.heading}</h2>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="space-y-4"
          >
            {faqItems.map((faq, index) => (
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

      {/* Closing CTA */}
      <section className="px-6 md:px-12 lg:px-20 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <address className="not-italic text-sm text-muted-foreground mb-10 space-y-1">
              <p className="font-medium text-foreground">Vizantir Design Studio</p>
              <p>Las Vegas, Nevada 89139</p>
              <p>
                <a href="tel:+17022890758" className="link-cobalt text-cobalt-accent">
                  (702) 289-0758
                </a>
              </p>
            </address>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 text-foreground">{closingCta.heading}</h2>
            <p className="text-lg mb-10 max-w-2xl mx-auto text-muted-foreground">{closingCta.body}</p>
            <Button
              size="lg"
              asChild
              className="rounded-xl px-8 py-4 text-base font-semibold bg-cobalt-gradient text-white shadow-cobalt group"
            >
              <Link href={closingCta.cta.href}>
                {closingCta.cta.label}
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
