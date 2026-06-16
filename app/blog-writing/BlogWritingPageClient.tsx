'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowRight, CheckCircle2, PenLine } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Eyebrow } from '@/components/ui/Eyebrow'
import SectionDivider from '@/components/ui/SectionDivider'
import { blogPricing } from '@/data/pricing'
import { trackCTAClick, trackPhoneClick } from '@/lib/analytics'

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

const differentiators = [
  {
    title: 'Human-written, not AI-generated',
    description:
      'Every post is researched and written by a real writer — not spun from a prompt or padded for word count.',
  },
  {
    title: 'Sounds like your brand',
    description:
      'We learn your voice, audience, and positioning so content reads like you wrote it, not a generic agency template.',
  },
  {
    title: 'Published live on your site',
    description:
      'Posts go straight into your blog — formatted, optimized, and ready for readers. No Word docs or copy-paste handoffs.',
  },
  {
    title: 'Built for search, not volume',
    description:
      'Topic strategy, keyword targeting, and on-page SEO on every piece — quality that compounds, not cheap filler.',
  },
]

export default function BlogWritingPageClient() {
  return (
    <main className="bg-background text-foreground transition-colors duration-500">
      {/* Hero */}
      <section className="relative min-h-[90vh] flex items-center justify-center px-6 md:px-12 lg:px-20 pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,var(--gold-muted-subtle)_0%,transparent_60%)]" />

        <div className="relative z-10 max-w-6xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-muted/50 mb-8"
          >
            <PenLine size={16} className="text-gold-accent" />
            <span className="text-sm text-muted-foreground">Premium Blog Writing · Human-Written · SEO-Ready</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black mb-6 leading-[1.05] text-foreground"
          >
            Blog Writing
            <br />
            <span className="text-gold-accent">That Sounds Like You</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg md:text-xl max-w-3xl mx-auto mb-6 text-muted-foreground leading-relaxed"
          >
            Premium, human-written blog content — not AI-generated slop, not cheap volume plays. We write posts
            that match your brand voice and publish them live into your site, so your blog actually grows without
            another document sitting in your inbox.
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="text-base md:text-lg max-w-2xl mx-auto mb-10 text-muted-foreground/90 leading-relaxed"
          >
            Strategy, research, SEO, featured images, and publishing — handled end to end.
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
              <Link href="/contact" onClick={() => trackCTAClick('book_strategy_call', 'blog_writing')}>
                Book a Strategy Call
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      <SectionDivider />

      {/* Differentiators */}
      <section className="px-6 md:px-12 lg:px-20 py-20">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <Eyebrow>Not Another Content Mill</Eyebrow>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 text-foreground">
              Premium Content, Done Right
            </h2>
            <p className="text-lg max-w-2xl mx-auto text-muted-foreground">
              Most &ldquo;blog packages&rdquo; optimize for cheap output. We optimize for credibility, search
              visibility, and content that represents your business accurately.
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid md:grid-cols-2 gap-6"
          >
            {differentiators.map((item, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="p-6 rounded-2xl border border-border bg-muted transition-all duration-300 hover:-translate-y-1 hover:border-gold-muted-border"
              >
                <h3 className="text-lg font-bold mb-2 text-foreground">{item.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{item.description}</p>
              </motion.div>
            ))}
          </motion.div>
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
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-foreground">
              Blog Writing Plans
            </h2>
            <p className="text-lg max-w-2xl mx-auto text-muted-foreground">
              Start with a single post or commit to a monthly rhythm. Every tier includes research, SEO, images,
              and live publishing.
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid md:grid-cols-3 gap-6"
          >
            {blogPricing.map((tier) => (
              <motion.div
                key={tier.slug}
                variants={itemVariants}
                className={`relative p-8 rounded-2xl border flex flex-col bg-muted ${
                  tier.popular
                    ? 'border-gold-muted-border shadow-[0_0_40px_rgba(255,198,76,0.08)]'
                    : 'border-border'
                }`}
              >
                {tier.popular && (
                  <span className="absolute -top-2 right-4 text-[10px] tracking-wider uppercase px-2 py-0.5 rounded-full font-medium bg-gold-gradient text-[#1A1A1A]">
                    Most Popular
                  </span>
                )}
                <h3 className="text-xl font-bold mb-1 text-foreground">{tier.name}</h3>
                <p className="text-sm font-medium text-gold-accent mb-3">{tier.tagline}</p>
                <p className="text-3xl font-black text-gold-accent mb-1">{tier.price}</p>
                <p className="text-sm text-muted-foreground mb-6">{tier.cadence}</p>
                <ul className="space-y-3 mt-auto">
                  {tier.includes.map((line, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-foreground/80">
                      <CheckCircle2 size={16} className="flex-shrink-0 mt-0.5 text-gold-accent" aria-hidden />
                      {line}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <SectionDivider />

      {/* CTA */}
      <section className="px-6 md:px-12 lg:px-20 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 text-foreground">
              Ready to Grow Your Blog?
            </h2>
            <p className="text-lg mb-10 max-w-2xl mx-auto text-muted-foreground">
              Let&apos;s talk about your audience, topics, and how a consistent publishing rhythm fits your
              business.
            </p>
            <Button
              size="lg"
              asChild
              className="rounded-xl px-8 py-4 text-base font-semibold bg-gold-gradient text-[#1A1A1A] shadow-gold transition-all duration-300 hover:scale-[1.02] group"
            >
              <Link href="/contact" onClick={() => trackCTAClick('book_strategy_call', 'blog_writing')}>
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
