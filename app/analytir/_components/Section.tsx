'use client'

import { motion } from 'framer-motion'

import { cn } from '@/lib/utils'

type SectionProps = {
  headline: string
  body: string
  flip?: boolean
  children: React.ReactNode
}

export function Section({
  headline,
  body,
  flip = false,
  children,
}: SectionProps) {
  return (
    <section
      className="overflow-x-hidden py-12 md:py-20"
      style={{ background: 'var(--background)' }}
    >
      <div className="container mx-auto grid items-center gap-10 px-4 lg:grid-cols-12 lg:gap-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className={cn('max-w-xl lg:col-span-5', flip && 'lg:order-2')}
        >
          <h2 className="text-4xl font-black tracking-tight text-foreground md:text-5xl lg:text-6xl">
            {headline}
          </h2>
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6, ease: 'easeOut', delay: 0.2 }}
            className="mt-5 text-base text-body md:text-lg"
            style={{ lineHeight: 1.7 }}
          >
            {body}
          </motion.p>
        </motion.div>
        <div className={cn('lg:col-span-7', flip && 'lg:order-1')}>{children}</div>
      </div>
    </section>
  )
}
