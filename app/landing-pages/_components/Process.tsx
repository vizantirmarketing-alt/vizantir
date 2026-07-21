'use client'

import { motion } from 'framer-motion'
import { Code2, Palette, Rocket, Search } from 'lucide-react'
import { Eyebrow } from '@/components/ui/Eyebrow'
import SectionDivider from '@/components/ui/SectionDivider'
import type { ProcessEmphasisStep } from '../_data/variants'
import { containerVariants, itemVariants, sectionReveal } from './motion'

const processSteps = [
  {
    key: 'strategy' as const,
    icon: Search,
    step: '01',
    title: 'Strategy',
    description: 'Clarify the offer, audience, and single conversion action.',
  },
  {
    key: 'design' as const,
    icon: Palette,
    step: '02',
    title: 'Design',
    description: 'Custom brand-matched design focused on one action.',
  },
  {
    key: 'build' as const,
    icon: Code2,
    step: '03',
    title: 'Build',
    description: 'Custom Next.js development, mobile-first, tracked.',
  },
  {
    key: 'launch' as const,
    icon: Rocket,
    step: '04',
    title: 'Launch',
    description: 'Deploy live, verify tracking, hand off documentation.',
  },
] as const

type ProcessProps = {
  emphasis?: {
    step: ProcessEmphasisStep
    label: string
  }
}

export function Process({ emphasis }: ProcessProps) {
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
            {emphasis ? (
              <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground">
                {emphasis.label}
              </p>
            ) : null}
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-40px' }}
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
          >
            {processSteps.map((step) => {
              const isEmphasized = emphasis?.step === step.key
              return (
                <motion.div
                  key={step.title}
                  variants={itemVariants}
                  className={`rounded-2xl border p-6 ${
                    isEmphasized
                      ? 'border-cobalt-accent bg-cobalt-muted-subtle'
                      : 'border-border bg-muted'
                  }`}
                >
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-black/[0.02]">
                      <step.icon size={22} className="text-cobalt-accent" aria-hidden />
                    </div>
                    <span className="text-xs font-semibold tracking-wider text-cobalt-accent">
                      {step.step}
                    </span>
                  </div>
                  {isEmphasized ? (
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-cobalt-accent">
                      Emphasized for this audience
                    </p>
                  ) : null}
                  <h3 className="mb-2 text-lg font-bold text-foreground">{step.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{step.description}</p>
                </motion.div>
              )
            })}
          </motion.div>
        </div>
      </section>
    </>
  )
}
