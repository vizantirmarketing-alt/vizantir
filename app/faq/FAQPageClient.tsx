'use client'

import type { Faq } from '@/components/homepage/FAQSection'
import { AccordionIndicator } from '@/components/ui/AccordionIndicator'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import Link from 'next/link'

export interface FAQPageClientProps {
  faqs: Faq[]
}

export default function FAQPageClient({ faqs }: FAQPageClientProps) {
  const [openId, setOpenId] = useState<string | null>(() => faqs[0]?._id ?? null)
  const [searchQuery, setSearchQuery] = useState('')

  const filteredFaqs = faqs.filter(faq => 
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const toggleFAQ = (id: string) => {
    setOpenId(openId === id ? null : id)
  }

  return (
    <main className="min-h-screen" style={{ background: '#FAF9F5', transition: 'background-color 0.5s ease' }}>
      <section className="pt-32 pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-foreground">
              Frequently Asked Questions
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground">
              Get answers to common questions about web design, development, and how we can help you plan, build, and maintain a stronger website.
            </p>
          </motion.div>
          
          {/* Search Bar */}
          <div className="mt-8 max-w-xl mx-auto">
            <div className="relative">
              <svg 
                className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-meta"
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
                className="w-full pl-12 pr-4 py-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold-focus transition-all"
                style={{ 
                  background: '#FFFFFF',
                  border: `1px solid ${'rgba(0,0,0,0.1)'}`,
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full hover:opacity-70 transition-opacity text-meta"
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
                <p className="text-meta">
                  No FAQs found matching &quot;{searchQuery}&quot;
                </p>
                <button
                  onClick={() => setSearchQuery('')}
                  className="mt-4 text-sm font-medium hover:opacity-80 transition-opacity"
                  style={{ color: 'var(--gold-primary)' }}
                >
                  Clear search
                </button>
              </div>
            ) : (
              filteredFaqs.map((faq, index) => {
                return (
                  <motion.div
                    key={faq._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.05 }}
                    className="rounded-xl overflow-hidden"
                    style={{ 
                      background: 'rgba(0,0,0,0.02)',
                      border: `1px solid ${'rgba(0,0,0,0.08)'}`
                    }}
                  >
                    <button
                      onClick={() => toggleFAQ(faq._id)}
                      className="w-full px-6 py-5 flex items-center justify-between text-left transition-colors hover:bg-[#F9FAFB] text-foreground"
                    >
                      <span className="text-lg font-semibold pr-8">{faq.question}</span>
                      <AccordionIndicator
                        isOpen={openId === faq._id}
                        className="w-5 h-5"
                        style={{ color: 'var(--gold-accent)' }}
                      />
                    </button>
                    <AnimatePresence>
                      {openId === faq._id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <div className="px-6 pb-6">
                            <p className="leading-relaxed text-body">
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
              background: 'rgba(0, 112, 243,0.15)',
              border: '1px solid rgba(0, 112, 243,0.3)'
            }}
          >
            <h2 className="text-2xl md:text-3xl font-bold mb-4 text-foreground">
              Still have questions?
            </h2>
            <p className="text-lg mb-6 text-muted-foreground">
              We&apos;re here to help. Book a strategy call to walk through your goals, scope, and fit for your next website build—no pitch deck required.
            </p>
            <Link
              href="/contact"
              className="bg-gold-gradient inline-flex items-center gap-2 px-8 py-4 font-semibold rounded-lg"
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
