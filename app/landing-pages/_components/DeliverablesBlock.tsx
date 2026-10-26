'use client'

import { MotionCard } from '@/components/ui/MotionCard'
import { Section } from '@/components/ui/Section'
import { motion } from 'framer-motion'
import { CheckCircle2 } from 'lucide-react'
import SectionDivider from '@/components/ui/SectionDivider'
import { containerVariants, itemVariants, sectionReveal } from './motion'

const designAndBuild = [
  'Custom responsive design',
  'Custom Next.js development',
  'Mobile-first, tested on real devices',
  'Metadata and technical SEO',
  'Deployed on Vercel',
] as const

const conversionInfrastructure = [
  'Analytics setup (Vercel Analytics)',
  'Conversion event tracking',
  'Form or booking integration',
  'Post-launch support window',
  'Source code you own',
] as const

function DeliverableColumn({
  title,
  items,
}: {
  title: string
  items: readonly string[]
}) {
  return (
    <MotionCard variant="plain" badge={false}
      variants={itemVariants}
      className="block h-auto rounded-2xl border border-border bg-muted/40">
      <h3 className="mb-6 text-xl font-bold text-foreground">{title}</h3>
      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-cobalt-text" aria-hidden />
            <span className="text-base md:text-sm leading-normal md:leading-relaxed text-muted-foreground">{item}</span>
          </li>
        ))}
      </ul>
    </MotionCard>
  )
}

export function DeliverablesBlock() {
  return (
    <>
      <SectionDivider />
      <Section className="px-6 md:px-12 lg:px-20" aria-labelledby="deliverables-heading">
        <div className="mx-auto max-w-6xl">
          <motion.div {...sectionReveal} className="mb-[var(--heading-gap)] text-center">
            <h2
              id="deliverables-heading"
              className="font-bold text-foreground md:text-4xl lg:text-5xl"
            >
              What&apos;s inside every Vizantir landing page.
            </h2>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-40px' }}
            className="grid gap-6 md:grid-cols-2"
          >
            <DeliverableColumn title="Design and build" items={designAndBuild} />
            <DeliverableColumn title="Conversion infrastructure" items={conversionInfrastructure} />
          </motion.div>
        </div>
      </Section>
    </>
  )
}
