'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { trackCTAClick } from '@/lib/analytics'

export default function GetStartedPageClient() {
  const steps = [
    {
      number: "01",
      title: "Discovery Call",
      description:
        "A free call to align on goals, timeline, and what you're trying to ship. No pitch deck. No commitment.",
    },
    {
      number: "02",
      title: "Custom Proposal",
      description:
        "You get a written scope: what's in, what's out, a fixed price, and a clear timeline. No vague \"starting at\" numbers.",
    },
    {
      number: "03",
      title: "Deposit",
      description:
        "50% down secures your spot and kicks off work. You talk to the person building the site — not layers of account staff.",
    },
    {
      number: "04",
      title: "Build",
      description:
        "Design and development with check-ins at milestones. Straight updates so you're never left wondering where things stand.",
    },
    {
      number: "05",
      title: "Launch",
      description:
        "Final review, remaining balance, then we go live. You get a finished product — not a half-built site and a wish list for \"phase two.\"",
    },
  ]

  return (
    <main className="min-h-screen" style={{ background: '#FAF9F5', transition: 'background-color 0.5s ease' }}>
      
      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-foreground">
              Ready to start?
            </h1>
            <p className="text-lg md:text-xl max-w-2xl mx-auto text-muted-foreground">
              Fixed scope, fixed price, direct access to the builder. From first call to launch — here's how every project runs.
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
                className="flex gap-6 p-6 rounded-2xl"
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
              background: 'rgba(0, 112, 243,0.15)',
              border: '1px solid rgba(0, 112, 243,0.3)'
            }}
          >
            <h2 className="text-2xl md:text-3xl font-bold mb-4 text-foreground">
              Next step: a real conversation
            </h2>
            <p className="text-lg mb-8 max-w-xl mx-auto text-muted-foreground">
              Book a discovery call. We'll see if the project and timeline line up — no pressure, no hard sell.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contact"
                onClick={() => trackCTAClick('schedule_a_call', 'get_started')}
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
          </motion.div>
        </div>
      </section>
    </main>
  )
}

