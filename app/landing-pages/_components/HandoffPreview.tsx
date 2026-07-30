'use client'

import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { Eyebrow } from '@/components/ui/Eyebrow'
import SectionDivider from '@/components/ui/SectionDivider'
import { trackEvent } from '@/lib/analytics'
import { containerVariants, itemVariants, sectionReveal } from './motion'

const HANDOFF_SECTIONS = [
  {
    number: '01',
    title: 'Variant management guide',
    detail: 'How primary and variant pages share components, when to spin a new audience page.',
  },
  {
    number: '02',
    title: 'Copy update playbook',
    detail: 'Where headlines, offers, and proof live in the codebase and how to change them safely.',
  },
  {
    number: '03',
    title: 'Analytics event reference',
    detail: 'Event names, locations, and which goals map to form submits, CTAs, and phone taps.',
  },
  {
    number: '04',
    title: 'A/B test setup reference',
    detail: 'How traffic split works across variants and what to measure before declaring a winner.',
  },
  {
    number: '05',
    title: 'Support window details',
    detail: 'What is covered post-launch, response expectations, and how to request a change.',
  },
] as const

type HandoffPreviewProps = {
  trackingLocation: string
}

export function HandoffPreview({ trackingLocation }: HandoffPreviewProps) {
  useEffect(() => {
    trackEvent('landing_pages_handoff_preview_view', {
      location: trackingLocation,
    })
  }, [trackingLocation])

  return (
    <>
      <SectionDivider />
      <section
        className="px-6 py-20 md:px-12 lg:px-20"
        aria-labelledby="handoff-preview-heading"
      >
        <div className="mx-auto max-w-6xl">
          <motion.div {...sectionReveal} className="mb-14 mx-auto max-w-3xl text-center">
            <Eyebrow>Handoff</Eyebrow>
            <h2
              id="handoff-preview-heading"
              className="mb-5 text-3xl font-bold text-foreground md:text-4xl lg:text-5xl"
            >
              Documentation you can run the campaign with.
            </h2>
            <p className="text-lg leading-relaxed text-muted-foreground">
              Conversion System delivery includes a handoff document your team actually uses after
              launch. Below is a sample table of contents from that pack.
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-40px' }}
            className="mx-auto max-w-3xl"
          >
            <motion.div
              variants={itemVariants}
              className="rounded-2xl border border-border bg-muted/30 p-6 shadow-sm md:p-8"
            >
              <p className="mb-6 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                Sample handoff document
              </p>
              <div className="mb-6 border-b border-border pb-4">
                <p className="font-mono text-sm font-semibold text-foreground">
                  vizantir-conversion-system-handoff.md
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Delivered at launch with your source code and analytics verification notes.
                </p>
              </div>

              <ol className="space-y-4">
                {HANDOFF_SECTIONS.map((section) => (
                  <li
                    key={section.number}
                    className="grid grid-cols-[auto_1fr] gap-4 border-b border-border/70 pb-4 last:border-b-0 last:pb-0"
                  >
                    <span className="font-mono text-xs font-semibold text-cobalt-accent">
                      {section.number}
                    </span>
                    <div>
                      <p className="font-mono text-sm font-semibold text-foreground">
                        {section.title}
                      </p>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                        {section.detail}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </>
  )
}
