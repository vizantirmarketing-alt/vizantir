'use client'

import { motion } from 'framer-motion'
import { Code2, Palette, Rocket, Search } from 'lucide-react'
import { Eyebrow } from '@/components/ui/Eyebrow'
import SectionDivider from '@/components/ui/SectionDivider'
import { containerVariants, itemVariants, sectionReveal } from './motion'

const processSteps = [
  {
    icon: Search,
    step: '01',
    title: 'Strategy',
    description: 'Clarify the offer, audience, and single conversion action.',
  },
  {
    icon: Palette,
    step: '02',
    title: 'Design',
    description: 'Custom brand-matched design focused on one action.',
  },
  {
    icon: Code2,
    step: '03',
    title: 'Build',
    description: 'Custom Next.js development, mobile-first, tracked.',
  },
  {
    icon: Rocket,
    step: '04',
    title: 'Launch',
    description: 'Deploy live, verify tracking, hand off documentation.',
  },
] as const

export function Process() {
  return (
    <>
      <SectionDivider />
      <section className="px-6 py-20 md:px-12 lg:px-20" aria-labelledby="process-heading">
        <div className="mx-auto max-w-6xl">
          <motion.div {...sectionReveal} className="mb-14 text-center">
            <Eyebrow>Process</Eyebrow>
            <h2
              id="process-heading"
              className="text-3xl font-bold text-foreground md:text-4xl lg:text-5xl"
            >
              How we build a landing page.
            </h2>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-40px' }}
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
          >
            {processSteps.map((step) => (
              <motion.div
                key={step.title}
                variants={itemVariants}
                className="rounded-2xl border border-border bg-muted p-6"
              >
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-black/[0.02]">
                    <step.icon size={22} className="text-cobalt-accent" aria-hidden />
                  </div>
                  <span className="text-xs font-semibold tracking-wider text-cobalt-accent">
                    {step.step}
                  </span>
                </div>
                <h3 className="mb-2 text-lg font-bold text-foreground">{step.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{step.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
    </>
  )
}
