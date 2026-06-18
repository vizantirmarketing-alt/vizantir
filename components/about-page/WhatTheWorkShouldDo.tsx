'use client'

import { motion } from 'framer-motion'

const cards = [
  {
    title: 'Reflect the level of the business',
    description: 'A serious business should not look interchangeable online.',
  },
  {
    title: 'Create clarity',
    description:
      'The right structure makes the message easier to understand and the next step easier to take.',
  },
  {
    title: 'Support trust',
    description:
      'Presentation, speed, polish, and consistency all influence how credible a business feels.',
  },
  {
    title: 'Stay usable after launch',
    description:
      'Your team should be able to update it, rely on it, and not think about it',
  },
]

const WhatTheWorkShouldDo = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  }

  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: 'easeOut' as const },
    },
  }

  return (
    <section
      className="py-20 md:py-24 transition-colors duration-500"
      style={{ background: '#FAF9F5' }}
    >
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6, ease: 'easeOut' as const }}
          className="text-center mb-16"
        >
          <h2
            className="text-4xl md:text-5xl lg:text-6xl font-black mb-4 tracking-tight"
            style={{ color: '#1A1A1A' }}
          >
            What the work should do
          </h2>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          className="grid md:grid-cols-2 gap-6 lg:gap-8 max-w-6xl mx-auto"
        >
          {cards.map((card, index) => (
            <motion.div
              key={index}
              variants={cardVariants}
              className="card-interactive group relative p-8 lg:p-10 rounded-2xl overflow-hidden"
              style={{
                background: 'rgba(255, 255, 255, 0.7)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                border: '1px solid rgba(0, 0, 0, 0.08)',
                boxShadow: '0 4px 24px rgba(0, 0, 0, 0.06)',
              }}
            >
              <h3
                className="text-xl md:text-2xl font-bold mb-3 transition-colors duration-300"
                style={{ color: '#1A1A1A' }}
              >
                {card.title}
              </h3>
              <p
                className="text-base md:text-lg leading-relaxed"
                style={{ color: '#6B6B6B' }}
              >
                {card.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

export default WhatTheWorkShouldDo
