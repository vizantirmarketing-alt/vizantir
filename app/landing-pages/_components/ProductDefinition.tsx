'use client'

import { MotionCard } from '@/components/ui/MotionCard'
import { Section } from '@/components/ui/Section'
import { motion } from 'framer-motion'
import { Code2, Palette, Target } from 'lucide-react'
import SectionDivider from '@/components/ui/SectionDivider'
import { containerVariants, itemVariants, sectionReveal } from './motion'

const columns = [
  {
    icon: Palette,
    title: 'Custom design',
    description: 'Matched to your brand, no templates, no stock layouts.',
  },
  {
    icon: Code2,
    title: 'Custom Next.js build',
    description: 'Real code you own, fast on mobile, ready for paid traffic.',
  },
  {
    icon: Target,
    title: 'Conversion tracking built in',
    description: 'Analytics, form events, and behavior tracking configured before launch.',
  },
] as const

export function ProductDefinition() {
  return (
    <>
      <SectionDivider />
      <Section className="px-6 md:px-12 lg:px-20" aria-labelledby="product-definition-heading">
        <div className="mx-auto max-w-6xl">
          <motion.div {...sectionReveal} className="mb-[var(--heading-gap)] mx-auto max-w-3xl text-center">
            <h2
              id="product-definition-heading"
              className="mb-5 font-bold text-foreground md:text-4xl lg:text-5xl"
            >
              What a Vizantir landing page actually is.
            </h2>
            <p className="text-lg leading-relaxed text-muted-foreground">
              Not a template. Not a Webflow drag-and-drop. Not a builder plugin bolted onto
              WordPress. A Vizantir landing page is custom-designed and custom-built on Next.js,
              deployed on Vercel, wired to your analytics stack, and structured around one clear
              conversion action. Every element on the page exists because it moves a specific
              visitor toward that action.
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-40px' }}
            className="grid gap-[var(--stack)] md:grid-cols-3"
          >
            {columns.map((column) => (
              <MotionCard variant="plain" pad="sm" badge={false}
                key={column.title}
                variants={itemVariants}
                className="block h-auto rounded-2xl border border-border bg-muted">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-black/[0.02]">
                  <column.icon size={24} className="text-cobalt-text" aria-hidden />
                </div>
                <h3 className="mb-2 text-lg font-bold text-foreground">{column.title}</h3>
                <p className="text-base md:text-sm leading-normal md:leading-relaxed text-muted-foreground">{column.description}</p>
              </MotionCard>
            ))}
          </motion.div>
        </div>
      </Section>
    </>
  )
}
