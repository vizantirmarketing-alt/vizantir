'use client'

import { useTheme } from '@/contexts/ThemeContext'
import { motion } from 'framer-motion'

const OperatorStatement = () => {
  const { isNightMode } = useTheme()

  return (
    <section
      className="py-20 md:py-24 transition-colors duration-500"
      style={{ background: isNightMode ? '#000000' : '#FAFAFA' }}
    >
      <div className="container mx-auto px-4">
        <div
          className="w-full max-w-5xl mx-auto h-px mb-16 md:mb-20"
          style={{
            background: isNightMode
              ? 'linear-gradient(90deg, transparent, rgba(255,198,76,0.25), transparent)'
              : 'linear-gradient(90deg, transparent, rgba(255,198,76,0.4), transparent)',
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
            style={{ color: isNightMode ? '#F8F8F8' : '#1A1A1A' }}
          >
            Built with an operator&apos;s mindset
          </h2>
          <p
            className="text-base md:text-lg leading-relaxed"
            style={{ color: isNightMode ? 'rgba(255, 255, 255, 0.65)' : '#6B6B6B' }}
          >
            Vizantir was founded in Las Vegas by someone with 25 years of business ownership and more than 10 years building websites. That perspective changes the work. Every decision is made with the business in mind: what matters, what is unnecessary, and what actually improves the final result.
          </p>
        </motion.div>
      </div>
    </section>
  )
}

export default OperatorStatement
