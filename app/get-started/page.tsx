'use client'

import { useTheme } from '@/contexts/ThemeContext'
import { motion } from 'framer-motion'
import { useState } from 'react'
import Link from 'next/link'

export default function GetStartedPage() {
  const { isNightMode } = useTheme()

  const steps = [
    {
      number: "01",
      title: "Discovery Call",
      description: "We start with a free 30-minute consultation to understand your business, goals, and challenges. No commitment required."
    },
    {
      number: "02",
      title: "Custom Strategy",
      description: "Our team develops a tailored digital marketing strategy based on your industry, competition, and budget."
    },
    {
      number: "03",
      title: "Proposal & Agreement",
      description: "We present a clear proposal with pricing, timeline, and expected outcomes. No hidden fees, no long-term lock-ins."
    },
    {
      number: "04",
      title: "Kickoff & Onboarding",
      description: "Once approved, we begin onboarding within 48 hours. You'll have a dedicated account manager and clear communication channels."
    },
    {
      number: "05",
      title: "Execution & Reporting",
      description: "We implement the strategy while providing transparent monthly reports so you always know exactly how your investment is performing."
    }
  ]

  return (
    <main className="min-h-screen" style={{ background: isNightMode ? '#000000' : '#FAFAFA', transition: 'background-color 0.5s ease' }}>
      
      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6" style={{ color: isNightMode ? '#FFFFFF' : '#1A1A1A' }}>
              Ready to Get Started?
            </h1>
            <p className="text-lg md:text-xl max-w-2xl mx-auto" style={{ color: isNightMode ? 'rgba(255,255,255,0.7)' : '#6B6B6B' }}>
              Here's how we work with clients to deliver measurable results. Our process is simple, transparent, and designed around your success.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Process Steps */}
      <section className="px-4 pb-16">
        <div className="max-w-4xl mx-auto">
          <div className="space-y-8">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="flex gap-6 p-6 rounded-xl"
                style={{ 
                  background: isNightMode ? 'rgba(255,255,255,0.03)' : '#FFFFFF',
                  border: `1px solid ${isNightMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
                  boxShadow: isNightMode ? 'none' : '0 2px 12px rgba(0,0,0,0.04)'
                }}
              >
                <div 
                  className="flex-shrink-0 w-14 h-14 rounded-full flex items-center justify-center font-bold text-lg"
                  style={{ background: '#FFC64C', color: '#1A1A1A' }}
                >
                  {step.number}
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2" style={{ color: isNightMode ? '#FFFFFF' : '#1A1A1A' }}>
                    {step.title}
                  </h3>
                  <p style={{ color: isNightMode ? 'rgba(255,255,255,0.7)' : '#6B6B6B' }}>
                    {step.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 pb-24">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="text-center p-8 md:p-12 rounded-2xl"
            style={{ 
              background: isNightMode ? 'rgba(255,198,76,0.1)' : 'rgba(255,198,76,0.15)',
              border: '1px solid rgba(255,198,76,0.3)'
            }}
          >
            <h2 className="text-2xl md:text-3xl font-bold mb-4" style={{ color: isNightMode ? '#FFFFFF' : '#1A1A1A' }}>
              Let's Start Your Growth Journey
            </h2>
            <p className="text-lg mb-8 max-w-xl mx-auto" style={{ color: isNightMode ? 'rgba(255,255,255,0.7)' : '#6B6B6B' }}>
              Book your free discovery call today. No pressure, no obligation—just a conversation about your business goals.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 font-semibold transition-all duration-300 hover:scale-105"
                style={{ background: '#FFC64C', color: '#1A1A1A', borderRadius: '8px' }}
              >
                Schedule a Call
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
              <Link
                href="/services"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 font-semibold transition-all duration-300 hover:opacity-80"
                style={{ 
                  background: 'transparent', 
                  color: isNightMode ? '#FFFFFF' : '#1A1A1A', 
                  borderRadius: '8px',
                  border: `2px solid ${isNightMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'}`
                }}
              >
                View Services
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </main>
  )
}

