'use client'

import { motion } from 'framer-motion'
import { Code2, Palette, Target } from 'lucide-react'
import { Eyebrow } from '@/components/ui/Eyebrow'
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
      <section className="px-6 py-20 md:px-12 lg:px-20" aria-labelledby="product-definition-heading">
        <div className="mx-auto max-w-6xl">
          <motion.div {...sectionReveal} className="mb-14 mx-auto max-w-3xl text-center">
            <Eyebrow>The Product</Eyebrow>
            <h2
              id="product-definition-heading"
              className="mb-5 text-3xl font-bold text-foreground md:text-4xl lg:text-5xl"
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
            className="grid gap-6 md:grid-cols-3"
          >
            {columns.map((column) => (
              <motion.div
                key={column.title}
                variants={itemVariants}
                className="rounded-2xl border border-border bg-muted p-6"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-black/[0.02]">
                  <column.icon size={24} className="text-cobalt-accent" aria-hidden />
                </div>
                <h3 className="mb-2 text-lg font-bold text-foreground">{column.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{column.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
    </>
  )
}
