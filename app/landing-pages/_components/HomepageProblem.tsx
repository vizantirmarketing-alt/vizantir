'use client'

import { Section } from '@/components/ui/Section'
import { motion } from 'framer-motion'
import { CheckCircle2 } from 'lucide-react'
import SectionDivider from '@/components/ui/SectionDivider'
import { containerVariants, itemVariants, sectionReveal } from './motion'

type HomepageProblemProps = {
  heading: string
  body: string
  bullets: string[]
}

export function HomepageProblem({ heading, body, bullets }: HomepageProblemProps) {
  return (
    <>
      <SectionDivider />
      <Section className="px-6 md:px-12 lg:px-20" aria-labelledby="homepage-problem-heading">
        <div className="mx-auto max-w-3xl">
          <motion.div {...sectionReveal}>
            <h2
              id="homepage-problem-heading"
              className="mb-8 font-bold text-foreground md:text-4xl lg:text-5xl"
            >
              {heading}
            </h2>
            <p className="mb-10 text-lg leading-relaxed text-muted-foreground">{body}</p>
          </motion.div>

          <motion.ul
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-40px' }}
            className="space-y-4"
          >
            {bullets.map((bullet) => (
              <motion.li key={bullet} variants={itemVariants} className="flex items-start gap-3">
                <CheckCircle2
                  className="mt-0.5 h-5 w-5 shrink-0 text-cobalt-text"
                  aria-hidden
                />
                <span className="text-base leading-relaxed text-muted-foreground">{bullet}</span>
              </motion.li>
            ))}
          </motion.ul>
        </div>
      </Section>
    </>
  )
}
