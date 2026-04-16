'use client'

import { memo, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import { motion } from 'framer-motion'
import { trackCTAClick } from '@/lib/analytics'
import type { CaseStudyListItem } from '@/lib/sanity/types'

interface CaseStudiesClientProps {
  caseStudies: CaseStudyListItem[]
}

const CaseStudiesClient = ({ caseStudies }: CaseStudiesClientProps) => {
  const { isNightMode } = useTheme()
  const [selectedCategory, setSelectedCategory] = useState<string>('All')

  const categories = useMemo(() => {
    const industryList = caseStudies
      .map((cs) => cs.industry)
      .filter((industry): industry is string => Boolean(industry))
    return ['All', ...Array.from(new Set(industryList))]
  }, [caseStudies])

  const filteredStudies = selectedCategory === 'All' 
    ? caseStudies 
    : caseStudies.filter(cs => cs.industry === selectedCategory)

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3, ease: 'easeOut' as const },
    },
  }

  return (
    <main 
      className="min-h-screen pt-24 pb-20 transition-colors duration-500"
      style={{ background: isNightMode ? '#000000' : '#FAFAFA' }}
    >
      <div className="container mx-auto px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <p 
              className="text-sm tracking-[0.3em] uppercase mb-4"
              style={{ color: '#FFC64C' }}
            >
              Our Work
            </p>
            <h1 
              className="text-4xl md:text-5xl lg:text-6xl font-black mb-6 tracking-tight transition-colors duration-500"
              style={{ color: isNightMode ? '#FFFFFF' : '#1A1A1A' }}
            >
              Websites We Have Launched
            </h1>
            <p 
              className="text-lg md:text-xl max-w-2xl mx-auto transition-colors duration-500"
              style={{ color: isNightMode ? '#A0A0A0' : '#6B6B6B' }}
            >
              Modern websites built to load fast, rank well, and convert visitors
            </p>
          </motion.div>

          {/* Filter Pills */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="flex flex-wrap items-center justify-center gap-3 mb-16"
          >
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className="px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300"
                style={{
                  background: selectedCategory === category
                    ? '#FFC64C'
                    : isNightMode
                    ? 'rgba(255, 255, 255, 0.05)'
                    : 'rgba(0, 0, 0, 0.05)',
                  color: selectedCategory === category
                    ? '#1A1A1A'
                    : isNightMode
                    ? '#FFFFFF'
                    : '#1A1A1A',
                  border: selectedCategory === category
                    ? 'none'
                    : isNightMode
                    ? '1px solid rgba(255, 255, 255, 0.1)'
                    : '1px solid rgba(0, 0, 0, 0.1)',
                }}
              >
                {category}
              </button>
            ))}
          </motion.div>

          {/* Case Studies Grid */}
          <motion.div
            key={selectedCategory}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16"
          >
            {filteredStudies.map((study, index) => (
              <motion.div
                key={study.title}
                variants={itemVariants}
                className="group"
              >
                <Link
                  href={`/case-studies/${study.slug}`}
                  className="group block rounded-2xl border p-6 transition-all duration-300 hover:-translate-y-1"
                  style={{
                    background: isNightMode ? '#0A0A0A' : '#FFFFFF',
                    borderColor: isNightMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
                  }}
                >
                  {study.heroImage?.asset?.url ? (
                    <div className="mb-6 overflow-hidden rounded-xl border" style={{ borderColor: isNightMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }}>
                      <img
                        src={study.heroImage.asset.url}
                        alt={study.heroImage.alt || study.title}
                        className="h-56 w-full object-cover"
                        loading={index < 2 ? 'eager' : 'lazy'}
                      />
                    </div>
                  ) : null}

                  <div className="space-y-4">
                    {study.industry ? (
                      <p className="text-sm tracking-[0.2em] uppercase" style={{ color: '#FFC64C' }}>
                        {study.industry}
                      </p>
                    ) : null}
                    <h3
                      className="text-2xl md:text-3xl font-bold group-hover:text-[#FFC64C] transition-colors duration-300"
                      style={{ color: isNightMode ? '#FFFFFF' : '#1A1A1A' }}
                    >
                      {study.title}
                    </h3>
                    {study.client ? (
                      <p className="text-sm font-medium uppercase tracking-[0.15em]" style={{ color: isNightMode ? '#D1D5DB' : '#4B5563' }}>
                        {study.client}
                      </p>
                    ) : null}
                    {study.summary ? (
                      <p className="leading-relaxed transition-colors duration-500" style={{ color: isNightMode ? '#A0A0A0' : '#6B6B6B' }}>
                        {study.summary}
                      </p>
                    ) : null}
                    {study.stack?.length ? (
                      <div className="flex flex-wrap gap-2 pt-2">
                        {study.stack.map((item) => (
                          <span
                            key={item}
                            className="px-3 py-1 rounded-full text-xs font-medium transition-colors duration-500"
                            style={{
                              background: isNightMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                              color: isNightMode ? '#A0A0A0' : '#6B6B6B',
                              border: isNightMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
                            }}
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    ) : null}
                    <span
                      className="inline-flex items-center gap-2 font-semibold transition-colors duration-300 group-hover:text-[#FFC64C]"
                      style={{ color: isNightMode ? '#FFFFFF' : '#1A1A1A' }}
                    >
                      View case study
                      <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </Link>
                </motion.div>
              ))}
          </motion.div>

          {/* Bottom CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-center mt-20"
          >
            <p 
              className="text-xl mb-8 transition-colors duration-500"
              style={{ color: isNightMode ? '#A0A0A0' : '#6B6B6B' }}
            >
              Ready to grow with a partner who values transparency and measurable results?
            </p>
            
            <Link
              href="/contact"
              onClick={() => trackCTAClick('start_your_project', 'case_studies')}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-base transition-all duration-300 hover:scale-105 group bg-[#FFC64C] text-[#1A1A1A]"
              style={{
                boxShadow: '0 8px 30px rgba(255, 198, 76, 0.3)',
              }}
            >
              Start Your Project
              <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </motion.div>
        </div>
      </div>
    </main>
  )
}

export default memo(CaseStudiesClient)