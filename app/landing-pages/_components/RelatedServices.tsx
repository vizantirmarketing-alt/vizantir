'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Eyebrow } from '@/components/ui/Eyebrow'
import SectionDivider from '@/components/ui/SectionDivider'
import { containerVariants, itemVariants, sectionReveal } from './motion'

const relatedServices = [
  {
    title: 'Web Design',
    description: 'Custom multi-page websites for established businesses that need more than one page.',
    href: '/services/web-design',
  },
  {
    title: 'Website Care',
    description: 'Ongoing care, updates, and preferred rates after your site or landing page launches.',
    href: '/services/website-care',
  },
  {
    title: 'Website Strategy',
    description: 'Clarify positioning, offer, and structure before you invest in a build.',
    href: '/services/website-strategy',
  },
] as const

export function RelatedServices() {
  return (
    <>
      <SectionDivider />
      <section className="px-6 py-20 md:px-12 lg:px-20" aria-labelledby="related-services-heading">
        <div className="mx-auto max-w-6xl">
          <motion.div {...sectionReveal} className="mb-14 text-center">
            <Eyebrow>Related</Eyebrow>
            <h2
              id="related-services-heading"
              className="text-3xl font-bold text-foreground md:text-4xl lg:text-5xl"
            >
              Related services.
            </h2>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-40px' }}
            className="grid gap-6 md:grid-cols-3"
          >
            {relatedServices.map((service) => (
              <motion.div
                key={service.href}
                variants={itemVariants}
                className="flex h-full flex-col rounded-2xl border border-border bg-muted/40 p-6"
              >
                <h3 className="mb-3 text-lg font-bold text-foreground">{service.title}</h3>
                <p className="mb-6 flex-1 text-sm leading-relaxed text-muted-foreground">
                  {service.description}
                </p>
                <Link
                  href={service.href}
                  className="group inline-flex items-center text-sm font-semibold text-cobalt-accent underline-offset-2 transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0070F3]/40 focus-visible:ring-offset-2"
                >
                  Learn more
                  <ArrowRight className="ml-1.5 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
    </>
  )
}
