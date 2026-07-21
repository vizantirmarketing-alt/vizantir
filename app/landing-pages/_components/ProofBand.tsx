'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Eyebrow } from '@/components/ui/Eyebrow'
import SectionDivider from '@/components/ui/SectionDivider'
import type { ProofClient } from '../_lib/get-proof-clients'
import { containerVariants, itemVariants, sectionReveal } from './motion'

function formatClientList(names: string[]): string {
  if (names.length === 0) return ''
  if (names.length === 1) return names[0]
  if (names.length === 2) return `${names[0]} and ${names[1]}`
  return `${names.slice(0, -1).join(', ')}, and ${names[names.length - 1]}`
}

type ProofBandProps = {
  clients: ProofClient[]
  callout?: string
}

export function ProofBand({ clients, callout }: ProofBandProps) {
  const names = clients.map((client) => client.title)
  const namedClause =
    names.length > 0
      ? ` including ${formatClientList(names)}. All live, all owned by the client, all built on the same stack that powers these landing pages.`
      : '. All live work is owned by the client and built on the same stack that powers these landing pages.'

  return (
    <>
      <SectionDivider />
      <section className="px-6 py-20 md:px-12 lg:px-20" aria-labelledby="proof-heading">
        <div className="mx-auto max-w-6xl">
          {callout ? (
            <motion.div {...sectionReveal} className="mb-10">
              <div className="mx-auto max-w-3xl rounded-2xl border border-cobalt-accent/30 bg-cobalt-muted-subtle px-6 py-5 text-center">
                <p className="text-base font-semibold leading-relaxed text-foreground md:text-lg">
                  {callout}
                </p>
              </div>
            </motion.div>
          ) : null}

          <motion.div {...sectionReveal} className="mb-14 mx-auto max-w-3xl text-center">
            <Eyebrow>Proof</Eyebrow>
            <h2
              id="proof-heading"
              className="mb-5 text-3xl font-bold text-foreground md:text-4xl lg:text-5xl"
            >
              Process-driven proof.
            </h2>
            <p className="text-lg leading-relaxed text-muted-foreground">
              Landing page effectiveness is a function of scoping, tracking, and craft. Vizantir has
              shipped custom Next.js sites and campaign pages for real Las Vegas businesses
              {namedClause}
            </p>
          </motion.div>

          {clients.length > 0 ? (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-40px' }}
              className="grid gap-4 sm:grid-cols-3"
            >
              {clients.map((client) => (
                <motion.div key={client.slug} variants={itemVariants}>
                  <Link
                    href={`/case-studies/${client.slug}`}
                    className="group flex items-center justify-between rounded-2xl border border-border bg-muted/40 px-5 py-4 transition-colors hover:border-cobalt-accent/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0070F3]/40 focus-visible:ring-offset-2"
                  >
                    <span className="text-sm font-semibold text-foreground">{client.title}</span>
                    <ArrowRight className="h-4 w-4 text-cobalt-accent transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          ) : null}
        </div>
      </section>
    </>
  )
}
