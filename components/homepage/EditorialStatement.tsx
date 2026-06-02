'use client'

import { useTheme } from '@/contexts/ThemeContext'
import { motion } from 'framer-motion'

const EditorialStatement = () => {
  const { isNightMode } = useTheme()

  return (
    <section
      className="py-20 md:py-24 transition-colors duration-500"
      style={{ background: isNightMode ? '#000000' : '#FAFAFA' }}
    >
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 lg:items-start max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            <h2
              className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tight leading-[1.1]"
              style={{ color: isNightMode ? '#F8F8F8' : '#1A1A1A' }}
            >
              A stronger website changes how the business is perceived
            </h2>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6, delay: 0.1, ease: 'easeOut' }}
          >
            <p
              className="text-base md:text-lg leading-relaxed lg:pt-1"
              style={{ color: isNightMode ? 'rgba(255, 255, 255, 0.65)' : '#6B6B6B' }}
            >
              Your website is often the first serious look anyone takes at your business. We treat it that way.
            </p>
            <p
              className="text-base md:text-lg leading-relaxed lg:pt-1"
              style={{ color: isNightMode ? 'rgba(255, 255, 255, 0.65)' : '#6B6B6B' }}
            >
              A small number of clients at a time. Full attention on each one. The result is a site that feels like yours — because it is.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

export default EditorialStatement
