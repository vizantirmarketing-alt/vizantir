'use client'

import { motion } from 'framer-motion'

import { Eyebrow } from '@/components/ui/Eyebrow'

export function Hero() {
  return (
    <section
      className="pt-28 pb-16 md:pt-36 md:pb-24"
      style={{ background: 'var(--background)' }}
    >
      <div className="container mx-auto px-4">
        <div className="max-w-4xl">
          <Eyebrow align="start">In house</Eyebrow>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="mt-6 text-5xl font-black tracking-tight text-foreground md:text-6xl lg:text-7xl"
          >
            We built the analytics engine that a payments company should have built.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut', delay: 0.2 }}
            className="mt-6 max-w-2xl text-lg md:text-xl"
            style={{ color: 'var(--text-body)', lineHeight: 1.7 }}
          >
            Analytir reconciles what a merchant sold against what actually reached their
            bank. It exists because the reporting they were handed was wrong. On one
            account, a timezone bug in the platform&apos;s own API had inflated reported
            revenue by $52,571.
          </motion.p>
        </div>
      </div>
    </section>
  )
}
