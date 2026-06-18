'use client'

import { motion } from 'framer-motion'

const EditorialStatement = () => {
  return (
    <section
      className="py-16 md:py-20 short-landscape:py-8 transition-colors duration-500"
      style={{ background: '#FAF9F5' }}
    >
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-12 lg:items-start max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            <h2
              className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tight leading-[1.1]"
              style={{ color: '#1A1A1A' }}
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
              style={{ color: '#6B6B6B' }}
            >
              Your website is often the first serious look anyone takes at your business. We treat it that way.
            </p>
            <p
              className="text-base md:text-lg leading-relaxed lg:pt-1"
              style={{ color: '#6B6B6B' }}
            >
              A small number of clients at a time. Full attention on each one. The result is a site that feels like yours — because it is.
            </p>
            <p
              className="text-base md:text-lg leading-relaxed lg:pt-1"
              style={{ color: '#6B6B6B' }}
            >
              Some websites are built. Most are assembled. You can tell the difference — and so can Google.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

export default EditorialStatement
