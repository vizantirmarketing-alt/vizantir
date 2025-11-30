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
      question: "What is digital marketing and why does my business need it?",
      answer: "Digital marketing is the promotion of your business through online channels including search engines, social media, email, and paid advertising. In today's digital-first world, over 93% of online experiences begin with a search engine. Without a strong digital presence, your business is invisible to potential customers actively searching for your products or services. Digital marketing allows you to reach targeted audiences, measure results in real-time, and achieve higher ROI compared to traditional marketing methods."
    },
    {
      question: "How long does SEO take to show results?",
      answer: "SEO is a long-term strategy that typically takes 3-6 months to show significant results, though some improvements can be seen within 4-8 weeks. The timeline depends on factors like your website's current authority, competition level in your industry, and the quality of your SEO strategy. Unlike paid advertising, SEO builds sustainable organic traffic that continues to grow over time. We focus on both quick wins (technical fixes, local SEO optimization) and long-term strategies (content marketing, link building) to deliver consistent growth."
    },
    {
      question: "What is the difference between SEO and PPC advertising?",
      answer: "SEO (Search Engine Optimization) focuses on earning organic rankings in search results through content optimization, technical improvements, and authority building. Results take longer but provide sustainable, cost-effective traffic. PPC (Pay-Per-Click) advertising delivers immediate visibility by paying for ad placements on search engines and social platforms. While PPC provides instant traffic, costs continue as long as you advertise. The best digital marketing strategies combine both: PPC for immediate leads while SEO builds long-term organic presence."
    },
    {
      question: "What is Answer Engine Optimization (AEO) and why is it important?",
      answer: "Answer Engine Optimization (AEO) is the practice of optimizing your content to appear in AI-powered search results, voice assistants, and featured snippets. With the rise of ChatGPT, Google AI Overviews, and voice search, traditional SEO alone isn't enough. AEO focuses on structuring content to directly answer user questions, making it more likely to be cited by AI systems. Businesses that adopt AEO strategies now will have a significant competitive advantage as AI-driven search becomes the norm."
    },
    {
      question: "How much does digital marketing cost?",
      answer: "Digital marketing costs vary widely based on your goals, industry competition, and chosen services. Small businesses typically invest $1,500-$5,000 per month for comprehensive digital marketing including SEO, content marketing, and social media management. PPC advertising budgets range from $500-$10,000+ monthly depending on your market. At Vizantir, we create custom strategies based on your budget and goals, focusing on the channels that will deliver the highest ROI for your specific business."
    },
    {
      question: "What is local SEO and how can it help my business?",
      answer: "Local SEO optimizes your online presence to attract customers in your geographic area. This includes optimizing your Google Business Profile, building local citations, managing reviews, and targeting location-based keywords. For businesses serving specific areas, local SEO is critical—46% of all Google searches have local intent. Proper local SEO helps you appear in Google Maps, local pack results, and 'near me' searches, driving foot traffic and local leads to your business."
    },
    {
      question: "How do you measure digital marketing success?",
      answer: "We track key performance indicators (KPIs) aligned with your business goals. Common metrics include: organic traffic growth, keyword rankings, conversion rates, cost per acquisition (CPA), return on ad spend (ROAS), lead quality, and revenue attribution. We provide transparent monthly reports with clear data visualizations showing exactly how your investment is performing. Our focus is always on metrics that impact your bottom line—not vanity metrics that look good but don't drive business growth."
    },
    {
      question: "Do I need a new website or can you work with my existing one?",
      answer: "We can work with most existing websites, though sometimes a redesign is recommended for optimal results. During our initial audit, we evaluate your site's technical health, user experience, mobile responsiveness, page speed, and conversion optimization. If your current website has solid foundations, we'll optimize what you have. If significant issues exist that would limit your marketing success, we'll recommend a conversion-focused redesign that serves as a powerful marketing asset rather than just an online brochure."
    },
    {
      question: "What makes Vizantir different from other digital marketing agencies?",
      answer: "Vizantir is a remote-first agency, which means no expensive office overhead—savings we pass directly to our clients. We specialize in emerging technologies like Answer Engine Optimization (AEO) and AI-driven marketing strategies that most agencies haven't adopted yet. Our focus is on measurable results and transparent reporting, not locking you into long-term contracts with hidden fees. We treat your business like our own, providing boutique-level attention with enterprise-grade strategies."
    },
    {
      question: "How involved do I need to be in the marketing process?",
      answer: "Your involvement level is entirely up to you. Some clients prefer weekly strategy calls and hands-on collaboration, while others want us to handle everything and simply receive monthly reports. At minimum, we need initial input about your business goals, target audience, and brand voice. Beyond that, we handle the heavy lifting—strategy, implementation, optimization, and reporting. We keep you informed of progress and major decisions while respecting your time as a business owner."
    },
    {
      question: "Can you guarantee first page rankings on Google?",
      answer: "No reputable agency can guarantee specific rankings—and you should be wary of any that do. Google's algorithms consider over 200 ranking factors that change constantly. What we can guarantee is implementing proven SEO best practices, transparent reporting, and continuous optimization based on data. Our track record shows consistent ranking improvements and traffic growth for clients across various industries. We set realistic expectations and focus on driving qualified traffic that converts into customers."
    },
    {
      question: "What industries do you work with?",
      answer: "We work with businesses across many industries including professional services (law firms, accountants, consultants), healthcare and wellness, home services (contractors, plumbers, electricians), e-commerce, SaaS companies, real estate, and local retail businesses. Our strategies are customized for each industry's unique challenges and audience behaviors. Whether you're a local service provider or a national brand, we develop targeted approaches that resonate with your specific customer base."
    }
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
              Get answers to common questions about digital marketing, SEO, PPC, and how we can help grow your business.
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
              We&apos;re here to help. Schedule a free consultation to discuss your digital marketing needs.
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-8 py-4 font-semibold transition-all duration-300 hover:scale-105"
              style={{ background: '#FFC64C', color: '#1A1A1A', borderRadius: '8px' }}
            >
              Get in Touch
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

