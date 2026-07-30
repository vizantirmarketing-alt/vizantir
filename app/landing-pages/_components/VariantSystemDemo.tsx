'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Eyebrow } from '@/components/ui/Eyebrow'
import SectionDivider from '@/components/ui/SectionDivider'
import { trackEvent } from '@/lib/analytics'
import { containerVariants, itemVariants, sectionReveal } from './motion'

const DEMO_TILES = [
  {
    label: 'Primary',
    audience: 'Brand / broad intent',
    cpc: '$5.00',
    convRate: '4.2%',
  },
  {
    label: 'Variant 1',
    audience: 'High-intent service',
    cpc: '$5.00',
    convRate: '6.8%',
  },
  {
    label: 'Variant 2',
    audience: 'Offer-specific',
    cpc: '$5.00',
    convRate: '8.1%',
  },
] as const

export function VariantSystemDemo() {
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    trackEvent('landing_pages_variant_system_demo_view', {
      location: 'landing_pages_primary',
    })
  }, [])

  useEffect(() => {
    const id = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % DEMO_TILES.length)
    }, 3000)
    return () => window.clearInterval(id)
  }, [])

  return (
    <>
      <SectionDivider />
      <section
        className="px-6 py-20 md:px-12 lg:px-20"
        aria-labelledby="variant-system-demo-heading"
      >
        <div className="mx-auto max-w-6xl">
          <motion.div {...sectionReveal} className="mb-14 mx-auto max-w-3xl text-center">
            <Eyebrow>How the variants work</Eyebrow>
            <h2
              id="variant-system-demo-heading"
              className="mb-5 text-3xl font-bold text-foreground md:text-4xl lg:text-5xl"
            >
              One system. Three audiences. Shared infrastructure.
            </h2>
            <p className="text-lg leading-relaxed text-muted-foreground">
              Conversion System lets you test messaging per audience without three separate builds.
              Same components, same analytics schema, different copy and proof for each traffic
              source.
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-40px' }}
            className="grid gap-6 md:grid-cols-3"
          >
            {DEMO_TILES.map((tile, index) => {
              const isActive = index === activeIndex
              return (
                <motion.div
                  key={tile.label}
                  variants={itemVariants}
                  className={`relative rounded-2xl border p-6 transition-colors duration-500 ${
                    isActive
                      ? 'border-cobalt-accent bg-cobalt-muted-subtle'
                      : 'border-border bg-muted/40'
                  }`}
                  aria-current={isActive ? 'true' : undefined}
                >
                  <div className="mb-5 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-cobalt-accent">
                        {tile.label}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">{tile.audience}</p>
                    </div>
                    <span
                      className={`h-2.5 w-2.5 rounded-full transition-colors duration-500 ${
                        isActive ? 'bg-cobalt-accent' : 'bg-border'
                      }`}
                      aria-hidden
                    />
                  </div>

                  <div className="space-y-3 rounded-xl border border-border/80 bg-background/70 p-4 font-mono text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">CPC</span>
                      <span className="font-semibold text-foreground">{tile.cpc}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Conv. rate</span>
                      <span className="font-semibold text-foreground">{tile.convRate}</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-border/60">
                      <motion.div
                        className="h-full rounded-full bg-cobalt-accent"
                        initial={false}
                        animate={{ width: isActive ? '100%' : '55%' }}
                        transition={{ duration: 0.45, ease: 'easeOut' }}
                      />
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </motion.div>

          <motion.div {...sectionReveal} className="mt-8 text-center">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Illustrative only.</span> Sample
              numbers for visualization. Not real client data.
            </p>
            <div className="mt-4 flex items-center justify-center gap-2" aria-hidden>
              {DEMO_TILES.map((tile, index) => (
                <span
                  key={tile.label}
                  className={`h-1.5 w-6 rounded-full transition-colors duration-500 ${
                    index === activeIndex ? 'bg-cobalt-accent' : 'bg-border'
                  }`}
                />
              ))}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Active variant indicator cycles every 3 seconds
            </p>
          </motion.div>
        </div>
      </section>
    </>
  )
}
