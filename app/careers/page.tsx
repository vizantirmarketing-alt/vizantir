'use client'

import { useTheme } from '@/contexts/ThemeContext'
import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function CareersPage() {
  const { isNightMode } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
  }

  return (
    <main className="min-h-screen flex items-center justify-center" style={{ background: (mounted && isNightMode) ? '#000000' : '#FAFAFA', transition: 'background-color 0.5s ease' }}>
      <section className="px-4 py-24 text-center">
        <div className="max-w-2xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.6 }}
            className="space-y-8"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="w-20 h-20 mx-auto rounded-full flex items-center justify-center"
              style={{ background: 'rgba(255, 198, 76, 0.15)' }}
            >
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="#FFC64C" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z" />
              </svg>
            </motion.div>

            <div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4" style={{ color: (mounted && isNightMode) ? '#FFFFFF' : '#1A1A1A' }}>Careers</h1>
              <p className="text-2xl md:text-3xl font-medium" style={{ color: '#FFC64C' }}>Coming Soon</p>
            </div>

            <p className="text-lg md:text-xl leading-relaxed max-w-lg mx-auto" style={{ color: (mounted && isNightMode) ? 'rgba(255,255,255,0.7)' : '#6B6B6B' }}>
              We&apos;ll reach out when we&apos;re ready to grow the team.
            </p>

            <div className="pt-2 max-w-md mx-auto w-full">
              {submitted ? (
                <p
                  className="text-base md:text-lg font-medium"
                  style={{ color: (mounted && isNightMode) ? '#FFC64C' : '#B45309' }}
                  role="status"
                >
                  You&apos;re on the list. We&apos;ll be in touch.
                </p>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 sm:gap-3 items-stretch sm:items-center justify-center">
                  <label htmlFor="careers-notify-email" className="sr-only">
                    Email address
                  </label>
                  <input
                    id="careers-notify-email"
                    type="email"
                    name="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full flex-1 px-4 py-3 rounded-lg text-base outline-none transition-colors focus:ring-2 focus:ring-offset-0"
                    style={{
                      background: (mounted && isNightMode) ? 'rgba(255,255,255,0.06)' : '#FFFFFF',
                      border: `1px solid ${(mounted && isNightMode) ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'}`,
                      color: (mounted && isNightMode) ? '#F8F8F8' : '#1A1A1A',
                      boxShadow: (mounted && isNightMode) ? 'none' : '0 1px 2px rgba(0,0,0,0.04)',
                    }}
                  />
                  <button
                    type="submit"
                    className="w-full sm:w-auto shrink-0 px-8 py-3 font-semibold transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                    style={{ background: '#FFC64C', color: '#1A1A1A', borderRadius: '8px' }}
                  >
                    Notify Me
                  </button>
                </form>
              )}
            </div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.4 }}>
              <Link href="/" className="inline-flex items-center gap-2 text-sm transition-colors hover:opacity-80" style={{ color: (mounted && isNightMode) ? 'rgba(255,255,255,0.5)' : '#888888' }}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Home
              </Link>
            </motion.div>

          </motion.div>
        </div>
      </section>
    </main>
  )
}

