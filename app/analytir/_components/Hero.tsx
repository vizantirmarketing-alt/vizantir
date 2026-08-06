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
            className="mt-6 text-[2.25rem] font-black leading-[1.08] tracking-tight text-foreground md:text-5xl lg:text-6xl"
          >
            Most studios ship a website. We shipped software that finds the difference
            between what a business sold and what it kept.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut', delay: 0.2 }}
            className="mt-6 max-w-2xl text-base md:text-xl"
            style={{ color: 'var(--text-body)', lineHeight: 1.7 }}
          >
            Fees, tips, financing withholdings, and settlement delays all move between the
            sale and the deposit. Most tools report the sale and stop there.
          </motion.p>
        </div>
      </div>
    </section>
  )
}
