'use client'

import { motion } from 'framer-motion'
import { CheckCircle2 } from 'lucide-react'
import { Eyebrow } from '@/components/ui/Eyebrow'
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
    <motion.div
      variants={itemVariants}
      className="rounded-2xl border border-border bg-muted/40 p-6 md:p-8"
    >
      <h3 className="mb-6 text-xl font-bold text-foreground">{title}</h3>
      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-cobalt-accent" aria-hidden />
            <span className="text-sm leading-relaxed text-muted-foreground">{item}</span>
          </li>
        ))}
      </ul>
    </motion.div>
  )
}

export function DeliverablesBlock() {
  return (
    <>
      <SectionDivider />
      <section className="px-6 py-20 md:px-12 lg:px-20" aria-labelledby="deliverables-heading">
        <div className="mx-auto max-w-6xl">
          <motion.div {...sectionReveal} className="mb-14 text-center">
            <Eyebrow>Deliverables</Eyebrow>
            <h2
              id="deliverables-heading"
              className="text-3xl font-bold text-foreground md:text-4xl lg:text-5xl"
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
      </section>
    </>
  )
}
