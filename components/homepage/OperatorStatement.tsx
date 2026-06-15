'use client'

import { motion } from 'framer-motion'

const OperatorStatement = () => {
  return (
    <section
      className="py-16 md:py-20 transition-colors duration-500"
      style={{ background: '#FAFAFA' }}
    >
      <div className="container mx-auto px-4">
        <div
          className="w-full max-w-5xl mx-auto h-px mb-12 md:mb-14"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(255,198,76,0.4), transparent)',
          }}
          aria-hidden
        />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="max-w-3xl mx-auto text-center"
        >
          <h2
            className="text-4xl md:text-5xl lg:text-6xl font-black mb-6 tracking-tight"
            style={{ color: '#1A1A1A' }}
          >
            Built with an operator&apos;s mindset
          </h2>
          <p
            className="text-base md:text-lg leading-relaxed"
            style={{ color: '#6B6B6B' }}
          >
            Vizantir was founded in Las Vegas by someone with 25 years of business ownership and over a decade building websites. That perspective changes the work. Every decision is made with the business in mind: what matters, what is unnecessary, and what actually improves the final result.
          </p>
        </motion.div>
      </div>
    </section>
  )
}

export default OperatorStatement
