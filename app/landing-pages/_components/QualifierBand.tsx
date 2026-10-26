'use client'

import { MotionCard } from '@/components/ui/MotionCard'
import { Section } from '@/components/ui/Section'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { CheckCircle2, X } from 'lucide-react'
import SectionDivider from '@/components/ui/SectionDivider'
import { containerVariants, itemVariants, sectionReveal } from './motion'
import { sharedQualifierFit, sharedQualifierNotFit } from '../_data/variants'

type QualifierOverrides = {
  fit?: string[]
  notFit?: string[]
}

type QualifierBandProps = {
  overrides?: QualifierOverrides
}

export function QualifierBand({ overrides }: QualifierBandProps) {
  const fitItems = [...sharedQualifierFit, ...(overrides?.fit ?? [])]
  const notFitItems = [
    ...sharedQualifierNotFit.map((item) => ({
      key: item.before,
      before: item.before,
      link: item.link,
      after: item.after,
    })),
    ...(overrides?.notFit ?? []).map((text) => ({
      key: text,
      before: text,
      link: null as { href: string; label: string } | null,
      after: '',
    })),
  ]

  return (
    <>
      <SectionDivider />
      <Section className="px-6 md:px-12 lg:px-20" aria-labelledby="qualifier-heading">
        <div className="mx-auto max-w-6xl">
          <motion.div {...sectionReveal} className="mb-[var(--heading-gap)] text-center">
            <h2
              id="qualifier-heading"
              className="font-bold text-foreground md:text-4xl lg:text-5xl"
            >
              Who this is for.
            </h2>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-40px' }}
            className="grid gap-[var(--stack)] md:grid-cols-2"
          >
            <MotionCard variant="plain" badge={false}
              variants={itemVariants}
              className="block h-auto rounded-2xl border border-border bg-muted">
              <h3 className="mb-6 text-xl font-bold text-foreground">You&apos;re a fit if:</h3>
              <ul className="space-y-3">
                {fitItems.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle2
                      className="mt-0.5 h-4 w-4 shrink-0 text-cobalt-text"
                      aria-hidden
                    />
                    <span className="text-base md:text-sm leading-normal md:leading-relaxed text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </MotionCard>

            <MotionCard variant="plain" badge={false}
              variants={itemVariants}
              className="block h-auto rounded-2xl border border-border bg-muted">
              <h3 className="mb-6 text-xl font-bold text-foreground">You&apos;re not a fit if:</h3>
              <ul className="space-y-3">
                {notFitItems.map((item) => (
                  <li key={item.key} className="flex items-start gap-3">
                    <X
                      className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/70"
                      aria-hidden
                    />
                    <span className="text-base md:text-sm leading-normal md:leading-relaxed text-muted-foreground">
                      {item.before}
                      {item.link ? (
                        <Link
                          href={item.link.href}
                          className="link-ui font-medium text-cobalt-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0070F3]/40 focus-visible:ring-offset-2"
                        >
                          {item.link.label}
                        </Link>
                      ) : null}
                      {item.after}
                    </span>
                  </li>
                ))}
              </ul>
            </MotionCard>
          </motion.div>
        </div>
      </Section>
    </>
  )
}
