'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { ReportPageScreen } from '@/app/analytir/_screens/ReportPageScreen'

const AnalytirSection = () => {
  return (
    <section
      className="py-16 md:py-20"
      style={{ background: 'var(--background)' }}
    >
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <motion.div
            className="max-w-xl"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            <Eyebrow align="start" className="mb-6">
              In house
            </Eyebrow>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black mb-5 tracking-tight text-foreground">
              We built an analytics product to find out how far we could take it.
            </h2>
            <p
              className="text-base md:text-lg text-body"
              style={{ lineHeight: 1.7 }}
            >
              Analytir reconciles what a merchant sold against what actually reached their
              bank. Seventy-nine API routes, twenty-seven database tables, and a reporting
              engine that writes in sentences. No client asked for it.
            </p>
            <Link
              href="/analytir"
              className="group inline-flex items-center gap-2 mt-8 text-base"
              style={{ color: 'var(--cobalt-accent)' }}
            >
              <span>See what we built</span>
              <ArrowRight
                size={18}
                className="transition-transform group-hover:translate-x-1"
              />
            </Link>
          </motion.div>

          <motion.div
            className="min-w-0"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
          >
            <Link
              href="/analytir"
              className="block min-w-0 transition-transform duration-300 hover:-translate-y-1"
            >
              <div
                className="min-w-0 overflow-hidden"
                style={{ width: '100%', maxWidth: 560, margin: '0 auto' }}
              >
                <ReportPageScreen />
              </div>
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

export default AnalytirSection
