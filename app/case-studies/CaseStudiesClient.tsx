'use client'

import { useState, memo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, ExternalLink } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import { motion } from 'framer-motion'
import { trackCTAClick } from '@/lib/analytics'

interface CaseStudy {
  slug?: string
  detailHref?: string
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
      title: 'Meridian Row',
      category: 'Commercial Leasing',
      description: 'Premium commercial real estate website for a 40-55k SF retail, dining, and service development. Features interactive availability maps, property galleries, and broker inquiry system. Built to attract high-quality tenants and streamline leasing.',
      image: '/meridian-row.png',
      link: 'https://meridianrow.com',
      services: ['Web Design', 'Next.js Development', 'Commercial Real Estate', 'Inquiry System'],
    },
    {
      title: 'Pink Salt Salon',
      category: 'Beauty & Wellness',
      description: 'Luxury nail salon website with dark theme, elegant typography, and seamless booking integration. Built on Next.js for lightning-fast performance and SEO optimization.',
      image: '/ps.png',
      link: 'https://pinksaltsalonandspa.com',
      services: ['Web Design', 'Next.js Development', 'SEO', 'Booking Integration'],
    },
    {
      title: 'Eloraé Nails',
      category: 'Beauty & Wellness',
      description: 'Premium website for independent beauty professionals—nail techs, estheticians, lash artists. Minimal pages, maximum impact. Custom Next.js build with full service menu, gallery, and booking integration. Not a drag-and-drop template.',
      image: '/elorae-nails.png',
      link: 'https://www.eloraenails.com',
      services: ['Web Design', 'Next.js Development', 'Booking Integration'],
    },
    {
      title: 'Essence of Watches',
      category: 'Luxury E-Commerce',
      description: 'Full custom pre-owned luxury watch e-commerce platform built from the ground up — not a template, not Shopify. Features include authenticated inventory with Sanity CMS, Google and Apple OAuth, cart and wishlist with localStorage persistence, per-watch authentication certificates, price transparency with market value indicators, buyer protection infrastructure, image zoom lightbox, multi-language support in 5 languages (EN, JA, DE, KO, ZH), 12 SEO-optimized blog posts, a 167-entry searchable Rolex reference guide, dynamic sitemap, and transactional email via Resend. Built to the standard of specialist single-dealer platforms like WatchBox and Bob\'s Watches — at a fraction of the infrastructure cost.',
      image: '/eow.png',
      link: 'https://www.essenceofwatches.com',
      services: ['E-Commerce', 'Web Design', 'Next.js Development', 'Payment Integration'],
    },
    {
      title: 'Éclat Lounge',
      category: 'Hospitality',
      description: 'Upscale cocktail lounge website designed around reservations, recurring events, and VIP experiences. Built as a custom hospitality system to support programming, high-intent bookings, and mobile-first traffic for Las Vegas nightlife.',
      image: '/eclat-lounge-lv.png',
      link: 'https://eclatloungelv.com',
      services: ['Web Design', 'Hospitality Website', 'Reservation System', 'Events & VIP'],
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
      description: 'Las Vegas event planning website with inquiry system, portfolio gallery, and vendor coordination. Built for high-end weddings, corporate events, and private celebrations.',
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
                {/* Mockup Image */}
                <div className="relative mb-8 transition-transform duration-300 group-hover:scale-[1.02]">
                  {study.detailHref ? (
                    <Link href={study.detailHref} className="block relative aspect-[4/3] w-full group">
                      <Image
                        src={study.image}
                        alt={study.title}
                        fill
                        className="object-contain relative z-10"
                        sizes="(max-width: 768px) 100vw, 50vw"
                        loading={index < 2 ? "eager" : "lazy"}
                        priority={index < 2}
                      />
                    </Link>
                  ) : (
                    <div className="relative aspect-[4/3] w-full group">
                      <Image
                        src={study.image}
                        alt={study.title}
                        fill
                        className="object-contain relative z-10"
                        sizes="(max-width: 768px) 100vw, 50vw"
                        loading={index < 2 ? "eager" : "lazy"}
                        priority={index < 2}
                      />
                    </div>
                  )}
                </div>

                  {/* Project Info */}
                  <div className="space-y-4">
                    <p 
                      className="text-sm tracking-[0.2em] uppercase"
                      style={{ color: '#FFC64C' }}
                    >
                      {study.category}
                    </p>
                    {study.detailHref ? (
                      <Link href={study.detailHref}>
                        <h3 
                          className="text-2xl md:text-3xl font-bold group-hover:text-[#FFC64C] transition-colors duration-300"
                          style={{ color: isNightMode ? '#FFFFFF' : '#1A1A1A' }}
                        >
                          {study.title}
                        </h3>
                      </Link>
                    ) : (
                      <h3 
                        className="text-2xl md:text-3xl font-bold group-hover:text-[#FFC64C] transition-colors duration-300"
                        style={{ color: isNightMode ? '#FFFFFF' : '#1A1A1A' }}
                      >
                        {study.title}
                      </h3>
                    )}
                    <p
                      suppressHydrationWarning
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
                      {...(study.link !== '#' ? { target: '_blank', rel: 'noopener noreferrer' } : { onClick: (e) => e.preventDefault() })}
                      className="inline-flex items-center gap-2 hover:text-[#FFC64C] transition-colors duration-300 mt-4 group/link"
                      style={{ color: isNightMode ? '#FFFFFF' : '#1A1A1A' }}
                    >
                      {study.link === '#' ? 'Coming Soon' : 'View Live Site'}
                      {study.link !== '#' && <ExternalLink className="w-4 h-4 transition-transform duration-300 group-hover/link:translate-x-1" />}
                    </a>
                  </div>
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