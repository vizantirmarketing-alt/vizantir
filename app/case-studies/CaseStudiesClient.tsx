'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, ExternalLink } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import { motion, AnimatePresence } from 'framer-motion'

interface CaseStudy {
  slug?: string
  title: string
  category: string
  description: string
  longDescription?: string
  image: string
  link: string
  services: string[]
  results?: Array<{ label: string; value: string }>
}

const CaseStudiesClient = () => {
  const { isNightMode } = useTheme()
  const [selectedCategory, setSelectedCategory] = useState<string>('All')

  const caseStudies: CaseStudy[] = [
    {
      title: 'Pink Salt Salon',
      category: 'Beauty & Wellness',
      description: 'Luxury nail salon website with dark theme, elegant typography, and seamless booking integration. Built on Next.js for lightning-fast performance and SEO optimization.',
      image: '/ps.png',
      link: 'https://pinksaltsalonandspa.com',
      services: ['Web Design', 'Next.js Development', 'SEO', 'Booking Integration'],
    },
    {
      title: 'Essence of Watches',
      category: 'Luxury E-Commerce',
      description: 'Pre-owned Rolex marketplace featuring premium design, authentication flow, and advanced filtering. Custom e-commerce solution with secure payment processing.',
      image: '/eow.png',
      link: 'https://essenceofwatches.com',
      services: ['E-Commerce', 'Web Design', 'Next.js Development', 'Payment Integration'],
    },
    {
      title: 'Fuji Omakase',
      category: 'Hospitality',
      description: 'Michelin-starred omakase restaurant website with immersive animations, editorial design, and premium booking experience. Showcasing culinary excellence through elegant design.',
      image: '/fuji-omakase.png',
      link: 'https://fujiomakase.com',
      services: ['Web Design', 'Next.js Development', 'Animation', 'Booking System'],
    },
    {
      slug: 'petale-et-fete',
      title: 'Pétale & Fête',
      category: 'Events & Weddings',
      description: 'Elegant event planning website with soft aesthetics and celebration showcase.',
      longDescription: 'Pétale & Fête needed a website that captured the elegance and romance of their Las Vegas event planning services. We designed a soft, feminine aesthetic with organic shapes, beautiful typography, and a portfolio showcase for their celebrations.',
      image: '/petale-fete.png',
      link: 'https://petaleandfete.com',
      services: ['Web Design', 'Development', 'Portfolio Gallery'],
      results: [
        { label: 'PageSpeed Score', value: '94+' },
        { label: 'Load Time', value: '<1s' },
      ],
    },
    {
      title: 'High Roller Legal',
      category: 'Legal',
      description: 'Premium personal injury law firm website with sophisticated typography, trial-ready positioning, and conversion-optimized design. Built to convey authority and win serious injury cases.',
      image: '/high-roller-legal.png',
      link: 'https://highrollerlegal.com',
      services: ['Web Design', 'Next.js Development', 'SEO', 'Conversion Optimization'],
    },
  ]

  const categories = ['All', ...Array.from(new Set(caseStudies.map(cs => cs.category)))]

  const filteredStudies = selectedCategory === 'All' 
    ? caseStudies 
    : caseStudies.filter(cs => cs.category === selectedCategory)

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
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: 'easeOut' as const },
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
              Modern, high-performing websites designed for speed, SEO, and conversions.
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
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16"
          >
            <AnimatePresence mode="wait">
              {filteredStudies.map((study, index) => (
                <motion.div
                  key={study.title}
                  variants={itemVariants}
                  layout
                  className="group"
                >
                  {/* Mockup Image */}
                  <div className="relative mb-8 transition-transform duration-500 group-hover:scale-[1.02]">
                    <div className="relative aspect-[4/3] w-full group">
                      {/* Subtle glow behind mockup */}
                      <div 
                        className="absolute inset-0 opacity-20 blur-3xl transition-opacity duration-500 group-hover:opacity-30"
                        style={{
                          background: 'radial-gradient(ellipse at center, rgba(255,198,76,0.3), transparent 70%)',
                        }}
                      />
                      <Image
                        src={study.image}
                        alt={study.title}
                        fill
                        className="object-contain transition-all duration-500 relative z-10"
                        sizes="(max-width: 768px) 100vw, 50vw"
                      />
                    </div>
                  </div>

                  {/* Project Info */}
                  <div className="space-y-4">
                    <p 
                      className="text-sm tracking-[0.2em] uppercase"
                      style={{ color: '#FFC64C' }}
                    >
                      {study.category}
                    </p>
                    <h3 
                      className="text-2xl md:text-3xl font-bold group-hover:text-[#FFC64C] transition-colors duration-300"
                      style={{ color: isNightMode ? '#FFFFFF' : '#1A1A1A' }}
                    >
                      {study.title}
                    </h3>
                    <p 
                      className="leading-relaxed transition-colors duration-500"
                      style={{ color: isNightMode ? '#A0A0A0' : '#6B6B6B' }}
                    >
                      {study.description}
                    </p>

                    {/* Services Tags */}
                    <div className="flex flex-wrap gap-2 pt-2">
                      {study.services.map((service) => (
                        <span
                          key={service}
                          className="px-3 py-1 rounded-full text-xs font-medium transition-colors duration-500"
                          style={{
                            background: isNightMode
                              ? 'rgba(255, 255, 255, 0.05)'
                              : 'rgba(0, 0, 0, 0.05)',
                            color: isNightMode ? '#A0A0A0' : '#6B6B6B',
                            border: isNightMode
                              ? '1px solid rgba(255, 255, 255, 0.1)'
                              : '1px solid rgba(0, 0, 0, 0.1)',
                          }}
                        >
                          {service}
                        </span>
                      ))}
                    </div>

                    {/* CTA */}
                    <a
                      href={study.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 hover:text-[#FFC64C] transition-colors duration-300 mt-4 group/link"
                      style={{ color: isNightMode ? '#FFFFFF' : '#1A1A1A' }}
                    >
                      View Live Site
                      <ExternalLink className="w-4 h-4 transition-transform duration-300 group-hover/link:translate-x-1" />
                    </a>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
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

export default CaseStudiesClient

