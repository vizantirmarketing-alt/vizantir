'use client'

import { MotionCard } from '@/components/ui/MotionCard'
import { Section } from '@/components/ui/Section'
import { motion } from 'framer-motion'
import SectionDivider from '@/components/ui/SectionDivider'
import { containerVariants, itemVariants, sectionReveal } from './motion'

type FaqItem = {
  question: string
  answer: string
}

type LandingPagesFAQProps = {
  faqs: FaqItem[]
}

export function LandingPagesFAQ({ faqs }: LandingPagesFAQProps) {
  return (
    <>
      <SectionDivider />
      <Section className="px-6 md:px-12 lg:px-20" aria-labelledby="faq-heading">
        <div className="mx-auto max-w-4xl">
          <motion.div {...sectionReveal} className="mb-[var(--heading-gap)] text-center">
            <h2
              id="faq-heading"
              className="font-bold text-foreground md:text-4xl lg:text-5xl"
            >
              Landing page questions
            </h2>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-40px' }}
            className="space-y-[var(--stack)]"
          >
            {faqs.map((faq) => (
              <MotionCard variant="plain" pad="sm" badge={false}
                key={faq.question}
                variants={itemVariants}
                className="block h-auto rounded-2xl border border-border bg-muted">
                <h3 className="mb-3 text-lg font-semibold text-foreground">{faq.question}</h3>
                <p className="text-base md:text-sm leading-normal md:leading-relaxed text-muted-foreground">{faq.answer}</p>
              </MotionCard>
            ))}
          </motion.div>
        </div>
      </Section>
    </>
  )
}
