'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowRight, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Eyebrow } from '@/components/ui/Eyebrow'
import SectionDivider from '@/components/ui/SectionDivider'
import { AccordionIndicator } from '@/components/ui/AccordionIndicator'
import { trackBookStrategyCallIntent } from '@/lib/analytics'
import {
  nextjsVsWordpressComparison,
  nextjsVsWordpressCriteria,
  nextjsVsWordpressCta,
  nextjsVsWordpressDirectAnswer,
  nextjsVsWordpressFaqs,
  nextjsVsWordpressHero,
  nextjsVsWordpressNextBetter,
  nextjsVsWordpressWordpressBetter,
} from '@/data/nextjs-vs-wordpress'

const sectionReveal = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-40px' },
  transition: { duration: 0.5, ease: 'easeOut' as const },
}

export default function NextJsVsWordpressClient() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  return (
    <main className="bg-background text-foreground transition-colors duration-500">
      <section className="relative flex min-h-[88svh] items-center justify-center overflow-hidden px-6 pb-20 pt-32 md:px-12 lg:px-20">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,var(--cobalt-muted-subtle)_0%,transparent_60%)]"
          aria-hidden
        />

        <div className="relative z-10 mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="mb-8"
          >
            <Eyebrow>{nextjsVsWordpressHero.eyebrow}</Eyebrow>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.08 }}
            className="mb-6 text-4xl font-black leading-[1.05] text-foreground sm:text-5xl md:text-6xl lg:text-7xl"
          >
            {nextjsVsWordpressHero.heading}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.16 }}
            className="mx-auto mb-6 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl"
          >
            {nextjsVsWordpressDirectAnswer}
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.2 }}
            className="mb-10 text-sm text-muted-foreground"
          >
            Last updated{' '}
            <time dateTime={nextjsVsWordpressHero.lastUpdatedIso}>
              {nextjsVsWordpressHero.lastUpdatedLabel}
            </time>
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.24 }}
          >
            <Button
              size="lg"
              asChild
              className="group rounded-xl bg-cobalt-gradient px-8 py-4 text-base font-semibold text-white shadow-cobalt focus-visible:ring-2 focus-visible:ring-[#0070F3]/50 focus-visible:ring-offset-2"
            >
              <Link
                href={nextjsVsWordpressCta.href}
                onClick={() => trackBookStrategyCallIntent('hero')}
              >
                {nextjsVsWordpressCta.buttonLabel}
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      <SectionDivider />

      <section className="px-6 py-20 md:px-12 lg:px-20" aria-labelledby="comparison-heading">
        <div className="mx-auto max-w-6xl">
          <motion.div {...sectionReveal} className="mb-14 text-center">
            <Eyebrow>{nextjsVsWordpressComparison.eyebrow}</Eyebrow>
            <h2
              id="comparison-heading"
              className="mb-5 text-3xl font-bold text-foreground md:text-4xl lg:text-5xl"
            >
              {nextjsVsWordpressComparison.heading}
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              {nextjsVsWordpressComparison.intro}
            </p>
          </motion.div>

          <motion.div {...sectionReveal} className="overflow-x-auto rounded-2xl border border-border bg-muted">
            <table className="w-full min-w-[40rem] border-collapse text-left text-sm">
              <caption className="sr-only">
                Next.js versus WordPress across performance, security, editing, hosting, developers,
                plugins, upgrades, and total cost
              </caption>
              <thead>
                <tr className="border-b border-border">
                  <th scope="col" className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Criterion
                  </th>
                  <th scope="col" className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-foreground">
                    {nextjsVsWordpressComparison.optionA}
                  </th>
                  <th scope="col" className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-foreground">
                    {nextjsVsWordpressComparison.optionB}
                  </th>
                </tr>
              </thead>
              <tbody>
                {nextjsVsWordpressComparison.rows.map((row) => (
                  <tr key={row.criterion} className="border-b border-border last:border-b-0">
                    <th
                      scope="row"
                      className="px-5 py-4 align-top text-sm font-semibold text-foreground"
                    >
                      {row.criterion}
                    </th>
                    <td className="px-5 py-4 align-top leading-relaxed text-muted-foreground">
                      {row.nextjs}
                    </td>
                    <td className="px-5 py-4 align-top leading-relaxed text-muted-foreground">
                      {row.wordpress}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        </div>
      </section>

      <SectionDivider />

      <section className="px-6 py-20 md:px-12 lg:px-20" aria-labelledby="nextjs-better-heading">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
            <motion.div {...sectionReveal}>
              <Eyebrow align="start">{nextjsVsWordpressNextBetter.eyebrow}</Eyebrow>
              <h2
                id="nextjs-better-heading"
                className="mb-5 text-3xl font-bold text-foreground md:text-4xl"
              >
                {nextjsVsWordpressNextBetter.heading}
              </h2>
              <p className="mb-8 text-lg leading-relaxed text-muted-foreground">
                {nextjsVsWordpressNextBetter.intro}
              </p>
              <ul className="space-y-6">
                {nextjsVsWordpressNextBetter.items.map((item) => (
                  <li key={item.title} className="flex items-start gap-3">
                    <CheckCircle2
                      className="mt-0.5 h-4 w-4 shrink-0 text-cobalt-accent"
                      aria-hidden
                    />
                    <div>
                      <h3 className="mb-1 text-base font-semibold text-foreground">{item.title}</h3>
                      <p className="text-sm leading-relaxed text-muted-foreground">{item.body}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.5, delay: 0.08 }}
            >
              <Eyebrow align="start">{nextjsVsWordpressWordpressBetter.eyebrow}</Eyebrow>
              <h2
                id="wordpress-better-heading"
                className="mb-5 text-3xl font-bold text-foreground md:text-4xl"
              >
                {nextjsVsWordpressWordpressBetter.heading}
              </h2>
              <p className="mb-8 text-lg leading-relaxed text-muted-foreground">
                {nextjsVsWordpressWordpressBetter.intro}
              </p>
              <ul className="space-y-6">
                {nextjsVsWordpressWordpressBetter.items.map((item) => (
                  <li key={item.title} className="flex items-start gap-3">
                    <CheckCircle2
                      className="mt-0.5 h-4 w-4 shrink-0 text-cobalt-accent"
                      aria-hidden
                    />
                    <div>
                      <h3 className="mb-1 text-base font-semibold text-foreground">{item.title}</h3>
                      <p className="text-sm leading-relaxed text-muted-foreground">{item.body}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      <SectionDivider />

      <section className="px-6 py-20 md:px-12 lg:px-20" aria-labelledby="criteria-heading">
        <div className="mx-auto max-w-3xl">
          <motion.div {...sectionReveal} className="mb-14 text-center">
            <Eyebrow>{nextjsVsWordpressCriteria.eyebrow}</Eyebrow>
            <h2
              id="criteria-heading"
              className="mb-5 text-3xl font-bold text-foreground md:text-4xl lg:text-5xl"
            >
              {nextjsVsWordpressCriteria.heading}
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              {nextjsVsWordpressCriteria.intro}
            </p>
          </motion.div>

          <div className="space-y-14">
            {nextjsVsWordpressCriteria.sections.map((section) => (
              <motion.article key={section.id} {...sectionReveal} id={section.id}>
                <h3 className="mb-4 text-2xl font-bold text-foreground md:text-3xl">
                  {section.heading}
                </h3>
                <p className="mb-4 text-lg leading-relaxed text-foreground/90">{section.lead}</p>
                <p className="text-base leading-relaxed text-muted-foreground">{section.body}</p>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <SectionDivider />

      <section className="px-6 py-20 md:px-12 lg:px-20" aria-labelledby="faq-heading">
        <div className="mx-auto max-w-3xl">
          <motion.div {...sectionReveal} className="mb-12 text-center">
            <Eyebrow>FAQ</Eyebrow>
            <h2
              id="faq-heading"
              className="text-3xl font-bold text-foreground md:text-4xl lg:text-5xl"
            >
              Questions people ask about Next.js vs WordPress
            </h2>
          </motion.div>

          <div className="space-y-3">
            {nextjsVsWordpressFaqs.map((faq, index) => {
              const isOpen = openFaq === index
              const triggerId = `nextjs-vs-wordpress-faq-trigger-${index}`
              const panelId = `nextjs-vs-wordpress-faq-panel-${index}`

              return (
                <motion.div
                  key={faq.question}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                  className={`rounded-xl border bg-card px-6 py-5 transition-all duration-300 ${
                    isOpen ? 'border-cobalt-accent/30' : 'border-border hover:bg-[#F9FAFB]'
                  }`}
                >
                  <button
                    id={triggerId}
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    className="w-full text-left"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <span className="font-medium text-foreground">{faq.question}</span>
                      <AccordionIndicator
                        isOpen={isOpen}
                        className="h-5 w-5 flex-shrink-0"
                        style={{ color: 'var(--cobalt-accent)' }}
                      />
                    </div>
                  </button>

                  <div
                    id={panelId}
                    role="region"
                    aria-labelledby={triggerId}
                    aria-hidden={!isOpen}
                    className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${
                      isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                    }`}
                  >
                    <div className="overflow-hidden">
                      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      <section
        className="relative overflow-hidden bg-cobalt-primary px-6 py-24 md:px-12 lg:px-20"
        aria-labelledby="closing-cta-heading"
      >
        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <motion.div {...sectionReveal}>
            <h2
              id="closing-cta-heading"
              className="mb-5 text-3xl font-bold text-white md:text-4xl lg:text-5xl"
            >
              {nextjsVsWordpressCta.heading}
            </h2>
            <p className="mb-10 text-lg text-white/80">{nextjsVsWordpressCta.body}</p>
            <Button
              size="lg"
              asChild
              className="group rounded-xl bg-white px-8 py-4 text-base font-semibold text-cobalt-primary shadow-lg hover:bg-white/95 focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-cobalt-primary"
            >
              <Link
                href={nextjsVsWordpressCta.href}
                onClick={() => trackBookStrategyCallIntent('closing_cta')}
              >
                {nextjsVsWordpressCta.buttonLabel}
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>
    </main>
  )
}
