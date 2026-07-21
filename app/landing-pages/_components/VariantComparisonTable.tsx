'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { Eyebrow } from '@/components/ui/Eyebrow'
import SectionDivider from '@/components/ui/SectionDivider'
import { trackEvent } from '@/lib/analytics'
import {
  variants,
  type LandingPageVariant,
  type VariantSlug,
} from '../_data/variants'
import { containerVariants, itemVariants, sectionReveal } from './motion'

const VARIANT_ORDER: VariantSlug[] = ['primary', 'googleAds', 'productLaunches']

const ROW_KEYS = [
  { key: 'hero', label: 'Hero' },
  { key: 'problem', label: 'Problem framing' },
  { key: 'proof', label: 'Proof' },
  { key: 'qualifier', label: 'Qualifier' },
  { key: 'faq', label: 'FAQ' },
] as const

type ComparisonRowKey = (typeof ROW_KEYS)[number]['key']

type VariantComparisonTableProps = {
  currentSlug: VariantSlug
}

function highlightFor(
  variant: LandingPageVariant,
  key: ComparisonRowKey,
): string {
  return variant.comparisonHighlights[key]
}

export function VariantComparisonTable({ currentSlug }: VariantComparisonTableProps) {
  const current = variants[currentSlug]

  return (
    <>
      <SectionDivider />
      <section
        className="px-6 py-20 md:px-12 lg:px-20"
        aria-labelledby="variant-comparison-heading"
      >
        <div className="mx-auto max-w-6xl">
          <motion.div {...sectionReveal} className="mb-14 mx-auto max-w-3xl text-center">
            <Eyebrow>What changes per variant</Eyebrow>
            <h2
              id="variant-comparison-heading"
              className="mb-5 text-3xl font-bold text-foreground md:text-4xl lg:text-5xl"
            >
              Same system. Different job per URL.
            </h2>
            <p className="text-lg leading-relaxed text-muted-foreground">
              The current URL is highlighted below. The other two stay visible so you can see how
              Campaign System shifts messaging without rebuilding from scratch.
            </p>
          </motion.div>

          <div className="grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.4fr)]">
            <motion.div
              {...sectionReveal}
              className="rounded-2xl border border-cobalt-accent/40 bg-cobalt-muted-subtle p-6 md:p-8"
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-cobalt-accent">
                This variant is optimized for
              </p>
              <p className="mt-4 text-xl font-bold leading-snug text-foreground md:text-2xl">
                {current.optimizedFor}
              </p>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                Hero, problem framing, proof callout, fit criteria, and FAQ answers are all tuned
                for this audience. Shared product, process, and deliverables stay consistent across
                the family.
              </p>
            </motion.div>

            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-40px' }}
              className="space-y-3"
            >
              {ROW_KEYS.map((row) => (
                <motion.div
                  key={row.key}
                  variants={itemVariants}
                  className="group rounded-2xl border border-border bg-muted/30 p-4 transition-colors hover:border-cobalt-accent/40 hover:bg-cobalt-muted-subtle/50 md:p-5"
                >
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-foreground">{row.label}</p>
                    <ArrowRight
                      className="h-4 w-4 shrink-0 text-cobalt-accent opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100"
                      aria-hidden
                    />
                  </div>
                  <ul className="space-y-2">
                    {VARIANT_ORDER.map((slug) => {
                      const variant = variants[slug]
                      const isCurrent = slug === currentSlug
                      return (
                        <li key={slug}>
                          {isCurrent ? (
                            <div className="rounded-xl border border-cobalt-accent/30 bg-background/80 px-3 py-2">
                              <p className="text-xs font-semibold uppercase tracking-wider text-cobalt-accent">
                                Current · {variant.hero.eyebrow}
                              </p>
                              <p className="mt-1 text-sm leading-relaxed text-foreground">
                                {highlightFor(variant, row.key)}
                              </p>
                            </div>
                          ) : (
                            <Link
                              href={variant.route}
                              onClick={() =>
                                trackEvent('landing_pages_variant_comparison_navigate', {
                                  from: currentSlug,
                                  to: slug,
                                  row: row.key,
                                })
                              }
                              className="block rounded-xl border border-transparent px-3 py-2 opacity-55 transition-opacity hover:opacity-90 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0070F3]/40 focus-visible:ring-offset-2"
                            >
                              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                {variant.hero.eyebrow}
                              </p>
                              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                                {highlightFor(variant, row.key)}
                              </p>
                            </Link>
                          )}
                        </li>
                      )
                    })}
                  </ul>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>
    </>
  )
}
