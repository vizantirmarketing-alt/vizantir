'use client'

import { useTheme } from '@/contexts/ThemeContext'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import Link from 'next/link'

export default function FAQPage() {
  const { isNightMode } = useTheme()
  const [openIndex, setOpenIndex] = useState<number | null>(0)
  const [searchQuery, setSearchQuery] = useState('')

  const faqs = [
    {
      question: 'How much does a website project cost?',
      answer:
        'Our projects start at $15,000 for focused builds and scale to $30,000–$60,000+ for larger custom engagements. Every project is scoped and priced clearly upfront — no vague starting-at numbers, no surprise invoices.',
    },
    {
      question: 'How long does a website project take?',
      answer:
        'Most projects are completed within 4–6 weeks from kickoff. Larger or more complex builds may run 8–10 weeks. Timelines are set at scoping and held — we move as fast as your feedback allows.',
    },
    {
      question: 'Do you build in Next.js or WordPress?',
      answer:
        "Both, depending on what fits the project. Next.js for performance-critical, custom builds. WordPress when the client needs a widely supported CMS and a familiar editing environment. We'll recommend the right platform based on your goals, team, and content needs — not our preference.",
    },
    {
      question: 'Do you redesign existing websites?',
      answer:
        "Yes. We audit what you have, identify what's working, and rebuild from there. You don't need to start from scratch. If a full rebuild makes more sense, we'll tell you honestly and explain why.",
    },
    {
      question: 'What happens after the site launches?',
      answer:
        'We offer monthly Website Care retainers starting at $500/month for updates, monitoring, content changes, and ongoing improvements. Most clients stay on retainer after launch so the site keeps performing as the business evolves.',
    },
    {
      question: 'Do you write copy for the website?',
      answer:
        'We can guide the copy structure and messaging strategy as part of the project scope. For full copywriting, we work with trusted partners we can bring in — or we work with your existing content and sharpen it for the web.',
    },
  ]

  const filteredFaqs = faqs.filter(faq => 
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <main className="min-h-screen" style={{ background: isNightMode ? '#000000' : '#FAFAFA', transition: 'background-color 0.5s ease' }}>
      <section className="pt-32 pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6" style={{ color: isNightMode ? '#FFFFFF' : '#1A1A1A' }}>
              Frequently Asked Questions
            </h1>
            <p className="text-lg md:text-xl" style={{ color: isNightMode ? 'rgba(255,255,255,0.7)' : '#6B6B6B' }}>
              Get answers to common questions about web design, development, and how we can help you plan, build, and maintain a stronger website.
            </p>
          </motion.div>
          
          {/* Search Bar */}
          <div className="mt-8 max-w-xl mx-auto">
            <div className="relative">
              <svg 
                className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" 
                style={{ color: isNightMode ? 'rgba(255,255,255,0.4)' : '#888888' }}
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor" 
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search FAQs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all"
                style={{ 
                  background: isNightMode ? 'rgba(255,255,255,0.05)' : '#FFFFFF',
                  border: `1px solid ${isNightMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                  color: isNightMode ? '#FFFFFF' : '#1A1A1A'
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full hover:opacity-70 transition-opacity"
                  style={{ color: isNightMode ? 'rgba(255,255,255,0.4)' : '#888888' }}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 pb-24">
        <div className="max-w-4xl mx-auto">
          <div className="space-y-4">
            {filteredFaqs.length === 0 ? (
              <div className="text-center py-12">
                <p style={{ color: isNightMode ? 'rgba(255,255,255,0.5)' : '#888888' }}>
                  No FAQs found matching &quot;{searchQuery}&quot;
                </p>
                <button
                  onClick={() => setSearchQuery('')}
                  className="mt-4 text-sm font-medium hover:opacity-80 transition-opacity"
                  style={{ color: '#FFC64C' }}
                >
                  Clear search
                </button>
              </div>
            ) : (
              filteredFaqs.map((faq, index) => {
                // Find the original index in the full faqs array
                const originalIndex = faqs.findIndex(f => f.question === faq.question)
                return (
                  <motion.div
                    key={originalIndex}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.05 }}
                    className="rounded-xl overflow-hidden"
                    style={{ 
                      background: isNightMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                      border: `1px solid ${isNightMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`
                    }}
                  >
                    <button
                      onClick={() => toggleFAQ(originalIndex)}
                      className="w-full px-6 py-5 flex items-center justify-between text-left transition-colors"
                      style={{ color: isNightMode ? '#FFFFFF' : '#1A1A1A' }}
                    >
                      <span className="text-lg font-semibold pr-8">{faq.question}</span>
                      <motion.span
                        animate={{ rotate: openIndex === originalIndex ? 45 : 0 }}
                        transition={{ duration: 0.2 }}
                        className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
                        style={{ background: '#FFC64C', color: '#1A1A1A' }}
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                      </motion.span>
                    </button>
                    <AnimatePresence>
                      {openIndex === originalIndex && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <div className="px-6 pb-6">
                            <p className="leading-relaxed" style={{ color: isNightMode ? 'rgba(255,255,255,0.7)' : '#4A4A4A' }}>
                              {faq.answer}
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )
              })
            )}
          </div>

          {/* CTA Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mt-16 text-center p-8 md:p-12 rounded-2xl"
            style={{ 
              background: isNightMode ? 'rgba(255,198,76,0.1)' : 'rgba(255,198,76,0.15)',
              border: '1px solid rgba(255,198,76,0.3)'
            }}
          >
            <h2 className="text-2xl md:text-3xl font-bold mb-4" style={{ color: isNightMode ? '#FFFFFF' : '#1A1A1A' }}>
              Still have questions?
            </h2>
            <p className="text-lg mb-6" style={{ color: isNightMode ? 'rgba(255,255,255,0.7)' : '#6B6B6B' }}>
              We&apos;re here to help. Book a strategy call to walk through your goals, scope, and fit for your next website build—no pitch deck required.
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-8 py-4 font-semibold transition-all duration-300 hover:scale-105"
              style={{ background: '#FFC64C', color: '#1A1A1A', borderRadius: '8px' }}
            >
              Book a Strategy Call
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </motion.div>
        </div>
      </section>
    </main>
  )
}

