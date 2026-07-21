'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { CheckCircle2, X } from 'lucide-react'
import { Eyebrow } from '@/components/ui/Eyebrow'
import SectionDivider from '@/components/ui/SectionDivider'
import { containerVariants, itemVariants, sectionReveal } from './motion'

const sharedFitItems = [
  "You're running paid traffic or planning to",
  'You have a specific offer, promotion, or launch to sell',
  'You want the page to actually convert, not just exist',
  'You care that the code is yours to keep',
] as const

const sharedNotFitItems = [
  {
    before: 'You need a full multi-page website (',
    link: { href: '/services/web-design', label: 'see Web Design instead' },
    after: ')',
  },
  {
    before: "Your offer isn't defined yet (",
    link: { href: '/services/website-strategy', label: 'start with Website Strategy' },
    after: ')',
  },
  {
    before: 'You want a template you can edit yourself (Webflow serves that market well)',
    link: null,
    after: '',
  },
  {
    before: 'You need a $500 one-pager (we can recommend other options)',
    link: null,
    after: '',
  },
] as const

type QualifierOverrides = {
  fit?: string[]
  notFit?: string[]
}

type QualifierBandProps = {
  overrides?: QualifierOverrides
}

export function QualifierBand({ overrides }: QualifierBandProps) {
  const fitItems = [...sharedFitItems, ...(overrides?.fit ?? [])]
  const notFitItems = [
    ...sharedNotFitItems.map((item) => ({
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
      <section className="px-6 py-20 md:px-12 lg:px-20" aria-labelledby="qualifier-heading">
        <div className="mx-auto max-w-6xl">
          <motion.div {...sectionReveal} className="mb-14 text-center">
            <Eyebrow>Fit</Eyebrow>
            <h2
              id="qualifier-heading"
              className="text-3xl font-bold text-foreground md:text-4xl lg:text-5xl"
            >
              Who this is for.
            </h2>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-40px' }}
            className="grid gap-6 md:grid-cols-2"
          >
            <motion.div
              variants={itemVariants}
              className="rounded-2xl border border-border bg-muted/40 p-6 md:p-8"
            >
              <h3 className="mb-6 text-xl font-bold text-foreground">You&apos;re a fit if:</h3>
              <ul className="space-y-3">
                {fitItems.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle2
                      className="mt-0.5 h-4 w-4 shrink-0 text-cobalt-accent"
                      aria-hidden
                    />
                    <span className="text-sm leading-relaxed text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="rounded-2xl border border-border bg-muted/40 p-6 md:p-8"
            >
              <h3 className="mb-6 text-xl font-bold text-foreground">You&apos;re not a fit if:</h3>
              <ul className="space-y-3">
                {notFitItems.map((item) => (
                  <li key={item.key} className="flex items-start gap-3">
                    <X
                      className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/70"
                      aria-hidden
                    />
                    <span className="text-sm leading-relaxed text-muted-foreground">
                      {item.before}
                      {item.link ? (
                        <Link
                          href={item.link.href}
                          className="font-medium text-cobalt-accent underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0070F3]/40 focus-visible:ring-offset-2"
                        >
                          {item.link.label}
                        </Link>
                      ) : null}
                      {item.after}
                    </span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </>
  )
}
