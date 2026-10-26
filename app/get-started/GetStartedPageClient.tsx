'use client'

import { MotionCard } from '@/components/ui/MotionCard'
import { Section } from '@/components/ui/Section'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { getStartedDescription, getStartedSteps } from '@/data/get-started'
import { trackBookStrategyCall, trackCTAClick } from '@/lib/analytics'

export default function GetStartedPageClient() {
  const steps = getStartedSteps

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)', transition: 'background-color 0.5s ease' }}>
      
      {/* Hero Section */}
      <Section size="sm" hero className="px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-foreground">
              Ready to start?
            </h1>
            <p className="text-lg md:text-xl max-w-2xl mx-auto text-muted-foreground">
              {getStartedDescription}
            </p>
          </motion.div>
        </div>
      </Section>

      {/* Process Steps */}
      <Section size="sm" edge="bottom" className="px-4">
        <div className="max-w-4xl mx-auto">
          <div className="space-y-[var(--stack)]">
            {steps.map((step, index) => (
              <MotionCard variant="plain" badge={false}
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="h-auto flex-row gap-6 rounded-2xl"
                style={{ 
                  background: '#FFFFFF',
                  border: '1px solid rgba(0,0,0,0.08)',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.04)'
                }}
              >
                <div 
                  className="flex-shrink-0 w-14 h-14 rounded-full flex items-center justify-center font-bold text-lg"
                  style={{ background: 'var(--cobalt-primary)', color: '#FFFFFF' }}
                >
                  {step.number}
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2 text-foreground">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              </MotionCard>
            ))}
          </div>
        </div>
      </Section>

      {/* CTA Section */}
      <Section size="lg" edge="bottom" className="px-4">
        <div className="max-w-4xl mx-auto">
          <MotionCard variant="plain" pad="lg" badge={false}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="block h-auto text-center rounded-2xl"
            style={{ 
              background: 'rgba(0, 112, 243,0.15)',
              border: '1px solid rgba(0, 112, 243,0.3)'
            }}
          >
            <h2 className="text-2xl md:text-3xl font-bold mb-4 text-foreground">
              Next step: a real conversation
            </h2>
            <p className="text-lg mb-8 max-w-xl mx-auto text-muted-foreground">
              Book a discovery call. We&apos;ll see if the project and timeline line up. No pressure, no hard sell.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contact"
                onClick={() => trackBookStrategyCall('get_started')}
                className="bg-cobalt-gradient inline-flex items-center justify-center gap-2 px-8 py-4 font-semibold rounded-lg"
              >
                Book a Strategy Call
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
              <Link
                href="/services"
                onClick={() => trackCTAClick('view_services', 'get_started')}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 font-semibold transition-all duration-300 hover:opacity-80 text-foreground"
                style={{ 
                  background: 'transparent', 
                  borderRadius: '8px',
                  border: '2px solid rgba(0,0,0,0.2)'
                }}
              >
                View Services
              </Link>
            </div>
          </MotionCard>
        </div>
      </Section>
    </div>
  )
}

